import * as base from './v135-family-influence-engine.js?base=0.11.27-sim';

export * from './v135-family-influence-engine.js?base=0.11.27-sim';

export const V136_VERSION = '0.11.28-sim';
export const V136_MERCHANT_AI = Object.freeze({
  personality: 'merchant',
  guildScoringModel: 'current_wealth_based',
  experimentalGuildScoringModel: 'wealth_forward',
  agentPortfolioModel: 'marginal_single_association_prestige_and_tier_capped_influence',
  politicalIntentModel: 'legacy_v119_preserved',
  rejectedExperimentalPoliticalIntent: 'marginal_commercial_policy',
  rulesChanged: false,
});

function stampVersion(state, summary = null) {
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V136_VERSION;
  state.simulationVersion = V136_VERSION;
  state.merchantAiModel = V136_MERCHANT_AI;
  if (summary) {
    summary.simulationVersion = V136_VERSION;
    summary.merchantAiModel = V136_MERCHANT_AI;
    if (summary.externalRelations) summary.externalRelations.version = V136_VERSION;
  }
  return state;
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
  const summary = base.resolveAutomatedGeneration(state);
  base.assertNoFoodProduction(state, summary);
  stampVersion(state, summary);
  return summary;
}
