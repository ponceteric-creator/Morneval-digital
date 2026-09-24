import { CONFIG } from "./config.js";

function ageRank(age) {
    if (age === "elder") return 3;
    if (age === "mature") return 2;
    return 1;
}

export function createGame(familyNames) {
    const players = familyNames.map((familyName, index) => ({
        id: `family_${index + 1}`,
        familyName,
        prestige: 0,
        influence: 6,
        maxInfluence: CONFIG.defaultMaxInfluence,
        knowledge: 0,
        characters: { young: null, mature: null, elder: null },
        productionStakes: [],
        resourceStakes: [],
        wealthGeneratedThisGeneration: 0,
    }));
    return {
        generation: 1,
        phase: "action_phase",
        city: {
            population: 3,
            squalor: 0,
            order: 0,
            force: 0,
            economicStrength: 0,
            renown: 0,
            religionArcane: 0,
            militaryMercantile: 0,
        },
        players,
        productionSectors: [
            { id: "food", name: "Food", tier: 1, totalDemandThisGeneration: 1, demandThisGeneration: { population: 1, institutions: 0, external_markets: 0 } },
            { id: "textiles", name: "Textiles", tier: 1, totalDemandThisGeneration: 1, demandThisGeneration: { population: 1, institutions: 0, external_markets: 0 } },
            { id: "smithing", name: "Smithing", tier: 1, totalDemandThisGeneration: 1, demandThisGeneration: { population: 1, institutions: 0, external_markets: 0 } },
        ],
        lands: CONFIG.initialLands.map((land) => ({ ...land, capacityModifier: 0, usedCapacityThisGeneration: 0 })),
        nextPlacementOrder: 1,
    };
}

export function getPlayer(state, playerId) {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) throw new Error(`Unknown player: ${playerId}`);
    return player;
}

export function getSector(state, sectorId) {
    const sector = state.productionSectors.find((s) => s.id === sectorId);
    if (!sector) throw new Error(`Unknown sector: ${sectorId}`);
    return sector;
}

export function getSectorStakeCapacity(state, sectorId) {
    const sector = getSector(state, sectorId);
    return {
        young: sector.tier,
        mature: sector.tier,
        elder: sector.tier,
        total: sector.tier * 3,
    };
}

export function getSectorStakeOccupancy(state, sectorId) {
    const stakes = state.players.flatMap((p) => p.productionStakes).filter((s) => s.sectorId === sectorId);
    const occupancy = { young: 0, mature: 0, elder: 0, total: stakes.length };
    for (const stake of stakes) occupancy[stake.age] += 1;
    return occupancy;
}

export function placeProductionStake(state, playerId, sectorId) {
    const player = getPlayer(state, playerId);
    const capacity = getSectorStakeCapacity(state, sectorId);
    const occupancy = getSectorStakeOccupancy(state, sectorId);

    // New economic Stakes always enter as Young. Each Sector level provides
    // one Young slot, one Mature slot and one Elder slot (3 slots per level).
    if (occupancy.young >= capacity.young) {
        throw new Error("No available Young Stake slot in this Production Sector.");
    }
    if (player.influence < CONFIG.stakePlacementInfluenceCost) {
        throw new Error("Not enough Influence to place Stake.");
    }

    player.influence -= CONFIG.stakePlacementInfluenceCost;
    player.productionStakes.push({
        id: `stake_${state.nextPlacementOrder}`,
        ownerId: playerId,
        sectorId,
        age: "young",
        placementOrder: state.nextPlacementOrder,
        servedThisGeneration: false,
        wealthProducedThisGeneration: 0,
    });
    state.nextPlacementOrder += 1;
}

export function developSector(state, playerId, sectorId) {
    const player = getPlayer(state, playerId);
    const sector = getSector(state, sectorId);
    const nextTier = sector.tier + 1;
    if (nextTier > 3) throw new Error("Prototype supports only three tiers.");
    const config = CONFIG.sectorDevelopment[nextTier];
    if (player.influence < config.influenceCost) throw new Error("Not enough Influence to develop Sector.");
    player.influence -= config.influenceCost;
    player.prestige += config.prestigeReward;
    sector.tier = nextTier;
}

export function resolveServedStakes(state, sectorId, demand) {
    const stakes = state.players.flatMap((p) => p.productionStakes).filter((s) => s.sectorId === sectorId);
    for (const stake of stakes) {
        stake.servedThisGeneration = false;
        stake.wealthProducedThisGeneration = 0;
    }
    const sorted = [...stakes].sort((a, b) => {
        const ageDifference = ageRank(b.age) - ageRank(a.age);
        if (ageDifference !== 0) return ageDifference;
        return a.placementOrder - b.placementOrder;
    });
    const served = sorted.slice(0, Math.max(0, demand));
    for (const stake of served) {
        stake.servedThisGeneration = true;
        stake.wealthProducedThisGeneration = 1;
    }
    for (const player of state.players) {
        player.wealthGeneratedThisGeneration = player.productionStakes.reduce((sum, stake) => sum + stake.wealthProducedThisGeneration, 0);
    }
    return served;
}

export function erodeInfluence(state) {
    for (const player of state.players) player.influence = Math.max(0, player.influence - CONFIG.influenceErosion);
}

export function ageProductionStakes(state) {
    for (const player of state.players) {
        player.productionStakes = player.productionStakes
            .filter((stake) => stake.age !== "elder")
            .map((stake) => ({
                ...stake,
                age: stake.age === "young" ? "mature" : "elder",
                servedThisGeneration: false,
                wealthProducedThisGeneration: 0,
            }));
    }
}

export function advanceGeneration(state) {
    erodeInfluence(state);
    ageProductionStakes(state);
    state.generation += 1;
    state.phase = "action_phase";
}
