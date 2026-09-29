import * as base from "./v090-engine.js?base=0.9.0";

export * from "./v090-engine.js?base=0.9.0";

export const V100_CONFIG = {
  order: {
    minimum: 0,
    maximum: 4,
    starting: 2,
    naturalRecoveryCeiling: 2,
    unmetPopulationDemandLoss: 1,
  },
  chaos: {
    prestigeLossFraction: 0.20,
    populationLoss: 1,
    orderReset: 1,
    imperialInterventionGain: 1,
  },
  manpower: {
    cap: 4,
    divisorsByInclination: {
      "-2": 2,
      "-1": 4,
      "0": 8,
      "1": 16,
      "2": null,
    },
  },
  fortificationTrack: [
    { level: 0, label: "None", structuralForce: 0 },
    { level: 1, label: "Palisades", structuralForce: 1 },
    { level: 2, label: "Walls", structuralForce: 3 },
    { level: 3, label: "Fortifications", structuralForce: 6 },
    { level: 4, label: "Citadel", structuralForce: 10 },
  ],
  institutions: {
    city_guard: { label: "City Guard", cap: 4 },
    temple: { label: "Temple", cap: 4 },
    merchant_guild: { label: "Merchant Guild", cap: 4 },
    scholarium: { label: "Scholarium College", cap: null },
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

function ensureV100State(state) {
  state.city.order = clampInt(
    state.city.order ?? V100_CONFIG.order.starting,
    V100_CONFIG.order.minimum,
    V100_CONFIG.order.maximum,
  );
  state.city.imperialIntervention = clampInt(state.city.imperialIntervention ?? 0);
  state.city.fortificationLevel = clampInt(state.city.fortificationLevel ?? 0, 0, 4);
  state.city.forceStructure = structuralForce(state.city.fortificationLevel);

  for (const player of state.players ?? []) {
    player.institutionAgents ??= {};
    for (const institutionId of INSTITUTION_IDS) {
      player.institutionAgents[institutionId] = clampInt(player.institutionAgents[institutionId] ?? 0);
    }
  }

  state.institutions ??= INSTITUTION_IDS.map(id => ({
    id,
    name: V100_CONFIG.institutions[id].label,
  }));
  refreshForce(state);
  return state;
}

export function structuralForce(level) {
  const entry = V100_CONFIG.fortificationTrack.find(item => item.level === clampInt(level, 0, 4));
  return entry?.structuralForce ?? 0;
}

export function manpowerForce(state) {
  const axis = clampInt(state?.city?.militaryMercantile ?? 0, -2, 2);
  const divisor = V100_CONFIG.manpower.divisorsByInclination[String(axis)];
  if (!divisor) return 0;
  const population = Math.max(1, clampInt(state?.city?.population ?? 1, 1));
  return Math.min(V100_CONFIG.manpower.cap, Math.floor(population / divisor));
}

export function refreshForce(state) {
  if (!state?.city) return 0;
  state.city.forceStructure = structuralForce(state.city.fortificationLevel ?? 0);
  state.city.forceManpower = manpowerForce(state);
  state.city.force = state.city.forceStructure + state.city.forceManpower;
  return state.city.force;
}

function applyInterventionDemand(state) {
  const intervention = clampInt(state?.city?.imperialIntervention ?? 0);
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === "food") continue;
    sector.demandThisGeneration.imperial = 1 + intervention;
  }
}

export function applyAutoDemand(state) {
  ensureV100State(state);
  base.applyAutoDemand(state);
  applyInterventionDemand(state);
  refreshForce(state);
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = base.createV084Game(familyNames);
  state.city.order = V100_CONFIG.order.starting;
  state.city.imperialIntervention = 0;
  state.city.fortificationLevel = 0;
  for (const player of state.players) {
    player.institutionAgents = Object.fromEntries(INSTITUTION_IDS.map(id => [id, 0]));
  }
  ensureV100State(state);
  applyAutoDemand(state);
  return state;
}

