import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=start-influence-diagnostic');

const MODE = process.env.EXTERNAL_RELATIONS === 'off' ? 'baseline' : 'relations';
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;

function n(v) { return Number(v) || 0; }
function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}
function bucket(v) {
  if (v <= 0) return '0';
  if (v === 1) return '1';
  if (v === 2) return '2';
  if (v === 3) return '3';
  if (v === 4) return '4';
  return '5+';
}
function phase(generation) {
  if (generation <= 5) return 'early_1_5';
  if (generation <= 12) return 'mid_6_12';
  return 'late_13_plus';
}
function ensure(container, key) {
  container[key] ??= [];
  return container[key];
}

const samplesByPersonality = {};
const samplesByGeneration = {};
const samplesByPhase = {};
let totalGenerations = 0;
let gamesReachedEndgame = 0;

for (let game = 0; game < GAMES; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (MODE === 'relations' && !state.externalRelations?.active && n(state.city?.population) >= 3) {
      engine.activateExternalRelations(state);
    }

    const generation = step + 1;
    totalGenerations += 1;
    for (const player of state.players) {
      const personality = String(player.aiPersonality || 'unknown');
      const value = n(player.influence);
      ensure(samplesByPersonality, personality).push(value);
      samplesByGeneration[generation] ??= {};
      ensure(samplesByGeneration[generation], personality).push(value);
      const ph = phase(generation);
      samplesByPhase[ph] ??= {};
      ensure(samplesByPhase[ph], personality).push(value);
    }

    engine.resolveAutomatedGeneration(state);
    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) {
      gamesReachedEndgame += 1;
      break;
    }
  }
}

function summarize(values) {
  const dist = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
  for (const v of values) dist[bucket(v)] += 1;
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    samples: count,
    mean: count ? sum / count : null,
    median: median(values),
    p25: percentile(values, 0.25),
    p75: percentile(values, 0.75),
    min: count ? Math.min(...values) : null,
    max: count ? Math.max(...values) : null,
    zeroRate: count ? dist['0'] / count : 0,
    atLeastOneRate: count ? 1 - dist['0'] / count : 0,
    atLeastTwoRate: count ? values.filter(v => v >= 2).length / count : 0,
    distributionCount: dist,
    distributionRate: Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, count ? v / count : 0])),
  };
}

const byPersonality = Object.fromEntries(Object.entries(samplesByPersonality).map(([k, values]) => [k, summarize(values)]));
const byGeneration = Object.fromEntries(Object.entries(samplesByGeneration).map(([generation, map]) => [generation,
  Object.fromEntries(Object.entries(map).map(([k, values]) => [k, summarize(values)]))
]));
const byPhase = Object.fromEntries(Object.entries(samplesByPhase).map(([ph, map]) => [ph,
  Object.fromEntries(Object.entries(map).map(([k, values]) => [k, summarize(values)]))
]));

const summary = {
  mode: MODE,
  games: GAMES,
  gamesReachedEndgame,
  totalGenerations,
  samplingPoint: 'Immediately before resolveAutomatedGeneration; in Relations mode, relation activation for Population >= 3 occurs first if applicable.',
  byPersonality,
  byPhase,
  byGeneration,
};

fs.mkdirSync('simulation-results', { recursive: true });
const path = `simulation-results/start-influence-${MODE}.json`;
fs.writeFileSync(path, JSON.stringify(summary, null, 2));
console.log(`WROTE ${path}`);
console.log(JSON.stringify(summary));
