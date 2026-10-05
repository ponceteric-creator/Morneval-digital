import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=zero-stake-failure-analysis');

const MODE = process.env.EXTERNAL_RELATIONS === 'off' ? 'baseline' : 'relations';
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;
const SECTORS = ['textiles', 'smithing', 'materials'];
const REASONS = ['evaluations','zeroOrLowUtility','zeroOrLowUtilityWithInactiveStake','alreadyLeadingAuction','nextBidAboveMax','nonPositiveBidDelta','insufficientInfluence','candidatesOffered'];

function n(v) { return Number(v) || 0; }
function sumDemand(report) {
  const r = report?.demand?.requested ?? {};
  return n(r.population) + n(r.imperial) + n(r.external_markets);
}
function personality(player) { return player?.aiPersonality ?? 'unknown'; }
function emptySectorDiag() { return Object.fromEntries(REASONS.map(key => [key, 0])); }
function diagSnapshot(state) {
  const source = state.__stakeAiDiagnostic ?? {};
  return {
    bySector: Object.fromEntries(SECTORS.map(id => [id, {
      ...emptySectorDiag(),
      ...(source.bySector?.[id] ?? {}),
    }])),
    roundsWithProductionCandidate: n(source.roundsWithProductionCandidate),
    roundsProductionChosen: n(source.roundsProductionChosen),
    roundsProductionLostToOtherAction: n(source.roundsProductionLostToOtherAction),
    lostToKind: { ...(source.lostToKind ?? {}) },
  };
}
function diagDelta(before, after) {
  const out = {
    bySector: Object.fromEntries(SECTORS.map(id => [id, emptySectorDiag()])),
    roundsWithProductionCandidate: n(after.roundsWithProductionCandidate) - n(before.roundsWithProductionCandidate),
    roundsProductionChosen: n(after.roundsProductionChosen) - n(before.roundsProductionChosen),
    roundsProductionLostToOtherAction: n(after.roundsProductionLostToOtherAction) - n(before.roundsProductionLostToOtherAction),
    lostToKind: {},
  };
  for (const id of SECTORS) {
    for (const key of REASONS) out.bySector[id][key] = n(after.bySector?.[id]?.[key]) - n(before.bySector?.[id]?.[key]);
  }
  const kinds = new Set([...Object.keys(before.lostToKind ?? {}), ...Object.keys(after.lostToKind ?? {})]);
  for (const kind of kinds) out.lostToKind[kind] = n(after.lostToKind?.[kind]) - n(before.lostToKind?.[kind]);
  return out;
}
function addMap(target, source) {
  for (const [key, value] of Object.entries(source ?? {})) target[key] = (target[key] ?? 0) + n(value);
}
function actionKind(action) {
  return String(action?.actionKind ?? action?.kind ?? action?.type ?? 'unknown').toLowerCase();
}

const aggregate = {
  mode: MODE,
  games: GAMES,
  totalGenerations: 0,
  failureGenerations: 0,
  failureRate: 0,
  opportunitySectorsAcrossFailures: 0,
  classification: {
    noProductionCandidateEverOffered: 0,
    productionCandidateLostToOtherAction: 0,
    productionActionChosenButNoPlacement: 0,
  },
  influence: {
    playerSamples: 0,
    startSum: 0,
    endSum: 0,
    startZero: 0,
    endZero: 0,
    startAtLeastOne: 0,
    startAtLeastTwo: 0,
    allPlayersStartZeroGenerations: 0,
    allPlayersEndZeroGenerations: 0,
    byPersonality: {},
  },
  auctionState: {
    opportunityAuctions: 0,
    opportunityAuctionsNoBid: 0,
    opportunityAuctionsWithBid: 0,
    allProductionAuctions: 0,
    allProductionAuctionsNoBid: 0,
    allProductionAuctionsWithBid: 0,
  },
  aiRejectionsOnOpportunitySectors: Object.fromEntries(SECTORS.map(id => [id, emptySectorDiag()])),
  aiChoice: {
    roundsWithProductionCandidate: 0,
    roundsProductionChosen: 0,
    roundsProductionLostToOtherAction: 0,
    lostToKind: {},
  },
  executedActions: {},
  failureGenerationNumber: { early_1_5: 0, mid_6_12: 0, late_13_plus: 0 },
  opportunitySectorCount: { 1: 0, 2: 0, 3: 0 },
};