function sumDemand(reports, bucket, category) {
  return (reports ?? []).reduce(
    (sum, report) => sum + Math.max(0, Number(report?.demand?.[bucket]?.[category]) || 0),
    0,
  );
}

function cityGuardScore(state, orderOverride = null, forceOverride = null, populationOverride = null) {
  const order = clampInt(
    orderOverride ?? state.city.order,
    V100_CONFIG.order.minimum,
    V100_CONFIG.order.maximum,
  );
  const force = Math.max(0, Number(forceOverride ?? state.city.force) || 0);
  const population = Math.max(1, clampInt(populationOverride ?? state.city.population, 1));

  let orderPrestige = 0;
  if (order === 2) orderPrestige = 1;
  else if (order >= 3) orderPrestige = 2;

  const onePointThreshold = Math.ceil(population / 3);
  const twoPointThreshold = Math.ceil(population / 2);
  let readinessPrestige = 0;
  if (force >= onePointThreshold) readinessPrestige = 1;
  if (force >= twoPointThreshold) readinessPrestige = 2;

  return {
    score: Math.min(4, orderPrestige + readinessPrestige),
    orderPrestige,
    readinessPrestige,
    order,
    force,
    population,
    onePointThreshold,
    twoPointThreshold,
  };
}

function templeScore(state, populationOverride = null) {
  const religionArcane = clampInt(state.city.religionArcane ?? 0, -2, 2);
  const population = Math.max(1, clampInt(populationOverride ?? state.city.population, 1));
  const squalor = Math.max(0, clampInt(state.city.squalor ?? 0));

  const religiousPrestige = religionArcane === 2 ? 2 : religionArcane === 1 ? 1 : 0;
  let civicCoherence = 0;
  if (squalor === 0) civicCoherence = 2;
  else if (squalor <= Math.floor(population / 3)) civicCoherence = 1;

  return {
    score: Math.min(4, religiousPrestige + civicCoherence),
    religiousPrestige,
    civicCoherence,
    population,
    squalor,
  };
}

function merchantGuildScore(state, reports) {
  const axis = clampInt(state.city.militaryMercantile ?? 0, -2, 2);
  const externalServed = sumDemand(reports, "served", "external_markets");
  const externalUnmet = sumDemand(reports, "unmet", "external_markets");
  const populationUnmet = sumDemand(reports, "unmet", "population");
  const imperialUnmet = sumDemand(reports, "unmet", "imperial");

  let penalty = 0;
  if (axis === -2) penalty = externalUnmet + populationUnmet * 2;
  else if (axis === -1) penalty = externalUnmet + populationUnmet;
  else if (axis === 0) penalty = externalUnmet + imperialUnmet;
  else if (axis === 1) penalty = Math.ceil(externalUnmet / 2);
  else penalty = Math.floor(externalUnmet / 3);

  const rawScore = externalServed * 2 - penalty;
  return {
    score: Math.min(4, Math.max(0, rawScore)),
    rawScore,
    externalServed,
    externalUnmet,
    populationUnmet,
    imperialUnmet,
    penalty,
    inclination: axis,
  };
}

function scholariumScore(state, tierUpActions = []) {
  const arcaneAxis = clampInt(state.city.religionArcane ?? 0, -2, 2);
  const cumulativeTierIncreases = (state.productionSectors ?? []).reduce(
    (sum, sector) => sum + Math.max(0, clampInt(sector.tier ?? 1, 1) - 1),
    0,
  );

  let permanent = 0;
  if (arcaneAxis === -2) permanent = Math.floor(cumulativeTierIncreases / 3);
  else if (arcaneAxis === -1) permanent = Math.floor(cumulativeTierIncreases / 4);

  let breakthrough = 0;
  const breakthroughs = [];
  for (const action of tierUpActions ?? []) {
    if (action.type !== "sector_development" || !action.tierActivated) continue;
    const value = action.newTier === 2 ? 2 : action.newTier === 3 ? 4 : 0;
    if (!value) continue;
    breakthrough += value;
    breakthroughs.push({ sectorId: action.sectorId, newTier: action.newTier, prestige: value });
  }

  return {
    score: permanent + breakthrough,
    permanent,
    breakthrough,
    cumulativeTierIncreases,
    breakthroughs,
    inclination: arcaneAxis,
  };
}

