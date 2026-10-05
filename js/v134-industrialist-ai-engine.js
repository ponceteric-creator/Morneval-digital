import * as base from './v133-influence-cap-engine.js?base=0.11.25-sim';

export * from './v133-influence-cap-engine.js?base=0.11.25-sim';

export const V134_VERSION = '0.11.26-sim';
export const V134_INDUSTRIALIST_PROFILE = Object.freeze({
  label: 'Industrialist',
  prestige: 1.35,
  wealth: 1.00,
  engine: 1.30,
  civic: 1.00,
  horizon: 4,
  discount: 0.90,
});

export const V134_INDUSTRIALIST_PRIORITY = Object.freeze({
  first: 'food_security_for_next_growth_step',
  buildStage: 'secure_productive_hinterland_and_two_production_stakes',
  monetizationStage: 'develop_controlled_sectors_and_score_prestige',
  economicPriority: ['productive_hinterland_when_needed', 'production_stakes'],
  verticalIntegration: 'prefer_stakes_and_development_linked_to_owned_raw_land',
  fallback: 'institutions_agents_and_other_actions',
  hinterlandGate: 'opening_private_land_or_raw_capacity_constraint',
  institutionDeferral: 'build_stage_or_direct_raw_constraint_only',
});

function configureIndustrialist(state, summary = null) {
  if (base.V090_CONFIG?.personalities) {
    base.V090_CONFIG.personalities.industrialist = { ...V134_INDUSTRIALIST_PROFILE };
  }

  let replacements = 0;
  for (const player of state.players ?? []) {
    if (player.aiPersonality === 'dynast') {
      player.aiPersonality = 'industrialist';
      replacements += 1;
    }
  }

  const rel = base.ensureExternalRelationsState(state);
  rel.version = V134_VERSION;
  state.simulationVersion = V134_VERSION;
  state.industrialistAi = {
    replacedDynastCount: replacements,
    profile: V134_INDUSTRIALIST_PROFILE,
    priority: V134_INDUSTRIALIST_PRIORITY,
  };

  if (summary) {
    summary.simulationVersion = V134_VERSION;
    summary.industrialistAi = state.industrialistAi;
    if (summary.externalRelations) summary.externalRelations.version = V134_VERSION;
  }
  return state;
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = base.createV084Game(familyNames);
  base.assertNoFoodProduction(state);
  configureIndustrialist(state);
  return state;
}

export function resolveAutomatedGeneration(state) {
  base.assertNoFoodProduction(state);
  configureIndustrialist(state);
  const summary = base.resolveAutomatedGeneration(state);
  base.assertNoFoodProduction(state, summary);
  configureIndustrialist(state, summary);
  return summary;
}
