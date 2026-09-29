import * as base from "./v089-engine.js?real=0.8.9-v101";

export * from "./v089-engine.js?real=0.8.9-v101";

const DEFAULT_IMPERIAL_DEMAND_THRESHOLD = 3;

function clampInt(value, minimum = 0) {
  return Math.max(minimum, Math.floor(Number(value) || 0));
}

function interventionValue(state) {
  return clampInt(state?.city?.imperialIntervention, 0);
}

function demandThreshold(state) {
  return Math.max(1, clampInt(
    state?.city?.imperialDemandThreshold ?? DEFAULT_IMPERIAL_DEMAND_THRESHOLD,
    1,
  ));
}

function imperialDemandPerSector(state) {
  return Math.floor(interventionValue(state) / demandThreshold(state));
}

function guardImperialDemand(state) {
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === "food") continue;
    const demand = sector.demandThisGeneration ?? {};
    Object.defineProperty(demand, "imperial", {
      enumerable: true,
      configurable: true,
      get() {
        return imperialDemandPerSector(state);
      },
      set() {
        // Ignore the legacy engine's fixed baseline write. The getter above
        // is the single source of truth for Imperial production demand.
      },
    });
    sector.demandThisGeneration = demand;
  }
}

export function applyAutoDemand(state) {
  base.applyAutoDemand(state);
  guardImperialDemand(state);
}

export function previewEconomy(state) {
  guardImperialDemand(state);
  return base.previewEconomy(state);
}

export function projectedWealthCapacity(state, playerId) {
  return previewEconomy(state).familyWealth[playerId] ?? base.V084_CONFIG.familyBaseWealth;
}
