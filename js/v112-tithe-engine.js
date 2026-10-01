import * as legacy from "./v110-engine.js?real=0.11.0-v112-tithe";
import * as ai from "./v111-ai-engine.js?direct=0.11.1-v112-tithe";
import * as economy from "./v089-engine.js?base=0.8.9";

export * from "./v110-engine.js?real=0.11.0-v112-tithe";
export const V084_CONFIG = economy.V084_CONFIG;

export const V100_CONFIG = {
  ...legacy.V100_CONFIG,
  influence: {
    ...legacy.V100_CONFIG.influence,
    softCapThresholdDefault: 15,
  },
  agents: {
    ...legacy.V100_CONFIG.agents,
    wealthCommitment: 1,
  },
};

const TITHE_RULES = {
  maintenanceBid: 1,
  activationThreshold: 2,
  transfer: 1,
};

const TITHE_SECTORS = [
  { sectorId: "textiles", label: "Textile Tithe" },
  { sectorId: "smithing", label: "Smithing Tithe" },
  { sectorId: "materials", label: "Construction Materials Tithe" },
];

function clampInt(value, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(minimum, Math.min(maximum, n));
}

function getPlayer(state, playerId) {
  return (state.players ?? []).find(player => player.id === playerId) ?? null;
}

function nextRandom(state) {
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function ensureTitheState(state) {
  state.titheContracts ??= {};
  for (const { sectorId } of TITHE_SECTORS) {
    state.titheContracts[sectorId] ??= { ownerId: null, lastWinningBid: 0 };
  }
  return state;
}

function familyName(state, playerId) {
  return getPlayer(state, playerId)?.familyName ?? playerId ?? "Unknown";
}

function sectorLabel(state, sectorId) {
  return (state.productionSectors ?? []).find(sector => sector.id === sectorId)?.name ?? sectorId ?? "Unknown sector";
}

function auctionLabel(state, action) {
  if (action.auctionType === "mercenary_contract" || action.auctionId === "mercenary_contract") return "Mercenary Contract";
  if (action.auctionType === "tithe_contract" || String(action.auctionId ?? "").startsWith("tithe:")) {
    return TITHE_SECTORS.find(item => item.sectorId === action.sectorId)?.label ?? `${sectorLabel(state, action.sectorId)} Tithe`;
  }
  if (action.auctionType === "production_stake") return `${sectorLabel(state, action.sectorId)} Production Stake`;
  return action.auctionId ?? "auction";
}

function captureAgents(state) {
  const byFamily = {};
  const byInstitution = {};
  for (const player of state.players ?? []) {
    let total = 0;
    for (const [institutionId, rawCount] of Object.entries(player.institutionAgents ?? {})) {
      const count = Math.max(0, Number(rawCount) || 0);
      total += count;
      byInstitution[institutionId] = (byInstitution[institutionId] || 0) + count;
    }
    byFamily[player.id] = total;
  }
  return { byFamily, byInstitution };
}

function captureInstitutionPrestige(state) {
  const preview = legacy.getInstitutionPreview(state) ?? {};
  return Object.fromEntries(
    Object.entries(preview).map(([id, result]) => [id, Number(result?.score) || 0]),
  );
}

function emitGenerationTelemetry(state, summary, before) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function" || typeof CustomEvent === "undefined") return;
  const agentsAfter = captureAgents(state);
  const influenceAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, Number(player.influence) || 0]));
  const familyNames = Object.fromEntries((state.players ?? []).map(player => [player.id, player.familyName ?? player.id]));
  const generation = Number(summary?.generation ?? before.generation ?? ((Number(state.generation) || 1) - 1)) || 0;
  const urbanStatus = typeof legacy.getUrbanStatus === "function" ? legacy.getUrbanStatus(state) : null;

  window.dispatchEvent(new CustomEvent("morneval:generation-resolved", {
    detail: {
      generation,
      familyNames,
      influenceBefore: before.influence,
      influenceAfter,
      agentTotalsAfter: agentsAfter.byFamily,
      agentsByInstitutionAfter: agentsAfter.byInstitution,
      institutionPrestigeAfter: captureInstitutionPrestige(state),
      diseaseOccurred: Boolean(summary?.diseaseOccurred),
      populationBefore: Number(summary?.populationBefore ?? before.population ?? 0),
      populationAfter: Number(summary?.populationAfter ?? state.city?.population ?? 0),
      urbanCapacityAfter: Number(summary?.urbanCapacityAfter ?? urbanStatus?.urbanCapacity ?? 0),
      squalorAfter: Number(summary?.squalorAfter ?? state.city?.squalor ?? 0),
      titheTransfers: summary?.titheTransfers ?? [],
    },
  }));
}

