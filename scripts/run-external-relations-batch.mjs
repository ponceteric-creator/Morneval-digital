import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=external-relations-batch');

const MODE = process.env.EXTERNAL_RELATIONS === 'off' ? 'baseline' : 'relations';
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;

function n(v) { return Number(v) || 0; }
function mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
function sorted(a) { return [...a].sort((x, y) => x - y); }
function median(a) { const s = sorted(a), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function keyLevel(v) { return String(Math.max(-3, Math.min(3, Math.trunc(n(v))))); }
function substantiveAction(a) {
  if (!a || a.freeAction) return false;
  const k = String(a.actionKind ?? a.type ?? '').toLowerCase();
  return k && k !== 'pass' && !k.includes('pass action');
}
function personalityKey(p) { return p.aiPersonality ?? 'unknown'; }

const nationIds = ['elves', 'gnomes', 'orcs', 'mainland'];
const rows = [];
const aggregateLevelTime = Object.fromEntries(nationIds.map(id => [id, Object.fromEntries([-3,-2,-1,0,1,2,3].map(v => [String(v), 0]))]));
const questEver = { elves: 0, gnomes: 0, orcs: 0 };
const plus2Ever = { elves: 0, gnomes: 0, orcs: 0 };
const plus3Ever = { elves: 0, gnomes: 0, orcs: 0 };
let totalMaintenanceInfluence = 0;
let totalUnpaidStakeMaintenance = 0;
let totalOrcRaidLoss = 0;
let totalElvenFarmConversions = 0;
let totalGnomeAllianceGrowthFood = 0;
let activatedGames = 0;

for (let i = 0; i < GAMES; i += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (246813579 + Math.imul(i + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[i % state.players.length].id;

  let triggerGeneration = null;
  let actions = 0;
  let activationGeneration = null;
  let maintenanceInfluence = 0;
  let unpaidStakeMaintenance = 0;
  let orcRaidLoss = 0;
  let elvenFarmConversions = 0;
  let gnomeAllianceGrowthFood = 0;
  const localQuestEver = { elves: false, gnomes: false, orcs: false };
  const localPlus2Ever = { elves: false, gnomes: false, orcs: false };
  const localPlus3Ever = { elves: false, gnomes: false, orcs: false };
  const localLevelTime = Object.fromEntries(nationIds.map(id => [id, Object.fromEntries([-3,-2,-1,0,1,2,3].map(v => [String(v), 0]))]));

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (MODE === 'relations' && !state.externalRelations?.active && n(state.city?.population) >= 3) {
      engine.activateExternalRelations(state);
      activationGeneration = n(state.generation);
      activatedGames += 1;
    }

    const summary = engine.resolveAutomatedGeneration(state);
    actions += (summary.actions ?? []).filter(substantiveAction).length;

    const ext = summary.externalRelations ?? {};
    const levels = ext.levelsAfter ?? ext.levels ?? state.externalRelations?.levels ?? {};
    if (state.externalRelations?.active) {
      for (const nation of nationIds) {
        const level = keyLevel(levels[nation]);
        localLevelTime[nation][level] += 1;
        aggregateLevelTime[nation][level] += 1;
      }
      for (const nation of ['elves', 'gnomes', 'orcs']) {
        if (n(levels[nation]) >= 2) localPlus2Ever[nation] = true;
        if (n(levels[nation]) >= 3) localPlus3Ever[nation] = true;
        if (ext.questEligible?.[nation] || (nation === 'elves' && ext.elvenAllianceQuest?.readyToComplete)) localQuestEver[nation] = true;
      }

      const maintenanceRows = ext.gnomeStakeMaintenance ?? [];
      maintenanceInfluence += maintenanceRows.reduce((sum, row) => sum + n(row.influenceSpent), 0);
      unpaidStakeMaintenance += maintenanceRows.reduce((sum, row) => sum + (row.inactive ?? []).length, 0);
      orcRaidLoss += n(ext.orcRaid?.totalLoss);
      if (ext.elvenWarConversion) elvenFarmConversions += 1;
      gnomeAllianceGrowthFood += n(ext.gnomeExcessRawFoodFromAlliance);
    }

    if (state.endgame?.triggered || n(state.city?.renown) >= RENOWN_TRIGGER) {
      triggerGeneration = n(state.endgame?.triggerGeneration) || n(summary.generation) || step + 1;
      break;
    }
  }

  for (const nation of ['elves', 'gnomes', 'orcs']) {
    if (localQuestEver[nation]) questEver[nation] += 1;
    if (localPlus2Ever[nation]) plus2Ever[nation] += 1;
    if (localPlus3Ever[nation]) plus3Ever[nation] += 1;
  }
  totalMaintenanceInfluence += maintenanceInfluence;
  totalUnpaidStakeMaintenance += unpaidStakeMaintenance;
  totalOrcRaidLoss += orcRaidLoss;
  totalElvenFarmConversions += elvenFarmConversions;
  totalGnomeAllianceGrowthFood += gnomeAllianceGrowthFood;

  const finalLevels = { ...(state.externalRelations?.levels ?? { elves: 0, gnomes: 0, orcs: 0, mainland: 2 }) };
  const maxPrestige = Math.max(...state.players.map(p => n(p.prestige)));
  const winners = state.players.filter(p => n(p.prestige) === maxPrestige).map(personalityKey);
  rows.push({
    game: i + 1,
    reached: triggerGeneration != null,
    generation: triggerGeneration ?? MAX_GENERATIONS,
    estimatedMinutes: actions + 5 * (triggerGeneration ?? MAX_GENERATIONS),
    population: n(state.city?.population),
    renown: n(state.city?.renown),
    activationGeneration,
    finalLevels,
    forestCount: engine.countActiveForests(state),
    force: n(state.city?.force),
    militaryMercantile: n(state.city?.militaryMercantile),
    effects: { maintenanceInfluence, unpaidStakeMaintenance, orcRaidLoss, elvenFarmConversions, gnomeAllianceGrowthFood },
    questEver: localQuestEver,
    plus2Ever: localPlus2Ever,
    plus3Ever: localPlus3Ever,
    levelTime: localLevelTime,
    winners,
  });
}

const wins = { dynast: 0, merchant: 0, contrarian: 0, tie: 0 };
for (const row of rows) {
  if (row.winners.length !== 1) wins.tie += 1;
  else wins[row.winners[0]] = (wins[row.winners[0]] ?? 0) + 1;
}

const activationRows = rows.filter(r => r.activationGeneration != null);
const finalDistribution = Object.fromEntries(nationIds.map(nation => [nation,
  Object.fromEntries([-3,-2,-1,0,1,2,3].map(level => [String(level), rows.filter(r => keyLevel(r.finalLevels[nation]) === String(level)).length]))
]));
const activeGenerations = Object.values(aggregateLevelTime.elves).reduce((s, v) => s + v, 0);
const levelTimeShare = Object.fromEntries(nationIds.map(nation => [nation,
  Object.fromEntries(Object.entries(aggregateLevelTime[nation]).map(([level, count]) => [level, activeGenerations ? count / activeGenerations : 0]))
]));

const summary = {
  mode: MODE,
  games: GAMES,
  reachedEndgame: rows.filter(r => r.reached).length,
  generation: {
    mean: mean(rows.map(r => r.generation)),
    median: median(rows.map(r => r.generation)),
    min: Math.min(...rows.map(r => r.generation)),
    max: Math.max(...rows.map(r => r.generation)),
  },
  estimatedMinutes: { mean: mean(rows.map(r => r.estimatedMinutes)), median: median(rows.map(r => r.estimatedMinutes)) },
  populationMean: mean(rows.map(r => r.population)),
  wins,
  activation: {
    standInRule: 'Activate Meet the Neighbours diplomacy when Population first reaches 3.',
    gamesActivated: activatedGames,
    generationMean: activationRows.length ? mean(activationRows.map(r => r.activationGeneration)) : null,
    generationMedian: activationRows.length ? median(activationRows.map(r => r.activationGeneration)) : null,
  },
  finalRelationMean: Object.fromEntries(nationIds.map(id => [id, mean(rows.map(r => n(r.finalLevels[id])))])),
  finalDistribution,
  levelTimeShare,
  thresholdReachGames: { plus2: plus2Ever, plus3: plus3Ever, questEligible: questEver },
  effectsPerGame: {
    gnomeStakeMaintenanceInfluence: totalMaintenanceInfluence / GAMES,
    gnomeUnpaidStakeMaintenance: totalUnpaidStakeMaintenance / GAMES,
    orcProductionRaided: totalOrcRaidLoss / GAMES,
    elvenFarmToForestConversions: totalElvenFarmConversions / GAMES,
    gnomeAllianceGrowthFood: totalGnomeAllianceGrowthFood / GAMES,
  },
  finalForestCountMean: mean(rows.map(r => r.forestCount)),
  finalForceMean: mean(rows.map(r => r.force)),
  notes: [
    'Raw Food subsistence is 2 per Population in this simulation.',
    'The Elven-strategy AI can choose Reforestation and Study the Elf Ways, values Scholarium access for the Quest, and auto-completes One with the Forest when all three conditions are met.',
    'Gnome Improve Land, Orc Food Trading, and Imperial Appeasement are still exposed as rule hooks rather than deliberate automated AI choices.',
    'Mainland exact Imperial Aid/Demand numeric modifiers remain intentionally pending.',
  ],
};

fs.mkdirSync('simulation-results', { recursive: true });
const path = `simulation-results/external-relations-${MODE}.json`;
fs.writeFileSync(path, JSON.stringify({ summary, rows }, null, 2));
console.log(`WROTE ${path}`);
console.log(JSON.stringify(summary));