export function calculateInstitutionScores(
  state,
  reports,
  tierUpActions = [],
  { order = null, force = null, population = null } = {},
) {
  ensureV100State(state);
  return {
    city_guard: cityGuardScore(state, order, force, population),
    temple: templeScore(state, population),
    merchant_guild: merchantGuildScore(state, reports),
    scholarium: scholariumScore(state, tierUpActions),
  };
}

export function getInstitutionPreview(state) {
  ensureV100State(state);
  applyAutoDemand(state);
  const economy = base.previewEconomy(state);
  return calculateInstitutionScores(state, economy.reports, []);
}

function applyInstitutionPrestige(state, institutionScores) {
  const awards = [];
  for (const player of state.players) {
    for (const institutionId of INSTITUTION_IDS) {
      const agents = clampInt(player.institutionAgents?.[institutionId] ?? 0);
      const institutionScore = Math.max(0, Number(institutionScores[institutionId]?.score) || 0);
      const amount = agents * institutionScore;
      if (amount > 0) player.prestige += amount;
      awards.push({
        playerId: player.id,
        institutionId,
        agents,
        institutionScore,
        amount,
      });
    }
  }
  return awards;
}

function resolveOrder(state, unmetCityDemand) {
  const before = clampInt(state.city.order, V100_CONFIG.order.minimum, V100_CONFIG.order.maximum);
  let afterPressure = before;
  let reason = "stable";

  if (unmetCityDemand > 0) {
    afterPressure = Math.max(0, before - V100_CONFIG.order.unmetPopulationDemandLoss);
    reason = "unmet_population_demand";
  } else if (before > 0 && before < V100_CONFIG.order.naturalRecoveryCeiling) {
    afterPressure = Math.min(V100_CONFIG.order.naturalRecoveryCeiling, before + 1);
    reason = "natural_recovery";
  }

  state.city.order = afterPressure;
  return { before, afterPressure, reason, chaosTriggered: afterPressure <= 0 };
}

