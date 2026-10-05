import * as base from './v134-investor-ai-engine.js?base=0.11.26-sim';

export * from './v134-investor-ai-engine.js?base=0.11.26-sim';

export const V135_VERSION = '0.11.27-sim';
export const V135_FAMILY_INFLUENCE = Object.freeze({
  incomePerGeneration: 2,
  timing: 'start_of_generation_before_actions',
  appliesTo: 'each_family',
});

function stampVersion(state, summary = null) {
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V135_VERSION;
  state.simulationVersion = V135_VERSION;
  state.familyInfluenceIncome = V135_FAMILY_INFLUENCE;
  if (summary) {
    summary.simulationVersion = V135_VERSION;
    summary.familyInfluenceIncome = V135_FAMILY_INFLUENCE;
    if (summary.externalRelations) summary.externalRelations.version = V135_VERSION;
  }
  return state;
}

function grantFamilyInfluenceIncome(state) {
  const amount = V135_FAMILY_INFLUENCE.incomePerGeneration;
  const grants = [];
  for (const player of state.players ?? []) {
    const before = Math.max(0, Math.floor(Number(player.influence) || 0));
    player.influence = before + amount;
    grants.push({
      playerId: player.id,
      personality: player.aiPersonality ?? null,
      before,
      granted: amount,
      after: player.influence,
    });
  }
  state.__familyInfluenceIncomeLastGeneration = {
    generation: state.generation ?? null,
    amount,
    grants,
  };
  return grants;
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = base.createV084Game(familyNames);
  base.assertNoFoodProduction(state);
  stampVersion(state);
  return state;
}

export function resolveAutomatedGeneration(state) {
  base.assertNoFoodProduction(state);
  stampVersion(state);
  const familyInfluenceIncomeGrants = grantFamilyInfluenceIncome(state);
  const summary = base.resolveAutomatedGeneration(state);
  base.assertNoFoodProduction(state, summary);
  stampVersion(state, summary);
  summary.familyInfluenceIncomeGrants = familyInfluenceIncomeGrants;
  return summary;
}
