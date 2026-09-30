import * as engine from "./v110-ai-engine.js?real=0.11.0-v111";
import * as base from "./v089-engine.js?base=0.8.9";

export * from "./v110-ai-engine.js?real=0.11.0-v111";

export const V090_CONFIG = engine.V090_CONFIG;

const INFLUENCE_DEFAULT = 15;
const DOMAIN_COSTS = [1, 2, 4, 6, 9, 12, 15];
const DEVELOPMENT_COSTS = {
  1: {
    1: { influenceCost: 2, wealthCost: 0, prestige: 4 },
    2: { influenceCost: 2, wealthCost: 0, prestige: 3 },
    3: { influenceCost: 2, wealthCost: 0, prestige: 2 },
  },
  2: {
    1: { influenceCost: 4, wealthCost: 0, prestige: 8 },
    2: { influenceCost: 4, wealthCost: 0, prestige: 6 },
    3: { influenceCost: 4, wealthCost: 0, prestige: 4 },
  },
};

let currentDevelopmentSector = null;
let currentInfluencePlayer = null;
let developmentProxyInstalled = false;
let domainCostInstalled = false;

// The previous AI heuristic kept 1 Wealth liquid after Agent placement.
// That is no longer part of the model: an Agent only needs the 1 Wealth it reserves.
if (V090_CONFIG?.agents) V090_CONFIG.agents.liquidityReserve = 0;

function domainCostFor(player) {
  if (!player) return DOMAIN_COSTS[0];
  const state = player.__v111State;
  if (!state) return DOMAIN_COSTS[0];
  const owned = (state.lands ?? []).filter(land =>
    land.ownerId === player.id && land.development !== "urban"
  ).length;
  return DOMAIN_COSTS[Math.min(owned, DOMAIN_COSTS.length - 1)];
}

function makeDomainCostToken() {
  let cached = null;
  const value = () => {
    if (cached == null) cached = domainCostFor(currentInfluencePlayer);
    return cached;
  };
  return {
    valueOf: value,
    toString: () => String(value()),
    toJSON: value,
    [Symbol.toPrimitive]: value,
  };
}

function installDomainCost() {
  if (domainCostInstalled) return;
  domainCostInstalled = true;
  base.V084_CONFIG.hinterland.acquisitionWealthCost = 0;
  base.V084_CONFIG.hinterland.farmWealthCost = 0;
  Object.defineProperty(base.V084_CONFIG.hinterland, "acquisitionInfluenceCost", {
    configurable: true,
    enumerable: true,
    get() {
      return makeDomainCostToken();
    },
  });
}

function installDevelopmentCostProxy() {
  if (developmentProxyInstalled) return;
  developmentProxyInstalled = true;
  const original = base.V084_CONFIG.developmentPhases ?? {};
  base.V084_CONFIG.developmentPhases = new Proxy(original, {
    get(target, property, receiver) {
      const phase = Number(property);
      if (Number.isInteger(phase) && phase >= 1 && phase <= 3) {
        const tier = Math.max(1, Math.min(2, Number(currentDevelopmentSector?.tier) || 1));
        return DEVELOPMENT_COSTS[tier][phase];
      }
      return Reflect.get(target, property, receiver);
    },
  });
}

function instrumentPlayerInfluence(state, player) {
  if (player.__v111InfluenceTracked) {
    player.__v111State = state;
    return;
  }
  let stored = Math.max(0, Number(player.influence) || 0);
  Object.defineProperty(player, "influence", {
    configurable: true,
    enumerable: true,
    get() {
      currentInfluencePlayer = player;
      return stored;
    },
    set(value) {
      currentInfluencePlayer = player;
      stored = Math.max(0, Number(value) || 0);
    },
  });
  Object.defineProperty(player, "__v111InfluenceTracked", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: true,
  });
  Object.defineProperty(player, "__v111State", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: state,
  });
}

function instrumentDevelopmentSector(sector) {
  if (sector.__v111DevelopmentTracked) return;
  let stored = Math.max(0, Number(sector.developmentPhase) || 0);
  Object.defineProperty(sector, "developmentPhase", {
    configurable: true,
    enumerable: true,
    get() {
      currentDevelopmentSector = sector;
      return stored;
    },
    set(value) {
      currentDevelopmentSector = sector;
      stored = Math.max(0, Number(value) || 0);
    },
  });
  Object.defineProperty(sector, "__v111DevelopmentTracked", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: true,
  });
}

export function prepareV111State(state, { resetStartingInfluence = false } = {}) {
  installDomainCost();
  installDevelopmentCostProxy();
  if (!state?.city) return state;

  if (resetStartingInfluence || state.city.influenceErosionThreshold == null) {
    state.city.influenceErosionThreshold = INFLUENCE_DEFAULT;
  }

  for (const player of state.players ?? []) {
    instrumentPlayerInfluence(state, player);
    if (resetStartingInfluence) player.influence = INFLUENCE_DEFAULT;
    player.maxInfluence = Number.MAX_SAFE_INTEGER;
  }
  for (const sector of state.productionSectors ?? []) instrumentDevelopmentSector(sector);
  return state;
}

export function getDomainAcquisitionCost(state, playerId) {
  const player = state?.players?.find(item => item.id === playerId) ?? null;
  if (player) player.__v111State = state;
  return domainCostFor(player);
}

export function getProductionDevelopmentCost(sector) {
  if (!sector || sector.tier >= 3) return null;
  const phase = Math.max(1, Math.min(3, (Number(sector.developmentPhase) || 0) + 1));
  const tier = Math.max(1, Math.min(2, Number(sector.tier) || 1));
  return { phase, ...DEVELOPMENT_COSTS[tier][phase] };
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = engine.createV084Game(familyNames);
  prepareV111State(state, { resetStartingInfluence: true });
  return state;
}

export function resolveAutomatedGeneration(state) {
  prepareV111State(state);

  // v0.11.0 internally applies min(threshold, Influence - 1).
  // Add one immediately before resolution so the net Upkeep result is the
  // v0.11.1 rule: min(threshold, Influence), with no passive erosion.
  const trueInfluenceBefore = Object.fromEntries(
    (state.players ?? []).map(player => [player.id, player.influence]),
  );
  for (const player of state.players ?? []) player.influence += 1;

  const summary = engine.resolveAutomatedGeneration(state);

  summary.influenceBefore = trueInfluenceBefore;
  if (Array.isArray(summary.influenceErosion)) {
    for (const entry of summary.influenceErosion) {
      const before = trueInfluenceBefore[entry.playerId] ?? Math.max(0, Number(entry.before) - 1);
      entry.before = before;
      entry.lost = Math.max(0, before - Number(entry.after || 0));
      entry.mode = "threshold_clip_only";
    }
  }
  summary.influenceErosionMode = "threshold_clip_only";
  summary.domainCostTrack = [...DOMAIN_COSTS];
  summary.productionDevelopmentCosts = DEVELOPMENT_COSTS;
  return summary;
}
