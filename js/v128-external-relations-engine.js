import * as legacy from './v127-merchant-guild-wealth-engine.js?base=0.11.18';

export * from './v127-merchant-guild-wealth-engine.js?base=0.11.18';
export const V128_VERSION = '0.11.19-sim';

export const EXTERNAL_NATIONS = Object.freeze(['elves', 'gnomes', 'orcs']);
export const RELATION_MIN = -3;
export const RELATION_MAX = 3;
export const MAINLAND_START = 2;
export const IMPERIAL_APPEASEMENT_INFLUENCE_COST = 4;

function n(value) { return Number(value) || 0; }
function clamp(value, lo = RELATION_MIN, hi = RELATION_MAX) {
  return Math.max(lo, Math.min(hi, Math.trunc(n(value))));
}
function ageRank(age) {
  if (age === 'elder') return 3;
  if (age === 'mature') return 2;
  return 1;
}

function makeThresholdFlags() {
  return Object.fromEntries(EXTERNAL_NATIONS.map(id => [id, { plus2: false, plus3: false }]));
}
function makeAllianceState() {
  return Object.fromEntries(EXTERNAL_NATIONS.map(id => [id, { completed: false, completedGeneration: null }]));
}

export function ensureExternalRelationsState(state) {
  state.externalRelations ??= {};
  const rel = state.externalRelations;
  rel.version = V128_VERSION;
  rel.active = Boolean(rel.active);
  rel.activatedGeneration ??= null;
  rel.levels ??= { elves: 0, gnomes: 0, orcs: 0, mainland: MAINLAND_START };
  for (const id of [...EXTERNAL_NATIONS, 'mainland']) rel.levels[id] = clamp(rel.levels[id] ?? (id === 'mainland' ? MAINLAND_START : 0));
  rel.mainlandThresholdsTriggered ??= makeThresholdFlags();
  for (const id of EXTERNAL_NATIONS) rel.mainlandThresholdsTriggered[id] ??= { plus2: false, plus3: false };
  rel.alliances ??= makeAllianceState();
  for (const id of EXTERNAL_NATIONS) rel.alliances[id] ??= { completed: false, completedGeneration: null };
  rel.questEligible ??= { elves: false, gnomes: false, orcs: false };
  rel.imperialAppeasementGeneration ??= null;
  rel.imperialAppeasementPlayerId ??= null;
  rel.orcFoodPurchases ??= [];
  rel.transient ??= {};
  return rel;
}

export function countActiveForests(state) {
  const unrevealedForests = (state.terrainPool ?? []).filter(terrain => terrain === 'forest').length;
  const revealedForests = (state.lands ?? []).filter(land =>
    !land?.syntheticDiplomacy
    && land.revealed
    && land.development === 'natural'
    && land.terrain === 'forest'
  ).length;
  return unrevealedForests + revealedForests;
}

function elfRelationFromForests(state) {
  const rel = ensureExternalRelationsState(state);
  const forests = countActiveForests(state);
  if (forests >= 9 && rel.alliances.elves.completed) return 3;
  if (forests >= 6) return 2;
  if (forests >= 4) return 1;
  if (forests === 3) return 0;
  if (forests === 2) return -1;
  if (forests === 1) return -2;
  return -3;
}

function updateQuestEligibility(state) {
  const rel = ensureExternalRelationsState(state);
  const force = Math.max(0, Math.trunc(n(state.city?.force)));
  const fortificationLevel = Math.max(0, Math.trunc(n(state.city?.fortificationLevel)));
  const axis = Math.max(-2, Math.min(2, Math.trunc(n(state.city?.militaryMercantile))));
  rel.questEligible.elves = !rel.alliances.elves.completed
    && rel.levels.elves >= 2
    && countActiveForests(state) >= 9;
  rel.questEligible.gnomes = !rel.alliances.gnomes.completed
    && rel.levels.gnomes >= 2
    && axis === 2;
  rel.questEligible.orcs = !rel.alliances.orcs.completed
    && rel.levels.orcs >= 2
    && force >= 9
    && fortificationLevel >= 3;
  return { ...rel.questEligible };
}

