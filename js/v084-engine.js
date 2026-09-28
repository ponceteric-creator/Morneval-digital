export const V084_CONFIG = {
  influence: {
    starting: 6,
    maximum: 10,
    grossIncome: 5,
    erosion: 2,
  },
  familyBaseWealth: 1,
  rewards: {
    cityPrestigePerNeed: 1,
    externalWealthPerNeed: 1,
    imperialUnmetPrestigeLoss: 1,
    imperialFoodAidPrestigeLoss: 1,
    productiveLandPrestige: 1,
  },
  stakeLifetimeValueGenerations: 3,
  renown: {
    gainEveryGenerations: 2,
    gainAmount: 1,
    capPerPopulation: 2,
  },
  hinterland: {
    acquisitionInfluenceCost: 3,
    acquisitionWealthCost: 1,
    farmInfluenceCost: 2,
    farmWealthCost: 1,
    tileCapacity: 2,
    terrainCounts: { forest: 4, meadow: 4, hill: 4 },
  },
  developmentPhases: {
    1: { influenceCost: 1, wealthCost: 1, prestige: 5 },
    2: { influenceCost: 0, wealthCost: 2, prestige: 5 },
    3: { influenceCost: 0, wealthCost: 2, prestige: 5 },
  },
  population: {
    growthOnFullLocalFood: 1,
    minimum: 1,
    rawFoodPerPopulation: 1,
  },
  urban: {
    populationPerTile: 3,
  },
  squalor: {
    maxChangePerGeneration: 1,
  },
  diseaseChanceBySqualor: {
    0: 0,
    1: 0,
    2: 0.05,
    3: 0.10,
    4: 0.20,
    5: 0.35,
    6: 0.50,
  },
  demandDivisors: {
    food: { population: 2, external_markets: 2 },
    textiles: { population: 6, external_markets: 2 },
    smithing: { population: 6, external_markets: 2 },
    materials: { population: 6, external_markets: 2 },
  },
};

const SECTOR_DEFS = [
  { id: "food", name: "Refined Food", inputResourceType: "grain" },
  { id: "textiles", name: "Textiles", inputResourceType: "wool" },
  { id: "smithing", name: "Smithing", inputResourceType: "ore" },
  { id: "materials", name: "Construction Materials", inputResourceType: "wood" },
];

const TERRAIN = {
  forest: { label: "Forest", resourceType: "wood" },
  meadow: { label: "Meadow", resourceType: "wool" },
  hill: { label: "Hill", resourceType: "ore" },
};

const DEMAND_ORDER = ["imperial", "population", "external_markets"];

function clampInt(value, minimum = 0) {
  return Math.max(minimum, Math.floor(Number(value) || 0));
}

function nextRandom(state) {
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function ageRank(age) {
  if (age === "elder") return 3;
  if (age === "mature") return 2;
  return 1;
}

function compareStakeSeniority(a, b) {
  const ageDiff = ageRank(b.age) - ageRank(a.age);
  if (ageDiff !== 0) return ageDiff;
  return a.placementOrder - b.placementOrder;
}

function makeHinterland() {
  return Array.from({ length: 12 }, (_, index) => ({
    id: `territory_${index + 1}`,
    name: `Unexplored Territory ${index + 1}`,
    revealed: false,
    originalTerrain: null,
    terrain: "unexplored",
    development: "unexplored",
    resourceType: null,
    baseCapacity: 0,
    ownerId: null,
    explorationOrder: null,
    acquisitionOrder: null,
    usedCapacityThisGeneration: 0,
    subsistenceUsedThisGeneration: 0,
    refinedUsedThisGeneration: 0,
  }));
}

function makeTerrainPool() {
  const pool = [];
  for (const [terrain, count] of Object.entries(V084_CONFIG.hinterland.terrainCounts)) {
    for (let i = 0; i < count; i += 1) pool.push(terrain);
  }
  return pool;
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const players = familyNames.map((familyName, index) => ({
    id: `family_${index + 1}`,
    familyName,
    prestige: 0,
    influence: V084_CONFIG.influence.starting,
    maxInfluence: V084_CONFIG.influence.maximum,
    productionStakes: [],
    wealthGeneratedThisGeneration: V084_CONFIG.familyBaseWealth,
    wealthCommittedThisGeneration: 0,
    lastWealthCommitted: 0,
    lastWealthAvailable: V084_CONFIG.familyBaseWealth,
    lastWealthShortfall: 0,
  }));

  const productionSectors = SECTOR_DEFS.map(def => ({
    ...def,
    tier: 1,
    developmentPhase: 0,
    developmentTargetTier: 2,
    lastDevelopmentGeneration: null,
    lastDevelopmentContributorId: null,
    demandThisGeneration: {
      population: 0,
      imperial: def.id === "food" ? 0 : 1,
      external_markets: 0,
    },
  }));

  const state = {
    generation: 1,
    phase: "action_phase",
    firstPlayerId: players[0]?.id ?? null,
    rngState: 246813579,
    city: {
      population: 1,
      squalor: 0,
      order: 0,
      force: 0,
      economicStrength: 0,
      renown: 0,
      religionArcane: 0,
      militaryMercantile: 0,
      urbanTiles: 1,
      urbanCapacity: V084_CONFIG.urban.populationPerTile,
    },
    players,
    productionSectors,
    lands: makeHinterland(),
    terrainPool: makeTerrainPool(),
    nextProductionStakeOrder: 1,
    nextExplorationOrder: 1,
    history: [],
  };

  applyAutoDemand(state);
  return state;
}

export function getTurnOrder(state) {
  if (!state.players.length) return [];
  const firstIndex = Math.max(0, state.players.findIndex(player => player.id === state.firstPlayerId));
  if (firstIndex === 0) return [...state.players];
  return [...state.players.slice(firstIndex), ...state.players.slice(0, firstIndex)];
}

export function getDemandPriorityGroups(state) {
  if (state.city.militaryMercantile < 0) {
    return [["population"], ["imperial"], ["external_markets"]];
  }
  if (state.city.militaryMercantile > 0) {
    return [["external_markets"], ["imperial"], ["population"]];
  }
  return [["imperial"], ["population"], ["external_markets"]];
}

export function applyAutoDemand(state) {
  const population = clampInt(state.city.population, 1);
  const renown = clampInt(state.city.renown);

  for (const sector of state.productionSectors) {
    const divisors = V084_CONFIG.demandDivisors[sector.id];
    sector.demandThisGeneration.population = population > 0
      ? Math.ceil(population / divisors.population)
      : 0;
    sector.demandThisGeneration.imperial = sector.id === "food" ? 0 : 1;
    sector.demandThisGeneration.external_markets = renown > 0
      ? Math.ceil(renown / divisors.external_markets)
      : 0;
  }
}

function allocateDemand(supply, demand, priorityGroups) {
  let remaining = Math.max(0, supply);
  const served = { population: 0, imperial: 0, external_markets: 0 };
  const sequence = [];

  for (const group of priorityGroups) {
    const ordered = DEMAND_ORDER.filter(category => group.includes(category));
    for (const category of ordered) {
      if (remaining <= 0) break;
      const requested = Math.max(0, Number(demand[category]) || 0);
      const amount = Math.min(requested, remaining);
      served[category] = amount;
      for (let i = 0; i < amount; i += 1) sequence.push(category);
      remaining -= amount;
    }
  }

  return {
    requested: {
      population: Math.max(0, Number(demand.population) || 0),
      imperial: Math.max(0, Number(demand.imperial) || 0),
      external_markets: Math.max(0, Number(demand.external_markets) || 0),
    },
    served,
    unmet: {
      population: Math.max(0, (Number(demand.population) || 0) - served.population),
      imperial: Math.max(0, (Number(demand.imperial) || 0) - served.imperial),
      external_markets: Math.max(0, (Number(demand.external_markets) || 0) - served.external_markets),
    },
    serviceSequence: sequence,
    totalServed: sequence.length,
  };
}

function farmLands(state) {
  return state.lands
    .filter(land =>
      land.revealed
      && land.development === "farm"
      && land.ownerId
      && land.ownerId !== "city")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999));
}

