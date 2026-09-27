import "./v082-balance-patch.js";
import {
  V08_CONFIG,
  createV08Game,
  applyAutoDemand,
  resolveAutomatedGeneration,
  sectorResourceCapacity,
} from "./v08-engine.js";

export const V083_CONFIG = {
  populationPerUrbanTile: 3,
  renownPerPopulation: 2,
  foodShortageSqualorPenalty: 1,
  squalorMaxChangePerGeneration: 1,
};

function moveToward(current, target, maxStep) {
  if (current === target) return current;
  return current < target
    ? Math.min(target, current + maxStep)
    : Math.max(target, current - maxStep);
}

function diseaseChanceForSqualor(squalor) {
  const table = V08_CONFIG.diseaseChanceBySqualor;
  const levels = Object.keys(table).map(Number).sort((a, b) => a - b);
  let selected = levels[0] ?? 0;
  for (const level of levels) {
    if (squalor >= level) selected = level;
    else break;
  }
  return table[selected] ?? 0;
}

function nextRandom(state) {
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function chooseExpansionLand(state) {
  const available = state.lands.filter(land => land.development !== "urban");
  if (!available.length) return null;

  const unowned = available.filter(land => !land.ownerId);
  const pool = unowned.length ? unowned : available;
  const roll = nextRandom(state);
  const index = Math.min(pool.length - 1, Math.floor(roll * pool.length));
  return { land: pool[index], roll, usedUnownedPriority: unowned.length > 0 };
}

function absorbLandIntoCity(state, generation) {
  const choice = chooseExpansionLand(state);
  if (!choice) return null;

  const { land, roll, usedUnownedPriority } = choice;
  const event = {
    landId: land.id,
    landName: land.name,
    originalTerrain: land.originalTerrain,
    previousDevelopment: land.development,
    previousOwnerId: land.ownerId,
    previousResourceType: land.resourceType,
    lostCapacity: Math.max(0, Number(land.baseCapacity) || 0),
    randomRoll: roll,
    usedUnownedPriority,
  };

  land.formerOwnerId = land.ownerId;
  land.formerResourceType = land.resourceType;
  land.formerCapacity = Math.max(0, Number(land.baseCapacity) || 0);
  land.ownerId = "city";
  land.development = "urban";
  land.terrain = "urban";
  land.resourceType = "urban";
  land.baseCapacity = 0;
  land.usedCapacityThisGeneration = 0;
  land.urbanizedGeneration = generation;

  return event;
}

function rawPotentialCapacity(state, resourceType) {
  const cityBase = V08_CONFIG.cityBaseResourceCapacity[resourceType] ?? 0;
  const hinterlandPotential = state.lands
    .filter(land => land.development !== "urban" && land.resourceType === resourceType)
    .reduce((sum, land) => sum + Math.max(0, Number(land.baseCapacity) || 0), 0);
  return cityBase + hinterlandPotential;
}

export function createV083Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = createV08Game(familyNames);
  state.institutions = [];
  state.city.urbanTiles = 1;
  state.city.urbanCapacity = V083_CONFIG.populationPerUrbanTile;
  applyAutoDemand(state);
  return state;
}

export function getUrbanStatus(state) {
  const urbanTiles = Math.max(1, Number(state.city.urbanTiles) || 1);
  const urbanCapacity = urbanTiles * V083_CONFIG.populationPerUrbanTile;
  const population = Math.max(0, Number(state.city.population) || 0);
  return {
    urbanTiles,
    urbanCapacity,
    population,
    overcrowding: Math.max(0, population - urbanCapacity),
    requiredUrbanTiles: Math.max(1, Math.ceil(population / V083_CONFIG.populationPerUrbanTile)),
  };
}

export function getRawPotentialBySector(state) {
  return Object.fromEntries(
    state.productionSectors.map(sector => [
      sector.id,
      rawPotentialCapacity(state, sector.inputResourceType),
    ]),
  );
}

