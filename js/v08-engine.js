export const V08_CONFIG = {
  influence: {
    starting: 6,
    maximum: 10,
    grossIncome: 5,
    erosion: 2,
  },
  wealthPerDemand: {
    population: 0,
    institutions: 1,
    external_markets: 2,
  },
  populationPrestigePerNeed: 1,
  productiveLandPrestige: 1,
  stakeLifetimeValueGenerations: 3,
  renown: {
    gainEveryGenerations: 2,
    gainAmount: 1,
  },
  cityBaseResourceCapacity: {
    grain: 3,
    wool: 3,
    ore: 3,
    wood: 3,
  },
  developmentPhases: {
    1: { influenceCost: 1, wealthCost: 1, prestige: 5 },
    2: { influenceCost: 0, wealthCost: 2, prestige: 5 },
    3: { influenceCost: 0, wealthCost: 2, prestige: 5 },
  },
  hinterland: {
    acquisitionInfluenceCost: 3,
    acquisitionWealthCost: 1,
    farmInfluenceCost: 2,
    farmWealthCost: 1,
    tileCapacity: 1,
  },
  population: {
    growthOnFullFood: 1,
    famineLossWhenFoodUnmet: 1,
    minimum: 0,
  },
  squalor: {
    populationPerPoint: 3,
    unmetFoodPenalty: 1,
    maxChange: 1,
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
    food: { population: 2, institutions: 3, external_markets: 2 },
    textiles: { population: 6, institutions: 3, external_markets: 2 },
    smithing: { population: 6, institutions: 3, external_markets: 2 },
    materials: { population: 6, institutions: 3, external_markets: 2 },
  },
};

const SECTOR_DEFS = [
  { id: "food", name: "Food", inputResourceType: "grain" },
  { id: "textiles", name: "Textiles", inputResourceType: "wool" },
  { id: "smithing", name: "Smithing", inputResourceType: "ore" },
  { id: "materials", name: "Construction Materials", inputResourceType: "wood" },
];

const TERRAIN_DEFS = [
  { terrain: "forest", label: "Forest", resourceType: "wood" },
  { terrain: "meadow", label: "Meadow", resourceType: "wool" },
  { terrain: "hill", label: "Hill", resourceType: "ore" },
];

const DEMAND_TIE_BREAK = ["population", "institutions", "external_markets"];

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
  const tiles = [];
  for (const def of TERRAIN_DEFS) {
    for (let i = 1; i <= 4; i += 1) {
      tiles.push({
        id: `${def.terrain}_${i}`,
        name: `${def.label} ${i}`,
        originalTerrain: def.terrain,
        terrain: def.terrain,
        development: "natural",
        resourceType: def.resourceType,
        baseCapacity: V08_CONFIG.hinterland.tileCapacity,
        ownerId: null,
        acquisitionOrder: null,
        usedCapacityThisGeneration: 0,
      });
    }
  }
  return tiles;
}

