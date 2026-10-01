import * as legacy from "./v112-tithe-engine.js?base=0.11.2-tithe";

export * from "./v112-tithe-engine.js?base=0.11.2-tithe";

export const INTRIGUE_TIMINGS = Object.freeze({
  ACTION: "action",
  REACTION: "reaction",
  RESOLUTION: "resolution",
});

export const INTRIGUE_INSTITUTIONS = Object.freeze([
  "city_guard",
  "temple",
  "merchant_guild",
  "scholarium",
]);

const TIMING_SET = new Set(Object.values(INTRIGUE_TIMINGS));
const INSTITUTION_SET = new Set(INTRIGUE_INSTITUTIONS);
const INTRIGUE_SEED_XOR = 0x9e3779b9;

function clampInt(value, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  const n = Math.floor(Number(value) || 0);
  return Math.max(minimum, Math.min(maximum, n));
}

function nextIntrigueRandom(state) {
  if (!Number.isInteger(state.intrigueRngState)) {
    const baseSeed = Number(state.rngState) >>> 0;
    state.intrigueRngState = (baseSeed ^ INTRIGUE_SEED_XOR) >>> 0;
  }
  state.intrigueRngState = (
    Math.imul(1664525, state.intrigueRngState >>> 0) + 1013904223
  ) >>> 0;
  return state.intrigueRngState / 4294967296;
}

function emptyDeckState() {
  return { drawPile: [], discardPile: [], removed: [] };
}

function emptyHands(state) {
  return Object.fromEntries((state.players ?? []).map(player => [player.id, []]));
}

export function ensureIntrigueState(state) {
  state.intrigue ??= {
    definitions: {},
    decks: {},
    hands: {},
    inPlay: [],
    acquisitionHistory: [],
    playHistory: [],
    cleanupHistory: [],
    lastAcquiredGeneration: null,
  };

  state.intrigue.definitions ??= {};
  state.intrigue.decks ??= {};
  state.intrigue.hands ??= {};
  state.intrigue.inPlay ??= [];
  state.intrigue.acquisitionHistory ??= [];
  state.intrigue.playHistory ??= [];
  state.intrigue.cleanupHistory ??= [];

  for (const institutionId of INTRIGUE_INSTITUTIONS) {
    state.intrigue.decks[institutionId] ??= emptyDeckState();
  }
  for (const player of state.players ?? []) {
    state.intrigue.hands[player.id] ??= [];
  }
  return state.intrigue;
}

function normalizeCardDefinition(raw) {
  const id = String(raw?.id ?? "").trim();
  const name = String(raw?.name ?? id).trim();
  const institutionId = String(raw?.institutionId ?? "").trim();
  const timing = String(raw?.timing ?? "").trim();
  const copies = clampInt(raw?.copies ?? 1, 1, 99);
  const influenceCost = raw?.influenceCost == null
    ? null
    : clampInt(raw.influenceCost, 0, 99);

  if (!id) throw new Error("Intrigue card definition requires an id");
  if (!INSTITUTION_SET.has(institutionId)) {
    throw new Error(`Unknown Intrigue institution: ${institutionId}`);
  }
  if (!TIMING_SET.has(timing)) {
    throw new Error(`Unknown Intrigue timing: ${timing}`);
  }

  return {
    id,
    name,
    institutionId,
    timing,
    influenceCost,
    copies,
    unique: Boolean(raw?.unique),
    permanent: Boolean(raw?.permanent),
    resolutionType: raw?.resolutionType ? String(raw.resolutionType) : null,
    implemented: Boolean(raw?.implemented),
    tags: Array.isArray(raw?.tags) ? [...raw.tags] : [],
  };
}

