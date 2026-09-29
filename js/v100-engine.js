import * as base from "./v090-engine.js?base=0.9.0";

export * from "./v090-engine.js?base=0.9.0";

export const V100_CONFIG = {
  version: "0.10.0",
  order: {
    minimum: 0,
    maximum: 4,
    equilibrium: 2,
    unmetPopulationDemandLoss: 1,
  },
  chaos: {
    prestigeLossRate: 0.20,
    populationLoss: 1,
    imperialInterventionGain: 1,
    resetOrderTo: 1,
  },
  force: {
    manpowerCap: 4,
    manpowerDivisors: {
      "-2": 2,
      "-1": 4,
      "0": 8,
      "1": 16,
      "2": null,
    },
  },
  institutions: {
    cityGuardCap: 4,
    templeCap: 4,
    merchantGuildCap: 4,
    scholariumCap: null,
  },
};

const INSTITUTION_IDS = ["cityGuard", "temple", "merchantGuild", "scholarium"];

function clampInt(value, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(minimum, Math.min(maximum, n));
}

function imperialIntervention(state) {
  return clampInt(state?.city?.imperialIntervention, 0);
}

function manpowerForce(state) {
  const population = Math.max(1, clampInt(state?.city?.population, 1));
  const inclination = clampInt(state?.city?.militaryMercantile, -2, 2);
  const divisor = V100_CONFIG.force.manpowerDivisors[String(inclination)];
  if (!divisor) return 0;
  return Math.min(V100_CONFIG.force.manpowerCap, Math.floor(population / divisor));
}

function updateForce(state) {
  const structure = clampInt(state.city.structuralForce, 0);
  const manpower = manpowerForce(state);
  state.city.structuralForce = structure;
  state.city.manpowerForce = manpower;
  state.city.force = structure + manpower;
  return { structure, manpower, total: state.city.force };
}

function ensureInstitutionAgents(player) {
  if (!player.institutionAgents || typeof player.institutionAgents !== "object") {
    player.institutionAgents = {};
  }
  for (const id of INSTITUTION_IDS) {
    player.institutionAgents[id] = clampInt(player.institutionAgents[id], 0);
  }
}

function ensureV100State(state) {
  if (!state.city) state.city = {};
  if (!state.city.v100CivicModelInitialized) {
    state.city.order = state.city.order > 0
      ? clampInt(state.city.order, V100_CONFIG.order.minimum, V100_CONFIG.order.maximum)
      : V100_CONFIG.order.equilibrium;
    state.city.imperialIntervention = imperialIntervention(state);
    state.city.structuralForce = clampInt(state.city.structuralForce ?? state.city.force, 0);
    state.city.v100CivicModelInitialized = true;
  } else {
    state.city.order = clampInt(
      state.city.order,
      V100_CONFIG.order.minimum,
      V100_CONFIG.order.maximum,
    );
    state.city.imperialIntervention = imperialIntervention(state);
    state.city.structuralForce = clampInt(state.city.structuralForce, 0);
  }
  for (const player of state.players ?? []) ensureInstitutionAgents(player);
  updateForce(state);
  return state;
}

function installImperialDemandOverlay(state) {
  const records = [];
  for (const sector of state.productionSectors ?? []) {
    const source = sector.demandThisGeneration ?? {
      population: 0,
      imperial: 0,
      external_markets: 0,
    };
    const backing = { ...source };
    const proxy = new Proxy(backing, {
      set(target, property, value) {
        if (property === "imperial" && sector.id !== "food") {
          target[property] = clampInt(value, 0) + imperialIntervention(state);
        } else {
          target[property] = value;
        }
        return true;
      },
    });
    sector.demandThisGeneration = proxy;
    records.push({ sector, proxy });
  }

  return () => {
    for (const { sector, proxy } of records) {
      sector.demandThisGeneration = { ...proxy };
    }
  };
}

function addImperialInterventionToPlainDemand(state) {
  const extra = imperialIntervention(state);
  if (extra <= 0) return;
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === "food") continue;
    sector.demandThisGeneration.imperial =
      clampInt(sector.demandThisGeneration.imperial, 0) + extra;
  }
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = base.createV084Game(familyNames);
  ensureV100State(state);
  applyAutoDemand(state);
  return state;
}

