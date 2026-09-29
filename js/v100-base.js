import * as base from "./v089-engine.js?real=0.8.9";

export * from "./v089-engine.js?real=0.8.9";

function clampIntervention(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function installImperialDemandOverlay(state) {
  const records = [];
  const intervention = clampIntervention(state?.city?.imperialIntervention);

  for (const sector of state.productionSectors ?? []) {
    const backing = { ...(sector.demandThisGeneration ?? {}) };
    const proxy = new Proxy(backing, {
      set(target, property, value) {
        if (property === "imperial" && sector.id !== "food") {
          const requested = Math.max(0, Math.floor(Number(value) || 0));
          // Legacy demand code repeatedly writes the baseline value 1. Keep
          // already-adjusted values intact, but turn baseline writes into
          // 1 + persistent Imperial Intervention.
          target[property] = requested <= 1
            ? 1 + intervention
            : requested;
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
  const intervention = clampIntervention(state?.city?.imperialIntervention);
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === "food") continue;
    sector.demandThisGeneration.imperial = 1 + intervention;
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
