import * as base from "./v0871-engine.js?base=0.8.7.1";

export * from "./v0871-engine.js?base=0.8.7.1";

export const V088_CONFIG = {
  civicFarmPrestige: 3,
  publicFarmOwnerId: "public",
};

function getPlayer(state, playerId) {
  return state.players.find(player => player.id === playerId) ?? null;
}

function civicFarmActions(summary) {
  const seen = new Set();
  return (summary.actions ?? []).filter(action => {
    if (action.type !== "farm_conversion" || !action.landId || !action.playerId) return false;
    if (seen.has(action.landId)) return false;
    seen.add(action.landId);
    return true;
  });
}

function removeRecurringFarmPrestige(state, summary, action) {
  const matching = (summary.landPrestigeAwards ?? []).filter(award =>
    award.landId === action.landId && award.playerId === action.playerId);
  if (!matching.length) return 0;

  const player = getPlayer(state, action.playerId);
  const amount = matching.reduce((sum, award) => sum + (Number(award.amount) || 0), 0);
  if (player && amount > 0) {
    player.prestige = Math.max(0, player.prestige - amount);
  }
  summary.landPrestigeAwards = (summary.landPrestigeAwards ?? []).filter(award =>
    !(award.landId === action.landId && award.playerId === action.playerId));
  return amount;
}

function makeFarmPublic(state, summary, action) {
  const land = state.lands.find(item => item.id === action.landId);
  if (!land) return null;

  land.publicFarm = true;
  land.civicFarmContributorId = action.playerId;
  land.civicFarmGeneration = summary.generation;

  if (land.development === "farm") {
    land.ownerId = V088_CONFIG.publicFarmOwnerId;
  }

  if (land.development === "urban") {
    land.formerOwnerId = V088_CONFIG.publicFarmOwnerId;
    const expansionEvent = (summary.expansionEvents ?? []).find(event => event.landId === land.id);
    if (expansionEvent) {
      expansionEvent.previousOwnerId = V088_CONFIG.publicFarmOwnerId;
      expansionEvent.civicFarmContributorId = action.playerId;
    }
  }

  return land;
}

export function resolveAutomatedGeneration(state) {
  const summary = base.resolveAutomatedGeneration(state);
  const awards = [];

  for (const action of civicFarmActions(summary)) {
    const suppressedRecurringPrestige = removeRecurringFarmPrestige(state, summary, action);
    const land = makeFarmPublic(state, summary, action);
    const player = getPlayer(state, action.playerId);
    if (!player || !land) continue;

    player.prestige += V088_CONFIG.civicFarmPrestige;
    action.civicFarm = true;
    action.prestigeAward = V088_CONFIG.civicFarmPrestige;
    action.ownershipTransferredTo = V088_CONFIG.publicFarmOwnerId;

    awards.push({
      playerId: player.id,
      landId: land.id,
      amount: V088_CONFIG.civicFarmPrestige,
      suppressedRecurringPrestige,
    });
  }

  summary.civicFarmPrestigeAwards = awards;
  summary.prestigeAfter = Object.fromEntries(
    state.players.map(player => [player.id, player.prestige]),
  );

  return summary;
}
