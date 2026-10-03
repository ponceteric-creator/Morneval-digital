import * as legacy from './v122-institution-tier-full-engine.js?base=0.11.13';
import { INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';

export * from './v122-institution-tier-full-engine.js?base=0.11.13';
export const V090_CONFIG = legacy.V090_CONFIG;

const VERSION = '0.11.14';
const INSTITUTION_IDS = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];
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
function activePatentCount(state) {
  return (state.intrigue?.inPlay ?? []).filter(card =>
    INTRIGUE_CARD_META[card.cardId]?.tags?.includes('patent')
  ).length;
}

function scoreParts(state, institutionId, legacyScore, patents) {
  const row = legacyScore ?? {};
  const tier = institutionTier(state, institutionId);
  const cap = PRESTIGE_CAP_BY_TIER[tier] ?? 2;
  let structuralRaw = Math.max(0, n(row.score));
  let transient = 0;

  if (institutionId === 'city_guard') {
    structuralRaw = Math.max(0, n(row.orderPrestige) + n(row.readinessPrestige));
  } else if (institutionId === 'temple') {
    structuralRaw = Math.max(0, n(row.religiousPrestige) + n(row.civicCoherence));
  } else if (institutionId === 'merchant_guild') {
    structuralRaw = Math.max(0, n(row.rawScore));
  } else if (institutionId === 'scholarium') {
    // "permanent" is the pre-existing recurring Scholarium component based on
    // cumulative Production Tier increases and Arcane inclination.
    // Active Patents add +1 each to that recurring/structural component.
    structuralRaw = Math.max(0, n(row.permanent)) + patents;
    // Breakthroughs are Generation-specific events and explicitly sit outside
    // the Institution Tier Prestige cap.
    transient = Math.max(0, n(row.breakthrough));
  }

  const structuralCapped = Math.min(cap, structuralRaw);
  return {
    tier,
    cap,
    structuralRaw,
    structuralCapped,
    transient,
    score: structuralCapped + transient,
  };
}

function recomputeFinalPrestige(state, summary) {
  for (const player of state.players ?? []) {
    const result = (summary.prestigeScoring ?? []).find(row => row.playerId === player.id);
    if (!result) continue;
    let finalPrestige = Math.max(0, n(result.after));
    if (summary.chaos?.triggered) {
      const loss = finalPrestige > 0 ? Math.ceil(finalPrestige * 0.20) : 0;
      finalPrestige = Math.max(0, finalPrestige - loss);
      const chaosRow = (summary.chaos.prestigeLosses ?? []).find(row => row.playerId === player.id);
      if (chaosRow) {
        chaosRow.before = n(result.after);
        chaosRow.requestedLoss = loss;
        chaosRow.actualLoss = loss;
        chaosRow.after = finalPrestige;
      }
    }
    player.prestige = finalPrestige;
  }
  summary.prestigeAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, player.prestige]));
}

function recomputeFirstPlayerWithoutExtraRng(state, summary) {
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
    correctedForInstitutionPrestigeRules: true,
  };
  summary.nextFirstPlayerId = state.firstPlayerId;
}

function applyInstitutionPrestigeModel(state, summary) {
  const patents = activePatentCount(state);
  const scores = summary.institutionScores ?? {};
  const parts = {};

  for (const institutionId of INSTITUTION_IDS) {
    const baseRow = scores[institutionId] ?? {};
    const computed = scoreParts(state, institutionId, baseRow, patents);
    parts[institutionId] = computed;
    scores[institutionId] = {
      ...baseRow,
      score: computed.score,
      structuralRaw: computed.structuralRaw,
      structuralCapped: computed.structuralCapped,
      transientPrestige: computed.transient,
      institutionTier: computed.tier,
      institutionPrestigeCap: computed.cap,
      transientOutsideCap: true,
      ...(institutionId === 'scholarium' ? { activePatents: patents, patentPrestige: patents } : {}),
    };
  }
  summary.institutionScores = scores;

  const corrections = [];
  for (const result of summary.prestigeScoring ?? []) {
    const player = (state.players ?? []).find(row => row.id === result.playerId);
    if (!player) continue;
    let totalDelta = 0;
    const details = [];
    for (const institutionId of INSTITUTION_IDS) {
      const entry = (result.entries ?? []).find(row => row.reason === `institution_${institutionId}`);
      if (!entry) continue;
      const before = n(entry.amount);
      const represented = agentCount(player, institutionId) > 0;
      const after = represented ? Math.max(0, n(scores[institutionId]?.score)) : 0;
      const delta = after - before;
      entry.amount = after;
      totalDelta += delta;
      details.push({ institutionId, before, after, delta, represented, ...parts[institutionId] });
    }
    if (totalDelta !== 0) {
      result.delta = n(result.delta) + totalDelta;
      result.after = Math.max(0, n(result.after) + totalDelta);
    }
    corrections.push({ playerId: player.id, totalDelta, details });
  }

  recomputeFinalPrestige(state, summary);
  recomputeFirstPlayerWithoutExtraRng(state, summary);
  summary.institutionPrestigeAwards = (summary.prestigeScoring ?? []).flatMap(result => (result.entries ?? [])
    .filter(entry => String(entry.reason ?? '').startsWith('institution_'))
    .map(entry => ({
      playerId: result.playerId,
      institutionId: String(entry.reason).replace('institution_', ''),
      amount: n(entry.amount),
    })));
  summary.institutionPrestigeModel = {
    version: VERSION,
    structuralPrestigeCapByTier: { ...PRESTIGE_CAP_BY_TIER },
    transientEventsOutsideCap: true,
    scholariumPatentPrestige: '+1 structural Institution score per active Patent',
    activePatentCount: patents,
    scholariumBreakthroughOutsideCap: true,
    corrections,
  };
  return corrections;
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  return legacy.createV084Game(familyNames);
}

export function prepareV111State(state, options = {}) {
  return typeof legacy.prepareV111State === 'function' ? legacy.prepareV111State(state, options) : state;
}

export function resolveAutomatedGeneration(state) {
  const summary = legacy.resolveAutomatedGeneration(state);
  applyInstitutionPrestigeModel(state, summary);
  return summary;
}