for (let game = 0; game < GAMES; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (MODE === 'relations' && !state.externalRelations?.active && n(state.city?.population) >= 3) {
      engine.activateExternalRelations(state);
    }

    const influenceBefore = Object.fromEntries(state.players.map(p => [p.id, n(p.influence)]));
    const diagBefore = diagSnapshot(state);
    const summary = engine.resolveAutomatedGeneration(state);
    const delta = diagDelta(diagBefore, diagSnapshot(state));
    aggregate.totalGenerations += 1;

    const placements = (summary.auctions ?? []).filter(a => a.type === 'production_stake' && a.winnerId);
    const reports = Object.fromEntries((summary.economyReports ?? []).map(r => [r.sectorId, r]));
    const opportunitySectors = [];

    for (const sectorId of SECTORS) {
      const report = reports[sectorId];
      if (!report) continue;
      const tier = Math.max(1, Math.min(3, Math.trunc(n(report.tier) || 1)));
      const stakeSupply = Math.max(0, n(report.stakeSupply));
      const rawCapacity = Math.max(0, n(report.totalResourceCapacity));
      const demand = Math.max(0, sumDemand(report));
      const youngCount = state.players.flatMap(p => p.productionStakes ?? [])
        .filter(stake => stake.sectorId === sectorId && stake.age === 'young').length;
      const availableYoung = Math.max(0, tier - youngCount);
      if (availableYoung > 0 && stakeSupply < rawCapacity && stakeSupply < demand) opportunitySectors.push(sectorId);
    }

    if (placements.length === 0 && opportunitySectors.length > 0) {
      aggregate.failureGenerations += 1;
      aggregate.opportunitySectorsAcrossFailures += opportunitySectors.length;
      aggregate.opportunitySectorCount[String(opportunitySectors.length)] += 1;
      const generation = step + 1;
      if (generation <= 5) aggregate.failureGenerationNumber.early_1_5 += 1;
      else if (generation <= 12) aggregate.failureGenerationNumber.mid_6_12 += 1;
      else aggregate.failureGenerationNumber.late_13_plus += 1;

      if (delta.roundsWithProductionCandidate <= 0) aggregate.classification.noProductionCandidateEverOffered += 1;
      else if (delta.roundsProductionChosen <= 0) aggregate.classification.productionCandidateLostToOtherAction += 1;
      else aggregate.classification.productionActionChosenButNoPlacement += 1;

      const allStartZero = state.players.every(p => n(influenceBefore[p.id]) <= 0);
      const allEndZero = state.players.every(p => n(p.influence) <= 0);
      if (allStartZero) aggregate.influence.allPlayersStartZeroGenerations += 1;
      if (allEndZero) aggregate.influence.allPlayersEndZeroGenerations += 1;
      for (const p of state.players) {
        const start = n(influenceBefore[p.id]);
        const end = n(p.influence);
        aggregate.influence.playerSamples += 1;
        aggregate.influence.startSum += start;
        aggregate.influence.endSum += end;
        if (start <= 0) aggregate.influence.startZero += 1;
        else aggregate.influence.startAtLeastOne += 1;
        if (start >= 2) aggregate.influence.startAtLeastTwo += 1;
        if (end <= 0) aggregate.influence.endZero += 1;
        const key = personality(p);
        const row = aggregate.influence.byPersonality[key] ??= { samples: 0, startSum: 0, endSum: 0, startZero: 0, endZero: 0, startAtLeastOne: 0, startAtLeastTwo: 0 };
        row.samples += 1;
        row.startSum += start;
        row.endSum += end;
        if (start <= 0) row.startZero += 1; else row.startAtLeastOne += 1;
        if (start >= 2) row.startAtLeastTwo += 1;
        if (end <= 0) row.endZero += 1;
      }

      const productionAuctions = (summary.auctions ?? []).filter(a => a.type === 'production_stake');
      for (const auction of productionAuctions) {
        const bidderCount = Object.keys(auction.bids ?? {}).length;
        aggregate.auctionState.allProductionAuctions += 1;
        if (bidderCount) aggregate.auctionState.allProductionAuctionsWithBid += 1;
        else aggregate.auctionState.allProductionAuctionsNoBid += 1;
        if (opportunitySectors.includes(auction.sectorId)) {
          aggregate.auctionState.opportunityAuctions += 1;
          if (bidderCount) aggregate.auctionState.opportunityAuctionsWithBid += 1;
          else aggregate.auctionState.opportunityAuctionsNoBid += 1;
        }
      }

      for (const sectorId of opportunitySectors) {
        for (const key of REASONS) aggregate.aiRejectionsOnOpportunitySectors[sectorId][key] += n(delta.bySector?.[sectorId]?.[key]);
      }
      aggregate.aiChoice.roundsWithProductionCandidate += n(delta.roundsWithProductionCandidate);
      aggregate.aiChoice.roundsProductionChosen += n(delta.roundsProductionChosen);
      aggregate.aiChoice.roundsProductionLostToOtherAction += n(delta.roundsProductionLostToOtherAction);
      addMap(aggregate.aiChoice.lostToKind, delta.lostToKind);
      for (const action of summary.actions ?? []) {
        const kind = actionKind(action);
        aggregate.executedActions[kind] = (aggregate.executedActions[kind] ?? 0) + 1;
      }
    }

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) break;
  }
}

