import * as base from "./v089-engine.js?base=0.8.9";

export * from "./v089-engine.js?base=0.8.9";

export const V090_CONFIG = {
  publicFarmOwnerId: "public",
  civicFarmPrestige: 3,
  personalities: {
    dynast: {
      label: "Dynast",
      prestige: 1.45,
      wealth: 0.75,
      engine: 0.85,
      civic: 0.75,
      horizon: 2,
      discount: 0.80,
    },
    merchant: {
      label: "Merchant",
      prestige: 0.75,
      wealth: 1.45,
      engine: 1.45,
      civic: 0.65,
      horizon: 4,
      discount: 0.88,
    },
    opportunist: {
      label: "Opportunist",
      prestige: 1.0,
      wealth: 1.0,
      engine: 1.0,
      civic: 1.0,
      horizon: 3,
      discount: 0.85,
    },
  },
  actionRounds: 2,
  civicFarm: {
    onePerGeneration: true,
    minimumUtility: 0.75,
  },
  expansionVote: {
    minimumProposalInfluence: 1,
    proposalUtilityThreshold: 0.75,
    influenceThresholds: [1.25, 2.75, 4.5],
  },
  agents: {
    wealthCommitment: 1,
    minimumUtility: 0.50,
    reallocationThreshold: 0.75,
  },
};

const PERSONALITY_ORDER = ["dynast", "merchant", "opportunist"];
const INSTITUTION_IDS = ["city_guard", "temple", "merchant_guild", "scholarium"];
const INSTITUTION_LABELS = {
  city_guard: "City Guard",
  temple: "Temple",
  merchant_guild: "Merchant Guild",
  scholarium: "Scholarium College",
};
const TERRAIN = {
  forest: { label: "Forest", resourceType: "wood" },
  meadow: { label: "Meadow", resourceType: "wool" },
  hill: { label: "Hill", resourceType: "ore" },
};
const RESOURCE_TO_SECTOR = {
  wool: "textiles",
  ore: "smithing",
  wood: "materials",
};
const DEMAND_ORDER = ["imperial", "population", "external_markets"];

function clampInt(value, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(minimum, Math.min(maximum, n));
}