export function activateExternalRelations(state) {
  const rel = ensureExternalRelationsState(state);
  if (rel.active) return rel;
  rel.active = true;
  rel.activatedGeneration = Math.max(1, Math.trunc(n(state.generation) || 1));
  rel.levels.elves = elfRelationFromForests(state);
  rel.levels.gnomes = 0;
  rel.levels.orcs = 0;
  rel.levels.mainland = MAINLAND_START;
  updateQuestEligibility(state);
  return rel;
}

function applyMainlandCrossingPenalties(state, beforeLevels, changes) {
  const rel = ensureExternalRelationsState(state);
  for (const nation of EXTERNAL_NATIONS) {
    const before = clamp(beforeLevels[nation]);
    const after = clamp(rel.levels[nation]);
    const flags = rel.mainlandThresholdsTriggered[nation];
    if (!flags.plus2 && before < 2 && after >= 2) {
      flags.plus2 = true;
      const mainlandBefore = rel.levels.mainland;
      rel.levels.mainland = clamp(rel.levels.mainland - 1);
      changes.push({ nation: 'mainland', from: mainlandBefore, to: rel.levels.mainland, reason: `${nation}_first_reached_plus2`, amount: -1 });
    }
    if (!flags.plus3 && before < 3 && after >= 3) {
      flags.plus3 = true;
      const mainlandBefore = rel.levels.mainland;
      rel.levels.mainland = clamp(rel.levels.mainland - 2);
      changes.push({ nation: 'mainland', from: mainlandBefore, to: rel.levels.mainland, reason: `${nation}_first_reached_plus3_strategic_alliance`, amount: -2 });
    }
  }
}

function updateGnomeRelation(state) {
  const rel = ensureExternalRelationsState(state);
  const before = rel.levels.gnomes;
  const axis = Math.max(-2, Math.min(2, Math.trunc(n(state.city?.militaryMercantile))));
  let after = before;
  if (axis === -2) after = Math.max(-3, before - 1);
  else if (axis === -1) after = before > -1 ? before - 1 : before;
  else if (axis === 1 || axis === 2) {
    if (before < 3) after = Math.min(2, before + 1);
  }
  rel.levels.gnomes = clamp(after);
  return { before, after: rel.levels.gnomes, axis };
}

function updateOrcRelation(state) {
  const rel = ensureExternalRelationsState(state);
  const before = rel.levels.orcs;
  const force = Math.max(0, Math.trunc(n(state.city?.force)));
  let after = before;
  if (force <= 2) after = Math.max(-3, before - 1);
  else if (force >= 6) {
    const cap = rel.alliances.orcs.completed && force >= 9 ? 3 : 2;
    if (before < cap) after = Math.min(cap, before + 1);
  }
  rel.levels.orcs = clamp(after);
  return { before, after: rel.levels.orcs, force };
}

function updateElvenRelation(state) {
  const rel = ensureExternalRelationsState(state);
  const before = rel.levels.elves;
  rel.levels.elves = clamp(elfRelationFromForests(state));
  return { before, after: rel.levels.elves, forests: countActiveForests(state) };
}

function raidLevelForOrcs(relation) {
  if (relation <= -3) return 4;
  if (relation === -2) return 2;
  if (relation === -1) return 1;
  return 0;
}

function productiveForestLands(state) {
  return (state.lands ?? []).filter(land =>
    !land?.syntheticDiplomacy
    && land.revealed
    && land.development === 'natural'
    && land.terrain === 'forest'
    && land.ownerId
    && land.ownerId !== 'city'
  );
}

