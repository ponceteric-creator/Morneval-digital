import * as legacy from './v115-intrigue-upkeep-wrapper.js?core=0.11.5-intrigue2';
import { INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';

export * from './v115-intrigue-upkeep-wrapper.js?core=0.11.5-intrigue2';

function finalFamilyMap(state, key) {
  return Object.fromEntries((state.players ?? []).map(player => [player.id, Number(player[key]) || 0]));
}

function expectedIntrigueWealthSources(state) {
  const byPlayer = {};
  const sources = [];
  const add = (playerId, card, assetId = null) => {
    if (!playerId || playerId === 'city' || playerId === 'public') return;
    byPlayer[playerId] = (byPlayer[playerId] ?? 0) + 1;
    sources.push({ playerId, cardId: card.cardId, instanceId: card.instanceId, assetId, wealth: 1 });
  };

  for (const card of state.intrigue?.inPlay ?? []) {
    const definition = INTRIGUE_CARD_META[card.cardId];
    const tags = definition?.tags ?? [];
    if (tags.includes('patent')) {
      add(card.ownerId, card);
      continue;
    }
    if (tags.includes('land_improvement')) {
      const land = (state.lands ?? []).find(item => item.id === card.targetLandId);
      if (land?.development === 'natural') add(land.ownerId, card, land.id);
    }
  }
  return { byPlayer, sources };
}

function syncWealthSummary(state, summary) {
  const finalWealth = finalFamilyMap(state, 'wealthCapacity');
  const expected = expectedIntrigueWealthSources(state);
  const existing = new Map((summary.wealthCommitments ?? []).map(entry => [entry.playerId, entry]));
  const synced = [];
  const deltas = [];

  for (const player of state.players ?? []) {
    const prior = existing.get(player.id) ?? { playerId: player.id, committed: 0, actionCommitted: 0, agentCommitted: 0 };
    const before = Math.max(0, Number(prior.gross) || 0);
    const gross = Math.max(0, Number(finalWealth[player.id]) || 0);
    const committed = Math.max(0, Number(prior.committed) || 0);
    const available = Math.max(0, gross - committed);
    const shortfall = Math.max(0, committed - gross);
    const actualBonus = gross - before;

    player.wealthGeneratedThisGeneration = gross;
    player.lastWealthCommitted = committed;
    player.lastWealthAvailable = available;
    player.lastWealthShortfall = shortfall;

    synced.push({ ...prior, gross, committed, available, shortfall });
    deltas.push({
      playerId: player.id,
      before,
      intrigueBonus: actualBonus,
      expectedIntrigueBonus: expected.byPlayer[player.id] ?? 0,
      after: gross,
    });
  }

  summary.wealthAfter = finalWealth;
  summary.wealthCommitments = synced;
  summary.intrigueWealth = { deltas, sources: expected.sources };
}

function recomputeFirstPlayer(state, summary) {
  const players = [...(state.players ?? [])];
  if (!players.length) return;

  const maxInfluence = Math.max(...players.map(player => Number(player.influence) || 0));
  let finalists = players.filter(player => (Number(player.influence) || 0) === maxInfluence);
  let tieBreakMethod = 'influence';
  let maxPrestige = null;
  let maxWealth = null;
  let randomRoll = null;

  if (finalists.length > 1) {
    maxPrestige = Math.max(...finalists.map(player => Number(player.prestige) || 0));
    finalists = finalists.filter(player => (Number(player.prestige) || 0) === maxPrestige);
    tieBreakMethod = 'prestige';
  }
  if (finalists.length > 1) {
    maxWealth = Math.max(...finalists.map(player => Number(player.wealthCapacity) || 0));
    finalists = finalists.filter(player => (Number(player.wealthCapacity) || 0) === maxWealth);
    tieBreakMethod = 'wealth';
  }
  if (finalists.length > 1) {
    state.rngState = (Math.imul(1664525, state.rngState >>> 0) + 1013904223) >>> 0;
    randomRoll = state.rngState / 4294967296;
    finalists = [finalists[Math.min(finalists.length - 1, Math.floor(randomRoll * finalists.length))]];
    tieBreakMethod = 'random';
  }

  const winner = finalists[0];
  if (!winner) return;
  state.firstPlayerId = winner.id;
  summary.firstPlayerResolution = {
    nextFirstPlayerId: winner.id,
    maxInfluence,
    maxPrestige,
    maxWealth,
    tieBreakMethod,
    randomRoll,
    recalculatedAfterIntrigue: true,
  };
  summary.nextFirstPlayerId = winner.id;
}

function syncFinalFamilyState(state, summary) {
  syncWealthSummary(state, summary);
  summary.influenceAfter = finalFamilyMap(state, 'influence');
  summary.prestigeAfter = finalFamilyMap(state, 'prestige');
  recomputeFirstPlayer(state, summary);

  // Legacy pushes the same summary object into history, but sync explicitly so
  // future wrappers cannot accidentally leave History on a stale pre-Intrigue snapshot.
  const history = state.history ?? [];
  const entry = [...history].reverse().find(item => item.generation === summary.generation);
  if (entry && entry !== summary) {
    entry.wealthAfter = { ...summary.wealthAfter };
    entry.wealthCommitments = summary.wealthCommitments.map(item => ({ ...item }));
    entry.influenceAfter = { ...summary.influenceAfter };
    entry.prestigeAfter = { ...summary.prestigeAfter };
    entry.firstPlayerResolution = { ...summary.firstPlayerResolution };
    entry.nextFirstPlayerId = summary.nextFirstPlayerId;
    entry.intrigueWealth = JSON.parse(JSON.stringify(summary.intrigueWealth));
  }
}

export function resolveAutomatedGeneration(state) {
  const summary = legacy.resolveAutomatedGeneration(state);
  syncFinalFamilyState(state, summary);
  return summary;
}
