function replaceFunctionBlock(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing Industrialist patch start: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing Industrialist patch end: ${endMarker}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchIndustrialistActionAI(source) {
  source = replaceFunctionBlock(
    source,
    'function chooseNormalCandidate(state, player, farmBuilt) {',
    '\n\nfunction executeNormalCandidate',
    `function industrialistCanImproveFoodV134(state, player) {
  const ownsConvertibleLand = state.lands.some(land =>
    land.revealed && land.ownerId === player.id && land.development === "natural");
  const unexploredLand = state.lands.some(land => !land.revealed && !land.ownerId);
  return ownsConvertibleLand || unexploredLand;
}

function industrialistForcedFarmCandidateV134(state, player, farmBuilt) {
  if (V090_CONFIG.civicFarm.onePerGeneration && farmBuilt) return null;
  const influenceCost = base.V084_CONFIG.hinterland.farmInfluenceCost;
  const wealthCost = base.V084_CONFIG.hinterland.farmWealthCost;
  if (!canPay(state, player, influenceCost, wealthCost)) return null;
  const selected = state.lands
    .filter(land => land.revealed && land.ownerId === player.id && land.development === "natural")
    .map(land => ({ land, value: expectedPrivateLandValue(state, player, land) }))
    .sort((a, b) => a.value - b.value
      || (a.land.explorationOrder ?? 9999) - (b.land.explorationOrder ?? 9999))[0];
  if (!selected) return null;
  return {
    kind: "farm",
    score: Math.max(V090_CONFIG.actionUtilityFloor + 1.0, 2.0),
    land: selected.land,
    target: desiredRawFoodCapacity(state),
    industrialistInfrastructureOverride: true,
  };
}

function industrialistNeedsHinterlandV134(state, player) {
  const unexploredLand = state.lands.some(land => !land.revealed && !land.ownerId);
  if (!unexploredLand) return false;

  // One acquisition per Generation is enough to express the strategy while
  // leaving room for Food security, Stakes and civic reactions.
  if (state.__industrialistExplorationGenerationV134?.[player.id] === state.generation) return false;

  const food = base.getFoodSubsistenceStatus(state);
  if (food.localCapacity < desiredRawFoodCapacity(state)) {
    const ownsConvertibleLand = state.lands.some(land =>
      land.revealed && land.ownerId === player.id && land.development === "natural");
    if (!ownsConvertibleLand) return true;
  }

  const ownsProductiveLand = state.lands.some(land =>
    land.revealed
    && land.ownerId === player.id
    && land.development === "natural"
    && ["wool", "ore", "wood"].includes(land.resourceType));
  if (!ownsProductiveLand) return true;

  for (const sector of state.productionSectors) {
    if (sector.id === "food") continue;
    const stakes = state.players.flatMap(p => p.productionStakes ?? [])
      .filter(stake => stake.sectorId === sector.id && !stake.diplomacyInactiveThisGeneration).length;
    const rawCapacity = Math.max(0, base.sectorResourceCapacity(state, sector.id));
    const usefulSupplyTarget = Math.min(demandTotal(sector), stakes + 1);
    if (rawCapacity < usefulSupplyTarget) return true;
  }
  return false;
}

function chooseNormalCandidate(state, player, farmBuilt) {
  if (player.aiPersonality === "industrialist") {
    const food = base.getFoodSubsistenceStatus(state);
    const foodTarget = desiredRawFoodCapacity(state);
    const foodNeedsInvestment = food.localCapacity < foodTarget;

    if (foodNeedsInvestment && !farmBuilt) {
      // The legacy farm heuristic can rationally reject a conversion because a
      // productive private land is valuable. For the Industrialist, however,
      // Food is prerequisite infrastructure: when growth is otherwise blocked,
      // convert the least valuable eligible land even if its private NPV is high.
      const foodFarm = farmCandidate(state, player, farmBuilt)
        ?? industrialistForcedFarmCandidateV134(state, player, farmBuilt);
      if (foodFarm) {
        return { ...foodFarm, score: Math.max(foodFarm.score, V090_CONFIG.actionUtilityFloor + 0.25),
          recallAgentIds: [], industrialistPriority: "food_security" };
      }
      if (industrialistNeedsHinterlandV134(state, player)) {
        const foodExplore = explorationCandidate(state, player);
        if (foodExplore) {
          return { ...foodExplore, recallAgentIds: [], industrialistPriority: "food_hinterland" };
        }
      }
      if (industrialistCanImproveFoodV134(state, player)) return null;
    }

    if (industrialistNeedsHinterlandV134(state, player)) {
      const explore = explorationCandidate(state, player);
      if (explore) {
        return { ...explore, recallAgentIds: [], industrialistPriority: "productive_hinterland" };
      }
      return null;
    }
  }

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
}`,
  );

  const explorationMarker = `candidate.land.ownerId = player.id; candidate.land.explorationOrder = state.nextExplorationOrder;\n    candidate.land.acquisitionOrder = state.nextExplorationOrder; state.nextExplorationOrder += 1;`;
  if (!source.includes(explorationMarker)) {
    throw new Error('Missing Industrialist exploration execution marker');
  }
  source = source.replace(
    explorationMarker,
    `${explorationMarker}\n    if (player.aiPersonality === "industrialist") {\n      state.__industrialistExplorationGenerationV134 ??= {};\n      state.__industrialistExplorationGenerationV134[player.id] = state.generation;\n    }`,
  );

  source = replaceFunctionBlock(
    source,
    'function choosePlayerAction(state, player, context) {',
    '\n\nfunction executePlayerAction',
    `function choosePlayerAction(state, player, context) {
  const candidates = [];
  const normal = chooseNormalCandidate(state, player, context.farmBuilt); if (normal) candidates.push(normal);
  const vote = expansionVoteCandidate(state, player, context); if (vote) candidates.push(vote);
  const productionCandidates = productionBidCandidates(state, player, context);
  candidates.push(...productionCandidates);
  const mercenary = mercenaryBidCandidate(state, player, context); if (mercenary) candidates.push(mercenary);

  let selected = null;
  if (player.aiPersonality === "industrialist") {
    const food = base.getFoodSubsistenceStatus(state);
    const foodNeedsInvestment = food.localCapacity < desiredRawFoodCapacity(state);
    const priority = normal?.industrialistPriority ?? null;

    if (foodNeedsInvestment && !context.farmBuilt && industrialistCanImproveFoodV134(state, player)) {
      selected = ["food_security", "food_hinterland"].includes(priority) ? normal : null;
    } else if (priority === "productive_hinterland") {
      selected = normal;
    } else if (productionCandidates.length) {
      selected = [...productionCandidates].sort((a, b) => b.score - a.score)[0];
    } else {
      selected = [normal, vote, mercenary].filter(Boolean).sort((a, b) => b.score - a.score)[0] ?? null;
    }
  } else {
    selected = candidates.sort((a, b) => b.score - a.score)[0] ?? null;
  }

  if (productionCandidates.length) {
    const diag = ensureStakeAiDiagnostic(state);
    diag.roundsWithProductionCandidate += 1;
    if (selected?.auction?.type === "production_stake") diag.roundsProductionChosen += 1;
    else {
      diag.roundsProductionLostToOtherAction += 1;
      const kind = String(selected?.kind ?? selected?.actionKind ?? selected?.type ?? "none");
      diag.lostToKind[kind] = (diag.lostToKind[kind] ?? 0) + 1;
    }
  }
  return selected;
}`,
  );

  return source;
}

function patchIndustrialistInstitutionAI(source) {
  return replaceFunctionBlock(
    source,
    'function runInstitutionDevelopmentAI(state) {',
    '\n\nfunction applyInfluenceCaps',
    `function industrialistHasPriorityInvestmentV134(state, player) {
  if (player.aiPersonality !== 'industrialist') return false;

  const population = Math.max(1, Math.floor(n(state.city?.population) || 1));
  const food = typeof legacy.getFoodSubsistenceStatus === 'function'
    ? legacy.getFoodSubsistenceStatus(state)
    : { localCapacity: 0 };
  const urbanCapacity = Math.max(population,
    Math.floor(n(state.city?.urbanCapacity)
      || (Math.max(1, Math.floor(n(state.city?.urbanTiles) || 1))
        * Math.max(1, Math.floor(n(legacy.V084_CONFIG?.urban?.populationPerTile) || 3)))));
  const growthPlausible = urbanCapacity > population && n(state.city?.squalor) < population;
  const foodTarget = population + (growthPlausible ? 1 : 0);
  const ownsConvertibleLand = (state.lands ?? []).some(land =>
    land.revealed && land.ownerId === player.id && land.development === 'natural');
  const unexploredLand = (state.lands ?? []).some(land => !land.revealed && !land.ownerId);

  if (n(food.localCapacity) < foodTarget && (ownsConvertibleLand || unexploredLand)) return true;

  const ownsProductiveLand = (state.lands ?? []).some(land =>
    land.revealed && land.ownerId === player.id && land.development === 'natural'
    && ['wool', 'ore', 'wood'].includes(land.resourceType));
  if (unexploredLand && !ownsProductiveLand) return true;

  for (const sector of state.productionSectors ?? []) {
    if (sector.id === 'food') continue;
    const tier = Math.max(1, Math.floor(n(sector.tier) || 1));
    const stakes = (state.players ?? []).flatMap(p => p.productionStakes ?? [])
      .filter(stake => stake.sectorId === sector.id && !stake.diplomacyInactiveThisGeneration);
    const young = stakes.filter(stake => stake.age === 'young').length;
    const demand = Math.max(0, n(sector.demandThisGeneration?.population))
      + Math.max(0, n(sector.demandThisGeneration?.imperial))
      + Math.max(0, n(sector.demandThisGeneration?.external_markets));
    const rawCapacity = typeof legacy.sectorResourceCapacity === 'function'
      ? Math.max(0, n(legacy.sectorResourceCapacity(state, sector.id)))
      : 0;

    if (young < tier && rawCapacity > stakes.length && demand > stakes.length) return true;
    const usefulSupplyTarget = Math.min(demand, stakes.length + 1);
    if (unexploredLand && rawCapacity < usefulSupplyTarget) return true;
  }
  return false;
}

function runInstitutionDevelopmentAI(state) {
  ensureInstitutionTierState(state);
  const actions = [];
  const scores = currentInstitutionScores(state);
  for (const player of turnOrder(state)) {
    if (industrialistHasPriorityInvestmentV134(state, player)) continue;

    let used = 0;
    while (used < MAX_SIM_INSTITUTION_DEVELOPMENTS_PER_FAMILY) {
      const candidates = state.institutions
        .map(inst => institutionDevelopmentCandidate(state, player, inst, scores))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.cost.influenceCost - b.cost.influenceCost);
      const pick = candidates[0];
      if (!pick || pick.score < 2.0) break;
      const action = executeInstitutionDevelopment(state, player, pick);
      if (!action) break;
      actions.push(action);
      used += 1;
    }
  }
  return actions;
}`,
  );
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  const source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);

  if (pathname.endsWith('/js/v110-ai-engine.js')) {
    return { ...result, source: patchIndustrialistActionAI(source), shortCircuit: true };
  }
  if (pathname.endsWith('/js/v121-institution-tier-engine.js')
      || pathname.endsWith('/js/v122-institution-tier-full-engine.js')) {
    return { ...result, source: patchIndustrialistInstitutionAI(source), shortCircuit: true };
  }
  return result;
}
