import * as legacy from './v119-political-influence-ai-engine.js?base=0.11.10-v121';

export * from './v119-political-influence-ai-engine.js?base=0.11.10-v121';
export const V090_CONFIG = legacy.V090_CONFIG;

const VERSION = '0.11.12';
const INSTITUTION_IDS = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];
const INSTITUTION_LABELS = {
  city_guard: 'City Guard',
  temple: 'Temple',
  merchant_guild: 'Merchant Guild',
  scholarium: 'Scholarium College',
};
const INFLUENCE_CAP_BY_TIER = Object.freeze({ 1: 2, 2: 4, 3: 8 });
const DEVELOPMENT_COSTS = Object.freeze({
  1: Object.freeze({
    1: Object.freeze({ influenceCost: 2, wealthCost: 0, prestige: 4 }),
    2: Object.freeze({ influenceCost: 2, wealthCost: 0, prestige: 3 }),
    3: Object.freeze({ influenceCost: 2, wealthCost: 0, prestige: 2 }),
  }),
  2: Object.freeze({
    1: Object.freeze({ influenceCost: 4, wealthCost: 0, prestige: 8 }),
    2: Object.freeze({ influenceCost: 4, wealthCost: 0, prestige: 6 }),
    3: Object.freeze({ influenceCost: 4, wealthCost: 0, prestige: 4 }),
  }),
});
const MAX_SIM_INSTITUTION_DEVELOPMENTS_PER_FAMILY = 1;

function n(value) { return Number(value) || 0; }
function clampInt(value, lo = 0, hi = Number.POSITIVE_INFINITY) {
  return Math.max(lo, Math.min(hi, Math.floor(n(value))));
}
function nextRand(state) {
  state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}
function institutionTemplate(id) {
  return {
    id,
    name: INSTITUTION_LABELS[id],
    tier: 1,
    developmentPhase: 0,
    developmentTargetTier: 2,
    lastDevelopmentGeneration: null,
    lastDevelopmentContributorId: null,
  };
}

export function ensureInstitutionTierState(state) {
  const existing = new Map((state.institutions ?? []).map(inst => [inst.id, inst]));
  state.institutions = INSTITUTION_IDS.map(id => {
    const current = existing.get(id) ?? institutionTemplate(id);
    const tier = clampInt(current.tier ?? 1, 1, 3);
    const developmentPhase = tier >= 3 ? 0 : clampInt(current.developmentPhase ?? 0, 0, 2);
    return {
      ...current,
      id,
      name: current.name ?? INSTITUTION_LABELS[id],
      tier,
      developmentPhase,
      developmentTargetTier: tier < 3 ? tier + 1 : null,
      lastDevelopmentGeneration: current.lastDevelopmentGeneration ?? null,
      lastDevelopmentContributorId: current.lastDevelopmentContributorId ?? null,
    };
  });
  return state.institutions;
}

export function getInstitutionTier(state, institutionId) {
  ensureInstitutionTierState(state);
  return clampInt(state.institutions.find(inst => inst.id === institutionId)?.tier ?? 1, 1, 3);
}
export function getInstitutionInfluenceCap(state, institutionId) {
  return INFLUENCE_CAP_BY_TIER[getInstitutionTier(state, institutionId)] ?? 2;
}
export function getInstitutionDevelopmentCost(institution) {
  if (!institution || n(institution.tier) >= 3) return null;
  const tier = clampInt(institution.tier ?? 1, 1, 2);
  const phase = clampInt((institution.developmentPhase ?? 0) + 1, 1, 3);
  return { phase, ...DEVELOPMENT_COSTS[tier][phase] };
}

function turnOrder(state) {
  if (typeof legacy.getTurnOrder === 'function') return legacy.getTurnOrder(state);
  const players = [...(state.players ?? [])];
  const first = players.findIndex(player => player.id === state.firstPlayerId);
  return first <= 0 ? players : [...players.slice(first), ...players.slice(0, first)];
}
function agentRows(player, institutionId) {
  return (player.institutionAgentRoster ?? []).filter(agent => agent.institutionId === institutionId);
}
function rawInfluence(player, institutionId) {
  return agentRows(player, institutionId).reduce((sum, agent) => sum + clampInt(agent.seniority ?? 1, 1, 3), 0);
}
function agentCount(player, institutionId) { return agentRows(player, institutionId).length; }
function prestigeWeight(player) {
  if (player.aiPersonality === 'dynast') return 1.20;
  if (player.aiPersonality === 'merchant') return 0.95;
  return 1.00;
}
function currentInstitutionScores(state) {
  try {
    if (typeof legacy.previewEconomy !== 'function' || typeof legacy.calculateInstitutionScores !== 'function') return {};
    const economy = legacy.previewEconomy(state);
    return legacy.calculateInstitutionScores(state, economy.reports ?? [], [], state.city?.order, state.city?.population) ?? {};
  } catch {
    return {};
  }
}