export function getFoodSubsistenceStatus(state) {
  const farms = farmLands(state);
  const requested = Math.max(
    V084_CONFIG.population.minimum,
    clampInt(state.city.population, V084_CONFIG.population.minimum),
  ) * V084_CONFIG.population.rawFoodPerPopulation;
  const localCapacity = farms.reduce((sum, land) => sum + Math.max(0, land.baseCapacity), 0);
  const localServed = Math.min(requested, localCapacity);
  return {
    requested,
    localCapacity,
    localServed,
    imperialAid: Math.max(0, requested - localServed),
    surplusForRefining: Math.max(0, localCapacity - localServed),
  };
}

function farmResidualSources(state) {
  let subsistenceRemaining = getFoodSubsistenceStatus(state).localServed;
  return farmLands(state).map(land => {
    const subsistenceUsed = Math.min(land.baseCapacity, subsistenceRemaining);
    subsistenceRemaining -= subsistenceUsed;
    return {
      land,
      subsistenceUsed,
      availableForRefining: Math.max(0, land.baseCapacity - subsistenceUsed),
    };
  });
}

export function sectorResourceCapacity(state, sectorId) {
  if (sectorId === "food") {
    return getFoodSubsistenceStatus(state).surplusForRefining;
  }
  const sector = state.productionSectors.find(item => item.id === sectorId);
  if (!sector) return 0;
  return state.lands
    .filter(land =>
      land.revealed
      && land.development !== "urban"
      && land.ownerId
      && land.ownerId !== "city"
      && land.resourceType === sector.inputResourceType)
    .reduce((sum, land) => sum + Math.max(0, land.baseCapacity), 0);
}

export function getRawProductionBySector(state) {
  const totals = { food: 0, textiles: 0, smithing: 0, materials: 0 };
  for (const land of state.lands) {
    if (!land.revealed || land.development === "urban" || !land.ownerId || land.ownerId === "city") continue;
    const cap = Math.max(0, land.baseCapacity);
    if (land.resourceType === "grain") totals.food += cap;
    if (land.resourceType === "wool") totals.textiles += cap;
    if (land.resourceType === "ore") totals.smithing += cap;
    if (land.resourceType === "wood") totals.materials += cap;
  }
  return totals;
}

export function getExplorationPoolCounts(state) {
  const counts = { forest: 0, meadow: 0, hill: 0 };
  for (const terrain of state.terrainPool) counts[terrain] = (counts[terrain] ?? 0) + 1;
  return counts;
}

function sectorDemandTotal(sector) {
  return (sector.demandThisGeneration.population || 0)
    + (sector.demandThisGeneration.imperial || 0)
    + (sector.demandThisGeneration.external_markets || 0);
}

function resourceSourcesForSector(state, sectorId) {
  if (sectorId === "food") {
    return farmResidualSources(state)
      .filter(item => item.availableForRefining > 0)
      .map(item => ({
        land: item.land,
        availableCapacity: item.availableForRefining,
        subsistenceUsed: item.subsistenceUsed,
      }));
  }

  const sector = state.productionSectors.find(item => item.id === sectorId);
  if (!sector) return [];
  return state.lands
    .filter(land =>
      land.revealed
      && land.development !== "urban"
      && land.ownerId
      && land.ownerId !== "city"
      && land.resourceType === sector.inputResourceType)
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999))
    .map(land => ({ land, availableCapacity: land.baseCapacity, subsistenceUsed: 0 }));
}

