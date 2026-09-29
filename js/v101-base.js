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

function installImperialDemandOverlay(state) {
  const records = [];

  for (const sector of state.productionSectors ?? []) {
    const backing = { ...(sector.demandThisGeneration ?? {}) };
    const proxy = new Proxy(backing, {
      set(target, property, value) {
        if (property === "imperial" && sector.id !== "food") {
          // The legacy engine writes a fixed Imperial baseline of 1 while it
          // recalculates demand. v0.10.1 replaces that baseline entirely:
          // Imperial demand is floor(Intervention / configurable threshold).
          target[property] = imperialDemandPerSector(state);
        } else {
          target[property] = value;
        }
        return true;
      },
    });
    sector.demandThisGeneration = proxy;
    records.push({ sector, proxy });
  }

  return () => {
    for (const { sector, proxy } of records) {
      sector.demandThisGeneration = { ...proxy };
    }
  };
}

export function applyAutoDemand(state) {
  base.applyAutoDemand(state);
  const imperialDemand = imperialDemandPerSector(state);
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === "food") continue;
    sector.demandThisGeneration.imperial = imperialDemand;
  }
}

export function previewEconomy(state) {
  const restore = installImperialDemandOverlay(state);
  try {
    return base.previewEconomy(state);
  } finally {
    restore();
  }
}

export function projectedWealthCapacity(state, playerId) {
  return previewEconomy(state).familyWealth[playerId] ?? base.V084_CONFIG.familyBaseWealth;
}
