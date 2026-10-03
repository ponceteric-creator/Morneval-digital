import * as base from "./v089-engine.js?real=0.8.9-v102";
import { INTRIGUE_CARD_META } from "./v115-intrigue-card-catalog.js?v=0.11.5";

export * from "./v089-engine.js?real=0.8.9-v102";

const EXTERNAL_DEMAND_RENOWN_DIVISOR = 4;

// v0.11.11: Renown is fully structural and recalculated from persistent board state.
// Permanent Intrigue cards that provide +1 Wealth contribute +1 Renown while in play.
// The former simulation-only +1 Renown per 5 completed Generations placeholder is disabled.
export const V084_CONFIG = {
  ...base.V084_CONFIG,
  influence: {
    ...base.V084_CONFIG.influence,
    grossIncome: 0,
  },
  renown: {
    ...base.V084_CONFIG.renown,
    gainEveryGenerations: Number.MAX_SAFE_INTEGER,
    gainAmount: 0,
    // Structural Renown has no Population-based cap.
    capPerPopulation: Number.MAX_SAFE_INTEGER,
    populationDivisor: 2,
    productionTierContribution: 1,
    institutionTierContribution: 1,
    permanentWealthCardContribution: 1,
    externalDemandDivisor: EXTERNAL_DEMAND_RENOWN_DIVISOR,
    simulationLongevityEveryGenerations: null,
  },
};

const DEFAULT_IMPERIAL_DEMAND_THRESHOLD = 3;

function clampInt(value, minimum = 0) {
  return Math.max(minimum, Math.floor(Number(value) || 0));
}

function productionTierRenown(state) {
  return (state?.productionSectors ?? []).reduce((sum, sector) => {
    // Raw Food is not a Production Sector in the current design. Keep the
    // legacy food object out of the structural Renown calculation.
    if (sector?.id === "food") return sum;
    return sum + Math.max(0, clampInt(sector?.tier ?? 1, 1) - 1);
  }, 0);
}

function institutionTierRenown(state) {
  return (state?.institutions ?? []).reduce(
    (sum, institution) => sum + Math.max(0, clampInt(institution?.tier ?? 1, 1) - 1),
    0,
  );
}

function permanentWealthCardRenown(state) {
  return (state?.intrigue?.inPlay ?? []).reduce((sum, card) => {
    const meta = INTRIGUE_CARD_META[card?.cardId];
    if (!meta?.permanent || !meta.tags?.includes("wealth")) return sum;
    return sum + V084_CONFIG.renown.permanentWealthCardContribution;
  }, 0);
}

export function calculateRenownBreakdown(state) {
  const population = Math.max(1, clampInt(state?.city?.population ?? 1, 1));
  const populationRenown = Math.floor(population / V084_CONFIG.renown.populationDivisor);
  const productionRenown = productionTierRenown(state);
  const institutionRenown = institutionTierRenown(state);
  const permanentCardRenown = permanentWealthCardRenown(state);
  const total = populationRenown
    + productionRenown
    + institutionRenown
    + permanentCardRenown;

  return {
    population,
    populationRenown,
    productionRenown,
    institutionRenown,
    permanentCardRenown,
    simulationLongevityRenown: 0,
    total,
    simulationOnlyLongevity: false,
  };
}

export function recalculateRenown(state) {
  const breakdown = calculateRenownBreakdown(state);
  if (state?.city) {
    state.city.renown = breakdown.total;
    state.city.renownBreakdown = { ...breakdown };
  }
  return breakdown;
}

function externalDemandFromRenown(renown) {
  return Math.floor(clampInt(renown) / EXTERNAL_DEMAND_RENOWN_DIVISOR);
}

function legacyRenownProxy(renown) {
  // The legacy economy preview internally computes ceil(Renown / 2). Feed it
  // an equivalent temporary Renown so its report resolves to floor(real / 4)
  // without modifying the archived engine.
  const desiredDemand = externalDemandFromRenown(renown);
  return desiredDemand <= 0 ? 0 : desiredDemand * 2 - 1;
}

function applyExternalDemand(state) {
  const demand = externalDemandFromRenown(state?.city?.renown ?? 0);
  for (const sector of state?.productionSectors ?? []) {
    sector.demandThisGeneration ??= {};
    sector.demandThisGeneration.external_markets = demand;
  }
  return demand;
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
        // Ignore legacy fixed-baseline writes. Intervention/threshold are the
        // single source of truth for Imperial production demand in v0.10.2.
      },
    });
    sector.demandThisGeneration = demand;
  }
}

export function applyAutoDemand(state) {
  recalculateRenown(state);
  base.applyAutoDemand(state);
  guardImperialDemand(state);
  applyExternalDemand(state);
}

export function previewEconomy(state) {
  recalculateRenown(state);
  guardImperialDemand(state);

  const realRenown = state.city.renown;
  const proxyRenown = legacyRenownProxy(realRenown);
  state.city.renown = proxyRenown;

  try {
    return base.previewEconomy(state);
  } finally {
    state.city.renown = realRenown;
    guardImperialDemand(state);
    applyExternalDemand(state);
  }
}

export function projectedWealthCapacity(state, playerId) {
  return previewEconomy(state).familyWealth[playerId] ?? base.V084_CONFIG.familyBaseWealth;
}