function calculateEconomy(state, mutate = false) {
  applyAutoDemand(state);
  const priorities = getDemandPriorityGroups(state);
  const familyWealth = Object.fromEntries(
    state.players.map(player => [player.id, V084_CONFIG.familyBaseWealth]),
  );
  const reports = [];

  if (mutate) {
    for (const player of state.players) {
      player.wealthGeneratedThisGeneration = V084_CONFIG.familyBaseWealth;
      for (const stake of player.productionStakes) {
        stake.servedThisGeneration = false;
        stake.servedDemandCategory = null;
        stake.wealthProducedThisGeneration = 0;
      }
    }
    for (const land of state.lands) {
      land.usedCapacityThisGeneration = 0;
      land.subsistenceUsedThisGeneration = 0;
      land.refinedUsedThisGeneration = 0;
    }
    for (const source of farmResidualSources(state)) {
      source.land.subsistenceUsedThisGeneration = source.subsistenceUsed;
      source.land.usedCapacityThisGeneration = source.subsistenceUsed;
    }
  }

  for (const sector of state.productionSectors) {
    const stakes = state.players
      .flatMap(player => player.productionStakes)
      .filter(stake => stake.sectorId === sector.id)
      .sort(compareStakeSeniority);
    const slotCapacity = sector.tier * 3;
    const stakeSupply = Math.min(stakes.length, slotCapacity);
    const sources = resourceSourcesForSector(state, sector.id);
    const totalResourceCapacity = sources.reduce((sum, source) => sum + source.availableCapacity, 0);
    const resourceLimitedSupply = Math.min(stakeSupply, totalResourceCapacity);
    const demand = allocateDemand(resourceLimitedSupply, sector.demandThisGeneration, priorities);
    const servedStakes = stakes.slice(0, demand.totalServed);

    for (let i = 0; i < servedStakes.length; i += 1) {
      const stake = servedStakes[i];
      const category = demand.serviceSequence[i];
      const wealth = category === "external_markets"
        ? V084_CONFIG.rewards.externalWealthPerNeed
        : 0;
      familyWealth[stake.ownerId] = (familyWealth[stake.ownerId] ?? V084_CONFIG.familyBaseWealth) + wealth;
      if (mutate) {
        stake.servedThisGeneration = true;
        stake.servedDemandCategory = category;
        stake.wealthProducedThisGeneration = wealth;
      }
    }

    let remainingResourceUse = demand.totalServed;
    const rawResourcesUsed = [];
    for (const source of sources) {
      const usedCapacity = Math.min(source.availableCapacity, remainingResourceUse);
      remainingResourceUse -= usedCapacity;
      if (mutate) {
        source.land.refinedUsedThisGeneration += usedCapacity;
        source.land.usedCapacityThisGeneration += usedCapacity;
      }
      rawResourcesUsed.push({
        landId: source.land.id,
        landName: source.land.name,
        resourceType: source.land.resourceType,
        ownerId: source.land.ownerId,
        availableCapacity: source.availableCapacity,
        usedCapacity,
        subsistenceUsed: source.subsistenceUsed,
      });
    }

    reports.push({
      sectorId: sector.id,
      sectorName: sector.name,
      tier: sector.tier,
      slotCapacity,
      stakeSupply,
      totalResourceCapacity,
      resourceLimitedSupply,
      actualProduction: demand.totalServed,
      demand,
      servedStakes: servedStakes.map((stake, index) => ({
        stakeId: stake.id,
        ownerId: stake.ownerId,
        age: stake.age,
        placementOrder: stake.placementOrder,
        demandCategory: demand.serviceSequence[index],
        wealthGenerated: demand.serviceSequence[index] === "external_markets"
          ? V084_CONFIG.rewards.externalWealthPerNeed
          : 0,
      })),
      rawResourcesUsed,
    });
  }

  if (mutate) {
    for (const player of state.players) {
      player.wealthGeneratedThisGeneration = familyWealth[player.id] ?? V084_CONFIG.familyBaseWealth;
    }
  }

  return {
    reports,
    familyWealth,
    subsistence: getFoodSubsistenceStatus(state),
  };
}

export function previewEconomy(state) {
  return calculateEconomy(state, false);
}

export function projectedWealthCapacity(state, playerId) {
  return previewEconomy(state).familyWealth[playerId] ?? V084_CONFIG.familyBaseWealth;
}

function availableProjectedWealth(state, playerId) {
  const player = state.players.find(item => item.id === playerId);
  if (!player) return 0;
  return Math.max(0, projectedWealthCapacity(state, playerId) - player.wealthCommittedThisGeneration);
}

function commitWealth(player, amount) {
  player.wealthCommittedThisGeneration += amount;
}

function productionStakeCapacity(state, sectorId) {
  const sector = state.productionSectors.find(item => item.id === sectorId);
  return sector ? sector.tier : 0;
}

function occupancyByAge(state, sectorId) {
  const result = { young: 0, mature: 0, elder: 0, total: 0 };
  for (const stake of state.players.flatMap(player => player.productionStakes)) {
    if (stake.sectorId !== sectorId) continue;
    result[stake.age] += 1;
    result.total += 1;
  }
  return result;
}

export function getSectorOccupancy(state, sectorId) {
  return occupancyByAge(state, sectorId);
}

function addProductionStake(state, playerId, sectorId) {
  const sector = state.productionSectors.find(item => item.id === sectorId);
  const occupancy = occupancyByAge(state, sectorId);
  if (!sector || occupancy.young >= productionStakeCapacity(state, sectorId)) return null;
  const player = state.players.find(item => item.id === playerId);
  if (!player) return null;

  const stake = {
    id: `stake_${state.nextProductionStakeOrder}`,
    ownerId: playerId,
    sectorId,
    age: "young",
    placementOrder: state.nextProductionStakeOrder,
    servedThisGeneration: false,
    servedDemandCategory: null,
    wealthProducedThisGeneration: 0,
  };
  state.nextProductionStakeOrder += 1;
  player.productionStakes.push(stake);
  return stake;
}

function committedBidInfluence(auctions, playerId, exceptAuctionId = null) {
  return auctions.reduce((sum, auction) => {
    if (auction.auctionId === exceptAuctionId) return sum;
    return auction.leaderId === playerId ? sum + auction.currentBid : sum;
  }, 0);
}

