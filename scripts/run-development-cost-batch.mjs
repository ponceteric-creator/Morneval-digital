import * as engine from '../js/v126-base-wealth-engine.js?sim=development-costs';
import fs from 'node:fs';

const MODE = process.env.COST_MODE === 'proposed' ? 'proposed' : 'baseline';
const GAMES = 100;
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;

function n(v) { return Number(v) || 0; }
function mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
function sorted(a) { return [...a].sort((x, y) => x - y); }
function median(a) {
  const s = sorted(a); if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function quantile(a, q) {
  const s = sorted(a); if (!s.length) return 0;
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
function substantiveAction(action) {
  if (!action || action.freeAction) return false;
  const kind = String(action.actionKind ?? action.type ?? '').toLowerCase();
  if (!kind || kind === 'pass' || kind.includes('pass action')) return false;
  return true;
}
function actionKind(action) {
  return String(action?.actionKind ?? action?.type ?? '').toLowerCase();
}
function personalityKey(player) { return player.aiPersonality ?? 'unknown'; }
function countAgents(player) { return (player.institutionAgentRoster ?? []).length; }
function agentByInstitution(player) {
  const out = { city_guard: 0, temple: 0, merchant_guild: 0, scholarium: 0 };
  for (const agent of player.institutionAgentRoster ?? []) if (agent.institutionId in out) out[agent.institutionId] += 1;
  return out;
}
function servedExternal(summary) {
  return (summary.economyReports ?? []).reduce((sum, report) => sum + n(report?.served?.external_markets), 0);
}

const data = [];
for (let i = 0; i < GAMES; i += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(i + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[i % state.players.length].id;

  let actionCount = 0;
  let institutionDev = 0;
  let sectorDev = 0;
  let agentPlacements = 0;
  let politicalBids = 0;
  let externalServed = 0;
  let triggerGeneration = null;
  let lastSummary = null;

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    const summary = engine.resolveAutomatedGeneration(state);
    lastSummary = summary;
    const actions = summary.actions ?? [];
    actionCount += actions.filter(substantiveAction).length;
    for (const action of actions) {
      const k = actionKind(action);
      if (k === 'institution_development' || String(action.type ?? '').startsWith('Institution development:')) institutionDev += 1;
      if (k === 'sector_development' || k === 'development' || String(action.type ?? '').toLowerCase().includes('sector_development')) sectorDev += 1;
      if (k === 'agent_placement' || String(action.type ?? '').startsWith('Agent placement:')) agentPlacements += 1;
      if (k === 'city_inclination_bid' || action.politicalBid) politicalBids += 1;
    }
    externalServed += servedExternal(summary);

    const currentRenown = n(state.city?.renown);
    const reached = state.endgame?.triggered || currentRenown >= RENOWN_TRIGGER;
    if (reached) {
      triggerGeneration = n(state.endgame?.triggerGeneration) || n(summary.generation) || Math.max(1, n(state.generation) - 1);
      break;
    }
  }

  const prestigeMax = Math.max(...state.players.map(p => n(p.prestige)));
  const winners = state.players.filter(p => n(p.prestige) === prestigeMax).map(personalityKey);
  const breakdown = state.city?.renownBreakdown ?? {};
  const institutionTiers = Object.fromEntries((state.institutions ?? []).map(x => [x.id, n(x.tier)]));
  const productionTiers = Object.fromEntries((state.productionSectors ?? []).filter(x => x.id !== 'food').map(x => [x.id, n(x.tier)]));

  data.push({
    game: i + 1,
    seed: state.rngState >>> 0,
    reached: triggerGeneration != null,
    generation: triggerGeneration ?? MAX_GENERATIONS,
    actions: actionCount,
    estimatedMinutes: actionCount + 5 * (triggerGeneration ?? MAX_GENERATIONS),
    renown: n(state.city?.renown),
    population: n(state.city?.population),
    axis: {
      militaryMercantile: n(state.city?.militaryMercantile),
      religionArcane: n(state.city?.religionArcane),
    },
    renownBreakdown: {
      populationRenown: n(breakdown.populationRenown),
      productionRenown: n(breakdown.productionRenown),
      institutionRenown: n(breakdown.institutionRenown),
      permanentCardRenown: n(breakdown.permanentCardRenown),
    },
    institutionTiers,
    productionTiers,
    allInstitutionsT3: Object.values(institutionTiers).length === 4 && Object.values(institutionTiers).every(v => v >= 3),
    institutionDev,
    sectorDev,
    agentPlacements,
    politicalBids,
    externalServedCumulative: externalServed,
    winners,
    players: state.players.map(p => ({
      personality: personalityKey(p),
      prestige: n(p.prestige), influence: n(p.influence), wealth: n(p.wealthCapacity),
      agents: countAgents(p), agentsByInstitution: agentByInstitution(p),
      stakes: (p.productionStakes ?? []).length,
    })),
  });
}

const generations = data.map(x => x.generation);
const minutes = data.map(x => x.estimatedMinutes);
const wins = { dynast: 0, merchant: 0, contrarian: 0, tie: 0 };
for (const row of data) {
  if (row.winners.length !== 1) wins.tie += 1;
  else wins[row.winners[0]] = (wins[row.winners[0]] ?? 0) + 1;
}

const personalities = ['dynast', 'merchant', 'contrarian'];
const playerSummary = {};
for (const key of personalities) {
  const rows = data.map(g => g.players.find(p => p.personality === key)).filter(Boolean);
  playerSummary[key] = {
    prestigeMean: mean(rows.map(p => p.prestige)),
    influenceMean: mean(rows.map(p => p.influence)),
    wealthMean: mean(rows.map(p => p.wealth)),
    agentsMean: mean(rows.map(p => p.agents)),
    stakesMean: mean(rows.map(p => p.stakes)),
    agentsByInstitutionMean: Object.fromEntries(['city_guard','temple','merchant_guild','scholarium'].map(id => [id, mean(rows.map(p => p.agentsByInstitution[id]))])),
  };
}

const institutionIds = ['city_guard','temple','merchant_guild','scholarium'];
const productionIds = ['textiles','smithing','materials'];
const summary = {
  mode: MODE,
  games: GAMES,
  reached: data.filter(x => x.reached).length,
  generation: { mean: mean(generations), median: median(generations), min: Math.min(...generations), max: Math.max(...generations), q1: quantile(generations, .25), q3: quantile(generations, .75) },
  estimatedMinutes: { mean: mean(minutes), median: median(minutes), min: Math.min(...minutes), max: Math.max(...minutes) },
  populationMean: mean(data.map(x => x.population)),
  wins,
  players: playerSummary,
  actions: {
    mean: mean(data.map(x => x.actions)),
    institutionDevelopmentMean: mean(data.map(x => x.institutionDev)),
    sectorDevelopmentMean: mean(data.map(x => x.sectorDev)),
    agentPlacementsMean: mean(data.map(x => x.agentPlacements)),
    politicalBidsMean: mean(data.map(x => x.politicalBids)),
  },
  externalServedCumulativeMean: mean(data.map(x => x.externalServedCumulative)),
  allInstitutionsT3Count: data.filter(x => x.allInstitutionsT3).length,
  institutionTierMean: Object.fromEntries(institutionIds.map(id => [id, mean(data.map(x => x.institutionTiers[id] ?? 1))])),
  institutionTier3Count: Object.fromEntries(institutionIds.map(id => [id, data.filter(x => (x.institutionTiers[id] ?? 1) >= 3).length])),
  productionTierMean: Object.fromEntries(productionIds.map(id => [id, mean(data.map(x => x.productionTiers[id] ?? 1))])),
  renownBreakdownMean: Object.fromEntries(['populationRenown','productionRenown','institutionRenown','permanentCardRenown'].map(k => [k, mean(data.map(x => x.renownBreakdown[k]))])),
  axisMilitaryMercantile: Object.fromEntries([-2,-1,0,1,2].map(v => [String(v), data.filter(x => x.axis.militaryMercantile === v).length])),
  axisReligionArcane: Object.fromEntries([-2,-1,0,1,2].map(v => [String(v), data.filter(x => x.axis.religionArcane === v).length])),
};

const out = { summary, data };
const path = `simulation-results/development-costs-${MODE}.json`;
fs.mkdirSync('simulation-results', { recursive: true });
fs.writeFileSync(path, JSON.stringify(out, null, 2));
console.log(`WROTE ${path}`);
console.log(JSON.stringify(summary));
