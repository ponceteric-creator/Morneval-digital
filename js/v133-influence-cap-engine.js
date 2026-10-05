import * as base from './v132-production-stake-ai-engine.js?base=0.11.24-sim';

export * from './v132-production-stake-ai-engine.js?base=0.11.24-sim';

export const V133_VERSION = '0.11.25-sim';
export const V133_INFLUENCE_EROSION_THRESHOLD = 20;

function applyInfluenceThreshold(state, summary = null) {
  state.city.influenceErosionThreshold = V133_INFLUENCE_EROSION_THRESHOLD;
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V133_VERSION;
  state.simulationVersion = V133_VERSION;
  state.influenceErosionThreshold = V133_INFLUENCE_EROSION_THRESHOLD;

  if (summary) {
    summary.simulationVersion = V133_VERSION;
    summary.influenceErosionThreshold = V133_INFLUENCE_EROSION_THRESHOLD;
    if (summary.externalRelations) summary.externalRelations.version = V133_VERSION;
  }
  return state;
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = base.createV084Game(familyNames);
  base.assertNoFoodProduction(state);
  applyInfluenceThreshold(state);
  return state;
}

export function resolveAutomatedGeneration(state) {
  base.assertNoFoodProduction(state);
  applyInfluenceThreshold(state);
  const summary = base.resolveAutomatedGeneration(state);
  base.assertNoFoodProduction(state, summary);
  applyInfluenceThreshold(state, summary);
  return summary;
}
