# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **Engine v0.8.8 — civic-Farm raw-food economy**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- charts for Population vs Urban capacity, Squalor, Renown, Family Wealth, Family Prestige and raw-material production
- three refinement Sectors: **Textiles, Smithing, Construction Materials**
- City, Imperial and External demand on those three Production Sectors
- **no Food Production Sector and no Food market demand**
- civic Farms producing Raw Food only for Population subsistence
- City service = **+1 Prestige** to the serving Stake owner
- External service = **+1 Wealth** to the serving Stake owner
- unmet Imperial demand = **−1 Prestige to every Family** for the Generation
- permanent **base Wealth 1** for every Family
- random finite-pool Hinterland exploration: exactly 4 Forests, 4 Meadows and 4 Hills
- Imperial Food aid that prevents famine but costs every Family −1 Prestige when used
- three-phase Production-Sector development projects
- automated sequential bidding and dynamic First Player
- permanent urban expansion that consumes the oldest explored territory first
- direct Squalor calculation from **overcrowding + unmet City demand**
- Population growth blocked while **Squalor ≥ Population**

## v0.8.8 Civic Farms

Food is a pure subsistence system. Each Farm produces **2 Raw Food** and each Population consumes **1 Raw Food**.

Converting a controlled natural territory into a Farm costs:

- **2 Influence**
- **1 Wealth capacity for that Generation**

The contributing Family gains **+3 Prestige immediately**. Ownership is then surrendered: the Farm becomes **public property of Morneval**.

A public Farm:

- supplies Raw Food to the whole Population;
- has no Production-Sector Stake chain;
- has no City, Imperial or External market demand;
- generates **no recurring productive-land Prestige** for any Family;
- may later be absorbed by urban expansion like any other Hinterland territory.

This creates a deliberate public-good trade-off: retaining Forest/Meadow/Hill preserves a private productive asset, while converting it to a Farm exchanges that asset for immediate Prestige and shared food security.

The automated player considers Farm conversion only while local Raw Food capacity is below current Population need.

## Production economy

The active refinement chains are:

- Meadow → Wool → **Textiles**
- Hill → Ore → **Smithing**
- Forest → Wood → **Construction Materials**

Each active Sector has City, Imperial and External demand.

Imperial demand is constant **1 per Sector**. Meeting it gives no direct reward. If any Imperial demand remains unmet anywhere at Generation end, every Family loses **1 Prestige**, minimum 0.

Economic allocation priority is currently:

- Military: **City → Imperial → External**
- Commercial: **External → Imperial → City**
- Neutral: **Imperial → City → External**

The Academic/Arcane ↔ Religion axis remains visible but has no production-allocation effect.

## Squalor and Population growth

Squalor has no target or gradual movement. Each Generation:

**Squalor = Overcrowding + total unmet City demand**

where:

**Overcrowding = max(0, current Population − current Urban capacity).**

Only unmet City demand from Textiles, Smithing and Construction Materials contributes. Raw Food shortage is handled separately through Imperial Food aid.

Population grows by +1 only when local Farms fully feed the current Population without Imperial Food aid and freshly calculated **Squalor < Population**. Disease then uses that same Squalor value.

## Wealth

Every Family has permanent **base Wealth capacity 1** each Generation. External demand served adds 1 Wealth per need served for that Generation.

Wealth is capacity rather than banked currency and is committed by actions such as Sector development, Hinterland exploration and Farm conversion.

## Hinterland exploration

The 12 surrounding Hinterland spaces begin unexplored. Exploration costs **3 Influence + 1 Wealth capacity** and reveals one random terrain from a finite pool containing exactly 4 Forests, 4 Meadows and 4 Hills. The exploring Family immediately controls the revealed territory.

Each revealed natural territory currently has capacity **2**. There is no city-adjacent bootstrap raw production.

## Urban growth

Morneval begins with Urban capacity 3. Each additional Urban tile supports another 3 Population.

After final Population, Morneval expands to `ceil(Population / 3)` Urban tiles when possible. Expansion permanently absorbs the **oldest explored non-urban territory**. No compensation is paid and all raw production is lost.

## Renown

The temporary test rule remains **+1 Renown every 2 Generations** until Events become the real source.

**Maximum Renown = final Population × 2.**

## Production-Sector development

To activate the next Tier of a Production Sector, complete three phases. Different Families may fund successive phases, but a given Sector can advance at most one phase per Generation.

- Phase 1: **1 Influence + 1 Wealth**, +5 Prestige
- Phase 2: **2 Wealth**, +5 Prestige
- Phase 3: **2 Wealth**, +5 Prestige and the new Tier activates

The 5-Prestige reward remains a balance placeholder.

## GitHub Pages

This repository is structured as a static site and is published from the `main` branch repository root using GitHub Pages.
