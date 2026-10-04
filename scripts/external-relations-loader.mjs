import { pathToFileURL } from 'node:url';

const ROOT = pathToFileURL(`${process.cwd()}/`).href;

function patchEconomy(source) {
  const stakesFilter = `.filter(stake => stake.sectorId === sector.id)`;
  if (!source.includes(stakesFilter)) throw new Error('Could not find production Stake filter in v084 engine');
  source = source.replace(
    stakesFilter,
    `.filter(stake => stake.sectorId === sector.id && !stake.diplomacyInactiveThisGeneration)`,
  );

  const supplyBlock = `const resourceLimitedSupply = Math.min(stakeSupply, totalResourceCapacity);\n    const demand = allocateDemand(resourceLimitedSupply, sector.demandThisGeneration, priorities);`;
  if (!source.includes(supplyBlock)) throw new Error('Could not find resource-limited supply block in v084 engine');
  source = source.replace(
    supplyBlock,
    `const resourceLimitedSupplyBeforeDiplomacy = Math.min(stakeSupply, totalResourceCapacity);\n    const requestedRaidLoss = Math.max(0, Number(state.externalRelations?.transient?.orcRaidSectorLosses?.[sector.id]) || 0);\n    const diplomacyRaidLoss = Math.min(resourceLimitedSupplyBeforeDiplomacy, requestedRaidLoss);\n    const resourceLimitedSupply = Math.max(0, resourceLimitedSupplyBeforeDiplomacy - diplomacyRaidLoss);\n    const demand = allocateDemand(resourceLimitedSupply, sector.demandThisGeneration, priorities);`,
  );

  const reportNeedle = `resourceLimitedSupply,\n      actualProduction: demand.totalServed,`;
  if (!source.includes(reportNeedle)) throw new Error('Could not find economy report supply fields in v084 engine');
  source = source.replace(
    reportNeedle,
    `resourceLimitedSupply,\n      resourceLimitedSupplyBeforeDiplomacy,\n      diplomacyRaidLoss,\n      actualProduction: demand.totalServed,`,
  );

  const farmFunction = /function convertLandToFarm\(state, player, land, auctions, sequence\) \{[\s\S]*?\n\}/;
  const match = source.match(farmFunction);
  if (!match) throw new Error('Could not find convertLandToFarm in v084 engine');
  const original = match[0];
  const replaced = original
    .replace(
      `const { farmInfluenceCost, farmWealthCost } = V084_CONFIG.hinterland;`,
      `const { farmInfluenceCost, farmWealthCost } = V084_CONFIG.hinterland;\n  const elvenDeforestationSurcharge = state.externalRelations?.active\n    && Number(state.externalRelations?.levels?.elves) <= -1\n    && land.originalTerrain === "forest"\n    ? 1\n    : 0;\n  const effectiveFarmInfluenceCost = farmInfluenceCost + elvenDeforestationSurcharge;`,
    )
    .replace(
      `if (!canPayNonBidAction(state, auctions, player, farmInfluenceCost, farmWealthCost)) return null;`,
      `if (!canPayNonBidAction(state, auctions, player, effectiveFarmInfluenceCost, farmWealthCost)) return null;`,
    )
    .replace(`player.influence -= farmInfluenceCost;`, `player.influence -= effectiveFarmInfluenceCost;`)
    .replace(
      `influenceCost: farmInfluenceCost,`,
      `influenceCost: effectiveFarmInfluenceCost,\n    baseInfluenceCost: farmInfluenceCost,\n    elvenDeforestationSurcharge,`,
    );
  if (replaced === original) throw new Error('convertLandToFarm patch produced no change');
  return source.replace(original, replaced);
}

function patchExternalDemand(source) {
  const re = /function applyExternalDemand\(state\) \{[\s\S]*?\n\}/;
  const match = source.match(re);
  if (!match) throw new Error('Could not find applyExternalDemand in v102-base');
  const replacement = `function applyExternalDemand(state) {\n  const baseDemand = externalDemandFromRenown(state?.city?.renown ?? 0);\n  const gnomeSabotage = state?.externalRelations?.active\n    && Number(state?.externalRelations?.levels?.gnomes) <= -1\n    ? 1\n    : 0;\n  const demand = Math.max(0, baseDemand - gnomeSabotage);\n  for (const sector of state?.productionSectors ?? []) {\n    sector.demandThisGeneration ??= {};\n    sector.demandThisGeneration.external_markets = demand;\n  }\n  return demand;\n}`;
  return source.replace(re, replacement);
}

