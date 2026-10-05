import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=institution-ticket-v137');
const GAMES = Math.max(1, Number(process.env.GAMES) || 500);
const MAX_GENERATIONS = 60;
const RENOWN_TRIGGER = 12;
const IDS = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];
const n = value => Number(value) || 0;
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const agentCount = (player, id) => (player.institutionAgentRoster ?? []).filter(agent => agent.institutionId === id).length;

const gameRows = [];
const generationRows = [];
for (let game = 0; game < GAMES; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;
  const ticket = Object.fromEntries(IDS.map(id => [id, 0]));
  const actual = Object.fromEntries(IDS.map(id => [id, 0]));
  let generations = 0;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (!state.externalRelations?.active && n(state.city?.population) >= 3) engine.activateExternalRelations(state);
    const summary = engine.resolveAutomatedGeneration(state);
    generations += 1;
    const row = { game, generation: generations };

    for (const id of IDS) {
      const score = Math.max(0, n(summary.institutionScores?.[id]?.score));
      const represented = state.players.filter(player => agentCount(player, id) > 0).length;
      const awards = (summary.institutionPrestigeAwards ?? []).filter(award => award.institutionId === id);
      const award = awards.reduce((sum, item) => sum + Math.max(0, n(item.amount)), 0);
      ticket[id] += score;
      actual[id] += award;
      row[`${id}Score`] = score;
      row[`${id}Represented`] = represented;
      row[`${id}Award`] = award;
    }
    generationRows.push(row);
    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) break;
  }
  gameRows.push({ generations, ticket, actual });
}

const byInstitution = Object.fromEntries(IDS.map(id => {
  const scores = generationRows.map(row => row[`${id}Score`]);
  const represented = generationRows.map(row => row[`${id}Represented`]);
  const actual = gameRows.map(row => row.actual[id]);
  const ticket = gameRows.map(row => row.ticket[id]);
  return [id, {
    scoreMeanPerGeneration: mean(scores),
    zeroScoreRate: scores.filter(value => value === 0).length / scores.length,
    representedFamiliesMean: mean(represented),
    theoreticalOneAgentAlwaysPresentPrestigePerGame: mean(ticket),
    actualPrestigePerGame: mean(actual),
    actualToSingleTicketRatio: mean(ticket) ? mean(actual) / mean(ticket) : 0,
  }];
}));

const summary = {
  games: GAMES,
  simulationVersion: '0.11.29-sim',
  generationMean: mean(gameRows.map(row => row.generations)),
  byInstitution,
};

fs.mkdirSync('simulation-results', { recursive: true });
fs.writeFileSync('simulation-results/institution-ticket-v137.json', JSON.stringify({ summary, gameRows, generationRows }, null, 2));
console.log(JSON.stringify(summary));
