import * as base from './v129-terrain-actions-engine.js?base=0.11.20-sim';

export * from './v129-terrain-actions-engine.js?base=0.11.20-sim';

export const V130_VERSION = '0.11.22-sim';
export const ELF_STUDY_TOTAL_REQUIRED = 10;
export const ELF_STUDY_MAX_PER_ACTION = 2;
export const ELF_ALLIANCE_RENOWN = 2;

function n(value) { return Number(value) || 0; }
function int(value, min = 0) { return Math.max(min, Math.trunc(n(value))); }
function getPlayer(state, playerId) {
  return (state.players ?? []).find(player => player.id === playerId) ?? null;
}
function hasScholariumAgent(player) {
  return (player?.institutionAgentRoster ?? []).some(agent => agent.institutionId === 'scholarium');
}
function farmCount(state) {
  return (state.lands ?? []).filter(land => !land?.syntheticDiplomacy && land.revealed && land.development === 'farm').length;
}

function ensureElvenQuestState(state) {
  const rel = base.ensureExternalRelationsState(state);
  rel.elvenAllianceQuest ??= {
    id: 'one_with_the_forest',
    title: 'One with the Forest',
    completed: false,
    completedGeneration: null,
    studyInfluenceSpent: 0,
    studyContributions: {},
    studyActions: [],
    renownAwarded: 0,
    prestigeAwards: [],
  };
  rel.elvenAllianceQuest.studyInfluenceSpent = int(rel.elvenAllianceQuest.studyInfluenceSpent);
  rel.elvenAllianceQuest.studyContributions ??= {};
  rel.elvenAllianceQuest.studyActions ??= [];
  rel.elvenAllianceQuest.prestigeAwards ??= [];
  return rel.elvenAllianceQuest;
}

export function getElvenQuestStatus(state) {
  const rel = base.ensureExternalRelationsState(state);
  const quest = ensureElvenQuestState(state);
  const forests = base.countActiveForests(state);
  const farms = farmCount(state);
  const studySpent = int(quest.studyInfluenceSpent);
  const conditions = {
    forests: { met: forests >= 9, current: forests, required: 9 },
    noFarms: { met: farms === 0, current: farms, required: 0 },
    studyElfWays: { met: studySpent >= ELF_STUDY_TOTAL_REQUIRED, current: studySpent, required: ELF_STUDY_TOTAL_REQUIRED },
  };
  return {
    questId: quest.id,
    title: quest.title,
    completed: Boolean(quest.completed),
    relationRequirementMet: rel.active && rel.levels.elves >= 2,
    conditions,
    readyToComplete: !quest.completed
      && rel.active
      && rel.levels.elves >= 2
      && Object.values(conditions).every(row => row.met),
    studyContributions: { ...quest.studyContributions },
  };
}

export function studyElfWays(state, playerId, influence = 1) {
  const rel = base.ensureExternalRelationsState(state);
  const quest = ensureElvenQuestState(state);
  if (!rel.active) return { ok: false, reason: 'relations_not_active' };
  if (quest.completed || rel.alliances?.elves?.completed) return { ok: false, reason: 'elven_alliance_already_completed' };
  if (rel.levels.elves < 2 || base.countActiveForests(state) < 9) return { ok: false, reason: 'elven_quest_not_unlocked' };

  const player = getPlayer(state, playerId);
  if (!player) return { ok: false, reason: 'unknown_player' };
  if (!hasScholariumAgent(player)) return { ok: false, reason: 'scholarium_agent_required' };

  const requested = int(influence, 1);
  if (requested > ELF_STUDY_MAX_PER_ACTION) return { ok: false, reason: 'maximum_2_influence_per_action' };
  const remaining = Math.max(0, ELF_STUDY_TOTAL_REQUIRED - int(quest.studyInfluenceSpent));
  if (remaining <= 0) return { ok: false, reason: 'study_condition_already_complete' };
  const spent = Math.min(requested, remaining);
  if (n(player.influence) < spent) return { ok: false, reason: 'insufficient_influence' };

  player.influence -= spent;
  quest.studyInfluenceSpent += spent;
  quest.studyContributions[playerId] = int(quest.studyContributions[playerId]) + spent;
  quest.studyActions.push({ generation: int(state.generation, 1), playerId, influenceSpent: spent });

  return {
    ok: true,
    actionKind: 'study_elf_ways',
    actionCost: 1,
    playerId,
    influenceSpent: spent,
    totalStudyInfluence: quest.studyInfluenceSpent,
    remaining: Math.max(0, ELF_STUDY_TOTAL_REQUIRED - quest.studyInfluenceSpent),
    playerContribution: quest.studyContributions[playerId],
  };
}

export function getElvenSocietyEffects(state) {
  const rel = base.ensureExternalRelationsState(state);
  const forests = base.countActiveForests(state);
  const level = int(rel.levels.elves, -3);
  const populationCapacityPerForest = level >= 3 ? 2 : level >= 2 ? 1 : 0;
  const populationCapacityBonus = forests * populationCapacityPerForest;
  const rawFoodPerProductiveForest = level >= 1 ? 1 : 0;
  const forceBonus = level >= 3 && forests >= 9 ? (forests >= 12 ? 5 : 4) : 0;
  return {
    forests,
    level,
    rawFoodPerProductiveForest,
    populationCapacityPerForest,
    populationCapacityBonus,
    forceBonus,
    textilePerProductiveForest: level >= 2 ? 1 : 0,
  };
}