export function resolveAutomatedGenerationV083(state) {
  const urbanBefore = getUrbanStatus(state);
  const summary = resolveAutomatedGeneration(state);

  // Re-resolve Squalor and disease using the v0.8.3 overcrowding model. The
  // base engine's already-generated disease roll is deliberately reused so the
  // simulation remains deterministic rather than rolling disease twice.
  const populationBeforeDisease = Math.max(
    0,
    summary.populationBefore + summary.growth - summary.famineLoss,
  );
  const overcrowdingBeforeExpansion = Math.max(
    0,
    populationBeforeDisease - urbanBefore.urbanCapacity,
  );
  const foodShortagePenalty = summary.foodUnmet > 0
    ? V083_CONFIG.foodShortageSqualorPenalty
    : 0;
  const squalorTarget = overcrowdingBeforeExpansion + foodShortagePenalty;
  const squalorAfter = moveToward(
    summary.squalorBefore,
    squalorTarget,
    V083_CONFIG.squalorMaxChangePerGeneration,
  );
  const diseaseProbability = diseaseChanceForSqualor(squalorAfter);
  const diseaseOccurred = populationBeforeDisease > 0
    && summary.diseaseRoll < diseaseProbability;
  const diseaseLoss = diseaseOccurred ? Math.min(1, populationBeforeDisease) : 0;
  const finalPopulation = Math.max(0, populationBeforeDisease - diseaseLoss);

  state.city.squalor = squalorAfter;
  state.city.population = finalPopulation;

  // Expansion happens only after final Population is known. The central City
  // supports Population 1-3. Each additional permanent Urban tile supports +3.
  const requiredUrbanTiles = Math.max(
    1,
    Math.ceil(finalPopulation / V083_CONFIG.populationPerUrbanTile),
  );
  let tilesToAbsorb = Math.max(0, requiredUrbanTiles - urbanBefore.urbanTiles);
  const expansionEvents = [];
  while (tilesToAbsorb > 0) {
    const event = absorbLandIntoCity(state, summary.generation);
    if (!event) break;
    expansionEvents.push(event);
    tilesToAbsorb -= 1;
  }

  state.city.urbanTiles = urbanBefore.urbanTiles + expansionEvents.length;
  state.city.urbanCapacity = state.city.urbanTiles * V083_CONFIG.populationPerUrbanTile;

  // Renown remains event-driven in the final design. Until Events are active,
  // the existing +1 every two Generations remains, but sustainable Renown is
  // capped at twice final Population.
  const renownBeforeCap = Math.max(0, Number(state.city.renown) || 0);
  const renownCap = finalPopulation * V083_CONFIG.renownPerPopulation;
  state.city.renown = Math.min(renownBeforeCap, renownCap);
  const renownLostToCap = renownBeforeCap - state.city.renown;

  applyAutoDemand(state);

  const rawUsableCapacityAfterExpansion = Object.fromEntries(
    state.productionSectors.map(sector => [
      sector.id,
      sectorResourceCapacity(state, sector.id),
    ]),
  );
  const rawPotentialAfterExpansion = getRawPotentialBySector(state);

  Object.assign(summary, {
    populationBeforeDisease,
    populationAfter: finalPopulation,
    overcrowdingBeforeExpansion,
    foodShortageSqualorPenalty: foodShortagePenalty,
    squalorTarget,
    squalorAfter,
    diseaseProbability,
    diseaseOccurred,
    diseaseLoss,
    urbanTilesBefore: urbanBefore.urbanTiles,
    urbanCapacityBefore: urbanBefore.urbanCapacity,
    requiredUrbanTiles,
    expansionEvents,
    urbanTilesAfter: state.city.urbanTiles,
    urbanCapacityAfter: state.city.urbanCapacity,
    expansionShortfall: Math.max(0, requiredUrbanTiles - state.city.urbanTiles),
    renownBeforeCap,
    renownCap,
    renownLostToCap,
    renownAfterGrowth: state.city.renown,
    rawUsableCapacityAfterExpansion,
    rawPotentialAfterExpansion,
  });

  return summary;
}
