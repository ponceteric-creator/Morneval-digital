# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **Engine v0.8.4 — Imperial outpost economy sandbox**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- charts for **Population vs Urban capacity, Squalor, Renown, Family Wealth, Family Prestige and raw-material production**
- four refinement Sectors: **Refined Food, Textiles, Smithing, Construction Materials**
- **City, Imperial and External** demand on non-Food Sectors
- **City and External** demand on Refined Food; no Imperial demand for Food
- serving City demand gives **1 Prestige**; serving External demand gives **1 Wealth**
- unmet Imperial demand gives every Family **−1 Prestige** for the Generation
- permanent **base Wealth 1** for every Family
- random finite-pool Hinterland exploration: exactly 4 Forests, 4 Meadows and 4 Hills
- Farms feeding Population directly before any agricultural surplus can enter Refined Food production
- Imperial Food aid that prevents famine but costs every Family **−1 Prestige** when used
- three-phase Production-Sector development projects
- automated sequential bidding and dynamic First Player
- permanent urban expansion that consumes the oldest explored territory first

## v0.8.4 Food model

Each Farm produces **2 Raw Food**. Each Population consumes **1 Raw Food**.

Raw Food feeds the City first. Any remaining Farm capacity can be used by the **Refined Food** Sector for City or External demand.

If local Farms cannot feed the current Population, the Empire supplies all missing Food automatically. Population does not fall from famine and cannot fall below 1. If any Imperial Food aid is required, all Families lose 1 Prestige, minimum 0, and Population does not grow that Generation.

## Imperial demand

Textiles, Smithing and Construction Materials each have constant **Imperial demand 1**.

Meeting Imperial demand gives no direct reward. If any Imperial demand remains unmet anywhere at Generation end, every Family loses **1 Prestige**, minimum 0.

Economic allocation priority is currently:

- Military: **City → Imperial → External**
- Commercial: **External → Imperial → City**
- Neutral: **Imperial → City → External**

The Academic/Arcane ↔ Religion axis remains visible but has no production-allocation effect.

## Wealth

Every Family has permanent **base Wealth capacity 1** each Generation. External demand served adds 1 Wealth per need served for that Generation.

Wealth remains capacity rather than banked currency and is committed by actions such as Sector development, Hinterland exploration and Farm conversion.

## Hinterland exploration

The 12 surrounding Hinterland spaces begin **unexplored**.

Exploration costs **3 Influence + 1 Wealth capacity** and reveals one random terrain from a finite pool containing exactly 4 Forests, 4 Meadows and 4 Hills. The exploring Family immediately controls the revealed territory.

Each revealed natural territory currently has capacity **2**. There is **no city-adjacent bootstrap raw production** in v0.8.4.

Natural terrain produces:

- Meadow → Wool → Textiles
- Hill → Ore → Smithing
- Forest → Wood → Construction Materials

A controlled natural territory can be converted to a Farm for **2 Influence + 1 Wealth capacity**.

## Urban growth and Squalor

Morneval begins with Urban capacity 3. Each additional Urban tile supports another 3 Population.

**Squalor target = max(0, Population before disease − current Urban capacity).**

Squalor moves by at most 1 toward the target per Generation, then disease is checked.

After final Population, Morneval expands to `ceil(Population / 3)` Urban tiles when possible. Expansion permanently absorbs the **oldest explored non-urban territory**. Its owner receives no compensation and all raw production is lost.

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