function nextRandom(state) {
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function getPlayer(state, playerId) {
  return state.players.find(player => player.id === playerId) ?? null;
}

function currentUrbanTiles(state) {
  return Math.max(1, Number(state.city.urbanTiles) || 1);
}

function currentUrbanCapacity(state) {
  return currentUrbanTiles(state) * base.V084_CONFIG.urban.populationPerTile;
}

function demandTotal(sector) {
  const demand = sector?.demandThisGeneration ?? {};
  return (Number(demand.population) || 0)
    + (Number(demand.imperial) || 0)
    + (Number(demand.external_markets) || 0);
}

function annuity(profile, horizonOverride = null) {
  const horizon = Math.max(1, Math.floor(horizonOverride ?? profile.horizon));
  let total = 0;
  for (let t = 0; t < horizon; t += 1) total += profile.discount ** t;
  return total;
}

function syncInstitutionAgentCounts(player) {
  player.institutionAgents ??= {};
  for (const institutionId of INSTITUTION_IDS) {
    player.institutionAgents[institutionId] = (player.institutionAgentRoster ?? [])
      .filter(agent => agent.institutionId === institutionId).length;
  }
}

export function ensureInstitutionAgentState(state) {
  state.nextInstitutionAgentOrder = Math.max(1, clampInt(state.nextInstitutionAgentOrder ?? 1, 1));
  for (const player of state.players ?? []) {
    if (!Array.isArray(player.institutionAgentRoster)) {
      player.institutionAgentRoster = [];
      for (const institutionId of INSTITUTION_IDS) {
        const desired = clampInt(player.institutionAgents?.[institutionId] ?? 0);
        for (let i = 0; i < desired; i += 1) {
          player.institutionAgentRoster.push({
            id: `agent_${state.nextInstitutionAgentOrder}`,
            institutionId,
            seniority: 1,
            placementOrder: state.nextInstitutionAgentOrder,
            placedGeneration: state.generation,
          });
          state.nextInstitutionAgentOrder += 1;
        }
      }
    }
    for (const agent of player.institutionAgentRoster) {
      agent.seniority = clampInt(agent.seniority ?? 1, 1, 3);
      if (!INSTITUTION_IDS.includes(agent.institutionId)) agent.institutionId = INSTITUTION_IDS[0];
    }
    syncInstitutionAgentCounts(player);
  }
  return state;
}

export function getInstitutionAgentRoster(player) {
  return Array.isArray(player?.institutionAgentRoster) ? player.institutionAgentRoster : [];
}

export function deployedInstitutionAgentCount(player) {
  return getInstitutionAgentRoster(player).length;
}

function addInstitutionAgent(state, player, institutionId) {
  ensureInstitutionAgentState(state);
  if (!INSTITUTION_IDS.includes(institutionId)) return null;
  const order = state.nextInstitutionAgentOrder;
  const agent = {
    id: `agent_${order}`,
    institutionId,
    seniority: 1,
    placementOrder: order,
    placedGeneration: state.generation,
  };
  state.nextInstitutionAgentOrder += 1;
  player.institutionAgentRoster.push(agent);
  syncInstitutionAgentCounts(player);
  return agent;
}

function recallInstitutionAgent(player, agentId) {
  const index = getInstitutionAgentRoster(player).findIndex(agent => agent.id === agentId);
  if (index < 0) return null;
  const [agent] = player.institutionAgentRoster.splice(index, 1);
  syncInstitutionAgentCounts(player);
  return agent;
}

function assignPersonalities(state) {
  state.players.forEach((player, index) => {
    if (!player.aiPersonality) {
      player.aiPersonality = PERSONALITY_ORDER[index % PERSONALITY_ORDER.length];
    }
  });
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = base.createV084Game(familyNames);
  assignPersonalities(state);
  state.nextInstitutionAgentOrder = 1;
  for (const player of state.players) {
    player.institutionAgentRoster = [];
  }
  ensureInstitutionAgentState(state);
  return state;
}

function profileFor(state, player) {
  const key = player.aiPersonality ?? "opportunist";
  const baseProfile = V090_CONFIG.personalities[key] ?? V090_CONFIG.personalities.opportunist;
  if (key !== "opportunist") return { ...baseProfile, key };

  const avgPrestige = state.players.reduce((sum, p) => sum + p.prestige, 0) / Math.max(1, state.players.length);
  const wealthByPlayer = state.players.map(p => base.projectedWealthCapacity(state, p.id));
  const avgWealth = wealthByPlayer.reduce((sum, value) => sum + value, 0) / Math.max(1, wealthByPlayer.length);
  const ownWealth = base.projectedWealthCapacity(state, player.id);
  const food = base.getFoodSubsistenceStatus(state);
  const population = Math.max(1, Number(state.city.population) || 1);

  const profile = { ...baseProfile, key };
  if (player.prestige + 2 < avgPrestige) {
    profile.prestige = 1.30;
    profile.wealth = 0.90;
    profile.engine = 0.95;
  } else if (ownWealth + 0.5 < avgWealth) {
    profile.prestige = 0.90;
    profile.wealth = 1.30;
    profile.engine = 1.20;
  }
  if (food.localCapacity < population || state.city.squalor >= Math.ceil(population / 2)) {
    profile.civic = 1.35;
  }
  return profile;
}

function allocateDemand(supply, demand, priorityGroups) {
  let remaining = Math.max(0, supply);
  const serviceSequence = [];
  for (const group of priorityGroups) {
    const ordered = DEMAND_ORDER.filter(category => group.includes(category));
    for (const category of ordered) {
      const requested = Math.max(0, Number(demand?.[category]) || 0);
      const amount = Math.min(requested, remaining);
      for (let i = 0; i < amount; i += 1) serviceSequence.push(category);
      remaining -= amount;
      if (remaining <= 0) break;
    }
    if (remaining <= 0) break;
  }
  return serviceSequence;
}

function categoryPerGenerationUtility(category, profile) {
  if (category === "population") return profile.prestige;
  if (category === "external_markets") return profile.wealth + profile.engine * 0.20;
  if (category === "imperial") return profile.civic * 0.55 + profile.prestige * 0.20;
  return 0;
}

function expectedStakeValue(state, player, sector) {
  const currentStakes = state.players
    .flatMap(p => p.productionStakes)
    .filter(stake => stake.sectorId === sector.id).length;
  const supplyBefore = currentStakes;
  const rawCapacity = base.sectorResourceCapacity(state, sector.id);
  if (supplyBefore >= rawCapacity) return { category: null, utility: 0 };

  const sequence = allocateDemand(
    Math.min(rawCapacity, supplyBefore + 1),
    sector.demandThisGeneration,
    base.getDemandPriorityGroups(state),
  );
  const category = sequence[supplyBefore] ?? null;
  if (!category) return { category: null, utility: 0 };

  const profile = profileFor(state, player);
  const horizon = Math.min(3, profile.horizon);
  const utility = categoryPerGenerationUtility(category, profile) * annuity(profile, horizon)
    + profile.engine * 0.25;
  return { category, utility };
}

function agentReservedWealth(player) {
  const previewRelease = clampInt(player.agentWealthReleasePreview ?? 0);
  return Math.max(0, deployedInstitutionAgentCount(player) - previewRelease)
    * V090_CONFIG.agents.wealthCommitment;
}

function freeProjectedWealth(state, player) {
  ensureInstitutionAgentState(state);
  const gross = base.projectedWealthCapacity(state, player.id);
  return Math.max(
    0,
    gross - (player.wealthCommittedThisGeneration || 0) - agentReservedWealth(player),
  );
}

function canPay(state, player, influenceCost, wealthCost) {
  return player.influence >= influenceCost && freeProjectedWealth(state, player) >= wealthCost;
}

function sumEconomyDemand(reports, bucket, category) {
  return (reports ?? []).reduce(
    (sum, report) => sum + Math.max(0, Number(report?.demand?.[bucket]?.[category]) || 0),
    0,
  );
}

function estimatedOrder(state, economy) {
  const population = Math.max(1, clampInt(state.city.population, 1));
  const baseOrder = population <= 3 ? 3 : population >= 15 ? 1 : 2;
  const unmetCity = sumEconomyDemand(economy.reports, "unmet", "population");
  const demandModifier = unmetCity > 0 ? -1 : 0;
  const manualModifier = Math.max(-4, Math.min(4, Math.floor(Number(state.city.orderModifier) || 0)));
  return Math.max(0, Math.min(4, baseOrder + demandModifier + manualModifier));
}

function estimatedInstitutionScore(state, institutionId) {
  const economy = base.previewEconomy(state);
  const population = Math.max(1, clampInt(state.city.population, 1));

  if (institutionId === "city_guard") {
    const order = estimatedOrder(state, economy);
    const force = Math.max(0, Number(state.city.force) || 0);
    const orderPrestige = order >= 3 ? 2 : order === 2 ? 1 : 0;
    const onePointThreshold = Math.ceil(population / 3);
    const twoPointThreshold = Math.ceil(population / 2);
    let readiness = 0;
    if (force >= onePointThreshold) readiness = 1;
    if (force >= twoPointThreshold) readiness = 2;
    return Math.min(4, orderPrestige + readiness);
  }

  if (institutionId === "temple") {
    const axis = Math.max(-2, Math.min(2, Math.floor(Number(state.city.religionArcane) || 0)));
    const religious = axis === 2 ? 2 : axis === 1 ? 1 : 0;
    const squalor = Math.max(0, clampInt(state.city.squalor ?? 0));
    const civic = squalor === 0 ? 2 : squalor <= Math.floor(population / 3) ? 1 : 0;
    return Math.min(4, religious + civic);
  }

  if (institutionId === "merchant_guild") {
    const axis = Math.max(-2, Math.min(2, Math.floor(Number(state.city.militaryMercantile) || 0)));
    const externalServed = sumEconomyDemand(economy.reports, "served", "external_markets");
    const externalUnmet = sumEconomyDemand(economy.reports, "unmet", "external_markets");
    const populationUnmet = sumEconomyDemand(economy.reports, "unmet", "population");
    const imperialUnmet = sumEconomyDemand(economy.reports, "unmet", "imperial");
    let penalty = 0;
    if (axis === -2) penalty = externalUnmet + populationUnmet * 2;
    else if (axis === -1) penalty = externalUnmet + populationUnmet;
    else if (axis === 0) penalty = externalUnmet + imperialUnmet;
    else if (axis === 1) penalty = Math.ceil(externalUnmet / 2);
    else penalty = Math.floor(externalUnmet / 3);
    return Math.min(4, Math.max(0, externalServed * 2 - penalty));
  }

  const arcaneAxis = Math.max(-2, Math.min(2, Math.floor(Number(state.city.religionArcane) || 0)));
  const cumulativeTierIncreases = (state.productionSectors ?? [])
    .filter(sector => sector.id !== "food")
    .reduce((sum, sector) => sum + Math.max(0, clampInt(sector.tier ?? 1, 1) - 1), 0);
  let permanent = 0;
  if (arcaneAxis === -2) permanent = Math.floor(cumulativeTierIncreases / 3);
  else if (arcaneAxis === -1) permanent = Math.floor(cumulativeTierIncreases / 4);

  // AI-only forecast: a nearly completed Sector development makes a same-
  // Generation Scholarium breakthrough partly foreseeable.
  let breakthroughExpectation = 0;
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === "food" || sector.tier >= 3) continue;
    const breakthrough = sector.tier === 1 ? 2 : 4;
    if (sector.developmentPhase === 2) breakthroughExpectation += breakthrough * 0.75;
    else if (sector.developmentPhase === 1) breakthroughExpectation += breakthrough * 0.25;
  }
  return permanent + breakthroughExpectation;
}