function institutionDevelopmentCandidate(state, player, institution, scores) {
  const cost = getInstitutionDevelopmentCost(institution);
  if (!cost || n(institution.lastDevelopmentGeneration) === n(state.generation)) return null;
  if (n(player.influence) < cost.influenceCost) return null;
  const tier = clampInt(institution.tier ?? 1, 1, 3);
  const currentCap = INFLUENCE_CAP_BY_TIER[tier] ?? 2;
  const completesTier = cost.phase === 3;
  const targetTier = completesTier ? Math.min(3, tier + 1) : tier;
  const targetCap = INFLUENCE_CAP_BY_TIER[targetTier] ?? currentCap;
  const ownRaw = rawInfluence(player, institution.id);
  const ownAgents = agentCount(player, institution.id);
  const rivalAgents = (state.players ?? []).filter(other => other.id !== player.id)
    .reduce((sum, other) => sum + agentCount(other, institution.id), 0);
  const capUnlock = completesTier
    ? Math.max(0, Math.min(ownRaw, targetCap) - Math.min(ownRaw, currentCap))
    : 0;
  const scoreNow = Math.max(0, n(scores?.[institution.id]?.score));
  const progressValue = cost.phase === 1 ? 0.55 : cost.phase === 2 ? 0.80 : 1.05;
  const renownValue = completesTier ? 0.70 : 0;
  const score = cost.prestige * prestigeWeight(player)
    + progressValue + renownValue + capUnlock * 1.25
    + Math.min(1.0, ownAgents * 0.28) + Math.min(0.8, scoreNow * 0.16)
    - cost.influenceCost * 0.62 - rivalAgents * 0.06;
  return { institution, cost, score, completesTier, targetTier, currentCap, targetCap, ownRaw, capUnlock };
}

function executeInstitutionDevelopment(state, player, candidate) {
  const { institution, cost } = candidate;
  if (n(player.influence) < cost.influenceCost) return null;
  player.influence -= cost.influenceCost;
  player.pendingPrestige = Math.floor(n(player.pendingPrestige)) + cost.prestige;
  institution.developmentPhase = cost.phase;
  institution.developmentTargetTier = Math.min(3, clampInt(institution.tier ?? 1, 1, 3) + 1);
  institution.lastDevelopmentGeneration = n(state.generation);
  institution.lastDevelopmentContributorId = player.id;
  let tierActivated = false;
  if (cost.phase === 3) {
    institution.tier = Math.min(3, clampInt(institution.tier ?? 1, 1, 3) + 1);
    institution.developmentPhase = 0;
    institution.developmentTargetTier = institution.tier < 3 ? institution.tier + 1 : null;
    tierActivated = true;
  }
  if (typeof legacy.applyAutoDemand === 'function') legacy.applyAutoDemand(state);
  return {
    type: `Institution development: ${player.familyName} → ${INSTITUTION_LABELS[institution.id]} phase ${cost.phase}`,
    actionKind: 'institution_development', playerId: player.id, institutionId: institution.id,
    phase: cost.phase, influenceCost: cost.influenceCost, wealthCost: cost.wealthCost,
    prestige: cost.prestige, tierActivated, newTier: institution.tier,
    influenceCap: INFLUENCE_CAP_BY_TIER[institution.tier], simulationPreAction: true,
  };
}

function runInstitutionDevelopmentAI(state) {
  ensureInstitutionTierState(state);
  const actions = [];
  const scores = currentInstitutionScores(state);

  const queued = Array.isArray(state.__playtestInstitutionDevelopmentQueue)
    ? state.__playtestInstitutionDevelopmentQueue.splice(0)
    : [];
  for (const spec of queued) {
    const player = (state.players ?? []).find(row => row.id === spec.playerId);
    const institution = (state.institutions ?? []).find(row => row.id === spec.institutionId);
    if (!player || !institution) continue;
    const candidate = institutionDevelopmentCandidate(state, player, institution, scores);
    const action = candidate ? executeInstitutionDevelopment(state, player, candidate) : null;
    if (action) actions.push({ ...action, humanPlaytest: true });
  }

  for (const player of turnOrder(state)) {
    if (player.aiPersonality === "human") continue;
    let used = 0;
    while (used < MAX_SIM_INSTITUTION_DEVELOPMENTS_PER_FAMILY) {
      const candidates = state.institutions.map(inst => institutionDevelopmentCandidate(state, player, inst, scores))
        .filter(Boolean).sort((a, b) => b.score - a.score || a.cost.influenceCost - b.cost.influenceCost);
      const pick = candidates[0];
      if (!pick || pick.score < 2.0) break;
      const action = executeInstitutionDevelopment(state, player, pick);
      if (!action) break;
      actions.push(action); used += 1;
    }
  }
  return actions;
}