function freeInfluenceAfterBids(state, auctions, player) {
  return Math.max(0, player.influence - committedBidInfluence(auctions, player.id));
}

function canPayNonBidAction(state, auctions, player, influenceCost, wealthCost) {
  return freeInfluenceAfterBids(state, auctions, player) >= influenceCost
    && availableProjectedWealth(state, player.id) >= wealthCost;
}

function revealTerrain(state, land) {
  if (land.revealed || !state.terrainPool.length) return null;
  const roll = nextRandom(state);
  const index = Math.min(state.terrainPool.length - 1, Math.floor(roll * state.terrainPool.length));
  const terrain = state.terrainPool.splice(index, 1)[0];
  const def = TERRAIN[terrain];
  land.revealed = true;
  land.originalTerrain = terrain;
  land.terrain = terrain;
  land.development = "natural";
  land.resourceType = def.resourceType;
  land.baseCapacity = V084_CONFIG.hinterland.tileCapacity;
  land.name = `${def.label} · Territory ${land.id.split("_").at(-1)}`;
  return { terrain, resourceType: def.resourceType, roll };
}

function exploreLand(state, player, land, auctions, sequence) {
  const { acquisitionInfluenceCost, acquisitionWealthCost } = V084_CONFIG.hinterland;
  if (land.revealed || land.ownerId) return null;
  if (!canPayNonBidAction(state, auctions, player, acquisitionInfluenceCost, acquisitionWealthCost)) return null;

  player.influence -= acquisitionInfluenceCost;
  commitWealth(player, acquisitionWealthCost);
  const reveal = revealTerrain(state, land);
  if (!reveal) return null;
  land.ownerId = player.id;
  land.explorationOrder = state.nextExplorationOrder;
  land.acquisitionOrder = state.nextExplorationOrder;
  state.nextExplorationOrder += 1;

  return {
    sequence,
    type: "hinterland_exploration",
    playerId: player.id,
    landId: land.id,
    explorationOrder: land.explorationOrder,
    terrain: reveal.terrain,
    resourceType: reveal.resourceType,
    randomRoll: reveal.roll,
    influenceCost: acquisitionInfluenceCost,
    wealthCost: acquisitionWealthCost,
  };
}

function convertLandToFarm(state, player, land, auctions, sequence) {
  const { farmInfluenceCost, farmWealthCost } = V084_CONFIG.hinterland;
  if (!land.revealed || land.ownerId !== player.id || land.development !== "natural") return null;
  if (!canPayNonBidAction(state, auctions, player, farmInfluenceCost, farmWealthCost)) return null;

  player.influence -= farmInfluenceCost;
  commitWealth(player, farmWealthCost);
  const previousResourceType = land.resourceType;
  land.development = "farm";
  land.terrain = "farm";
  land.resourceType = "grain";

  return {
    sequence,
    type: "farm_conversion",
    playerId: player.id,
    landId: land.id,
    originalTerrain: land.originalTerrain,
    previousResourceType,
    influenceCost: farmInfluenceCost,
    wealthCost: farmWealthCost,
  };
}

function nextDevelopmentCost(sector) {
  if (sector.tier >= 3) return null;
  const phase = sector.developmentPhase + 1;
  return { phase, ...V084_CONFIG.developmentPhases[phase] };
}

function advanceDevelopment(state, player, sector, auctions, sequence) {
  const cost = nextDevelopmentCost(sector);
  if (!cost) return null;
  if (sector.lastDevelopmentGeneration === state.generation) return null;
  if (!canPayNonBidAction(state, auctions, player, cost.influenceCost, cost.wealthCost)) return null;

  const targetTier = sector.tier + 1;
  player.influence -= cost.influenceCost;
  commitWealth(player, cost.wealthCost);
  player.prestige += cost.prestige;
  sector.developmentPhase = cost.phase;
  sector.developmentTargetTier = targetTier;
  sector.lastDevelopmentGeneration = state.generation;
  sector.lastDevelopmentContributorId = player.id;

  let tierActivated = false;
  if (cost.phase === 3) {
    sector.tier = targetTier;
    sector.developmentPhase = 0;
    sector.developmentTargetTier = sector.tier < 3 ? sector.tier + 1 : null;
    tierActivated = true;
  }

  return {
    sequence,
    type: "sector_development",
    playerId: player.id,
    sectorId: sector.id,
    phase: cost.phase,
    targetTier,
    influenceCost: cost.influenceCost,
    wealthCost: cost.wealthCost,
    prestige: cost.prestige,
    tierActivated,
    newTier: sector.tier,
  };
}

function futureSlotCapacity(sector) {
  return sector.developmentPhase > 0 && sector.tier < 3
    ? (sector.tier + 1) * 3
    : sector.tier * 3;
}

function resourcePressure(state, sector) {
  const demand = sectorDemandTotal(sector);
  const resourceCapacity = sectorResourceCapacity(state, sector.id);
  const desiredSupply = Math.min(demand, futureSlotCapacity(sector));
  return {
    demand,
    resourceCapacity,
    desiredSupply,
    deficit: Math.max(0, desiredSupply - resourceCapacity),
  };
}

