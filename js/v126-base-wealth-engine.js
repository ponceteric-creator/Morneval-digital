import * as legacy from './v125-market-reward-engine.js?base=0.11.16';

export * from './v125-market-reward-engine.js?base=0.11.16';
export const V126_VERSION = '0.11.17';
export const FAMILY_BASE_WEALTH = 2;

function n(value) { return Number(value) || 0; }

function applyBaseWealthIncrement(state, summary = null) {
  for (const player of state.players ?? []) {
    // v0.11.16 resolves the legacy economy from a 1-Wealth baseline.
    // Add exactly +1 persistent capacity so the effective Family baseline is 2,
    // while preserving every other Wealth source unchanged.
    player.wealthCapacity = Math.max(FAMILY_BASE_WEALTH, n(player.wealthCapacity) + 1);
    player.wealthGeneratedThisGeneration = player.wealthCapacity;
  }

  if (summary) {
    summary.wealthAfter = Object.fromEntries(
      (state.players ?? []).map(player => [player.id, player.wealthCapacity]),
    );
    summary.baseWealthRule = {
      version: V126_VERSION,
      familyBaseWealth: FAMILY_BASE_WEALTH,
      incrementVsLegacyBaseline: 1,
      rule: 'Each Family has permanent base Wealth capacity 2 before other Wealth sources.',
    };
  }
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = legacy.createV084Game(familyNames);
  applyBaseWealthIncrement(state);
  return state;
}

export function prepareV111State(state, options = {}) {
  const prepared = typeof legacy.prepareV111State === 'function'
    ? legacy.prepareV111State(state, options)
    : state;
  for (const player of state.players ?? []) {
    player.wealthCapacity = Math.max(FAMILY_BASE_WEALTH, n(player.wealthCapacity));
  }
  return prepared;
}

export function resolveAutomatedGeneration(state) {
  // Ensure the extra baseline capacity is available during Player Actions and
  // Agent support checks, not merely added after scoring.
  for (const player of state.players ?? []) {
    player.wealthCapacity = Math.max(FAMILY_BASE_WEALTH, n(player.wealthCapacity));
  }

  const summary = legacy.resolveAutomatedGeneration(state);
  applyBaseWealthIncrement(state, summary);
  return summary;
}
