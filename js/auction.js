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
  prototypeRenownGainEveryGenerations: 2,
  prototypeRenownGainAmount: 1,
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

function nextTieBreakRandom(state) {
  if (!Number.isInteger(state.rngState)) state.rngState = 246813579;
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

/*
 * Locked First Player rule:
 * 1. Most remaining Influence after all spending and end-of-generation erosion.
 * 2. If tied, most Prestige.
 * 3. If still tied, most Wealth generated in that Generation.
 * 4. If still tied, select randomly.
 */
export function determineNextFirstPlayer(state) {
  const currentOrder = getTurnOrder(state);
  if (!currentOrder.length) {
    return {
      previousFirstPlayerId: null,
      nextFirstPlayerId: null,
      maxInfluence: 0,
      influenceTiedPlayerIds: [],
      maxPrestige: null,
      prestigeTiedPlayerIds: [],
      maxWealth: null,
      wealthTiedPlayerIds: [],
      tieBreakMethod: "none",
      randomRoll: null,
    };
  }

  const previousFirstPlayerId = state.firstPlayerId;
  const maxInfluence = Math.max(...state.players.map(player => player.influence));
  let finalists = currentOrder.filter(player => player.influence === maxInfluence);
  const influenceTiedPlayerIds = finalists.map(player => player.id);

  let maxPrestige = null;
  let prestigeTiedPlayerIds = [...influenceTiedPlayerIds];
  let maxWealth = null;
  let wealthTiedPlayerIds = [...influenceTiedPlayerIds];
  let tieBreakMethod = "influence";
  let randomRoll = null;

  if (finalists.length > 1) {
    maxPrestige = Math.max(...finalists.map(player => player.prestige));
    finalists = finalists.filter(player => player.prestige === maxPrestige);
    prestigeTiedPlayerIds = finalists.map(player => player.id);
    tieBreakMethod = "prestige";
  }

  if (finalists.length > 1) {
    maxWealth = Math.max(...finalists.map(player => player.wealthGeneratedThisGeneration));
    finalists = finalists.filter(player => player.wealthGeneratedThisGeneration === maxWealth);
    wealthTiedPlayerIds = finalists.map(player => player.id);
    tieBreakMethod = "wealth";
  }

  if (finalists.length > 1) {
    randomRoll = nextTieBreakRandom(state);
    const index = Math.min(finalists.length - 1, Math.floor(randomRoll * finalists.length));
    finalists = [finalists[index]];
    tieBreakMethod = "random";
  }

  const nextFirstPlayerId = finalists[0].id;
  state.firstPlayerId = nextFirstPlayerId;

  return {
    previousFirstPlayerId,
    nextFirstPlayerId,
    maxInfluence,
    influenceTiedPlayerIds,
    maxPrestige,
    prestigeTiedPlayerIds,
    maxWealth,
    wealthTiedPlayerIds,
    tieBreakMethod,
    randomRoll,
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

export function estimateNewYoungStakeMarket(state, sectorId, additionalPendingSupply = 0) {
  applyAutoDemand(state);
  const sector = state.productionSectors.find(item => item.id === sectorId);
  if (!sector) return null;

  const currentStakes = state.players
    .flatMap(player => player.productionStakes)
    .filter(stake => stake.sectorId === sectorId).length;
  const resourceCapacity = sectorResourceCapacity(state, sectorId);
  const supplyBeforeThisSlot = currentStakes + Math.max(0, additionalPendingSupply);
  const potentialSupply = Math.min(supplyBeforeThisSlot + 1, resourceCapacity);
  if (potentialSupply <= supplyBeforeThisSlot) return null;

  const priorities = getDemandPriorityGroups(
    state.city.religionArcane,
    state.city.militaryMercantile,
  );
  const allocation = allocateDemand(potentialSupply, sector.demandThisGeneration, priorities);
  return allocation.serviceSequence[supplyBeforeThisSlot] ?? null;
}

function categoryReward(category) {
  if (!category) return 0;
  return (BALANCE_CONFIG.wealthPerDemand[category] ?? 0)
    + (category === "population" ? AUCTION_CONFIG.populationPrestigePerNeed : 0);
}

export function automatedBidCap(state, player, sectorId, additionalPendingSupply = 0) {
  const expectedCategory = estimateNewYoungStakeMarket(state, sectorId, additionalPendingSupply);
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

function createAuctionBoard(state) {
  const auctions = [];
  for (const sector of state.productionSectors) {
    const capacity = getSectorStakeCapacity(state, sector.id);
    const occupancy = getSectorStakeOccupancy(state, sector.id);
    const openYoungSlots = Math.max(0, capacity.young - occupancy.young);

    for (let slotIndex = 0; slotIndex < openYoungSlots; slotIndex += 1) {
      const caps = Object.fromEntries(
        state.players.map(player => [
          player.id,
          automatedBidCap(state, player, sector.id, slotIndex),
        ]),
      );
      auctions.push({
        auctionId: `${sector.id}:young:${occupancy.young + slotIndex + 1}`,
        sectorId: sector.id,
        slotNumber: occupancy.young + slotIndex + 1,
        currentBid: 0,
        leaderId: null,
        passedPlayerIds: new Set(),
        closed: false,
        caps,
        turns: [],
      });
    }
  }
  return auctions;
}

function committedInfluence(auctions, playerId, exceptAuctionId = null) {
  return auctions.reduce((sum, auction) => {
    if (auction.auctionId === exceptAuctionId) return sum;
    return auction.leaderId === playerId ? sum + auction.currentBid : sum;
  }, 0);
}

function canAffordBid(state, auctions, player, auction, proposedBid) {
  const committedElsewhere = committedInfluence(auctions, player.id, auction.auctionId);
  return committedElsewhere + proposedBid <= player.influence;
}

function updateAuctionClosedState(state, auction) {
  if (auction.closed) return;
  if (!auction.leaderId) {
    if (auction.passedPlayerIds.size >= state.players.length) auction.closed = true;
    return;
  }

  const challengers = state.players.filter(player =>
    player.id !== auction.leaderId && !auction.passedPlayerIds.has(player.id));
  if (challengers.length === 0) auction.closed = true;
}

function rankOpeningAuctions(player, auctions) {
  return auctions
    .filter(auction =>
      !auction.closed
      && auction.currentBid === 0
      && !auction.passedPlayerIds.has(player.id)
      && auction.caps[player.id].maxBid >= 1)
    .sort((a, b) => {
      const valueDiff = b.caps[player.id].strategicValue - a.caps[player.id].strategicValue;
      if (valueDiff !== 0) return valueDiff;
      return auctions.indexOf(a) - auctions.indexOf(b);
    });
}

function rankRaiseAuctions(state, player, auctions) {
  return auctions
    .filter(auction => {
      if (auction.closed || auction.currentBid <= 0) return false;
      if (auction.leaderId === player.id || auction.passedPlayerIds.has(player.id)) return false;
      const proposedBid = auction.currentBid + 1;
      return proposedBid <= auction.caps[player.id].maxBid
        && canAffordBid(state, auctions, player, auction, proposedBid);
    })
    .sort((a, b) => {
      const aNext = a.currentBid + 1;
      const bNext = b.currentBid + 1;
      const aSurplus = a.caps[player.id].strategicValue - aNext;
      const bSurplus = b.caps[player.id].strategicValue - bNext;
      if (bSurplus !== aSurplus) return bSurplus - aSurplus;
      const valueDiff = b.caps[player.id].strategicValue - a.caps[player.id].strategicValue;
      if (valueDiff !== 0) return valueDiff;
      return auctions.indexOf(a) - auctions.indexOf(b);
    });
}

function choosePassAuction(player, auctions) {
  const eligible = auctions.filter(auction =>
    !auction.closed
    && auction.leaderId !== player.id
    && !auction.passedPlayerIds.has(player.id));
  if (!eligible.length) return null;

  eligible.sort((a, b) => {
    const aRequired = Math.max(1, a.currentBid + 1);
    const bRequired = Math.max(1, b.currentBid + 1);
    const aMargin = a.caps[player.id].strategicValue - aRequired;
    const bMargin = b.caps[player.id].strategicValue - bRequired;
    if (aMargin !== bMargin) return aMargin - bMargin;
    return auctions.indexOf(a) - auctions.indexOf(b);
  });
  return eligible[0];
}

function takeAutomatedAuctionTurn(state, player, auctions, sequence) {
  // Portfolio-first heuristic: claim an untouched slot before escalating an
  // auction somebody else has already opened. This is a simulation strategy,
  // not a locked tabletop rule.
  const openingChoices = rankOpeningAuctions(player, auctions)
    .filter(auction => canAffordBid(state, auctions, player, auction, 1));
  if (openingChoices.length) {
    const auction = openingChoices[0];
    auction.currentBid = 1;
    auction.leaderId = player.id;
    const action = {
      sequence,
      playerId: player.id,
      action: "bid",
      bid: 1,
      openedEmptySlot: true,
    };
    auction.turns.push(action);
    updateAuctionClosedState(state, auction);
    return action;
  }

  const raiseChoices = rankRaiseAuctions(state, player, auctions);
  if (raiseChoices.length) {
    const auction = raiseChoices[0];
    const proposedBid = auction.currentBid + 1;
    auction.currentBid = proposedBid;
    auction.leaderId = player.id;
    const action = {
      sequence,
      playerId: player.id,
      action: "bid",
      bid: proposedBid,
      openedEmptySlot: false,
    };
    auction.turns.push(action);
    updateAuctionClosedState(state, auction);
    return action;
  }

  const passAuction = choosePassAuction(player, auctions);
  if (passAuction) {
    passAuction.passedPlayerIds.add(player.id);
    const action = {
      sequence,
      playerId: player.id,
      action: "pass",
      bid: passAuction.currentBid,
    };
    passAuction.turns.push(action);
    updateAuctionClosedState(state, passAuction);
    return action;
  }

  return null;
}

export function runAutomatedInvestment(state) {
  applyAutoDemand(state);
  const turnOrder = getTurnOrder(state);
  const auctions = createAuctionBoard(state);
  if (!auctions.length) return [];

  let cursor = 0;
  let sequence = 1;
  let guard = 0;

  while (auctions.some(auction => !auction.closed) && guard++ < 2000) {
    const player = turnOrder[cursor % turnOrder.length];
    cursor += 1;
    takeAutomatedAuctionTurn(state, player, auctions, sequence++);
  }

  for (const auction of auctions) updateAuctionClosedState(state, auction);

  const results = [];
  for (const auction of auctions) {
    let winnerId = null;
    let winningBid = 0;
    let stakeId = null;
    let expectedCategory = null;

    if (auction.leaderId && auction.currentBid > 0) {
      const winner = state.players.find(player => player.id === auction.leaderId);
      winningBid = auction.currentBid;
      winner.influence -= winningBid;
      const stake = addProductionStakeForTesting(state, winner.id, auction.sectorId, "young");
      winnerId = winner.id;
      stakeId = stake.id;
      expectedCategory = auction.caps[winner.id].expectedCategory;
    }

    results.push({
      auctionId: auction.auctionId,
      sectorId: auction.sectorId,
      slotNumber: auction.slotNumber,
      skipped: false,
      winnerId,
      winningBid,
      stakeId,
      expectedCategory,
      turnOrder: turnOrder.map(player => player.id),
      caps: auction.caps,
      turns: auction.turns,
      passedPlayerIds: [...auction.passedPlayerIds],
      closed: auction.closed,
    });
  }

  return results;
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

  const renownBeforeGrowth = Math.max(0, Number(state.city.renown) || 0);
  const shouldGainRenown = summary.generation % AUCTION_CONFIG.prototypeRenownGainEveryGenerations === 0;
  const renownGain = shouldGainRenown ? AUCTION_CONFIG.prototypeRenownGainAmount : 0;
  if (renownGain > 0) state.city.renown = renownBeforeGrowth + renownGain;
  applyAutoDemand(state);

  const firstPlayerResolution = determineNextFirstPlayer(state);

  summary.firstPlayerBefore = firstPlayerBefore;
  summary.turnOrderBefore = turnOrderBefore;
  summary.firstPlayerResolution = firstPlayerResolution;
  summary.nextFirstPlayerId = firstPlayerResolution.nextFirstPlayerId;
  summary.influenceIncome = influenceIncome;
  summary.auctions = auctions;
  summary.populationPrestigeAwards = populationPrestigeAwards;
  summary.renownBeforeGrowth = renownBeforeGrowth;
  summary.renownGain = renownGain;
  summary.renownAfterGrowth = state.city.renown;
  summary.prestigeAfter = Object.fromEntries(state.players.map(player => [player.id, player.prestige]));
  return summary;
}