function makeSyntheticLand(state, suffix, development, resourceType, capacity) {
  return {
    id: `diplomacy_${suffix}_g${state.generation}`,
    name: `Diplomacy ${suffix}`,
    revealed: true,
    originalTerrain: null,
    terrain: development === 'farm' ? 'farm' : 'diplomacy',
    development,
    resourceType,
    baseCapacity: Math.max(0, Math.trunc(n(capacity))),
    ownerId: 'external_diplomacy',
    explorationOrder: 999999,
    acquisitionOrder: 999999,
    usedCapacityThisGeneration: 0,
    subsistenceUsedThisGeneration: 0,
    refinedUsedThisGeneration: 0,
    syntheticDiplomacy: true,
  };
}

function applyLandDiplomacyModifiers(state) {
  const rel = ensureExternalRelationsState(state);
  const snapshots = [];
  const synthetic = [];
  const force = Math.max(0, Math.trunc(n(state.city?.force)));

  for (const land of state.lands ?? []) {
    if (land?.syntheticDiplomacy) continue;
    let delta = 0;
    if (land.revealed && land.development === 'natural' && land.terrain === 'forest') {
      if (rel.levels.elves >= 1) delta -= 1;
      else if (rel.levels.elves <= -2) {
        if (force <= 3) delta -= 2;
        else if (force <= 6) delta -= 1;
      }
    }
    if (rel.levels.gnomes >= 2 && land.gnomeImproved) delta += 1;
    if (delta !== 0) {
      snapshots.push({ land, baseCapacity: land.baseCapacity });
      land.baseCapacity = Math.max(0, Math.trunc(n(land.baseCapacity) + delta));
    }
  }

  if (rel.levels.elves >= 1) {
    const forests = productiveForestLands(state);
    for (const forest of forests) {
      synthetic.push(makeSyntheticLand(state, `elf_food_${forest.id}`, 'farm', 'grain', 1));
      if (rel.levels.elves >= 2) synthetic.push(makeSyntheticLand(state, `elf_textile_${forest.id}`, 'natural', 'wool', 1));
    }
  }

  const purchasedOrcFood = (rel.orcFoodPurchases ?? []).reduce((sum, row) => sum + Math.max(0, Math.trunc(n(row.amount))), 0);
  if (purchasedOrcFood > 0) synthetic.push(makeSyntheticLand(state, 'orc_food_trade', 'farm', 'grain', purchasedOrcFood));

  state.lands.push(...synthetic);
  return { snapshots, syntheticIds: synthetic.map(land => land.id), purchasedOrcFood };
}

function addGnomeAllianceFoodFromExcess(state, prep) {
  const rel = ensureExternalRelationsState(state);
  if (rel.levels.gnomes < 3) return 0;
  rel.transient.orcRaidSectorLosses = {};
  const preview = legacy.previewEconomy(state);
  const excess = (preview.reports ?? [])
    .filter(report => report.sectorId !== 'food')
    .reduce((sum, report) => sum + Math.max(0, Math.trunc(n(report.totalResourceCapacity) - n(report.actualProduction))), 0);
  if (excess <= 0) return 0;
  const land = makeSyntheticLand(state, 'gnome_excess_as_food', 'farm', 'grain', excess);
  state.lands.push(land);
  prep.syntheticIds.push(land.id);
  return excess;
}

function allocateOrcRaidSectorLosses(state) {
  const rel = ensureExternalRelationsState(state);
  const totalLoss = raidLevelForOrcs(rel.levels.orcs);
  const losses = {};
  if (totalLoss <= 0) {
    rel.transient.orcRaidSectorLosses = losses;
    return { totalLoss: 0, sectorLosses: losses };
  }

  rel.transient.orcRaidSectorLosses = {};
  const preview = legacy.previewEconomy(state);
  const remaining = Object.fromEntries((preview.reports ?? []).map(report => [report.sectorId, Math.max(0, Math.trunc(n(report.actualProduction)))]));
  let toAllocate = totalLoss;
  while (toAllocate > 0) {
    const candidates = Object.entries(remaining).filter(([, amount]) => amount > 0);
    if (!candidates.length) break;
    candidates.sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
    const sectorId = candidates[0][0];
    remaining[sectorId] -= 1;
    losses[sectorId] = (losses[sectorId] ?? 0) + 1;
    toAllocate -= 1;
  }
  rel.transient.orcRaidSectorLosses = losses;
  return { totalLoss: totalLoss - toAllocate, requestedLoss: totalLoss, sectorLosses: { ...losses } };
}