function applyInfluenceCaps(state, summary) {
  const corrections = [];
  for (const player of state.players ?? []) {
    const byInstitution = {};
    let rawTotal = 0, cappedTotal = 0;
    for (const institutionId of INSTITUTION_IDS) {
      const raw = rawInfluence(player, institutionId);
      const tier = getInstitutionTier(state, institutionId);
      const cap = INFLUENCE_CAP_BY_TIER[tier] ?? 2;
      const received = Math.min(raw, cap);
      rawTotal += raw; cappedTotal += received;
      byInstitution[institutionId] = { tier, cap, raw, received, clipped: raw - received };
    }
    const award = (summary.agentInfluenceAwards ?? []).find(row => row.playerId === player.id);
    const legacyReceived = Math.max(0, n(award?.received ?? award?.requested ?? rawTotal));
    const clipped = Math.max(0, legacyReceived - cappedTotal);
    if (clipped > 0) player.influence = Math.max(0, n(player.influence) - clipped);
    if (award) {
      award.requested = rawTotal; award.received = cappedTotal; award.clipped = rawTotal - cappedTotal;
      award.byInstitution = byInstitution; award.after = n(award.before) + cappedTotal;
      award.institutionTierCaps = true;
    }
    corrections.push({ playerId: player.id, rawTotal, cappedTotal, clipped, byInstitution });
  }
  summary.agentInfluenceCapCorrections = corrections;
  summary.influenceAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, player.influence]));
  return corrections;
}

function applySingleAssociationPrestige(state, summary) {
  const scores = summary.institutionScores ?? {};
  const corrections = [];
  for (const result of summary.prestigeScoring ?? []) {
    const player = (state.players ?? []).find(p => p.id === result.playerId);
    if (!player) continue;
    let excess = 0;
    const details = [];
    for (const institutionId of INSTITUTION_IDS) {
      const entry = (result.entries ?? []).find(row => row.reason === `institution_${institutionId}`);
      if (!entry) continue;
      const oldAmount = n(entry.amount);
      const desired = agentCount(player, institutionId) > 0 ? Math.max(0, n(scores[institutionId]?.score)) : 0;
      const delta = Math.max(0, oldAmount - desired);
      entry.amount = desired; excess += delta;
      details.push({ institutionId, oldAmount, desired, corrected: delta });
    }
    if (excess <= 0) continue;
    result.delta = n(result.delta) - excess;
    result.after = Math.max(0, n(result.after) - excess);
    corrections.push({ playerId: player.id, excessRemoved: excess, details, correctedPreChaosPrestige: result.after });
  }
  for (const player of state.players ?? []) {
    const result = (summary.prestigeScoring ?? []).find(row => row.playerId === player.id);
    if (!result) continue;
    let finalPrestige = Math.max(0, n(result.after));
    if (summary.chaos?.triggered) {
      const loss = finalPrestige > 0 ? Math.ceil(finalPrestige * 0.20) : 0;
      finalPrestige = Math.max(0, finalPrestige - loss);
      const chaosRow = (summary.chaos.prestigeLosses ?? []).find(row => row.playerId === player.id);
      if (chaosRow) {
        chaosRow.before = n(result.after); chaosRow.requestedLoss = loss; chaosRow.actualLoss = loss; chaosRow.after = finalPrestige;
      }
    }
    player.prestige = finalPrestige;
  }
  summary.prestigeAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, player.prestige]));
  summary.institutionPrestigeAwards = (summary.prestigeScoring ?? []).flatMap(result => (result.entries ?? [])
    .filter(entry => String(entry.reason ?? '').startsWith('institution_'))
    .map(entry => ({ playerId: result.playerId, institutionId: String(entry.reason).replace('institution_', ''), amount: n(entry.amount) })));
  summary.institutionPrestigeAssociationCorrections = corrections;
  summary.institutionPrestigePerFamilyOnce = true;
  return corrections;
}

