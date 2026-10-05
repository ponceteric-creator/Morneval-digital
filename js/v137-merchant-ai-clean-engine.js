import * as base from './v135-family-influence-engine.js?base=0.11.27-sim';

export * from './v135-family-influence-engine.js?base=0.11.27-sim';

export const V137_VERSION = '0.11.29-sim';
export const V137_MERCHANT_AI = Object.freeze({
  merchantGuildAiScore: 'current_locked_wealth_formula',
  agentPortfolioModel: 'marginal_single_association_prestige_and_tier_capped_influence',
  politicalIntentModel: 'legacy_v119_preserved',
  merchantGuildRuleCompatibility: 'create_missing_award_entry_before_v127_wealth_correction',
  rulesChanged: false,
});

function stampVersion(state, summary = null) {
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V137_VERSION;
  state.simulationVersion = V137_VERSION;
  state.merchantAiModel = V137_MERCHANT_AI;
  if (summary) {
    summary.simulationVersion = V137_VERSION;
    summary.merchantAiModel = V137_MERCHANT_AI;
    if (summary.externalRelations) summary.externalRelations.version = V137_VERSION;
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