function applyGnomeStakeMaintenance(state) {
  const rel = ensureExternalRelationsState(state);
  const level = rel.levels.gnomes;
  if (level > -2) return [];
  const rows = [];
  for (const player of state.players ?? []) {
    const stakes = (player.productionStakes ?? [])
      .filter(stake => level <= -3 || stake.age === 'elder')
      .sort((a, b) => ageRank(b.age) - ageRank(a.age) || n(a.placementOrder) - n(b.placementOrder));
    const row = { playerId: player.id, relation: level, influenceBefore: n(player.influence), paid: [], inactive: [] };
    for (const stake of stakes) {
      if (n(player.influence) >= 1) {
        player.influence -= 1;
        stake.diplomacyMaintenancePaid = true;
        row.paid.push(stake.id);
      } else {
        stake.diplomacyInactiveThisGeneration = true;
        row.inactive.push(stake.id);
      }
    }
    row.influenceAfter = n(player.influence);
    row.influenceSpent = row.influenceBefore - row.influenceAfter;
    rows.push(row);
  }
  return rows;
}

function clearTransientStakeFlags(state) {
  for (const player of state.players ?? []) {
    for (const stake of player.productionStakes ?? []) {
      delete stake.diplomacyMaintenancePaid;
      delete stake.diplomacyInactiveThisGeneration;
    }
  }
}

function restorePreparedState(state, prep) {
  for (const snapshot of prep.land.snapshots) snapshot.land.baseCapacity = snapshot.baseCapacity;
  const syntheticIds = new Set(prep.land.syntheticIds);
  state.lands = (state.lands ?? []).filter(land => !syntheticIds.has(land.id));
  clearTransientStakeFlags(state);
  const rel = ensureExternalRelationsState(state);
  rel.orcFoodPurchases = [];
  rel.transient.orcRaidSectorLosses = {};
}

function convertFarmToForestFromElvenWar(state) {
  const rel = ensureExternalRelationsState(state);
  if (!rel.active || rel.levels.elves > -3) return null;
  const farm = (state.lands ?? [])
    .filter(land => !land?.syntheticDiplomacy && land.revealed && land.development === 'farm')
    .sort((a, b) => n(a.explorationOrder ?? 999999) - n(b.explorationOrder ?? 999999))[0];
  if (!farm) return null;
  const previous = { terrain: farm.terrain, development: farm.development, resourceType: farm.resourceType, baseCapacity: farm.baseCapacity };
  farm.terrain = 'forest';
  farm.development = 'natural';
  farm.resourceType = 'wood';
  farm.baseCapacity = Math.max(1, Math.trunc(n(legacy.V084_CONFIG?.hinterland?.tileCapacity) || 2));
  farm.name = `Forest · Territory ${String(farm.id).split('_').at(-1)}`;
  return { landId: farm.id, ownerId: farm.ownerId, previous, after: { terrain: 'forest', development: 'natural', resourceType: 'wood', baseCapacity: farm.baseCapacity } };
}

function updateRelationsAfterGeneration(state) {
  const rel = ensureExternalRelationsState(state);
  const beforeLevels = { ...rel.levels };
  const changes = [];
  const elf = updateElvenRelation(state);
  const gnome = updateGnomeRelation(state);
  const orc = updateOrcRelation(state);
  for (const [nation, row] of Object.entries({ elves: elf, gnomes: gnome, orcs: orc })) {
    if (row.before !== row.after) changes.push({ nation, from: row.before, to: row.after, reason: nation === 'elves' ? 'forest_count' : nation === 'gnomes' ? 'military_mercantile_inclination' : 'city_force' });
  }
  applyMainlandCrossingPenalties(state, beforeLevels, changes);
  updateQuestEligibility(state);
  return { beforeLevels, afterLevels: { ...rel.levels }, changes, elf, gnome, orc, questEligible: { ...rel.questEligible } };
}