function applyChaos(state, summary) {
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
  const diseaseLoss = Math.max(0, Number(summary.diseaseLoss) || 0);
  const populationWithoutGrowthAfterDisease = Math.max(
    minimumPopulation,
    summary.populationBefore - diseaseLoss,
  );
  const populationAfter = Math.max(
    minimumPopulation,
    populationWithoutGrowthAfterDisease - V100_CONFIG.chaos.populationLoss,
  );
  const actualChaosPopulationLoss = populationWithoutGrowthAfterDisease - populationAfter;

  state.city.population = populationAfter;
  state.city.order = V100_CONFIG.chaos.orderReset;
  state.city.imperialIntervention = clampInt(state.city.imperialIntervention)
    + V100_CONFIG.chaos.imperialInterventionGain;

  const renownCap = state.city.population * base.V084_CONFIG.renown.capPerPopulation;
  state.city.renown = Math.min(state.city.renown, renownCap);

  return {
    triggered: true,
    prestigeLossFraction: V100_CONFIG.chaos.prestigeLossFraction,
    prestigeLosses,
    growthCancelled: Math.max(0, Number(summary.growth) || 0),
    populationLoss: actualChaosPopulationLoss,
    orderResetTo: V100_CONFIG.chaos.orderReset,
    imperialInterventionGain: V100_CONFIG.chaos.imperialInterventionGain,
    imperialInterventionAfter: state.city.imperialIntervention,
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
  ensureV100State(state);
  applyAutoDemand(state);

  const orderBefore = state.city.order;
  const forceBefore = refreshForce(state);
  const imperialInterventionBefore = state.city.imperialIntervention;

  const summary = base.resolveAutomatedGeneration(state);

  // v0.9.0 has completed the economic resolution. Apply the new volatile Order
  // state before institutional scoring, but keep Order 0 visible to the City
  // Guard score for the Generation in which Chaos is triggered.
  const orderResolution = resolveOrder(state, summary.unmetCityDemand || 0);
  const populationForInstitutionScoring = state.city.population;
  const forceForInstitutionScoring = refreshForce(state);

  const institutionScores = calculateInstitutionScores(
    state,
    summary.economyReports,
    summary.actions,
    {
      order: orderResolution.afterPressure,
      force: forceForInstitutionScoring,
      population: populationForInstitutionScoring,
    },
  );
  const institutionPrestigeAwards = applyInstitutionPrestige(state, institutionScores);

  let chaos = { triggered: false };
  if (orderResolution.chaosTriggered) {
    chaos = applyChaos(state, summary);
    summary.growth = 0;
    summary.growthBlockedByChaos = true;
    summary.populationAfter = state.city.population;
    summary.requiredUrbanTiles = Math.max(
      1,
      Math.ceil(state.city.population / base.V084_CONFIG.urban.populationPerTile),
    );
    summary.expansionShortfall = Math.max(0, summary.requiredUrbanTiles - state.city.urbanTiles);
    summary.renownCap = state.city.population * base.V084_CONFIG.renown.capPerPopulation;
    summary.renownAfterGrowth = state.city.renown;
    summary.renownLostToCap = Math.max(0, summary.renownBeforeCap - state.city.renown);
  } else {
    summary.growthBlockedByChaos = false;
  }

  refreshForce(state);
  applyAutoDemand(state);

  // Institution scoring and Chaos Prestige losses are End-of-Generation effects,
  // so they must be visible to the First Player Prestige tie-break.
  const firstPlayerResolution = determineNextFirstPlayer(state);

  Object.assign(summary, {
    orderBefore,
    orderAfterPressure: orderResolution.afterPressure,
    orderAfter: state.city.order,
    orderChangeReason: orderResolution.reason,
    forceBefore,
    forceForInstitutionScoring,
    forceAfter: state.city.force,
    forceStructureAfter: state.city.forceStructure,
    forceManpowerAfter: state.city.forceManpower,
    fortificationLevelAfter: state.city.fortificationLevel,
    imperialInterventionBefore,
    imperialInterventionAfter: state.city.imperialIntervention,
    imperialDemandPerSector: 1 + imperialInterventionBefore,
    chaos,
    institutionScores,
    institutionPrestigeAwards,
    institutionPrestigeTotal: institutionPrestigeAwards.reduce((sum, award) => sum + award.amount, 0),
    firstPlayerResolution,
    nextFirstPlayerId: firstPlayerResolution.nextFirstPlayerId,
    prestigeAfter: Object.fromEntries(state.players.map(player => [player.id, player.prestige])),
  });

  return summary;
}

export function setInstitutionAgentCount(state, playerId, institutionId, value) {
  ensureV100State(state);
  if (!INSTITUTION_IDS.includes(institutionId)) return;
  const player = state.players.find(item => item.id === playerId);
  if (!player) return;
  player.institutionAgents[institutionId] = clampInt(value);
}

export function setCityValue(state, key, value) {
  ensureV100State(state);
  if (key === "order") {
    state.city.order = clampInt(value, V100_CONFIG.order.minimum, V100_CONFIG.order.maximum);
  } else if (key === "imperialIntervention") {
    state.city.imperialIntervention = clampInt(value);
  } else if (key === "fortificationLevel") {
    state.city.fortificationLevel = clampInt(value, 0, 4);
  } else {
    base.setCityValue(state, key, value);
  }
  refreshForce(state);
  applyAutoDemand(state);
}