function productionWealthBySector(reports) {
  const result = {};
  for (const { sectorId } of TITHE_SECTORS) result[sectorId] = { total: 0, byPlayer: {} };
  for (const report of reports ?? []) {
    const sectorId = report.sectorId ?? report.id;
    if (!result[sectorId]) continue;
    for (const served of report.servedStakes ?? []) {
      const amount = Math.max(0, Number(served.wealthGenerated) || 0);
      if (!amount || !served.ownerId) continue;
      result[sectorId].total += amount;
      result[sectorId].byPlayer[served.ownerId] = (result[sectorId].byPlayer[served.ownerId] || 0) + amount;
    }
  }
  return result;
}

function previewSectorWealth(state) {
  try {
    const preview = legacy.previewEconomy(state);
    return productionWealthBySector(preview?.reports ?? []);
  } catch {
    return Object.fromEntries(TITHE_SECTORS.map(({ sectorId }) => [sectorId, { total: 0, byPlayer: {} }]));
  }
}

function titheMaxBid(player, expectedSectorWealth) {
  if (expectedSectorWealth < TITHE_RULES.activationThreshold) return 0;
  let maxBid = expectedSectorWealth >= 5 ? 3 : 2;
  if (player.aiPersonality === "merchant") maxBid += 1;
  if (player.aiPersonality === "dynast") maxBid -= 1;
  return Math.max(1, Math.min(4, maxBid));
}

function reserveAuctionBid(player, auction, amount, source, bidLog) {
  const previous = auction.bids[player.id]?.amount ?? 0;
  const delta = amount - previous;
  if (delta <= 0 || player.influence < delta) return false;
  player.influence -= delta;
  auction.bids[player.id] = { playerId: player.id, amount, source };
  bidLog.push({
    actionKind: "auction_bid",
    rawType: "auction_bid",
    playerId: player.id,
    auctionId: auction.auctionId,
    auctionType: "tithe_contract",
    sectorId: auction.sectorId,
    bid: amount,
    bidDelta: delta,
    source,
    influenceReserved: amount,
  });
  return true;
}

function planTitheAuctions(state) {
  ensureTitheState(state);
  const threshold = Math.max(1, clampInt(state.city?.influenceErosionThreshold ?? 15, 1));
  const actualInfluenceBefore = Object.fromEntries((state.players ?? []).map(player => [player.id, Math.max(0, Number(player.influence) || 0)]));
  const influenceAfterUpkeepClip = {};
  for (const player of state.players ?? []) {
    player.influence = Math.min(threshold, Math.max(0, Number(player.influence) || 0));
    influenceAfterUpkeepClip[player.id] = player.influence;
  }

  const estimatedWealth = previewSectorWealth(state);
  const order = typeof legacy.getTurnOrder === "function" ? legacy.getTurnOrder(state) : [...(state.players ?? [])];
  const auctions = [];
  const bidLog = [];

  for (const def of TITHE_SECTORS) {
    const contract = state.titheContracts[def.sectorId];
    const auction = {
      auctionId: `tithe:${def.sectorId}`,
      type: "tithe_contract",
      sectorId: def.sectorId,
      bids: {},
      closed: false,
      expectedSectorWealth: estimatedWealth[def.sectorId]?.total ?? 0,
    };

    const incumbent = getPlayer(state, contract.ownerId);
    if (incumbent && (incumbent.institutionAgents?.temple ?? 0) > 0) {
      reserveAuctionBid(incumbent, auction, TITHE_RULES.maintenanceBid, "upkeep_maintenance", bidLog);
    }

    let changed = true;
    let rounds = 0;
    while (changed && rounds < 6) {
      changed = false;
      rounds += 1;
      for (const player of order) {
        if ((player.institutionAgents?.temple ?? 0) <= 0) continue;
        const currentHigh = Object.values(auction.bids).sort((a, b) => b.amount - a.amount)[0] ?? null;
        if (currentHigh?.playerId === player.id) continue;
        const nextBid = (currentHigh?.amount ?? 0) + 1;
        const maximum = titheMaxBid(player, auction.expectedSectorWealth);
        if (nextBid > maximum) continue;
        if (reserveAuctionBid(player, auction, nextBid, "action", bidLog)) changed = true;
      }
    }
    auctions.push(auction);
  }

  return { auctions, bidLog, actualInfluenceBefore, influenceAfterUpkeepClip, threshold };
}

