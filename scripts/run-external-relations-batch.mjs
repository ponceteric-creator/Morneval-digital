import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=external-relations-batch');

const MODE = process.env.EXTERNAL_RELATIONS === 'off' ? 'baseline' : 'relations';
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;
const RAW_SECTORS = ['food', 'textiles', 'smithing', 'materials'];

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
function emptyRawTotals() { return Object.fromEntries(RAW_SECTORS.map(id => [id, 0])); }
function addRawTotals(target, source) {
  for (const id of RAW_SECTORS) target[id] += n(source?.[id]);
  return target;
}
function sumRaw(source) { return RAW_SECTORS.reduce((sum, id) => sum + n(source?.[id]), 0); }
function demandRequestedTotal(report) {
  const requested = report?.demand?.requested ?? {};
  return n(requested.population) + n(requested.imperial) + n(requested.external_markets);
}
function rawSnapshot(summary, gnomeLevel) {
  const produced = Object.fromEntries(RAW_SECTORS.map(id => [id, Math.max(0, n(summary.rawProductionAfterExpansion?.[id]))]));
  const reports = Object.fromEntries((summary.economyReports ?? []).map(report => [report.sectorId, report]));
  const consumed = {
    food: Math.max(0, n(summary.rawFoodLocalServed))
      + Math.max(0, n(summary.mercenaryContract?.rawFoodConsumed))
      + Math.max(0, n(reports.food?.actualProduction)),
    textiles: Math.max(0, n(reports.textiles?.actualProduction)),
    smithing: Math.max(0, n(reports.smithing?.actualProduction)),
    materials: Math.max(0, n(reports.materials?.actualProduction)),
  };
  const surplus = Object.fromEntries(RAW_SECTORS.map(id => [id, produced[id] - consumed[id]]));
  const bottleneck = {};
  for (const id of RAW_SECTORS) {
    const report = reports[id];
    const refiningNeed = report ? Math.min(Math.max(0, n(report.stakeSupply)), demandRequestedTotal(report)) : 0;
    const refiningCapacity = Math.max(0, n(report?.totalResourceCapacity));
    bottleneck[id] = id === 'food'
      ? n(summary.imperialFoodAid) > 0 || refiningCapacity < refiningNeed
      : refiningCapacity < refiningNeed;
  }
  const totalProduced = sumRaw(produced);
  const totalConsumed = sumRaw(consumed);
  return {
    generation: n(summary.generation),
    gnomeLevel: n(gnomeLevel),
    produced,
    consumed,
    surplus,
    totalProduced,
    totalConsumed,
    totalSurplus: totalProduced - totalConsumed,
    utilization: totalProduced > 0 ? totalConsumed / totalProduced : null,
    bottleneck,
  };
}
function summarizeRawSnapshots(samples) {
  const producedTotals = emptyRawTotals();
  const consumedTotals = emptyRawTotals();
  const surplusTotals = emptyRawTotals();
  const bottleneckCounts = emptyRawTotals();
  for (const sample of samples) {
    addRawTotals(producedTotals, sample.produced);
    addRawTotals(consumedTotals, sample.consumed);
    addRawTotals(surplusTotals, sample.surplus);
    for (const id of RAW_SECTORS) if (sample.bottleneck[id]) bottleneckCounts[id] += 1;
  }
  const totalProduced = sumRaw(producedTotals);
  const totalConsumed = sumRaw(consumedTotals);
  const totalSurplus = sumRaw(surplusTotals);
  return {
    generationSamples: samples.length,
    total: {
      producedPerGenerationMean: samples.length ? totalProduced / samples.length : 0,
      consumedPerGenerationMean: samples.length ? totalConsumed / samples.length : 0,
      surplusPerGenerationMean: samples.length ? totalSurplus / samples.length : 0,
      surplusPerGenerationMedian: median(samples.map(s => s.totalSurplus)),
      weightedUtilization: totalProduced > 0 ? totalConsumed / totalProduced : 0,
      weightedSurplusShare: totalProduced > 0 ? totalSurplus / totalProduced : 0,
      generationsWithAnySurplus: samples.filter(s => s.totalSurplus > 0).length,
      generationsWithZeroOrNegativeSurplus: samples.filter(s => s.totalSurplus <= 0).length,
    },
    bySector: Object.fromEntries(RAW_SECTORS.map(id => {
      const produced = producedTotals[id];
      const consumed = consumedTotals[id];
      const surplus = surplusTotals[id];
      return [id, {
        producedPerGenerationMean: samples.length ? produced / samples.length : 0,
        consumedPerGenerationMean: samples.length ? consumed / samples.length : 0,
        surplusPerGenerationMean: samples.length ? surplus / samples.length : 0,
        weightedUtilization: produced > 0 ? consumed / produced : 0,
        weightedSurplusShare: produced > 0 ? surplus / produced : 0,
        bottleneckGenerations: bottleneckCounts[id],
        bottleneckGenerationRate: samples.length ? bottleneckCounts[id] / samples.length : 0,
      }];
    })),
  };
}

const nationIds = ['elves', 'gnomes', 'orcs', 'mainland'];
const rows = [];
const rawGenerationSamples = [];
const rawGnomePlus2Samples = [];
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
  const localRawSamples = [];

  for (let step = 0; step < MAX_GENERATIONS; step += 1) {
    if (MODE === 'relations' && !state.externalRelations?.active && n(state.city?.population) >= 3) {
      engine.activateExternalRelations(state);
      activationGeneration = n(state.generation);
      activatedGames += 1;
    }

    const gnomeLevelAtGenerationStart = n(state.externalRelations?.levels?.gnomes);
    const summary = engine.resolveAutomatedGeneration(state);
    actions += (summary.actions ?? []).filter(substantiveAction).length;

    const raw = rawSnapshot(summary, gnomeLevelAtGenerationStart);
    rawGenerationSamples.push(raw);
    localRawSamples.push(raw);
    if (state.externalRelations?.active && gnomeLevelAtGenerationStart >= 2) rawGnomePlus2Samples.push(raw);

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
  const localRawSummary = summarizeRawSnapshots(localRawSamples);
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
    rawEconomy: localRawSummary,
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
  rawEconomy: summarizeRawSnapshots(rawGenerationSamples),
  rawEconomyWhileGnomesPlus2Or3: summarizeRawSnapshots(rawGnomePlus2Samples),
  finalForestCountMean: mean(rows.map(r => r.forestCount)),
  finalForceMean: mean(rows.map(r => r.force)),
  notes: [
    'Raw Food subsistence is 1 Raw Food per Population.',
    'Raw surplus = raw capacity produced minus raw capacity actually consumed by subsistence, mercenary food and sector production.',
    'A sector is counted as raw-capacity bottlenecked when raw capacity is lower than the production that could otherwise be served by Stakes and demand; Food also counts generations requiring Imperial Food Aid.',
    'Elven +3 does not add additional Raw Food: Forests retain the +1 Raw Food effect unlocked at Elven +1.',
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
