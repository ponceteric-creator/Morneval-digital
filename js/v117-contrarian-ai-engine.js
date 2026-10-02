import * as legacy from './v111-ai-engine.js?original=0.11.1-v117';
import { ACTIVE_INTRIGUE_CARDS, INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';

export * from './v111-ai-engine.js?original=0.11.1-v117';
export const V090_CONFIG = legacy.V090_CONFIG;

const CONTRARIAN_VERSION = '0.11.7';
const INSTITUTIONS = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];
const INSTITUTION_LABELS = {
  city_guard: 'City Guard',
  temple: 'Temple',
  merchant_guild: 'Merchant Guild',
  scholarium: 'Scholarium College',
};
const POWER_WEIGHT = { LOW: 0.85, MID: 1.55, HIGH: 2.45 };
const RETARGET_MARGIN = 0.28;
const RETARGET_MIN_SCORE = 1.15;

// Contrarian receives no resources or rules exception. The profile only changes
// how the existing heuristic values long-horizon engine building.
V090_CONFIG.personalities.contrarian = {
  label: 'Contrarian',
  prestige: 1.00,
  wealth: 1.00,
  engine: 1.12,
  civic: 0.82,
  horizon: 4,
  discount: 0.90,
};

function clamp(value, lo = 0, hi = Number.POSITIVE_INFINITY) {
  return Math.max(lo, Math.min(hi, Number(value) || 0));
}

function countAgents(player, institutionId = null) {
  return (player?.institutionAgentRoster ?? []).filter(agent => !institutionId || agent.institutionId === institutionId).length;
}

function syncAgentCounts(player) {
  player.institutionAgents ??= {};
  for (const institutionId of INSTITUTIONS) {
    player.institutionAgents[institutionId] = countAgents(player, institutionId);
  }
}

function ensureContrarianIdentity(state) {
  if (!state?.players?.length) return null;
  let contrarian = state.players.find(player => player.aiPersonality === 'contrarian') ?? null;
  if (contrarian) return contrarian;

  // In the standard three-family simulation the Contrarian replaces the old
  // generic Opportunist. The Opportunist profile remains available for custom states.
  contrarian = state.players.find(player => player.aiPersonality === 'opportunist')
    ?? state.players[state.players.length - 1];
  if (contrarian) contrarian.aiPersonality = 'contrarian';
  return contrarian;
}

function cardsInPlay(state) {
  return state.intrigue?.inPlay ?? [];
}

function permanentAlreadyClaimed(state, cardId) {
  return cardsInPlay(state).some(card => card.cardId === cardId);
}

function publicSignals(state, player) {
  const opponents = (state.players ?? []).filter(item => item.id !== player.id);
  const opponentNaturalLands = (state.lands ?? []).filter(land =>
    land.revealed && land.development === 'natural' && opponents.some(item => item.id === land.ownerId));
  const landByOpponent = Object.fromEntries(opponents.map(item => [item.id, 0]));
  for (const land of opponentNaturalLands) landByOpponent[land.ownerId] = (landByOpponent[land.ownerId] ?? 0) + 1;

  const opponentStakes = opponents.flatMap(item => (item.productionStakes ?? []).map(stake => ({ player: item, stake })));
  const matureElderStakes = opponentStakes.filter(({ stake }) => stake.age === 'mature' || stake.age === 'elder');
  const sectorConcentration = {};
  for (const { stake } of opponentStakes) sectorConcentration[stake.sectorId] = (sectorConcentration[stake.sectorId] ?? 0) + 1;

  const opponentAgentsByInstitution = Object.fromEntries(INSTITUTIONS.map(id => [id, 0]));
  for (const opponent of opponents) {
    for (const institutionId of INSTITUTIONS) {
      opponentAgentsByInstitution[institutionId] += countAgents(opponent, institutionId);
    }
  }

  const opponentPatents = cardsInPlay(state).filter(card => {
    const def = INTRIGUE_CARD_META[card.cardId];
    return def?.tags?.includes('patent') && card.ownerId !== player.id;
  });

  const ownNaturalLands = (state.lands ?? []).filter(land =>
    land.revealed && land.development === 'natural' && land.ownerId === player.id);
  const ownTerrain = { hill: 0, meadow: 0, forest: 0 };
  for (const land of ownNaturalLands) {
    const terrain = land.originalTerrain ?? land.terrain;
    if (terrain in ownTerrain) ownTerrain[terrain] += 1;
  }

  const ownStakes = player.productionStakes ?? [];
  const upgradeableSectors = (state.productionSectors ?? []).filter(sector => sector.id !== 'food' && sector.tier < 3).length;
  const vacantYoungSlots = (state.productionSectors ?? []).filter(sector => sector.id !== 'food').reduce((sum, sector) => {
    const occupied = (state.players ?? []).flatMap(item => item.productionStakes ?? [])
      .filter(stake => stake.sectorId === sector.id && stake.age === 'young').length;
    return sum + Math.max(0, (Number(sector.tier) || 0) - occupied);
  }, 0);
  const externalDemand = (state.productionSectors ?? []).reduce((sum, sector) =>
    sum + Math.max(0, Number(sector.demandThisGeneration?.external_markets) || 0), 0);

  const foodCapacity = (state.lands ?? []).filter(land => land.revealed && land.development === 'farm')
    .reduce((sum, land) => sum + Math.max(0, Number(land.baseCapacity) || 0), 0);
  const population = Math.max(1, Number(state.city?.population) || 1);
  const foodStress = clamp((population - foodCapacity) / population, 0, 1.5);

  return {
    opponents,
    opponentNaturalLands: opponentNaturalLands.length,
    maxOpponentNaturalLands: Math.max(0, ...Object.values(landByOpponent)),
    opponentMatureElderStakes: matureElderStakes.length,
    maxOpponentSectorConcentration: Math.max(0, ...Object.values(sectorConcentration)),
    opponentAgentsByInstitution,
    opponentAgentsTotal: Object.values(opponentAgentsByInstitution).reduce((a, b) => a + b, 0),
    opponentPatents: opponentPatents.length,
    ownNaturalLands: ownNaturalLands.length,
    ownTerrain,
    ownStakes: ownStakes.length,
    upgradeableSectors,
    vacantYoungSlots,
    externalDemand,
    foodStress,
    squalor: Math.max(0, Number(state.city?.squalor) || 0),
    order: clamp(state.city?.order ?? 2, 0, 4),
    influence: Math.max(0, Number(player.influence) || 0),
    prestige: Math.max(0, Number(player.prestige) || 0),
    generation: Math.max(0, Number(state.generation) || 0),
  };
}