function influenceShadowValue(state, player, profile) {
  const maxInfluence = Math.max(1, Number(player.maxInfluence) || 10);
  const scarcity = 1 - Math.min(1, Math.max(0, Number(player.influence) || 0) / maxInfluence);
  let value = profile.prestige * 0.20
    + profile.wealth * 0.30
    + profile.engine * 0.35
    + profile.civic * 0.15;

  if (state.lands.some(land => !land.revealed && !land.ownerId) && player.influence < 3) {
    value += profile.engine * 0.15;
  }
  const food = base.getFoodSubsistenceStatus(state);
  if (food.localCapacity < desiredRawFoodCapacity(state) && player.influence < 2) {
    value += profile.civic * 0.20;
  }
  if (state.productionSectors.some(sector => sector.tier < 3 && sector.developmentPhase === 0) && player.influence < 1) {
    value += profile.engine * 0.15;
  }
  if (state.productionSectors.some(sector => demandTotal(sector) > 0)) {
    value += (profile.prestige + profile.wealth) * 0.075;
  }
  return value * (0.85 + scarcity * 0.65);
}

function currentAgentIncomeRoom(state, player, excludedAgentId = null) {
  const erosion = Math.max(0, Number(base.V084_CONFIG.influence.erosion) || 0);
  const afterErosion = Math.max(0, (Number(player.influence) || 0) - erosion);
  const otherIncome = getInstitutionAgentRoster(player)
    .filter(agent => agent.id !== excludedAgentId)
    .reduce((sum, agent) => sum + clampInt(agent.seniority ?? 1, 1, 3), 0);
  const maxInfluence = Math.max(0, Number(player.maxInfluence) || 0);
  return Math.max(0, maxInfluence - Math.min(maxInfluence, afterErosion + otherIncome));
}

function agentContinuationValue(state, player, agent) {
  const profile = profileFor(state, player);
  const horizon = Math.max(1, Math.floor(profile.horizon));
  const institutionScore = estimatedInstitutionScore(state, agent.institutionId);
  const influenceValue = influenceShadowValue(state, player, profile);
  let utility = 0;
  for (let t = 0; t < horizon; t += 1) {
    const seniority = Math.min(3, clampInt(agent.seniority ?? 1, 1, 3) + t);
    const effectiveInfluence = t === 0
      ? Math.min(seniority, currentAgentIncomeRoom(state, player, agent.id ?? null))
      : seniority;
    utility += (profile.discount ** t) * (
      institutionScore * profile.prestige
      + effectiveInfluence * influenceValue
    );
  }
  return utility;
}

function weakestAgents(state, player) {
  return getInstitutionAgentRoster(player)
    .map(agent => ({ agent, value: agentContinuationValue(state, player, agent) }))
    .sort((a, b) => a.value - b.value
      || a.agent.seniority - b.agent.seniority
      || b.agent.placementOrder - a.agent.placementOrder);
}

function recallLog(player, agent, reason, forced) {
  return {
    type: `${forced ? "Forced Agent recall" : "Agent recall"}: ${player.familyName} withdrew seniority ${agent.seniority} from ${INSTITUTION_LABELS[agent.institutionId]}`,
    actionKind: "agent_recall",
    freeAction: true,
    forced,
    reason,
    playerId: player.id,
    agentId: agent.id,
    institutionId: agent.institutionId,
    seniorityLost: agent.seniority,
    wealthReleased: V090_CONFIG.agents.wealthCommitment,
  };
}

function enforceAgentCapacity(state, reason = "wealth_capacity_drop") {
  ensureInstitutionAgentState(state);
  const recalls = [];
  for (const player of state.players) {
    const gross = Math.max(0, Math.floor(base.projectedWealthCapacity(state, player.id)));
    while (deployedInstitutionAgentCount(player) > gross) {
      const weakest = weakestAgents(state, player)[0];
      if (!weakest) break;
      const recalled = recallInstitutionAgent(player, weakest.agent.id);
      if (!recalled) break;
      recalls.push(recallLog(player, recalled, reason, true));
    }
  }
  return recalls;
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
  land.baseCapacity = base.V084_CONFIG.hinterland.tileCapacity;
  land.name = `${def.label} · Territory ${land.id.split("_").at(-1)}`;
  return { terrain, resourceType: def.resourceType, roll };
}

function executeExplore(state, player, land, sequence) {
  const influenceCost = base.V084_CONFIG.hinterland.acquisitionInfluenceCost;
  const wealthCost = base.V084_CONFIG.hinterland.acquisitionWealthCost;
  if (!canPay(state, player, influenceCost, wealthCost)) return null;
  const reveal = revealTerrain(state, land);
  if (!reveal) return null;

  player.influence -= influenceCost;
  player.wealthCommittedThisGeneration = (player.wealthCommittedThisGeneration || 0) + wealthCost;
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
    influenceCost,
    wealthCost,
  };
}

function expectedPrivateLandValue(state, player, land) {
  const profile = profileFor(state, player);
  const sectorId = RESOURCE_TO_SECTOR[land.resourceType];
  const sector = state.productionSectors.find(item => item.id === sectorId);
  if (!sector) return 0;

  const rawCapacity = Math.max(1, base.sectorResourceCapacity(state, sectorId));
  const demand = demandTotal(sector);
  const scarcity = Math.min(1.5, demand / rawCapacity);
  const recurringPrestige = profile.prestige * annuity(profile) * Math.min(1, scarcity);
  const engineOption = profile.engine * annuity(profile) * (0.55 + 0.45 * scarcity);
  const commercialOption = (Number(sector.demandThisGeneration.external_markets) || 0) > 0
    ? profile.wealth * annuity(profile) * 0.30
    : 0;
  return recurringPrestige + engineOption + commercialOption;
}

