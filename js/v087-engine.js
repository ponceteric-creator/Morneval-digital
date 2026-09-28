import * as legacy from "./v084-engine.js?base=0.8.4";

export * from "./v084-engine.js?base=0.8.4";

// v0.8.7 removes Refined Food as a Production Sector. Farms now exist only
// to provide Raw Food directly to Population. External/City/Imperial market
// demand applies only to Textiles, Smithing and Construction Materials.

function nextRandom(state) {
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function diseaseChance(squalor) {
  const levels = Object.keys(legacy.V084_CONFIG.diseaseChanceBySqualor)
    .map(Number)
    .sort((a, b) => a - b);
  let selected = levels[0] ?? 0;
  for (const level of levels) {
    if (squalor >= level) selected = level;
    else break;
  }
  return legacy.V084_CONFIG.diseaseChanceBySqualor[selected] ?? 0;
}

function getPlayer(state, playerId) {
  return state.players.find(player => player.id === playerId) ?? null;
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = legacy.createV084Game(familyNames);
  state.productionSectors = state.productionSectors.filter(sector => sector.id !== "food");
  legacy.applyAutoDemand(state);
  return state;
}

export function applyAutoDemand(state) {
  legacy.applyAutoDemand(state);
}

export function previewEconomy(state) {
  return legacy.previewEconomy(state);
}

export function getRawProductionBySector(state) {
  // Keep Raw Food in the raw-material graph even though Food is no longer a
  // refinement Sector.
  return legacy.getRawProductionBySector(state);
}

function grossInfluenceIncome(state) {
  return state.players.map(player => {
    const before = player.influence;
    player.influence = Math.min(
      player.maxInfluence,
      player.influence + legacy.V084_CONFIG.influence.grossIncome,
    );
    return {
      playerId: player.id,
      before,
      grossIncome: legacy.V084_CONFIG.influence.grossIncome,
      actuallyReceived: player.influence - before,
      afterIncome: player.influence,
    };
  });
}

function erodeInfluence(state) {
  for (const player of state.players) {
    player.influence = Math.max(
      0,
      player.influence - legacy.V084_CONFIG.influence.erosion,
    );
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

function freeProjectedWealth(state, player) {
  const gross = legacy.projectedWealthCapacity(state, player.id);
  return Math.max(0, gross - (player.wealthCommittedThisGeneration || 0));
}

function chooseFarmLand(state, player) {
  const candidates = state.lands
    .filter(land =>
      land.revealed
      && land.ownerId === player.id
      && land.development === "natural")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999));
  if (!candidates.length) return null;

  // Prefer converting land whose associated refinement Sector currently has
  // the most spare raw capacity. This is only an automated-play heuristic.
  const sectorByResource = {
    wool: "textiles",
    ore: "smithing",
    wood: "materials",
  };
  const scored = candidates.map(land => {
    const sectorId = sectorByResource[land.resourceType];
    const sector = state.productionSectors.find(item => item.id === sectorId);
    const demand = sector
      ? (sector.demandThisGeneration.population || 0)
        + (sector.demandThisGeneration.imperial || 0)
        + (sector.demandThisGeneration.external_markets || 0)
      : 0;
    const capacity = sectorId ? legacy.sectorResourceCapacity(state, sectorId) : 0;
    return { land, spare: capacity - demand };
  });
  scored.sort((a, b) => b.spare - a.spare
    || (a.land.explorationOrder ?? 9999) - (b.land.explorationOrder ?? 9999));
  return scored[0]?.land ?? null;
}

function attemptFoodSecurityFarm(state, turnOrder, sequence) {
  const subsistence = legacy.getFoodSubsistenceStatus(state);
  if (subsistence.localCapacity >= subsistence.requested) return null;

  const influenceCost = legacy.V084_CONFIG.hinterland.farmInfluenceCost;
  const wealthCost = legacy.V084_CONFIG.hinterland.farmWealthCost;

  // Farming is a dedicated food-security heuristic. It converts at most one
  // territory per Generation and only while local Raw Food is insufficient.
  for (const player of turnOrder) {
    if (player.influence < influenceCost) continue;
    if (freeProjectedWealth(state, player) < wealthCost) continue;
    const land = chooseFarmLand(state, player);
    if (!land) continue;

    const previousResourceType = land.resourceType;
    player.influence -= influenceCost;
    player.wealthCommittedThisGeneration =
      (player.wealthCommittedThisGeneration || 0) + wealthCost;
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
      influenceCost,
      wealthCost,
      reason: "population_subsistence",
    };
  }
  return null;
}