aggregate.failureRate = aggregate.totalGenerations ? aggregate.failureGenerations / aggregate.totalGenerations : 0;
aggregate.influence.startMeanPerPlayer = aggregate.influence.playerSamples ? aggregate.influence.startSum / aggregate.influence.playerSamples : 0;
aggregate.influence.endMeanPerPlayer = aggregate.influence.playerSamples ? aggregate.influence.endSum / aggregate.influence.playerSamples : 0;
aggregate.influence.startZeroRate = aggregate.influence.playerSamples ? aggregate.influence.startZero / aggregate.influence.playerSamples : 0;
aggregate.influence.endZeroRate = aggregate.influence.playerSamples ? aggregate.influence.endZero / aggregate.influence.playerSamples : 0;
for (const row of Object.values(aggregate.influence.byPersonality)) {
  row.startMean = row.samples ? row.startSum / row.samples : 0;
  row.endMean = row.samples ? row.endSum / row.samples : 0;
  row.startZeroRate = row.samples ? row.startZero / row.samples : 0;
  row.endZeroRate = row.samples ? row.endZero / row.samples : 0;
}
aggregate.notes = [
  'Failure generation = zero Production Stake placements anywhere, while at least one non-Food sector ends with a free Young slot and both Raw capacity and demand above current Stake supply.',
  'AI rejection counters are generation deltas from the existing v132 diagnostic and are restricted to sectors that remain immediately productive opportunities at generation end.',
  'Influence start is sampled immediately before resolveAutomatedGeneration; Influence end is sampled immediately after it.',
  'Classification uses whether a rational Production candidate was ever offered and whether one was selected during the generation; it does not alter AI behavior.',
];

fs.mkdirSync('simulation-results', { recursive: true });
const path = `simulation-results/zero-stake-failure-analysis-${MODE}.json`;
fs.writeFileSync(path, JSON.stringify(aggregate, null, 2));
console.log(`WROTE ${path}`);
console.log(JSON.stringify(aggregate));
