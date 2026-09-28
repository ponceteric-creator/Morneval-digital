import * as base from "./v084-engine.js?base=0.8.4";

export * from "./v084-engine.js?base=0.8.4";

function diseaseChance(squalor) {
  const levels = Object.keys(base.V084_CONFIG.diseaseChanceBySqualor)
    .map(Number)
    .sort((a, b) => a - b);
  let selected = levels[0] ?? 0;
  for (const level of levels) {
    if (squalor >= level) selected = level;
    else break;
  }
  return base.V084_CONFIG.diseaseChanceBySqualor[selected] ?? 0;
}

function restoreBaseExpansion(state, summary) {
  for (const event of summary.expansionEvents ?? []) {
    const land = state.lands.find(item => item.id === event.landId);
    if (!land) continue;

    land.ownerId = event.previousOwnerId ?? null;
    land.development = event.previousDevelopment ?? "natural";
    land.terrain = land.development === "farm"
      ? "farm"
      : (event.originalTerrain ?? land.originalTerrain ?? "unexplored");
    land.resourceType = event.previousResourceType ?? null;
    land.baseCapacity = Math.max(0, Number(event.lostCapacity) || 0);
    land.urbanizedGeneration = null;
    land.formerOwnerId = null;
    land.formerResourceType = null;
    land.formerCapacity = null;
    land.usedCapacityThisGeneration =
      (Number(land.subsistenceUsedThisGeneration) || 0)
      + (Number(land.refinedUsedThisGeneration) || 0);
  }

  state.city.urbanTiles = summary.urbanTilesBefore ?? 1;
  state.city.urbanCapacity = summary.urbanCapacityBefore
    ?? state.city.urbanTiles * base.V084_CONFIG.urban.populationPerTile;
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

function recalculateExpansion(state, summary, finalPopulation) {
  restoreBaseExpansion(state, summary);

  const requiredUrbanTiles = Math.max(
    1,
    Math.ceil(finalPopulation / base.V084_CONFIG.urban.populationPerTile),
  );
  let tilesToAbsorb = Math.max(0, requiredUrbanTiles - state.city.urbanTiles);
  const expansionEvents = [];

  while (tilesToAbsorb > 0) {
    const event = absorbLandIntoCity(state, summary.generation);
    if (!event) break;
    expansionEvents.push(event);
    tilesToAbsorb -= 1;
  }

  state.city.urbanTiles += expansionEvents.length;
  state.city.urbanCapacity = state.city.urbanTiles * base.V084_CONFIG.urban.populationPerTile;

  return {
    requiredUrbanTiles,
    expansionEvents,
    expansionShortfall: Math.max(0, requiredUrbanTiles - state.city.urbanTiles),
  };
}

export function resolveAutomatedGeneration(state) {
  const summary = base.resolveAutomatedGeneration(state);

  const unmetCityDemand = (summary.economyReports ?? []).reduce(
    (sum, report) => sum + Math.max(0, Number(report.demand?.unmet?.population) || 0),
    0,
  );

  // v0.8.6: Squalor has no target and no inertia. It is recalculated directly
  // from this Generation's current urban pressure and unmet City demand.
  const overcrowding = Math.max(
    0,
    summary.populationBefore - summary.urbanCapacityBefore,
  );
  const directSqualor = overcrowding + unmetCityDemand;
  state.city.squalor = directSqualor;

  // Growth is tested against the freshly calculated Squalor of this Generation.
  // Local Food remains mandatory and Imperial Food aid always prevents growth.
  const growthBlockedBySqualor = directSqualor >= summary.populationBefore;
  const growth = summary.imperialFoodAid === 0 && !growthBlockedBySqualor
    ? base.V084_CONFIG.population.growthOnFullLocalFood
    : 0;

  const populationBeforeDisease = Math.max(
    base.V084_CONFIG.population.minimum,
    summary.populationBefore + growth,
  );

  const diseaseProbability = diseaseChance(directSqualor);
  const canLosePopulation = populationBeforeDisease > base.V084_CONFIG.population.minimum;
  const diseaseOccurred = canLosePopulation && summary.diseaseRoll < diseaseProbability;
  const diseaseLoss = diseaseOccurred ? 1 : 0;
  const finalPopulation = Math.max(
    base.V084_CONFIG.population.minimum,
    populationBeforeDisease - diseaseLoss,
  );

  state.city.population = finalPopulation;

  const expansion = recalculateExpansion(state, summary, finalPopulation);

  const renownBeforeGrowth = summary.renownBeforeGrowth;
  const renownGain = summary.renownGain;
  const renownBeforeCap = renownBeforeGrowth + renownGain;
  const renownCap = finalPopulation * base.V084_CONFIG.renown.capPerPopulation;
  state.city.renown = Math.min(renownBeforeCap, renownCap);

  base.applyAutoDemand(state);

  Object.assign(summary, {
    growth,
    growthBlockedBySqualor,
    unmetCityDemand,
    overcrowdingBeforeExpansion: overcrowding,
    directSqualor,
    // Compatibility field for the v0.8.4 history renderer. The UI labels it
    // as a direct calculation in v0.8.6; it is no longer a target.
    squalorTarget: directSqualor,
    squalorAfter: directSqualor,
    populationBeforeDisease,
    populationAfter: finalPopulation,
    diseaseProbability,
    diseaseOccurred,
    diseaseLoss,
    requiredUrbanTiles: expansion.requiredUrbanTiles,
    expansionEvents: expansion.expansionEvents,
    urbanTilesAfter: state.city.urbanTiles,
    urbanCapacityAfter: state.city.urbanCapacity,
    expansionShortfall: expansion.expansionShortfall,
    renownBeforeCap,
    renownCap,
    renownLostToCap: Math.max(0, renownBeforeCap - state.city.renown),
    renownAfterGrowth: state.city.renown,
    rawProductionAfterExpansion: base.getRawProductionBySector(state),
  });

  return summary;
}
