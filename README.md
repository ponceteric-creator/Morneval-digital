# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **Engine v0.8.3 — urban-growth and economic development sandbox**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- charts for **Population vs Urban capacity, Squalor, Renown, Family Wealth, Family Prestige and raw-material potential**
- four Production Sectors: **Food, Textiles, Smithing, Construction Materials**
- only two active demand categories: **City / Population** and **External Markets**
- serving City demand gives **1 Prestige**; serving External demand gives **1 Wealth**
- Institution demand removed from the production economy
- Hinterland acquisition, Farm conversion and productive-land Prestige
- three-phase Production-Sector development projects
- automated sequential bidding and dynamic First Player
- permanent urban expansion that progressively consumes Hinterland

## v0.8.3 urban-growth model

Morneval begins with **1 Urban tile** and **Urban capacity 3**. Each additional Urban tile adds capacity for another 3 Population.

After Food growth/famine, the prototype calculates:

**Overcrowding = max(0, Population before disease − current Urban capacity)**

Current Squalor target:

**Squalor target = Overcrowding + 1 if any Population Food demand is unmet.**

Squalor moves by at most **1 per Generation** toward that target. Disease is then checked using the existing provisional Squalor probability table.

After final Population, including disease, the city permanently expands to the minimum footprint required:

**Required Urban tiles = ceil(final Population / 3), minimum 1.**

Automatic expansion chooses a random **unowned** non-urban Hinterland space first. Only when none remain does it randomly consume an owned territory. An owned territory is lost with **no compensation**. Urbanised terrain permanently loses its raw-resource production.

This automatic expansion is a simulation stand-in. The intended tabletop design is for Families to be pressured to fund civic expansion themselves to relieve overcrowding/Squalor.

## Renown

The temporary simulation rule of **+1 Renown every 2 Generations** remains until Events become the real source of Renown.

Sustainable Renown is now capped at:

**Maximum Renown = final Population × 2.**

If Population falls, excess Renown is immediately lost to the new cap. A direct Squalor → Renown penalty is deliberately parked for later testing.

## Demand and rewards

- **City / Population demand** — 1 Prestige per need served, 0 Wealth
- **External Market demand** — 1 Wealth per need served, 0 direct Prestige

The Academic/Arcane ↔ Religion inclination axis remains in the city model for future political/institutional effects, but no longer creates production demand.

## Hinterland

The 13-space test map contains Morneval plus **12 Hinterland spaces: 4 Forests, 4 Meadows and 4 Hills**.

Natural terrain currently provides:

- Meadow → **Wool** → Textiles
- Hill → **Ore** → Smithing
- Forest → **Wood** → Construction Materials

Each acquired Hinterland territory has base production capacity **2**. A later development mechanism may improve a territory to **3**. A Family may acquire an unowned territory for **3 Influence + 1 Wealth capacity**, or convert owned natural land to a Farm for **2 Influence + 1 Wealth capacity**.

The digital sandbox still retains **3 units of city-adjacent bootstrap capacity per raw resource** so the early economy can function before Hinterland investment.

The raw-material graph now tracks **potential** capacity: city-base capacity plus all remaining non-urban terrain, including unowned land. This makes urban expansion visibly remove future productive potential.

## Production-Sector development

To activate the next Tier of a Production Sector, complete three phases. Different Families may fund successive phases, but a given Sector can advance at most one phase per Generation.

- Phase 1: **1 Influence + 1 Wealth**, +5 Prestige
- Phase 2: **2 Wealth**, +5 Prestige
- Phase 3: **2 Wealth**, +5 Prestige and the new Tier activates

The 5-Prestige reward remains a balance placeholder.

## GitHub Pages

This repository is structured as a static site and is published from the `main` branch repository root using GitHub Pages.