function cardOpportunity(state, player, card, s) {
  if (!card) return 0;
  if (card.permanent && permanentAlreadyClaimed(state, card.id)) return 0;

  let score = POWER_WEIGHT[card.power] ?? 1;
  const tags = new Set(card.tags ?? []);
  const oppAgentsHere = s.opponentAgentsByInstitution[card.institutionId] ?? 0;

  if (tags.has('land')) score += s.opponentNaturalLands * 0.18 + s.maxOpponentNaturalLands * 0.35;
  if (tags.has('stake')) score += s.opponentMatureElderStakes * 0.20 + s.maxOpponentSectorConcentration * 0.30;
  if (tags.has('agents') || tags.has('agent')) score += oppAgentsHere * 0.24;
  if (tags.has('tax')) score += oppAgentsHere * 0.18;
  if (tags.has('patent')) score += s.opponentPatents * 0.33;
  if (tags.has('development')) score += s.upgradeableSectors * 0.24;
  if (tags.has('squalor')) score += Math.min(2.0, s.squalor * 0.35);
  if (tags.has('order')) score += Math.max(0, 3 - s.order) * 0.42;
  if (tags.has('food') || tags.has('reserve')) score += s.foodStress * 0.55;
  if (tags.has('external_demand')) score += Math.min(1.5, s.externalDemand * 0.10) + s.ownStakes * 0.10;
  if (tags.has('auction')) score += Math.min(1.0, s.vacantYoungSlots * 0.12);
  if (tags.has('influence_gain') || tags.has('temporary_influence')) score += Math.max(0, 8 - s.influence) * 0.10;

  switch (card.id) {
    case 'land_seizure':
      score += s.opponentNaturalLands * 0.30 + s.maxOpponentNaturalLands * 0.62;
      break;
    case 'ecclesiastical_confiscation':
      score += s.opponentNaturalLands * 0.14 + s.maxOpponentNaturalLands * 0.24;
      break;
    case 'hostile_takeover':
      score += s.opponentMatureElderStakes * 0.30 + s.maxOpponentSectorConcentration * 0.55;
      break;
    case 'officer_purge':
    case 'hunt_heretics':
    case 'expose_charlatans':
    case 'audit_license_privileges':
      score += oppAgentsHere * 0.35;
      break;
    case 'crooked_notary':
    case 'legal_contestation':
      score += s.opponentPatents * 0.65;
      break;
    case 'technological_acceleration':
      score += s.upgradeableSectors * 0.38;
      break;
    case 'alms_poor':
      score += Math.min(2.2, s.squalor * 0.50);
      break;
    case 'martial_law':
      score += Math.max(0, 3 - s.order) * 0.58;
      break;
    case 'gemstone_vein':
      score += s.ownTerrain.hill ? 1.35 : -1.30;
      break;
    case 'rare_breed':
      score += s.ownTerrain.meadow ? 1.35 : -1.30;
      break;
    case 'precious_timber':
      score += s.ownTerrain.forest ? 1.35 : -1.30;
      break;
    case 'binding_bids':
      score += Math.min(1.4, s.vacantYoungSlots * 0.20);
      break;
    case 'preferential_contracts':
    case 'private_buyer':
      score += s.ownStakes * 0.22;
      break;
    case 'assassination':
      score += Math.min(1.8, s.opponentAgentsTotal * 0.12);
      break;
    case 'spy_network':
      // The Contrarian never reads opponents' hidden cards. This is only the
      // generic option value of information/disruption.
      score += 0.45;
      break;
    default:
      break;
  }

  // Very expensive cards are still attractive when their board opportunity is real,
  // but their access value drops when the family is currently Influence-poor.
  const cost = Math.max(0, Number(card.influenceCost) || 0);
  if (cost > s.influence) score -= (cost - s.influence) * 0.24;
  else score -= cost * 0.05;

  return Math.max(0, score);
}