function buildLandCandidate(state, player, auctions, sequence) {
  const subsistence = getFoodSubsistenceStatus(state);
  const convertible = state.lands
    .filter(land => land.revealed && land.ownerId === player.id && land.development === "natural")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999));

  if (subsistence.imperialAid > 0 && convertible.length && canPayNonBidAction(
    state,
    auctions,
    player,
    V084_CONFIG.hinterland.farmInfluenceCost,
    V084_CONFIG.hinterland.farmWealthCost,
  )) {
    return {
      score: 140 + subsistence.imperialAid * 10,
      execute: () => convertLandToFarm(state, player, convertible[0], auctions, sequence),
    };
  }

  const pressures = state.productionSectors.map(sector => resourcePressure(state, sector));
  const maxDeficit = Math.max(0, ...pressures.map(item => item.deficit));
  const unexplored = state.lands.find(land => !land.revealed && !land.ownerId);
  const shouldExplore = subsistence.imperialAid > 0
    || maxDeficit > 0
    || state.lands.every(land => !land.revealed);

  if (unexplored && shouldExplore && canPayNonBidAction(
    state,
    auctions,
    player,
    V084_CONFIG.hinterland.acquisitionInfluenceCost,
    V084_CONFIG.hinterland.acquisitionWealthCost,
  )) {
    return {
      score: 115 + subsistence.imperialAid * 8 + maxDeficit * 5,
      execute: () => exploreLand(state, player, unexplored, auctions, sequence),
    };
  }

  if (resourcePressure(state, state.productionSectors.find(s => s.id === "food")).deficit > 0
      && convertible.length
      && canPayNonBidAction(
        state,
        auctions,
        player,
        V084_CONFIG.hinterland.farmInfluenceCost,
        V084_CONFIG.hinterland.farmWealthCost,
      )) {
    return {
      score: 108,
      execute: () => convertLandToFarm(state, player, convertible[0], auctions, sequence),
    };
  }

  return null;
}

function buildDevelopmentCandidate(state, player, auctions, sequence) {
  const candidates = [];
  for (const sector of state.productionSectors) {
    if (sector.tier >= 3 || sector.lastDevelopmentGeneration === state.generation) continue;
    const demand = sectorDemandTotal(sector);
    const currentSlotCapacity = sector.tier * 3;
    const occupancy = occupancyByAge(state, sector.id).total;
    const needsExpansion = demand > currentSlotCapacity || occupancy >= currentSlotCapacity;
    if (!needsExpansion && sector.developmentPhase === 0) continue;
    const cost = nextDevelopmentCost(sector);
    if (!cost || !canPayNonBidAction(state, auctions, player, cost.influenceCost, cost.wealthCost)) continue;
    const pressure = Math.max(0, demand - currentSlotCapacity);
    candidates.push({
      sector,
      score: 90 + pressure * 10 + (sector.developmentPhase > 0 ? 8 : 0),
    });
  }
  candidates.sort((a, b) =>
    b.score - a.score
    || state.productionSectors.indexOf(a.sector) - state.productionSectors.indexOf(b.sector));
  const chosen = candidates[0];
  if (!chosen) return null;
  return {
    score: chosen.score,
    execute: () => advanceDevelopment(state, player, chosen.sector, auctions, sequence),
  };
}

function estimateStakeMarket(state, sectorId, leadingSlotsInSector = 0) {
  const sector = state.productionSectors.find(item => item.id === sectorId);
  if (!sector) return null;
  const currentStakes = state.players
    .flatMap(player => player.productionStakes)
    .filter(stake => stake.sectorId === sectorId).length;
  const supplyBefore = currentStakes + leadingSlotsInSector;
  const capacity = sectorResourceCapacity(state, sectorId);
  if (supplyBefore >= capacity) return null;
  const allocation = allocateDemand(
    Math.min(supplyBefore + 1, capacity),
    sector.demandThisGeneration,
    getDemandPriorityGroups(state),
  );
  return allocation.serviceSequence[supplyBefore] ?? null;
}

function stakeStrategicValue(category) {
  if (!category) return 0;
  const immediate = category === "external_markets"
    ? V084_CONFIG.rewards.externalWealthPerNeed
    : category === "population"
      ? V084_CONFIG.rewards.cityPrestigePerNeed
      : category === "imperial"
        ? V084_CONFIG.rewards.imperialUnmetPrestigeLoss
        : 0;
  return immediate * V084_CONFIG.stakeLifetimeValueGenerations;
}

function ensureAuctionSlots(state, auctions) {
  for (const sector of state.productionSectors) {
    const occupancy = occupancyByAge(state, sector.id);
    const capacity = productionStakeCapacity(state, sector.id);
    const existingForSector = auctions.filter(auction => auction.sectorId === sector.id);
    const needed = Math.max(0, capacity - occupancy.young);
    while (existingForSector.length < needed) {
      const slotNumber = occupancy.young + existingForSector.length + 1;
      const auction = {
        auctionId: `${sector.id}:young:${slotNumber}:g${state.generation}`,
        sectorId: sector.id,
        slotNumber,
        currentBid: 0,
        leaderId: null,
        passedPlayerIds: new Set(),
        closed: false,
        turns: [],
      };
      auctions.push(auction);
      existingForSector.push(auction);
    }
  }
}

function updateAuctionClosedState(state, auction) {
  if (auction.closed) return;
  if (!auction.leaderId) {
    if (auction.passedPlayerIds.size >= state.players.length) auction.closed = true;
    return;
  }
  const challengers = state.players.filter(player =>
    player.id !== auction.leaderId && !auction.passedPlayerIds.has(player.id));
  if (!challengers.length) auction.closed = true;
}

function bidValueForAuction(state, auctions, player, auction) {
  const leadingSlots = auctions.filter(item =>
    item.sectorId === auction.sectorId
    && item.auctionId !== auction.auctionId
    && item.leaderId).length;
  const category = estimateStakeMarket(state, auction.sectorId, leadingSlots);
  return { category, strategicValue: stakeStrategicValue(category) };
}

