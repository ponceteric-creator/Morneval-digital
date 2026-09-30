import * as legacy from "./v100-engine.js?real=0.10.0-v110";
import * as ai from "./v110-ai-engine.js?direct=0.11.0";
import * as economy from "./v110-base.js?direct=0.11.0";

export * from "./v100-engine.js?real=0.10.0-v110";

export const V100_CONFIG = {
  ...legacy.V100_CONFIG,
  order: {
    minimum: 0,
    maximum: 4,
    smallCityMaxPopulation: 3,
    largeCityThreshold: 15,
    smallCityBase: 3,
    normalCityBase: 2,
    largeCityBase: 1,
    unmetPopulationDemandModifier: -1,
    largeCityGrowthMinimum: 2,
  },
  imperial: {
    defaultDemandThreshold: 3,
    foodAidInterventionGain: 1,
  },
  agents: {
    wealthCommitment: 1,
    maximumSeniority: 3,
  },
  influence: {
    softCapThresholdDefault: economy.V084_CONFIG.influence.softCapThreshold ?? 12,
  },
  mercenaryContract: {
    maintenanceBid: 1,
    wealthIncome: 1,
    rawFoodMaintenance: 1,
  },
};

const INSTITUTION_IDS = Object.keys(V100_CONFIG.institutions);

function clampInt(value, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(minimum, Math.min(maximum, n));
}

export function baseOrderForPopulation(population) {
  const pop = Math.max(1, clampInt(population, 1));
  if (pop <= V100_CONFIG.order.smallCityMaxPopulation) return V100_CONFIG.order.smallCityBase;
  if (pop >= V100_CONFIG.order.largeCityThreshold) return V100_CONFIG.order.largeCityBase;
  return V100_CONFIG.order.normalCityBase;
}

export function imperialDemandPerSector(state) {
  const intervention = clampInt(state?.city?.imperialIntervention ?? 0);
  const threshold = Math.max(1, clampInt(
    state?.city?.imperialDemandThreshold ?? V100_CONFIG.imperial.defaultDemandThreshold,
    1,
  ));
  return Math.floor(intervention / threshold);
}

export function structuralForce(level) {
  const entry = V100_CONFIG.fortificationTrack.find(item => item.level === clampInt(level, 0, 4));
  return entry?.structuralForce ?? 0;
}

export function manpowerForce(state) {
  const axis = Math.max(-2, Math.min(2, Math.floor(Number(state?.city?.militaryMercantile) || 0)));
  const divisor = V100_CONFIG.manpower.divisorsByInclination[String(axis)];
  if (!divisor) return 0;
  return Math.min(V100_CONFIG.manpower.cap, Math.floor(Math.max(1, Number(state.city.population) || 1) / divisor));
}

export function refreshForce(state) {
  if (!state?.city) return 0;
  state.city.forceStructure = structuralForce(state.city.fortificationLevel ?? 0);
  state.city.forceManpower = manpowerForce(state);
  state.city.force = state.city.forceStructure + state.city.forceManpower;
  return state.city.force;
}

function ensureState(state) {
  state.city.orderModifier = Math.max(-4, Math.min(4, Math.floor(Number(state.city.orderModifier) || 0)));
  state.city.imperialIntervention = clampInt(state.city.imperialIntervention ?? 0);
  state.city.imperialDemandThreshold = Math.max(1, clampInt(
    state.city.imperialDemandThreshold ?? V100_CONFIG.imperial.defaultDemandThreshold,
    1,
  ));
  state.city.influenceErosionThreshold = Math.max(1, clampInt(
    state.city.influenceErosionThreshold ?? V100_CONFIG.influence.softCapThresholdDefault,
    1,
  ));
  state.city.fortificationLevel = clampInt(state.city.fortificationLevel ?? 0, 0, 4);
  state.institutions ??= INSTITUTION_IDS.map(id => ({ id, name: V100_CONFIG.institutions[id].label, tier: 1 }));
  for (const institution of state.institutions) institution.tier = clampInt(institution.tier ?? 1, 1, 3);
  ai.ensureInstitutionAgentState(state);
  refreshForce(state);
  return state;
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = ai.createV084Game(familyNames);
  state.city.orderModifier = 0;
  state.city.order = baseOrderForPopulation(state.city.population);
  state.city.imperialIntervention = 0;
  state.city.imperialDemandThreshold = V100_CONFIG.imperial.defaultDemandThreshold;
  state.city.influenceErosionThreshold = V100_CONFIG.influence.softCapThresholdDefault;
  state.city.fortificationLevel = 0;
  state.institutions = INSTITUTION_IDS.map(id => ({ id, name: V100_CONFIG.institutions[id].label, tier: 1 }));
  ensureState(state);
  applyAutoDemand(state);
  return state;
}

export function applyAutoDemand(state) {
  ensureState(state);
  ai.applyAutoDemand(state);
  refreshForce(state);
}

export function previewEconomy(state) {
  ensureState(state);
  applyAutoDemand(state);
  return ai.previewEconomy(state);
}

export function getInstitutionPreview(state) {
  ensureState(state);
  const economyPreview = previewEconomy(state);
  return ai.calculateInstitutionScores(
    state,
    economyPreview.reports,
    [],
    state.city.order,
    state.city.population,
  );
}

export function resolveAutomatedGeneration(state) {
  ensureState(state);
  const summary = ai.resolveAutomatedGeneration(state);
  refreshForce(state);
  return summary;
}

export function setInstitutionAgentCount(state, playerId, institutionId, value) {
  ensureState(state);
  if (!INSTITUTION_IDS.includes(institutionId)) return;
  const player = state.players.find(item => item.id === playerId);
  if (!player) return;
  const desired = clampInt(value);
  const roster = player.institutionAgentRoster ?? (player.institutionAgentRoster = []);
  let matching = roster.filter(agent => agent.institutionId === institutionId);
  while (matching.length < desired) {
    const order = state.nextInstitutionAgentOrder++;
    roster.push({ id: `agent_${order}`, institutionId, seniority: 1, placementOrder: order,
      placedGeneration: state.generation, manualTestPlacement: true });
    matching = roster.filter(agent => agent.institutionId === institutionId);
  }
  if (matching.length > desired) {
    const removeIds = matching
      .sort((a, b) => a.seniority - b.seniority || b.placementOrder - a.placementOrder)
      .slice(0, matching.length - desired)
      .map(agent => agent.id);
    player.institutionAgentRoster = roster.filter(agent => !removeIds.includes(agent.id));
  }
  ai.ensureInstitutionAgentState(state);
}

export function setCityValue(state, key, value) {
  ensureState(state);
  if (key === "orderModifier") {
    state.city.orderModifier = Math.max(-4, Math.min(4, Math.floor(Number(value) || 0)));
  } else if (key === "order") {
    const desired = clampInt(value, 0, 4);
    state.city.orderModifier = desired - baseOrderForPopulation(state.city.population);
    state.city.order = desired;
  } else if (key === "imperialIntervention") {
    state.city.imperialIntervention = clampInt(value);
  } else if (key === "imperialDemandThreshold") {
    state.city.imperialDemandThreshold = Math.max(1, clampInt(value, 1));
  } else if (key === "influenceErosionThreshold") {
    state.city.influenceErosionThreshold = Math.max(1, clampInt(value, 1));
  } else if (key === "fortificationLevel") {
    state.city.fortificationLevel = clampInt(value, 0, 4);
  } else if (key === "renown") {
    // Structural Renown is recalculated from visible board state; manual writes are ignored.
  } else {
    legacy.setCityValue(state, key, value);
  }
  refreshForce(state);
  applyAutoDemand(state);
}