export function setCityValue(state, key, value) {
  ensureV100State(state);

  if (key === "order") {
    state.city.order = clampInt(value, V100_CONFIG.order.minimum, V100_CONFIG.order.maximum);
    return;
  }

  if (key === "force" || key === "structuralForce") {
    state.city.structuralForce = clampInt(value, 0);
    updateForce(state);
    return;
  }

  if (key === "imperialIntervention") {
    state.city.imperialIntervention = clampInt(value, 0);
    applyAutoDemand(state);
    return;
  }

  base.setCityValue(state, key, value);
  if (key === "population" || key === "militaryMercantile") updateForce(state);
}

export function applyAutoDemand(state) {
  ensureV100State(state);
  base.applyAutoDemand(state);
  addImperialInterventionToPlainDemand(state);
}

export function previewEconomy(state) {
  ensureV100State(state);
  const restore = installImperialDemandOverlay(state);
  try {
    return base.previewEconomy(state);
  } finally {
    restore();
  }
}

export function projectedWealthCapacity(state, playerId) {
  return previewEconomy(state).familyWealth[playerId] ?? base.V084_CONFIG.familyBaseWealth;
}

export function getForceBreakdown(state) {
  ensureV100State(state);
  return updateForce(state);
}

function orderComponent(order) {
  return Math.min(2, Math.floor(clampInt(order, 0, 4) / 2));
}

function readinessComponent(force, population) {
  const pop = Math.max(1, clampInt(population, 1));
  const high = Math.ceil(pop / 2);
  const moderate = Math.ceil(pop / 3);
  if (force >= high) return 2;
  if (force >= moderate) return 1;
  return 0;
}

function cityGuardScore(state) {
  const force = updateForce(state);
  const order = clampInt(state.city.order, 0, 4);
  const orderScore = orderComponent(order);
  const readinessScore = readinessComponent(force.total, state.city.population);
  return {
    score: Math.min(V100_CONFIG.institutions.cityGuardCap, orderScore + readinessScore),
    order,
    orderScore,
    force,
    readinessScore,
    readinessModerateThreshold: Math.ceil(Math.max(1, state.city.population) / 3),
    readinessHighThreshold: Math.ceil(Math.max(1, state.city.population) / 2),
  };
}

function templeScore(state, summary) {
  const inclination = clampInt(state.city.religionArcane, -2, 2);
  const religionScore = inclination >= 2 ? 2 : (inclination === 1 ? 1 : 0);
  const population = Math.max(1, clampInt(state.city.population, 1));
  const squalor = clampInt(summary.squalorAfter ?? state.city.squalor, 0);
  let civicCoherence = 0;
  if (squalor === 0) civicCoherence = 2;
  else if (squalor * 3 <= population) civicCoherence = 1;
  return {
    score: Math.min(V100_CONFIG.institutions.templeCap, religionScore + civicCoherence),
    religionScore,
    civicCoherence,
    inclination,
    population,
    squalor,
  };
}

function merchantGuildScore(state, summary) {
  const reports = summary.economyReports ?? [];
  const externalServed = reports.reduce(
    (sum, report) => sum + clampInt(report?.demand?.served?.external_markets, 0),
    0,
  );
  const externalUnmet = reports.reduce(
    (sum, report) => sum + clampInt(report?.demand?.unmet?.external_markets, 0),
    0,
  );
  const populationUnmet = reports.reduce(
    (sum, report) => sum + clampInt(report?.demand?.unmet?.population, 0),
    0,
  );
  const imperialUnmet = reports.reduce(
    (sum, report) => sum + clampInt(report?.demand?.unmet?.imperial, 0),
    0,
  );
  const inclination = clampInt(state.city.militaryMercantile, -2, 2);

  let penalty = 0;
  if (inclination <= -2) penalty = externalUnmet + 2 * populationUnmet;
  else if (inclination === -1) penalty = externalUnmet + populationUnmet;
  else if (inclination === 0) penalty = externalUnmet + imperialUnmet;
  else if (inclination === 1) penalty = Math.ceil(externalUnmet / 2);
  else penalty = Math.floor(externalUnmet / 3);

  const rawScore = 2 * externalServed - penalty;
  const score = Math.max(0, Math.min(V100_CONFIG.institutions.merchantGuildCap, rawScore));
  return {
    score,
    rawScore,
    externalServed,
    externalUnmet,
    populationUnmet,
    imperialUnmet,
    penalty,
    inclination,
  };
}

