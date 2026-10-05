import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=merchant-guild-power-v137');
const GAMES = Math.max(1, Number(process.env.GAMES) || 500);
const MAX_GENERATIONS = 60;
const RENOWN_TRIGGER = 12;
const BASE_WEALTH = 2;
const n = value => Number(value) || 0;
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const agentCount = (player, id) => (player.institutionAgentRoster ?? []).filter(agent => agent.institutionId === id).length;

const samples = [];
const games = [];
let actualGuildPrestige = 0;
let freeRiderPrestige = 0;
let representedAwards = 0;
let freeRiderAwards = 0;

for (let game = 0; game < GAMES; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;
  let theoreticalSingleTicket = 0;
  let theoreticalAllFamilies = 0;
  let generations = 0;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (!state.externalRelations?.active && n(state.city?.population) >= 3) engine.activateExternalRelations(state);
    const summary = engine.resolveAutomatedGeneration(state);
    generations += 1;

    const row = summary.institutionScores?.merchant_guild ?? {};
    const tier = Math.max(1, Math.min(3, Math.floor(n(row.institutionTier ?? (state.institutions ?? []).find(x => x.id === 'merchant_guild')?.tier) || 1)));
    const cap = ({ 1: 2, 2: 4, 3: 8 })[tier] ?? 2;
    const score = Math.max(0, n(row.score));
    const commercialWealth = Math.max(0, n(row.commercialWealth ?? row.structuralRaw ?? row.rawScore));
    const represented = state.players.filter(player => agentCount(player, 'merchant_guild') > 0);
    const awards = (summary.institutionPrestigeAwards ?? []).filter(award => award.institutionId === 'merchant_guild');
    const awardTotal = awards.reduce((sum, award) => sum + Math.max(0, n(award.amount)), 0);
    actualGuildPrestige += awardTotal;
    theoreticalSingleTicket += score;
    theoreticalAllFamilies += score * state.players.length;

    let freeRiders = 0;
    let freeRiderAwardThisGeneration = 0;
    for (const player of represented) {
      representedAwards += 1;
      const ownCommercialContribution = Math.max(0, n(player.wealthCapacity) - BASE_WEALTH);
      if (ownCommercialContribution <= 0 && score > 0) {
        freeRiders += 1;
        freeRiderAwards += 1;
        const award = awards.find(item => item.playerId === player.id);
        const amount = Math.max(0, n(award?.amount));
        freeRiderPrestige += amount;
        freeRiderAwardThisGeneration += amount;
      }
    }

    samples.push({
      game,
      generation: generations,
      tier,
      cap,
      score,
      commercialWealth,
      capHit: score >= cap && cap > 0,
      representedFamilies: represented.length,
      actualAward: awardTotal,
      theoreticalAllFamilies: score * state.players.length,
      freeRiderFamilies: freeRiders,
      freeRiderAward: freeRiderAwardThisGeneration,
    });

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) break;
  }

  games.push({ generations, theoreticalSingleTicket, theoreticalAllFamilies });
}

const byTier = Object.fromEntries([1, 2, 3].map(tier => {
  const rows = samples.filter(row => row.tier === tier);
  return [String(tier), {
    samples: rows.length,
    share: rows.length / samples.length,
    scoreMean: mean(rows.map(row => row.score)),
    commercialWealthMean: mean(rows.map(row => row.commercialWealth)),
    capHitRate: rows.length ? rows.filter(row => row.capHit).length / rows.length : 0,
    representedFamiliesMean: mean(rows.map(row => row.representedFamilies)),
    actualAwardMean: mean(rows.map(row => row.actualAward)),
  }];
}));

const scoreDistribution = Object.fromEntries([
  ['0', row => row.score === 0],
  ['1', row => row.score === 1],
  ['2', row => row.score === 2],
  ['3-4', row => row.score >= 3 && row.score <= 4],
  ['5-7', row => row.score >= 5 && row.score <= 7],
  ['8+', row => row.score >= 8],
].map(([label, predicate]) => [label, samples.filter(predicate).length]));

const representedDistribution = Object.fromEntries([0, 1, 2, 3].map(count => [String(count), samples.filter(row => row.representedFamilies === count).length]));
const summary = {
  games: GAMES,
  simulationVersion: '0.11.29-sim',
  generationSamples: samples.length,
  generationMean: mean(games.map(row => row.generations)),
  guildScoreMeanPerGeneration: mean(samples.map(row => row.score)),
  guildCommercialWealthMean: mean(samples.map(row => row.commercialWealth)),
  actualGuildPrestigePerGame: actualGuildPrestige / GAMES,
  theoreticalSingleFamilyAlwaysRepresentedPerGame: mean(games.map(row => row.theoreticalSingleTicket)),
  theoreticalAllFamiliesAlwaysRepresentedPerGame: mean(games.map(row => row.theoreticalAllFamilies)),
  captureEfficiency: theoreticalAllFamilies ? actualGuildPrestige / theoreticalAllFamilies : 0,
  freeRiderPrestigePerGame: freeRiderPrestige / GAMES,
  freeRiderShareOfActualGuildPrestige: actualGuildPrestige ? freeRiderPrestige / actualGuildPrestige : 0,
  freeRiderShareOfRepresentedAwards: representedAwards ? freeRiderAwards / representedAwards : 0,
  byTier,
  scoreDistribution,
  representedDistribution,
};

fs.mkdirSync('simulation-results', { recursive: true });
const output = 'simulation-results/merchant-guild-power-v137.json';
fs.writeFileSync(output, JSON.stringify({ summary, samples, games }, null, 2));
console.log(JSON.stringify(summary));
