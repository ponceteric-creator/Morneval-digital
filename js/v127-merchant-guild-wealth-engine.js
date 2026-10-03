import * as legacy from './v126-base-wealth-engine.js?base=0.11.17';
import * as activeAi from './v119-political-influence-ai-engine.js?v=0.11.10';

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
  return {
    totalWealth,
    baseWealth,
    generatedWealth: Math.max(0, totalWealth - baseWealth),
  };
}
function merchantGuildStructuralScore(state) {
  const wealth = commercialWealth(state);
  const tier = institutionTier(state, MERCHANT_GUILD_ID);
  const cap = PRESTIGE_CAP_BY_TIER[tier] ?? 2;
  return {
    ...wealth,
    tier,
    cap,
    structuralRaw: wealth.generatedWealth,
    structuralCapped: Math.min(cap, wealth.generatedWealth),
    score: Math.min(cap, wealth.generatedWealth),
  };
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

function recomputeFirstPlayer(state, summary) {
  const players = [...(state.players ?? [])];
  if (!players.length) return;
  const maxInfluence = Math.max(...players.map(player => n(player.influence)));
  let finalists = players.filter(player => n(player.influence) === maxInfluence);
  let tieBreakMethod = 'influence';
  let maxPrestige = null;
  let maxWealth = null;

  if (finalists.length > 1) {
    maxPrestige = Math.max(...finalists.map(player => n(player.prestige)));
    finalists = finalists.filter(player => n(player.prestige) === maxPrestige);
    tieBreakMethod = 'prestige';
  }
  if (finalists.length > 1) {
    maxWealth = Math.max(...finalists.map(player => n(player.wealthCapacity)));
    finalists = finalists.filter(player => n(player.wealthCapacity) === maxWealth);
    tieBreakMethod = 'wealth';
  }
  if (finalists.length > 1) {
    const previous = summary.firstPlayerResolution?.nextFirstPlayerId ?? summary.nextFirstPlayerId ?? state.firstPlayerId;
    const preserved = finalists.find(player => player.id === previous);
    finalists = [preserved ?? finalists[0]];
    tieBreakMethod = 'existing_random_result_preserved';
  }

  state.firstPlayerId = finalists[0]?.id ?? state.firstPlayerId;
  summary.firstPlayerResolution = {
    ...(summary.firstPlayerResolution ?? {}),
    nextFirstPlayerId: state.firstPlayerId,
    maxInfluence,
    maxPrestige,
    maxWealth,
    tieBreakMethod,
    correctedForMerchantGuildWealthScore: true,
  };
  summary.nextFirstPlayerId = state.firstPlayerId;
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
    const player = (state.players ?? []).find(row => row.id === scoring.playerId);
    if (!player) continue;
    const entry = (scoring.entries ?? []).find(row => row.reason === `institution_${MERCHANT_GUILD_ID}`);
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
  recomputeFirstPlayer(state, summary);

  summary.institutionPrestigeAwards = (summary.prestigeScoring ?? []).flatMap(scoring => (scoring.entries ?? [])
    .filter(entry => String(entry.reason ?? '').startsWith('institution_'))
    .map(entry => ({
      playerId: scoring.playerId,
      institutionId: String(entry.reason).replace('institution_', ''),
      amount: n(entry.amount),
    })));

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

// Make the automated player understand the recurring Prestige represented by
// Morneval's commercial Wealth. This is a valuation adjustment only; it grants
// no rule bonus. Existing Intrigue-card valuation remains untouched.
const ACTIVE_AI_CONFIG = activeAi.V090_CONFIG ?? legacy.V090_CONFIG;
if (ACTIVE_AI_CONFIG?.agents) {
  const previousIntrigueAccessValue = ACTIVE_AI_CONFIG.agents.intrigueAccessValue;
  ACTIVE_AI_CONFIG.agents.intrigueAccessValue = (state, player, institutionId, seniority, profile, t) => {
    const baseValue = typeof previousIntrigueAccessValue === 'function'
      ? Math.max(0, n(previousIntrigueAccessValue(state, player, institutionId, seniority, profile, t)))
      : 0;
    if (institutionId !== MERCHANT_GUILD_ID) return baseValue;
    const score = merchantGuildStructuralScore(state).score;
    const ownAgents = agentCount(player, MERCHANT_GUILD_ID);
    const recurringPrestigeRecognition = score * (ownAgents === 0 ? 0.45 : 0.05);
    return Math.max(0, baseValue + recurringPrestigeRecognition);
  };
  ACTIVE_AI_CONFIG.agents.merchantGuildWealthUnderstanding = {
    version: V127_VERSION,
    firstAgentRecurringPrestigeWeight: 0.45,
    additionalAgentReminderWeight: 0.05,
    ruleBonus: false,
  };
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
