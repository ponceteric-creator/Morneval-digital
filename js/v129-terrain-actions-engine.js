import * as base from './v128-external-relations-engine.js?base=0.11.19-sim';

export * from './v128-external-relations-engine.js?base=0.11.19-sim';

export const V129_VERSION = '0.11.20-sim';
export const TERRAIN_ACTION_INFLUENCE_COST = 2;
export const TERRAIN_ACTION_PRESTIGE = 1;

function n(value) { return Number(value) || 0; }
function clampRelation(value) { return Math.max(-3, Math.min(3, Math.trunc(n(value)))); }

function getPlayer(state, playerId) {
  return (state.players ?? []).find(player => player.id === playerId) ?? null;
}

function isEligibleTerrainOwner(land, playerId) {
  return land?.ownerId === playerId || land?.ownerId === 'city';
}

function elvenRelationFromForestCount(state) {
  const rel = base.ensureExternalRelationsState(state);
  const forests = base.countActiveForests(state);
  if (forests >= 9 && rel.alliances?.elves?.completed) return 3;
  if (forests >= 6) return 2;
  if (forests >= 4) return 1;
  if (forests === 3) return 0;
  if (forests === 2) return -1;
  if (forests === 1) return -2;
  return -3;
}

function applyElvenPlus2MainlandTrigger(state, beforeElves, afterElves) {
  const rel = base.ensureExternalRelationsState(state);
  const flags = rel.mainlandThresholdsTriggered?.elves;
  if (!flags || flags.plus2 || beforeElves >= 2 || afterElves < 2) return null;
  flags.plus2 = true;
  const before = rel.levels.mainland;
  rel.levels.mainland = clampRelation(before - 1);
  return { from: before, to: rel.levels.mainland, reason: 'elves_first_reached_plus2', amount: -1 };
}

export function reforestLand(state, playerId, landId) {
  const rel = base.ensureExternalRelationsState(state);
  if (!rel.active) return { ok: false, reason: 'relations_not_active' };
  const player = getPlayer(state, playerId);
  if (!player) return { ok: false, reason: 'unknown_player' };
  if (n(player.influence) < TERRAIN_ACTION_INFLUENCE_COST) return { ok: false, reason: 'insufficient_influence' };
  const land = (state.lands ?? []).find(row => row.id === landId);
  if (!land || !land.revealed || land.development === 'urban' || !isEligibleTerrainOwner(land, playerId)) {
    return { ok: false, reason: 'owned_or_city_nonurban_land_required' };
  }
  if (land.development === 'natural' && land.terrain === 'forest') return { ok: false, reason: 'already_forest' };

  const previous = {
    ownerId: land.ownerId,
    terrain: land.terrain,
    development: land.development,
    resourceType: land.resourceType,
    baseCapacity: land.baseCapacity,
  };
  const elvesBefore = rel.levels.elves;
  player.influence -= TERRAIN_ACTION_INFLUENCE_COST;
  player.prestige = n(player.prestige) + TERRAIN_ACTION_PRESTIGE;

  land.terrain = 'forest';
  land.development = 'natural';
  land.resourceType = 'wood';
  land.baseCapacity = Math.max(1, Math.trunc(n(base.V084_CONFIG?.hinterland?.tileCapacity) || 2));
  land.publicFarm = false;
  land.civicFarmContributorId = null;
  land.civicFarmGeneration = null;
  land.name = `Forest · Territory ${String(land.id).split('_').at(-1)}`;

  rel.levels.elves = elvenRelationFromForestCount(state);
  const mainlandChange = applyElvenPlus2MainlandTrigger(state, elvesBefore, rel.levels.elves);
  rel.questEligible.elves = !rel.alliances?.elves?.completed
    && rel.levels.elves >= 2
    && base.countActiveForests(state) >= 9;

  return {
    ok: true,
    actionKind: 'reforestation',
    playerId,
    landId,
    influenceCost: TERRAIN_ACTION_INFLUENCE_COST,
    prestigeAward: TERRAIN_ACTION_PRESTIGE,
    previous,
    elvesBefore,
    elvesAfter: rel.levels.elves,
    mainlandChange,
  };
}

export function improveLandForGnomes(state, playerId, landId) {
  const rel = base.ensureExternalRelationsState(state);
  if (!rel.active || rel.levels.gnomes < 1) return { ok: false, reason: 'gnome_relation_plus1_required' };
  const player = getPlayer(state, playerId);
  if (!player) return { ok: false, reason: 'unknown_player' };
  if (n(player.influence) < TERRAIN_ACTION_INFLUENCE_COST) return { ok: false, reason: 'insufficient_influence' };
  const land = (state.lands ?? []).find(row => row.id === landId);
  if (!land || !land.revealed || land.development === 'urban' || !isEligibleTerrainOwner(land, playerId)) {
    return { ok: false, reason: 'owned_or_city_nonurban_land_required' };
  }
  if (land.gnomeImproved) return { ok: false, reason: 'already_improved' };

  player.influence -= TERRAIN_ACTION_INFLUENCE_COST;
  player.prestige = n(player.prestige) + TERRAIN_ACTION_PRESTIGE;
  land.gnomeImproved = true;

  return {
    ok: true,
    actionKind: 'gnome_land_improvement',
    playerId,
    landId,
    influenceCost: TERRAIN_ACTION_INFLUENCE_COST,
    prestigeAward: TERRAIN_ACTION_PRESTIGE,
    productionGain: 1,
    note: 'The permanent +1 Production is represented by gnomeImproved. The former separate Gnome +2 improvement bonus is now redundant and must be redesigned rather than stacked.',
  };
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = base.createV084Game(familyNames);
  base.ensureExternalRelationsState(state).version = V129_VERSION;
  return state;
}

export function resolveAutomatedGeneration(state) {
  const summary = base.resolveAutomatedGeneration(state);
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V129_VERSION;
  if (summary.externalRelations) {
    summary.externalRelations.version = V129_VERSION;
    summary.externalRelations.terrainActions = {
      influenceCost: TERRAIN_ACTION_INFLUENCE_COST,
      prestigeAward: TERRAIN_ACTION_PRESTIGE,
      reforestationUnlockedWhenRelationsActive: true,
      gnomeImproveLandUnlockedAt: '+1 Gnomes',
      validTargetOwnership: 'acting Family or City',
      gnomeImprovementProductionGain: 1,
    };
    summary.externalRelations.notes = (summary.externalRelations.notes ?? [])
      .filter(note => !String(note).includes('Improve Land is represented') && !String(note).includes('action cost is still TBD'));
    summary.externalRelations.notes.push('Reforestation and Gnome Improve Land cost 2 Influence and grant +1 Prestige.');
    summary.externalRelations.notes.push('Gnome Improve Land grants permanent +1 Production; the former separate +2 Gnome improvement bonus must not stack and is marked for redesign.');
  }
  return summary;
}
