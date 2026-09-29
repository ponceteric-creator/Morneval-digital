import * as base from "./v089-engine.js?real=0.8.9";

export * from "./v089-engine.js?real=0.8.9";

function clampIntervention(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function applyAutoDemand(state) {
  base.applyAutoDemand(state);
  const intervention = clampIntervention(state?.city?.imperialIntervention);
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === "food") continue;
    sector.demandThisGeneration.imperial = 1 + intervention;
  }
}
