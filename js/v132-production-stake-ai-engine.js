import * as base from './v131-food-production-cleanup-engine.js?base=0.11.23-sim';

export * from './v131-food-production-cleanup-engine.js?base=0.11.23-sim';

export const V132_VERSION = '0.11.24-sim';
export const V132_PRODUCTION_STAKE_AI = Object.freeze({
  capitalValuation: 'three_generation_projected_marginal_value',
  actionPriority: 'legacy_scale_when_productive_future_option_when_replacement',
  demandProjection: 'current_demand_static',
  landSynergy: 'none_pending_competition_aware_model',
  bidPricing: 'dynamic_influence_shadow_value_incremental_raise_cost',
  influenceReservation: 'none',
});

function stampVersion(state, summary = null) {
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V132_VERSION;
  state.simulationVersion = V132_VERSION;
  state.productionStakeAiModel = V132_PRODUCTION_STAKE_AI;
  if (summary) {
    summary.simulationVersion = V132_VERSION;
    summary.productionStakeAiModel = V132_PRODUCTION_STAKE_AI;
    if (summary.externalRelations) summary.externalRelations.version = V132_VERSION;
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
