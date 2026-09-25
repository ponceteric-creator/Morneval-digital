import { BALANCE_CONFIG } from "./balance-config.js";
import { resolveAllSectorEconomies } from "./economy.js";
import { ageProductionStakes, erodeInfluence } from "./engine.js";

function ensureState(state) {
  if (typeof state.autoPopulationDemand !== "boolean") state.autoPopulationDemand = true;
  if (typeof state.autoInstitutionDemand !== "boolean") state.autoInstitutionDemand = true;
  if (typeof state.autoExternalDemand !== "boolean") state.autoExternalDemand = true;
  if (!Number.isInteger(state.rngState)) state.rngState = 246813579;
  if (!Array.isArray(state.history)) state.history = [];
  if (!Array.isArray(state.institutions)) state.institutions = [];
}

export function totalInstitutionLevels(state) {
  ensureState(state);
  return state.institutions.reduce((sum, institution) => sum + Math.max(0, Number(institution.level) || 0), 0);
}

export function institutionPopulationCap(state) {
  return Math.max(0, Math.floor(Number(state.city.population) || 0));
}

export function institutionCapacityStatus(state) {
  const total = totalInstitutionLevels(state);
  const cap = institutionPopulationCap(state);
  return { total, cap, overCap: total > cap };
}

export function setInstitutionLevel(state, institutionId, requestedLevel) {
  ensureState(state);
  const institution = state.institutions.find(item => item.id === institutionId);
  if (!institution) throw new Error(`Unknown Institution: ${institutionId}`);

  const otherLevels = state.institutions
    .filter(item => item.id !== institutionId)
    .reduce((sum, item) => sum + Math.max(0, Number(item.level) || 0), 0);
  const maxAllowed = Math.max(0, institutionPopulationCap(state) - otherLevels);
  const desired = Math.max(0, Math.floor(Number(requestedLevel) || 0));

  if (desired > maxAllowed) {
    throw new Error(`Institution development cap exceeded. With Population ${institutionPopulationCap(state)}, this Institution can be at most level ${maxAllowed} right now.`);
  }
  institution.level = desired;
  return institution;
}

export function applyAutoPopulationDemand(state) {
  ensureState(state);
  if (!state.autoPopulationDemand) return;
  for (const sector of state.productionSectors) {
    const divisor = BALANCE_CONFIG.populationDemandDivisors[sector.id];
    if (!divisor) continue;
    sector.demandThisGeneration.population = state.city.population <= 0
      ? 0
      : Math.ceil(state.city.population / divisor);
  }
}

export function applyAutoInstitutionDemand(state) {
  ensureState(state);
  if (!state.autoInstitutionDemand) return;
  const levels = totalInstitutionLevels(state);
  for (const sector of state.productionSectors) {
    const divisor = BALANCE_CONFIG.institutionDemandDivisors[sector.id];
    if (!divisor) continue;
    sector.demandThisGeneration.institutions = levels <= 0 ? 0 : Math.ceil(levels / divisor);
  }
}

export function applyAutoExternalDemand(state) {
  ensureState(state);
  if (!state.autoExternalDemand) return;
  const renown = Math.max(0, Number(state.city.renown) || 0);
  for (const sector of state.productionSectors) {
    const divisor = BALANCE_CONFIG.externalDemandDivisors[sector.id];
    if (!divisor) continue;
    sector.demandThisGeneration.external_markets = renown <= 0 ? 0 : Math.ceil(renown / divisor);
  }
}

export function applyAutoDemand(state) {
  applyAutoPopulationDemand(state);
  applyAutoInstitutionDemand(state);
  applyAutoExternalDemand(state);
}

function diseaseChanceForSqualor(squalor) {
  const table = BALANCE_CONFIG.disease.chanceBySqualor;
  const levels = Object.keys(table).map(Number).sort((a, b) => a - b);
  let selected = levels[0] ?? 0;
  for (const level of levels) {
    if (squalor >= level) selected = level;
    else break;
  }
  return table[selected] ?? 0;
}

