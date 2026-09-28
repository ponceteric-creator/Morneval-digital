import * as base from "./v088-engine.js?base=0.8.8";

export * from "./v088-engine.js?base=0.8.8";

export const V089_CONFIG = {
  expansionVote: {
    minimumProposalInfluence: 1,
    proposalUtilityThreshold: 0.75,
    influenceThresholds: [1.25, 2.75, 4.5],
  },
};

function getPlayer(state, playerId) {
  return state.players.find(player => player.id === playerId) ?? null;
}

function currentUrbanTiles(state) {
  return Math.max(1, Number(state.city.urbanTiles) || 1);
}

function currentUrbanCapacity(state) {
  return currentUrbanTiles(state) * base.V084_CONFIG.urban.populationPerTile;
}

function chooseExpansionLand(state) {
  return state.lands
    .filter(land => land.revealed && land.development !== "urban")
    .sort((a, b) => (a.explorationOrder ?? 9999) - (b.explorationOrder ?? 9999))[0] ?? null;
}

function rawFoodCapacity(state) {
  return base.getFoodSubsistenceStatus(state).localCapacity;
}

function estimateExpansionUtility(state, player, target) {
  const population = Math.max(1, Number(state.city.population) || 1);
  const capacityBefore = currentUrbanCapacity(state);
  const capacityAfter = capacityBefore + base.V084_CONFIG.urban.populationPerTile;
  const overcrowdingBefore = Math.max(0, population - capacityBefore);
  const overcrowdingAfter = Math.max(0, population - capacityAfter);
  const overcrowdingRelief = overcrowdingBefore - overcrowdingAfter;

  // Shared civic benefit. At exact capacity, extra room enables the next step of
  // population growth; above capacity, relieving actual overcrowding is worth more.
  let utility = overcrowdingRelief * 1.75;
  if (population === capacityBefore) utility += 1.5;
  if (population > capacityBefore) utility += 0.75;

  // Destroying productive Hinterland has a collective opportunity cost even
  // when another Family owns it.
  if (target.development === "natural") {
    utility -= Math.max(0, Number(target.baseCapacity) || 0) * 0.35;
  }

  // A Family strongly dislikes losing its own private production engine.
  if (target.ownerId === player.id) {
    utility -= 2.25 + Math.max(0, Number(target.baseCapacity) || 0) * 0.8;
    if ((Number(target.usedCapacityThisGeneration) || 0) > 0) utility -= 0.75;
  }

  // Public Farms are not private assets, but losing one can immediately force
  // Imperial Food aid and halt growth. Treat that as a strong collective cost.
  if (target.development === "farm") {
    const foodAfter = Math.max(0, rawFoodCapacity(state) - (Number(target.baseCapacity) || 0));
    if (foodAfter < population) {
      utility -= 3 + (population - foodAfter) * 0.75;
    } else if (foodAfter === population) {
      utility -= 1.25;
    }
  }

  return utility;
}

function influenceSpendForUtility(player, utility, isProposer) {
  const intensity = Math.abs(utility);
  let desired = 0;
  for (const threshold of V089_CONFIG.expansionVote.influenceThresholds) {
    if (intensity >= threshold) desired += 1;
  }
  if (isProposer) desired = Math.max(
    V089_CONFIG.expansionVote.minimumProposalInfluence,
    desired,
  );
  return Math.min(Math.max(0, player.influence), desired);
}

function absorbLandForVote(state, target, generation) {
  const event = {
    landId: target.id,
    landName: target.name,
    explorationOrder: target.explorationOrder,
    originalTerrain: target.originalTerrain,
    previousDevelopment: target.development,
    previousOwnerId: target.ownerId,
    previousResourceType: target.resourceType,
    lostCapacity: Math.max(0, Number(target.baseCapacity) || 0),
    viaCivicVote: true,
  };

  target.formerOwnerId = target.ownerId;
  target.formerResourceType = target.resourceType;
  target.formerCapacity = target.baseCapacity;
  target.ownerId = "city";
  target.development = "urban";
  target.terrain = "urban";
  target.resourceType = "urban";
  target.baseCapacity = 0;
  target.usedCapacityThisGeneration = 0;
  target.urbanizedGeneration = generation;

  state.city.urbanTiles = currentUrbanTiles(state) + 1;
  state.city.urbanCapacity = currentUrbanCapacity(state);
  return event;
}