export function createV08Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const players = familyNames.map((familyName, index) => ({
    id: `family_${index + 1}`,
    familyName,
    prestige: 0,
    influence: V08_CONFIG.influence.starting,
    maxInfluence: V08_CONFIG.influence.maximum,
    productionStakes: [],
    wealthGeneratedThisGeneration: 0,
    wealthCommittedThisGeneration: 0,
    lastWealthCommitted: 0,
    lastWealthAvailable: 0,
    lastWealthShortfall: 0,
  }));

  const productionSectors = SECTOR_DEFS.map(def => ({
    ...def,
    tier: 1,
    developmentPhase: 0,
    developmentTargetTier: 2,
    lastDevelopmentGeneration: null,
    lastDevelopmentContributorId: null,
    demandThisGeneration: { population: 0, institutions: 0, external_markets: 0 },
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
    },
    institutions: [
      { id: "merchant_guild", name: "Merchant Guild", level: 0 },
      { id: "city_guard", name: "City Guard", level: 1 },
      { id: "temple", name: "Temple", level: 0 },
    ],
    players,
    productionSectors,
    lands: makeHinterland(),
    nextProductionStakeOrder: 1,
    nextLandAcquisitionOrder: 1,
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
  const preferred = new Set();
  if (state.city.religionArcane !== 0) preferred.add("institutions");
  if (state.city.militaryMercantile < 0) preferred.add("population");
  if (state.city.militaryMercantile > 0) preferred.add("external_markets");

  if (!preferred.size) return [[...DEMAND_TIE_BREAK]];
  const first = DEMAND_TIE_BREAK.filter(category => preferred.has(category));
  const second = DEMAND_TIE_BREAK.filter(category => !preferred.has(category));
  return second.length ? [first, second] : [first];
}

export function applyAutoDemand(state) {
  const institutionLevels = state.institutions.reduce(
    (sum, institution) => sum + clampInt(institution.level),
    0,
  );
  const population = clampInt(state.city.population);
  const renown = clampInt(state.city.renown);

  for (const sector of state.productionSectors) {
    const divisors = V08_CONFIG.demandDivisors[sector.id];
    sector.demandThisGeneration.population = population > 0
      ? Math.ceil(population / divisors.population)
      : 0;
    sector.demandThisGeneration.institutions = institutionLevels > 0
      ? Math.ceil(institutionLevels / divisors.institutions)
      : 0;
    sector.demandThisGeneration.external_markets = renown > 0
      ? Math.ceil(renown / divisors.external_markets)
      : 0;
  }
}

function allocateDemand(supply, demand, priorityGroups) {
  let remaining = Math.max(0, supply);
  const served = { population: 0, institutions: 0, external_markets: 0 };
  const sequence = [];

  for (const group of priorityGroups) {
    const ordered = DEMAND_TIE_BREAK.filter(category => group.includes(category));
    for (const category of ordered) {
      if (remaining <= 0) break;
      const amount = Math.min(Math.max(0, demand[category]), remaining);
      served[category] = amount;
      for (let i = 0; i < amount; i += 1) sequence.push(category);
      remaining -= amount;
    }
  }

  return {
    requested: { ...demand },
    served,
    unmet: {
      population: Math.max(0, demand.population - served.population),
      institutions: Math.max(0, demand.institutions - served.institutions),
      external_markets: Math.max(0, demand.external_markets - served.external_markets),
    },
    serviceSequence: sequence,
    totalServed: sequence.length,
  };
}

export function sectorResourceCapacity(state, sectorId) {
  const sector = state.productionSectors.find(item => item.id === sectorId);
  if (!sector) return 0;
  const base = V08_CONFIG.cityBaseResourceCapacity[sector.inputResourceType] ?? 0;
  const hinterland = state.lands
    .filter(land => land.ownerId && land.resourceType === sector.inputResourceType)
    .reduce((sum, land) => sum + Math.max(0, land.baseCapacity), 0);
  return base + hinterland;
}

function sectorDemandTotal(sector) {
  return sector.demandThisGeneration.population
    + sector.demandThisGeneration.institutions
    + sector.demandThisGeneration.external_markets;
}

function calculateEconomy(state, mutate = false) {
  applyAutoDemand(state);
  const priorities = getDemandPriorityGroups(state);
  const familyWealth = Object.fromEntries(state.players.map(player => [player.id, 0]));
  const reports = [];

  if (mutate) {
    for (const player of state.players) {
      player.wealthGeneratedThisGeneration = 0;
      for (const stake of player.productionStakes) {
        stake.servedThisGeneration = false;
        stake.servedDemandCategory = null;
        stake.wealthProducedThisGeneration = 0;
      }
    }
    for (const land of state.lands) land.usedCapacityThisGeneration = 0;
  }

  for (const sector of state.productionSectors) {
    const stakes = state.players
      .flatMap(player => player.productionStakes)
      .filter(stake => stake.sectorId === sector.id)
      .sort(compareStakeSeniority);
    const slotCapacity = sector.tier * 3;
    const stakeSupply = Math.min(stakes.length, slotCapacity);
    const baseCapacity = V08_CONFIG.cityBaseResourceCapacity[sector.inputResourceType] ?? 0;
    const ownedLands = state.lands
      .filter(land => land.ownerId && land.resourceType === sector.inputResourceType)
      .sort((a, b) => (a.acquisitionOrder ?? 9999) - (b.acquisitionOrder ?? 9999));
    const hinterlandCapacity = ownedLands.reduce((sum, land) => sum + land.baseCapacity, 0);
    const totalResourceCapacity = baseCapacity + hinterlandCapacity;
    const resourceLimitedSupply = Math.min(stakeSupply, totalResourceCapacity);
    const demand = allocateDemand(resourceLimitedSupply, sector.demandThisGeneration, priorities);
    const servedStakes = stakes.slice(0, demand.totalServed);

    for (let i = 0; i < servedStakes.length; i += 1) {
      const stake = servedStakes[i];
      const category = demand.serviceSequence[i];
      const wealth = V08_CONFIG.wealthPerDemand[category] ?? 0;
      familyWealth[stake.ownerId] = (familyWealth[stake.ownerId] ?? 0) + wealth;
      if (mutate) {
        stake.servedThisGeneration = true;
        stake.servedDemandCategory = category;
        stake.wealthProducedThisGeneration = wealth;
      }
    }

    let remainingResourceUse = demand.totalServed;
    const baseUsed = Math.min(baseCapacity, remainingResourceUse);
    remainingResourceUse -= baseUsed;
    const rawResourcesUsed = [{
      source: "city_base",
      landId: null,
      landName: "City-adjacent base supply",
      resourceType: sector.inputResourceType,
      ownerId: null,
      availableCapacity: baseCapacity,
      usedCapacity: baseUsed,
    }];

    for (const land of ownedLands) {
      const usedCapacity = Math.min(land.baseCapacity, remainingResourceUse);
      remainingResourceUse -= usedCapacity;
      if (mutate) land.usedCapacityThisGeneration = usedCapacity;
      rawResourcesUsed.push({
        source: "hinterland",
        landId: land.id,
        landName: land.name,
        resourceType: land.resourceType,
        ownerId: land.ownerId,
        availableCapacity: land.baseCapacity,
        usedCapacity,
      });
    }

    reports.push({
      sectorId: sector.id,
      sectorName: sector.name,
      tier: sector.tier,
      slotCapacity,
      stakeSupply,
      baseResourceCapacity: baseCapacity,
      hinterlandCapacity,
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
        wealthGenerated: V08_CONFIG.wealthPerDemand[demand.serviceSequence[index]] ?? 0,
      })),
      rawResourcesUsed,
    });
  }

  if (mutate) {
    for (const player of state.players) {
      player.wealthGeneratedThisGeneration = familyWealth[player.id] ?? 0;
    }
  }

  return { reports, familyWealth };
}