function buildAuctionCandidate(state, player, auctions, sequence) {
  const freeInfluence = freeInfluenceAfterBids(state, auctions, player);
  if (freeInfluence <= 0) return null;

  const openings = [];
  const raises = [];
  for (const auction of auctions) {
    if (auction.closed || auction.passedPlayerIds.has(player.id) || auction.leaderId === player.id) continue;
    const { category, strategicValue } = bidValueForAuction(state, auctions, player, auction);
    if (auction.currentBid === 0) {
      if (strategicValue >= 1 && freeInfluence >= 1) {
        openings.push({ auction, category, strategicValue, bid: 1, score: 70 + strategicValue });
      }
    } else {
      const nextBid = auction.currentBid + 1;
      const committedElsewhere = committedBidInfluence(auctions, player.id, auction.auctionId);
      if (nextBid <= strategicValue && committedElsewhere + nextBid <= player.influence) {
        raises.push({
          auction,
          category,
          strategicValue,
          bid: nextBid,
          score: 50 + (strategicValue - nextBid),
        });
      }
    }
  }

  openings.sort((a, b) =>
    b.strategicValue - a.strategicValue || auctions.indexOf(a.auction) - auctions.indexOf(b.auction));
  raises.sort((a, b) =>
    b.score - a.score
    || b.strategicValue - a.strategicValue
    || auctions.indexOf(a.auction) - auctions.indexOf(b.auction));
  const chosen = openings[0] ?? raises[0];
  if (!chosen) return null;

  return {
    score: chosen.score,
    execute: () => {
      chosen.auction.currentBid = chosen.bid;
      chosen.auction.leaderId = player.id;
      const action = {
        sequence,
        type: "bid",
        playerId: player.id,
        sectorId: chosen.auction.sectorId,
        auctionId: chosen.auction.auctionId,
        bid: chosen.bid,
        expectedCategory: chosen.category,
      };
      chosen.auction.turns.push(action);
      updateAuctionClosedState(state, chosen.auction);
      return action;
    },
  };
}

function buildPassCandidate(state, player, auctions, sequence) {
  const eligible = auctions.filter(auction =>
    !auction.closed
    && auction.leaderId !== player.id
    && !auction.passedPlayerIds.has(player.id));
  if (!eligible.length) return null;

  const auction = eligible[0];
  return {
    score: 1,
    execute: () => {
      auction.passedPlayerIds.add(player.id);
      const action = {
        sequence,
        type: "pass_auction",
        playerId: player.id,
        sectorId: auction.sectorId,
        auctionId: auction.auctionId,
        bid: auction.currentBid,
      };
      auction.turns.push(action);
      updateAuctionClosedState(state, auction);
      return action;
    },
  };
}

function chooseAutomatedAction(state, player, auctions, sequence) {
  ensureAuctionSlots(state, auctions);
  const candidates = [
    buildLandCandidate(state, player, auctions, sequence),
    buildDevelopmentCandidate(state, player, auctions, sequence),
    buildAuctionCandidate(state, player, auctions, sequence),
  ].filter(Boolean);

  if (candidates.length) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].execute();
  }
  return buildPassCandidate(state, player, auctions, sequence)?.execute() ?? null;
}

function finalizeAuctions(state, auctions) {
  for (const auction of auctions) updateAuctionClosedState(state, auction);
  return auctions.map(auction => {
    let winnerId = null;
    let winningBid = 0;
    let stakeId = null;
    if (auction.leaderId && auction.currentBid > 0) {
      const winner = state.players.find(player => player.id === auction.leaderId);
      if (winner && winner.influence >= auction.currentBid) {
        winner.influence -= auction.currentBid;
        const stake = addProductionStake(state, winner.id, auction.sectorId);
        if (stake) {
          winnerId = winner.id;
          winningBid = auction.currentBid;
          stakeId = stake.id;
        }
      }
    }
    return {
      auctionId: auction.auctionId,
      sectorId: auction.sectorId,
      slotNumber: auction.slotNumber,
      winnerId,
      winningBid,
      stakeId,
      turns: auction.turns,
      closed: auction.closed,
    };
  });
}

export function runAutomatedActionPhase(state) {
  applyAutoDemand(state);
  for (const player of state.players) player.wealthCommittedThisGeneration = 0;
  const turnOrder = getTurnOrder(state);
  const auctions = [];
  ensureAuctionSlots(state, auctions);
  const actions = [];
  let cursor = 0;
  let sequence = 1;
  let noActionStreak = 0;
  let guard = 0;

  while (guard++ < 3000) {
    if (!turnOrder.length) break;
    const player = turnOrder[cursor % turnOrder.length];
    cursor += 1;
    const action = chooseAutomatedAction(state, player, auctions, sequence++);
    if (action) {
      actions.push(action);
      noActionStreak = 0;
    } else {
      noActionStreak += 1;
    }

    ensureAuctionSlots(state, auctions);
    for (const auction of auctions) updateAuctionClosedState(state, auction);
    const allAuctionsClosed = auctions.every(auction => auction.closed);
    if (allAuctionsClosed && noActionStreak >= turnOrder.length) break;
  }

  return { actions, auctions: finalizeAuctions(state, auctions) };
}

function grantGrossInfluenceIncome(state) {
  return state.players.map(player => {
    const before = player.influence;
    player.influence = Math.min(
      player.maxInfluence,
      player.influence + V084_CONFIG.influence.grossIncome,
    );
    return {
      playerId: player.id,
      before,
      grossIncome: V084_CONFIG.influence.grossIncome,
      actuallyReceived: player.influence - before,
      afterIncome: player.influence,
    };
  });
}

function erodeInfluence(state) {
  for (const player of state.players) {
    player.influence = Math.max(0, player.influence - V084_CONFIG.influence.erosion);
  }
}

function ageProductionStakes(state) {
  for (const player of state.players) {
    player.productionStakes = player.productionStakes
      .filter(stake => stake.age !== "elder")
      .map(stake => ({
        ...stake,
        age: stake.age === "young" ? "mature" : "elder",
        servedThisGeneration: false,
        servedDemandCategory: null,
        wealthProducedThisGeneration: 0,
      }));
  }
}

function moveToward(current, target, maxStep) {
  if (current === target) return current;
  return current < target
    ? Math.min(target, current + maxStep)
    : Math.max(target, current - maxStep);
}

function diseaseChance(squalor) {
  const levels = Object.keys(V084_CONFIG.diseaseChanceBySqualor).map(Number).sort((a, b) => a - b);
  let selected = 0;
  for (const level of levels) {
    if (squalor >= level) selected = level;
  }
  return V084_CONFIG.diseaseChanceBySqualor[selected] ?? 0;
}

