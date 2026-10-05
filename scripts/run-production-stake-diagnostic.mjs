import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=production-stake-diagnostic');

const MODE = process.env.EXTERNAL_RELATIONS === 'off' ? 'baseline' : 'relations';
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;
const SECTORS = ['textiles', 'smithing', 'materials'];

function n(v) { return Number(v) || 0; }
function mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
function sumDemand(report) {
  const r = report?.demand?.requested ?? {};
  return n(r.population) + n(r.imperial) + n(r.external_markets);
}
function personality(player) { return player?.aiPersonality ?? 'unknown'; }
function emptySectorRow() {
  return {
    samples: 0,
    tierSum: 0,
    stakeSupplySum: 0,
    slotCapacitySum: 0,
    rawCapacitySum: 0,
    demandSum: 0,
    productionSum: 0,
    stakeGapSum: 0,
    stakeBottleneckGenerations: 0,
    rawBottleneckGenerations: 0,
    demandLimitedGenerations: 0,
    missedStakeOpportunityGenerations: 0,
    youngSlotAvailableGenerations: 0,
    tierTime: { 1: 0, 2: 0, 3: 0 },
    stakePlacements: 0,
    winningBidInfluence: 0,
    auctionsWithBids: 0,
    auctionsNoBid: 0,
    totalBidders: 0,
    developmentActions: 0,
    tierActivations: 0,
  };
}

const aggregate = Object.fromEntries(SECTORS.map(id => [id, emptySectorRow()]));
const placementsByPersonality = {};
const bidsByPersonality = {};
const finalTierRows = [];
const finalStakeRows = [];
let totalGenerations = 0;
let gamesReached = 0;

for (let game = 0; game < GAMES; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;
  let reached = false;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (MODE === 'relations' && !state.externalRelations?.active && n(state.city?.population) >= 3) {
      engine.activateExternalRelations(state);
    }

    const summary = engine.resolveAutomatedGeneration(state);
    totalGenerations += 1;
    const reports = Object.fromEntries((summary.economyReports ?? []).map(r => [r.sectorId, r]));

    for (const sectorId of SECTORS) {
      const row = aggregate[sectorId];
      const report = reports[sectorId];
      if (!report) continue;
      row.samples += 1;
      const tier = Math.max(1, Math.min(3, Math.trunc(n(report.tier) || 1)));
      const stakeSupply = Math.max(0, n(report.stakeSupply));
      const slotCapacity = Math.max(0, n(report.slotCapacity));
      const rawCapacity = Math.max(0, n(report.totalResourceCapacity));
      const demand = Math.max(0, sumDemand(report));
      const actual = Math.max(0, n(report.actualProduction));
      const targetWithoutStakeLimit = Math.min(rawCapacity, demand);
      const stakeGap = Math.max(0, targetWithoutStakeLimit - stakeSupply);
      const rawTarget = Math.min(stakeSupply, demand);

      const youngCount = state.players
        .flatMap(p => p.productionStakes ?? [])
        .filter(stake => stake.sectorId === sectorId && stake.age === 'young').length;
      const availableYoung = Math.max(0, tier - youngCount);

      row.tierSum += tier;
      row.stakeSupplySum += stakeSupply;
      row.slotCapacitySum += slotCapacity;
      row.rawCapacitySum += rawCapacity;
      row.demandSum += demand;
      row.productionSum += actual;
      row.stakeGapSum += stakeGap;
      row.tierTime[tier] = (row.tierTime[tier] ?? 0) + 1;
      if (stakeSupply < targetWithoutStakeLimit) row.stakeBottleneckGenerations += 1;
      if (rawCapacity < rawTarget) row.rawBottleneckGenerations += 1;
      if (demand <= Math.min(stakeSupply, rawCapacity)) row.demandLimitedGenerations += 1;
      if (availableYoung > 0) row.youngSlotAvailableGenerations += 1;
      if (stakeGap > 0 && availableYoung > 0) row.missedStakeOpportunityGenerations += 1;
    }

    for (const auction of summary.auctions ?? []) {
      if (auction.type !== 'production_stake' || !SECTORS.includes(auction.sectorId)) continue;
      const row = aggregate[auction.sectorId];
      const bidderIds = Object.keys(auction.bids ?? {});
      if (bidderIds.length) row.auctionsWithBids += 1;
      else row.auctionsNoBid += 1;
      row.totalBidders += bidderIds.length;
      if (auction.winnerId) {
        row.stakePlacements += 1;
        row.winningBidInfluence += n(auction.winningBid);
        const winner = state.players.find(p => p.id === auction.winnerId);
        const key = personality(winner);
        placementsByPersonality[key] = (placementsByPersonality[key] ?? 0) + 1;
        bidsByPersonality[key] = (bidsByPersonality[key] ?? 0) + n(auction.winningBid);
      }
    }

    for (const action of summary.actions ?? []) {
      const kind = String(action.actionKind ?? action.type ?? '').toLowerCase();
      if (kind !== 'sector_development' && !kind.includes('sector_development')) continue;
      if (!SECTORS.includes(action.sectorId)) continue;
      aggregate[action.sectorId].developmentActions += 1;
      if (action.tierActivated) aggregate[action.sectorId].tierActivations += 1;
    }

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) {
      reached = true;
      break;
    }
  }

  if (reached) gamesReached += 1;
  finalTierRows.push(Object.fromEntries(SECTORS.map(id => [id, n(state.productionSectors.find(s => s.id === id)?.tier) || 1])));
  finalStakeRows.push(Object.fromEntries(SECTORS.map(id => [id, state.players.flatMap(p => p.productionStakes ?? []).filter(stake => stake.sectorId === id).length])));
}

