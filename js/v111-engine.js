import * as legacy from "./v110-engine.js?real=0.11.0-v111";
import * as ai from "./v111-ai-engine.js?direct=0.11.1";
import * as economy from "./v089-engine.js?base=0.8.9";

export * from "./v110-engine.js?real=0.11.0-v111";
export const V084_CONFIG = economy.V084_CONFIG;

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

function captureAgents(state) {
  const byFamily = {};
  const byInstitution = {};
  for (const player of state.players ?? []) {
    let total = 0;
    for (const [institutionId, rawCount] of Object.entries(player.institutionAgents ?? {})) {
      const count = Math.max(0, Number(rawCount) || 0);
      total += count;
      byInstitution[institutionId] = (byInstitution[institutionId] || 0) + count;
    }
    byFamily[player.id] = total;
  }
  return { byFamily, byInstitution };
}

function captureInstitutionPrestige(state) {
  const preview = legacy.getInstitutionPreview(state) ?? {};
  return Object.fromEntries(
    Object.entries(preview).map(([id, result]) => [id, Number(result?.score) || 0]),
  );
}

function emitGenerationTelemetry(state, summary, before) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function" || typeof CustomEvent === "undefined") return;
  const agentsAfter = captureAgents(state);
  const influenceAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, Number(player.influence) || 0]));
  const familyNames = Object.fromEntries((state.players ?? []).map(player => [player.id, player.familyName ?? player.id]));
  const generation = Number(summary?.generation ?? before.generation ?? ((Number(state.generation) || 1) - 1)) || 0;

  window.dispatchEvent(new CustomEvent("morneval:generation-resolved", {
    detail: {
      generation,
      familyNames,
      influenceBefore: before.influence,
      influenceAfter,
      agentTotalsAfter: agentsAfter.byFamily,
      agentsByInstitutionAfter: agentsAfter.byInstitution,
      institutionPrestigeAfter: captureInstitutionPrestige(state),
      diseaseOccurred: Boolean(summary?.diseaseOccurred),
      squalorAfter: Number(summary?.squalorAfter ?? state.city?.squalor ?? 0),
    },
  }));
}

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
  const before = {
    generation: Number(state.generation) || 0,
    influence: Object.fromEntries((state.players ?? []).map(player => [player.id, Number(player.influence) || 0])),
  };
  const summary = ai.resolveAutomatedGeneration(state);
  legacy.refreshForce(state);
  emitGenerationTelemetry(state, summary, before);
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