function desiredRawFoodCapacity(state) {
  const population = Math.max(1, Number(state.city.population) || 1);
  const currentFood = base.getFoodSubsistenceStatus(state).localCapacity;
  const urbanHeadroom = currentUrbanCapacity(state) > population;
  const lowEnoughSqualor = state.city.squalor < population;
  const growthPlausible = currentFood >= population && urbanHeadroom && lowEnoughSqualor;
  return population + (growthPlausible ? 1 : 0);
}

function chooseFarmLand(state, player) {
  const candidates = state.lands
    .filter(land => land.revealed && land.ownerId === player.id && land.development === "natural")
    .map(land => ({ land, value: expectedPrivateLandValue(state, player, land) }))
    .sort((a, b) => a.value - b.value || (a.land.explorationOrder ?? 9999) - (b.land.explorationOrder ?? 9999));
  return candidates[0] ?? null;
}

function farmCandidate(state, player, farmAlreadyBuilt) {
  if (V090_CONFIG.civicFarm.onePerGeneration && farmAlreadyBuilt) return null;
  const food = base.getFoodSubsistenceStatus(state);
  const target = desiredRawFoodCapacity(state);
  if (food.localCapacity >= target) return null;

  const influenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;
  const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;
  if (!canPay(state, player, influenceCost, wealthCost)) return null;

  const selected = chooseFarmLand(state, player);
  if (!selected) return null;

  const profile = profileFor(state, player);
  const population = Math.max(1, Number(state.city.population) || 1);
  const currentDeficit = Math.max(0, population - food.localCapacity);
  const futureDeficit = Math.max(0, target - food.localCapacity);
  const immediatePrestige = V090_CONFIG.civicFarmPrestige * profile.prestige;
  const civicBenefit = profile.civic * (currentDeficit * 1.9 + futureDeficit * 0.8);
  const utility = immediatePrestige + civicBenefit - selected.value
    - influenceCost * 0.20 - wealthCost * 0.25;

  if (utility < V090_CONFIG.civicFarm.minimumUtility) return null;
  return { type: "farm", score: utility, land: selected.land, target, profile };
}

function executeFarm(state, player, candidate, sequence) {
  const land = candidate.land;
  const influenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;
  const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;
  if (!canPay(state, player, influenceCost, wealthCost)) return null;

  player.influence -= influenceCost;
  player.wealthCommittedThisGeneration = (player.wealthCommittedThisGeneration || 0) + wealthCost;
  player.prestige += V090_CONFIG.civicFarmPrestige;

  const previousResourceType = land.resourceType;
  land.development = "farm";
  land.terrain = "farm";
  land.resourceType = "grain";
  land.ownerId = V090_CONFIG.publicFarmOwnerId;
  land.publicFarm = true;
  land.civicFarmContributorId = player.id;
  land.civicFarmGeneration = state.generation;

  return {
    sequence,
    type: "farm_conversion",
    civicFarm: true,
    playerId: player.id,
    landId: land.id,
    originalTerrain: land.originalTerrain,
    previousResourceType,
    influenceCost,
    wealthCost,
    prestigeAward: V090_CONFIG.civicFarmPrestige,
    ownershipTransferredTo: V090_CONFIG.publicFarmOwnerId,
    foodTarget: candidate.target,
    aiPersonality: player.aiPersonality,
  };
}

function nextDevelopmentCost(sector) {
  if (sector.tier >= 3) return null;
  const phase = sector.developmentPhase + 1;
  return { phase, ...base.V084_CONFIG.developmentPhases[phase] };
}

function developmentCandidate(state, player, sector) {
  if (sector.tier >= 3 || sector.lastDevelopmentGeneration === state.generation) return null;
  const cost = nextDevelopmentCost(sector);
  if (!cost || !canPay(state, player, cost.influenceCost, cost.wealthCost)) return null;

  const profile = profileFor(state, player);
  const currentSlots = sector.tier * 3;
  const futureSlots = (sector.tier + 1) * 3;
  const rawCapacity = base.sectorResourceCapacity(state, sector.id);
  const demand = demandTotal(sector);
  const currentPotential = Math.min(currentSlots, rawCapacity, demand);
  const futurePotential = Math.min(futureSlots, Math.max(rawCapacity, currentSlots + 1), Math.max(demand, currentSlots + 1));
  const extraPotential = Math.max(0, futurePotential - currentPotential);
  const projectStarted = sector.developmentPhase > 0;

  const priorities = base.getDemandPriorityGroups(state);
  const seq = allocateDemand(Math.max(currentPotential, futurePotential), sector.demandThisGeneration, priorities);
  let futureNeedValue = 0;
  for (let index = currentPotential; index < futurePotential; index += 1) {
    futureNeedValue += categoryPerGenerationUtility(seq[index] ?? "external_markets", profile);
  }

  const remainingPhases = Math.max(1, 3 - sector.developmentPhase);
  const engineValue = (futureNeedValue * annuity(profile) + extraPotential * profile.engine * 0.8)
    / remainingPhases;
  const immediatePrestige = cost.prestige * profile.prestige;
  const continuityBonus = projectStarted ? profile.engine * 1.0 : 0;
  const merchantPreinvestment = player.aiPersonality === "merchant"
    && (Number(sector.demandThisGeneration.external_markets) || 0) > 0
    ? profile.engine * 0.75
    : 0;
  const score = immediatePrestige + engineValue + continuityBonus + merchantPreinvestment
    - cost.influenceCost * 0.25 - cost.wealthCost * 0.35;

  if (!projectStarted && extraPotential <= 0 && demand <= currentSlots && player.aiPersonality !== "merchant") return null;
  return { type: "development", score, sector, cost };
}

function executeDevelopment(state, player, candidate, sequence) {
  const { sector, cost } = candidate;
  if (!canPay(state, player, cost.influenceCost, cost.wealthCost)) return null;
  if (sector.lastDevelopmentGeneration === state.generation) return null;

  player.influence -= cost.influenceCost;
  player.wealthCommittedThisGeneration = (player.wealthCommittedThisGeneration || 0) + cost.wealthCost;
  player.prestige += cost.prestige;

  const targetTier = sector.tier + 1;
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
    aiPersonality: player.aiPersonality,
  };
}

