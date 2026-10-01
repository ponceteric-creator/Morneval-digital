// Morneval Intrigue card catalogue.
//
// This file records locked card metadata independently from deck composition.
// Cards listed here are NOT automatically inserted into active decks. Effects
// remain unimplemented until their simulation resolvers are added deliberately.

export const LOCKED_INTRIGUE_CARDS = Object.freeze([
  Object.freeze({
    id: "advanced_farming_techniques",
    name: "Advanced Farming Techniques",
    institutionId: "scholarium",
    timing: "action",
    influenceCost: 4,
    copies: 1,
    unique: true,
    permanent: true,
    implemented: false,
    tags: ["patent", "citywide", "food", "wealth"],
  }),
  Object.freeze({
    id: "civic_sanitation_works",
    name: "Civic Sanitation Works",
    institutionId: "scholarium",
    timing: "action",
    influenceCost: 4,
    copies: 1,
    unique: true,
    permanent: true,
    implemented: false,
    tags: ["patent", "citywide", "squalor", "wealth"],
  }),
  Object.freeze({
    id: "advanced_judicial_system",
    name: "Advanced Judicial System",
    institutionId: "scholarium",
    timing: "action",
    influenceCost: 4,
    copies: 1,
    unique: true,
    permanent: true,
    implemented: false,
    tags: ["patent", "citywide", "order", "wealth"],
  }),
  Object.freeze({
    id: "advanced_architecture",
    name: "Advanced Architecture",
    institutionId: "scholarium",
    timing: "action",
    influenceCost: 4,
    copies: 1,
    unique: true,
    permanent: true,
    implemented: false,
    tags: ["patent", "citywide", "urban_capacity", "wealth"],
  }),
  Object.freeze({
    id: "gemstone_vein",
    name: "Gemstone Vein",
    institutionId: "city_guard",
    timing: "action",
    influenceCost: 4,
    copies: 1,
    unique: true,
    permanent: true,
    implemented: false,
    targetTerrain: "hill",
    tags: ["land_improvement", "hill", "wealth"],
  }),
  Object.freeze({
    id: "rare_breed",
    name: "Rare Breed",
    institutionId: "city_guard",
    timing: "action",
    influenceCost: 4,
    copies: 1,
    unique: true,
    permanent: true,
    implemented: false,
    targetTerrain: "meadow",
    tags: ["land_improvement", "meadow", "wealth"],
  }),
  Object.freeze({
    id: "precious_timber",
    name: "Precious Timber",
    institutionId: "city_guard",
    timing: "action",
    influenceCost: 4,
    copies: 1,
    unique: true,
    permanent: true,
    implemented: false,
    targetTerrain: "forest",
    tags: ["land_improvement", "forest", "wealth"],
  }),
]);

export function getLockedIntrigueCardDefinitions() {
  return LOCKED_INTRIGUE_CARDS.map(card => ({ ...card, tags: [...card.tags] }));
}