function markProductionUsage(state, reports, subsistence) {
  for (const player of state.players) {
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

  let foodRemaining = subsistence.localServed;
  const farms = state.lands
    .filter(land =>
      land.revealed
      && land.development === "farm"
      && land.ownerId
      && land.ownerId !== "city")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999));
  for (const land of farms) {
    const used = Math.min(Math.max(0, land.baseCapacity), foodRemaining);
    foodRemaining -= used;
    land.subsistenceUsedThisGeneration = used;
    land.usedCapacityThisGeneration = used;
  }

  for (const report of reports) {
    for (const served of report.servedStakes ?? []) {
      const player = getPlayer(state, served.ownerId);
      const stake = player?.productionStakes.find(item => item.id === served.stakeId);
      if (!stake) continue;
      stake.servedThisGeneration = true;
      stake.servedDemandCategory = served.demandCategory;
      stake.wealthProducedThisGeneration = served.wealthGenerated || 0;
    }
    for (const usage of report.rawResourcesUsed ?? []) {
      if (!usage.landId || !usage.usedCapacity) continue;
      const land = state.lands.find(item => item.id === usage.landId);
      if (!land) continue;
      land.refinedUsedThisGeneration += usage.usedCapacity;
      land.usedCapacityThisGeneration += usage.usedCapacity;
    }
  }
}

