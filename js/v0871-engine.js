import * as base from "./v087-engine.js?base=0.8.7";

export * from "./v087-engine.js?base=0.8.7";

// v0.8.7.1 hotfix
//
// The legacy automated action heuristic still performs one internal lookup for
// a Production Sector whose id is "food". v0.8.7 correctly removed Food from
// the actual Production Sector array, so that lookup could return undefined and
// crash the action phase when it reached the old food-pressure branch.
//
// Keep the real game state at three Production Sectors. This proxy only makes a
// zero-capacity, zero-demand compatibility sector visible to Array.find() when
// the predicate explicitly matches it. Iteration, map(), length and all normal
// UI/economy logic still see only Textiles, Smithing and Construction Materials.

const LEGACY_FOOD_GUARD = Object.freeze({
  id: "food",
  name: "Legacy Food Guard",
  inputResourceType: "grain",
  tier: 0,
  developmentPhase: 0,
  developmentTargetTier: null,
  lastDevelopmentGeneration: null,
  lastDevelopmentContributorId: null,
  demandThisGeneration: Object.freeze({
    population: 0,
    imperial: 0,
    external_markets: 0,
  }),
});

function withLegacyFoodLookup(sectors) {
  if (!Array.isArray(sectors)) return sectors;

  let proxy = null;
  proxy = new Proxy(sectors, {
    get(target, property, receiver) {
      if (property !== "find") {
        return Reflect.get(target, property, receiver);
      }

      return function patchedFind(predicate, thisArg) {
        const found = Array.prototype.find.call(target, predicate, thisArg);
        if (found !== undefined) return found;

        // Only expose the compatibility object if the caller's own predicate
        // actually matches id="food" (or another property on that object).
        return predicate.call(thisArg, LEGACY_FOOD_GUARD, -1, proxy)
          ? LEGACY_FOOD_GUARD
          : undefined;
      };
    },
  });

  return proxy;
}

export function createV084Game(familyNames = ["Valenne", "D'Arcy", "Corven"]) {
  const state = base.createV084Game(familyNames);
  state.productionSectors = withLegacyFoodLookup(state.productionSectors);
  return state;
}
