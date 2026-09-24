export const BALANCE_CONFIG = {
  rawResourcePrestigePerUsedLand: 1,
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
};