function institutionOpportunity(state, player, institutionId) {
  const s = publicSignals(state, player);
  const cards = ACTIVE_INTRIGUE_CARDS.filter(card => card.institutionId === institutionId);
  const evaluated = cards.map(card => ({
    cardId: card.id,
    name: card.name,
    copies: Math.max(1, Number(card.copies) || 1),
    score: cardOpportunity(state, player, card, s),
  }));
  const totalCopies = evaluated.reduce((sum, item) => sum + item.copies, 0) || 1;
  const expected = evaluated.reduce((sum, item) => sum + item.score * item.copies, 0) / totalCopies;
  const ranked = [...evaluated].sort((a, b) => b.score - a.score || b.copies - a.copies);
  const top = ranked[0]?.score ?? 0;
  const second = ranked[1]?.score ?? 0;

  const opponentAgents = s.opponentAgentsByInstitution[institutionId] ?? 0;
  const ownAgents = countAgents(player, institutionId);
  const neglectedBonus = Math.max(0, 0.75 - opponentAgents * 0.14);
  const congestionPenalty = ownAgents * 0.27;
  const score = expected * 0.64 + top * 0.25 + second * 0.11 + neglectedBonus - congestionPenalty;

  return {
    institutionId,
    label: INSTITUTION_LABELS[institutionId],
    score: Math.max(0, score),
    expected,
    topCards: ranked.slice(0, 3),
    opponentAgents,
    ownAgents,
    neglectedBonus,
    congestionPenalty,
  };
}

function buildPlan(state, player) {
  const opportunities = INSTITUTIONS.map(id => institutionOpportunity(state, player, id))
    .sort((a, b) => b.score - a.score);
  return {
    generation: Number(state.generation) || 0,
    playerId: player.id,
    familyName: player.familyName,
    opportunities,
    bestInstitutionId: opportunities[0]?.institutionId ?? null,
    bestScore: opportunities[0]?.score ?? 0,
    signals: publicSignals(state, player),
    hiddenOpponentHandsIgnored: true,
  };
}

function findNewAgents(player, beforeIds) {
  return (player.institutionAgentRoster ?? []).filter(agent => !beforeIds.has(agent.id));
}

function retargetNewAgents(state, player, newAgents) {
  const moves = [];
  for (const agent of newAgents) {
    const current = institutionOpportunity(state, player, agent.institutionId);
    const ranked = INSTITUTIONS.map(id => institutionOpportunity(state, player, id)).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (!best || best.institutionId === agent.institutionId) continue;
    if (best.score < RETARGET_MIN_SCORE || best.score < current.score + RETARGET_MARGIN) continue;

    const from = agent.institutionId;
    agent.institutionId = best.institutionId;
    syncAgentCounts(player);
    moves.push({
      agentId: agent.id,
      fromInstitutionId: from,
      toInstitutionId: best.institutionId,
      fromScore: current.score,
      toScore: best.score,
      topCards: best.topCards.slice(0, 2),
    });
  }
  return moves;
}

function patchActionLog(summary, player, moves) {
  for (const move of moves) {
    const action = (summary.actions ?? []).find(item => item.agentId === move.agentId && item.playerId === player.id);
    if (!action) continue;
    action.institutionId = move.toInstitutionId;
    action.aiPersonality = 'contrarian';
    action.aiUtilityBeforeContrarian = action.aiUtility;
    action.contrarianRetargeted = true;
    action.contrarianFromInstitutionId = move.fromInstitutionId;
    action.contrarianPlanScore = move.toScore;
    action.contrarianTopCards = move.topCards;
    action.type = `Agent placement: ${player.familyName} → ${INSTITUTION_LABELS[move.toInstitutionId]} (seniority 1, 1W reserved) · Contrarian plan`;
  }
}