function patchAutomatedFarmCosts(source) {
  const farmCandidateNeedle = `const influenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;\n  const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;\n  if (!canPay(state, player, influenceCost, wealthCost)) return null;\n  const selected = state.lands`;
  if (!source.includes(farmCandidateNeedle)) throw new Error('Could not find farmCandidate cost block in v110 AI engine');
  source = source.replace(
    farmCandidateNeedle,
    `const baseInfluenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;\n  const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;\n  const selected = state.lands`,
  );
  const selectionTail = `.sort((a, b) => a.value - b.value || (a.land.explorationOrder ?? 9999) - (b.land.explorationOrder ?? 9999))[0];\n  if (!selected) return null;\n  const profile = profileFor(state, player);`;
  if (!source.includes(selectionTail)) throw new Error('Could not find farmCandidate selected-land tail in v110 AI engine');
  source = source.replace(
    selectionTail,
    `.sort((a, b) => a.value - b.value || (a.land.explorationOrder ?? 9999) - (b.land.explorationOrder ?? 9999))[0];\n  if (!selected) return null;\n  const elvenDeforestationSurcharge = state.externalRelations?.active\n    && Number(state.externalRelations?.levels?.elves) <= -1\n    && selected.land.originalTerrain === "forest"\n    ? 1\n    : 0;\n  const influenceCost = baseInfluenceCost + elvenDeforestationSurcharge;\n  if (!canPay(state, player, influenceCost, wealthCost)) return null;\n  const profile = profileFor(state, player);`,
  );

  const executeNeedle = `if (candidate.kind === "farm") {\n    const influenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;\n    const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;\n    if (!canPay(state, player, influenceCost, wealthCost)) return null;`;
  if (!source.includes(executeNeedle)) throw new Error('Could not find automated farm execution block in v110 AI engine');
  source = source.replace(
    executeNeedle,
    `if (candidate.kind === "farm") {\n    const baseInfluenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;\n    const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;\n    const elvenDeforestationSurcharge = state.externalRelations?.active\n      && Number(state.externalRelations?.levels?.elves) <= -1\n      && candidate.land.originalTerrain === "forest"\n      ? 1\n      : 0;\n    const influenceCost = baseInfluenceCost + elvenDeforestationSurcharge;\n    if (!canPay(state, player, influenceCost, wealthCost)) return null;`,
  );
  const actionNeedle = `return { sequence, type: "farm_conversion", playerId: player.id, landId: land.id, influenceCost, wealthCost,\n      prestigeAward: V090_CONFIG.civicFarmPrestige, previousResourceType, ownershipTransferredTo: V090_CONFIG.publicFarmOwnerId };`;
  if (!source.includes(actionNeedle)) throw new Error('Could not find automated farm action report in v110 AI engine');
  source = source.replace(
    actionNeedle,
    `return { sequence, type: "farm_conversion", playerId: player.id, landId: land.id, influenceCost, baseInfluenceCost,\n      elvenDeforestationSurcharge, wealthCost, prestigeAward: V090_CONFIG.civicFarmPrestige, previousResourceType,\n      ownershipTransferredTo: V090_CONFIG.publicFarmOwnerId };`,
  );
  return source;
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  let source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  let changed = false;

  if (pathname.endsWith('/js/v084-engine.js')) {
    source = patchEconomy(source);
    changed = true;
  }
  if (pathname.endsWith('/js/v102-base.js')) {
    source = patchExternalDemand(source);
    changed = true;
  }
  if (pathname.endsWith('/js/v110-ai-engine.js')) {
    source = patchAutomatedFarmCosts(source);
    changed = true;
  }

  if (!changed) return result;
  return { ...result, source, shortCircuit: true };
}
