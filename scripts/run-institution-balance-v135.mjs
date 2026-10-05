import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=institution-balance-v135');

const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const MODE = process.env.EXTERNAL_RELATIONS === 'off' ? 'baseline' : 'relations';
const MAX_GENERATIONS = 60;
const RENOWN_TRIGGER = 12;
const IDS = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];

function n(v) { return Number(v) || 0; }
function mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
function sorted(a) { return [...a].sort((a,b) => a-b); }
function median(a) { const s = sorted(a); if (!s.length) return null; const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2; }
function emptyById(value = 0) { return Object.fromEntries(IDS.map(id => [id, value])); }
function agentCount(player, id) { return (player?.institutionAgentRoster ?? []).filter(a => a.institutionId === id).length; }
function tier(state, id) { return Math.max(1, Math.min(3, Math.floor(n((state.institutions ?? []).find(x => x.id === id)?.tier) || 1))); }

const totals = Object.fromEntries(IDS.map(id => [id, {
  scoreSamples: [],
  prestigePerGeneration: [],
  prestigeTotal: 0,
  influencePerGeneration: [],
  influenceTotal: 0,
  associatedFamiliesSamples: [],
  agentsSamples: [],
  developmentActions: 0,
  finalTier: [],
  finalAgents: [],
  finalAssociatedFamilies: [],
  gamesTier2Plus: 0,
  gamesTier3: 0,
  gamesAnyAgent: 0,
}]));

const gameRows = [];

for (let i = 0; i < GAMES; i += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(i + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[i % state.players.length].id;

  const gamePrestige = emptyById();
  const gameInfluence = emptyById();
  const gameDevelopment = emptyById();
  let generations = 0;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (MODE === 'relations' && !state.externalRelations?.active && n(state.city?.population) >= 3) {
      engine.activateExternalRelations(state);
    }

    const summary = engine.resolveAutomatedGeneration(state);
    generations += 1;

    const awards = summary.institutionPrestigeAwards ?? [];
    for (const id of IDS) {
      const score = Math.max(0, n(summary.institutionScores?.[id]?.score));
      const prestige = awards.filter(row => row.institutionId === id).reduce((s, row) => s + Math.max(0, n(row.amount)), 0);
      let influence = 0;
      for (const corr of summary.agentInfluenceCapCorrections ?? []) {
        influence += Math.max(0, n(corr.byInstitution?.[id]?.received));
      }
      const associated = state.players.filter(p => agentCount(p, id) > 0).length;
      const agents = state.players.reduce((s, p) => s + agentCount(p, id), 0);

      totals[id].scoreSamples.push(score);
      totals[id].prestigePerGeneration.push(prestige);
      totals[id].prestigeTotal += prestige;
      totals[id].influencePerGeneration.push(influence);
      totals[id].influenceTotal += influence;
      totals[id].associatedFamiliesSamples.push(associated);
      totals[id].agentsSamples.push(agents);
      gamePrestige[id] += prestige;
      gameInfluence[id] += influence;
    }

    const actions = [
      ...(summary.actions ?? []),
      ...(summary.institutionDevelopmentActions ?? []),
    ];
    const seen = new Set();
    for (const action of actions) {
      if (action?.actionKind !== 'institution_development') continue;
      const id = action.institutionId;
      if (!IDS.includes(id)) continue;
      const key = `${action.playerId}|${id}|${action.phase}|${summary.generation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      totals[id].developmentActions += 1;
      gameDevelopment[id] += 1;
    }

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) break;
  }

  const final = {};
  for (const id of IDS) {
    const t = tier(state, id);
    const agents = state.players.reduce((s, p) => s + agentCount(p, id), 0);
    const associated = state.players.filter(p => agentCount(p, id) > 0).length;
    totals[id].finalTier.push(t);
    totals[id].finalAgents.push(agents);
    totals[id].finalAssociatedFamilies.push(associated);
    if (t >= 2) totals[id].gamesTier2Plus += 1;
    if (t >= 3) totals[id].gamesTier3 += 1;
    if (agents > 0) totals[id].gamesAnyAgent += 1;
    final[id] = { tier: t, agents, associatedFamilies: associated, prestige: gamePrestige[id], influence: gameInfluence[id], developmentActions: gameDevelopment[id] };
  }
  gameRows.push({ game: i + 1, generations, final });
}

const byInstitution = Object.fromEntries(IDS.map(id => {
  const x = totals[id];
  const tierDistribution = { 1: 0, 2: 0, 3: 0 };
  for (const t of x.finalTier) tierDistribution[t] += 1;
  return [id, {
    generationSamples: x.scoreSamples.length,
    institutionScoreMean: mean(x.scoreSamples),
    institutionScoreMedian: median(x.scoreSamples),
    prestigeAwardedPerGenerationMean: mean(x.prestigePerGeneration),
    prestigeAwardedPerGameMean: x.prestigeTotal / GAMES,
    agentInfluencePerGenerationMean: mean(x.influencePerGeneration),
    agentInfluencePerGameMean: x.influenceTotal / GAMES,
    associatedFamiliesPerGenerationMean: mean(x.associatedFamiliesSamples),
    agentsPerGenerationMean: mean(x.agentsSamples),
    developmentActionsPerGame: x.developmentActions / GAMES,
    finalTierMean: mean(x.finalTier),
    finalTierDistribution: tierDistribution,
    gamesTier2Plus: x.gamesTier2Plus,
    gamesTier3: x.gamesTier3,
    finalAgentsMean: mean(x.finalAgents),
    finalAssociatedFamiliesMean: mean(x.finalAssociatedFamilies),
    gamesAnyAgent: x.gamesAnyAgent,
  }];
}));

const summary = {
  mode: MODE,
  games: GAMES,
  simulationVersion: gameRows.length ? '0.11.27-sim' : null,
  generationsMean: mean(gameRows.map(r => r.generations)),
  byInstitution,
  notes: [
    'Prestige awarded counts recurring Institution prestige actually granted to represented families each generation.',
    'Agent Influence counts capped Influence actually received from each Institution via Agent seniority.',
    'Associated families means families with at least one Agent in the Institution.',
  ],
};

fs.mkdirSync('simulation-results', { recursive: true });
const out = `simulation-results/institution-balance-v135-${MODE}.json`;
fs.writeFileSync(out, JSON.stringify({ summary, games: gameRows }, null, 2));
console.log(`WROTE ${out}`);
console.log(JSON.stringify(summary));