function adjustInstitutionPrestige(state, summary, player, moves) {
  if (!moves.length) return 0;
  const scores = summary.institutionScores ?? {};
  let delta = 0;
  for (const move of moves) {
    delta += (Number(scores[move.toInstitutionId]?.score) || 0) - (Number(scores[move.fromInstitutionId]?.score) || 0);
  }
  if (!delta) return 0;

  const scoring = (summary.prestigeScoring ?? []).find(entry => entry.playerId === player.id);
  if (scoring) {
    for (const move of moves) {
      const fromReason = `institution_${move.fromInstitutionId}`;
      const toReason = `institution_${move.toInstitutionId}`;
      const fromValue = Number(scores[move.fromInstitutionId]?.score) || 0;
      const toValue = Number(scores[move.toInstitutionId]?.score) || 0;
      const fromEntry = scoring.entries?.find(entry => entry.reason === fromReason);
      if (fromEntry) fromEntry.amount -= fromValue;
      else scoring.entries?.push({ amount: -fromValue, reason: fromReason });
      const toEntry = scoring.entries?.find(entry => entry.reason === toReason);
      if (toEntry) toEntry.amount += toValue;
      else scoring.entries?.push({ amount: toValue, reason: toReason });
    }
    scoring.delta = (Number(scoring.delta) || 0) + delta;
    scoring.after = Math.max(0, (Number(scoring.after) || 0) + delta);
  }

  const chaosEntry = summary.chaos?.triggered
    ? summary.chaos.prestigeLosses?.find(entry => entry.playerId === player.id)
    : null;
  if (chaosEntry) {
    const correctedBefore = Math.max(0, (Number(chaosEntry.before) || 0) + delta);
    const requestedLoss = correctedBefore > 0 ? Math.ceil(correctedBefore * 0.20) : 0;
    const correctedAfter = Math.max(0, correctedBefore - requestedLoss);
    chaosEntry.before = correctedBefore;
    chaosEntry.requestedLoss = requestedLoss;
    chaosEntry.actualLoss = correctedBefore - correctedAfter;
    chaosEntry.after = correctedAfter;
    player.prestige = correctedAfter;
  } else {
    player.prestige = Math.max(0, (Number(player.prestige) || 0) + delta);
  }

  summary.prestigeAfter ??= {};
  summary.prestigeAfter[player.id] = player.prestige;
  summary.institutionPrestigeAwards = (summary.institutionPrestigeAwards ?? [])
    .filter(entry => entry.playerId !== player.id);
  for (const institutionId of INSTITUTIONS) {
    const amount = countAgents(player, institutionId) * (Number(scores[institutionId]?.score) || 0);
    if (amount) summary.institutionPrestigeAwards.push({ playerId: player.id, institutionId, amount });
  }
  return delta;
}

export function prepareV111State(state, options = {}) {
  legacy.prepareV111State(state, options);
  ensureContrarianIdentity(state);
  return state;
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = legacy.createV084Game(familyNames);
  ensureContrarianIdentity(state);
  return state;
}

export function resolveAutomatedGeneration(state) {
  legacy.prepareV111State(state);
  const contrarian = ensureContrarianIdentity(state);
  if (!contrarian) return legacy.resolveAutomatedGeneration(state);

  const planBefore = buildPlan(state, contrarian);
  const beforeAgentIds = new Set((contrarian.institutionAgentRoster ?? []).map(agent => agent.id));
  const summary = legacy.resolveAutomatedGeneration(state);
  const newAgents = findNewAgents(contrarian, beforeAgentIds);
  const moves = retargetNewAgents(state, contrarian, newAgents);
  patchActionLog(summary, contrarian, moves);
  const prestigeDelta = adjustInstitutionPrestige(state, summary, contrarian, moves);
  const planAfter = buildPlan(state, contrarian);

  state.contrarianAi ??= { version: CONTRARIAN_VERSION, history: [] };
  state.contrarianAi.version = CONTRARIAN_VERSION;
  const record = {
    version: CONTRARIAN_VERSION,
    generation: summary.generation,
    playerId: contrarian.id,
    planBefore,
    retargetedAgents: moves,
    institutionPrestigeCorrection: prestigeDelta,
    planAfter,
    hiddenOpponentHandsIgnored: true,
  };
  state.contrarianAi.history.push(record);
  summary.contrarianAi = record;
  summary.aiProfiles ??= {};
  summary.aiProfiles[contrarian.id] = {
    ...(summary.aiProfiles[contrarian.id] ?? {}),
    personality: 'contrarian',
    label: 'Contrarian',
    intrigueAware: true,
    counterpointPlanning: true,
  };
  return summary;
}
