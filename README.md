# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **Engine v0.8.0 — economic development sandbox**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- Population, Squalor, Renown and Institution-driven demand
- editable **Renown** plus provisional automatic growth of **+1 every 2 resolved Generations**
- editable **City Inclination** on the Academic/Arcane ↔ Religion and Military ↔ Commercial/Mercantile axes
- four Production Sectors: **Food, Textiles, Smithing, Construction Materials**
- **1 Production Stake = 1 unit of potential supply = 1 need that can be satisfied**, subject to raw-resource capacity
- Stake aging: Young → Mature → Elder → removed
- demand priority from City Inclination
- differentiated Wealth by customer category: Population 0 / Institutions 1 / External 2
- **+1 Prestige to the Stake owner for each Population need served**
- productive Hinterland Prestige
- automated sequential bidding for empty Young Production Stake slots
- Production-Sector development projects that require three funded phases before a Tier activates
- automated acquisition and conversion of Hinterland tiles
- dynamic First Player: **Influence → Prestige → Generation Wealth → random selection**

## v0.8.0 starting scenario

- Population 1
- Squalor 0
- Renown 0
- neutral City Inclination
- Food, Textiles, Smithing and Construction Materials all at Tier I
- no Production Stakes at setup
- City Guard level 1
- Merchant Guild level 0
- Temple level 0
- Valenne starts as First Player
- 13-space map abstraction: Morneval plus **12 Hinterland spaces**
- Hinterland composition: **4 Forests, 4 Meadows, 4 Hills**
- all 12 Hinterland spaces begin unowned

## Production-Sector development

To activate the next Tier of a Production Sector, the city must complete three development phases. Contributions are first-come-first-served and different Families may fund successive phases.

- Phase 1: **1 Influence + 1 Wealth capacity**, contributor gains **5 Prestige**
- Phase 2: **2 Wealth capacity**, contributor gains **5 Prestige**
- Phase 3: **2 Wealth capacity**, contributor gains **5 Prestige**; the new Tier becomes active
- a given Sector project may advance by **at most one phase per Generation**

The 5-Prestige value is currently an explicit balancing placeholder.

## Hinterland

Natural Hinterland output is currently:

- Meadow → **Wool** → Textiles
- Hill → **Ore** → Smithing
- Forest → **Wood** → Construction Materials

A Family may acquire an unowned Hinterland space for **3 Influence + 1 Wealth capacity**. Ownership is persistent. Any owned natural tile may later be converted to a Farm for **2 Influence + 1 Wealth capacity**; a Farm stops producing its original resource and instead provides **Food raw-resource capacity**.

Owned Hinterland whose capacity is actually consumed by a Production Sector awards the owner **1 Prestige per Generation**, following the existing productive-land rule.

### v0.8.0 bootstrap assumption

The digital simulation retains **3 units of city-adjacent base capacity for each raw resource** (Food, Wool, Ore and Wood). This lets a Tier-I economy function before Families can generate enough Wealth to finance Hinterland acquisitions. This base capacity is a simulation aid, not a locked tabletop map rule. Only capacity beyond this base comes from owned Hinterland tiles.

## Automated action strategy

The v0.8 AI now chooses among several economic actions during the action phase rather than resolving Stake auctions in complete isolation. It can bid, advance a Sector-development phase, acquire Hinterland or convert owned land to a Farm.

The AI currently prioritizes a genuine raw-resource bottleneck first, then Sector-development pressure, then Stake bidding. It only commits Wealth-funded actions against **projected Wealth from positions already in place**, so it does not borrow against a Stake auction that has not yet been resolved. This strategy is deliberately conservative and remains a simulation heuristic, not a tabletop rule.

Influence income remains the provisional **+5 before actions followed by −2 erosion**, i.e. +3 net before spending and the Influence cap. Renown growth and the automated AI priorities are also prototype parameters.

## GitHub Pages

This repository is structured as a static site and is published from the `main` branch repository root using GitHub Pages.
