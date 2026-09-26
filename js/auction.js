import { CONFIG } from "./config.js";
import { BALANCE_CONFIG } from "./balance-config.js";
import {
  addProductionStakeForTesting,
  getSectorStakeCapacity,
  getSectorStakeOccupancy,
} from "./engine.js";
import { allocateDemand, getDemandPriorityGroups } from "./economy.js";
import { applyAutoDemand, resolveGeneration } from "./generation.js";

export const AUCTION_CONFIG = {
  grossInfluenceIncome: 5,
  populationPrestigePerNeed: 1,
  valuationLifetimeGenerations: 3,
};

export function getTurnOrder(state) {
  const players = [...state.players];
  if (!players.length) return [];

  if (!state.firstPlayerId || !players.some(player => player.id === state.firstPlayerId)) {
    state.firstPlayerId = players[0].id;
  }

  const firstIndex = players.findIndex(player => player.id === state.firstPlayerId);
  if (firstIndex <= 0) return players;
  return [...players.slice(firstIndex), ...players.slice(0, firstIndex)];
}

/*
 * Locked rule: after all bids and end-of-generation Influence erosion, the
 * Family with the most remaining Influence becomes First Player next
 * Generation.
 *
 * Exact tabletop tie resolution is not yet specified. For deterministic
 * simulation only, a tie is broken by the CURRENT turn order: the earliest
 * tied Family in that order becomes First Player.
 */
export function determineNextFirstPlayer(state) {
  const currentOrder = getTurnOrder(state);
  if (!currentOrder.length) {
    return {
      previousFirstPlayerId: null,
      nextFirstPlayerId: null,
      maxInfluence: 0,
      tiedPlayerIds: [],
      usedPrototypeTieBreak: false,
    };
  }

  const previousFirstPlayerId = state.firstPlayerId;
  const maxInfluence = Math.max(...state.players.map(player => player.influence));
  const tiedPlayerIds = currentOrder
    .filter(player => player.influence === maxInfluence)
    .map(player => player.id);
  const nextFirstPlayerId = tiedPlayerIds[0];

  state.firstPlayerId = nextFirstPlayerId;

  return {
    previousFirstPlayerId,
    nextFirstPlayerId,
    maxInfluence,
    tiedPlayerIds,
    usedPrototypeTieBreak: tiedPlayerIds.length > 1,
  };
}

function sectorResourceCapacity(state, sectorId) {
  const sectorConfig = CONFIG.sectors[sectorId];
  if (!sectorConfig) return 0;
  return state.lands
    .filter(land => land.resourceType === sectorConfig.inputResourceType)
    .reduce((sum, land) => sum + Math.max(0, land.baseCapacity + land.capacityModifier), 0);
}

export function grantGrossInfluenceIncome(state, amount = AUCTION_CONFIG.grossInfluenceIncome) {
  return state.players.map(player => {
    const before = player.influence;
    player.influence = Math.min(player.maxInfluence, player.influence + amount);
    return {
      playerId: player.id,
      before,
      grossIncome: amount,
      actuallyReceived: player.influence - before,
      afterIncome: player.influence,
    };
  });
}

export function estimateNewYoungStakeMarket(state, sectorId) {
  applyAutoDemand(state);
  const sector = state.productionSectors.find(item => item.id === sectorId);
  if (!sector) return null;

  const currentStakes = state.players
    .flatMap(player => player.productionStakes)
    .filter(stake => stake.sectorId === sectorId).length;
  const resourceCapacity = sectorResourceCapacity(state, sectorId);
  const potentialSupply = Math.min(currentStakes + 1, resourceCapacity);
  if (potentialSupply <= currentStakes) return null;

  const priorities = getDemandPriorityGroups(
    state.city.religionArcane,
    state.city.militaryMercantile,
  );
  const allocation = allocateDemand(potentialSupply, sector.demandThisGeneration, priorities);
  return allocation.serviceSequence[currentStakes] ?? null;
}

function categoryReward(category) {
  if (!category) return 0;
  return (BALANCE_CONFIG.wealthPerDemand[category] ?? 0)
    + (category === "population" ? AUCTION_CONFIG.populationPrestigePerNeed : 0);
}

export function automatedBidCap(state, player, sectorId) {
  const expectedCategory = estimateNewYoungStakeMarket(state, sectorId);
  const immediateReward = categoryReward(expectedCategory);
  const strategicValue = Math.max(
    0,
    Math.floor(immediateReward * AUCTION_CONFIG.valuationLifetimeGenerations),
  );
  return {
    expectedCategory,
    immediateReward,
    strategicValue,
    maxBid: Math.min(player.influence, strategicValue),
  };
}