function recomputeFirstPlayer(state, summary) {
  const players = [...(state.players ?? [])];
  if (!players.length) return null;
  const maxInfluence = Math.max(...players.map(player => n(player.influence)));
  let finalists = players.filter(player => n(player.influence) === maxInfluence);
  let tieBreakMethod = 'influence', maxPrestige = null, maxWealth = null, randomRoll = null;
  if (finalists.length > 1) {
    maxPrestige = Math.max(...finalists.map(player => n(player.prestige)));
    finalists = finalists.filter(player => n(player.prestige) === maxPrestige); tieBreakMethod = 'prestige';
  }
  if (finalists.length > 1) {
    maxWealth = Math.max(...finalists.map(player => n(player.wealthCapacity)));
    finalists = finalists.filter(player => n(player.wealthCapacity) === maxWealth); tieBreakMethod = 'wealth';
  }
  if (finalists.length > 1) {
    randomRoll = nextRand(state);
    finalists = [finalists[Math.min(finalists.length - 1, Math.floor(randomRoll * finalists.length))]];
    tieBreakMethod = 'random';
  }
  state.firstPlayerId = finalists[0]?.id ?? state.firstPlayerId;
  const resolution = { nextFirstPlayerId: state.firstPlayerId, maxInfluence, maxPrestige, maxWealth, tieBreakMethod, randomRoll, correctedForInstitutionRules: true };
  summary.firstPlayerResolution = resolution; summary.nextFirstPlayerId = state.firstPlayerId;
  return resolution;
}

function injectInstitutionActions(summary, actions) {
  if (!actions.length) return;
  summary.actions = [...actions, ...(summary.actions ?? [])];
  summary.actions.forEach((action, index) => { action.sequence = index + 1; });
  summary.institutionDevelopmentActions = actions;
}

export const V121_PLAYTEST_API = Object.freeze({
  listInstitutionDevelopments(state, playerId) {
    ensureInstitutionTierState(state);
    const player = (state.players ?? []).find(row => row.id === playerId);
    if (!player) return [];
    const scores = currentInstitutionScores(state);
    return (state.institutions ?? []).map(institution => institutionDevelopmentCandidate(state, player, institution, scores))
      .filter(Boolean).map(candidate => ({
        institutionId: candidate.institution.id,
        institutionName: candidate.institution.name,
        tier: candidate.institution.tier,
        phase: candidate.cost.phase,
        influenceCost: candidate.cost.influenceCost,
        wealthCost: candidate.cost.wealthCost,
        prestige: candidate.cost.prestige,
        completesTier: candidate.completesTier,
      }));
  },
  applyInstitutionDevelopmentNow(state, playerId, institutionId) {
    ensureInstitutionTierState(state);
    const player = (state.players ?? []).find(row => row.id === playerId);
    const institution = (state.institutions ?? []).find(row => row.id === institutionId);
    if (!player || !institution) return null;
    const candidate = institutionDevelopmentCandidate(state, player, institution, currentInstitutionScores(state));
    return candidate ? executeInstitutionDevelopment(state, player, candidate) : null;
  },
  queueInstitutionDevelopment(state, playerId, institutionId) {
    state.__playtestInstitutionDevelopmentQueue ??= [];
    state.__playtestInstitutionDevelopmentQueue.push({ playerId, institutionId });
  },
});

export function prepareV111State(state, options = {}) {
  const prepared = legacy.prepareV111State(state, options);
  ensureInstitutionTierState(state);
  return prepared;
}
export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = legacy.createV084Game(familyNames);
  ensureInstitutionTierState(state);
  if (typeof legacy.applyAutoDemand === 'function') legacy.applyAutoDemand(state);
  return state;
}
export function resolveAutomatedGeneration(state) {
  legacy.prepareV111State(state);
  ensureInstitutionTierState(state);
  const generation = n(state.generation);
  const developmentActions = runInstitutionDevelopmentAI(state);
  const summary = legacy.resolveAutomatedGeneration(state);
  injectInstitutionActions(summary, developmentActions);
  applyInfluenceCaps(state, summary);
  applySingleAssociationPrestige(state, summary);
  recomputeFirstPlayer(state, summary);
  if (typeof legacy.applyAutoDemand === 'function') legacy.applyAutoDemand(state);
  summary.institutionTierRules = {
    version: VERSION, generation, influenceCaps: { ...INFLUENCE_CAP_BY_TIER }, developmentCosts: DEVELOPMENT_COSTS,
    sameAsProductionDevelopment: true, extraAgentsBeyondCapBenefit: 'intrigue_access_only',
    aiDevelopmentGuardrail: MAX_SIM_INSTITUTION_DEVELOPMENTS_PER_FAMILY,
  };
  summary.institutionTiers = Object.fromEntries((state.institutions ?? []).map(inst => [inst.id, {
    tier: inst.tier, developmentPhase: inst.developmentPhase, developmentTargetTier: inst.developmentTargetTier,
  }]));
  return summary;
}