export function previewEconomy(state) {
  return calculateEconomy(state, false);
}

export function projectedWealthCapacity(state, playerId) {
  return previewEconomy(state).familyWealth[playerId] ?? 0;
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

function nextDevelopmentCost(sector) {
  if (sector.tier >= 3) return null;
  const phase = sector.developmentPhase + 1;
  return { phase, ...V08_CONFIG.developmentPhases[phase] };
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

function acquireLand(state, player, land, auctions, sequence, purposeSectorId = null) {
  const { acquisitionInfluenceCost, acquisitionWealthCost } = V08_CONFIG.hinterland;
  if (land.ownerId) return null;
  if (!canPayNonBidAction(state, auctions, player, acquisitionInfluenceCost, acquisitionWealthCost)) return null;
  player.influence -= acquisitionInfluenceCost;
  commitWealth(player, acquisitionWealthCost);
  land.ownerId = player.id;
  land.acquisitionOrder = state.nextLandAcquisitionOrder;
  state.nextLandAcquisitionOrder += 1;
  return {
    sequence,
    type: "hinterland_acquisition",
    playerId: player.id,
    landId: land.id,
    terrain: land.terrain,
    purposeSectorId,
    influenceCost: acquisitionInfluenceCost,
    wealthCost: acquisitionWealthCost,
  };
}

function convertLandToFarm(state, player, land, auctions, sequence) {
  const { farmInfluenceCost, farmWealthCost } = V08_CONFIG.hinterland;
  if (land.ownerId !== player.id || land.development === "farm") return null;
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

function futureSlotCapacity(sector) {
  return sector.developmentPhase > 0 && sector.tier < 3
    ? (sector.tier + 1) * 3
    : sector.tier * 3;
}

function resourcePressure(state, sector) {
  const demand = sectorDemandTotal(sector);
  const resourceCapacity = sectorResourceCapacity(state, sector.id);
  const usableSlotCapacity = futureSlotCapacity(sector);
  const desiredSupply = Math.min(demand, usableSlotCapacity);
  return {
    demand,
    resourceCapacity,
    desiredSupply,
    deficit: Math.max(0, desiredSupply - resourceCapacity),
  };
}

function terrainForSector(sectorId) {
  if (sectorId === "textiles") return "meadow";
  if (sectorId === "smithing") return "hill";
  if (sectorId === "materials") return "forest";
  return null;
}

function sectorForTerrain(terrain) {
  if (terrain === "meadow") return "textiles";
  if (terrain === "hill") return "smithing";
  if (terrain === "forest") return "materials";
  return null;
}

function chooseFoodAcquisitionTile(state) {
  const candidates = state.lands.filter(land => !land.ownerId);
  if (!candidates.length) return null;
  const scored = candidates.map(land => {
    const competingSector = state.productionSectors.find(sector => sector.id === sectorForTerrain(land.originalTerrain));
    const pressure = competingSector ? resourcePressure(state, competingSector).deficit : 0;
    const terrainOrder = land.originalTerrain === "meadow" ? 0 : land.originalTerrain === "hill" ? 1 : 2;
    return { land, score: pressure * 10 + terrainOrder };
  });
  scored.sort((a, b) => a.score - b.score || a.land.id.localeCompare(b.land.id));
  return scored[0]?.land ?? null;
}

function buildLandCandidate(state, player, auctions, sequence) {
  const sectorsByDeficit = state.productionSectors
    .map(sector => ({ sector, pressure: resourcePressure(state, sector) }))
    .filter(item => item.pressure.deficit > 0)
    .sort((a, b) => b.pressure.deficit - a.pressure.deficit || state.productionSectors.indexOf(a.sector) - state.productionSectors.indexOf(b.sector));

  for (const { sector, pressure } of sectorsByDeficit) {
    if (sector.id === "food") {
      const convertible = state.lands
        .filter(land => land.ownerId === player.id && land.development !== "farm")
        .sort((a, b) => (a.acquisitionOrder ?? 9999) - (b.acquisitionOrder ?? 9999));
      if (convertible.length && canPayNonBidAction(
        state,
        auctions,
        player,
        V08_CONFIG.hinterland.farmInfluenceCost,
        V08_CONFIG.hinterland.farmWealthCost,
      )) {
        return {
          score: 120 + pressure.deficit * 10,
          execute: () => convertLandToFarm(state, player, convertible[0], auctions, sequence),
        };
      }
      const land = chooseFoodAcquisitionTile(state);
      if (land && canPayNonBidAction(
        state,
        auctions,
        player,
        V08_CONFIG.hinterland.acquisitionInfluenceCost,
        V08_CONFIG.hinterland.acquisitionWealthCost,
      )) {
        return {
          score: 105 + pressure.deficit * 10,
          execute: () => acquireLand(state, player, land, auctions, sequence, "food"),
        };
      }
      continue;
    }

    const terrain = terrainForSector(sector.id);
    const land = state.lands.find(item => !item.ownerId && item.originalTerrain === terrain);
    if (land && canPayNonBidAction(
      state,
      auctions,
      player,
      V08_CONFIG.hinterland.acquisitionInfluenceCost,
      V08_CONFIG.hinterland.acquisitionWealthCost,
    )) {
      return {
        score: 110 + pressure.deficit * 10,
        execute: () => acquireLand(state, player, land, auctions, sequence, sector.id),
      };
    }
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
  candidates.sort((a, b) => b.score - a.score || state.productionSectors.indexOf(a.sector) - state.productionSectors.indexOf(b.sector));
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
  const currentStakes = state.players.flatMap(player => player.productionStakes)
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
  const immediate = (V08_CONFIG.wealthPerDemand[category] ?? 0)
    + (category === "population" ? V08_CONFIG.populationPrestigePerNeed : 0);
  return immediate * V08_CONFIG.stakeLifetimeValueGenerations;
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
  const strategicValue = stakeStrategicValue(category);
  return { category, strategicValue };
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
        const surplus = strategicValue - nextBid;
        raises.push({ auction, category, strategicValue, bid: nextBid, score: 50 + surplus });
      }
    }
  }

  openings.sort((a, b) => b.strategicValue - a.strategicValue || auctions.indexOf(a.auction) - auctions.indexOf(b.auction));
  raises.sort((a, b) => b.score - a.score || b.strategicValue - a.strategicValue || auctions.indexOf(a.auction) - auctions.indexOf(b.auction));
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
        openedEmptySlot: chosen.bid === 1 && chosen.auction.turns.length === 0,
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
  eligible.sort((a, b) => {
    const av = bidValueForAuction(state, auctions, player, a).strategicValue - (a.currentBid + 1);
    const bv = bidValueForAuction(state, auctions, player, b).strategicValue - (b.currentBid + 1);
    return av - bv || auctions.indexOf(a) - auctions.indexOf(b);
  });
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
  const results = [];
  for (const auction of auctions) {
    let winnerId = null;
    let winningBid = 0;
    let stakeId = null;
    let expectedCategory = null;
    if (auction.leaderId && auction.currentBid > 0) {
      const winner = state.players.find(player => player.id === auction.leaderId);
      if (winner && winner.influence >= auction.currentBid) {
        winner.influence -= auction.currentBid;
        const stake = addProductionStake(state, winner.id, auction.sectorId);
        if (stake) {
          winnerId = winner.id;
          winningBid = auction.currentBid;
          stakeId = stake.id;
          expectedCategory = estimateStakeMarket(state, auction.sectorId, 0);
        }
      }
    }
    results.push({
      auctionId: auction.auctionId,
      sectorId: auction.sectorId,
      slotNumber: auction.slotNumber,
      winnerId,
      winningBid,
      stakeId,
      expectedCategory,
      turns: auction.turns,
      closed: auction.closed,
    });
  }
  return results;
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

  const auctionsResolved = finalizeAuctions(state, auctions);
  return { actions, auctions: auctionsResolved };
}

function grantGrossInfluenceIncome(state) {
  return state.players.map(player => {
    const before = player.influence;
    player.influence = Math.min(player.maxInfluence, player.influence + V08_CONFIG.influence.grossIncome);
    return {
      playerId: player.id,
      before,
      grossIncome: V08_CONFIG.influence.grossIncome,
      actuallyReceived: player.influence - before,
      afterIncome: player.influence,
    };
  });
}

function erodeInfluence(state) {
  for (const player of state.players) {
    player.influence = Math.max(0, player.influence - V08_CONFIG.influence.erosion);
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
  const levels = Object.keys(V08_CONFIG.diseaseChanceBySqualor).map(Number).sort((a, b) => a - b);
  let selected = 0;
  for (const level of levels) {
    if (squalor >= level) selected = level;
  }
  return V08_CONFIG.diseaseChanceBySqualor[selected] ?? 0;
}

function resolveProductionAndCity(state) {
  const generation = state.generation;
  const populationBefore = state.city.population;
  const squalorBefore = state.city.squalor;
  const prestigeBefore = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));

  state.phase = "production_resolution";
  const { reports, familyWealth } = calculateEconomy(state, true);

  const populationPrestigeAwards = [];
  for (const report of reports) {
    for (const stake of report.servedStakes) {
      if (stake.demandCategory !== "population") continue;
      const player = state.players.find(item => item.id === stake.ownerId);
      if (!player) continue;
      player.prestige += V08_CONFIG.populationPrestigePerNeed;
      populationPrestigeAwards.push({
        playerId: player.id,
        sectorId: report.sectorId,
        amount: V08_CONFIG.populationPrestigePerNeed,
      });
    }
  }

  const landPrestigeAwards = [];
  for (const land of state.lands) {
    if (!land.ownerId || land.usedCapacityThisGeneration <= 0) continue;
    const player = state.players.find(item => item.id === land.ownerId);
    if (!player) continue;
    player.prestige += V08_CONFIG.productiveLandPrestige;
    landPrestigeAwards.push({
      playerId: player.id,
      landId: land.id,
      landName: land.name,
      amount: V08_CONFIG.productiveLandPrestige,
    });
  }

  const wealthCommitments = state.players.map(player => {
    const gross = familyWealth[player.id] ?? 0;
    const committed = player.wealthCommittedThisGeneration;
    const available = Math.max(0, gross - committed);
    const shortfall = Math.max(0, committed - gross);
    player.lastWealthCommitted = committed;
    player.lastWealthAvailable = available;
    player.lastWealthShortfall = shortfall;
    return { playerId: player.id, gross, committed, available, shortfall };
  });

  const food = reports.find(report => report.sectorId === "food");
  const foodRequested = food?.demand.requested.population ?? 0;
  const foodServed = food?.demand.served.population ?? 0;
  const foodUnmet = Math.max(0, foodRequested - foodServed);
  let growth = 0;
  let famineLoss = 0;
  if (populationBefore > 0 && foodRequested > 0 && foodUnmet === 0) {
    growth = V08_CONFIG.population.growthOnFullFood;
  } else if (foodUnmet > 0) {
    famineLoss = V08_CONFIG.population.famineLossWhenFoodUnmet;
  }
  state.city.population = Math.max(
    V08_CONFIG.population.minimum,
    populationBefore + growth - famineLoss,
  );

  const baseTarget = state.city.population <= 0
    ? 0
    : Math.ceil(state.city.population / V08_CONFIG.squalor.populationPerPoint);
  const squalorTarget = baseTarget + (foodUnmet > 0 ? V08_CONFIG.squalor.unmetFoodPenalty : 0);
  state.city.squalor = moveToward(
    state.city.squalor,
    squalorTarget,
    V08_CONFIG.squalor.maxChange,
  );

  const diseaseProbability = diseaseChance(state.city.squalor);
  const diseaseRoll = nextRandom(state);
  const diseaseOccurred = state.city.population > 0 && diseaseRoll < diseaseProbability;
  const diseaseLoss = diseaseOccurred ? Math.min(1, state.city.population) : 0;
  state.city.population = Math.max(0, state.city.population - diseaseLoss);

  state.phase = "influence_erosion";
  erodeInfluence(state);
  state.phase = "stake_aging";
  ageProductionStakes(state);

  return {
    generation,
    populationBefore,
    populationAfter: state.city.population,
    growth,
    famineLoss,
    foodRequested,
    foodServed,
    foodUnmet,
    squalorBefore,
    squalorTarget,
    squalorAfter: state.city.squalor,
    diseaseProbability,
    diseaseRoll,
    diseaseOccurred,
    diseaseLoss,
    economyReports: reports,
    populationPrestigeAwards,
    landPrestigeAwards,
    wealthCommitments,
    wealthAfter: familyWealth,
    prestigeBefore,
    prestigeAfter: Object.fromEntries(state.players.map(player => [player.id, player.prestige])),
    influenceAfter: Object.fromEntries(state.players.map(player => [player.id, player.influence])),
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
  const renownGain = summary.generation % V08_CONFIG.renown.gainEveryGenerations === 0
    ? V08_CONFIG.renown.gainAmount
    : 0;
  state.city.renown += renownGain;
  applyAutoDemand(state);

  const firstPlayerResolution = determineNextFirstPlayer(state);

  summary.firstPlayerBefore = firstPlayerBefore;
  summary.turnOrderBefore = turnOrderBefore;
  summary.influenceIncome = influenceIncome;
  summary.actions = actionPhase.actions;
  summary.auctions = actionPhase.auctions;
  summary.firstPlayerResolution = firstPlayerResolution;
  summary.nextFirstPlayerId = firstPlayerResolution.nextFirstPlayerId;
  summary.renownBeforeGrowth = renownBeforeGrowth;
  summary.renownGain = renownGain;
  summary.renownAfterGrowth = state.city.renown;
  summary.prestigeAfter = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));

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
  } else {
    state.city[key] = clampInt(value);
  }
  applyAutoDemand(state);
}

export function getSectorOccupancy(state, sectorId) {
  return occupancyByAge(state, sectorId);
}

export function getDevelopmentStatus(sector) {
  if (sector.tier >= 3) return { complete: true, nextPhase: null, cost: null };
  const nextPhase = sector.developmentPhase + 1;
  return {
    complete: false,
    nextPhase,
    targetTier: sector.tier + 1,
    cost: V08_CONFIG.developmentPhases[nextPhase],
    advancedThisGeneration: sector.lastDevelopmentGeneration === sector._displayGeneration,
  };
}

export function resourceLabel(resourceType) {
  return ({ grain: "Food", wool: "Wool", ore: "Ore", wood: "Wood" })[resourceType] ?? resourceType;
}