const bySector = Object.fromEntries(SECTORS.map(id => {
  const r = aggregate[id];
  const samples = Math.max(1, r.samples);
  return [id, {
    generationSamples: r.samples,
    tierMean: r.tierSum / samples,
    stakeSupplyMean: r.stakeSupplySum / samples,
    slotCapacityMean: r.slotCapacitySum / samples,
    stakeSlotOccupancyRate: r.slotCapacitySum > 0 ? r.stakeSupplySum / r.slotCapacitySum : 0,
    rawCapacityMean: r.rawCapacitySum / samples,
    demandMean: r.demandSum / samples,
    actualProductionMean: r.productionSum / samples,
    meanMissingStakesVsRawAndDemand: r.stakeGapSum / samples,
    stakeBottleneckRate: r.stakeBottleneckGenerations / samples,
    rawBottleneckRate: r.rawBottleneckGenerations / samples,
    demandLimitedRate: r.demandLimitedGenerations / samples,
    youngSlotAvailableRate: r.youngSlotAvailableGenerations / samples,
    missedStakeOpportunityRate: r.missedStakeOpportunityGenerations / samples,
    tierTimeShare: Object.fromEntries([1,2,3].map(t => [String(t), (r.tierTime[t] ?? 0) / samples])),
    stakePlacementsPerGame: r.stakePlacements / GAMES,
    meanWinningBid: r.stakePlacements ? r.winningBidInfluence / r.stakePlacements : 0,
    auctionsWithBidsPerGame: r.auctionsWithBids / GAMES,
    auctionsNoBidPerGame: r.auctionsNoBid / GAMES,
    meanBiddersWhenAuctionExists: (r.auctionsWithBids + r.auctionsNoBid) ? r.totalBidders / (r.auctionsWithBids + r.auctionsNoBid) : 0,
    developmentActionsPerGame: r.developmentActions / GAMES,
    tierActivationsPerGame: r.tierActivations / GAMES,
    finalTierMean: mean(finalTierRows.map(row => row[id])),
    finalStakeMean: mean(finalStakeRows.map(row => row[id])),
    finalTier2PlusRate: finalTierRows.filter(row => row[id] >= 2).length / GAMES,
    finalTier3Rate: finalTierRows.filter(row => row[id] >= 3).length / GAMES,
  }];
}));

const summary = {
  mode: MODE,
  games: GAMES,
  gamesReachedEndgame: gamesReached,
  totalGenerations,
  bySector,
  placementsByPersonality,
  winningBidInfluenceByPersonality: bidsByPersonality,
  notes: [
    'Stake bottleneck means Stakes are below both available Raw capacity and current demand.',
    'Missed Stake opportunity means the sector is Stake-bottlenecked and still has an unused Young slot after the action/auction phase.',
    'Food is excluded because the current AI does not create Production Stake auctions for the Food sector.',
  ],
};

fs.mkdirSync('simulation-results', { recursive: true });
const path = `simulation-results/production-stake-diagnostic-${MODE}.json`;
fs.writeFileSync(path, JSON.stringify(summary, null, 2));
console.log(`WROTE ${path}`);
console.log(JSON.stringify(summary));
