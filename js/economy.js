import { CONFIG } from "./config.js";
const TIE_BREAK = [
    "population",
    "institutions",
    "external_markets",
];
function emptyDemand() {
    return { population: 0, institutions: 0, external_markets: 0 };
}
function ageRank(age) {
    if (age === "elder")
        return 3;
    if (age === "mature")
        return 2;
    return 1;
}
export function getDemandPriorityGroups(religionArcane, militaryMercantile) {
    const preferred = new Set();
    if (religionArcane !== 0)
        preferred.add("institutions");
    if (militaryMercantile < 0)
        preferred.add("population");
    if (militaryMercantile > 0)
        preferred.add("external_markets");
    if (preferred.size === 0) {
        return [["population", "institutions", "external_markets"]];
    }
    const firstGroup = TIE_BREAK.filter((category) => preferred.has(category));
    const secondGroup = TIE_BREAK.filter((category) => !preferred.has(category));
    return secondGroup.length > 0 ? [firstGroup, secondGroup] : [firstGroup];
}
export function allocateDemand(supply, demand, priorityGroups) {
    let remainingSupply = Math.max(0, supply);
    const served = emptyDemand();
    for (const group of priorityGroups) {
        const orderedGroup = TIE_BREAK.filter((category) => group.includes(category));
        for (const category of orderedGroup) {
            if (remainingSupply <= 0)
                break;
            const amount = Math.min(Math.max(0, demand[category]), remainingSupply);
            served[category] = amount;
            remainingSupply -= amount;
        }
    }
    const unmet = {
        population: Math.max(0, demand.population - served.population),
        institutions: Math.max(0, demand.institutions - served.institutions),
        external_markets: Math.max(0, demand.external_markets - served.external_markets),
    };
    return {
        priorityGroups: priorityGroups.map((group) => [...group]),
        requested: { ...demand },
        served,
        unmet,
        totalSupply: Math.max(0, supply),
        totalServed: served.population + served.institutions + served.external_markets,
    };
}
export function compareStakeSeniority(a, b) {
    const ageDifference = ageRank(b.age) - ageRank(a.age);
    if (ageDifference !== 0)
        return ageDifference;
    return a.placementOrder - b.placementOrder;
}
function getSectorConfig(sectorId) {
    const sectorConfig = CONFIG.sectors[sectorId];
    if (!sectorConfig)
        throw new Error(`No prototype configuration for sector: ${sectorId}`);
    return sectorConfig;
}
function calculateResourceLimitedSupply(state, sectorId) {
    const sector = state.productionSectors.find((item) => item.id === sectorId);
    if (!sector)
        throw new Error(`Unknown sector: ${sectorId}`);
    const config = getSectorConfig(sectorId);
    const tier = sector.tier;
    const sectorCapacity = config.supplyCapacityByTier[tier];
    const relevantLands = state.lands.filter((land) => land.resourceType === config.inputResourceType);
    const totalResourceCapacity = relevantLands.reduce((sum, land) => sum + Math.max(0, land.baseCapacity + land.capacityModifier), 0);
    const supply = Math.min(sectorCapacity, totalResourceCapacity);
    let remainingUsage = supply;
    const usage = relevantLands.map((land) => {
        const availableCapacity = Math.max(0, land.baseCapacity + land.capacityModifier);
        const usedCapacity = Math.min(availableCapacity, remainingUsage);
        remainingUsage -= usedCapacity;
        const stake = state.players
            .flatMap((player) => player.resourceStakes)
            .find((candidate) => candidate.landId === land.id);
        return {
            landId: land.id,
            landName: land.name,
            resourceType: land.resourceType,
            availableCapacity,
            usedCapacity,
            stakeOwnerId: stake?.ownerId,
        };
    });
    return { supply, usage };
}
export function resolveSectorEconomy(state, sectorId) {
    const sector = state.productionSectors.find((item) => item.id === sectorId);
    if (!sector)
        throw new Error(`Unknown sector: ${sectorId}`);
    const config = getSectorConfig(sectorId);
    for (const land of state.lands.filter((l) => l.resourceType === config.inputResourceType)) {
        land.usedCapacityThisGeneration = 0;
    }
    const { supply: resourceLimitedSupply, usage } = calculateResourceLimitedSupply(state, sectorId);
    for (const item of usage) {
        const land = state.lands.find((candidate) => candidate.id === item.landId);
        if (land)
            land.usedCapacityThisGeneration = item.usedCapacity;
    }
    const priorities = getDemandPriorityGroups(state.city.religionArcane, state.city.militaryMercantile);
    const demand = allocateDemand(resourceLimitedSupply, sector.demandThisGeneration, priorities);
    sector.totalDemandThisGeneration =
        sector.demandThisGeneration.population +
            sector.demandThisGeneration.institutions +
            sector.demandThisGeneration.external_markets;
    const stakes = state.players
        .flatMap((player) => player.productionStakes)
        .filter((stake) => stake.sectorId === sectorId)
        .sort(compareStakeSeniority);
    for (const stake of stakes) {
        stake.servedThisGeneration = false;
        stake.wealthProducedThisGeneration = 0;
    }
    const servedStakes = stakes.slice(0, demand.totalServed);
    for (const stake of servedStakes) {
        stake.servedThisGeneration = true;
        stake.wealthProducedThisGeneration = 1;
    }
    for (const player of state.players) {
        player.wealthGeneratedThisGeneration = player.productionStakes.reduce((sum, stake) => sum + stake.wealthProducedThisGeneration, 0);
    }
    return {
        sectorId: sector.id,
        sectorName: sector.name,
        availableSupply: getSectorConfig(sectorId).supplyCapacityByTier[sector.tier],
        resourceLimitedSupply,
        demand,
        profitableDemand: demand.totalServed,
        servedStakes: servedStakes.map((stake) => ({
            stakeId: stake.id,
            ownerId: stake.ownerId,
            age: stake.age,
            placementOrder: stake.placementOrder,
            wealthGenerated: stake.wealthProducedThisGeneration,
        })),
        familyWealth: state.players.map((player) => ({
            playerId: player.id,
            familyName: player.familyName,
            wealthGenerated: player.wealthGeneratedThisGeneration,
        })),
        rawResourcesUsed: usage,
    };
}
export function resolveAllSectorEconomies(state) {
    for (const player of state.players) {
        player.wealthGeneratedThisGeneration = 0;
        for (const stake of player.productionStakes) {
            stake.servedThisGeneration = false;
            stake.wealthProducedThisGeneration = 0;
        }
    }
    for (const land of state.lands) {
        land.usedCapacityThisGeneration = 0;
    }
    return state.productionSectors.map((sector) => resolveSectorEconomy(state, sector.id));
}
