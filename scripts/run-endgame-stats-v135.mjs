import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=endgame-stats-v135');

const MODE = process.env.EXTERNAL_RELATIONS === 'off' ? 'baseline' : 'relations';
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;

function n(v) { return Number(v) || 0; }
function mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
function sorted(a) { return [...a].sort((x, y) => x - y); }
function median(a) {
  const s = sorted(a);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function stats(values) {
  const s = sorted(values);
  return {
    mean: mean(values),
    median: median(values),
    min: s[0] ?? 0,
    max: s.at(-1) ?? 0,
  };
}

const rows = [];

for (let i = 0; i < GAMES; i += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(i + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[i % state.players.length].id;

  let triggerGeneration = null;
  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (MODE === 'relations' && !state.externalRelations?.active && n(state.city?.population) >= 3) {
      engine.activateExternalRelations(state);
    }

    const summary = engine.resolveAutomatedGeneration(state);
    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) {
      triggerGeneration = n(state.endgame?.triggerGeneration) || n(summary.generation) || step + 1;
      break;
    }
  }

  const prestigeRows = state.players.map(player => ({
    playerId: player.id,
    personality: player.aiPersonality ?? 'unknown',
    prestige: n(player.prestige),
  }));
  const prestigeSorted = [...prestigeRows].sort((a, b) => b.prestige - a.prestige);

  rows.push({
    game: i + 1,
    generation: triggerGeneration ?? MAX_GENERATIONS,
    population: n(state.city?.population),
    squalor: n(state.city?.squalor),
    prestige: prestigeRows,
    winnerPrestige: prestigeSorted[0]?.prestige ?? 0,
    runnerUpPrestige: prestigeSorted[1]?.prestige ?? 0,
    lastPrestige: prestigeSorted.at(-1)?.prestige ?? 0,
    winnerRunnerUpGap: (prestigeSorted[0]?.prestige ?? 0) - (prestigeSorted[1]?.prestige ?? 0),
    winnerLastGap: (prestigeSorted[0]?.prestige ?? 0) - (prestigeSorted.at(-1)?.prestige ?? 0),
    tiedForFirst: (prestigeSorted[0]?.prestige ?? 0) === (prestigeSorted[1]?.prestige ?? 0),
  });
}

const personalities = [...new Set(rows.flatMap(row => row.prestige.map(p => p.personality)))];
const summary = {
  mode: MODE,
  games: GAMES,
  simulationVersion: '0.11.27-sim',
  generation: stats(rows.map(r => r.generation)),
  finalPopulation: stats(rows.map(r => r.population)),
  finalSqualor: stats(rows.map(r => r.squalor)),
  finalPrestige: {
    winner: stats(rows.map(r => r.winnerPrestige)),
    runnerUp: stats(rows.map(r => r.runnerUpPrestige)),
    last: stats(rows.map(r => r.lastPrestige)),
    winnerRunnerUpGap: stats(rows.map(r => r.winnerRunnerUpGap)),
    winnerLastGap: stats(rows.map(r => r.winnerLastGap)),
    tiedForFirstGames: rows.filter(r => r.tiedForFirst).length,
    byPersonality: Object.fromEntries(personalities.map(personality => [personality, stats(rows.map(row => row.prestige.find(p => p.personality === personality)?.prestige ?? 0))])),
  },
};

fs.mkdirSync('simulation-results', { recursive: true });
const out = `simulation-results/endgame-stats-v135-${MODE}.json`;
fs.writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
console.log(`WROTE ${out}`);
console.log(JSON.stringify(summary));
