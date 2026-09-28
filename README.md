# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **Engine v0.8.9 — civic expansion vote sandbox**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- charts for **Population vs Urban capacity, Squalor, Renown, Family Wealth, Family Prestige and raw-material production**
- three refinement Sectors: **Textiles, Smithing, Construction Materials**
- **City, Imperial and External** demand on those three Production Sectors
- **no Food Production Sector and no Food market demand**
- Civic Farms producing Raw Food only for Population subsistence
- Civic Farm conversion: **2 Influence + 1 Wealth → +3 Prestige once → Farm becomes public**
- serving City demand gives **1 Prestige**; serving External demand gives **1 Wealth**
- unmet Imperial demand gives every Family **−1 Prestige** for the Generation
- permanent **base Wealth 1** for every Family
- random finite-pool Hinterland exploration: exactly 4 Forests, 4 Meadows and 4 Hills
- Imperial Food aid that prevents famine but costs every Family **−1 Prestige** when used
- three-phase Production-Sector development projects
- automated sequential bidding and dynamic First Player
- direct Squalor calculation from **overcrowding + unmet City demand**
- Population growth blocked while **Squalor ≥ Population**
- **political urban expansion via civic vote rather than automatic expansion**

## v0.8.9 Civic expansion vote

Urban expansion is no longer automatic.

A proposal becomes available when:

**Population ≥ current Urban capacity**

and at least one explored non-Urban Hinterland territory remains.

At most one expansion proposal may occur per Generation. The proposing Family must commit at least **1 Influence to YES**.

Each Family may vote YES, NO or Abstain. A YES/NO vote contributes:

**1 base vote + Influence spent**

Influence committed to the vote is spent regardless of outcome. The proposal passes only when **YES > NO**; ties fail.

If approved, Morneval absorbs exactly one territory: the **oldest explored non-Urban territory**. The territory loses its owner and all raw production without compensation, and Urban capacity rises by **+3 Population**.

If the proposal fails or nobody proposes it, the city does not expand. Population may therefore remain above Urban capacity and create political pressure through Overcrowding and Squalor.

The digital AI evaluates expansion using Overcrowding relief, future population headroom, loss of private productive assets, loss of raw capacity and Food-security risk if a Civic Farm would be absorbed. This is a testing heuristic, not a tabletop rule.

See [`rules/Appendix_C_Civic_Expansion_Vote.md`](./rules/Appendix_C_Civic_Expansion_Vote.md) for the current specification.

## Food model

Each Civic Farm produces **2 Raw Food**. Each Population consumes **1 Raw Food**.

Raw Food is used **only for Population subsistence**. It does not enter a Production Sector, does not satisfy City/Imperial/External market demand and does not generate Wealth through trade.

A controlled natural territory may be converted into a Civic Farm for **2 Influence + 1 Wealth**. The contributing Family gains **+3 Prestige immediately**, then ownership transfers to Morneval. Civic Farms generate no recurring productive-land Prestige.

If local Farms cannot feed the current Population, the Empire supplies all missing Food automatically. Population does not fall from famine and cannot fall below 1. If any Imperial Food aid is required, all Families lose 1 Prestige, minimum 0, and Population does not grow that Generation.

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

Only unmet City demand from Textiles, Smithing and Construction Materials contributes to this calculation. Raw Food shortage is handled separately through Imperial Food aid.

Population can grow by +1 only when both conditions are satisfied:

1. local Farms fully feed the current Population without Imperial Food aid; and
2. freshly calculated **Squalor < Population**.

Disease then uses that same current Squalor value.

## Wealth

Every Family has permanent **base Wealth capacity 1** each Generation. External demand served adds 1 Wealth per need served for that Generation.

Wealth remains capacity rather than banked currency and is committed by actions such as Sector development, Hinterland exploration and Civic Farm conversion.

## Hinterland exploration

The 12 surrounding Hinterland spaces begin **unexplored**.

Exploration costs **3 Influence + 1 Wealth capacity** and reveals one random terrain from a finite pool containing exactly 4 Forests, 4 Meadows and 4 Hills. The exploring Family immediately controls the revealed territory.

Each revealed natural territory currently has capacity **2**. There is **no city-adjacent bootstrap raw production**.

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
