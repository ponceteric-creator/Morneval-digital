import * as base from "./v110-base.js?real=0.11.0-v111";

export * from "./v110-base.js?real=0.11.0-v111";

export const V084_CONFIG = {
  ...base.V084_CONFIG,
  influence: {
    ...base.V084_CONFIG.influence,
    starting: 15,
    grossIncome: 0,
    erosion: 0,
    maximum: Number.MAX_SAFE_INTEGER,
    softCapThreshold: 15,
  },
  hinterland: {
    ...base.V084_CONFIG.hinterland,
    acquisitionWealthCost: 0,
    farmWealthCost: 0,
  },
};