function applyPrestigeLossToAll(state, amount, reason) {
  const losses = [];
  for (const player of state.players) {
    const before = player.prestige;
    player.prestige = Math.max(0, player.prestige - amount);
    losses.push({
      playerId: player.id,
      reason,
      requestedLoss: amount,
      actualLoss: before - player.prestige,
    });
  }
  return losses;
}

function chooseExpansionLand(state) {
  return state.lands
    .filter(land => land.revealed && land.development !== "urban")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999))[0] ?? null;
}

function absorbLandIntoCity(state, generation) {
  const land = chooseExpansionLand(state);
  if (!land) return null;

  const event = {
    landId: land.id,
    landName: land.name,
    explorationOrder: land.explorationOrder,
    originalTerrain: land.originalTerrain,
    previousDevelopment: land.development,
    previousOwnerId: land.ownerId,
    previousResourceType: land.resourceType,
    lostCapacity: Math.max(0, Number(land.baseCapacity) || 0),
  };

  land.formerOwnerId = land.ownerId;
  land.formerResourceType = land.resourceType;
  land.formerCapacity = land.baseCapacity;
  land.ownerId = "city";
  land.development = "urban";
  land.terrain = "urban";
  land.resourceType = "urban";
  land.baseCapacity = 0;
  land.usedCapacityThisGeneration = 0;
  land.urbanizedGeneration = generation;

  return event;
}

export function getUrbanStatus(state) {
  const urbanTiles = Math.max(1, Number(state.city.urbanTiles) || 1);
  const urbanCapacity = urbanTiles * V084_CONFIG.urban.populationPerTile;
  const population = Math.max(V084_CONFIG.population.minimum, Number(state.city.population) || 1);
  return {
    urbanTiles,
    urbanCapacity,
    population,
    overcrowding: Math.max(0, population - urbanCapacity),
    requiredUrbanTiles: Math.max(1, Math.ceil(population / V084_CONFIG.urban.populationPerTile)),
  };
}

function resolveProductionAndCity(state) {
  const generation = state.generation;
  const populationBefore = state.city.population;
  const squalorBefore = state.city.squalor;
  const urbanBefore = getUrbanStatus(state);
  const prestigeBefore = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));

  state.phase = "production_resolution";
  const { reports, familyWealth, subsistence } = calculateEconomy(state, true);

  const populationPrestigeAwards = [];
  for (const report of reports) {
    for (const stake of report.servedStakes) {
      if (stake.demandCategory !== "population") continue;
      const player = state.players.find(item => item.id === stake.ownerId);
      if (!player) continue;
      player.prestige += V084_CONFIG.rewards.cityPrestigePerNeed;
      populationPrestigeAwards.push({
        playerId: player.id,
        sectorId: report.sectorId,
        amount: V084_CONFIG.rewards.cityPrestigePerNeed,
      });
    }
  }

  const landPrestigeAwards = [];
  for (const land of state.lands) {
    if (!land.ownerId || land.ownerId === "city" || land.usedCapacityThisGeneration <= 0) continue;
    const player = state.players.find(item => item.id === land.ownerId);
    if (!player) continue;
    player.prestige += V084_CONFIG.rewards.productiveLandPrestige;
    landPrestigeAwards.push({
      playerId: player.id,
      landId: land.id,
      landName: land.name,
      amount: V084_CONFIG.rewards.productiveLandPrestige,
    });
  }

  const imperialUnmetTotal = reports.reduce(
    (sum, report) => sum + (report.demand.unmet.imperial || 0),
    0,
  );
  const imperialDemandPenaltyApplied = imperialUnmetTotal > 0;
  const imperialDemandPrestigeLosses = imperialDemandPenaltyApplied
    ? applyPrestigeLossToAll(
        state,
        V084_CONFIG.rewards.imperialUnmetPrestigeLoss,
        "imperial_demand_unmet",
      )
    : [];

  const imperialFoodAidUsed = subsistence.imperialAid > 0;
  const imperialFoodPrestigeLosses = imperialFoodAidUsed
    ? applyPrestigeLossToAll(
        state,
        V084_CONFIG.rewards.imperialFoodAidPrestigeLoss,
        "imperial_food_aid",
      )
    : [];

  const wealthCommitments = state.players.map(player => {
    const gross = familyWealth[player.id] ?? V084_CONFIG.familyBaseWealth;
    const committed = player.wealthCommittedThisGeneration;
    const available = Math.max(0, gross - committed);
    const shortfall = Math.max(0, committed - gross);
    player.lastWealthCommitted = committed;
    player.lastWealthAvailable = available;
    player.lastWealthShortfall = shortfall;
    return { playerId: player.id, gross, committed, available, shortfall };
  });

  const growth = subsistence.imperialAid === 0
    ? V084_CONFIG.population.growthOnFullLocalFood
    : 0;
  const populationBeforeDisease = Math.max(
    V084_CONFIG.population.minimum,
    populationBefore + growth,
  );

  const overcrowdingBeforeExpansion = Math.max(
    0,
    populationBeforeDisease - urbanBefore.urbanCapacity,
  );
  const squalorTarget = overcrowdingBeforeExpansion;
  state.city.squalor = moveToward(
    state.city.squalor,
    squalorTarget,
    V084_CONFIG.squalor.maxChangePerGeneration,
  );

  const diseaseProbability = diseaseChance(state.city.squalor);
  const diseaseRoll = nextRandom(state);
  const canLosePopulation = populationBeforeDisease > V084_CONFIG.population.minimum;
  const diseaseOccurred = canLosePopulation && diseaseRoll < diseaseProbability;
  const diseaseLoss = diseaseOccurred ? 1 : 0;
  state.city.population = Math.max(
    V084_CONFIG.population.minimum,
    populationBeforeDisease - diseaseLoss,
  );

  const requiredUrbanTiles = Math.max(
    1,
    Math.ceil(state.city.population / V084_CONFIG.urban.populationPerTile),
  );
  let tilesToAbsorb = Math.max(0, requiredUrbanTiles - urbanBefore.urbanTiles);
  const expansionEvents = [];
  while (tilesToAbsorb > 0) {
    const event = absorbLandIntoCity(state, generation);
    if (!event) break;
    expansionEvents.push(event);
    tilesToAbsorb -= 1;
  }
  state.city.urbanTiles = urbanBefore.urbanTiles + expansionEvents.length;
  state.city.urbanCapacity = state.city.urbanTiles * V084_CONFIG.urban.populationPerTile;

  state.phase = "influence_erosion";
  erodeInfluence(state);
  state.phase = "stake_aging";
  ageProductionStakes(state);

  return {
    generation,
    populationBefore,
    populationBeforeDisease,
    populationAfter: state.city.population,
    growth,
    famineLoss: 0,
    rawFoodRequested: subsistence.requested,
    rawFoodLocalCapacity: subsistence.localCapacity,
    rawFoodLocalServed: subsistence.localServed,
    imperialFoodAid: subsistence.imperialAid,
    imperialFoodAidUsed,
    imperialFoodPrestigeLosses,
    squalorBefore,
    overcrowdingBeforeExpansion,
    squalorTarget,
    squalorAfter: state.city.squalor,
    diseaseProbability,
    diseaseRoll,
    diseaseOccurred,
    diseaseLoss,
    urbanTilesBefore: urbanBefore.urbanTiles,
    urbanCapacityBefore: urbanBefore.urbanCapacity,
    requiredUrbanTiles,
    expansionEvents,
    urbanTilesAfter: state.city.urbanTiles,
    urbanCapacityAfter: state.city.urbanCapacity,
    expansionShortfall: Math.max(0, requiredUrbanTiles - state.city.urbanTiles),
    imperialUnmetTotal,
    imperialDemandPenaltyApplied,
    imperialDemandPrestigeLosses,
    economyReports: reports,
    populationPrestigeAwards,
    landPrestigeAwards,
    wealthCommitments,
    wealthAfter: familyWealth,
    prestigeBefore,
    prestigeAfter: Object.fromEntries(state.players.map(player => [player.id, player.prestige])),
    influenceAfter: Object.fromEntries(state.players.map(player => [player.id, player.influence])),
    rawProductionAfterExpansion: getRawProductionBySector(state),
    explorationPoolAfter: getExplorationPoolCounts(state),
  };
}

