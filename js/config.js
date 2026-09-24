export const CONFIG = {
    influenceErosion: 2,
    defaultMaxInfluence: 10,
    stakePlacementInfluenceCost: 1,
    sectorDevelopment: {
        1: { influenceCost: 0, prestigeReward: 0 },
        2: { influenceCost: 2, prestigeReward: 2 },
        3: { influenceCost: 3, prestigeReward: 3 },
    },
    /*
     * PROTOTYPE CONTENT / BALANCE VALUES.
     * These are intentionally data-driven and are not final Morneval rules.
     */
    sectors: {
        food: {
            inputResourceType: "grain",
            supplyCapacityByTier: { 1: 1, 2: 2, 3: 3 },
        },
        textiles: {
            inputResourceType: "wool",
            supplyCapacityByTier: { 1: 1, 2: 2, 3: 3 },
        },
        smithing: {
            inputResourceType: "ore",
            supplyCapacityByTier: { 1: 1, 2: 2, 3: 3 },
        },
    },
    initialLands: [
        { id: "farmland", name: "Farmland", resourceType: "grain", baseCapacity: 3 },
        { id: "pasture", name: "Pasture", resourceType: "wool", baseCapacity: 3 },
        { id: "mine", name: "Mine", resourceType: "ore", baseCapacity: 3 },
    ],
};
