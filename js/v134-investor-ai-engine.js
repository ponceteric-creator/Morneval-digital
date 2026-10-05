import * as base from './v133-influence-cap-engine.js?base=0.11.25-sim';

export * from './v133-influence-cap-engine.js?base=0.11.25-sim';

export const V134_VERSION = '0.11.26-sim';
export const V134_INVESTOR_AI = Object.freeze({
  replaces: 'dynast',
  personality: 'investor',
  label: 'Investor',
  priority: ['productive_hinterland', 'production_stakes'],
  deprioritized: ['sector_development', 'institution_agents'],
});

function stampVersion(state, summary = null) {
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V134_VERSION;
  state.simulationVersion = V134_VERSION;
  state.investorAiModel = V134_INVESTOR_AI;
  if (summary) {
    summary.simulationVersion = V134_VERSION;
    summary.investorAiModel = V134_INVESTOR_AI;
    if (summary.externalRelations) summary.externalRelations.version = V134_VERSION;
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