function explorationCandidate(state, player) {
  const land = state.lands.find(item => !item.revealed && !item.ownerId);
  if (!land) return null;
  const influenceCost = base.V084_CONFIG.hinterland.acquisitionInfluenceCost;
  const wealthCost = base.V084_CONFIG.hinterland.acquisitionWealthCost;
  if (!canPay(state, player, influenceCost, wealthCost)) return null;

  const profile = profileFor(state, player);
  const pressures = state.productionSectors.map(sector => {
    const demand = demandTotal(sector);
    const raw = base.sectorResourceCapacity(state, sector.id);
    return Math.max(0, Math.min(demand, sector.tier * 3) - raw);
  });
  const averagePressure = pressures.reduce((sum, value) => sum + value, 0) / Math.max(1, pressures.length);
  const noPrivateLand = !state.lands.some(item => item.ownerId === player.id && item.development === "natural");
  const expectedLandPrestige = profile.prestige * annuity(profile) * 0.45;
  const engineValue = profile.engine * annuity(profile) * (0.55 + averagePressure * 0.35);
  const score = expectedLandPrestige + engineValue + (noPrivateLand ? 1.0 : 0)
    - influenceCost * 0.30 - wealthCost * 0.30;
  return { type: "explore", score, land };
}

function agentCandidate(state, player, institutionId) {
  if (freeProjectedWealth(state, player) < V090_CONFIG.agents.wealthCommitment) return null;
  const provisional = {
    id: null,
    institutionId,
    seniority: 1,
    placementOrder: Number.POSITIVE_INFINITY,
  };
  const score = agentContinuationValue(state, player, provisional);
  if (score <= V090_CONFIG.agents.minimumUtility) return null;
  return {
    type: "agent",
    score,
    institutionId,
    estimatedInstitutionScore: estimatedInstitutionScore(state, institutionId),
  };
}

