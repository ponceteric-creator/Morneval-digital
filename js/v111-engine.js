import * as legacy from "./v110-engine.js?real=0.11.0-v111";
import * as ai from "./v111-ai-engine.js?direct=0.11.1";
import * as economy from "./v111-base.js?direct=0.11.1";

export * from "./v110-engine.js?real=0.11.0-v111";
export { V084_CONFIG } from "./v111-base.js?direct=0.11.1";

export const V100_CONFIG = {
  ...legacy.V100_CONFIG,
  influence: {
    ...legacy.V100_CONFIG.influence,
    softCapThresholdDefault: 15,
  },
  agents: {
    ...legacy.V100_CONFIG.agents,
    wealthCommitment: 1,
  },
};

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = legacy.createV084Game(familyNames);
  ai.prepareV111State(state, { resetStartingInfluence: true });
  legacy.applyAutoDemand(state);
  return state;
}

export function applyAutoDemand(state) {
  ai.prepareV111State(state);
  legacy.applyAutoDemand(state);
}

export function previewEconomy(state) {
  ai.prepareV111State(state);
  legacy.applyAutoDemand(state);
  return legacy.previewEconomy(state);
}

export function resolveAutomatedGeneration(state) {
  ai.prepareV111State(state);
  const summary = ai.resolveAutomatedGeneration(state);
  legacy.refreshForce(state);
  return summary;
}

export function setInstitutionAgentCount(state, playerId, institutionId, value) {
  ai.prepareV111State(state);
  legacy.setInstitutionAgentCount(state, playerId, institutionId, value);
}

export function setCityValue(state, key, value) {
  ai.prepareV111State(state);
  legacy.setCityValue(state, key, value);
}

export function getInstitutionPreview(state) {
  ai.prepareV111State(state);
  return legacy.getInstitutionPreview(state);
}

export { economy };