export function runYoungStakeAuction(state, sectorId) {
  const capacity = getSectorStakeCapacity(state, sectorId);
  const occupancy = getSectorStakeOccupancy(state, sectorId);
  if (occupancy.young >= capacity.young) {
    return { sectorId, skipped: true, reason: "Young slot already occupied", turns: [] };
  }

  const turnOrder = getTurnOrder(state);
  const caps = Object.fromEntries(
    state.players.map(player => [player.id, automatedBidCap(state, player, sectorId)]),
  );
  const passed = new Set();
  const turns = [];
  let leaderId = null;
  let currentBid = 0;
  let cursor = 0;
  let guard = 0;

  while (guard++ < 200) {
    const challengers = turnOrder.filter(player => !passed.has(player.id) && player.id !== leaderId);
    if (leaderId && challengers.length === 0) break;
    if (!leaderId && challengers.length === 0) break;

    const player = turnOrder[cursor % turnOrder.length];
    cursor += 1;
    if (passed.has(player.id) || player.id === leaderId) continue;

    const nextBid = currentBid + 1;
    const cap = caps[player.id].maxBid;
    if (nextBid <= cap && nextBid <= player.influence) {
      currentBid = nextBid;
      leaderId = player.id;
      turns.push({ playerId: player.id, action: "bid", bid: currentBid });
    } else {
      passed.add(player.id);
      turns.push({ playerId: player.id, action: "pass", bid: currentBid });
    }
  }

  if (!leaderId || currentBid <= 0) {
    return {
      sectorId,
      skipped: false,
      winnerId: null,
      winningBid: 0,
      expectedCategory: null,
      turnOrder: turnOrder.map(player => player.id),
      caps,
      turns,
    };
  }

  const winner = state.players.find(player => player.id === leaderId);
  winner.influence -= currentBid;
  const stake = addProductionStakeForTesting(state, leaderId, sectorId, "young");

  return {
    sectorId,
    skipped: false,
    winnerId: leaderId,
    winningBid: currentBid,
    stakeId: stake.id,
    expectedCategory: caps[leaderId].expectedCategory,
    turnOrder: turnOrder.map(player => player.id),
    caps,
    turns,
  };
}

export function runAutomatedInvestment(state) {
  applyAutoDemand(state);
  const auctions = [];
  for (const sector of state.productionSectors) {
    const capacity = getSectorStakeCapacity(state, sector.id);
    let occupancy = getSectorStakeOccupancy(state, sector.id);
    let slots = Math.max(0, capacity.young - occupancy.young);
    while (slots-- > 0) {
      auctions.push(runYoungStakeAuction(state, sector.id));
      occupancy = getSectorStakeOccupancy(state, sector.id);
      if (occupancy.young >= capacity.young) break;
      if (!auctions[auctions.length - 1]?.winnerId) break;
    }
  }
  return auctions;
}

export function awardPopulationPrestige(state, economyReports) {
  const awards = [];
  for (const report of economyReports) {
    for (const stake of report.servedStakes ?? []) {
      if (stake.demandCategory !== "population") continue;
      const player = state.players.find(item => item.id === stake.ownerId);
      if (!player) continue;
      player.prestige += AUCTION_CONFIG.populationPrestigePerNeed;
      awards.push({
        playerId: player.id,
        sectorId: report.sectorId,
        stakeId: stake.stakeId,
        amount: AUCTION_CONFIG.populationPrestigePerNeed,
      });
    }
  }
  return awards;
}

export function resolveAutomatedGeneration(state) {
  applyAutoDemand(state);
  const firstPlayerBefore = state.firstPlayerId ?? state.players[0]?.id ?? null;
  if (!state.firstPlayerId && firstPlayerBefore) state.firstPlayerId = firstPlayerBefore;
  const turnOrderBefore = getTurnOrder(state).map(player => player.id);

  const influenceIncome = grantGrossInfluenceIncome(state);
  const auctions = runAutomatedInvestment(state);
  const summary = resolveGeneration(state);
  const populationPrestigeAwards = awardPopulationPrestige(state, summary.economyReports);
  const firstPlayerResolution = determineNextFirstPlayer(state);

  summary.firstPlayerBefore = firstPlayerBefore;
  summary.turnOrderBefore = turnOrderBefore;
  summary.firstPlayerResolution = firstPlayerResolution;
  summary.nextFirstPlayerId = firstPlayerResolution.nextFirstPlayerId;
  summary.influenceIncome = influenceIncome;
  summary.auctions = auctions;
  summary.populationPrestigeAwards = populationPrestigeAwards;
  summary.prestigeAfter = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));
  return summary;
}