function resolveTitheAuctions(state, plan) {
  const results = [];
  for (const auction of plan.auctions) {
    const ranked = Object.values(auction.bids).sort((a, b) => b.amount - a.amount);
    const eligible = ranked.filter(bid => (getPlayer(state, bid.playerId)?.institutionAgents?.temple ?? 0) > 0);
    const winner = eligible[0] ?? null;
    const eligibleIds = new Set(eligible.map(bid => bid.playerId));
    const invalidBids = ranked.filter(bid => !eligibleIds.has(bid.playerId)).map(bid => bid.playerId);

    for (const bid of ranked) {
      if (!winner || bid.playerId !== winner.playerId) {
        const player = getPlayer(state, bid.playerId);
        if (player) player.influence += bid.amount;
      }
    }

    const contract = state.titheContracts[auction.sectorId];
    contract.ownerId = winner?.playerId ?? null;
    contract.lastWinningBid = winner?.amount ?? 0;

    auction.closed = true;
    auction.winnerId = winner?.playerId ?? null;
    auction.winningBid = winner?.amount ?? 0;
    auction.invalidBids = invalidBids;
    results.push(auction);
  }
  return results;
}

function chooseTitheTarget(state, holderId, sectorWealth, prestigeBefore) {
  const candidates = (state.players ?? [])
    .filter(player => player.id !== holderId && (sectorWealth.byPlayer[player.id] ?? 0) > 0)
    .map(player => ({
      player,
      prestige: Number(prestigeBefore?.[player.id] ?? player.prestige) || 0,
      productionWealth: sectorWealth.byPlayer[player.id] ?? 0,
    }));
  if (!candidates.length) return null;
  const bestPrestige = Math.max(...candidates.map(item => item.prestige));
  let finalists = candidates.filter(item => item.prestige === bestPrestige);
  const bestProduction = Math.max(...finalists.map(item => item.productionWealth));
  finalists = finalists.filter(item => item.productionWealth === bestProduction);
  if (finalists.length === 1) return finalists[0].player;
  const roll = nextRandom(state);
  return finalists[Math.min(finalists.length - 1, Math.floor(roll * finalists.length))].player;
}

