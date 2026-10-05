import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=v01129-100-balance-summary');
const GAMES = 100;
const MAX_GENERATIONS = 60;
const RENOWN_TRIGGER = 12;
const INSTITUTIONS = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];
const INSTITUTION_LABELS = {
  city_guard: 'City Guard',
  temple: 'Temple',
  merchant_guild: 'Merchant Guild',
  scholarium: 'Scholarium',
};

const n = value => Number(value) || 0;
const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const median = values => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const stats = values => ({
  mean: mean(values), median: median(values), min: values.length ? Math.min(...values) : 0, max: values.length ? Math.max(...values) : 0,
});
const agentCount = (player, institutionId) => (player.institutionAgentRoster ?? []).filter(agent => agent.institutionId === institutionId).length;
const tierOf = (state, institutionId) => Math.max(1, Math.min(3, Math.floor(n((state.institutions ?? []).find(row => row.id === institutionId)?.tier) || 1)));
const dist = (values, keys) => Object.fromEntries(keys.map(key => [String(key), values.filter(v => v === key).length]));

const finals = [];
const institution = Object.fromEntries(INSTITUTIONS.map(id => [id, {
  prestige: 0,
  influence: 0,
  scoreSamples: [],
  representedSamples: [],
  finalTier: [],
  finalAgents: [],
  finalRepresented: [],
}]));

for (let game = 0; game < GAMES; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;
  let generations = 0;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (!state.externalRelations?.active && n(state.city?.population) >= 3 && typeof engine.activateExternalRelations === 'function') {
      engine.activateExternalRelations(state);
    }

    const summary = engine.resolveAutomatedGeneration(state);
    generations += 1;

    for (const id of INSTITUTIONS) {
      institution[id].scoreSamples.push(Math.max(0, n(summary.institutionScores?.[id]?.score)));
      institution[id].representedSamples.push(state.players.filter(player => agentCount(player, id) > 0).length);
    }
    for (const award of summary.institutionPrestigeAwards ?? []) {
      if (institution[award.institutionId]) institution[award.institutionId].prestige += Math.max(0, n(award.amount));
    }
    for (const correction of summary.agentInfluenceCapCorrections ?? []) {
      for (const id of INSTITUTIONS) {
        institution[id].influence += Math.max(0, n(correction.byInstitution?.[id]?.received));
      }
    }

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) break;
  }

  for (const id of INSTITUTIONS) {
    institution[id].finalTier.push(tierOf(state, id));
    institution[id].finalAgents.push(state.players.reduce((sum, player) => sum + agentCount(player, id), 0));
    institution[id].finalRepresented.push(state.players.filter(player => agentCount(player, id) > 0).length);
  }

  finals.push({
    game: game + 1,
    generations,
    population: n(state.city?.population),
    squalor: n(state.city?.squalor),
    order: n(state.city?.order),
    force: n(state.city?.force),
    renown: n(state.city?.renown),
    militaryMercantile: n(state.city?.militaryMercantile),
    religionArcane: n(state.city?.religionArcane),
    fortificationLevel: n(state.city?.fortificationLevel),
    imperialIntervention: n(state.city?.imperialIntervention),
    totalFamilyWealth: state.players.reduce((sum, player) => sum + n(player.wealthCapacity), 0),
    totalFamilyInfluence: state.players.reduce((sum, player) => sum + n(player.influence), 0),
  });
}

const city = {
  generations: stats(finals.map(row => row.generations)),
  population: stats(finals.map(row => row.population)),
  squalor: stats(finals.map(row => row.squalor)),
  order: stats(finals.map(row => row.order)),
  force: stats(finals.map(row => row.force)),
  renown: stats(finals.map(row => row.renown)),
  fortificationLevel: stats(finals.map(row => row.fortificationLevel)),
  imperialIntervention: stats(finals.map(row => row.imperialIntervention)),
  totalFamilyWealth: stats(finals.map(row => row.totalFamilyWealth)),
  totalFamilyInfluence: stats(finals.map(row => row.totalFamilyInfluence)),
  militaryMercantile: {
    ...stats(finals.map(row => row.militaryMercantile)),
    distribution: dist(finals.map(row => row.militaryMercantile), [-2, -1, 0, 1, 2]),
    note: '-2 Military II, -1 Military I, 0 Neutral, +1 Mercantile I, +2 Mercantile II',
  },
  religionArcane: {
    ...stats(finals.map(row => row.religionArcane)),
    distribution: dist(finals.map(row => row.religionArcane), [-2, -1, 0, 1, 2]),
    note: '-2 Arcane II, -1 Arcane I, 0 Neutral, +1 Religion I, +2 Religion II',
  },
};

const institutions = Object.fromEntries(INSTITUTIONS.map(id => {
  const row = institution[id];
  return [id, {
    label: INSTITUTION_LABELS[id],
    prestigePerGame: row.prestige / GAMES,
    influencePerGame: row.influence / GAMES,
    scoreMeanPerGeneration: mean(row.scoreSamples),
    representedFamiliesMeanPerGeneration: mean(row.representedSamples),
    finalTierMean: mean(row.finalTier),
    finalTierDistribution: dist(row.finalTier, [1, 2, 3]),
    finalAgentsMean: mean(row.finalAgents),
    finalRepresentedFamiliesMean: mean(row.finalRepresented),
  }];
}));

const result = {
  games: GAMES,
  simulationVersion: engine.V137_VERSION ?? '0.11.29-sim',
  relations: 'active from Population 3',
  city,
  institutions,
  finals,
};

fs.mkdirSync('simulation-results', { recursive: true });
fs.writeFileSync('simulation-results/v01129-100-balance-summary.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ games: result.games, simulationVersion: result.simulationVersion, city: result.city, institutions: result.institutions }, null, 2));