function syncElvenSocietyEffects(state) {
  state.city ??= {};
  const effects = getElvenSocietyEffects(state);
  state.city.elvenPopulationCapacityBonus = effects.populationCapacityBonus;
  state.city.elvenAllianceForceBonus = effects.forceBonus;
  return effects;
}

function applyImmediateEndgameCheck(state) {
  const threshold = int(state.endgame?.renownTrigger || 12, 1);
  const renown = int(state.city?.renown);
  state.endgame ??= { renownTrigger: threshold, triggered: false, triggerGeneration: null, triggerRenown: null };
  if (!state.endgame.triggered && renown >= threshold) {
    state.endgame.triggered = true;
    state.endgame.triggerGeneration = int(state.generation);
    state.endgame.triggerRenown = renown;
  }
}

function applyElvenCompletionRewards(state) {
  const quest = ensureElvenQuestState(state);
  const contributions = Object.entries(quest.studyContributions)
    .map(([playerId, amount]) => ({ playerId, amount: int(amount) }))
    .filter(row => row.amount > 0);
  const highest = contributions.length ? Math.max(...contributions.map(row => row.amount)) : 0;
  const topIds = new Set(contributions.filter(row => row.amount === highest).map(row => row.playerId));
  const awards = [];

  for (const row of contributions) {
    const player = getPlayer(state, row.playerId);
    if (!player) continue;
    const participantPrestige = 1;
    const topContributorPrestige = topIds.has(row.playerId) ? 1 : 0;
    const total = participantPrestige + topContributorPrestige;
    player.prestige = n(player.prestige) + total;
    awards.push({
      playerId: row.playerId,
      contribution: row.amount,
      participantPrestige,
      topContributorPrestige,
      totalPrestige: total,
    });
  }

  state.city.permanentPoliticalRenown = int(state.city.permanentPoliticalRenown) + ELF_ALLIANCE_RENOWN;
  if (typeof base.recalculateRenown === 'function') base.recalculateRenown(state);
  else state.city.renown = int(state.city.renown) + ELF_ALLIANCE_RENOWN;
  applyImmediateEndgameCheck(state);

  quest.renownAwarded = ELF_ALLIANCE_RENOWN;
  quest.prestigeAwards = awards;
  return { awards, topContributorIds: [...topIds], renownAwarded: ELF_ALLIANCE_RENOWN };
}

function triggerMainlandPlus3Penalty(state) {
  const rel = base.ensureExternalRelationsState(state);
  const flags = rel.mainlandThresholdsTriggered?.elves;
  if (!flags || flags.plus3) return null;
  flags.plus3 = true;
  const before = int(rel.levels.mainland, -3);
  rel.levels.mainland = Math.max(-3, Math.min(3, before - 2));
  return { nation: 'mainland', from: before, to: rel.levels.mainland, reason: 'elves_first_reached_plus3_strategic_alliance', amount: -2 };
}

export function completeStrategicAlliance(state, nation) {
  if (nation !== 'elves') return base.completeStrategicAlliance(state, nation);
  const rel = base.ensureExternalRelationsState(state);
  const quest = ensureElvenQuestState(state);
  const status = getElvenQuestStatus(state);
  if (!status.readyToComplete) return { ok: false, reason: 'quest_requirements_not_met', status };

  const before = rel.levels.elves;
  rel.alliances.elves.completed = true;
  rel.alliances.elves.completedGeneration = int(state.generation, 1);
  rel.levels.elves = 3;
  rel.questEligible.elves = false;
  quest.completed = true;
  quest.completedGeneration = int(state.generation, 1);

  const mainlandChange = triggerMainlandPlus3Penalty(state);
  const rewards = applyElvenCompletionRewards(state);
  const effects = syncElvenSocietyEffects(state);

  return {
    ok: true,
    nation: 'elves',
    quest: quest.title,
    relationBefore: before,
    relationAfter: 3,
    mainlandChange,
    rewards,
    effects,
    endgame: state.endgame ? { ...state.endgame } : null,
  };
}

export function reforestLand(state, playerId, landId) {
  const result = base.reforestLand(state, playerId, landId);
  if (result?.ok) {
    result.elvenSocietyEffects = syncElvenSocietyEffects(state);
    result.questStatus = getElvenQuestStatus(state);
  }
  return result;
}

export function improveLandForGnomes(state, playerId, landId) {
  return base.improveLandForGnomes(state, playerId, landId);
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = base.createV084Game(familyNames);
  base.ensureExternalRelationsState(state).version = V130_VERSION;
  ensureElvenQuestState(state);
  syncElvenSocietyEffects(state);
  return state;
}

export function resolveAutomatedGeneration(state) {
  ensureElvenQuestState(state);
  const effectsAtStart = syncElvenSocietyEffects(state);
  const summary = base.resolveAutomatedGeneration(state);
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V130_VERSION;
  const effectsAfter = syncElvenSocietyEffects(state);

  if (summary.externalRelations) {
    summary.externalRelations.version = V130_VERSION;
    summary.externalRelations.elvenAllianceQuest = getElvenQuestStatus(state);
    summary.externalRelations.elvenSociety = {
      effectsAtStart,
      effectsAfter,
      level2: '+1 Population Capacity per Forest',
      level3: '+2 Population Capacity per Forest; +4 Force at 9-11 Forests, +5 Force at 12 Forests; no extra Raw Food beyond the +1 level effect',
      studyElfWays: `10 Influence total; max ${ELF_STUDY_MAX_PER_ACTION} per action; Scholarium Agent required to contribute`,
      completionRenown: ELF_ALLIANCE_RENOWN,
    };
  }
  return summary;
}
