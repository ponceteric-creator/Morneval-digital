import * as legacy from './v126-base-wealth-engine.js?base=0.11.17';

export * from './v126-base-wealth-engine.js?base=0.11.17';
export const V127_VERSION = '0.11.18';
export const FAMILY_BASE_WEALTH = 2;

const MERCHANT_GUILD_ID = 'merchant_guild';
const PRESTIGE_CAP_BY_TIER = Object.freeze({ 1: 2, 2: 4, 3: 8 });

function n(value) { return Number(value) || 0; }
function agentCount(player, institutionId) {
  return (player?.institutionAgentRoster ?? []).filter(agent => agent.institutionId === institutionId).length;
}
function institutionTier(state, institutionId) {
  if (typeof legacy.getInstitutionTier === 'function') return legacy.getInstitutionTier(state, institutionId);
  const institution = (state.institutions ?? []).find(row => row.id === institutionId);
  return Math.max(1, Math.min(3, Math.floor(n(institution?.tier) || 1)));
}
function commercialWealth(state) {
  const players = state.players ?? [];
  const totalWealth = players.reduce((sum, player) => sum + Math.max(FAMILY_BASE_WEALTH, n(player.wealthCapacity)), 0);
  const baseWealth = FAMILY_BASE_WEALTH * players.length;
  return { totalWealth, baseWealth, generatedWealth: Math.max(0, totalWealth - baseWealth) };
}
function merchantGuildStructuralScore(state) {
  const wealth = commercialWealth(state);
  const tier = institutionTier(state, MERCHANT_GUILD_ID);
  const cap = PRESTIGE_CAP_BY_TIER[tier] ?? 2;
  const score = Math.min(cap, wealth.generatedWealth);
  return { ...wealth, tier, cap, structuralRaw: wealth.generatedWealth, structuralCapped: score, score };
}
function externalPrestigeFor(summary, playerId) {
  const correction = (summary.marketRewardModel?.corrections ?? []).find(row => row.playerId === playerId);
  return Math.max(0, n(correction?.externalPrestige));
}
function recomputePlayerPrestige(state, summary) {
  for (const player of state.players ?? []) {
    const scoring = (summary.prestigeScoring ?? []).find(row => row.playerId === player.id);
    if (!scoring) continue;
    const externalPrestige = externalPrestigeFor(summary, player.id);
    const preChaosAfter = Math.max(0, n(scoring.after) - externalPrestige);
    let finalPrestige = preChaosAfter;
    if (summary.chaos?.triggered) {
      const loss = preChaosAfter > 0 ? Math.ceil(preChaosAfter * 0.20) : 0;
      finalPrestige = Math.max(0, preChaosAfter - loss);
      const chaosRow = (summary.chaos.prestigeLosses ?? []).find(row => row.playerId === player.id);
      if (chaosRow) {
        chaosRow.before = preChaosAfter;
        chaosRow.requestedLoss = loss;
        chaosRow.actualLoss = loss;
        chaosRow.after = finalPrestige;
      }
    }
    player.prestige = finalPrestige + externalPrestige;
  }
  summary.prestigeAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, n(player.prestige)]));
}
function correctFirstPlayerIfPrestigeChanged(state, summary, corrections) {
  if (!corrections.some(row => row.delta !== 0)) return;
  const players = [...(state.players ?? [])];
  if (!players.length) return;
  const maxInfluence = Math.max(...players.map(player => n(player.influence)));
  let finalists = players.filter(player => n(player.influence) === maxInfluence);
  if (finalists.length <= 1) return;

  const maxPrestige = Math.max(...finalists.map(player => n(player.prestige)));
  finalists = finalists.filter(player => n(player.prestige) === maxPrestige);
  if (finalists.length > 1) {
    const maxWealth = Math.max(...finalists.map(player => n(player.wealthGeneratedThisGeneration ?? player.wealthCapacity)));
    finalists = finalists.filter(player => n(player.wealthGeneratedThisGeneration ?? player.wealthCapacity) === maxWealth);
  }

  const existingWinner = summary.firstPlayerResolution?.nextFirstPlayerId ?? summary.nextFirstPlayerId ?? state.firstPlayerId;
  const chosen = finalists.find(player => player.id === existingWinner) ?? finalists[0];
  if (!chosen) return;
  state.firstPlayerId = chosen.id;
  summary.nextFirstPlayerId = chosen.id;
  summary.firstPlayerResolution = {
    ...(summary.firstPlayerResolution ?? {}),
    nextFirstPlayerId: chosen.id,
    correctedForMerchantGuildWealthScore: true,
  };
}
function applyMerchantGuildPrestigeModel(state, summary) {
  const computed = merchantGuildStructuralScore(state);
  const row = summary.institutionScores?.[MERCHANT_GUILD_ID] ?? {};
  const oldScore = Math.max(0, n(row.score));

  summary.institutionScores ??= {};
  summary.institutionScores[MERCHANT_GUILD_ID] = {
    ...row,
    score: computed.score,
    rawScore: computed.structuralRaw,
    structuralRaw: computed.structuralRaw,
    structuralCapped: computed.structuralCapped,
    transientPrestige: 0,
    institutionTier: computed.tier,
    institutionPrestigeCap: computed.cap,
    totalFamilyWealth: computed.totalWealth,
    totalBaseWealth: computed.baseWealth,
    commercialWealth: computed.generatedWealth,
    scoringBasis: 'total Family Wealth capacity above cumulative Family base Wealth',
    legacyExternalMarketPenaltyRemoved: true,
  };

  const corrections = [];
  for (const scoring of summary.prestigeScoring ?? []) {
    const player = (state.players ?? []).find(item => item.id === scoring.playerId);
    if (!player) continue;
    const entry = (scoring.entries ?? []).find(item => item.reason === `institution_${MERCHANT_GUILD_ID}`);
    if (!entry) continue;
    const represented = agentCount(player, MERCHANT_GUILD_ID) > 0;
    const before = n(entry.amount);
    const after = represented ? computed.score : 0;
    const delta = after - before;
    entry.amount = after;
    scoring.delta = n(scoring.delta) + delta;
    scoring.after = Math.max(0, n(scoring.after) + delta);
    corrections.push({ playerId: player.id, represented, before, after, delta });
  }

  recomputePlayerPrestige(state, summary);
  correctFirstPlayerIfPrestigeChanged(state, summary, corrections);

  summary.institutionPrestigeAwards = (summary.prestigeScoring ?? []).flatMap(scoring => (scoring.entries ?? [])
    .filter(entry => String(entry.reason ?? '').startsWith('institution_'))
    .map(entry => ({ playerId: scoring.playerId, institutionId: String(entry.reason).replace('institution_', ''), amount: n(entry.amount) })));

  summary.merchantGuildPrestigeModel = {
    version: V127_VERSION,
    oldResolvedScore: oldScore,
    formula: 'min(Institution Tier cap, max(0, total Family Wealth capacity - cumulative Family base Wealth))',
    structuralPrestigeCapByTier: { ...PRESTIGE_CAP_BY_TIER },
    familyBaseWealth: FAMILY_BASE_WEALTH,
    penaltiesForUnmetExternalPopulationImperialDemand: false,
    ...computed,
    corrections,
  };
  return computed;
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  return legacy.createV084Game(familyNames);
}
export function prepareV111State(state, options = {}) {
  return typeof legacy.prepareV111State === 'function' ? legacy.prepareV111State(state, options) : state;
}
export function resolveAutomatedGeneration(state) {
  const summary = legacy.resolveAutomatedGeneration(state);
  applyMerchantGuildPrestigeModel(state, summary);
  return summary;
}