export function completeStrategicAlliance(state, nation) {
  const rel = ensureExternalRelationsState(state);
  if (!rel.active || !EXTERNAL_NATIONS.includes(nation)) return { ok: false, reason: 'relations_not_active_or_invalid_nation' };
  updateQuestEligibility(state);
  if (!rel.questEligible[nation]) return { ok: false, reason: 'quest_requirements_not_met' };
  const beforeLevels = { ...rel.levels };
  rel.alliances[nation].completed = true;
  rel.alliances[nation].completedGeneration = Math.max(1, Math.trunc(n(state.generation) || 1));
  rel.levels[nation] = 3;
  rel.questEligible[nation] = false;
  const changes = [{ nation, from: beforeLevels[nation], to: 3, reason: 'strategic_alliance_quest_completed' }];
  applyMainlandCrossingPenalties(state, beforeLevels, changes);
  updateQuestEligibility(state);
  return { ok: true, nation, changes, levels: { ...rel.levels } };
}

export function imperialAppeasement(state, playerId) {
  const rel = ensureExternalRelationsState(state);
  const generation = Math.max(1, Math.trunc(n(state.generation) || 1));
  if (!rel.active) return { ok: false, reason: 'relations_not_active' };
  if (rel.imperialAppeasementGeneration === generation) return { ok: false, reason: 'already_used_this_generation' };
  if (rel.levels.mainland >= RELATION_MAX) return { ok: false, reason: 'mainland_already_at_maximum' };
  const player = (state.players ?? []).find(row => row.id === playerId);
  if (!player) return { ok: false, reason: 'unknown_player' };
  if (n(player.influence) < IMPERIAL_APPEASEMENT_INFLUENCE_COST) return { ok: false, reason: 'insufficient_influence' };
  const before = rel.levels.mainland;
  player.influence -= IMPERIAL_APPEASEMENT_INFLUENCE_COST;
  rel.levels.mainland = clamp(before + 1);
  rel.imperialAppeasementGeneration = generation;
  rel.imperialAppeasementPlayerId = playerId;
  return { ok: true, playerId, influenceCost: IMPERIAL_APPEASEMENT_INFLUENCE_COST, mainlandBefore: before, mainlandAfter: rel.levels.mainland };
}

export function reforestLand(state, playerId, landId) {
  const rel = ensureExternalRelationsState(state);
  if (!rel.active) return { ok: false, reason: 'relations_not_active' };
  const land = (state.lands ?? []).find(row => row.id === landId);
  if (!land || land.ownerId !== playerId || land.development !== 'farm') return { ok: false, reason: 'controlled_farm_required' };
  land.terrain = 'forest';
  land.development = 'natural';
  land.resourceType = 'wood';
  land.baseCapacity = Math.max(1, Math.trunc(n(legacy.V084_CONFIG?.hinterland?.tileCapacity) || 2));
  land.name = `Forest · Territory ${String(land.id).split('_').at(-1)}`;
  rel.levels.elves = elfRelationFromForests(state);
  updateQuestEligibility(state);
  return { ok: true, playerId, landId, elvesAfter: rel.levels.elves };
}

export function improveLandForGnomes(state, playerId, landId) {
  const rel = ensureExternalRelationsState(state);
  if (!rel.active || rel.levels.gnomes < 1) return { ok: false, reason: 'gnome_relation_plus1_required' };
  const land = (state.lands ?? []).find(row => row.id === landId);
  if (!land || land.ownerId !== playerId || !land.revealed || land.development === 'urban') return { ok: false, reason: 'controlled_nonurban_land_required' };
  if (land.gnomeImproved) return { ok: false, reason: 'already_improved' };
  land.gnomeImproved = true;
  return { ok: true, playerId, landId, note: 'Action/cost remains a simulation hook until the tabletop Improve Land cost is fixed.' };
}

