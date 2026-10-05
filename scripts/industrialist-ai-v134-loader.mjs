function replaceFunctionBlock(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing Industrialist patch start: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing Industrialist patch end: ${endMarker}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchIndustrialistActionAI(source) {
  return replaceFunctionBlock(
    source,
    'function chooseNormalCandidate(state, player, farmBuilt) {',
    '\n\nfunction executeNormalCandidate',
    `function chooseNormalCandidate(state, player, farmBuilt) {
  // v0.11.26 simulation profile: the former Dynast is replaced by an
  // Industrialist. This is an AI heuristic only; no player rule changes.
  // Food security remains an emergency override. Otherwise, productive
  // Hinterland acquisition is considered before normal investments. Production
  // Stake auctions are evaluated separately by choosePlayerAction and therefore
  // compete directly with this preferred Hinterland action.
  if (player.aiPersonality === "industrialist") {
    const food = base.getFoodSubsistenceStatus(state);
    const population = Math.max(1, Number(state.city.population) || 1);
    if (food.localCapacity < population) {
      const emergencyFarm = farmCandidate(state, player, farmBuilt);
      if (emergencyFarm && emergencyFarm.score >= V090_CONFIG.actionUtilityFloor) {
        return { ...emergencyFarm, recallAgentIds: [], industrialistPriority: "emergency_food" };
      }
    }

    const explore = explorationCandidate(state, player);
    if (explore && explore.score >= V090_CONFIG.actionUtilityFloor) {
      return { ...explore, recallAgentIds: [], industrialistPriority: "productive_hinterland" };
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

  // Once no productive Hinterland acquisition is available, Stakes should have
  // a genuine first claim on the Industrialist's remaining Influence. Normal
  // long-term investments are intentionally discounted on the shared action
  // utility scale so a rational Stake candidate can beat them. Civic / food /
  // reforestation actions keep their normal utility.
  if (player.aiPersonality === "industrialist" && best) {
    if (best.kind === "development") best = { ...best, score: best.score * 0.35, industrialistPriority: "fallback_development" };
    else if (best.kind === "agent") best = { ...best, score: best.score * 0.45, industrialistPriority: "fallback_agent" };
  }
  return best;
}`,
  );
}

function patchIndustrialistInstitutionAI(source) {
  return replaceFunctionBlock(
    source,
    'function runInstitutionDevelopmentAI(state) {',
    '\n\nfunction applyInfluenceCaps',
    `function industrialistHasPriorityInvestmentV134(state, player) {
  if (player.aiPersonality !== 'industrialist') return false;

  // The Industrialist saves for productive Hinterland instead of spending its
  // current Influence on an Institution merely because the Hinterland purchase
  // is not affordable yet. This is what makes the priority strategic rather
  // than a one-action utility bonus.
  const unexploredLand = (state.lands ?? []).some(land => !land.revealed && !land.ownerId);
  if (unexploredLand) return true;

  // Once the Hinterland pool is exhausted, reserve Institution spending only
  // when there is a real productive Stake gap: a Young slot exists and current
  // Raw capacity + demand can support an additional Stake.
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === 'food') continue;
    const tier = Math.max(1, Math.floor(n(sector.tier) || 1));
    const stakes = (state.players ?? []).flatMap(p => p.productionStakes ?? [])
      .filter(stake => stake.sectorId === sector.id && !stake.diplomacyInactiveThisGeneration);
    const young = stakes.filter(stake => stake.age === 'young').length;
    if (young >= tier) continue;

    const demand = Math.max(0, n(sector.demandThisGeneration?.population))
      + Math.max(0, n(sector.demandThisGeneration?.imperial))
      + Math.max(0, n(sector.demandThisGeneration?.external_markets));
    const rawCapacity = typeof legacy.sectorResourceCapacity === 'function'
      ? Math.max(0, n(legacy.sectorResourceCapacity(state, sector.id)))
      : 0;
    if (Math.min(rawCapacity, demand) > stakes.length) return true;
  }
  return false;
}

function runInstitutionDevelopmentAI(state) {
  ensureInstitutionTierState(state);
  const actions = [];
  const scores = currentInstitutionScores(state);
  for (const player of turnOrder(state)) {
    // Institution development is a simulation pre-action in v121/v122. Without
    // this guard it can consume Influence before the normal action engine has a
    // chance to express the Industrialist's strategy. If a primary economic
    // investment remains, the Industrialist keeps the Influence rather than
    // taking this fallback investment.
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
