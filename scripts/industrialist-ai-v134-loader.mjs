function replaceFunctionBlock(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing Industrialist patch start: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing Industrialist patch end: ${endMarker}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchIndustrialistAI(source) {
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

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('/js/v110-ai-engine.js')) return result;
  const source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  return { ...result, source: patchIndustrialistAI(source), shortCircuit: true };
}
