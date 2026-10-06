import * as legacy from "./v102-ai-engine.js?real=0.10.2-v110";
import * as base from "./v089-engine.js?base=0.8.9";

export * from "./v102-ai-engine.js?real=0.10.2-v110";

export const V090_CONFIG = {
  ...legacy.V090_CONFIG,
  actionRounds: null,
  actionUtilityFloor: 0.50,
  actionSafetyLimit: 120,
  agents: {
    ...legacy.V090_CONFIG.agents,
    wealthCommitment: 1,
    liquidityReserve: 1,
    utilityScale: 3.6,
    utilityReferences: { institution: 4.0, influence: 3.2, intrigue: 3.0 },
    utilityWeights: {
      default: { institution: 0.40, influence: 0.30, intrigue: 0.30 },
      dynast: { institution: 0.52, influence: 0.30, intrigue: 0.18 },
      merchant: { institution: 0.32, influence: 0.38, intrigue: 0.30 },
      contrarian: { institution: 0.28, influence: 0.22, intrigue: 0.50 },
      opportunist: { institution: 0.40, influence: 0.30, intrigue: 0.30 },
    },
    networkDiminishingReturns: { default: 0.06, dynast: 0.04, merchant: 0.18, contrarian: 0.08, opportunist: 0.06 },
  },
  mercenaryContract: {
    maintenanceBid: 1,
    wealthIncome: 1,
    rawFoodMaintenance: 1,
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
const RESOURCE_TO_SECTOR = { wool: "textiles", ore: "smithing", wood: "materials" };
const DEMAND_ORDER = ["imperial", "population", "external_markets"];
const FORTIFICATION_FORCE = [0, 1, 3, 6, 10];
const MANPOWER_DIVISORS = { "-2": 2, "-1": 4, "0": 8, "1": 16, "2": null };

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

function assignPersonalities(state) {
  state.players.forEach((player, index) => {
    player.aiPersonality ??= PERSONALITY_ORDER[index % PERSONALITY_ORDER.length];
  });
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
    player.institutionAgentRoster ??= [];
    for (const agent of player.institutionAgentRoster) {
      agent.seniority = clampInt(agent.seniority ?? 1, 1, 3);
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

function ensureV110State(state) {
  assignPersonalities(state);
  ensureInstitutionAgentState(state);
  state.city.influenceErosionThreshold = Math.max(
    1,
    clampInt(state.city.influenceErosionThreshold ?? base.V084_CONFIG.influence.softCapThreshold ?? 12, 1),
  );
  state.city.pendingGrowth = clampInt(state.city.pendingGrowth ?? 0, 0, 1);
  state.city.orderModifier = Math.max(-4, Math.min(4, Math.floor(Number(state.city.orderModifier) || 0)));
  state.city.imperialIntervention = clampInt(state.city.imperialIntervention ?? 0);
  state.city.imperialDemandThreshold = Math.max(1, clampInt(state.city.imperialDemandThreshold ?? 3, 1));
  state.mercenaryContract ??= {
    ownerId: null,
    lastWinningBid: 0,
    foodConsumedThisGeneration: false,
  };
  for (const player of state.players) {
    player.pendingPrestige = Math.floor(Number(player.pendingPrestige) || 0);
    player.wealthCapacity = Math.max(
      base.V084_CONFIG.familyBaseWealth,
      Math.floor(Number(player.wealthCapacity ?? player.wealthGeneratedThisGeneration ?? base.V084_CONFIG.familyBaseWealth) || base.V084_CONFIG.familyBaseWealth),
    );
    player.wealthGeneratedThisGeneration = player.wealthCapacity;
    player.maxInfluence = Number.MAX_SAFE_INTEGER;
    player.wealthCommittedThisGeneration ??= 0;
    player.agentWealthReleasePreview ??= 0;
  }
  return state;
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = base.createV084Game(familyNames);
  assignPersonalities(state);
  state.nextInstitutionAgentOrder = 1;
  state.city.influenceErosionThreshold = base.V084_CONFIG.influence.softCapThreshold ?? 12;
  state.city.pendingGrowth = 0;
  state.city.imperialIntervention ??= 0;
  state.city.imperialDemandThreshold ??= 3;
  state.mercenaryContract = { ownerId: null, lastWinningBid: 0, foodConsumedThisGeneration: false };
  for (const player of state.players) {
    player.institutionAgentRoster = [];
    player.institutionAgents = Object.fromEntries(INSTITUTION_IDS.map(id => [id, 0]));
    player.pendingPrestige = 0;
    player.wealthCapacity = base.V084_CONFIG.familyBaseWealth;
    player.wealthGeneratedThisGeneration = player.wealthCapacity;
    player.maxInfluence = Number.MAX_SAFE_INTEGER;
  }
  ensureV110State(state);
  if (typeof base.recalculateRenown === "function") base.recalculateRenown(state);
  base.applyAutoDemand(state);
  return state;
}

function profileFor(state, player) {
  const key = player.aiPersonality ?? "opportunist";
  const source = V090_CONFIG.personalities[key] ?? V090_CONFIG.personalities.opportunist;
  if (key !== "opportunist") return { ...source, key };
  const profile = { ...source, key };
  const avgPrestige = state.players.reduce((sum, item) => sum + item.prestige, 0) / Math.max(1, state.players.length);
  const avgWealth = state.players.reduce((sum, item) => sum + item.wealthCapacity, 0) / Math.max(1, state.players.length);
  if (player.prestige + 2 < avgPrestige) {
    profile.prestige = 1.30;
    profile.wealth = 0.90;
    profile.engine = 0.95;
  } else if (player.wealthCapacity + 0.5 < avgWealth) {
    profile.prestige = 0.90;
    profile.wealth = 1.30;
    profile.engine = 1.20;
  }
  const food = base.getFoodSubsistenceStatus(state);
  if (food.localCapacity < state.city.population || state.city.squalor >= Math.ceil(state.city.population / 2)) {
    profile.civic = 1.35;
  }
  return profile;
}

function annuity(profile, horizonOverride = null) {
  const horizon = Math.max(1, Math.floor(horizonOverride ?? profile.horizon));
  let total = 0;
  for (let t = 0; t < horizon; t += 1) total += profile.discount ** t;
  return total;
}

function currentForce(state, populationOverride = null) {
  const population = Math.max(1, clampInt(populationOverride ?? state.city.population, 1));
  const fortificationLevel = clampInt(state.city.fortificationLevel ?? 0, 0, 4);
  const structure = FORTIFICATION_FORCE[fortificationLevel] ?? 0;
  const axis = Math.max(-2, Math.min(2, Math.floor(Number(state.city.militaryMercantile) || 0)));
  const divisor = MANPOWER_DIVISORS[String(axis)];
  const manpower = divisor ? Math.min(4, Math.floor(population / divisor)) : 0;
  state.city.forceStructure = structure;
  state.city.forceManpower = manpower;
  state.city.force = structure + manpower;
  return state.city.force;
}

function baseOrderForPopulation(population) {
  const pop = Math.max(1, clampInt(population, 1));
  if (pop <= 3) return 3;
  if (pop >= 15) return 1;
  return 2;
}

function calculateOrder(state, unmetCityDemand, populationOverride = null) {
  const population = Math.max(1, clampInt(populationOverride ?? state.city.population, 1));
  const baseOrder = baseOrderForPopulation(population);
  const manualModifier = Math.max(-4, Math.min(4, Math.floor(Number(state.city.orderModifier) || 0)));
  const demandModifier = unmetCityDemand > 0 ? -1 : 0;
  const finalOrder = Math.max(0, Math.min(4, baseOrder + manualModifier + demandModifier));
  return {
    population,
    baseOrder,
    manualModifier,
    demandModifier,
    finalOrder,
    chaosTriggered: finalOrder <= 0,
    reason: `base ${baseOrder}${manualModifier ? ` · test ${manualModifier > 0 ? "+" : ""}${manualModifier}` : ""}${demandModifier ? " · unmet City -1" : ""}`,
  };
}

function sumDemand(reports, bucket, category) {
  return (reports ?? []).reduce((sum, report) =>
    sum + Math.max(0, Number(report?.demand?.[bucket]?.[category]) || 0), 0);
}

function calculateInstitutionScores(state, reports, tierUpActions = [], orderOverride = null, populationOverride = null) {
  const population = Math.max(1, clampInt(populationOverride ?? state.city.population, 1));
  const order = clampInt(orderOverride ?? state.city.order, 0, 4);
  const force = currentForce(state, population);
  const orderPrestige = order >= 3 ? 2 : order === 2 ? 1 : 0;
  const onePointThreshold = Math.ceil(population / 3);
  const twoPointThreshold = Math.ceil(population / 2);
  let readinessPrestige = 0;
  if (force >= onePointThreshold) readinessPrestige = 1;
  if (force >= twoPointThreshold) readinessPrestige = 2;

  const religiousAxis = Math.max(-2, Math.min(2, Math.floor(Number(state.city.religionArcane) || 0)));
  const religiousPrestige = religiousAxis === 2 ? 2 : religiousAxis === 1 ? 1 : 0;
  const squalor = Math.max(0, clampInt(state.city.squalor ?? 0));
  const civicCoherence = squalor === 0 ? 2 : squalor <= Math.floor(population / 3) ? 1 : 0;

  const commercialAxis = Math.max(-2, Math.min(2, Math.floor(Number(state.city.militaryMercantile) || 0)));
  const externalServed = sumDemand(reports, "served", "external_markets");
  const externalUnmet = sumDemand(reports, "unmet", "external_markets");
  const populationUnmet = sumDemand(reports, "unmet", "population");
  const imperialUnmet = sumDemand(reports, "unmet", "imperial");
  let merchantPenalty = 0;
  if (commercialAxis === -2) merchantPenalty = externalUnmet + populationUnmet * 2;
  else if (commercialAxis === -1) merchantPenalty = externalUnmet + populationUnmet;
  else if (commercialAxis === 0) merchantPenalty = externalUnmet + imperialUnmet;
  else if (commercialAxis === 1) merchantPenalty = Math.ceil(externalUnmet / 2);
  else merchantPenalty = Math.floor(externalUnmet / 3);
  const merchantRaw = externalServed * 2 - merchantPenalty;

  const cumulativeTierIncreases = (state.productionSectors ?? [])
    .filter(sector => sector.id !== "food")
    .reduce((sum, sector) => sum + Math.max(0, clampInt(sector.tier ?? 1, 1) - 1), 0);
  let scholariumPermanent = 0;
  if (religiousAxis === -2) scholariumPermanent = Math.floor(cumulativeTierIncreases / 3);
  else if (religiousAxis === -1) scholariumPermanent = Math.floor(cumulativeTierIncreases / 4);
  let breakthrough = 0;
  const breakthroughs = [];
  for (const action of tierUpActions ?? []) {
    if (action.type !== "sector_development" || !action.tierActivated || action.sectorId === "food") continue;
    const value = action.newTier === 2 ? 2 : action.newTier === 3 ? 4 : 0;
    breakthrough += value;
    if (value) breakthroughs.push({ sectorId: action.sectorId, newTier: action.newTier, prestige: value });
  }

  return {
    city_guard: {
      score: Math.min(4, orderPrestige + readinessPrestige), orderPrestige, readinessPrestige,
      order, force, population, onePointThreshold, twoPointThreshold,
    },
    temple: {
      score: Math.min(4, religiousPrestige + civicCoherence), religiousPrestige, civicCoherence,
      population, squalor,
    },
    merchant_guild: {
      score: Math.min(4, Math.max(0, merchantRaw)), rawScore: merchantRaw,
      externalServed, externalUnmet, populationUnmet, imperialUnmet, penalty: merchantPenalty,
      inclination: commercialAxis,
    },
    scholarium: {
      score: scholariumPermanent + breakthrough, permanent: scholariumPermanent,
      breakthrough, cumulativeTierIncreases, breakthroughs, inclination: religiousAxis,
    },
  };
}

export { calculateInstitutionScores };

function freeWealth(state, player) {
  const previewRelease = clampInt(player.agentWealthReleasePreview ?? 0);
  const agentCommitment = Math.max(0, deployedInstitutionAgentCount(player) - previewRelease)
    * V090_CONFIG.agents.wealthCommitment;
  return Math.max(0, player.wealthCapacity - (player.wealthCommittedThisGeneration || 0) - agentCommitment);
}

function canPay(state, player, influenceCost, wealthCost) {
  return player.influence >= influenceCost && freeWealth(state, player) >= wealthCost;
}

function canPlaceAgentWithLiquidity(state, player) {
  return freeWealth(state, player) >= V090_CONFIG.agents.wealthCommitment + V090_CONFIG.agents.liquidityReserve;
}

function addInstitutionAgent(state, player, institutionId) {
  const order = state.nextInstitutionAgentOrder++;
  const agent = { id: `agent_${order}`, institutionId, seniority: 1, placementOrder: order, placedGeneration: state.generation };
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

function influenceShadowValue(state, player, profile) {
  const threshold = Math.max(1, state.city.influenceErosionThreshold || 12);
  const scarcity = 1 - Math.min(1, Math.max(0, player.influence) / threshold);
  return (profile.prestige * 0.20 + profile.wealth * 0.30 + profile.engine * 0.35 + profile.civic * 0.15)
    * (0.9 + scarcity * 0.6);
}

function estimatedInstitutionScore(state, institutionId) {
  const economy = base.previewEconomy(state);
  return calculateInstitutionScores(state, economy.reports, [], state.city.order, state.city.population)[institutionId]?.score ?? 0;
}

function agentUtilityWeights(player) {
  const key = player.aiPersonality ?? "opportunist";
  const configured = V090_CONFIG?.agents?.utilityWeights?.[key]
    ?? V090_CONFIG?.agents?.utilityWeights?.default
    ?? { institution: 0.40, influence: 0.30, intrigue: 0.30 };
  const institution = Math.max(0, Number(configured.institution) || 0);
  const influence = Math.max(0, Number(configured.influence) || 0);
  const intrigue = Math.max(0, Number(configured.intrigue) || 0);
  const total = institution + influence + intrigue || 1;
  return { institution: institution / total, influence: influence / total, intrigue: intrigue / total };
}

function normalizedAgentComponents(state, player, agent, profile, seniority, t) {
  const institutionScore = estimatedInstitutionScore(state, agent.institutionId);
  const influenceValue = influenceShadowValue(state, player, profile);
  const intrigueHook = V090_CONFIG?.agents?.intrigueAccessValue;
  const intrigueValue = typeof intrigueHook === "function"
    ? Math.max(0, Number(intrigueHook(state, player, agent.institutionId, seniority, profile, t)) || 0)
    : 0;
  const refs = V090_CONFIG?.agents?.utilityReferences ?? {};
  const institutionRef = Math.max(0.1, Number(refs.institution) || 4.0);
  const influenceRef = Math.max(0.1, Number(refs.influence) || 3.2);
  const intrigueRef = Math.max(0.1, Number(refs.intrigue) || 3.0);
  return {
    institution: Math.min(1.5, Math.max(0, institutionScore * profile.prestige / institutionRef)),
    influence: Math.min(1.5, Math.max(0, seniority * influenceValue / influenceRef)),
    intrigue: Math.min(1.5, Math.max(0, intrigueValue / intrigueRef)),
  };
}

function agentNetworkFactor(player) {
  const count = deployedInstitutionAgentCount(player);
  const key = player.aiPersonality ?? "opportunist";
  const penalties = V090_CONFIG?.agents?.networkDiminishingReturns ?? {};
  const rate = Math.max(0, Number(penalties[key] ?? penalties.default) || 0);
  return 1 / (1 + Math.max(0, count - 1) * rate);
}

function agentContinuationValue(state, player, agent) {
  const profile = profileFor(state, player);
  const weights = agentUtilityWeights(player);
  const scale = Math.max(0.1, Number(V090_CONFIG?.agents?.utilityScale) || 3.6);
  const networkFactor = agentNetworkFactor(player);
  let total = 0;
  for (let t = 0; t < Math.max(1, profile.horizon); t += 1) {
    const seniority = Math.min(3, clampInt(agent.seniority ?? 1, 1, 3) + t);
    const c = normalizedAgentComponents(state, player, agent, profile, seniority, t);
    const weighted = c.institution * weights.institution
      + c.influence * weights.influence
      + c.intrigue * weights.intrigue;
    total += (profile.discount ** t) * weighted * scale * networkFactor;
  }
  return total;
}

function weakestAgents(state, player) {
  return getInstitutionAgentRoster(player)
    .map(agent => ({ agent, value: agentContinuationValue(state, player, agent) }))
    .sort((a, b) => a.value - b.value || a.agent.seniority - b.agent.seniority || b.agent.placementOrder - a.agent.placementOrder);
}

function recallLog(player, agent, reason, forced) {
  return {
    type: `${forced ? "Forced Agent recall" : "Agent recall"}: ${player.familyName} withdrew seniority ${agent.seniority} from ${INSTITUTION_LABELS[agent.institutionId]}`,
    actionKind: "agent_recall", freeAction: true, forced, reason, playerId: player.id,
    agentId: agent.id, institutionId: agent.institutionId, seniorityLost: agent.seniority, wealthReleased: 1,
  };
}

function enforceUpkeepAgentCapacity(state) {
  const recalls = [];
  for (const player of state.players) {
    while (deployedInstitutionAgentCount(player) > player.wealthCapacity) {
      const weakest = weakestAgents(state, player)[0];
      if (!weakest) break;
      const recalled = recallInstitutionAgent(player, weakest.agent.id);
      if (!recalled) break;
      recalls.push(recallLog(player, recalled, "upkeep_wealth_capacity", true));
    }
  }
  return recalls;
}

function ageAgents(state) {
  const before = {};
  const after = {};
  for (const player of state.players) {
    before[player.id] = getInstitutionAgentRoster(player).map(agent => ({ ...agent }));
    for (const agent of getInstitutionAgentRoster(player)) agent.seniority = Math.min(3, agent.seniority + 1);
    syncInstitutionAgentCounts(player);
    after[player.id] = getInstitutionAgentRoster(player).map(agent => ({ ...agent }));
  }
  return { before, after };
}

function ageProductionStakes(state) {
  for (const player of state.players) {
    player.productionStakes = player.productionStakes
      .filter(stake => stake.age !== "elder")
      .map(stake => ({ ...stake, age: stake.age === "young" ? "mature" : "elder", servedThisGeneration: false, servedDemandCategory: null, wealthProducedThisGeneration: 0 }));
  }
}

function applyUpkeepGrowth(state) {
  const marked = clampInt(state.city.pendingGrowth ?? 0, 0, 1);
  const before = state.city.population;
  if (marked > 0) state.city.population += marked;
  state.city.pendingGrowth = 0;
  return { marked, before, after: state.city.population, applied: state.city.population - before };
}

function erodeInfluence(state) {
  const threshold = Math.max(1, clampInt(state.city.influenceErosionThreshold ?? 12, 1));
  return state.players.map(player => {
    const before = Math.max(0, clampInt(player.influence));
    const after = before <= 0 ? 0 : Math.max(0, Math.min(threshold, before - 1));
    player.influence = after;
    return { playerId: player.id, before, after, threshold, lost: before - after };
  });
}

function demandTotal(sector) {
  const d = sector?.demandThisGeneration ?? {};
  return (Number(d.population) || 0) + (Number(d.imperial) || 0) + (Number(d.external_markets) || 0);
}

function allocateDemand(supply, demand, priorityGroups) {
  let remaining = Math.max(0, supply);
  const sequence = [];
  for (const group of priorityGroups) {
    const ordered = DEMAND_ORDER.filter(category => group.includes(category));
    for (const category of ordered) {
      const amount = Math.min(Math.max(0, Number(demand?.[category]) || 0), remaining);
      for (let i = 0; i < amount; i += 1) sequence.push(category);
      remaining -= amount;
      if (remaining <= 0) break;
    }
    if (remaining <= 0) break;
  }
  return sequence;
}

function categoryUtility(category, profile) {
  if (category === "population") return profile.prestige;
  if (category === "external_markets") return profile.wealth + profile.engine * 0.20;
  if (category === "imperial") return profile.civic * 0.55 + profile.prestige * 0.20;
  return 0;
}

function expectedStakeValue(state, player, sector) {
  const currentStakes = state.players.flatMap(p => p.productionStakes).filter(stake => stake.sectorId === sector.id).length;
  const rawCapacity = base.sectorResourceCapacity(state, sector.id);
  if (currentStakes >= rawCapacity) return { category: null, utility: 0 };
  const sequence = allocateDemand(
    Math.min(rawCapacity, currentStakes + 1), sector.demandThisGeneration, base.getDemandPriorityGroups(state),
  );
  const category = sequence[currentStakes] ?? null;
  if (!category) return { category: null, utility: 0 };
  const profile = profileFor(state, player);
  return { category, utility: categoryUtility(category, profile) * annuity(profile, Math.min(3, profile.horizon)) + profile.engine * 0.25 };
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

function desiredRawFoodCapacity(state) {
  const population = Math.max(1, Number(state.city.population) || 1);
  const currentFood = base.getFoodSubsistenceStatus(state).localCapacity;
  const growthPlausible = currentFood >= population && currentUrbanCapacity(state) > population && state.city.squalor < population;
  return population + (growthPlausible ? 1 : 0);
}

function expectedPrivateLandValue(state, player, land) {
  const profile = profileFor(state, player);
  const sectorId = RESOURCE_TO_SECTOR[land.resourceType];
  const sector = state.productionSectors.find(item => item.id === sectorId);
  if (!sector) return 0;
  const rawCapacity = Math.max(1, base.sectorResourceCapacity(state, sectorId));
  const scarcity = Math.min(1.5, demandTotal(sector) / rawCapacity);
  return profile.prestige * annuity(profile) * Math.min(1, scarcity)
    + profile.engine * annuity(profile) * (0.55 + 0.45 * scarcity);
}

function farmCandidate(state, player, farmBuilt) {
  if (V090_CONFIG.civicFarm.onePerGeneration && farmBuilt) return null;
  const food = base.getFoodSubsistenceStatus(state);
  const target = desiredRawFoodCapacity(state);
  if (food.localCapacity >= target) return null;
  const influenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;
  const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;
  if (!canPay(state, player, influenceCost, wealthCost)) return null;
  const selected = state.lands
    .filter(land => land.revealed && land.ownerId === player.id && land.development === "natural")
    .map(land => ({ land, value: expectedPrivateLandValue(state, player, land) }))
    .sort((a, b) => a.value - b.value || (a.land.explorationOrder ?? 9999) - (b.land.explorationOrder ?? 9999))[0];
  if (!selected) return null;
  const profile = profileFor(state, player);
  const deficit = Math.max(0, state.city.population - food.localCapacity);
  const score = V090_CONFIG.civicFarmPrestige * profile.prestige + profile.civic * (deficit * 1.9 + 0.8)
    - selected.value - influenceCost * 0.2 - wealthCost * 0.25;
  return score >= V090_CONFIG.civicFarm.minimumUtility ? { kind: "farm", score, land: selected.land, target } : null;
}

function explorationCandidate(state, player) {
  const land = state.lands.find(item => !item.revealed && !item.ownerId);
  if (!land) return null;
  const influenceCost = base.V084_CONFIG.hinterland.acquisitionInfluenceCost;
  const wealthCost = base.V084_CONFIG.hinterland.acquisitionWealthCost;
  if (!canPay(state, player, influenceCost, wealthCost)) return null;
  const profile = profileFor(state, player);
  const noPrivateLand = !state.lands.some(item => item.ownerId === player.id && item.development === "natural");
  const score = profile.prestige * annuity(profile) * 0.45 + profile.engine * annuity(profile) * 0.65
    + (noPrivateLand ? 1 : 0) - influenceCost * 0.30 - wealthCost * 0.30;
  return { kind: "explore", score, land };
}

function nextDevelopmentCost(sector) {
  if (sector.tier >= 3) return null;
  const phase = sector.developmentPhase + 1;
  return { phase, ...base.V084_CONFIG.developmentPhases[phase] };
}

function developmentCandidate(state, player, sector) {
  if (sector.id === "food" || sector.tier >= 3 || sector.lastDevelopmentGeneration === state.generation) return null;
  const cost = nextDevelopmentCost(sector);
  if (!cost || !canPay(state, player, cost.influenceCost, cost.wealthCost)) return null;
  const profile = profileFor(state, player);
  const score = cost.prestige * profile.prestige + profile.engine * (sector.developmentPhase > 0 ? 1.8 : 0.9)
    + profile.wealth * Math.min(2, Number(sector.demandThisGeneration.external_markets) || 0) * 0.35
    - cost.influenceCost * 0.25 - cost.wealthCost * 0.35;
  return { kind: "development", score, sector, cost };
}

function agentCandidate(state, player, institutionId) {
  if (!canPlaceAgentWithLiquidity(state, player)) return null;
  const provisional = { institutionId, seniority: 1, placementOrder: Number.POSITIVE_INFINITY };
  const score = agentContinuationValue(state, player, provisional);
  return score > V090_CONFIG.agents.minimumUtility
    ? { kind: "agent", score, institutionId, estimatedInstitutionScore: estimatedInstitutionScore(state, institutionId) }
    : null;
}

function collectNormalCandidates(state, player, farmBuilt) {
  const candidates = [];
  const farm = farmCandidate(state, player, farmBuilt); if (farm) candidates.push(farm);
  const explore = explorationCandidate(state, player); if (explore) candidates.push(explore);
  for (const sector of state.productionSectors) {
    const development = developmentCandidate(state, player, sector); if (development) candidates.push(development);
  }
  for (const institutionId of INSTITUTION_IDS) {
    const agent = agentCandidate(state, player, institutionId); if (agent) candidates.push(agent);
  }
  return candidates.sort((a, b) => b.score - a.score);
}

function chooseNormalCandidate(state, player, farmBuilt) {
  let best = collectNormalCandidates(state, player, farmBuilt)[0] ?? null;
  if (best) best = { ...best, recallAgentIds: [] };
  let bestNet = best?.score ?? V090_CONFIG.actionUtilityFloor;
  const weak = weakestAgents(state, player);
  let cumulativeLoss = 0;
  for (let count = 1; count <= weak.length; count += 1) {
    cumulativeLoss += weak[count - 1].value;
    player.agentWealthReleasePreview = count;
    const unlocked = collectNormalCandidates(state, player, farmBuilt)[0] ?? null;
    player.agentWealthReleasePreview = 0;
    if (!unlocked) continue;
    const net = unlocked.score - cumulativeLoss;
    if (net > bestNet + V090_CONFIG.agents.reallocationThreshold) {
      best = { ...unlocked, recallAgentIds: weak.slice(0, count).map(item => item.agent.id), netScore: net };
      bestNet = net;
    }
  }
  player.agentWealthReleasePreview = 0;
  return best;
}

function executeNormalCandidate(state, player, candidate, sequence) {
  if (candidate.kind === "farm") {
    const influenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;
    const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;
    if (!canPay(state, player, influenceCost, wealthCost)) return null;
    player.influence -= influenceCost;
    player.wealthCommittedThisGeneration += wealthCost;
    const land = candidate.land;
    const previousResourceType = land.resourceType;
    land.development = "farm"; land.terrain = "farm"; land.resourceType = "grain";
    land.ownerId = V090_CONFIG.publicFarmOwnerId; land.publicFarm = true;
    land.civicFarmContributorId = player.id; land.civicFarmGeneration = state.generation;
    return { sequence, type: "farm_conversion", playerId: player.id, landId: land.id, influenceCost, wealthCost,
      prestigeAward: V090_CONFIG.civicFarmPrestige, previousResourceType, ownershipTransferredTo: V090_CONFIG.publicFarmOwnerId };
  }
  if (candidate.kind === "explore") {
    const influenceCost = base.V084_CONFIG.hinterland.acquisitionInfluenceCost;
    const wealthCost = base.V084_CONFIG.hinterland.acquisitionWealthCost;
    if (!canPay(state, player, influenceCost, wealthCost)) return null;
    const reveal = revealTerrain(state, candidate.land); if (!reveal) return null;
    player.influence -= influenceCost; player.wealthCommittedThisGeneration += wealthCost;
    candidate.land.ownerId = player.id; candidate.land.explorationOrder = state.nextExplorationOrder;
    candidate.land.acquisitionOrder = state.nextExplorationOrder; state.nextExplorationOrder += 1;
    return { sequence, type: "hinterland_exploration", playerId: player.id, landId: candidate.land.id,
      explorationOrder: candidate.land.explorationOrder, terrain: reveal.terrain, resourceType: reveal.resourceType,
      influenceCost, wealthCost, randomRoll: reveal.roll };
  }
  if (candidate.kind === "development") {
    const { sector, cost } = candidate;
    if (!canPay(state, player, cost.influenceCost, cost.wealthCost)) return null;
    player.influence -= cost.influenceCost; player.wealthCommittedThisGeneration += cost.wealthCost;
    const targetTier = sector.tier + 1;
    sector.developmentPhase = cost.phase; sector.developmentTargetTier = targetTier;
    sector.lastDevelopmentGeneration = state.generation; sector.lastDevelopmentContributorId = player.id;
    let tierActivated = false;
    if (cost.phase === 3) {
      sector.tier = targetTier; sector.developmentPhase = 0;
      sector.developmentTargetTier = sector.tier < 3 ? sector.tier + 1 : null; tierActivated = true;
    }
    return { sequence, type: "sector_development", playerId: player.id, sectorId: sector.id, phase: cost.phase,
      targetTier, influenceCost: cost.influenceCost, wealthCost: cost.wealthCost, prestige: cost.prestige,
      tierActivated, newTier: sector.tier, aiPersonality: player.aiPersonality };
  }
  if (candidate.kind === "agent") {
    if (!canPlaceAgentWithLiquidity(state, player)) return null;
    const agent = addInstitutionAgent(state, player, candidate.institutionId);
    return { sequence, type: `Agent placement: ${player.familyName} → ${INSTITUTION_LABELS[candidate.institutionId]} (seniority 1, 1W reserved)`,
      actionKind: "agent_placement", playerId: player.id, agentId: agent.id, institutionId: candidate.institutionId,
      seniority: 1, wealthReserved: 1, liquidityReserveAfterPlacement: 1, aiUtility: candidate.score };
  }
  return null;
}

function chooseExpansionLand(state) {
  return state.lands.filter(land => land.revealed && land.development !== "urban")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999))[0] ?? null;
}

function expansionUtility(state, player, target) {
  const profile = profileFor(state, player);
  const population = state.city.population;
  const capacityBefore = currentUrbanCapacity(state);
  const capacityAfter = capacityBefore + base.V084_CONFIG.urban.populationPerTile;
  let utility = profile.civic * (Math.max(0, population - capacityBefore) - Math.max(0, population - capacityAfter)) * 1.75;
  if (population === capacityBefore) utility += profile.civic * 1.35;
  if (target?.ownerId === player.id) utility -= expectedPrivateLandValue(state, player, target) * 0.85;
  if (target?.development === "farm") utility -= profile.civic * 2.0;
  return utility;
}

function expansionVoteCandidate(state, player, context) {
  if (context.expansionVoteDone) return null;
  const target = chooseExpansionLand(state);
  if (!target || state.city.population < currentUrbanCapacity(state) || player.influence < 1) return null;
  const utility = expansionUtility(state, player, target);
  return utility > V090_CONFIG.expansionVote.proposalUtilityThreshold
    ? { kind: "expansion_vote", score: utility, target }
    : null;
}

function executeExpansionVote(state, proposer, target, context, sequence) {
  const evaluations = state.players.map(player => ({ player, utility: expansionUtility(state, player, target) }));
  let yesVotes = 0; let noVotes = 0; let abstentions = 0;
  const ballots = [];
  for (const { player, utility } of evaluations) {
    let stance = utility > 0.25 ? "yes" : utility < -0.25 ? "no" : "abstain";
    if (player.id === proposer.id) stance = "yes";
    const intensity = Math.abs(utility);
    let desired = 0;
    for (const threshold of V090_CONFIG.expansionVote.influenceThresholds) if (intensity >= threshold) desired += 1;
    if (player.id === proposer.id) desired = Math.max(1, desired);
    const spent = stance === "abstain" ? 0 : Math.min(player.influence, desired);
    player.influence -= spent;
    const strength = stance === "abstain" ? 0 : 1 + spent;
    if (stance === "yes") yesVotes += strength; else if (stance === "no") noVotes += strength; else abstentions += 1;
    ballots.push({ playerId: player.id, stance, influenceSpent: spent, voteStrength: strength, utility });
  }
  const passed = yesVotes > noVotes;
  let expansionEvent = null;
  if (passed) {
    expansionEvent = {
      landId: target.id, landName: target.name, explorationOrder: target.explorationOrder,
      originalTerrain: target.originalTerrain, previousDevelopment: target.development,
      previousOwnerId: target.ownerId, previousResourceType: target.resourceType,
      lostCapacity: Math.max(0, Number(target.baseCapacity) || 0), viaCivicVote: true,
    };
    target.formerOwnerId = target.ownerId; target.formerResourceType = target.resourceType; target.formerCapacity = target.baseCapacity;
    target.ownerId = "city"; target.development = "urban"; target.terrain = "urban"; target.resourceType = "urban";
    target.baseCapacity = 0; target.usedCapacityThisGeneration = 0; target.urbanizedGeneration = state.generation;
    state.city.urbanTiles = currentUrbanTiles(state) + 1; state.city.urbanCapacity = currentUrbanCapacity(state);
  }
  context.expansionVoteDone = true;
  context.civicExpansionVote = { eligible: true, proposed: true, passed, proposerId: proposer.id, yesVotes, noVotes, abstentions,
    ballots, expansionEvent, targetLandId: target.id, targetLandName: target.name, reason: passed ? "approved" : "rejected_or_tied" };
  return { sequence, type: `Civic expansion vote — YES ${yesVotes} / NO ${noVotes} — ${passed ? "PASSED" : "FAILED"}`,
    actionKind: "civic_expansion_vote", playerId: proposer.id, civicVote: true };
}

function makeAuction(id, type, extra = {}) {
  return { auctionId: id, type, bids: {}, closed: false, ...extra };
}

function highestBid(auction) {
  return Object.entries(auction.bids)
    .map(([playerId, bid]) => ({ playerId, amount: bid.amount, valid: bid.valid !== false }))
    .sort((a, b) => b.amount - a.amount)[0] ?? null;
}

function reserveBid(state, auction, player, amount, source = "action") {
  const old = auction.bids[player.id]?.amount ?? 0;
  const delta = amount - old;
  if (delta <= 0 || player.influence < delta) return false;
  player.influence -= delta;
  auction.bids[player.id] = { playerId: player.id, amount, source };
  return true;
}

function ensureProductionAuctions(state, context) {
  for (const sector of state.productionSectors) {
    if (sector.id === "food") continue;
    const occupancy = base.getSectorOccupancy(state, sector.id);
    const available = Math.max(0, sector.tier - occupancy.young);
    for (let slot = 1; slot <= available; slot += 1) {
      const id = `production:${sector.id}:young:${slot}`;
      if (!context.auctions.has(id)) context.auctions.set(id, makeAuction(id, "production_stake", { sectorId: sector.id, slotNumber: slot }));
    }
  }
}

function productionBidCandidates(state, player, context) {
  ensureProductionAuctions(state, context);
  const out = [];
  for (const auction of context.auctions.values()) {
    if (auction.type !== "production_stake") continue;
    const sector = state.productionSectors.find(item => item.id === auction.sectorId);
    if (!sector) continue;
    const estimate = expectedStakeValue(state, player, sector);
    const maxBid = estimate.utility >= 1.15 ? Math.max(1, Math.floor(estimate.utility / 1.45)) : 0;
    if (!maxBid) continue;
    const high = highestBid(auction);
    if (high?.playerId === player.id) continue;
    const nextBid = (high?.amount ?? 0) + 1;
    const old = auction.bids[player.id]?.amount ?? 0;
    const delta = nextBid - old;
    if (nextBid > maxBid || delta <= 0 || player.influence < delta) continue;
    out.push({ kind: "auction_bid", auction, bid: nextBid, score: estimate.utility - nextBid * 0.45,
      expectedCategory: estimate.category });
  }
  return out;
}

function mercenaryBidCandidate(state, player, context) {
  const auction = context.auctions.get("mercenary_contract");
  if (!auction) return null;
  const high = highestBid(auction);
  if (high?.playerId === player.id) return null;
  if ((player.institutionAgents?.city_guard ?? 0) <= 0) return null;
  const food = base.getFoodSubsistenceStatus(state);
  if (food.surplusForRefining < 1) return null;
  const nextBid = (high?.amount ?? 0) + 1;
  const old = auction.bids[player.id]?.amount ?? 0;
  const delta = nextBid - old;
  if (delta <= 0 || player.influence < delta) return null;
  const profile = profileFor(state, player);
  const value = V090_CONFIG.mercenaryContract.wealthIncome * profile.wealth * annuity(profile, Math.min(3, profile.horizon));
  const score = value - nextBid * 0.55;
  return score > V090_CONFIG.actionUtilityFloor
    ? { kind: "auction_bid", auction, bid: nextBid, score, expectedCategory: "mercenary_contract" }
    : null;
}

function choosePlayerAction(state, player, context) {
  const candidates = [];
  const normal = chooseNormalCandidate(state, player, context.farmBuilt); if (normal) candidates.push(normal);
  const vote = expansionVoteCandidate(state, player, context); if (vote) candidates.push(vote);
  candidates.push(...productionBidCandidates(state, player, context));
  const mercenary = mercenaryBidCandidate(state, player, context); if (mercenary) candidates.push(mercenary);
  return candidates.sort((a, b) => b.score - a.score)[0] ?? null;
}

function executePlayerAction(state, player, candidate, context, sequence) {
  for (const agentId of candidate.recallAgentIds ?? []) {
    const recalled = recallInstitutionAgent(player, agentId);
    if (recalled) context.actions.push({ sequence: sequence++, ...recallLog(player, recalled, "better_action_opportunity", false) });
  }
  if (candidate.kind === "auction_bid") {
    if (!reserveBid(state, candidate.auction, player, candidate.bid, "action")) return { sequence, action: null };
    const action = { sequence, type: "auction_bid", actionKind: "auction_bid", playerId: player.id,
      auctionId: candidate.auction.auctionId, auctionType: candidate.auction.type, sectorId: candidate.auction.sectorId ?? null,
      bid: candidate.bid, expectedCategory: candidate.expectedCategory, influenceReserved: candidate.bid };
    return { sequence: sequence + 1, action };
  }
  if (candidate.kind === "expansion_vote") {
    const action = executeExpansionVote(state, player, candidate.target, context, sequence);
    return { sequence: sequence + 1, action };
  }
  const action = executeNormalCandidate(state, player, candidate, sequence);
  return { sequence: action ? sequence + 1 : sequence, action };
}

function playtestCandidateSpec(candidate) {
  if (!candidate) return { kind: "pass" };
  if (candidate.kind === "auction_bid") return {
    kind: "auction_bid",
    auctionId: candidate.auction?.auctionId ?? null,
    bid: Math.max(0, Math.floor(Number(candidate.bid) || 0)),
  };
  if (candidate.kind === "development") return { kind: "development", sectorId: candidate.sector?.id ?? null };
  if (candidate.kind === "agent") return { kind: "agent", institutionId: candidate.institutionId ?? null };
  if (candidate.kind === "farm") return { kind: "farm", landId: candidate.land?.id ?? null };
  if (candidate.kind === "explore") return { kind: "explore", landId: candidate.land?.id ?? null };
  if (candidate.kind === "expansion_vote") return { kind: "expansion_vote", landId: candidate.target?.id ?? null };
  return { kind: String(candidate.kind ?? "pass") };
}

function playtestHumanCandidates(state, player, context) {
  ensureProductionAuctions(state, context);
  const candidates = [];

  if (!context.farmBuilt) {
    const food = base.getFoodSubsistenceStatus(state);
    const target = desiredRawFoodCapacity(state);
    if (food.localCapacity < target) {
      const influenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;
      const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;
      if (canPay(state, player, influenceCost, wealthCost)) {
        for (const land of state.lands.filter(row => row.revealed && row.ownerId === player.id && row.development === "natural")) {
          candidates.push({ kind: "farm", score: 1, land, target });
        }
      }
    }
  }

  const influenceCost = base.V084_CONFIG.hinterland.acquisitionInfluenceCost;
  const wealthCost = base.V084_CONFIG.hinterland.acquisitionWealthCost;
  if (canPay(state, player, influenceCost, wealthCost)) {
    for (const land of state.lands.filter(row => !row.revealed && !row.ownerId)) {
      candidates.push({ kind: "explore", score: 1, land });
    }
  }

  for (const sector of state.productionSectors) {
    const candidate = developmentCandidate(state, player, sector);
    if (candidate) candidates.push({ ...candidate, score: Math.max(1, candidate.score ?? 1) });
  }
  for (const institutionId of INSTITUTION_IDS) {
    const candidate = agentCandidate(state, player, institutionId);
    if (candidate) candidates.push({ ...candidate, score: Math.max(1, candidate.score ?? 1) });
  }

  const expansion = expansionVoteCandidate(state, player, context);
  if (expansion) candidates.push({ ...expansion, score: Math.max(1, expansion.score ?? 1) });

  for (const auction of context.auctions.values()) {
    if (auction.closed) continue;
    if (auction.type === "production_stake") {
      const sector = state.productionSectors.find(row => row.id === auction.sectorId);
      if (!sector) continue;
      const occupancy = base.getSectorOccupancy(state, auction.sectorId);
      if (occupancy.young >= sector.tier) continue;
    }
    if (auction.type === "mercenary_contract") {
      if ((player.institutionAgents?.city_guard ?? 0) <= 0) continue;
      if (base.getFoodSubsistenceStatus(state).surplusForRefining < 1) continue;
    }
    const high = highestBid(auction);
    if (high?.playerId === player.id) continue;
    const old = auction.bids[player.id]?.amount ?? 0;
    const minimumBid = (high?.amount ?? 0) + 1;
    const delta = minimumBid - old;
    if (delta > 0 && player.influence >= delta) {
      candidates.push({
        kind: "auction_bid", auction, bid: minimumBid, minimumBid,
        maximumBid: old + player.influence, score: 1,
        expectedCategory: auction.type === "mercenary_contract" ? "mercenary_contract" : null,
      });
    }
  }
  return candidates;
}

function playtestCandidateFromSpec(state, player, context, spec) {
  if (!spec || spec.kind === "pass") return null;
  if (spec.kind === "auction_bid") {
    ensureProductionAuctions(state, context);
    const auction = context.auctions.get(spec.auctionId);
    if (!auction || auction.closed) return null;
    const old = auction.bids[player.id]?.amount ?? 0;
    const high = highestBid(auction);
    const minimum = Math.max((high?.amount ?? 0) + 1, old + 1);
    const bid = Math.max(minimum, Math.floor(Number(spec.bid) || minimum));
    if (player.influence < bid - old) return null;
    return { kind: "auction_bid", auction, bid, score: 1, expectedCategory: spec.expectedCategory ?? null };
  }
  return playtestHumanCandidates(state, player, context).find(candidate => {
    const row = playtestCandidateSpec(candidate);
    if (row.kind !== spec.kind) return false;
    if (row.sectorId != null && row.sectorId !== spec.sectorId) return false;
    if (row.institutionId != null && row.institutionId !== spec.institutionId) return false;
    if (row.landId != null && row.landId !== spec.landId) return false;
    return true;
  }) ?? null;
}

function scriptedHumanCandidate(state, player, context) {
  const controller = state.__playtestHumanController;
  if (!controller || controller.playerId !== player.id) return choosePlayerAction(state, player, context);
  controller.cursor ??= 0;
  const spec = controller.actions?.[controller.cursor++] ?? { kind: "pass" };
  return playtestCandidateFromSpec(state, player, context, spec);
}

function runActionPhase(state, context) {
  const turnOrder = base.getTurnOrder(state);
  const active = new Set(turnOrder.map(player => player.id));
  let sequence = 1;
  let safety = 0;
  while (active.size > 0 && safety < V090_CONFIG.actionSafetyLimit) {
    let anyAction = false;
    for (const player of turnOrder) {
      if (!active.has(player.id)) continue;
      const candidate = scriptedHumanCandidate(state, player, context);
      if (!candidate || candidate.score < V090_CONFIG.actionUtilityFloor) {
        active.delete(player.id);
        context.actions.push({ sequence: sequence++, type: "pass", actionKind: "pass", playerId: player.id });
        continue;
      }
      const result = executePlayerAction(state, player, candidate, context, sequence);
      sequence = result.sequence;
      if (!result.action) {
        active.delete(player.id);
        continue;
      }
      context.actions.push(result.action);
      anyAction = true;
      if (result.action.type === "farm_conversion") context.farmBuilt = true;
      base.applyAutoDemand(state);
    }
    safety += 1;
    if (!anyAction && active.size > 0) break;
  }
  context.actionSafetyTriggered = safety >= V090_CONFIG.actionSafetyLimit;
  return { turnOrder: turnOrder.map(player => player.id), nextSequence: sequence };
}

function addProductionStake(state, playerId, sectorId) {
  const sector = state.productionSectors.find(item => item.id === sectorId);
  const occupancy = base.getSectorOccupancy(state, sectorId);
  if (!sector || occupancy.young >= sector.tier) return null;
  const player = getPlayer(state, playerId); if (!player) return null;
  const stake = { id: `stake_${state.nextProductionStakeOrder}`, ownerId: playerId, sectorId, age: "young",
    placementOrder: state.nextProductionStakeOrder, servedThisGeneration: false, servedDemandCategory: null,
    wealthProducedThisGeneration: 0 };
  state.nextProductionStakeOrder += 1; player.productionStakes.push(stake); return stake;
}

function refundBid(state, playerId, amount) {
  const player = getPlayer(state, playerId);
  if (player && amount > 0) player.influence += amount;
}

function resolveOneAuction(state, auction) {
  const ranked = Object.values(auction.bids).sort((a, b) => b.amount - a.amount);
  const eligible = ranked.filter(bid => {
    if (auction.type === "mercenary_contract") {
      const player = getPlayer(state, bid.playerId);
      return (player?.institutionAgents?.city_guard ?? 0) > 0;
    }
    if (auction.type === "production_stake") {
      const sector = state.productionSectors.find(item => item.id === auction.sectorId);
      const occupancy = base.getSectorOccupancy(state, auction.sectorId);
      return Boolean(sector) && occupancy.young < sector.tier;
    }
    return true;
  });
  const winner = eligible[0] ?? null;
  for (const bid of ranked) if (!winner || bid.playerId !== winner.playerId) refundBid(state, bid.playerId, bid.amount);
  let stake = null;
  if (winner && auction.type === "production_stake") stake = addProductionStake(state, winner.playerId, auction.sectorId);
  if (auction.type === "mercenary_contract") {
    state.mercenaryContract.ownerId = winner?.playerId ?? null;
    state.mercenaryContract.lastWinningBid = winner?.amount ?? 0;
  }
  auction.closed = true;
  auction.winnerId = winner?.playerId ?? null;
  auction.winningBid = winner?.amount ?? 0;
  auction.stakeId = stake?.id ?? null;
  auction.invalidBids = ranked.filter(bid => !eligible.some(valid => valid.playerId === bid.playerId)).map(bid => bid.playerId);
  return auction;
}

function resolveAuctions(state, context) {
  ensureProductionAuctions(state, context);
  const results = [];
  for (const auction of context.auctions.values()) results.push(resolveOneAuction(state, auction));
  return results;
}

function markProductionUsage(state, reports, subsistence, mercenaryFoodConsumed) {
  for (const player of state.players) {
    for (const stake of player.productionStakes) {
      stake.servedThisGeneration = false; stake.servedDemandCategory = null; stake.wealthProducedThisGeneration = 0;
    }
  }
  for (const land of state.lands) {
    land.usedCapacityThisGeneration = 0; land.subsistenceUsedThisGeneration = 0; land.refinedUsedThisGeneration = 0;
    land.contractFoodUsedThisGeneration = 0;
  }
  const farms = state.lands.filter(land => land.revealed && land.development === "farm" && land.ownerId && land.ownerId !== "city")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999));
  let populationFoodRemaining = subsistence.localServed;
  let contractFoodRemaining = mercenaryFoodConsumed;
  for (const land of farms) {
    const populationUsed = Math.min(Math.max(0, land.baseCapacity), populationFoodRemaining);
    populationFoodRemaining -= populationUsed;
    const residual = Math.max(0, land.baseCapacity - populationUsed);
    const contractUsed = Math.min(residual, contractFoodRemaining);
    contractFoodRemaining -= contractUsed;
    land.subsistenceUsedThisGeneration = populationUsed;
    land.contractFoodUsedThisGeneration = contractUsed;
    land.usedCapacityThisGeneration = populationUsed + contractUsed;
  }
  for (const report of reports) {
    for (const served of report.servedStakes ?? []) {
      const player = getPlayer(state, served.ownerId);
      const stake = player?.productionStakes.find(item => item.id === served.stakeId);
      if (!stake) continue;
      stake.servedThisGeneration = true; stake.servedDemandCategory = served.demandCategory;
      stake.wealthProducedThisGeneration = served.wealthGenerated || 0;
    }
    for (const usage of report.rawResourcesUsed ?? []) {
      if (!usage.landId || !usage.usedCapacity) continue;
      const land = state.lands.find(item => item.id === usage.landId); if (!land) continue;
      land.refinedUsedThisGeneration += usage.usedCapacity;
      land.usedCapacityThisGeneration += usage.usedCapacity;
    }
  }
}

function diseaseChance(squalor) {
  const levels = Object.keys(base.V084_CONFIG.diseaseChanceBySqualor).map(Number).sort((a, b) => a - b);
  let selected = levels[0] ?? 0;
  for (const level of levels) { if (squalor >= level) selected = level; else break; }
  return base.V084_CONFIG.diseaseChanceBySqualor[selected] ?? 0;
}

function queuePendingPrestige(state, amount, reason) {
  for (const player of state.players) player.pendingPrestige += amount;
  return state.players.map(player => ({ playerId: player.id, amount, reason }));
}

function applyPrestigeScoring(state, summary, institutionScores) {
  const ledger = Object.fromEntries(state.players.map(player => [player.id, []]));
  const add = (playerId, amount, reason) => { if (amount) ledger[playerId]?.push({ amount, reason }); };

  for (const player of state.players) {
    if (player.pendingPrestige) add(player.id, player.pendingPrestige, "pending_city_evolution");
    player.pendingPrestige = 0;
  }
  for (const action of summary.actions ?? []) {
    if (action.type === "farm_conversion") add(action.playerId, Number(action.prestigeAward) || 0, "civic_farm");
    if (action.type === "sector_development") add(action.playerId, Number(action.prestige) || 0, "sector_development");
  }
  for (const report of summary.economyReports ?? []) {
    for (const stake of report.servedStakes ?? []) {
      if (stake.demandCategory === "population") add(stake.ownerId, base.V084_CONFIG.rewards.cityPrestigePerNeed, "city_demand_served");
    }
  }
  for (const land of state.lands) {
    if (!land.ownerId || land.ownerId === "city" || land.ownerId === V090_CONFIG.publicFarmOwnerId) continue;
    if (land.development === "natural" && land.usedCapacityThisGeneration > 0) add(land.ownerId, base.V084_CONFIG.rewards.productiveLandPrestige, "productive_land_used");
  }
  if (summary.imperialUnmetTotal > 0) {
    for (const player of state.players) add(player.id, -base.V084_CONFIG.rewards.imperialUnmetPrestigeLoss, "imperial_demand_unmet");
  }
  for (const player of state.players) {
    syncInstitutionAgentCounts(player);
    for (const institutionId of INSTITUTION_IDS) {
      const amount = (player.institutionAgents[institutionId] || 0) * (institutionScores[institutionId]?.score || 0);
      add(player.id, amount, `institution_${institutionId}`);
    }
  }

  const results = [];
  for (const player of state.players) {
    const before = player.prestige;
    const delta = ledger[player.id].reduce((sum, entry) => sum + entry.amount, 0);
    player.prestige = Math.max(0, before + delta);
    results.push({ playerId: player.id, before, delta, after: player.prestige, entries: ledger[player.id] });
  }
  return results;
}

function applyAgentInfluence(state) {
  return state.players.map(player => {
    const before = player.influence;
    const gained = getInstitutionAgentRoster(player).reduce((sum, agent) => sum + clampInt(agent.seniority ?? 1, 1, 3), 0);
    player.influence += gained;
    return { playerId: player.id, agentCount: deployedInstitutionAgentCount(player), before, requested: gained, received: gained, clipped: 0, after: player.influence };
  });
}

function resolveCityEvolution(state, summary) {
  const subsistence = summary.subsistence;
  const imperialAidUsed = subsistence.imperialAid > 0;
  let imperialFoodPendingPrestige = [];
  if (imperialAidUsed) {
    state.city.imperialIntervention += 1;
    imperialFoodPendingPrestige = queuePendingPrestige(state, -base.V084_CONFIG.rewards.imperialFoodAidPrestigeLoss, "imperial_food_aid");
  }

  const populationBeforeDisease = state.city.population;
  const overcrowding = Math.max(0, populationBeforeDisease - currentUrbanCapacity(state));
  const directSqualor = overcrowding + summary.unmetCityDemand;
  state.city.squalor = directSqualor;

  const diseaseProbability = diseaseChance(directSqualor);
  const diseaseRoll = nextRandom(state);
  const diseaseOccurred = state.city.population > base.V084_CONFIG.population.minimum && diseaseRoll < diseaseProbability;
  const diseaseLoss = diseaseOccurred ? 1 : 0;
  state.city.population = Math.max(base.V084_CONFIG.population.minimum, state.city.population - diseaseLoss);

  const orderResolution = calculateOrder(state, summary.unmetCityDemand, state.city.population);
  state.city.order = orderResolution.finalOrder;

  const growthBlockedBySqualor = directSqualor >= Math.max(1, state.city.population);
  const growthBlockedByOrder = state.city.population >= 15 && orderResolution.finalOrder < 2;
  const growthEligible = !imperialAidUsed && !growthBlockedBySqualor && !growthBlockedByOrder;
  state.city.pendingGrowth = growthEligible ? 1 : 0;

  return {
    imperialAidUsed,
    imperialFoodPendingPrestige,
    populationBeforeDisease,
    directSqualor,
    diseaseProbability,
    diseaseRoll,
    diseaseOccurred,
    diseaseLoss,
    orderResolution,
    growthBlockedBySqualor,
    growthBlockedByOrder,
    growthMarked: state.city.pendingGrowth,
  };
}

function resolveCivilDisorder(state, cityEvolution) {
  if (!cityEvolution.orderResolution.chaosTriggered) return { triggered: false };
  const prestigeLosses = state.players.map(player => {
    const before = player.prestige;
    const requestedLoss = before > 0 ? Math.ceil(before * 0.20) : 0;
    player.prestige = Math.max(0, before - requestedLoss);
    return { playerId: player.id, before, requestedLoss, actualLoss: before - player.prestige, after: player.prestige };
  });
  const beforePopulation = state.city.population;
  state.city.population = Math.max(base.V084_CONFIG.population.minimum, beforePopulation - 1);
  state.city.imperialIntervention += 1;
  state.city.order = 1;
  state.city.pendingGrowth = 0;
  return { triggered: true, prestigeLossFraction: 0.20, prestigeLosses,
    populationLoss: beforePopulation - state.city.population, orderResetTo: 1,
    imperialInterventionGain: 1, imperialInterventionAfter: state.city.imperialIntervention };
}

function determineNextFirstPlayer(state) {
  const maxInfluence = Math.max(...state.players.map(player => player.influence));
  let finalists = state.players.filter(player => player.influence === maxInfluence);
  let tieBreakMethod = "influence"; let maxPrestige = null; let maxWealth = null; let randomRoll = null;
  if (finalists.length > 1) {
    maxPrestige = Math.max(...finalists.map(player => player.prestige));
    finalists = finalists.filter(player => player.prestige === maxPrestige); tieBreakMethod = "prestige";
  }
  if (finalists.length > 1) {
    maxWealth = Math.max(...finalists.map(player => player.wealthCapacity));
    finalists = finalists.filter(player => player.wealthCapacity === maxWealth); tieBreakMethod = "wealth";
  }
  if (finalists.length > 1) {
    randomRoll = nextRandom(state);
    finalists = [finalists[Math.min(finalists.length - 1, Math.floor(randomRoll * finalists.length))]];
    tieBreakMethod = "random";
  }
  state.firstPlayerId = finalists[0]?.id ?? state.firstPlayerId;
  return { nextFirstPlayerId: state.firstPlayerId, maxInfluence, maxPrestige, maxWealth, tieBreakMethod, randomRoll };
}

function setupMercenaryAuction(state, context) {
  const auction = makeAuction("mercenary_contract", "mercenary_contract");
  context.auctions.set(auction.auctionId, auction);
  const owner = getPlayer(state, state.mercenaryContract.ownerId);
  if (!owner) return null;
  const amount = V090_CONFIG.mercenaryContract.maintenanceBid;
  if (owner.influence < amount) {
    state.mercenaryContract.ownerId = null;
    return null;
  }
  reserveBid(state, auction, owner, amount, "upkeep_maintenance");
  return { playerId: owner.id, amount };
}

export const V110_PLAYTEST_API = Object.freeze({
  listHumanCandidates(state, playerId, context) {
    const player = getPlayer(state, playerId);
    return player ? playtestHumanCandidates(state, player, context) : [];
  },
  candidateSpec: playtestCandidateSpec,
  candidateFromSpec: playtestCandidateFromSpec,
  chooseAiAction(state, playerId, context) {
    const player = getPlayer(state, playerId);
    return player ? choosePlayerAction(state, player, context) : null;
  },
  executeAction(state, playerId, candidate, context, sequence = 1) {
    const player = getPlayer(state, playerId);
    if (!player || !candidate) return { sequence, action: null };
    return executePlayerAction(state, player, candidate, context, sequence);
  },
  getTurnOrder(state) { return base.getTurnOrder(state).map(player => player.id); },
  ensureProductionAuctions,
  highestBid,
});

export function applyAutoDemand(state) {
  ensureV110State(state);
  if (typeof base.recalculateRenown === "function") base.recalculateRenown(state);
  base.applyAutoDemand(state);
}

export function previewEconomy(state) {
  ensureV110State(state);
  applyAutoDemand(state);
  return base.previewEconomy(state);
}

export function resolveAutomatedGeneration(state) {
  ensureV110State(state);
  const generation = state.generation;
  const firstPlayerBefore = state.firstPlayerId;
  const populationBeforeUpkeep = state.city.population;
  const prestigeBefore = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));
  const influenceBefore = Object.fromEntries(state.players.map(player => [player.id, player.influence]));
  const wealthBefore = Object.fromEntries(state.players.map(player => [player.id, player.wealthCapacity]));
  const orderBefore = state.city.order;
  const squalorBefore = state.city.squalor;
  const forceBefore = currentForce(state);
  const urbanTilesBefore = currentUrbanTiles(state);
  const urbanCapacityBefore = currentUrbanCapacity(state);
  const imperialInterventionBefore = state.city.imperialIntervention;
  const renownBeforeGrowth = state.city.renown;

  const context = { actions: [], auctions: new Map(), farmBuilt: false, expansionVoteDone: false, civicExpansionVote: null };

  state.phase = "upkeep_growth";
  const upkeepGrowth = applyUpkeepGrowth(state);
  state.phase = "upkeep_renown";
  const renownBreakdown = typeof base.recalculateRenown === "function" ? base.recalculateRenown(state) : null;
  state.phase = "upkeep_influence_erosion";
  const influenceErosion = erodeInfluence(state);
  state.phase = "upkeep_aging";
  const agentAging = ageAgents(state);
  ageProductionStakes(state);
  state.phase = "upkeep_agent_support";
  const forcedAgentRecalls = enforceUpkeepAgentCapacity(state);
  let sequence = 1;
  for (const recall of forcedAgentRecalls) context.actions.push({ sequence: sequence++, ...recall });
  state.phase = "upkeep_contracts";
  const mercenaryMaintenanceBid = setupMercenaryAuction(state, context);

  state.phase = "event";
  const generationEvent = null;

  state.phase = "player_actions";
  for (const player of state.players) player.wealthCommittedThisGeneration = 0;
  base.applyAutoDemand(state);
  if (state.__playtestCaptureBeforeActions) {
    const payload = {
      state: structuredClone(state),
      context: structuredClone(context),
      generation,
      firstPlayerBefore,
    };
    const error = new Error("MORNEVAL_PLAYTEST_ACTION_PHASE");
    error.code = "MORNEVAL_PLAYTEST_ACTION_PHASE";
    error.playtest = payload;
    throw error;
  }
  const actionPhase = runActionPhase(state, context);
  context.actions.forEach((action, index) => { action.sequence = index + 1; });

  state.phase = "auction_resolution";
  const auctions = resolveAuctions(state, context);

  state.phase = "economy_resolution";
  base.applyAutoDemand(state);
  const economyResult = base.previewEconomy(state);
  const reports = economyResult.reports;
  const familyWealth = { ...economyResult.familyWealth };
  const subsistence = base.getFoodSubsistenceStatus(state);
  const mercenaryOwner = getPlayer(state, state.mercenaryContract.ownerId);
  const mercenaryFoodConsumed = mercenaryOwner && subsistence.surplusForRefining >= V090_CONFIG.mercenaryContract.rawFoodMaintenance
    ? V090_CONFIG.mercenaryContract.rawFoodMaintenance : 0;
  state.mercenaryContract.foodConsumedThisGeneration = mercenaryFoodConsumed > 0;
  if (mercenaryOwner && mercenaryFoodConsumed > 0) {
    familyWealth[mercenaryOwner.id] = (familyWealth[mercenaryOwner.id] ?? base.V084_CONFIG.familyBaseWealth)
      + V090_CONFIG.mercenaryContract.wealthIncome;
  }
  markProductionUsage(state, reports, subsistence, mercenaryFoodConsumed);
  const unmetCityDemand = sumDemand(reports, "unmet", "population");
  const imperialUnmetTotal = sumDemand(reports, "unmet", "imperial");

  const provisionalSummary = {
    generation,
    actions: context.actions,
    economyReports: reports,
    subsistence,
    unmetCityDemand,
    imperialUnmetTotal,
  };

  state.phase = "prestige_influence_scoring";
  const institutionScores = calculateInstitutionScores(state, reports, context.actions, state.city.order, state.city.population);
  const prestigeScoring = applyPrestigeScoring(state, provisionalSummary, institutionScores);
  const agentInfluenceAwards = applyAgentInfluence(state);

  state.phase = "city_evolution";
  const cityEvolution = resolveCityEvolution(state, { ...provisionalSummary, subsistence });

  state.phase = "civil_disorder_resolution";
  const chaos = resolveCivilDisorder(state, cityEvolution);

  state.phase = "wealth_recalculation";
  const wealthCommitments = [];
  for (const player of state.players) {
    const gross = Math.max(base.V084_CONFIG.familyBaseWealth, Math.floor(Number(familyWealth[player.id]) || base.V084_CONFIG.familyBaseWealth));
    player.wealthCapacity = gross;
    player.wealthGeneratedThisGeneration = gross;
    const agentCommitted = deployedInstitutionAgentCount(player);
    const actionCommitted = player.wealthCommittedThisGeneration || 0;
    const committed = actionCommitted + agentCommitted;
    const available = Math.max(0, gross - committed);
    const shortfall = Math.max(0, committed - gross);
    player.lastWealthCommitted = committed;
    player.lastWealthAvailable = available;
    player.lastWealthShortfall = shortfall;
    wealthCommitments.push({ playerId: player.id, gross, committed, actionCommitted, agentCommitted, available, shortfall });
  }

  state.phase = "first_player";
  const firstPlayerResolution = determineNextFirstPlayer(state);

  currentForce(state);
  base.applyAutoDemand(state);
  const requiredUrbanTiles = Math.max(1, Math.ceil(state.city.population / base.V084_CONFIG.urban.populationPerTile));
  const summary = {
    generation,
    phaseSequence: ["UPKEEP", "EVENT", "PLAYER_ACTIONS", "AUCTION_RESOLUTION", "ECONOMY_RESOLUTION",
      "PRESTIGE_INFLUENCE_SCORING", "CITY_EVOLUTION", "CIVIL_DISORDER_RESOLUTION", "WEALTH_RECALCULATION", "FIRST_PLAYER"],
    populationBefore: populationBeforeUpkeep,
    populationAfterUpkeep: upkeepGrowth.after,
    upkeepGrowthApplied: upkeepGrowth.applied,
    growth: upkeepGrowth.applied,
    growthMarkedForNextUpkeep: state.city.pendingGrowth,
    populationBeforeDisease: cityEvolution.populationBeforeDisease,
    populationAfter: state.city.population,
    squalorBefore,
    squalorAfter: state.city.squalor,
    directSqualor: cityEvolution.directSqualor,
    diseaseProbability: cityEvolution.diseaseProbability,
    diseaseRoll: cityEvolution.diseaseRoll,
    diseaseOccurred: cityEvolution.diseaseOccurred,
    diseaseLoss: cityEvolution.diseaseLoss,
    orderBefore,
    orderPrevious: orderBefore,
    orderBase: cityEvolution.orderResolution.baseOrder,
    orderAfter: state.city.order,
    orderCalculated: cityEvolution.orderResolution.finalOrder,
    orderChangeReason: cityEvolution.orderResolution.reason,
    growthBlockedBySqualor: cityEvolution.growthBlockedBySqualor,
    growthBlockedByOrder: cityEvolution.growthBlockedByOrder,
    growthBlockedByChaos: chaos.triggered,
    rawFoodPopulationNeed: subsistence.requested,
    rawFoodRequested: subsistence.localCapacity,
    rawFoodLocalCapacity: subsistence.localCapacity,
    rawFoodLocalServed: subsistence.localServed,
    imperialFoodAid: subsistence.imperialAid,
    imperialFoodAidUsed: cityEvolution.imperialAidUsed,
    imperialFoodPendingPrestige: cityEvolution.imperialFoodPendingPrestige,
    forceBefore,
    forceAfter: state.city.force,
    forceStructureAfter: state.city.forceStructure,
    forceManpowerAfter: state.city.forceManpower,
    imperialInterventionBefore,
    imperialInterventionAfter: state.city.imperialIntervention,
    imperialDemandPerSector: Math.floor(imperialInterventionBefore / Math.max(1, state.city.imperialDemandThreshold)),
    imperialDemandPerSectorAfter: Math.floor(state.city.imperialIntervention / Math.max(1, state.city.imperialDemandThreshold)),
    imperialUnmetTotal,
    imperialDemandPenaltyApplied: imperialUnmetTotal > 0,
    economyReports: reports,
    wealthAfter: familyWealth,
    wealthCommitments,
    mercenaryContract: { ...state.mercenaryContract, rawFoodConsumed: mercenaryFoodConsumed, ownerId: state.mercenaryContract.ownerId },
    mercenaryMaintenanceBid,
    prestigeBefore,
    prestigeScoring,
    prestigeAfter: Object.fromEntries(state.players.map(player => [player.id, player.prestige])),
    influenceBefore,
    influenceErosion,
    influenceAfter: Object.fromEntries(state.players.map(player => [player.id, player.influence])),
    agentInfluenceAwards,
    agentSeniorityBeforeAging: agentAging.before,
    agentSeniorityAfterAging: agentAging.after,
    forcedAgentRecalls,
    institutionScores,
    institutionPrestigeAwards: prestigeScoring.flatMap(result => result.entries
      .filter(entry => entry.reason.startsWith("institution_"))
      .map(entry => ({ playerId: result.playerId, institutionId: entry.reason.replace("institution_", ""), amount: entry.amount }))),
    chaos,
    actions: context.actions,
    auctions,
    civicExpansionVote: context.civicExpansionVote,
    expansionEvents: context.civicExpansionVote?.passed && context.civicExpansionVote.expansionEvent
      ? [context.civicExpansionVote.expansionEvent] : [],
    generationEvent,
    firstPlayerBefore,
    turnOrderBefore: actionPhase.turnOrder,
    firstPlayerResolution,
    nextFirstPlayerId: firstPlayerResolution.nextFirstPlayerId,
    renownBeforeGrowth,
    renownGain: 0,
    renownBeforeCap: state.city.renown,
    renownCap: null,
    renownLostToCap: 0,
    renownAfterGrowth: state.city.renown,
    renownBreakdown,
    urbanTilesBefore,
    urbanCapacityBefore,
    urbanTilesAfter: currentUrbanTiles(state),
    urbanCapacityAfter: currentUrbanCapacity(state),
    requiredUrbanTiles,
    expansionShortfall: Math.max(0, requiredUrbanTiles - currentUrbanTiles(state)),
    rawProductionAfterExpansion: base.getRawProductionBySector(state),
    explorationPoolAfter: base.getExplorationPoolCounts(state),
    wealthBefore,
    influenceErosionThreshold: state.city.influenceErosionThreshold,
    actionSafetyTriggered: context.actionSafetyTriggered,
    aiProfiles: Object.fromEntries(state.players.map(player => {
      const p = profileFor(state, player);
      return [player.id, { personality: player.aiPersonality, label: p.label, prestigeWeight: p.prestige,
        wealthWeight: p.wealth, engineWeight: p.engine, civicWeight: p.civic, horizon: p.horizon,
        agentUtilityWeights: agentUtilityWeights(player), agentNetworkFactor: agentNetworkFactor(player) }];
    })),
  };

  state.history.push(summary);
  state.generation += 1;
  state.phase = "upkeep";
  for (const player of state.players) {
    player.wealthCommittedThisGeneration = 0;
    player.agentWealthReleasePreview = 0;
  }
  return summary;
}
