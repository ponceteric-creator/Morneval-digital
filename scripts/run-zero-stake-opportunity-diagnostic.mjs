import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=zero-stake-opportunity-diagnostic');

const MODE = process.env.EXTERNAL_RELATIONS === 'off' ? 'baseline' : 'relations';
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;
const SECTORS = ['textiles', 'smithing', 'materials'];

function n(v) { return Number(v) || 0; }
function sumDemand(report) {
  const r = report?.demand?.requested ?? {};
  return n(r.population) + n(r.imperial) + n(r.external_markets);
}

let totalGenerations = 0;
let generationsWithAnyOpportunity = 0;
let generationsWithZeroStakePlacements = 0;
let generationsWithZeroStakePlacementsAndOpportunity = 0;
let totalStakePlacements = 0;
const zeroPlacementOpportunityBySector = Object.fromEntries(SECTORS.map(id => [id, 0]));
const opportunityBySector = Object.fromEntries(SECTORS.map(id => [id, 0]));
const zeroPlacementOpportunitySectorCount = { 1: 0, 2: 0, 3: 0 };

for (let game = 0; game < GAMES; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (MODE === 'relations' && !state.externalRelations?.active && n(state.city?.population) >= 3) {
      engine.activateExternalRelations(state);
    }

    const summary = engine.resolveAutomatedGeneration(state);
    totalGenerations += 1;

    const stakePlacements = (summary.auctions ?? [])
      .filter(auction => auction.type === 'production_stake' && auction.winnerId).length;
    totalStakePlacements += stakePlacements;
    if (stakePlacements === 0) generationsWithZeroStakePlacements += 1;

    const reports = Object.fromEntries((summary.economyReports ?? []).map(r => [r.sectorId, r]));
    const opportunitySectors = [];

    for (const sectorId of SECTORS) {
      const report = reports[sectorId];
      if (!report) continue;
      const tier = Math.max(1, Math.min(3, Math.trunc(n(report.tier) || 1)));
      const stakeSupply = Math.max(0, n(report.stakeSupply));
      const rawCapacity = Math.max(0, n(report.totalResourceCapacity));
      const demand = Math.max(0, sumDemand(report));
      const youngCount = state.players
        .flatMap(p => p.productionStakes ?? [])
        .filter(stake => stake.sectorId === sectorId && stake.age === 'young').length;
      const availableYoung = Math.max(0, tier - youngCount);

      // Same definition as missedStakeOpportunity in the existing diagnostic:
      // another Stake could immediately add production because both Raw capacity
      // and demand exceed current Stake supply, and a Young slot remains open.
      const immediatelyProductiveOpportunity = availableYoung > 0
        && stakeSupply < rawCapacity
        && stakeSupply < demand;

      if (immediatelyProductiveOpportunity) {
        opportunitySectors.push(sectorId);
        opportunityBySector[sectorId] += 1;
      }
    }

    if (opportunitySectors.length > 0) generationsWithAnyOpportunity += 1;
    if (stakePlacements === 0 && opportunitySectors.length > 0) {
      generationsWithZeroStakePlacementsAndOpportunity += 1;
      zeroPlacementOpportunitySectorCount[String(opportunitySectors.length)] += 1;
      for (const sectorId of opportunitySectors) zeroPlacementOpportunityBySector[sectorId] += 1;
    }

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) break;
  }
}

const summary = {
  mode: MODE,
  games: GAMES,
  totalGenerations,
  totalStakePlacements,
  generationsWithZeroStakePlacements,
  zeroStakePlacementRate: totalGenerations ? generationsWithZeroStakePlacements / totalGenerations : 0,
  generationsWithAnyImmediatelyProductiveStakeOpportunity: generationsWithAnyOpportunity,
  anyImmediatelyProductiveStakeOpportunityRate: totalGenerations ? generationsWithAnyOpportunity / totalGenerations : 0,
  generationsWithZeroStakePlacementsAndImmediatelyProductiveOpportunity: generationsWithZeroStakePlacementsAndOpportunity,
  zeroPlacementDespiteOpportunityRateAllGenerations: totalGenerations
    ? generationsWithZeroStakePlacementsAndOpportunity / totalGenerations
    : 0,
  zeroPlacementDespiteOpportunityRateWhenOpportunityExists: generationsWithAnyOpportunity
    ? generationsWithZeroStakePlacementsAndOpportunity / generationsWithAnyOpportunity
    : 0,
  opportunityBySector,
  zeroPlacementOpportunityBySector,
  zeroPlacementOpportunitySectorCount,
  definition: 'A generation counts as an immediately productive Stake opportunity when at least one non-Food Production Sector ends the action/auction phase with a free Young slot, Raw capacity above current Stake supply, and demand above current Stake supply. The headline failure metric additionally requires zero Production Stakes to have been placed anywhere that generation.',
};

fs.mkdirSync('simulation-results', { recursive: true });
const path = `simulation-results/zero-stake-opportunity-${MODE}.json`;
fs.writeFileSync(path, JSON.stringify(summary, null, 2));
console.log(`WROTE ${path}`);
console.log(JSON.stringify(summary));