function runExpansionVote(state) {
  const population = Math.max(1, Number(state.city.population) || 1);
  const urbanCapacityBefore = currentUrbanCapacity(state);
  const urbanTilesBefore = currentUrbanTiles(state);
  const target = chooseExpansionLand(state);

  const result = {
    eligible: population >= urbanCapacityBefore && Boolean(target),
    proposed: false,
    passed: false,
    generation: state.generation,
    population,
    urbanTilesBefore,
    urbanCapacityBefore,
    targetLandId: target?.id ?? null,
    targetLandName: target?.name ?? null,
    targetDevelopment: target?.development ?? null,
    targetOwnerId: target?.ownerId ?? null,
    proposerId: null,
    yesVotes: 0,
    noVotes: 0,
    abstentions: 0,
    ballots: [],
    expansionEvent: null,
    reason: null,
  };

  if (!result.eligible) {
    result.reason = target ? "population_below_capacity" : "no_expandable_hinterland";
    return result;
  }

  const evaluations = state.players.map(player => ({
    player,
    utility: estimateExpansionUtility(state, player, target),
  }));
  const proposer = evaluations
    .filter(item => item.player.influence >= V089_CONFIG.expansionVote.minimumProposalInfluence)
    .sort((a, b) => b.utility - a.utility)[0] ?? null;

  if (!proposer || proposer.utility <= V089_CONFIG.expansionVote.proposalUtilityThreshold) {
    result.reason = "no_ai_proposer";
    result.evaluations = evaluations.map(item => ({
      playerId: item.player.id,
      utility: item.utility,
    }));
    return result;
  }

  result.proposed = true;
  result.proposerId = proposer.player.id;

  for (const evaluation of evaluations) {
    const { player, utility } = evaluation;
    let stance = "abstain";
    if (utility > 0.25) stance = "yes";
    else if (utility < -0.25) stance = "no";

    const isProposer = player.id === proposer.player.id;
    if (isProposer) stance = "yes";

    const influenceSpent = stance === "abstain"
      ? 0
      : influenceSpendForUtility(player, utility, isProposer);
    player.influence = Math.max(0, player.influence - influenceSpent);

    const voteStrength = stance === "abstain" ? 0 : 1 + influenceSpent;
    if (stance === "yes") result.yesVotes += voteStrength;
    else if (stance === "no") result.noVotes += voteStrength;
    else result.abstentions += 1;

    result.ballots.push({
      playerId: player.id,
      stance,
      utility,
      baseVote: stance === "abstain" ? 0 : 1,
      influenceSpent,
      voteStrength,
    });
  }

  result.passed = result.yesVotes > result.noVotes;
  result.reason = result.passed ? "approved" : "rejected_or_tied";

  if (result.passed) {
    result.expansionEvent = absorbLandForVote(state, target, state.generation);
  }

  return result;
}

function restoreExpansionEvent(state, event) {
  const land = state.lands.find(item => item.id === event.landId);
  if (!land) return;

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

function suppressAutomaticExpansion(state, summary, urbanTilesAfterVote) {
  const suppressed = [...(summary.expansionEvents ?? [])];
  for (const event of [...suppressed].reverse()) restoreExpansionEvent(state, event);

  state.city.urbanTiles = urbanTilesAfterVote;
  state.city.urbanCapacity = urbanTilesAfterVote * base.V084_CONFIG.urban.populationPerTile;
  return suppressed;
}

function voteLogAction(vote) {
  if (!vote.eligible) {
    return {
      type: `Civic expansion vote — not eligible (${vote.reason})`,
      civicVote: true,
    };
  }
  if (!vote.proposed) {
    return {
      type: "Civic expansion vote — no Family proposed expansion",
      civicVote: true,
    };
  }
  const result = vote.passed ? "PASSED" : "FAILED";
  return {
    type: `Civic expansion vote — YES ${vote.yesVotes} / NO ${vote.noVotes} — ${result}`,
    civicVote: true,
  };
}

export function resolveAutomatedGeneration(state) {
  // Expansion is now a political decision at the beginning of the Generation.
  // Vote Influence is spent before normal actions. The temporary max-Influence
  // reservation below prevents the subsequent gross-income step from erasing
  // that cost merely because a Family was already close to its Influence cap.
  const urbanTilesAtGenerationStart = currentUrbanTiles(state);
  const urbanCapacityAtGenerationStart = currentUrbanCapacity(state);
  const vote = runExpansionVote(state);
  const urbanTilesAfterVote = currentUrbanTiles(state);

  const originalMaxInfluence = Object.fromEntries(
    state.players.map(player => [player.id, player.maxInfluence]),
  );
  for (const ballot of vote.ballots ?? []) {
    const player = getPlayer(state, ballot.playerId);
    if (!player || ballot.influenceSpent <= 0) continue;
    player.maxInfluence = Math.max(
      0,
      (originalMaxInfluence[player.id] ?? player.maxInfluence) - ballot.influenceSpent,
    );
  }

  const summary = base.resolveAutomatedGeneration(state);

  for (const player of state.players) {
    if (originalMaxInfluence[player.id] !== undefined) {
      player.maxInfluence = originalMaxInfluence[player.id];
    }
  }

  // The legacy engine still contains automatic end-of-Generation expansion.
  // Suppress every such expansion so that the single civic vote is the only route.
  const suppressedAutomaticExpansions = suppressAutomaticExpansion(
    state,
    summary,
    urbanTilesAfterVote,
  );

  const requiredUrbanTiles = Math.max(
    1,
    Math.ceil(state.city.population / base.V084_CONFIG.urban.populationPerTile),
  );

  summary.civicExpansionVote = vote;
  summary.suppressedAutomaticExpansions = suppressedAutomaticExpansions;
  summary.urbanTilesBefore = urbanTilesAtGenerationStart;
  summary.urbanCapacityBefore = urbanCapacityAtGenerationStart;
  summary.urbanTilesAfter = state.city.urbanTiles;
  summary.urbanCapacityAfter = state.city.urbanCapacity;
  summary.requiredUrbanTiles = requiredUrbanTiles;
  summary.expansionShortfall = Math.max(0, requiredUrbanTiles - state.city.urbanTiles);
  summary.expansionEvents = vote.passed && vote.expansionEvent
    ? [vote.expansionEvent]
    : [];
  summary.rawProductionAfterExpansion = base.getRawProductionBySector(state);
  summary.actions = [voteLogAction(vote), ...(summary.actions ?? [])];

  return summary;
}
