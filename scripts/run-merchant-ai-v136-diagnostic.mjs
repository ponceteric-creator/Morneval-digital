import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=merchant-ai-v136');
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const AI_MODE = process.env.MERCHANT_AI_V136 === 'off' ? 'legacy_ai' : 'corrected_ai';
const MAX_GENERATIONS = 60;
const RENOWN_TRIGGER = 12;
const INSTITUTIONS = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];
const AXES = [-2, -1, 0, 1, 2];

const n = v => Number(v) || 0;
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const pk = p => p.aiPersonality ?? 'unknown';
const agentCount = (p, id) => (p.institutionAgentRoster ?? []).filter(a => a.institutionId === id).length;
const tier = (state, id) => Math.max(1, Math.min(3, Math.floor(n((state.institutions ?? []).find(x => x.id === id)?.tier) || 1)));

const personalities = {};
const institutions = Object.fromEntries(INSTITUTIONS.map(id => [id, {
  prestige: 0,
  scoreSamples: [],
  finalTiers: [],
  finalAgents: [],
}]));
const political = { merchant: 0, military: 0, byPersonality: {} };
const finals = [];
const wins = {};

function personalityRow(key) {
  return personalities[key] ??= { samples: 0, wealth: 0, influence: 0, agents: 0, merchantAgents: 0, guardAgents: 0 };
}
function politicalRow(key) {
  return political.byPersonality[key] ??= { merchant: 0, military: 0 };
}

for (let i = 0; i < GAMES; i += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(i + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[i % state.players.length].id;
  let generations = 0;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (!state.externalRelations?.active && n(state.city?.population) >= 3) engine.activateExternalRelations(state);
    const summary = engine.resolveAutomatedGeneration(state);
    generations += 1;

    for (const id of INSTITUTIONS) {
      institutions[id].scoreSamples.push(Math.max(0, n(summary.institutionScores?.[id]?.score)));
      institutions[id].prestige += (summary.institutionPrestigeAwards ?? [])
        .filter(row => row.institutionId === id)
        .reduce((sum, row) => sum + Math.max(0, n(row.amount)), 0);
    }

    for (const bid of summary.cityInclinationBids?.bids ?? []) {
      if (bid.pole !== 'merchant' && bid.pole !== 'military') continue;
      political[bid.pole] += 1;
      const player = state.players.find(p => p.id === bid.playerId);
      if (player) politicalRow(pk(player))[bid.pole] += 1;
    }

    for (const player of state.players) {
      const row = personalityRow(pk(player));
      row.samples += 1;
      row.wealth += n(player.wealthCapacity);
      row.influence += n(player.influence);
      row.agents += (player.institutionAgentRoster ?? []).length;
      row.merchantAgents += agentCount(player, 'merchant_guild');
      row.guardAgents += agentCount(player, 'city_guard');
    }

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) break;
  }

  for (const id of INSTITUTIONS) {
    institutions[id].finalTiers.push(tier(state, id));
    institutions[id].finalAgents.push(state.players.reduce((sum, p) => sum + agentCount(p, id), 0));
  }

  const maxPrestige = Math.max(...state.players.map(p => n(p.prestige)));
  const winners = state.players.filter(p => n(p.prestige) === maxPrestige).map(pk);
  for (const winner of winners) wins[winner] = (wins[winner] ?? 0) + 1 / winners.length;

  finals.push({
    generations,
    population: n(state.city?.population),
    axis: n(state.city?.militaryMercantile),
    gnomes: n(state.externalRelations?.levels?.gnomes),
    merchantGuildTier: tier(state, 'merchant_guild'),
    totalWealth: state.players.reduce((sum, p) => sum + n(p.wealthCapacity), 0),
    totalInfluence: state.players.reduce((sum, p) => sum + n(p.influence), 0),
  });
}

const byPersonality = Object.fromEntries(Object.entries(personalities).map(([key, row]) => [key, {
  samples: row.samples,
  wealthMean: row.samples ? row.wealth / row.samples : 0,
  influenceMean: row.samples ? row.influence / row.samples : 0,
  agentsMean: row.samples ? row.agents / row.samples : 0,
  merchantAgentsMean: row.samples ? row.merchantAgents / row.samples : 0,
  guardAgentsMean: row.samples ? row.guardAgents / row.samples : 0,
}]));

const byInstitution = Object.fromEntries(INSTITUTIONS.map(id => {
  const row = institutions[id];
  return [id, {
    scoreMean: mean(row.scoreSamples),
    prestigePerGame: row.prestige / GAMES,
    finalTierMean: mean(row.finalTiers),
    finalTierDistribution: Object.fromEntries([1, 2, 3].map(t => [String(t), row.finalTiers.filter(x => x === t).length])),
    finalAgentsMean: mean(row.finalAgents),
  }];
}));

const summary = {
  aiMode: AI_MODE,
  games: GAMES,
  simulationVersion: engine.V136_VERSION ?? state?.simulationVersion ?? null,
  generationMean: mean(finals.map(x => x.generations)),
  populationMean: mean(finals.map(x => x.population)),
  wins,
  byPersonality,
  political: {
    merchantBids: political.merchant,
    militaryBids: political.military,
    merchantToMilitaryRatio: political.military ? political.merchant / political.military : null,
    byPersonality: political.byPersonality,
  },
  finalAxis: {
    mean: mean(finals.map(x => x.axis)),
    distribution: Object.fromEntries(AXES.map(a => [String(a), finals.filter(x => x.axis === a).length])),
  },
  gnomes: {
    mean: mean(finals.map(x => x.gnomes)),
    distribution: Object.fromEntries([-3, -2, -1, 0, 1, 2, 3].map(a => [String(a), finals.filter(x => x.gnomes === a).length])),
  },
  totalWealthFinalMean: mean(finals.map(x => x.totalWealth)),
  totalInfluenceFinalMean: mean(finals.map(x => x.totalInfluence)),
  byInstitution,
};

fs.mkdirSync('simulation-results', { recursive: true });
const out = `simulation-results/merchant-ai-v136-${AI_MODE}.json`;
fs.writeFileSync(out, JSON.stringify({ summary, finals }, null, 2));
console.log(`WROTE ${out}`);
console.log(JSON.stringify(summary));