function collectNonAuctionCandidates(state, player, farmAlreadyBuilt) {
  const candidates = [];
  const farm = farmCandidate(state, player, farmAlreadyBuilt);
  if (farm) candidates.push(farm);
  const explore = explorationCandidate(state, player);
  if (explore) candidates.push(explore);
  for (const sector of state.productionSectors) {
    const dev = developmentCandidate(state, player, sector);
    if (dev) candidates.push(dev);
  }
  for (const institutionId of INSTITUTION_IDS) {
    const agent = agentCandidate(state, player, institutionId);
    if (agent) candidates.push(agent);
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

function chooseNonAuctionAction(state, player, farmAlreadyBuilt) {
  ensureInstitutionAgentState(state);
  const normalCandidates = collectNonAuctionCandidates(state, player, farmAlreadyBuilt);
  const normal = normalCandidates[0] ?? null;
  let best = normal && normal.score > V090_CONFIG.agents.minimumUtility
    ? { ...normal, recallAgentIds: [] }
    : null;
  let bestNet = best?.score ?? V090_CONFIG.agents.minimumUtility;

  const weak = weakestAgents(state, player);
  let cumulativeLoss = 0;
  for (let releaseCount = 1; releaseCount <= weak.length; releaseCount += 1) {
    cumulativeLoss += weak[releaseCount - 1].value;
    player.agentWealthReleasePreview = releaseCount;
    const unlocked = collectNonAuctionCandidates(state, player, farmAlreadyBuilt)[0] ?? null;
    player.agentWealthReleasePreview = 0;
    if (!unlocked) continue;
    const net = unlocked.score - cumulativeLoss;
    const requiredImprovement = best
      ? V090_CONFIG.agents.reallocationThreshold
      : V090_CONFIG.agents.minimumUtility;
    if (net > bestNet + requiredImprovement) {
      best = {
        ...unlocked,
        recallAgentIds: weak.slice(0, releaseCount).map(item => item.agent.id),
        recallValueLost: cumulativeLoss,
        netScore: net,
      };
      bestNet = net;
    }
  }
  player.agentWealthReleasePreview = 0;
  return best;
}

function executeAgentPlacement(state, player, candidate, sequence) {
  if (freeProjectedWealth(state, player) < V090_CONFIG.agents.wealthCommitment) return null;
  const agent = addInstitutionAgent(state, player, candidate.institutionId);
  if (!agent) return null;
  return {
    sequence,
    type: `Agent placement: ${player.familyName} → ${INSTITUTION_LABELS[candidate.institutionId]} (seniority 1, 1W reserved)`,
    actionKind: "agent_placement",
    playerId: player.id,
    agentId: agent.id,
    institutionId: candidate.institutionId,
    seniority: 1,
    wealthReserved: V090_CONFIG.agents.wealthCommitment,
    estimatedInstitutionScore: candidate.estimatedInstitutionScore,
    aiUtility: candidate.score,
    aiPersonality: player.aiPersonality,
  };
}

function executeCandidate(state, player, candidate, sequence) {
  if (candidate.type === "farm") return executeFarm(state, player, candidate, sequence);
  if (candidate.type === "explore") return executeExplore(state, player, candidate.land, sequence);
  if (candidate.type === "development") return executeDevelopment(state, player, candidate, sequence);
  if (candidate.type === "agent") return executeAgentPlacement(state, player, candidate, sequence);
  return null;
}

function addProductionStake(state, playerId, sectorId) {
  const sector = state.productionSectors.find(item => item.id === sectorId);
  const occupancy = base.getSectorOccupancy(state, sectorId);
  if (!sector || occupancy.young >= sector.tier) return null;
  const player = getPlayer(state, playerId);
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

function resolvePersonalityAuctions(state, sequenceStart) {
  const actions = [];
  const auctions = [];
  let sequence = sequenceStart;
  const turnOrder = base.getTurnOrder(state);
  const orderIndex = new Map(turnOrder.map((player, index) => [player.id, index]));

  for (const sector of state.productionSectors) {
    let occupancy = base.getSectorOccupancy(state, sector.id);
    let availableYoung = Math.max(0, sector.tier - occupancy.young);

    while (availableYoung > 0) {
      const valuations = state.players.map(player => {
        const estimate = expectedStakeValue(state, player, sector);
        const maxBid = estimate.utility >= 1.15
          ? Math.min(player.influence, Math.max(1, Math.floor(estimate.utility / 1.45)))
          : 0;
        return { player, ...estimate, maxBid };
      }).filter(item => item.maxBid > 0);

      if (!valuations.length) break;
      valuations.sort((a, b) => b.maxBid - a.maxBid
        || b.utility - a.utility
        || (orderIndex.get(a.player.id) ?? 999) - (orderIndex.get(b.player.id) ?? 999));

      const winner = valuations[0];
      const secondBid = valuations[1]?.maxBid ?? 0;
      const winningBid = Math.min(winner.maxBid, Math.max(1, secondBid + 1));
      if (winner.player.influence < winningBid) break;

      winner.player.influence -= winningBid;
      const stake = addProductionStake(state, winner.player.id, sector.id);
      if (!stake) break;

      const auctionId = `${sector.id}:young:g${state.generation}:${occupancy.young + 1}`;
      const auction = {
        auctionId,
        sectorId: sector.id,
        slotNumber: occupancy.young + 1,
        winnerId: winner.player.id,
        winningBid,
        stakeId: stake.id,
        expectedCategory: winner.category,
        valuations: valuations.map(item => ({
          playerId: item.player.id,
          personality: item.player.aiPersonality,
          category: item.category,
          utility: item.utility,
          maxBid: item.maxBid,
        })),
        closed: true,
        turns: [],
      };
      auctions.push(auction);
      actions.push({
        sequence: sequence++,
        type: "bid",
        playerId: winner.player.id,
        sectorId: sector.id,
        auctionId,
        bid: winningBid,
        expectedCategory: winner.category,
        aiPersonality: winner.player.aiPersonality,
      });

      occupancy = base.getSectorOccupancy(state, sector.id);
      availableYoung = Math.max(0, sector.tier - occupancy.young);
    }
  }
  return { actions, auctions, nextSequence: sequence };
}

function performActionTurn(state, player, farmBuilt, actions, sequence) {
  const candidate = chooseNonAuctionAction(state, player, farmBuilt);
  if (!candidate) return { sequence, farmBuilt };

  for (const agentId of candidate.recallAgentIds ?? []) {
    const recalled = recallInstitutionAgent(player, agentId);
    if (!recalled) continue;
    const log = recallLog(player, recalled, "better_action_opportunity", false);
    log.sequence = sequence++;
    actions.push(log);
  }

  const action = executeCandidate(state, player, candidate, sequence);
  if (!action) return { sequence, farmBuilt };
  actions.push(action);
  sequence += 1;
  if (action.type === "farm_conversion") farmBuilt = true;
  base.applyAutoDemand(state);

  const forced = enforceAgentCapacity(state, "wealth_capacity_drop_after_action");
  for (const recall of forced) {
    recall.sequence = sequence++;
    actions.push(recall);
  }
  return { sequence, farmBuilt };
}

function runPersonalityActionPhase(state) {
  ensureInstitutionAgentState(state);
  for (const player of state.players) player.wealthCommittedThisGeneration = 0;
  base.applyAutoDemand(state);
  const actions = [];
  const turnOrder = base.getTurnOrder(state);
  let sequence = 1;
  let farmBuilt = false;

  for (const player of turnOrder) {
    const result = performActionTurn(state, player, farmBuilt, actions, sequence);
    sequence = result.sequence;
    farmBuilt = result.farmBuilt;
  }

  const auctionPhase = resolvePersonalityAuctions(state, sequence);
  actions.push(...auctionPhase.actions);
  sequence = auctionPhase.nextSequence;
  base.applyAutoDemand(state);
  const postAuctionRecalls = enforceAgentCapacity(state, "wealth_capacity_drop_after_auction");
  for (const recall of postAuctionRecalls) {
    recall.sequence = sequence++;
    actions.push(recall);
  }

  for (const player of turnOrder) {
    const result = performActionTurn(state, player, farmBuilt, actions, sequence);
    sequence = result.sequence;
    farmBuilt = result.farmBuilt;
  }

  return { actions, auctions: auctionPhase.auctions };
}

function chooseExpansionLand(state) {
  return state.lands
    .filter(land => land.revealed && land.development !== "urban")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999))[0] ?? null;
}

function estimateExpansionUtility(state, player, target) {
  const profile = profileFor(state, player);
  const population = Math.max(1, Number(state.city.population) || 1);
  const capacityBefore = currentUrbanCapacity(state);
  const capacityAfter = capacityBefore + base.V084_CONFIG.urban.populationPerTile;
  const overcrowdingBefore = Math.max(0, population - capacityBefore);
  const overcrowdingAfter = Math.max(0, population - capacityAfter);
  const overcrowdingRelief = overcrowdingBefore - overcrowdingAfter;

  let utility = profile.civic * overcrowdingRelief * 1.75;
  if (population === capacityBefore) utility += profile.civic * 1.35;
  if (population > capacityBefore) utility += profile.civic * 0.75;

  if (target.development === "natural") {
    utility -= profile.engine * Math.max(0, Number(target.baseCapacity) || 0) * 0.40;
  }
  if (target.ownerId === player.id) {
    utility -= expectedPrivateLandValue(state, player, target) * 0.85;
  }
  if (target.development === "farm") {
    const foodBefore = base.getFoodSubsistenceStatus(state).localCapacity;
    const foodAfter = Math.max(0, foodBefore - (Number(target.baseCapacity) || 0));
    if (foodAfter < population) {
      utility -= profile.civic * (3.0 + (population - foodAfter) * 0.9);
    } else if (foodAfter === population) {
      utility -= profile.civic * 1.25;
    }
  }
  return utility;
}

function influenceSpendForUtility(player, utility, isProposer) {
  const intensity = Math.abs(utility);
  let desired = 0;
  for (const threshold of V090_CONFIG.expansionVote.influenceThresholds) {
    if (intensity >= threshold) desired += 1;
  }
  if (isProposer) desired = Math.max(V090_CONFIG.expansionVote.minimumProposalInfluence, desired);
  return Math.min(Math.max(0, player.influence), desired);
}

function absorbLandForVote(state, target, generation) {
  const event = {
    landId: target.id,
    landName: target.name,
    explorationOrder: target.explorationOrder,
    originalTerrain: target.originalTerrain,
    previousDevelopment: target.development,
    previousOwnerId: target.ownerId,
    previousResourceType: target.resourceType,
    lostCapacity: Math.max(0, Number(target.baseCapacity) || 0),
    viaCivicVote: true,
  };
  target.formerOwnerId = target.ownerId;
  target.formerResourceType = target.resourceType;
  target.formerCapacity = target.baseCapacity;
  target.ownerId = "city";
  target.development = "urban";
  target.terrain = "urban";
  target.resourceType = "urban";
  target.baseCapacity = 0;
  target.usedCapacityThisGeneration = 0;
  target.urbanizedGeneration = generation;
  state.city.urbanTiles = currentUrbanTiles(state) + 1;
  state.city.urbanCapacity = currentUrbanCapacity(state);
  return event;
}

function runExpansionVote(state) {
  const population = Math.max(1, Number(state.city.population) || 1);
  const urbanCapacityBefore = currentUrbanCapacity(state);
  const urbanTilesBefore = currentUrbanTiles(state);
  const target = chooseExpansionLand(state);
  const result = {
    eligible: population >= urbanCapacityBefore && Boolean(target),
    proposed: false,
    passed: false,
    generation: state.generation,
    population,
    urbanTilesBefore,
    urbanCapacityBefore,
    targetLandId: target?.id ?? null,
    targetLandName: target?.name ?? null,
    targetDevelopment: target?.development ?? null,
    targetOwnerId: target?.ownerId ?? null,
    proposerId: null,
    yesVotes: 0,
    noVotes: 0,
    abstentions: 0,
    ballots: [],
    expansionEvent: null,
    reason: null,
  };
  if (!result.eligible) {
    result.reason = target ? "population_below_capacity" : "no_expandable_hinterland";
    return result;
  }

  const evaluations = state.players.map(player => ({ player, utility: estimateExpansionUtility(state, player, target) }));
  const proposer = evaluations
    .filter(item => item.player.influence >= V090_CONFIG.expansionVote.minimumProposalInfluence)
    .sort((a, b) => b.utility - a.utility)[0] ?? null;
  if (!proposer || proposer.utility <= V090_CONFIG.expansionVote.proposalUtilityThreshold) {
    result.reason = "no_ai_proposer";
    result.evaluations = evaluations.map(item => ({
      playerId: item.player.id,
      personality: item.player.aiPersonality,
      utility: item.utility,
    }));
    return result;
  }

  result.proposed = true;
  result.proposerId = proposer.player.id;
  for (const evaluation of evaluations) {
    const { player, utility } = evaluation;
    let stance = "abstain";
    if (utility > 0.25) stance = "yes";
    else if (utility < -0.25) stance = "no";
    const isProposer = player.id === proposer.player.id;
    if (isProposer) stance = "yes";
    const influenceSpent = stance === "abstain" ? 0 : influenceSpendForUtility(player, utility, isProposer);
    player.influence = Math.max(0, player.influence - influenceSpent);
    const voteStrength = stance === "abstain" ? 0 : 1 + influenceSpent;
    if (stance === "yes") result.yesVotes += voteStrength;
    else if (stance === "no") result.noVotes += voteStrength;
    else result.abstentions += 1;
    result.ballots.push({
      playerId: player.id,
      personality: player.aiPersonality,
      stance,
      utility,
      baseVote: stance === "abstain" ? 0 : 1,
      influenceSpent,
      voteStrength,
    });
  }

  result.passed = result.yesVotes > result.noVotes;
  result.reason = result.passed ? "approved" : "rejected_or_tied";
  if (result.passed) result.expansionEvent = absorbLandForVote(state, target, state.generation);
  return result;
}

function grossInfluenceIncome(state) {
  return state.players.map(player => {
    const before = player.influence;
    player.influence = Math.min(player.maxInfluence, player.influence + base.V084_CONFIG.influence.grossIncome);
    return {
      playerId: player.id,
      before,
      grossIncome: base.V084_CONFIG.influence.grossIncome,
      actuallyReceived: player.influence - before,
      afterIncome: player.influence,
    };
  });
}

function erodeInfluence(state) {
  for (const player of state.players) {
    player.influence = Math.max(0, player.influence - base.V084_CONFIG.influence.erosion);
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
    .filter(land => land.revealed && land.development === "farm" && land.ownerId && land.ownerId !== "city")
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

function diseaseChance(squalor) {
  const levels = Object.keys(base.V084_CONFIG.diseaseChanceBySqualor).map(Number).sort((a, b) => a - b);
  let selected = levels[0] ?? 0;
  for (const level of levels) {
    if (squalor >= level) selected = level;
    else break;
  }
  return base.V084_CONFIG.diseaseChanceBySqualor[selected] ?? 0;
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
  return { nextFirstPlayerId: state.firstPlayerId, maxInfluence, maxPrestige, maxWealth, tieBreakMethod, randomRoll };
}

function voteLogAction(vote) {
  if (!vote.eligible) return { type: `Civic expansion vote — not eligible (${vote.reason})`, civicVote: true };
  if (!vote.proposed) return { type: "Civic expansion vote — no Family proposed expansion", civicVote: true };
  return {
    type: `Civic expansion vote — YES ${vote.yesVotes} / NO ${vote.noVotes} — ${vote.passed ? "PASSED" : "FAILED"}`,
    civicVote: true,
  };
}

export function resolveAutomatedGeneration(state) {
  assignPersonalities(state);
  ensureInstitutionAgentState(state);
  state.phase = "beginning_of_generation";
  base.applyAutoDemand(state);

  const forcedAgentRecalls = enforceAgentCapacity(state, "generation_start_wealth_capacity");
  const generation = state.generation;
  const populationBefore = state.city.population;
  const squalorBefore = state.city.squalor;
  const prestigeBefore = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));
  const firstPlayerBefore = state.firstPlayerId;
  const urbanTilesBefore = currentUrbanTiles(state);
  const urbanCapacityBefore = currentUrbanCapacity(state);

  const influenceIncome = grossInfluenceIncome(state);
  const vote = runExpansionVote(state);
  const turnOrderBefore = base.getTurnOrder(state).map(player => player.id);

  state.phase = "action_phase";
  const actionPhase = runPersonalityActionPhase(state);

  state.phase = "production_resolution";
  base.applyAutoDemand(state);
  const economy = base.previewEconomy(state);
  const reports = economy.reports;
  const familyWealth = economy.familyWealth;
  const subsistence = base.getFoodSubsistenceStatus(state);
  markProductionUsage(state, reports, subsistence);

  for (const player of state.players) {
    player.wealthGeneratedThisGeneration = familyWealth[player.id] ?? base.V084_CONFIG.familyBaseWealth;
  }

  const populationPrestigeAwards = [];
  for (const report of reports) {
    for (const stake of report.servedStakes ?? []) {
      if (stake.demandCategory !== "population") continue;
      const player = getPlayer(state, stake.ownerId);
      if (!player) continue;
      player.prestige += base.V084_CONFIG.rewards.cityPrestigePerNeed;
      populationPrestigeAwards.push({
        playerId: player.id,
        sectorId: report.sectorId,
        amount: base.V084_CONFIG.rewards.cityPrestigePerNeed,
      });
    }
  }

  const landPrestigeAwards = [];
  for (const land of state.lands) {
    if (!land.ownerId || land.ownerId === "city" || land.ownerId === V090_CONFIG.publicFarmOwnerId) continue;
    if (land.usedCapacityThisGeneration <= 0 || land.development !== "natural") continue;
    const player = getPlayer(state, land.ownerId);
    if (!player) continue;
    player.prestige += base.V084_CONFIG.rewards.productiveLandPrestige;
    landPrestigeAwards.push({
      playerId: player.id,
      landId: land.id,
      landName: land.name,
      amount: base.V084_CONFIG.rewards.productiveLandPrestige,
    });
  }

  const imperialUnmetTotal = reports.reduce(
    (sum, report) => sum + Math.max(0, Number(report.demand?.unmet?.imperial) || 0),
    0,
  );
  const imperialDemandPenaltyApplied = imperialUnmetTotal > 0;
  const imperialDemandPrestigeLosses = imperialDemandPenaltyApplied
    ? applyPrestigeLossToAll(state, base.V084_CONFIG.rewards.imperialUnmetPrestigeLoss, "imperial_demand_unmet")
    : [];

  const imperialFoodAidUsed = subsistence.imperialAid > 0;
  const imperialFoodPrestigeLosses = imperialFoodAidUsed
    ? applyPrestigeLossToAll(state, base.V084_CONFIG.rewards.imperialFoodAidPrestigeLoss, "imperial_food_aid")
    : [];

  const unmetCityDemand = reports.reduce(
    (sum, report) => sum + Math.max(0, Number(report.demand?.unmet?.population) || 0),
    0,
  );
  const urbanCapacityForSqualor = currentUrbanCapacity(state);
  const overcrowdingBeforeExpansion = Math.max(0, populationBefore - urbanCapacityForSqualor);
  const directSqualor = overcrowdingBeforeExpansion + unmetCityDemand;
  state.city.squalor = directSqualor;

  const growthBlockedBySqualor = directSqualor >= populationBefore;
  const growth = !imperialFoodAidUsed && !growthBlockedBySqualor
    ? base.V084_CONFIG.population.growthOnFullLocalFood
    : 0;
  const populationBeforeDisease = Math.max(
    base.V084_CONFIG.population.minimum,
    populationBefore + growth,
  );

  const diseaseProbability = diseaseChance(directSqualor);
  const diseaseRoll = nextRandom(state);
  const diseaseOccurred = populationBeforeDisease > base.V084_CONFIG.population.minimum
    && diseaseRoll < diseaseProbability;
  const diseaseLoss = diseaseOccurred ? 1 : 0;
  state.city.population = Math.max(
    base.V084_CONFIG.population.minimum,
    populationBeforeDisease - diseaseLoss,
  );

  state.city.urbanTiles = currentUrbanTiles(state);
  state.city.urbanCapacity = currentUrbanCapacity(state);

  const wealthCommitments = state.players.map(player => {
    const gross = familyWealth[player.id] ?? base.V084_CONFIG.familyBaseWealth;
    const actionCommitted = player.wealthCommittedThisGeneration || 0;
    const agentCommitted = deployedInstitutionAgentCount(player) * V090_CONFIG.agents.wealthCommitment;
    const committed = actionCommitted + agentCommitted;
    const available = Math.max(0, gross - committed);
    const shortfall = Math.max(0, committed - gross);
    player.lastWealthCommitted = committed;
    player.lastWealthAvailable = available;
    player.lastWealthShortfall = shortfall;
    return { playerId: player.id, gross, committed, actionCommitted, agentCommitted, available, shortfall };
  });

  state.phase = "influence_erosion";
  erodeInfluence(state);
  state.phase = "stake_aging";
  ageProductionStakes(state);

  const renownBeforeGrowth = state.city.renown;
  const renownGain = generation % base.V084_CONFIG.renown.gainEveryGenerations === 0
    ? base.V084_CONFIG.renown.gainAmount
    : 0;
  const renownBeforeCap = renownBeforeGrowth + renownGain;
  const renownCap = state.city.population * base.V084_CONFIG.renown.capPerPopulation;
  state.city.renown = Math.min(renownBeforeCap, renownCap);
  base.applyAutoDemand(state);

  const firstPlayerResolution = determineNextFirstPlayer(state);
  const requiredUrbanTiles = Math.max(
    1,
    Math.ceil(state.city.population / base.V084_CONFIG.urban.populationPerTile),
  );

  const summary = {
    generation,
    populationBefore,
    populationBeforeDisease,
    populationAfter: state.city.population,
    growth,
    growthBlockedBySqualor,
    famineLoss: 0,
    rawFoodPopulationNeed: subsistence.requested,
    rawFoodRequested: subsistence.localCapacity,
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
    urbanCapacityForSqualor,
    requiredUrbanTiles,
    expansionEvents: vote.passed && vote.expansionEvent ? [vote.expansionEvent] : [],
    urbanTilesAfter: state.city.urbanTiles,
    urbanCapacityAfter: state.city.urbanCapacity,
    expansionShortfall: Math.max(0, requiredUrbanTiles - state.city.urbanTiles),
    civicExpansionVote: vote,
    suppressedAutomaticExpansions: [],
    imperialUnmetTotal,
    imperialDemandPenaltyApplied,
    imperialDemandPrestigeLosses,
    economyReports: reports,
    populationPrestigeAwards,
    landPrestigeAwards,
    civicFarmPrestigeAwards: actionPhase.actions
      .filter(action => action.type === "farm_conversion")
      .map(action => ({ playerId: action.playerId, landId: action.landId, amount: action.prestigeAward })),
    wealthCommitments,
    wealthAfter: familyWealth,
    prestigeBefore,
    prestigeAfter: Object.fromEntries(state.players.map(player => [player.id, player.prestige])),
    influenceAfter: Object.fromEntries(state.players.map(player => [player.id, player.influence])),
    rawProductionAfterExpansion: base.getRawProductionBySector(state),
    explorationPoolAfter: base.getExplorationPoolCounts(state),
    firstPlayerBefore,
    turnOrderBefore,
    influenceIncome,
    forcedAgentRecalls,
    actions: [...forcedAgentRecalls, voteLogAction(vote), ...actionPhase.actions],
    auctions: actionPhase.auctions,
    firstPlayerResolution,
    nextFirstPlayerId: firstPlayerResolution.nextFirstPlayerId,
    renownBeforeGrowth,
    renownGain,
    renownBeforeCap,
    renownCap,
    renownLostToCap: Math.max(0, renownBeforeCap - state.city.renown),
    renownAfterGrowth: state.city.renown,
    aiProfiles: Object.fromEntries(state.players.map(player => {
      const profile = profileFor(state, player);
      return [player.id, {
        personality: player.aiPersonality,
        label: profile.label,
        prestigeWeight: profile.prestige,
        wealthWeight: profile.wealth,
        engineWeight: profile.engine,
        civicWeight: profile.civic,
        horizon: profile.horizon,
      }];
    })),
    foodTargetForNextDecision: desiredRawFoodCapacity(state),
  };

  state.history.push(summary);
  state.generation += 1;
  state.phase = "action_phase";
  for (const player of state.players) {
    player.wealthCommittedThisGeneration = 0;
    player.agentWealthReleasePreview = 0;
  }
  return summary;
}
