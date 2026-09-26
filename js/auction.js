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
    const challengers = state.players.filter(player => !passed.has(player.id) && player.id !== leaderId);
    if (leaderId && challengers.length === 0) break;
    if (!leaderId && challengers.length === 0) break;

    const player = state.players[cursor % state.players.length];
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
  const influenceIncome = grantGrossInfluenceIncome(state);
  const auctions = runAutomatedInvestment(state);
  const summary = resolveGeneration(state);
  const populationPrestigeAwards = awardPopulationPrestige(state, summary.economyReports);

  summary.influenceIncome = influenceIncome;
  summary.auctions = auctions;
  summary.populationPrestigeAwards = populationPrestigeAwards;
  summary.prestigeAfter = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));
  return summary;
}