function applyTitheTransfers(state, summary) {
  const sectorWealth = productionWealthBySector(summary.economyReports ?? []);
  const transfers = [];
  summary.wealthAfter ??= Object.fromEntries((state.players ?? []).map(player => [player.id, player.wealthCapacity]));

  for (const def of TITHE_SECTORS) {
    const contract = state.titheContracts[def.sectorId];
    const holder = getPlayer(state, contract.ownerId);
    const generated = sectorWealth[def.sectorId] ?? { total: 0, byPlayer: {} };
    if (!holder || generated.total < TITHE_RULES.activationThreshold) {
      transfers.push({ sectorId: def.sectorId, label: def.label, holderId: holder?.id ?? null,
        sectorWealthGenerated: generated.total, activated: false, targetId: null, wealthTransferred: 0 });
      continue;
    }
    const target = chooseTitheTarget(state, holder.id, generated, summary.prestigeBefore ?? {});
    if (!target) {
      transfers.push({ sectorId: def.sectorId, label: def.label, holderId: holder.id,
        sectorWealthGenerated: generated.total, activated: true, targetId: null, wealthTransferred: 0 });
      continue;
    }

    summary.wealthAfter[target.id] = Math.max(economy.V084_CONFIG.familyBaseWealth,
      (Number(summary.wealthAfter[target.id]) || economy.V084_CONFIG.familyBaseWealth) - TITHE_RULES.transfer);
    summary.wealthAfter[holder.id] = (Number(summary.wealthAfter[holder.id]) || economy.V084_CONFIG.familyBaseWealth) + TITHE_RULES.transfer;
    transfers.push({ sectorId: def.sectorId, label: def.label, holderId: holder.id,
      sectorWealthGenerated: generated.total, activated: true, targetId: target.id, wealthTransferred: TITHE_RULES.transfer });
  }

  for (const player of state.players ?? []) {
    const gross = Math.max(economy.V084_CONFIG.familyBaseWealth,
      Math.floor(Number(summary.wealthAfter[player.id]) || economy.V084_CONFIG.familyBaseWealth));
    player.wealthCapacity = gross;
    player.wealthGeneratedThisGeneration = gross;
    const commitment = (summary.wealthCommitments ?? []).find(entry => entry.playerId === player.id);
    if (commitment) {
      commitment.gross = gross;
      commitment.available = Math.max(0, gross - commitment.committed);
      commitment.shortfall = Math.max(0, commitment.committed - gross);
      player.lastWealthCommitted = commitment.committed;
      player.lastWealthAvailable = commitment.available;
      player.lastWealthShortfall = commitment.shortfall;
    }
  }

  summary.titheProductionWealth = sectorWealth;
  summary.titheTransfers = transfers;
  return transfers;
}

function recomputeFirstPlayer(state) {
  const maxInfluence = Math.max(...state.players.map(player => player.influence));
  let finalists = state.players.filter(player => player.influence === maxInfluence);
  let tieBreakMethod = "influence";
  let maxPrestige = null;
  let maxWealth = null;
  let randomRoll = null;
  if (finalists.length > 1) {
    maxPrestige = Math.max(...finalists.map(player => player.prestige));
    finalists = finalists.filter(player => player.prestige === maxPrestige);
    tieBreakMethod = "prestige";
  }
  if (finalists.length > 1) {
    maxWealth = Math.max(...finalists.map(player => player.wealthCapacity));
    finalists = finalists.filter(player => player.wealthCapacity === maxWealth);
    tieBreakMethod = "wealth";
  }
  if (finalists.length > 1) {
    randomRoll = nextRandom(state);
    finalists = [finalists[Math.min(finalists.length - 1, Math.floor(randomRoll * finalists.length))]];
    tieBreakMethod = "random";
  }
  state.firstPlayerId = finalists[0]?.id ?? state.firstPlayerId;
  return { nextFirstPlayerId: state.firstPlayerId, maxInfluence, maxPrestige, maxWealth, tieBreakMethod, randomRoll };
}

function humanizeAuctionAction(state, action) {
  if (action.actionKind !== "auction_bid" && action.type !== "auction_bid") return action;
  if (action.type !== "auction_bid" && action.rawType !== "auction_bid") return action;
  const maintenance = action.source === "upkeep_maintenance";
  action.rawType = "auction_bid";
  action.type = `${maintenance ? "Maintenance bid" : "Auction bid"}: ${familyName(state, action.playerId)} bid ${action.bid} Influence on ${auctionLabel(state, action)}`;
  return action;
}

function addMercenaryMaintenanceToLog(state, summary) {
  const maintenance = summary.mercenaryMaintenanceBid;
  if (!maintenance?.playerId || !maintenance.amount) return null;
  return {
    actionKind: "auction_bid",
    rawType: "auction_bid",
    type: `Maintenance bid: ${familyName(state, maintenance.playerId)} bid ${maintenance.amount} Influence on Mercenary Contract`,
    playerId: maintenance.playerId,
    auctionId: "mercenary_contract",
    auctionType: "mercenary_contract",
    sectorId: null,
    bid: maintenance.amount,
    source: "upkeep_maintenance",
    freeAction: true,
  };
}

