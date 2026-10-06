import * as current from './v137-merchant-ai-clean-engine.js?playtest=0.11.29';
import { V110_PLAYTEST_API, V090_CONFIG } from './v110-ai-engine.js?real=0.11.0-v120';
import { INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';

export const PLAYTEST_VERSION = '0.1.0';
export const ENGINE_VERSION = '0.11.29-sim';

const DEFAULT_FAMILIES = ['Valenne', "D'Arcy", 'Corven'];
const AI_PERSONALITIES = ['investor', 'merchant', 'contrarian'];

V090_CONFIG.personalities.human = {
  label: 'Human',
  prestige: 0,
  wealth: 0,
  engine: 0,
  civic: 0,
  horizon: 1,
  discount: 0.8,
};
V090_CONFIG.personalities.investor ??= {
  label: 'Investor',
  prestige: 0.90,
  wealth: 1.30,
  engine: 1.70,
  civic: 0.70,
  horizon: 5,
  discount: 0.92,
};

function clone(value) { return structuredClone(value); }
function player(state, id) { return (state.players ?? []).find(row => row.id === id) ?? null; }

export function createHumanPlaytest({
  familyNames = DEFAULT_FAMILIES,
  humanSeat = 0,
  replacePersonality = 'investor',
  externalRelations = true,
} = {}) {
  const state = current.createV084Game(familyNames);
  const seat = Math.max(0, Math.min(state.players.length - 1, Math.floor(Number(humanSeat) || 0)));
  const human = state.players[seat];

  const remaining = AI_PERSONALITIES.filter(key => key !== replacePersonality);
  human.aiPersonality = 'human';
  human.playtestReplacesPersonality = replacePersonality;
  let aiIndex = 0;
  for (const row of state.players) {
    if (row.id === human.id) continue;
    row.aiPersonality = remaining[aiIndex++] ?? 'merchant';
  }

  state.playtest = {
    version: PLAYTEST_VERSION,
    engineVersion: ENGINE_VERSION,
    humanPlayerId: human.id,
    replacePersonality,
    debug: false,
    stepAi: false,
    actionLog: [],
    analytics: [],
  };

  if (externalRelations && typeof current.activateExternalRelations === 'function') {
    current.activateExternalRelations(state);
  }
  if (typeof current.applyAutoDemand === 'function') current.applyAutoDemand(state);
  return state;
}

function captureBeforeActions(rootState) {
  const probe = clone(rootState);
  probe.__playtestCaptureBeforeActions = true;
  delete probe.__playtestHumanController;
  try {
    current.resolveAutomatedGeneration(probe);
  } catch (error) {
    if (error?.code === 'MORNEVAL_PLAYTEST_ACTION_PHASE' && error.playtest) {
      const state = error.playtest.state;
      delete state.__playtestCaptureBeforeActions;
      return {
        state,
        context: error.playtest.context,
        generation: error.playtest.generation,
      };
    }
    throw error;
  }
  throw new Error('Interactive capture failed: action phase was not intercepted.');
}

function actionLabel(action, state) {
  if (!action) return 'No action';
  const who = player(state, action.playerId)?.familyName ?? action.playerId ?? '';
  if (action.actionKind === 'agent_placement') return `${who} → Agent ${action.institutionId}`;
  if (action.type === 'hinterland_exploration') return `${who} explored ${action.landId} (${action.terrain})`;
  if (action.type === 'farm_conversion') return `${who} converted ${action.landId} to Farm`;
  if (action.type === 'sector_development') return `${who} developed ${action.sectorId} P${action.phase}`;
  if (action.type === 'auction_bid') return `${who} bid ${action.bid}I on ${action.sectorId ?? action.auctionType}`;
  if (action.actionKind === 'civic_expansion_vote') return `${who} proposed city expansion`;
  if (action.actionKind === 'pass' || action.type === 'pass') return `${who} passed`;
  return `${who} · ${action.type ?? action.actionKind ?? 'action'}`;
}

function initSession(rootState) {
  const capture = captureBeforeActions(rootState);
  const turnOrder = V110_PLAYTEST_API.getTurnOrder(capture.state);
  return {
    rootState,
    planningState: capture.state,
    context: capture.context,
    generation: capture.generation,
    humanPlayerId: rootState.playtest.humanPlayerId,
    turnOrder,
    active: new Set(turnOrder),
    cursor: 0,
    round: 0,
    sequence: (capture.context.actions?.length ?? 0) + 1,
    anyActionThisRound: false,
    status: 'pre_actions',
    humanScript: [],
    coreLog: [],
    preActionSelections: {
      institution: [...(rootState.__playtestInstitutionDevelopmentQueue ?? [])],
      political: [...(rootState.__playtestPoliticalBidQueue ?? [])],
      intrigue: [...(rootState.__playtestIntrigueQueue ?? [])],
    },
    undo: null,
  };
}

export function beginInteractiveGeneration(rootState) {
  return initSession(rootState);
}

export function recapturePreActions(session) {
  const fresh = initSession(session.rootState);
  fresh.preActionSelections = clone(session.preActionSelections);
  return fresh;
}

export function queueInstitutionDevelopment(session, institutionId) {
  const root = session.rootState;
  root.__playtestInstitutionDevelopmentQueue ??= [];
  const exists = root.__playtestInstitutionDevelopmentQueue.some(row =>
    row.playerId === session.humanPlayerId && row.institutionId === institutionId);
  if (!exists) root.__playtestInstitutionDevelopmentQueue.push({ playerId: session.humanPlayerId, institutionId });
  return recapturePreActions(session);
}

export function queuePoliticalBid(session, pole) {
  const valid = ['military', 'merchant', 'temple', 'scholarium'];
  if (!valid.includes(pole)) return session;
  session.rootState.__playtestPoliticalBidQueue ??= [];
  session.rootState.__playtestPoliticalBidQueue.push({ playerId: session.humanPlayerId, pole });
  return recapturePreActions(session);
}

export function queueIntrigueCard(session, instanceId) {
  session.rootState.__playtestIntrigueQueue ??= [];
  const exists = session.rootState.__playtestIntrigueQueue.some(row =>
    row.playerId === session.humanPlayerId && row.instanceId === instanceId);
  if (!exists) session.rootState.__playtestIntrigueQueue.push({ playerId: session.humanPlayerId, instanceId });
  return recapturePreActions(session);
}

function recordAction(session, action, source) {
  if (!action) return;
  session.coreLog.push({
    generation: session.generation,
    source,
    ...clone(action),
    label: actionLabel(action, session.planningState),
  });
}

function endRoundIfNeeded(session) {
  if (session.cursor < session.turnOrder.length) return false;
  session.cursor = 0;
  session.round += 1;
  if (!session.anyActionThisRound && session.active.size > 0) {
    for (const id of [...session.active]) session.active.delete(id);
  }
  session.anyActionThisRound = false;
  return true;
}

export function advanceUntilHuman(session, { singleAiStep = false } = {}) {
  if (session.status === 'pre_actions') session.status = 'actions';
  let aiSteps = 0;
  while (session.active.size > 0 && session.round < (V090_CONFIG.actionSafetyLimit ?? 120)) {
    endRoundIfNeeded(session);
    if (!session.active.size) break;
    const playerId = session.turnOrder[session.cursor++];
    if (!session.active.has(playerId)) continue;

    if (playerId === session.humanPlayerId) {
      session.status = 'human_turn';
      return session;
    }

    const candidate = V110_PLAYTEST_API.chooseAiAction(session.planningState, playerId, session.context);
    if (!candidate || Number(candidate.score) < Number(V090_CONFIG.actionUtilityFloor ?? 0.5)) {
      session.active.delete(playerId);
      const action = { sequence: session.sequence++, type: 'pass', actionKind: 'pass', playerId };
      session.context.actions.push(action);
      recordAction(session, action, 'ai');
    } else {
      const result = V110_PLAYTEST_API.executeAction(
        session.planningState, playerId, candidate, session.context, session.sequence,
      );
      session.sequence = result.sequence;
      if (!result.action) {
        session.active.delete(playerId);
      } else {
        session.context.actions.push(result.action);
        session.anyActionThisRound = true;
        if (result.action.type === 'farm_conversion') session.context.farmBuilt = true;
        if (typeof current.applyAutoDemand === 'function') current.applyAutoDemand(session.planningState);
        recordAction(session, result.action, 'ai');
      }
    }
    aiSteps += 1;
    if (singleAiStep && aiSteps >= 1) {
      session.status = 'ai_step';
      return session;
    }
  }
  session.status = 'actions_complete';
  return session;
}

export function listHumanActions(session) {
  if (session.status !== 'human_turn') return [];
  return V110_PLAYTEST_API.listHumanCandidates(
    session.planningState, session.humanPlayerId, session.context,
  ).map(candidate => ({
    spec: V110_PLAYTEST_API.candidateSpec(candidate),
    kind: candidate.kind,
    score: candidate.score ?? null,
    bid: candidate.bid ?? null,
    minimumBid: candidate.minimumBid ?? candidate.bid ?? null,
    maximumBid: candidate.maximumBid ?? null,
    sectorId: candidate.sector?.id ?? candidate.auction?.sectorId ?? null,
    institutionId: candidate.institutionId ?? null,
    landId: candidate.land?.id ?? candidate.target?.id ?? null,
    auctionId: candidate.auction?.auctionId ?? null,
    expectedCategory: candidate.expectedCategory ?? null,
  }));
}

export function playHumanAction(session, spec) {
  if (session.status !== 'human_turn') return { ok: false, reason: 'not_human_turn', session };
  session.undo = {
    planningState: clone(session.planningState),
    context: clone(session.context),
    active: [...session.active],
    cursor: session.cursor,
    round: session.round,
    sequence: session.sequence,
    anyActionThisRound: session.anyActionThisRound,
    humanScript: clone(session.humanScript),
    coreLog: clone(session.coreLog),
  };

  if (!spec || spec.kind === 'pass') {
    session.active.delete(session.humanPlayerId);
    const action = { sequence: session.sequence++, type: 'pass', actionKind: 'pass', playerId: session.humanPlayerId };
    session.context.actions.push(action);
    session.humanScript.push({ kind: 'pass' });
    recordAction(session, action, 'human');
    session.status = 'actions';
    return { ok: true, session };
  }

  const candidate = V110_PLAYTEST_API.candidateFromSpec(
    session.planningState,
    player(session.planningState, session.humanPlayerId),
    session.context,
    spec,
  );
  if (!candidate) return { ok: false, reason: 'illegal_action', session };

  const result = V110_PLAYTEST_API.executeAction(
    session.planningState,
    session.humanPlayerId,
    candidate,
    session.context,
    session.sequence,
  );
  if (!result.action) return { ok: false, reason: 'action_failed', session };

  session.sequence = result.sequence;
  session.context.actions.push(result.action);
  session.humanScript.push({ ...clone(spec) });
  session.anyActionThisRound = true;
  if (result.action.type === 'farm_conversion') session.context.farmBuilt = true;
  if (typeof current.applyAutoDemand === 'function') current.applyAutoDemand(session.planningState);
  recordAction(session, result.action, 'human');
  session.status = 'actions';
  return { ok: true, action: result.action, session };
}

export function undoLastHumanAction(session) {
  const u = session.undo;
  if (!u) return { ok: false, reason: 'nothing_to_undo', session };
  session.planningState = u.planningState;
  session.context = u.context;
  session.active = new Set(u.active);
  session.cursor = u.cursor;
  session.round = u.round;
  session.sequence = u.sequence;
  session.anyActionThisRound = u.anyActionThisRound;
  session.humanScript = u.humanScript;
  session.coreLog = u.coreLog;
  session.undo = null;
  session.status = 'human_turn';
  return { ok: true, session };
}

function summarizeAnalytics(summary, state, humanPlayerId) {
  const prestige = (summary.prestigeScoring ?? []).find(row => row.playerId === humanPlayerId);
  const influence = (summary.agentInfluenceAwards ?? []).find(row => row.playerId === humanPlayerId);
  const wealth = (summary.wealthCommitments ?? []).find(row => row.playerId === humanPlayerId);
  const institutionPrestige = (summary.institutionPrestigeAwards ?? [])
    .filter(row => row.playerId === humanPlayerId)
    .reduce((out, row) => ({ ...out, [row.institutionId]: (out[row.institutionId] ?? 0) + Number(row.amount || 0) }), {});
  return {
    generation: summary.generation,
    prestigeDelta: Number(prestige?.delta ?? 0),
    prestigeEntries: clone(prestige?.entries ?? []),
    institutionPrestige,
    agentInfluence: Number(influence?.received ?? influence?.requested ?? 0),
    wealthGross: Number(wealth?.gross ?? player(state, humanPlayerId)?.wealthCapacity ?? 0),
    wealthCommitted: Number(wealth?.committed ?? 0),
    influenceAfter: Number(player(state, humanPlayerId)?.influence ?? 0),
    population: Number(state.city?.population ?? 0),
    squalor: Number(state.city?.squalor ?? 0),
    order: Number(state.city?.order ?? 0),
    force: Number(state.city?.force ?? 0),
    relations: clone(state.externalRelations?.levels ?? {}),
  };
}

export function finishInteractiveGeneration(session) {
  if (session.status !== 'actions_complete') return { ok: false, reason: 'actions_not_complete', session };
  const root = session.rootState;
  root.__playtestHumanController = {
    playerId: session.humanPlayerId,
    actions: clone(session.humanScript),
    cursor: 0,
  };
  let summary;
  try {
    summary = current.resolveAutomatedGeneration(root);
  } finally {
    delete root.__playtestHumanController;
    delete root.__playtestCaptureBeforeActions;
  }

  root.playtest.actionLog.push(
    ...session.coreLog.map(row => ({ ...row, generation: summary.generation })),
  );
  const analytic = summarizeAnalytics(summary, root, session.humanPlayerId);
  root.playtest.analytics.push(analytic);
  root.playtest.lastSummary = clone(summary);
  return { ok: true, state: root, summary, analytics: analytic };
}

export function currentInstitutionScores(state) {
  try {
    return typeof current.getInstitutionPreview === 'function'
      ? current.getInstitutionPreview(state)
      : {};
  } catch {
    return {};
  }
}

export function intrigueHand(state, playerId) {
  const hand = state.intrigue?.hands?.[playerId] ?? [];
  return hand.map(card => ({
    ...clone(card),
    meta: clone(INTRIGUE_CARD_META[card.cardId] ?? {}),
  }));
}

export function economyPreview(state) {
  try { return current.previewEconomy(state); }
  catch { return { reports: [], familyWealth: {} }; }
}

export function externalRelations(state) {
  return clone(state.externalRelations?.levels ?? { elves: 0, gnomes: 0, orcs: 0, mainland: 2 });
}

export { current as engine };