function scholariumScore(state, summary) {
  const sectors = (state.productionSectors ?? []).filter(sector => sector.id !== "food");
  const cumulativeTierIncreases = sectors.reduce(
    (sum, sector) => sum + Math.max(0, clampInt(sector.tier, 1) - 1),
    0,
  );
  const inclination = clampInt(state.city.religionArcane, -2, 2);
  let permanentBonus = 0;
  if (inclination === -1) permanentBonus = Math.floor(cumulativeTierIncreases / 4);
  else if (inclination <= -2) permanentBonus = Math.floor(cumulativeTierIncreases / 3);

  const breakthroughs = (summary.actions ?? [])
    .filter(action => action.type === "sector_development" && action.tierActivated)
    .map(action => ({
      sectorId: action.sectorId,
      newTier: clampInt(action.newTier, 0),
      bonus: action.newTier >= 3 ? 4 : (action.newTier === 2 ? 2 : 0),
    }));
  const breakthroughBonus = breakthroughs.reduce((sum, item) => sum + item.bonus, 0);

  return {
    score: permanentBonus + breakthroughBonus,
    permanentBonus,
    breakthroughBonus,
    cumulativeTierIncreases,
    breakthroughs,
    inclination,
  };
}

function scoreInstitutions(state, summary) {
  return {
    cityGuard: cityGuardScore(state),
    temple: templeScore(state, summary),
    merchantGuild: merchantGuildScore(state, summary),
    scholarium: scholariumScore(state, summary),
  };
}

function applyInstitutionAwards(state, institutions) {
  const awards = [];
  for (const player of state.players ?? []) {
    ensureInstitutionAgents(player);
    for (const id of INSTITUTION_IDS) {
      const agents = clampInt(player.institutionAgents[id], 0);
      const score = clampInt(institutions[id]?.score, 0);
      const amount = agents * score;
      if (amount <= 0) continue;
      player.prestige += amount;
      awards.push({ playerId: player.id, institutionId: id, agents, institutionScore: score, amount });
    }
  }
  return awards;
}