function updateActionLog(state, summary, tithePlan) {
  const original = summary.actions ?? [];
  for (const action of original) humanizeAuctionAction(state, action);
  const injected = [];
  const mercenaryMaintenance = addMercenaryMaintenanceToLog(state, summary);
  if (mercenaryMaintenance) injected.push(mercenaryMaintenance);
  for (const bid of tithePlan.bidLog) injected.push(humanizeAuctionAction(state, { ...bid, freeAction: bid.source === "upkeep_maintenance" }));

  let insertionIndex = 0;
  while (insertionIndex < original.length && original[insertionIndex]?.actionKind === "agent_recall" && original[insertionIndex]?.forced) insertionIndex += 1;
  original.splice(insertionIndex, 0, ...injected);
  original.forEach((action, index) => { action.sequence = index + 1; });
  summary.actions = original;
}

function repairInfluenceSummary(state, summary, tithePlan) {
  summary.influenceBefore = { ...tithePlan.actualInfluenceBefore };
  summary.influenceErosion = (state.players ?? []).map(player => {
    const before = tithePlan.actualInfluenceBefore[player.id] ?? 0;
    const after = Math.min(tithePlan.threshold, before);
    return { playerId: player.id, before, after, threshold: tithePlan.threshold, lost: before - after, mode: "threshold_clip_only" };
  });
  summary.influenceErosionMode = "threshold_clip_only";
  summary.influenceAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, player.influence]));
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = legacy.createV084Game(familyNames);
  ai.prepareV111State(state, { resetStartingInfluence: true });
  ensureTitheState(state);
  legacy.applyAutoDemand(state);
  return state;
}

export function applyAutoDemand(state) {
  ai.prepareV111State(state);
  ensureTitheState(state);
  legacy.applyAutoDemand(state);
}

export function previewEconomy(state) {
  ai.prepareV111State(state);
  ensureTitheState(state);
  legacy.applyAutoDemand(state);
  return legacy.previewEconomy(state);
}

export function resolveAutomatedGeneration(state) {
  ai.prepareV111State(state);
  ensureTitheState(state);
  const before = {
    generation: Number(state.generation) || 0,
    population: Number(state.city?.population) || 0,
    influence: Object.fromEntries((state.players ?? []).map(player => [player.id, Number(player.influence) || 0])),
  };

  const tithePlan = planTitheAuctions(state);
  const summary = ai.resolveAutomatedGeneration(state);
  legacy.refreshForce(state);

  const titheAuctions = resolveTitheAuctions(state, tithePlan);
  applyTitheTransfers(state, summary);
  repairInfluenceSummary(state, summary, tithePlan);

  summary.titheContracts = Object.fromEntries(
    TITHE_SECTORS.map(({ sectorId }) => [sectorId, { ...state.titheContracts[sectorId] }]),
  );
  summary.titheAuctions = titheAuctions.map(auction => ({ ...auction, bids: { ...auction.bids } }));
  summary.titheRules = { ...TITHE_RULES };
  summary.auctions = [...(summary.auctions ?? []), ...summary.titheAuctions];
  updateActionLog(state, summary, tithePlan);

  const firstPlayerResolution = recomputeFirstPlayer(state);
  summary.firstPlayerResolution = firstPlayerResolution;
  summary.nextFirstPlayerId = firstPlayerResolution.nextFirstPlayerId;
  summary.influenceAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, player.influence]));

  emitGenerationTelemetry(state, summary, before);
  return summary;
}

export function setInstitutionAgentCount(state, playerId, institutionId, value) {
  ai.prepareV111State(state);
  ensureTitheState(state);
  legacy.setInstitutionAgentCount(state, playerId, institutionId, value);
}

export function setCityValue(state, key, value) {
  ai.prepareV111State(state);
  ensureTitheState(state);
  legacy.setCityValue(state, key, value);
}

export function getInstitutionPreview(state) {
  ai.prepareV111State(state);
  ensureTitheState(state);
  return legacy.getInstitutionPreview(state);
}

export { economy };
