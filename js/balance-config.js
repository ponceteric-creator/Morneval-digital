export const BALANCE_CONFIG = {
  rawResourcePrestigePerUsedLand: 1,

  wealthPerDemand: {
    population: 0,
    institutions: 1,
    external_markets: 2,
  },

  population: {
    growthOnFullFood: 1,
    famineLossWhenFoodUnmet: 1,
    minimumPopulation: 0,
  },

  squalor: {
    populationPerPoint: 3,
    unmetFoodPenalty: 1,
    maxChangePerGeneration: 1,
  },

  disease: {
    populationLoss: 1,
    chanceBySqualor: {
      0: 0.00,
      1: 0.00,
      2: 0.05,
      3: 0.10,
      4: 0.20,
      5: 0.35,
      6: 0.50,
    },
  },

  populationDemandDivisors: {
    food: 2,
    textiles: 6,
    smithing: 6,
  },

  // Prototype scaling rule: sector Institution demand = ceil(total Institution levels / divisor).
  institutionDemandDivisors: {
    food: 3,
    textiles: 3,
    smithing: 3,
  },

  // Prototype scaling rule: sector External demand = ceil(Renown / divisor).
  externalDemandDivisors: {
    food: 2,
    textiles: 2,
    smithing: 2,
  },
};