function chaosPrestigeLosses(state) {
  return (state.players ?? []).map(player => {
    const before = clampInt(player.prestige, 0);
    const requestedLoss = before > 0
      ? Math.ceil(before * V100_CONFIG.chaos.prestigeLossRate)
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
}

function recalculateRenownAfterPopulationCorrection(state, summary) {
  const cap = state.city.population * base.V084_CONFIG.renown.capPerPopulation;
  const before = state.city.renown;
  state.city.renown = Math.min(state.city.renown, cap);
  summary.renownCap = cap;
  summary.renownAfterGrowth = state.city.renown;
  summary.renownLostToChaosPopulationCap = Math.max(0, before - state.city.renown);
}

function resolveOrderAndChaos(state, summary, orderBefore) {
  const unmetPopulationDemand = clampInt(summary.unmetCityDemand, 0);
  const orderLossApplied = unmetPopulationDemand > 0;
  let orderAfterPressure = orderBefore;

  if (orderLossApplied) {
    orderAfterPressure = Math.max(0, orderBefore - V100_CONFIG.order.unmetPopulationDemandLoss);
  } else if (orderBefore < V100_CONFIG.order.equilibrium) {
    orderAfterPressure = Math.min(V100_CONFIG.order.equilibrium, orderBefore + 1);
  }

  let chaos = null;
  let orderAfter = orderAfterPressure;
  if (orderLossApplied && orderAfterPressure === 0) {
    const prestigeLosses = chaosPrestigeLosses(state);
    const populationBeforeChaos = clampInt(state.city.population, 1);
    const suppressedGrowth = Math.max(0, clampInt(summary.growth, 0));
    let correctedPopulation = populationBeforeChaos - suppressedGrowth;
    correctedPopulation = Math.max(
      base.V084_CONFIG.population.minimum,
      correctedPopulation - V100_CONFIG.chaos.populationLoss,
    );
    const actualPopulationLoss = Math.max(0, populationBeforeChaos - suppressedGrowth - correctedPopulation);

    state.city.population = correctedPopulation;
    state.city.imperialIntervention = imperialIntervention(state)
      + V100_CONFIG.chaos.imperialInterventionGain;
    orderAfter = V100_CONFIG.chaos.resetOrderTo;

    summary.growthSuppressedByChaos = suppressedGrowth;
    summary.growthBlockedByChaos = true;
    summary.growth = 0;
    summary.populationBeforeDisease = Math.max(
      base.V084_CONFIG.population.minimum,
      clampInt(summary.populationBeforeDisease, 1) - suppressedGrowth,
    );
    summary.populationAfter = correctedPopulation;
    summary.requiredUrbanTiles = Math.max(
      1,
      Math.ceil(correctedPopulation / base.V084_CONFIG.urban.populationPerTile),
    );
    summary.expansionShortfall = Math.max(
      0,
      summary.requiredUrbanTiles - clampInt(state.city.urbanTiles, 1),
    );
    recalculateRenownAfterPopulationCorrection(state, summary);

    chaos = {
      triggered: true,
      prestigeLossRate: V100_CONFIG.chaos.prestigeLossRate,
      prestigeLosses,
      populationBeforeChaos,
      suppressedGrowth,
      actualPopulationLoss,
      populationAfterChaos: correctedPopulation,
      imperialInterventionGain: V100_CONFIG.chaos.imperialInterventionGain,
      imperialInterventionAfter: state.city.imperialIntervention,
      orderResetTo: orderAfter,
    };
  }

  state.city.order = orderAfter;
  return {
    orderBefore,
    orderLossApplied,
    unmetPopulationDemand,
    orderAfterPressure,
    orderAfter,
    recoveredNaturally: !orderLossApplied && orderAfter > orderBefore,
    chaos,
  };
}

function nextRandom(state) {
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function recomputeFirstPlayer(state) {
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

function civicStateLog(state, orderResult, force, interventionBefore) {
  return {
    type: `CIVIC STATE — Order ${orderResult.orderBefore}→${orderResult.orderAfter} · Force ${force.total} (Structure ${force.structure} + Manpower ${force.manpower}) · Imperial Intervention ${interventionBefore}→${state.city.imperialIntervention}`,
    v100CivicState: true,
  };
}

function chaosLog(orderResult) {
  if (!orderResult.chaos) return null;
  const losses = orderResult.chaos.prestigeLosses
    .map(item => `${item.playerId} −${item.actualLoss}P`)
    .join(" · ");
  return {
    type: `CHAOS — Population −${orderResult.chaos.actualPopulationLoss}; growth blocked; Prestige −20% rounded up (${losses}); Imperial Intervention +1; Order resets to 1`,
    v100Chaos: true,
  };
}

function institutionLog(institutions) {
  return {
    type: `INSTITUTIONS — City Guard ${institutions.cityGuard.score} · Temple ${institutions.temple.score} · Merchant Guild ${institutions.merchantGuild.score} · Scholarium ${institutions.scholarium.score}`,
    v100Institutions: true,
  };
}

export function resolveAutomatedGeneration(state) {
  ensureV100State(state);
  const orderBefore = clampInt(state.city.order, 0, 4);
  const interventionBefore = imperialIntervention(state);
  updateForce(state);

  const restoreDemand = installImperialDemandOverlay(state);
  let summary;
  try {
    summary = base.resolveAutomatedGeneration(state);

    const prestigeImmediatelyAfterBase = Object.fromEntries(
      state.players.map(player => [player.id, player.prestige]),
    );
    const orderResult = resolveOrderAndChaos(state, summary, orderBefore);
    const force = updateForce(state);
    const institutions = scoreInstitutions(state, summary);
    const institutionPrestigeAwards = applyInstitutionAwards(state, institutions);

    const postBasePrestigeChanged = state.players.some(
      player => player.prestige !== prestigeImmediatelyAfterBase[player.id],
    );
    if (postBasePrestigeChanged) {
      const firstPlayerResolution = recomputeFirstPlayer(state);
      summary.firstPlayerResolution = firstPlayerResolution;
      summary.nextFirstPlayerId = firstPlayerResolution.nextFirstPlayerId;
    }

    summary.orderBefore = orderBefore;
    summary.orderAfter = state.city.order;
    summary.orderResolution = orderResult;
    summary.chaos = orderResult.chaos;
    summary.imperialInterventionBefore = interventionBefore;
    summary.imperialInterventionAfter = state.city.imperialIntervention;
    summary.imperialDemandPerSectorNextGeneration = 1 + state.city.imperialIntervention;
    summary.force = force;
    summary.institutionScores = institutions;
    summary.institutionPrestigeAwards = institutionPrestigeAwards;
    summary.prestigeAfter = Object.fromEntries(
      state.players.map(player => [player.id, player.prestige]),
    );

    const extraActions = [civicStateLog(state, orderResult, force, interventionBefore)];
    const chaosAction = chaosLog(orderResult);
    if (chaosAction) extraActions.push(chaosAction);
    extraActions.push(institutionLog(institutions));
    summary.actions = [...(summary.actions ?? []), ...extraActions];

    // Refresh next-Generation demand after any Chaos-driven Intervention increase.
    base.applyAutoDemand(state);
  } finally {
    restoreDemand();
  }

  return summary;
}