export function buyOrcRawFood(state, playerId, amount = 1) {
  const rel = ensureExternalRelationsState(state);
  const units = Math.max(1, Math.trunc(n(amount) || 1));
  if (!rel.active || rel.levels.orcs < 2) return { ok: false, reason: 'orc_relation_plus2_required' };
  const player = (state.players ?? []).find(row => row.id === playerId);
  if (!player) return { ok: false, reason: 'unknown_player' };
  if (n(player.influence) < units) return { ok: false, reason: 'insufficient_influence' };
  player.influence -= units;
  player.prestige = n(player.prestige) + units;
  rel.orcFoodPurchases.push({ playerId, amount: units, generation: state.generation });
  return { ok: true, playerId, amount: units, influenceCost: units, prestige: units };
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = legacy.createV084Game(familyNames);
  ensureExternalRelationsState(state);
  return state;
}

export function prepareV111State(state, options = {}) {
  const prepared = typeof legacy.prepareV111State === 'function' ? legacy.prepareV111State(state, options) : state;
  ensureExternalRelationsState(state);
  return prepared;
}

export function resolveAutomatedGeneration(state) {
  const rel = ensureExternalRelationsState(state);
  if (!rel.active) {
    const summary = legacy.resolveAutomatedGeneration(state);
    summary.externalRelations = { version: V128_VERSION, active: false, levels: { ...rel.levels } };
    return summary;
  }

  const levelsAtStart = { ...rel.levels };
  const maintenance = applyGnomeStakeMaintenance(state);
  const land = applyLandDiplomacyModifiers(state);
  const prep = { maintenance, land, gnomeExcessRawFood: 0, orcRaid: null };
  prep.gnomeExcessRawFood = addGnomeAllianceFoodFromExcess(state, prep.land);
  prep.orcRaid = allocateOrcRaidSectorLosses(state);

  let summary;
  try {
    summary = legacy.resolveAutomatedGeneration(state);
  } finally {
    restorePreparedState(state, prep);
  }

  const elvenWarConversion = levelsAtStart.elves <= -3 ? convertFarmToForestFromElvenWar(state) : null;
  const relationResolution = updateRelationsAfterGeneration(state);
  summary.externalRelations = {
    version: V128_VERSION,
    active: true,
    activatedGeneration: rel.activatedGeneration,
    levelsAtStart,
    levelsAfter: { ...rel.levels },
    relationChanges: relationResolution.changes,
    questEligible: { ...rel.questEligible },
    strategicAlliances: Object.fromEntries(EXTERNAL_NATIONS.map(id => [id, { ...rel.alliances[id] }])),
    mainlandThresholdsTriggered: Object.fromEntries(EXTERNAL_NATIONS.map(id => [id, { ...rel.mainlandThresholdsTriggered[id] }])),
    forestCountAfter: countActiveForests(state),
    gnomeStakeMaintenance: maintenance,
    gnomeExcessRawFoodFromAlliance: prep.gnomeExcessRawFood,
    orcRaid: prep.orcRaid,
    elvenWarConversion,
    reforestationActionUnlocked: true,
    gnomeImproveLandActionUnlocked: rel.levels.gnomes >= 1,
    orcFoodTradingUnlocked: rel.levels.orcs >= 2,
    imperialAppeasement: {
      influenceCost: IMPERIAL_APPEASEMENT_INFLUENCE_COST,
      oncePerGenerationGlobal: true,
      usedGeneration: rel.imperialAppeasementGeneration,
      usedByPlayerId: rel.imperialAppeasementPlayerId,
    },
    mainlandEconomicEffectNumbersPending: true,
    notes: [
      'Strategic alliance +3 is never random: completeStrategicAlliance() requires the nation quest prerequisites.',
      'Improve Land is represented by the gnomeImproved land flag; its action cost is still TBD.',
      'Mainland relation movement is active, but exact Imperial Aid/Demand modifiers by Mainland level remain pending numeric calibration.',
    ],
  };
  return summary;
}