function nextRandom(state) {
  ensureState(state);
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function moveToward(current, target, maxStep) {
  if (current === target) return current;
  return current < target
    ? Math.min(target, current + maxStep)
    : Math.max(target, current - maxStep);
}

export function normalizeActualResourceUsage(state, economyReports) {
  for (const land of state.lands) land.usedCapacityThisGeneration = 0;

  for (const report of economyReports) {
    let remaining = report.demand.totalServed;
    for (const resource of report.rawResourcesUsed) {
      const land = state.lands.find(item => item.id === resource.landId);
      const available = Math.max(0, resource.availableCapacity);
      const used = Math.min(available, remaining);
      remaining -= used;
      resource.usedCapacity = used;
      if (land) land.usedCapacityThisGeneration = used;
    }
  }
  return economyReports;
}

export function calculateProductiveLandPrestige(state, economyReports = null) {
  const reports = economyReports ?? normalizeActualResourceUsage(state, resolveAllSectorEconomies(state));
  if (economyReports) normalizeActualResourceUsage(state, reports);

  const awards = [];
  for (const land of state.lands) {
    if (land.usedCapacityThisGeneration <= 0) continue;
    const stake = state.players
      .flatMap(player => player.resourceStakes)
      .find(item => item.landId === land.id);
    if (!stake) continue;
    awards.push({
      playerId: stake.ownerId,
      landId: land.id,
      landName: land.name,
      amount: BALANCE_CONFIG.rawResourcePrestigePerUsedLand,
    });
  }
  return awards;
}

export function resolveGeneration(state) {
  ensureState(state);
  applyAutoDemand(state);

  const generationNumber = state.generation;
  const populationBefore = state.city.population;
  const squalorBefore = state.city.squalor;
  const institutionStatusBefore = institutionCapacityStatus(state);
  const renown = state.city.renown;
  const influenceBefore = Object.fromEntries(state.players.map(p => [p.id, p.influence]));
  const prestigeBefore = Object.fromEntries(state.players.map(p => [p.id, p.prestige]));

  state.phase = "production_resolution";
  const economyReports = resolveAllSectorEconomies(state);
  normalizeActualResourceUsage(state, economyReports);

  const landPrestigeAwards = calculateProductiveLandPrestige(state, economyReports);
  for (const award of landPrestigeAwards) {
    const player = state.players.find(p => p.id === award.playerId);
    if (player) player.prestige += award.amount;
  }

  const food = economyReports.find(report => report.sectorId === "food");
  const foodRequested = food?.demand.requested.population ?? 0;
  const foodServed = food?.demand.served.population ?? 0;
  const foodUnmet = Math.max(0, foodRequested - foodServed);

  let growth = 0;
  let famineLoss = 0;
  if (populationBefore > 0 && foodRequested > 0 && foodUnmet === 0) {
    growth = BALANCE_CONFIG.population.growthOnFullFood;
  } else if (foodUnmet > 0) {
    famineLoss = BALANCE_CONFIG.population.famineLossWhenFoodUnmet;
  }

  state.phase = "population_resolution";
  state.city.population = Math.max(
    BALANCE_CONFIG.population.minimumPopulation,
    populationBefore + growth - famineLoss,
  );

  const baseSqualorTarget = state.city.population <= 0
    ? 0
    : Math.ceil(state.city.population / BALANCE_CONFIG.squalor.populationPerPoint);
  const squalorTarget = Math.max(
    0,
    baseSqualorTarget + (foodUnmet > 0 ? BALANCE_CONFIG.squalor.unmetFoodPenalty : 0),
  );
  state.city.squalor = moveToward(
    state.city.squalor,
    squalorTarget,
    BALANCE_CONFIG.squalor.maxChangePerGeneration,
  );

  state.phase = "city_upkeep";
  const diseaseChance = diseaseChanceForSqualor(state.city.squalor);
  const diseaseRoll = nextRandom(state);
  const diseaseOccurred = state.city.population > 0 && diseaseRoll < diseaseChance;
  const diseaseLoss = diseaseOccurred
    ? Math.min(BALANCE_CONFIG.disease.populationLoss, state.city.population)
    : 0;
  if (diseaseLoss > 0) {
    state.city.population = Math.max(
      BALANCE_CONFIG.population.minimumPopulation,
      state.city.population - diseaseLoss,
    );
  }

  state.phase = "influence_erosion";
  erodeInfluence(state);

  state.phase = "stake_aging";
  ageProductionStakes(state);

  const institutionStatusAfter = institutionCapacityStatus(state);
  const wealthAfter = Object.fromEntries(state.players.map(p => [p.id, p.wealthGeneratedThisGeneration]));

  const summary = {
    generation: generationNumber,
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
    diseaseChance,
    diseaseRoll,
    diseaseOccurred,
    diseaseLoss,
    institutionStatusBefore,
    institutionStatusAfter,
    renown,
    landPrestigeAwards,
    wealthAfter,
    influenceBefore,
    influenceAfter: Object.fromEntries(state.players.map(p => [p.id, p.influence])),
    prestigeBefore,
    prestigeAfter: Object.fromEntries(state.players.map(p => [p.id, p.prestige])),
    economyReports,
  };

  state.history.push(summary);
  state.generation += 1;
  state.phase = "action_phase";
  applyAutoDemand(state);
  return summary;
}
