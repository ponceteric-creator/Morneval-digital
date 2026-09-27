import { V08_CONFIG } from "./v08-engine.js";

// v0.8.2 balance-rule override.
// The v0.8 engine retains a dormant `institutions` demand field internally for
// backward compatibility, but the active simulation now has only two customer
// categories: City/Population and External Markets.
V08_CONFIG.wealthPerDemand.population = 0;
V08_CONFIG.wealthPerDemand.institutions = 0;
V08_CONFIG.wealthPerDemand.external_markets = 1;

// Each acquired Hinterland territory begins at production capacity 2.
// A later development system may increase an individual territory to 3.
V08_CONFIG.hinterland.tileCapacity = 2;

export const V082_ACTIVE_DEMAND = ["population", "external_markets"];
