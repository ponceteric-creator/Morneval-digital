function patchRawFoodConsumption(source) {
  const needle = 'rawFoodPerPopulation: 1,';
  if (!source.includes(needle)) throw new Error('Could not find rawFoodPerPopulation in v084 engine');
  return source.replace(needle, 'rawFoodPerPopulation: 2,');
}

function patchPermanentPoliticalRenown(source) {
  const cardNeedle = '  const permanentCardRenown = permanentWealthCardRenown(state);\n  const total = populationRenown\n    + productionRenown\n    + institutionRenown\n    + permanentCardRenown;';
  if (!source.includes(cardNeedle)) throw new Error('Could not find structural Renown total in v102-base');
  source = source.replace(
    cardNeedle,
    '  const permanentCardRenown = permanentWealthCardRenown(state);\n'
      + '  const permanentPoliticalRenown = Math.max(0, clampInt(state?.city?.permanentPoliticalRenown ?? 0));\n'
      + '  const total = populationRenown\n'
      + '    + productionRenown\n'
      + '    + institutionRenown\n'
      + '    + permanentCardRenown\n'
      + '    + permanentPoliticalRenown;',
  );
  const returnNeedle = '    permanentCardRenown,\n    simulationLongevityRenown: 0,';
  if (!source.includes(returnNeedle)) throw new Error('Could not find Renown breakdown return in v102-base');
  return source.replace(
    returnNeedle,
    '    permanentCardRenown,\n    permanentPoliticalRenown,\n    simulationLongevityRenown: 0,',
  );
}

function patchPopulationCapacityForceAndFoodAI(source) {
  const capacityNeedle = 'function currentUrbanCapacity(state) {\n  return currentUrbanTiles(state) * base.V084_CONFIG.urban.populationPerTile;\n}';
  if (!source.includes(capacityNeedle)) throw new Error('Could not find currentUrbanCapacity in v110 AI engine');
  source = source.replace(
    capacityNeedle,
    'function currentUrbanCapacity(state) {\n'
      + '  const urban = currentUrbanTiles(state) * base.V084_CONFIG.urban.populationPerTile;\n'
      + '  const forestCapacity = Math.max(0, Math.floor(Number(state.city?.elvenPopulationCapacityBonus) || 0));\n'
      + '  return urban + forestCapacity;\n'
      + '}',
  );

  const foodNeedle = 'function desiredRawFoodCapacity(state) {\n  const population = Math.max(1, Number(state.city.population) || 1);\n  const currentFood = base.getFoodSubsistenceStatus(state).localCapacity;\n  const growthPlausible = currentFood >= population && currentUrbanCapacity(state) > population && state.city.squalor < population;\n  return population + (growthPlausible ? 1 : 0);\n}';
  if (!source.includes(foodNeedle)) throw new Error('Could not find desiredRawFoodCapacity in v110 AI engine');
  source = source.replace(
    foodNeedle,
    'function desiredRawFoodCapacity(state) {\n'
      + '  const population = Math.max(1, Number(state.city.population) || 1);\n'
      + '  const foodPerPopulation = Math.max(1, Number(base.V084_CONFIG?.population?.rawFoodPerPopulation) || 1);\n'
      + '  const currentFood = base.getFoodSubsistenceStatus(state).localCapacity;\n'
      + '  const currentNeed = population * foodPerPopulation;\n'
      + '  const growthPlausible = currentFood >= currentNeed && currentUrbanCapacity(state) > population && state.city.squalor < population;\n'
      + '  return currentNeed + (growthPlausible ? foodPerPopulation : 0);\n'
      + '}',
  );

  const forceNeedle = '  state.city.forceStructure = structure;\n  state.city.forceManpower = manpower;\n  state.city.force = structure + manpower;\n  return state.city.force;';
  if (!source.includes(forceNeedle)) throw new Error('Could not find currentForce total in v110 AI engine');
  return source.replace(
    forceNeedle,
    '  const elvenAllianceForce = Math.max(0, Math.floor(Number(state.city?.elvenAllianceForceBonus) || 0));\n'
      + '  state.city.forceStructure = structure;\n'
      + '  state.city.forceManpower = manpower;\n'
      + '  state.city.forceElvenAlliance = elvenAllianceForce;\n'
      + '  state.city.force = structure + manpower + elvenAllianceForce;\n'
      + '  return state.city.force;',
  );
}

function patchExternalRelationLandEffects(source) {
  const gnomeNeedle = '    if (rel.levels.gnomes >= 2 && land.gnomeImproved) delta += 1;';
  if (!source.includes(gnomeNeedle)) throw new Error('Could not find Gnome improved-land bonus in v128');
  source = source.replace(
    gnomeNeedle,
    '    if (land.gnomeImproved || land.gnomeImprovementPermanent) delta += 1;\n'
      + '    if (rel.levels.gnomes >= 2 && (land.gnomeImproved || land.gnomeImprovementPermanent)) delta += 1;',
  );

  const elfFoodNeedle = "      synthetic.push(makeSyntheticLand(state, `elf_food_${forest.id}`, 'farm', 'grain', 1));";
  if (!source.includes(elfFoodNeedle)) throw new Error('Could not find Elven forest food in v128');
  return source.replace(
    elfFoodNeedle,
    "      synthetic.push(makeSyntheticLand(state, `elf_food_${forest.id}`, 'farm', 'grain', rel.levels.elves >= 3 ? 2 : 1));",
  );
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  let source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  let changed = false;

  if (pathname.endsWith('/js/v084-engine.js')) {
    source = patchRawFoodConsumption(source);
    changed = true;
  }
  if (pathname.endsWith('/js/v102-base.js')) {
    source = patchPermanentPoliticalRenown(source);
    changed = true;
  }
  if (pathname.endsWith('/js/v110-ai-engine.js')) {
    source = patchPopulationCapacityForceAndFoodAI(source);
    changed = true;
  }
  if (pathname.endsWith('/js/v128-external-relations-engine.js')) {
    source = patchExternalRelationLandEffects(source);
    changed = true;
  }

  if (!changed) return result;
  return { ...result, source, shortCircuit: true };
}
