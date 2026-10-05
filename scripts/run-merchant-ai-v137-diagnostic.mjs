import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=merchant-ai-v137');
const GAMES = Math.max(1, Number(process.env.GAMES) || 500);
const master = process.env.MERCHANT_AI_V137 !== 'off';
const ruleCompat = master && process.env.MERCHANT_GUILD_RULE_COMPAT_V137 !== 'off';
const aiScore = master && process.env.MERCHANT_GUILD_AI_SCORE_V137 !== 'off';
const marginal = master && process.env.INSTITUTION_AGENT_MARGINAL_V137 !== 'off';
const MODE = !master ? 'legacy'
  : ruleCompat && !aiScore && !marginal ? 'rule_only'
  : ruleCompat && !aiScore && marginal ? 'rule_marginal'
  : ruleCompat && aiScore && marginal ? 'rule_full_ai'
  : 'mixed';

const MAX_GENERATIONS = 60;
const RENOWN_TRIGGER = 12;
const INSTITUTIONS = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];
const n = value => Number(value) || 0;
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const personality = player => player?.aiPersonality ?? 'unknown';
const agentCount = (player, institutionId) => (player?.institutionAgentRoster ?? []).filter(agent => agent.institutionId === institutionId).length;
const tier = (state, institutionId) => Math.max(1, Math.min(3, Math.floor(n((state.institutions ?? []).find(row => row.id === institutionId)?.tier) || 1)));

const finals = [];
const wins = {};
const prestigeFinal = {};
const samples = {};
const institutionPrestige = Object.fromEntries(INSTITUTIONS.map(id => [id, 0]));
const finalTier = Object.fromEntries(INSTITUTIONS.map(id => [id, []]));
const finalAgents = Object.fromEntries(INSTITUTIONS.map(id => [id, []]));
const prestigeReasons = {};

function sampleRow(key) {
  return samples[key] ??= {
    count: 0, wealth: 0, influence: 0, agents: 0,
    city_guard: 0, temple: 0, merchant_guild: 0, scholarium: 0,
  };
}
function prestigeRow(key) {
  return prestigeReasons[key] ??= {};
}

for (let game = 0; game < GAMES; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;
  let generations = 0;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (!state.externalRelations?.active && n(state.city?.population) >= 3) engine.activateExternalRelations(state);
    const summary = engine.resolveAutomatedGeneration(state);
    generations += 1;

    for (const award of summary.institutionPrestigeAwards ?? []) {
      if (award.institutionId in institutionPrestige) institutionPrestige[award.institutionId] += Math.max(0, n(award.amount));
    }
    for (const result of summary.prestigeScoring ?? []) {
      const player = state.players.find(row => row.id === result.playerId);
      const key = personality(player);
      const reasons = prestigeRow(key);
      for (const entry of result.entries ?? []) {
        const reason = String(entry.reason ?? 'unknown');
        reasons[reason] = (reasons[reason] ?? 0) + n(entry.amount);
      }
    }
    for (const player of state.players) {
      const row = sampleRow(personality(player));
      row.count += 1;
      row.wealth += n(player.wealthCapacity);
      row.influence += n(player.influence);
      row.agents += (player.institutionAgentRoster ?? []).length;
      for (const id of INSTITUTIONS) row[id] += agentCount(player, id);
    }

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) break;
  }

  for (const id of INSTITUTIONS) {
    finalTier[id].push(tier(state, id));
    finalAgents[id].push(state.players.reduce((sum, player) => sum + agentCount(player, id), 0));
  }
  for (const player of state.players) (prestigeFinal[personality(player)] ??= []).push(n(player.prestige));

  const maxPrestige = Math.max(...state.players.map(player => n(player.prestige)));
  const winners = state.players.filter(player => n(player.prestige) === maxPrestige);
  for (const player of winners) wins[personality(player)] = (wins[personality(player)] ?? 0) + 1 / winners.length;

  finals.push({
    generations,
    population: n(state.city?.population),
    squalor: n(state.city?.squalor),
    axis: n(state.city?.militaryMercantile),
    gnomes: n(state.externalRelations?.levels?.gnomes),
    wealth: state.players.reduce((sum, player) => sum + n(player.wealthCapacity), 0),
  });
}

const byPersonality = Object.fromEntries(Object.entries(samples).map(([key, row]) => [key, {
  wealthMean: row.wealth / row.count,
  influenceMean: row.influence / row.count,
  agentsMean: row.agents / row.count,
  guardAgentsMean: row.city_guard / row.count,
  templeAgentsMean: row.temple / row.count,
  merchantAgentsMean: row.merchant_guild / row.count,
  scholariumAgentsMean: row.scholarium / row.count,
  finalPrestigeMean: mean(prestigeFinal[key] ?? []),
  prestigeReasonsPerGame: Object.fromEntries(Object.entries(prestigeReasons[key] ?? {}).map(([reason, value]) => [reason, value / GAMES])),
}]));

const byInstitution = Object.fromEntries(INSTITUTIONS.map(id => [id, {
  prestigePerGame: institutionPrestige[id] / GAMES,
  finalTierMean: mean(finalTier[id]),
  finalAgentsMean: mean(finalAgents[id]),
  finalTierDistribution: Object.fromEntries([1, 2, 3].map(t => [String(t), finalTier[id].filter(value => value === t).length])),
}]));

const summary = {
  mode: MODE,
  patches: { master, ruleCompat, aiScore, marginal },
  games: GAMES,
  simulationVersion: engine.V137_VERSION ?? state?.simulationVersion ?? '0.11.29-sim',
  generationMean: mean(finals.map(row => row.generations)),
  populationMean: mean(finals.map(row => row.population)),
  squalorMean: mean(finals.map(row => row.squalor)),
  finalWealthMean: mean(finals.map(row => row.wealth)),
  finalAxisMean: mean(finals.map(row => row.axis)),
  finalGnomeRelationMean: mean(finals.map(row => row.gnomes)),
  wins,
  byPersonality,
  byInstitution,
};

fs.mkdirSync('simulation-results', { recursive: true });
const output = `simulation-results/merchant-ai-v137-${MODE}.json`;
fs.writeFileSync(output, JSON.stringify({ summary, finals }, null, 2));
console.log(`WROTE ${output}`);
console.log(JSON.stringify(summary));