function applyPrestigeLossToAll(state, amount, reason) {
  return state.players.map(player => {
    const before = player.prestige;
    player.prestige = Math.max(0, player.prestige - amount);
    return {
      playerId: player.id,
      reason,
      requestedLoss: amount,
      actualLoss: before - player.prestige,
    };
  });
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
  legacy.applyAutoDemand(state);

  const generation = state.generation;
  const populationBefore = state.city.population;
  const squalorBefore = state.city.squalor;
  const urbanTilesBefore = Math.max(1, Number(state.city.urbanTiles) || 1);
  const urbanCapacityBefore = urbanTilesBefore * legacy.V084_CONFIG.urban.populationPerTile;
  const prestigeBefore = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));
  const firstPlayerBefore = state.firstPlayerId;
  const turnOrder = legacy.getTurnOrder(state);
  const turnOrderBefore = turnOrder.map(player => player.id);

  const influenceIncome = grossInfluenceIncome(state);
  const actionPhase = legacy.runAutomatedActionPhase(state);
  const farmAction = attemptFoodSecurityFarm(
    state,
    turnOrder,
    (actionPhase.actions?.length || 0) + 1,
  );
  const actions = farmAction
    ? [...actionPhase.actions, farmAction]
    : [...actionPhase.actions];

  state.phase = "production_resolution";
  legacy.applyAutoDemand(state);
  const economy = legacy.previewEconomy(state);
  const reports = economy.reports;
  const familyWealth = economy.familyWealth;
  const subsistence = legacy.getFoodSubsistenceStatus(state);
  markProductionUsage(state, reports, subsistence);

  for (const player of state.players) {
    player.wealthGeneratedThisGeneration =
      familyWealth[player.id] ?? legacy.V084_CONFIG.familyBaseWealth;
  }

  const populationPrestigeAwards = [];
  for (const report of reports) {
    for (const stake of report.servedStakes ?? []) {
      if (stake.demandCategory !== "population") continue;
      const player = getPlayer(state, stake.ownerId);
      if (!player) continue;
      player.prestige += legacy.V084_CONFIG.rewards.cityPrestigePerNeed;
      populationPrestigeAwards.push({
        playerId: player.id,
        sectorId: report.sectorId,
        amount: legacy.V084_CONFIG.rewards.cityPrestigePerNeed,
      });
    }
  }

  const landPrestigeAwards = [];
  for (const land of state.lands) {
    if (!land.ownerId || land.ownerId === "city" || land.usedCapacityThisGeneration <= 0) continue;
    const player = getPlayer(state, land.ownerId);
    if (!player) continue;
    player.prestige += legacy.V084_CONFIG.rewards.productiveLandPrestige;
    landPrestigeAwards.push({
      playerId: player.id,
      landId: land.id,
      landName: land.name,
      amount: legacy.V084_CONFIG.rewards.productiveLandPrestige,
    });
  }

  const imperialUnmetTotal = reports.reduce(
    (sum, report) => sum + Math.max(0, Number(report.demand?.unmet?.imperial) || 0),
    0,
  );
  const imperialDemandPenaltyApplied = imperialUnmetTotal > 0;
  const imperialDemandPrestigeLosses = imperialDemandPenaltyApplied
    ? applyPrestigeLossToAll(
        state,
        legacy.V084_CONFIG.rewards.imperialUnmetPrestigeLoss,
        "imperial_demand_unmet",
      )
    : [];

  const imperialFoodAidUsed = subsistence.imperialAid > 0;
  const imperialFoodPrestigeLosses = imperialFoodAidUsed
    ? applyPrestigeLossToAll(
        state,
        legacy.V084_CONFIG.rewards.imperialFoodAidPrestigeLoss,
        "imperial_food_aid",
      )
    : [];

  const unmetCityDemand = reports.reduce(
    (sum, report) => sum + Math.max(0, Number(report.demand?.unmet?.population) || 0),
    0,
  );
  const overcrowdingBeforeExpansion = Math.max(0, populationBefore - urbanCapacityBefore);
  const directSqualor = overcrowdingBeforeExpansion + unmetCityDemand;
  state.city.squalor = directSqualor;

  const growthBlockedBySqualor = directSqualor >= populationBefore;
  const growth = !imperialFoodAidUsed && !growthBlockedBySqualor
    ? legacy.V084_CONFIG.population.growthOnFullLocalFood
    : 0;
  const populationBeforeDisease = Math.max(
    legacy.V084_CONFIG.population.minimum,
    populationBefore + growth,
  );

  const diseaseProbability = diseaseChance(directSqualor);
  const diseaseRoll = nextRandom(state);
  const diseaseOccurred = populationBeforeDisease > legacy.V084_CONFIG.population.minimum
    && diseaseRoll < diseaseProbability;
  const diseaseLoss = diseaseOccurred ? 1 : 0;
  state.city.population = Math.max(
    legacy.V084_CONFIG.population.minimum,
    populationBeforeDisease - diseaseLoss,
  );

  const requiredUrbanTiles = Math.max(
    1,
    Math.ceil(state.city.population / legacy.V084_CONFIG.urban.populationPerTile),
  );
  let tilesToAbsorb = Math.max(0, requiredUrbanTiles - urbanTilesBefore);
  const expansionEvents = [];
  while (tilesToAbsorb > 0) {
    const event = absorbLandIntoCity(state, generation);
    if (!event) break;
    expansionEvents.push(event);
    tilesToAbsorb -= 1;
  }
  state.city.urbanTiles = urbanTilesBefore + expansionEvents.length;
  state.city.urbanCapacity = state.city.urbanTiles * legacy.V084_CONFIG.urban.populationPerTile;

  const wealthCommitments = state.players.map(player => {
    const gross = familyWealth[player.id] ?? legacy.V084_CONFIG.familyBaseWealth;
    const committed = player.wealthCommittedThisGeneration || 0;
    const available = Math.max(0, gross - committed);
    const shortfall = Math.max(0, committed - gross);
    player.lastWealthCommitted = committed;
    player.lastWealthAvailable = available;
    player.lastWealthShortfall = shortfall;
    return { playerId: player.id, gross, committed, available, shortfall };
  });

  state.phase = "influence_erosion";
  erodeInfluence(state);
  state.phase = "stake_aging";
  ageProductionStakes(state);

  const renownBeforeGrowth = state.city.renown;
  const renownGain = generation % legacy.V084_CONFIG.renown.gainEveryGenerations === 0
    ? legacy.V084_CONFIG.renown.gainAmount
    : 0;
  const renownBeforeCap = renownBeforeGrowth + renownGain;
  const renownCap = state.city.population * legacy.V084_CONFIG.renown.capPerPopulation;
  state.city.renown = Math.min(renownBeforeCap, renownCap);
  legacy.applyAutoDemand(state);

  const firstPlayerResolution = determineNextFirstPlayer(state);

  const summary = {
    generation,
    populationBefore,
    populationBeforeDisease,
    populationAfter: state.city.population,
    growth,
    growthBlockedBySqualor,
    famineLoss: 0,
    rawFoodRequested: subsistence.requested,
    rawFoodLocalCapacity: subsistence.localCapacity,
    rawFoodLocalServed: subsistence.localServed,
    imperialFoodAid: subsistence.imperialAid,
    imperialFoodAidUsed,
    imperialFoodPrestigeLosses,
    squalorBefore,
    unmetCityDemand,
    overcrowdingBeforeExpansion,
    directSqualor,
    squalorTarget: directSqualor,
    squalorAfter: directSqualor,
    diseaseProbability,
    diseaseRoll,
    diseaseOccurred,
    diseaseLoss,
    urbanTilesBefore,
    urbanCapacityBefore,
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
    rawProductionAfterExpansion: legacy.getRawProductionBySector(state),
    explorationPoolAfter: legacy.getExplorationPoolCounts(state),
    firstPlayerBefore,
    turnOrderBefore,
    influenceIncome,
    actions,
    auctions: actionPhase.auctions,
    firstPlayerResolution,
    nextFirstPlayerId: firstPlayerResolution.nextFirstPlayerId,
    renownBeforeGrowth,
    renownGain,
    renownBeforeCap,
    renownCap,
    renownLostToCap: Math.max(0, renownBeforeCap - state.city.renown),
    renownAfterGrowth: state.city.renown,
  };

  state.history.push(summary);
  state.generation += 1;
  state.phase = "action_phase";
  for (const player of state.players) player.wealthCommittedThisGeneration = 0;
  return summary;
}