function shuffle(state, cards) {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextIntrigueRandom(state) * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function configureIntrigueDecks(state, cardDefinitions = []) {
  const intrigue = ensureIntrigueState(state);
  intrigue.definitions = {};
  intrigue.decks = Object.fromEntries(
    INTRIGUE_INSTITUTIONS.map(institutionId => [institutionId, emptyDeckState()]),
  );
  intrigue.hands = emptyHands(state);
  intrigue.inPlay = [];
  intrigue.acquisitionHistory = [];
  intrigue.playHistory = [];
  intrigue.cleanupHistory = [];
  intrigue.lastAcquiredGeneration = null;

  for (const raw of cardDefinitions) {
    const definition = normalizeCardDefinition(raw);
    if (intrigue.definitions[definition.id]) {
      throw new Error(`Duplicate Intrigue card definition id: ${definition.id}`);
    }
    intrigue.definitions[definition.id] = definition;
    for (let copy = 1; copy <= definition.copies; copy += 1) {
      intrigue.decks[definition.institutionId].drawPile.push({
        instanceId: `${definition.id}#${copy}`,
        cardId: definition.id,
      });
    }
  }

  for (const institutionId of INTRIGUE_INSTITUTIONS) {
    shuffle(state, intrigue.decks[institutionId].drawPile);
  }
  return getIntrigueSnapshot(state);
}

function recycleDiscard(state, institutionId) {
  const deck = ensureIntrigueState(state).decks[institutionId];
  if (deck.drawPile.length || !deck.discardPile.length) return;
  deck.drawPile = shuffle(state, deck.discardPile.splice(0));
}

function drawCard(state, institutionId) {
  const intrigue = ensureIntrigueState(state);
  recycleDiscard(state, institutionId);
  return intrigue.decks[institutionId].drawPile.pop() ?? null;
}

function discardCard(state, card) {
  if (!card) return;
  const intrigue = ensureIntrigueState(state);
  const definition = intrigue.definitions[card.cardId];
  if (!definition) return;
  intrigue.decks[definition.institutionId].discardPile.push({
    instanceId: card.instanceId,
    cardId: card.cardId,
  });
}

function chooseKeptCardIndex(state, options) {
  if (options.length <= 1) return 0;
  return Math.min(options.length - 1, Math.floor(nextIntrigueRandom(state) * options.length));
}

export function acquireIntrigueCards(state) {
  const intrigue = ensureIntrigueState(state);
  const generation = Number(state.generation) || 0;
  if (intrigue.lastAcquiredGeneration === generation) {
    return intrigue.acquisitionHistory.find(entry => entry.generation === generation) ?? null;
  }

  const selections = [];
  for (const player of state.players ?? []) {
    const agents = [...(player.institutionAgentRoster ?? [])]
      .sort((a, b) => (a.placementOrder ?? 0) - (b.placementOrder ?? 0));
    for (const agent of agents) {
      if (!INSTITUTION_SET.has(agent.institutionId)) continue;
      const drawCount = clampInt(agent.seniority ?? 1, 1, 3);
      const options = [];
      for (let i = 0; i < drawCount; i += 1) {
        const card = drawCard(state, agent.institutionId);
        if (!card) break;
        options.push(card);
      }
      if (!options.length) {
        selections.push({
          playerId: player.id,
          agentId: agent.id,
          institutionId: agent.institutionId,
          seniority: drawCount,
          cardsSeen: [],
          keptCard: null,
          reason: "deck_empty",
        });
        continue;
      }

      const keptIndex = chooseKeptCardIndex(state, options);
      const kept = options[keptIndex];
      options.forEach((card, index) => {
        if (index !== keptIndex) discardCard(state, card);
      });
      intrigue.hands[player.id].push({
        ...kept,
        acquiredGeneration: generation,
        sourceAgentId: agent.id,
      });
      selections.push({
        playerId: player.id,
        agentId: agent.id,
        institutionId: agent.institutionId,
        seniority: drawCount,
        cardsSeen: options.map(card => card.cardId),
        keptCard: kept.cardId,
        keptInstanceId: kept.instanceId,
      });
    }
  }

  const entry = { generation, selections };
  intrigue.acquisitionHistory.push(entry);
  intrigue.lastAcquiredGeneration = generation;
  return entry;
}

export function expireIntrigueHands(state, generation = null) {
  const intrigue = ensureIntrigueState(state);
  const expired = [];
  for (const player of state.players ?? []) {
    const hand = intrigue.hands[player.id] ?? [];
    for (const card of hand) {
      const definition = intrigue.definitions[card.cardId];
      expired.push({
        playerId: player.id,
        instanceId: card.instanceId,
        cardId: card.cardId,
        institutionId: definition?.institutionId ?? null,
      });
      discardCard(state, card);
    }
    intrigue.hands[player.id] = [];
  }
  const entry = {
    generation: generation ?? Math.max(0, (Number(state.generation) || 1) - 1),
    expired,
  };
  intrigue.cleanupHistory.push(entry);
  return entry;
}

export function validateIntriguePlay(state, playerId, instanceId, context = {}) {
  const intrigue = ensureIntrigueState(state);
  const player = (state.players ?? []).find(item => item.id === playerId) ?? null;
  if (!player) return { ok: false, reason: "unknown_player" };
  const hand = intrigue.hands[playerId] ?? [];
  const card = hand.find(item => item.instanceId === instanceId) ?? null;
  if (!card) return { ok: false, reason: "card_not_in_hand" };
  const definition = intrigue.definitions[card.cardId];
  if (!definition) return { ok: false, reason: "unknown_card_definition" };
  if (!definition.implemented) return { ok: false, reason: "effect_unimplemented", card, definition };
  if (definition.influenceCost == null) return { ok: false, reason: "influence_cost_tbd", card, definition };
  if (player.influence < definition.influenceCost) return { ok: false, reason: "insufficient_influence", card, definition };

  const requestedTiming = String(context.timing ?? definition.timing);
  if (requestedTiming !== definition.timing) return { ok: false, reason: "wrong_timing", card, definition };
  if (definition.timing === INTRIGUE_TIMINGS.ACTION && context.actionAvailable === false) {
    return { ok: false, reason: "no_player_action_available", card, definition };
  }
  if (definition.timing === INTRIGUE_TIMINGS.RESOLUTION
      && definition.resolutionType === "vote"
      && !context.votePlaced) {
    return { ok: false, reason: "vote_not_placed", card, definition };
  }
  return { ok: true, player, card, definition };
}

export function playIntrigueCard(state, playerId, instanceId, context = {}) {
  const validation = validateIntriguePlay(state, playerId, instanceId, context);
  if (!validation.ok) return validation;
  const { player, card, definition } = validation;
  if (typeof context.effectResolver !== "function") {
    return { ok: false, reason: "missing_effect_resolver", card, definition };
  }

  const result = context.effectResolver({ state, player, card, definition, context });
  if (result === false || result?.ok === false) {
    return { ok: false, reason: result?.reason ?? "effect_rejected", card, definition };
  }

  player.influence -= definition.influenceCost;
  const intrigue = ensureIntrigueState(state);
  intrigue.hands[playerId] = (intrigue.hands[playerId] ?? [])
    .filter(item => item.instanceId !== instanceId);

  if (definition.permanent) {
    intrigue.inPlay.push({
      ...card,
      ownerId: playerId,
      playedGeneration: Number(state.generation) || 0,
    });
  } else {
    discardCard(state, card);
  }

  const log = {
    generation: Number(state.generation) || 0,
    playerId,
    instanceId,
    cardId: definition.id,
    timing: definition.timing,
    influenceCost: definition.influenceCost,
    permanent: definition.permanent,
  };
  intrigue.playHistory.push(log);
  return { ok: true, log, effect: result ?? null };
}

export function getIntrigueSnapshot(state) {
  const intrigue = ensureIntrigueState(state);
  const decks = {};
  for (const institutionId of INTRIGUE_INSTITUTIONS) {
    const deck = intrigue.decks[institutionId];
    decks[institutionId] = {
      draw: deck.drawPile.length,
      discard: deck.discardPile.length,
      removed: deck.removed.length,
    };
  }
  return {
    generation: Number(state.generation) || 0,
    definitions: Object.keys(intrigue.definitions).length,
    decks,
    hands: Object.fromEntries(
      (state.players ?? []).map(player => [player.id, (intrigue.hands[player.id] ?? []).map(card => ({ ...card }))]),
    ),
    inPlay: intrigue.inPlay.map(card => ({ ...card })),
  };
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = legacy.createV084Game(familyNames);
  ensureIntrigueState(state);
  return state;
}

export function applyAutoDemand(state) {
  ensureIntrigueState(state);
  legacy.applyAutoDemand(state);
}

export function previewEconomy(state) {
  ensureIntrigueState(state);
  return legacy.previewEconomy(state);
}

export function resolveAutomatedGeneration(state) {
  ensureIntrigueState(state);
  const generation = Number(state.generation) || 0;
  const acquisition = acquireIntrigueCards(state);
  const summary = legacy.resolveAutomatedGeneration(state);
  const cleanup = expireIntrigueHands(state, generation);
  summary.intrigue = {
    generation,
    acquisition,
    cleanup,
    snapshotAfterCleanup: getIntrigueSnapshot(state),
  };
  return summary;
}

export function setInstitutionAgentCount(state, playerId, institutionId, value) {
  ensureIntrigueState(state);
  legacy.setInstitutionAgentCount(state, playerId, institutionId, value);
}

export function setCityValue(state, key, value) {
  ensureIntrigueState(state);
  legacy.setCityValue(state, key, value);
}

export function getInstitutionPreview(state) {
  ensureIntrigueState(state);
  return legacy.getInstitutionPreview(state);
}
