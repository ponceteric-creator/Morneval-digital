import * as base from "./v100-engine.js?base=0.10.0-v102";

export * from "./v100-engine.js?base=0.10.0-v102";

export const V100_CONFIG = {
  ...base.V100_CONFIG,
  order: {
    minimum: 0,
    maximum: 4,
    smallCityMaxPopulation: 3,
    largeCityThreshold: 15,
    smallCityBase: 3,
    normalCityBase: 2,
    largeCityBase: 1,
    unmetPopulationDemandModifier: -1,
    largeCityGrowthMinimum: 2,
  },
  imperial: {
    defaultDemandThreshold: 3,
    foodAidInterventionGain: 1,
  },
  agents: {
    wealthCommitment: 1,
    maximumSeniority: 3,
  },
};

const INSTITUTION_IDS = Object.keys(V100_CONFIG.institutions);

function clampInt(value, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(minimum, Math.min(maximum, n));
}

function nextRandom(state) {
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

export function baseOrderForPopulation(population) {
  const pop = Math.max(1, clampInt(population, 1));
  if (pop <= V100_CONFIG.order.smallCityMaxPopulation) return V100_CONFIG.order.smallCityBase;
  if (pop >= V100_CONFIG.order.largeCityThreshold) return V100_CONFIG.order.largeCityBase;
  return V100_CONFIG.order.normalCityBase;
}

export function imperialDemandPerSector(state) {
  const intervention = clampInt(state?.city?.imperialIntervention ?? 0);
  const threshold = Math.max(1, clampInt(
    state?.city?.imperialDemandThreshold ?? V100_CONFIG.imperial.defaultDemandThreshold,
    1,
  ));
  return Math.floor(intervention / threshold);
}

function syncAgentCounts(player) {
  player.institutionAgents ??= {};
  const roster = Array.isArray(player.institutionAgentRoster) ? player.institutionAgentRoster : [];
  for (const institutionId of INSTITUTION_IDS) {
    player.institutionAgents[institutionId] = roster.filter(agent => agent.institutionId === institutionId).length;
  }
}

function ensureV102State(state) {
  state.city.imperialIntervention = clampInt(state.city.imperialIntervention ?? 0);
  state.city.imperialDemandThreshold = Math.max(1, clampInt(
    state.city.imperialDemandThreshold ?? V100_CONFIG.imperial.defaultDemandThreshold,
    1,
  ));
  state.city.orderModifier = Math.max(-4, Math.min(4, Math.floor(Number(state.city.orderModifier) || 0)));
  if (!Number.isFinite(Number(state.city.order))) {
    state.city.order = baseOrderForPopulation(state.city.population);
  }
  if (typeof base.ensureInstitutionAgentState === "function") {
    base.ensureInstitutionAgentState(state);
  } else {
    state.nextInstitutionAgentOrder = Math.max(1, clampInt(state.nextInstitutionAgentOrder ?? 1, 1));
    for (const player of state.players ?? []) {
      player.institutionAgentRoster ??= [];
      syncAgentCounts(player);
    }
  }
  return state;
}

function sumDemand(reports, bucket, category) {
  return (reports ?? []).reduce(
    (sum, report) => sum + Math.max(0, Number(report?.demand?.[bucket]?.[category]) || 0),
    0,
  );
}

function calculateOrder(state, unmetCityDemand, populationOverride = null) {
  const population = Math.max(1, clampInt(populationOverride ?? state.city.population, 1));
  const baseOrder = baseOrderForPopulation(population);
  const manualModifier = Math.max(-4, Math.min(4, Math.floor(Number(state.city.orderModifier) || 0)));
  const demandModifier = unmetCityDemand > 0
    ? V100_CONFIG.order.unmetPopulationDemandModifier
    : 0;
  const totalModifier = manualModifier + demandModifier;
  const finalOrder = Math.max(
    V100_CONFIG.order.minimum,
    Math.min(V100_CONFIG.order.maximum, baseOrder + totalModifier),
  );
  const parts = [`base ${baseOrder}`];
  if (manualModifier) parts.push(`test ${manualModifier > 0 ? "+" : ""}${manualModifier}`);
  if (demandModifier) parts.push(`unmet City ${demandModifier}`);
  return {
    population,
    baseOrder,
    manualModifier,
    demandModifier,
    totalModifier,
    finalOrder,
    reason: parts.join(" · "),
    chaosTriggered: finalOrder <= 0,
  };
}

function applyInstitutionPrestige(state, institutionScores) {
  const awards = [];
  for (const player of state.players) {
    syncAgentCounts(player);
    for (const institutionId of INSTITUTION_IDS) {
      const agents = clampInt(player.institutionAgents?.[institutionId] ?? 0);
      const institutionScore = Math.max(0, Number(institutionScores[institutionId]?.score) || 0);
      const amount = agents * institutionScore;
      if (amount > 0) player.prestige += amount;
      awards.push({ playerId: player.id, institutionId, agents, institutionScore, amount });
    }
  }
  return awards;
}

function reverseLegacyInstitutionPrestige(state, summary) {
  for (const award of summary.institutionPrestigeAwards ?? []) {
    const amount = Math.max(0, Number(award.amount) || 0);
    if (!amount) continue;
    const player = state.players.find(item => item.id === award.playerId);
    if (player) player.prestige = Math.max(0, player.prestige - amount);
  }
}

function cancelGrowthForOrder(state, summary) {
  if ((Number(summary.growth) || 0) <= 0) return 0;
  const minimumPopulation = base.V084_CONFIG.population.minimum;
  const diseaseLoss = Math.max(0, Number(summary.diseaseLoss) || 0);
  const withoutGrowth = Math.max(minimumPopulation, summary.populationBefore - diseaseLoss);
  const cancelled = Math.max(0, state.city.population - withoutGrowth);
  state.city.population = withoutGrowth;
  summary.growth = 0;
  summary.populationAfter = state.city.population;
  return cancelled;
}

function applyChaos(state) {
  const prestigeLosses = state.players.map(player => {
    const before = Math.max(0, Number(player.prestige) || 0);
    const requestedLoss = before > 0
      ? Math.ceil(before * V100_CONFIG.chaos.prestigeLossFraction)
      : 0;
    player.prestige = Math.max(0, before - requestedLoss);
    return {
      playerId: player.id,
      before,
      requestedLoss,
      actualLoss: before - player.prestige,
      after: player.prestige,
    };
  });

  const minimumPopulation = base.V084_CONFIG.population.minimum;
  const beforePopulation = state.city.population;
  state.city.population = Math.max(
    minimumPopulation,
    beforePopulation - V100_CONFIG.chaos.populationLoss,
  );
  const actualChaosPopulationLoss = beforePopulation - state.city.population;

  state.city.order = V100_CONFIG.chaos.orderReset;
  state.city.imperialIntervention = clampInt(state.city.imperialIntervention)
    + V100_CONFIG.chaos.imperialInterventionGain;

  return {
    triggered: true,
    prestigeLossFraction: V100_CONFIG.chaos.prestigeLossFraction,
    prestigeLosses,
    populationLoss: actualChaosPopulationLoss,
    orderResetTo: V100_CONFIG.chaos.orderReset,
    imperialInterventionGain: V100_CONFIG.chaos.imperialInterventionGain,
    imperialInterventionAfter: state.city.imperialIntervention,
  };
}

function applyAgentInfluenceAndAge(state) {
  ensureV102State(state);
  const awards = [];
  const seniorityBefore = {};
  const seniorityAfter = {};

  for (const player of state.players) {
    const roster = Array.isArray(player.institutionAgentRoster) ? player.institutionAgentRoster : [];
    seniorityBefore[player.id] = roster.map(agent => ({
      agentId: agent.id,
      institutionId: agent.institutionId,
      seniority: clampInt(agent.seniority ?? 1, 1, V100_CONFIG.agents.maximumSeniority),
    }));

    const requested = roster.reduce(
      (sum, agent) => sum + clampInt(agent.seniority ?? 1, 1, V100_CONFIG.agents.maximumSeniority),
      0,
    );
    const before = Math.max(0, Number(player.influence) || 0);
    const maximum = Math.max(0, Number(player.maxInfluence) || base.V084_CONFIG.influence.maximum || 10);
    player.influence = Math.min(maximum, before + requested);
    const received = player.influence - before;
    awards.push({
      playerId: player.id,
      agentCount: roster.length,
      before,
      requested,
      received,
      clipped: Math.max(0, requested - received),
      after: player.influence,
    });

    for (const agent of roster) {
      agent.seniority = Math.min(
        V100_CONFIG.agents.maximumSeniority,
        clampInt(agent.seniority ?? 1, 1) + 1,
      );
    }
    syncAgentCounts(player);
    seniorityAfter[player.id] = roster.map(agent => ({
      agentId: agent.id,
      institutionId: agent.institutionId,
      seniority: agent.seniority,
    }));
  }

  return { awards, seniorityBefore, seniorityAfter };
}

function refreshPopulationDependentSummary(state, summary) {
  summary.populationAfter = state.city.population;
  summary.requiredUrbanTiles = Math.max(
    1,
    Math.ceil(state.city.population / base.V084_CONFIG.urban.populationPerTile),
  );
  summary.expansionShortfall = Math.max(0, summary.requiredUrbanTiles - state.city.urbanTiles);
  summary.renownCap = state.city.population * base.V084_CONFIG.renown.capPerPopulation;
  state.city.renown = Math.min(state.city.renown, summary.renownCap);
  summary.renownAfterGrowth = state.city.renown;
  summary.renownLostToCap = Math.max(0, summary.renownBeforeCap - state.city.renown);
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

export function applyAutoDemand(state) {
  ensureV102State(state);
  base.applyAutoDemand(state);
}

export function previewEconomy(state) {
  ensureV102State(state);
  applyAutoDemand(state);
  return base.previewEconomy(state);
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = base.createV084Game(familyNames);
  state.city.imperialIntervention = 0;
  state.city.imperialDemandThreshold = V100_CONFIG.imperial.defaultDemandThreshold;
  state.city.orderModifier = 0;
  state.city.order = baseOrderForPopulation(state.city.population);
  state.nextInstitutionAgentOrder = Math.max(1, clampInt(state.nextInstitutionAgentOrder ?? 1, 1));
  for (const player of state.players) {
    player.institutionAgentRoster = [];
    player.institutionAgents = Object.fromEntries(INSTITUTION_IDS.map(id => [id, 0]));
  }
  ensureV102State(state);
  applyAutoDemand(state);
  return state;
}

export function getInstitutionPreview(state) {
  ensureV102State(state);
  const economy = previewEconomy(state);
  const population = Math.max(1, clampInt(state.city.population, 1));
  const unmetCityDemand = sumDemand(economy.reports, "unmet", "population");
  const order = calculateOrder(state, unmetCityDemand, population);
  return base.calculateInstitutionScores(state, economy.reports, [], {
    order: order.finalOrder,
    force: base.refreshForce(state),
    population,
  });
}

export function resolveAutomatedGeneration(state) {
  ensureV102State(state);
  applyAutoDemand(state);

  const previousOrder = clampInt(state.city.order, 0, 4);
  const forceBefore = base.refreshForce(state);
  const imperialInterventionBefore = state.city.imperialIntervention;
  const imperialDemandThreshold = state.city.imperialDemandThreshold;
  const imperialDemandBefore = imperialDemandPerSector(state);

  // Neutralise v0.10.0 persistent Order decay while reusing its otherwise
  // stable Institution/Force wrapper. Its single −1 pressure cannot trigger
  // Chaos from this temporary value, so no legacy crisis side effects occur.
  state.city.order = V100_CONFIG.order.maximum;
  const summary = base.resolveAutomatedGeneration(state);
  reverseLegacyInstitutionPrestige(state, summary);

  const populationForOrder = Math.max(1, clampInt(summary.populationBefore, 1));
  const orderResolution = calculateOrder(state, summary.unmetCityDemand || 0, populationForOrder);
  state.city.order = orderResolution.finalOrder;

  const populationForInstitutionScoring = state.city.population;
  const forceForInstitutionScoring = base.refreshForce(state);
  const institutionScores = base.calculateInstitutionScores(
    state,
    summary.economyReports,
    summary.actions,
    {
      order: orderResolution.finalOrder,
      force: forceForInstitutionScoring,
      population: populationForInstitutionScoring,
    },
  );
  const institutionPrestigeAwards = applyInstitutionPrestige(state, institutionScores);

  // The Order growth gate applies only once Morneval reaches Population 15.
  // Below that threshold, Order still matters for Institution scoring and Chaos
  // but does not independently stop otherwise-valid Population growth.
  const growthBlockedByOrder = populationForOrder >= V100_CONFIG.order.largeCityThreshold
    && orderResolution.finalOrder < V100_CONFIG.order.largeCityGrowthMinimum;
  const growthCancelledByOrder = growthBlockedByOrder
    ? cancelGrowthForOrder(state, summary)
    : 0;

  const foodAidInterventionGain = summary.imperialFoodAidUsed
    ? V100_CONFIG.imperial.foodAidInterventionGain
    : 0;
  if (foodAidInterventionGain > 0) {
    state.city.imperialIntervention += foodAidInterventionGain;
  }

  let chaos = { triggered: false };
  if (orderResolution.chaosTriggered) {
    chaos = applyChaos(state);
  }

  if (growthBlockedByOrder || chaos.triggered) {
    refreshPopulationDependentSummary(state, summary);
  }

  // v0.9 already applied the normal −2 Influence erosion. Institution scoring
  // is now followed by Agent income at current seniority, capped at 10, then
  // Agent seniority advances for the next Generation.
  state.phase = "agent_income";
  const agentResolution = applyAgentInfluenceAndAge(state);
  state.phase = "agent_aging";

  base.refreshForce(state);
  applyAutoDemand(state);

  const firstPlayerResolution = determineNextFirstPlayer(state);

  Object.assign(summary, {
    orderPrevious: previousOrder,
    orderBefore: orderResolution.baseOrder,
    orderBase: orderResolution.baseOrder,
    orderManualModifier: orderResolution.manualModifier,
    orderDemandModifier: orderResolution.demandModifier,
    orderTotalModifier: orderResolution.totalModifier,
    orderCalculated: orderResolution.finalOrder,
    orderAfterPressure: orderResolution.finalOrder,
    orderAfter: orderResolution.finalOrder,
    orderPostChaos: state.city.order,
    orderChangeReason: orderResolution.reason,
    growthBlockedByOrder,
    growthOrderGatePopulationThreshold: V100_CONFIG.order.largeCityThreshold,
    growthOrderMinimumAtLargeCity: V100_CONFIG.order.largeCityGrowthMinimum,
    growthCancelledByOrder,
    growthBlockedByChaos: chaos.triggered,
    forceBefore,
    forceForInstitutionScoring,
    forceAfter: state.city.force,
    forceStructureAfter: state.city.forceStructure,
    forceManpowerAfter: state.city.forceManpower,
    fortificationLevelAfter: state.city.fortificationLevel,
    imperialInterventionBefore,
    imperialFoodInterventionGain: foodAidInterventionGain,
    imperialInterventionAfter: state.city.imperialIntervention,
    imperialDemandThreshold,
    imperialDemandPerSector: imperialDemandBefore,
    imperialDemandPerSectorAfter: imperialDemandPerSector(state),
    chaos,
    institutionScores,
    institutionPrestigeAwards,
    institutionPrestigeTotal: institutionPrestigeAwards.reduce((sum, award) => sum + award.amount, 0),
    agentInfluenceAwards: agentResolution.awards,
    agentSeniorityBeforeAging: agentResolution.seniorityBefore,
    agentSeniorityAfterAging: agentResolution.seniorityAfter,
    institutionAgentRosterAfter: Object.fromEntries(state.players.map(player => [
      player.id,
      (player.institutionAgentRoster ?? []).map(agent => ({ ...agent })),
    ])),
    firstPlayerResolution,
    nextFirstPlayerId: firstPlayerResolution.nextFirstPlayerId,
    prestigeAfter: Object.fromEntries(state.players.map(player => [player.id, player.prestige])),
    influenceAfter: Object.fromEntries(state.players.map(player => [player.id, player.influence])),
  });

  state.phase = "action_phase";
  return summary;
}

export function setInstitutionAgentCount(state, playerId, institutionId, value) {
  ensureV102State(state);
  if (!INSTITUTION_IDS.includes(institutionId)) return;
  const player = state.players.find(item => item.id === playerId);
  if (!player) return;
  const desired = clampInt(value);
  const roster = player.institutionAgentRoster ?? (player.institutionAgentRoster = []);
  let matching = roster.filter(agent => agent.institutionId === institutionId);

  while (matching.length < desired) {
    const order = state.nextInstitutionAgentOrder;
    roster.push({
      id: `agent_${order}`,
      institutionId,
      seniority: 1,
      placementOrder: order,
      placedGeneration: state.generation,
      manualTestPlacement: true,
    });
    state.nextInstitutionAgentOrder += 1;
    matching = roster.filter(agent => agent.institutionId === institutionId);
  }

  if (matching.length > desired) {
    const removeIds = matching
      .sort((a, b) => a.seniority - b.seniority || b.placementOrder - a.placementOrder)
      .slice(0, matching.length - desired)
      .map(agent => agent.id);
    player.institutionAgentRoster = roster.filter(agent => !removeIds.includes(agent.id));
  }
  syncAgentCounts(player);
}

export function setCityValue(state, key, value) {
  ensureV102State(state);
  if (key === "orderModifier") {
    state.city.orderModifier = Math.max(-4, Math.min(4, Math.floor(Number(value) || 0)));
  } else if (key === "order") {
    const desired = clampInt(value, 0, 4);
    state.city.orderModifier = desired - baseOrderForPopulation(state.city.population);
  } else if (key === "imperialIntervention") {
    state.city.imperialIntervention = clampInt(value);
  } else if (key === "imperialDemandThreshold") {
    state.city.imperialDemandThreshold = Math.max(1, clampInt(value, 1));
  } else {
    base.setCityValue(state, key, value);
  }

  state.city.order = Math.max(
    0,
    Math.min(4, baseOrderForPopulation(state.city.population) + state.city.orderModifier),
  );
  base.refreshForce(state);
  applyAutoDemand(state);
}
