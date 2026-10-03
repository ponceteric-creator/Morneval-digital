import * as legacy from './v123-institution-prestige-engine.js?base=0.11.14';
import { ACTIVE_INTRIGUE_CARDS, INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';
import * as activeAi from './v119-political-influence-ai-engine.js?v=0.11.9';

export * from './v123-institution-prestige-engine.js?base=0.11.14';
export const V090_CONFIG = legacy.V090_CONFIG;

export const MORNEVAL_ENDGAME_RENOWN_TRIGGER = 12;
export const V124_AI_VERSION = '0.11.15';

const SCHOLARIUM_ID = 'scholarium';
const PATENT_IDS = ACTIVE_INTRIGUE_CARDS
  .filter(card => card.institutionId === SCHOLARIUM_ID && card.permanent && (card.tags ?? []).includes('patent'))
  .map(card => card.id);
const SCHOLARIUM_DECK_SIZE = ACTIVE_INTRIGUE_CARDS
  .filter(card => card.institutionId === SCHOLARIUM_ID)
  .reduce((sum, card) => sum + Math.max(1, Number(card.copies) || 1), 0);

function n(value) { return Number(value) || 0; }
function clamp(value, lo = 0, hi = Number.POSITIVE_INFINITY) { return Math.max(lo, Math.min(hi, n(value))); }
function choose(nn, kk) {
  const N = Math.max(0, Math.trunc(nn));
  const K = Math.max(0, Math.min(N, Math.trunc(kk)));
  if (K === 0) return 1;
  let result = 1;
  const k = Math.min(K, N - K);
  for (let i = 1; i <= k; i += 1) result = result * (N - k + i) / i;
  return result;
}
function activePatentCards(state) {
  return (state.intrigue?.inPlay ?? []).filter(card => PATENT_IDS.includes(card.cardId));
}
function scholariumAgentCount(player) {
  return (player?.institutionAgentRoster ?? []).filter(agent => agent.institutionId === SCHOLARIUM_ID).length;
}
function patentDrawProbability(state, seniority) {
  const inPlayIds = new Set((state.intrigue?.inPlay ?? []).map(card => card.cardId));
  const remainingPatentCopies = PATENT_IDS.filter(id => !inPlayIds.has(id)).length;
  const removedUnique = PATENT_IDS.length - remainingPatentCopies;
  const deckSize = Math.max(0, SCHOLARIUM_DECK_SIZE - removedUnique);
  const k = Math.max(1, Math.min(3, Math.trunc(n(seniority) || 1), deckSize));
  if (remainingPatentCopies <= 0 || deckSize <= 0) return 0;
  const total = choose(deckSize, k);
  const noPatent = choose(deckSize - remainingPatentCopies, k);
  return total > 0 ? clamp(1 - noPatent / total, 0, 1) : 0;
}
function breakthroughOpportunity(state) {
  let value = 0;
  for (const sector of state.productionSectors ?? []) {
    if (sector.id === 'food') continue;
    const tier = Math.max(1, Math.min(3, Math.trunc(n(sector.tier) || 1)));
    if (tier >= 3) continue;
    const eventPrestige = tier === 1 ? 2 : 4;
    const phase = Math.max(0, Math.min(2, Math.trunc(n(sector.developmentPhase))));
    const imminence = phase === 2 ? 1.00 : phase === 1 ? 0.55 : 0.20;
    value += eventPrestige * imminence;
  }
  return value;
}
function scholariumStrategicAdjustment(state, player, seniority) {
  const ownAgents = scholariumAgentCount(player);
  const patents = activePatentCards(state).length;
  const patentAccess = patentDrawProbability(state, seniority);
  const breakthroughs = breakthroughOpportunity(state);

  // Patents are significant because each one is simultaneously a permanent
  // +1 Wealth improvement, +1 city Renown, and +1 recurring Scholarium score.
  // The base Intrigue model already values HIGH/permanent cards; this adds only
  // the missing rule-specific strategic value.
  const patentOptionValue = patentAccess * 0.60;

  // A Family not yet represented in the Scholarium should recognize the
  // recurring institutional Prestige created by Patents already in play.
  // Existing representation gets only a small continuation reminder because
  // extra Agents do not multiply Institution Prestige.
  const activePatentValue = patents * (ownAgents === 0 ? 0.35 : 0.08);

  // Breakthrough Prestige is transient and uncapped. Near-complete Production
  // developments are therefore reasons to establish Scholarium access before
  // the Tier increase resolves, but this value is deliberately moderate.
  const coverageFactor = ownAgents === 0 ? 1.0 : 0.22 / Math.max(1, ownAgents);
  const breakthroughValue = breakthroughs * 0.12 * coverageFactor;

  return patentOptionValue + activePatentValue + breakthroughValue;
}

// v115's complete Intrigue simulation uses this exact v119 AI module instance.
// Configure that live instance rather than only the wrapper's exported config.
const ACTIVE_AI_CONFIG = activeAi.V090_CONFIG ?? V090_CONFIG;
if (ACTIVE_AI_CONFIG?.agents) {
  const previousIntrigueAccessValue = ACTIVE_AI_CONFIG.agents.intrigueAccessValue;
  ACTIVE_AI_CONFIG.agents.intrigueAccessValue = (state, player, institutionId, seniority, profile, t) => {
    const baseValue = typeof previousIntrigueAccessValue === 'function'
      ? Math.max(0, n(previousIntrigueAccessValue(state, player, institutionId, seniority, profile, t)))
      : 0;
    if (institutionId !== SCHOLARIUM_ID) return baseValue;
    return Math.max(0, baseValue + scholariumStrategicAdjustment(state, player, seniority));
  };
  ACTIVE_AI_CONFIG.agents.scholariumStrategicUnderstanding = {
    version: V124_AI_VERSION,
    patentOptionWeight: 0.60,
    activePatentFirstAgentWeight: 0.35,
    breakthroughWeight: 0.12,
    ruleBonus: false,
  };
}

function ensureEndgameState(state) {
  state.endgame ??= {
    renownTrigger: MORNEVAL_ENDGAME_RENOWN_TRIGGER,
    triggered: false,
    triggerGeneration: null,
    triggerRenown: null,
  };
  state.endgame.renownTrigger = MORNEVAL_ENDGAME_RENOWN_TRIGGER;
  return state.endgame;
}
function updateEndgameTrigger(state, summary = null) {
  const endgame = ensureEndgameState(state);
  const renown = Math.max(0, Math.trunc(n(state.city?.renown)));
  if (!endgame.triggered && renown >= MORNEVAL_ENDGAME_RENOWN_TRIGGER) {
    endgame.triggered = true;
    endgame.triggerGeneration = Math.max(0, Math.trunc(n(state.generation)));
    endgame.triggerRenown = renown;
  }
  if (summary) {
    summary.endgameTrigger = {
      renownThreshold: MORNEVAL_ENDGAME_RENOWN_TRIGGER,
      reached: Boolean(endgame.triggered),
      firstReachedGeneration: endgame.triggerGeneration,
      triggerRenown: endgame.triggerRenown,
      currentRenown: renown,
      note: 'Trigger opens the endgame; it does not itself immediately end the game.',
    };
    summary.aiStrategicUnderstanding = {
      version: V124_AI_VERSION,
      scholarium: {
        activePatents: activePatentCards(state).length,
        breakthroughOpportunity: breakthroughOpportunity(state),
        patentsRecognizedAsPermanentWealthRenownAndInstitutionPrestige: true,
      },
    };
  }
  return endgame;
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = legacy.createV084Game(familyNames);
  ensureEndgameState(state);
  return state;
}

export function prepareV111State(state, options = {}) {
  const prepared = typeof legacy.prepareV111State === 'function' ? legacy.prepareV111State(state, options) : state;
  ensureEndgameState(state);
  return prepared;
}

export function resolveAutomatedGeneration(state) {
  const summary = legacy.resolveAutomatedGeneration(state);
  updateEndgameTrigger(state, summary);
  return summary;
}