function determineNextFirstPlayer(state) {
  const maxInfluence = Math.max(...state.players.map(player => player.influence));
  let finalists = state.players.filter(player => player.influence === maxInfluence);
  let tieBreakMethod = "influence";
  let maxPrestige = null;
  let maxWealth = null;
  let randomRoll = null;

  if (finalists.length > 1) {
    maxPrestige = Math.max(...finalists.map(player => player.prestige));
    finalists = finalists.filter(player => player.prestige === maxPrestige);
    tieBreakMethod = "prestige";
  }
  if (finalists.length > 1) {
    maxWealth = Math.max(...finalists.map(player => player.wealthGeneratedThisGeneration));
    finalists = finalists.filter(player => player.wealthGeneratedThisGeneration === maxWealth);
    tieBreakMethod = "wealth";
  }
  if (finalists.length > 1) {
    randomRoll = nextRandom(state);
    finalists = [finalists[Math.min(finalists.length - 1, Math.floor(randomRoll * finalists.length))]];
    tieBreakMethod = "random";
  }

  state.firstPlayerId = finalists[0]?.id ?? state.firstPlayerId;
  return {
    nextFirstPlayerId: state.firstPlayerId,
    maxInfluence,
    maxPrestige,
    maxWealth,
    tieBreakMethod,
    randomRoll,
  };
}

export function resolveAutomatedGeneration(state) {
  state.phase = "action_phase";
  applyAutoDemand(state);
  const firstPlayerBefore = state.firstPlayerId;
  const turnOrderBefore = getTurnOrder(state).map(player => player.id);
  const influenceIncome = grantGrossInfluenceIncome(state);
  const actionPhase = runAutomatedActionPhase(state);
  const summary = resolveProductionAndCity(state);

  const renownBeforeGrowth = state.city.renown;
  const renownGain = summary.generation % V084_CONFIG.renown.gainEveryGenerations === 0
    ? V084_CONFIG.renown.gainAmount
    : 0;
  const renownBeforeCap = renownBeforeGrowth + renownGain;
  const renownCap = state.city.population * V084_CONFIG.renown.capPerPopulation;
  state.city.renown = Math.min(renownBeforeCap, renownCap);
  applyAutoDemand(state);

  const firstPlayerResolution = determineNextFirstPlayer(state);

  Object.assign(summary, {
    firstPlayerBefore,
    turnOrderBefore,
    influenceIncome,
    actions: actionPhase.actions,
    auctions: actionPhase.auctions,
    firstPlayerResolution,
    nextFirstPlayerId: firstPlayerResolution.nextFirstPlayerId,
    renownBeforeGrowth,
    renownGain,
    renownBeforeCap,
    renownCap,
    renownLostToCap: Math.max(0, renownBeforeCap - state.city.renown),
    renownAfterGrowth: state.city.renown,
    prestigeAfter: Object.fromEntries(state.players.map(player => [player.id, player.prestige])),
  });

  state.history.push(summary);
  state.generation += 1;
  state.phase = "action_phase";
  for (const player of state.players) player.wealthCommittedThisGeneration = 0;
  return summary;
}

export function setCityValue(state, key, value) {
  if (!(key in state.city)) return;
  if (key === "religionArcane" || key === "militaryMercantile") {
    state.city[key] = Math.max(-2, Math.min(2, Math.floor(Number(value) || 0)));
  } else if (key === "population") {
    state.city[key] = clampInt(value, V084_CONFIG.population.minimum);
  } else {
    state.city[key] = clampInt(value);
  }
  applyAutoDemand(state);
}

export function resourceLabel(resourceType) {
  return ({
    grain: "Raw Food",
    wool: "Wool",
    ore: "Ore",
    wood: "Wood",
    urban: "Urban",
  })[resourceType] ?? resourceType ?? "Unknown";
}
