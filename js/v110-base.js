import * as base from "./v102-base.js?real=0.10.2-v110";

export * from "./v102-base.js?real=0.10.2-v110";

export const V084_CONFIG = {
  ...base.V084_CONFIG,
  influence: {
    ...base.V084_CONFIG.influence,
    grossIncome: 0,
    erosion: 1,
    maximum: Number.MAX_SAFE_INTEGER,
    softCapThreshold: 12,
  },
};
