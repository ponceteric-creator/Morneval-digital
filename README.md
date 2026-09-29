# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype candidate: **Engine v0.10.0 — Institutions, Order, Force, Chaos and Imperial Intervention**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- charts for Population vs Urban capacity, Squalor, Renown, Family Wealth, Family Prestige, raw-material production, Order, Force and Imperial Intervention
- three Production Sectors: **Textiles, Smithing, Construction Materials**
- **City, Imperial and External** demand on those three Production Sectors
- Civic Farms producing Raw Food only for Population subsistence
- three differentiated automated-Family personalities with forward-looking valuation
- political Urban expansion through a civic vote
- four major Institutions with public Generation Prestige scores
- volatile **Order**, structural + demographic **Force**, **Chaos**, and persistent **Imperial Intervention**

## v0.10.0 — Institutions

Every Generation, each Institution calculates a public Institution Prestige score. A Family gains:

**Institution Prestige × number of that Family's Agents in that Institution.**

Agent placement, cost and maintenance have not yet been designed into the automated simulation. v0.10.0 therefore exposes Agent counts as manual benchmark controls rather than inventing rules prematurely.

### City Guard

City Guard Prestige combines Order and military readiness, currently capped at 4.

Order component:

- Order 0–1 → 0
- Order 2 → +1
- Order 3–4 → +2

Readiness component:

- Force < `ceil(Population / 3)` → 0
- Force ≥ `ceil(Population / 3)` → +1
- Force ≥ `ceil(Population / 2)` → +2

The readiness thresholds remain simulation tuning parameters until military threats and Events are implemented.

### Temple

Temple Prestige = Religious Inclination + Civic Coherence, capped at 4.

Religious Inclination:

- Religion II → +2
- Religion I → +1
- Neutral / Arcane → 0

Civic Coherence:

- Squalor 0 → +2
- Squalor ≤ `floor(Population / 3)` → +1
- otherwise → 0

### Merchant Guild

The Merchant Guild scores city-wide External commerce.

**Raw score = 2 × External demand served − penalty**

Penalty by Military ↔ Commercial Inclination:

- Military II: External unmet + 2 × Population unmet
- Military I: External unmet + Population unmet
- Neutral: External unmet + Imperial unmet
- Commercial I: `ceil(External unmet / 2)`
- Commercial II: `floor(External unmet / 3)`

Final Merchant Guild Prestige is clamped to 0–4.

### Scholarium College

The Scholarium has **no Prestige cap** and is primarily milestone-driven.

Permanent accumulated-knowledge bonus:

- Arcane I: `floor(cumulative Production-Sector Tier increases / 4)`
- Arcane II: `floor(cumulative Production-Sector Tier increases / 3)`
- Neutral / Religion: 0

Breakthrough bonus in the Generation a Tier activates:

- Tier I → II: +2
- Tier II → III: +4

Multiple breakthroughs stack.

Full details: [`rules/Appendix_E_Institution_Order_Force.md`](./rules/Appendix_E_Institution_Order_Force.md).

## Order and Chaos

Order is a persistent but volatile city characteristic from 0 to 4. It starts at 2.

At Generation end:

- if any City/Population demand is unmet, Order falls by exactly 1, regardless of the quantity unmet;
- if no Order loss occurs and Order is below 2, it naturally recovers by +1, only up to 2;
- ordinary calm never raises Order above 2.

When Order reaches 0, **Chaos** occurs:

- every Family loses 20% of current Prestige, rounded up;
- Population growth for that Generation is cancelled;
- Morneval loses 1 Population where possible, minimum Population 1;
- Imperial Intervention increases by 1;
- Order resets to 1.

The percentage Prestige loss deliberately compresses score gaps, making destabilisation a potentially rational but collectively damaging catch-up tactic.

## Imperial Intervention

Imperial Intervention starts at 0, persists and currently has no automatic decay.

Each Chaos adds +1 Intervention. Imperial demand in every Production Sector becomes:

**Imperial demand = 1 + Imperial Intervention**

Because there are three active Production Sectors, one Chaos currently adds three Imperial demand units to the city's total burden. This is intentionally severe and will be benchmarked.

## Force

**Force = Structural Force + Manpower Force.**

Manpower depends strongly on Military ↔ Commercial Inclination and is capped at +4:

- Military II: `floor(Population / 2)`
- Military I: `floor(Population / 4)`
- Neutral: `floor(Population / 8)`
- Commercial I: `floor(Population / 16)`
- Commercial II: 0

The structural component uses one sequential fortification track. Current benchmark values are:

- None: 0
- Palisades: 1
- Walls: 3
- Fortifications: 6
- Citadel: 10

Construction costs and automated fortification-building decisions are not yet defined, so the fortification level is a manual test control in v0.10.0.

## v0.9.0 AI personalities retained

The three automated Families retain their differentiated strategic profiles:

- **Dynast** — short horizon, strongly values immediate Prestige;
- **Merchant** — longer horizon, strongly values Wealth capacity and durable production engines;
- **Opportunist** — balanced baseline that shifts toward Prestige, Wealth or civic stability depending on relative position and city pressure.

See [`rules/Appendix_D_Automated_Player_Heuristics.md`](./rules/Appendix_D_Automated_Player_Heuristics.md).

## Civic Farm decision rule

A Civic Farm costs **2 Influence + 1 Wealth**, gives its contributor **+3 Prestige once**, then becomes public Morneval infrastructure. It produces 2 Raw Food, generates no recurring private land Prestige, and Raw Food is used only for Population subsistence.

The AI normally targets Raw Food equal to current Population and only plans one extra unit of Food need when current Food already covers Population, Squalor allows growth and Urban capacity has room. At most one Civic Farm is created by automated Families in a Generation.

## Production economy

The active chains are:

- Meadow → Wool → **Textiles**
- Hill → Ore → **Smithing**
- Forest → Wood → **Construction Materials**

Serving City demand gives the Stake owner 1 Prestige. Serving External demand gives the Stake owner 1 Wealth capacity for that Generation. If any Imperial demand remains unmet anywhere, every Family loses 1 Prestige for the Generation.

Economic allocation priority remains:

- Military: City → Imperial → External
- Commercial: External → Imperial → City
- Neutral: Imperial → City → External

## Squalor and Population

Each Generation:

**Squalor = Overcrowding + total unmet City demand**

where:

**Overcrowding = max(0, Population − Urban capacity).**

Population can grow by +1 only if local Farms fully feed current Population without Imperial Food aid and current Squalor is below Population. Disease then resolves from that same Squalor value. Chaos can subsequently cancel that growth and reduce Population by 1.

## Hinterland and Urban expansion

Exploration costs **3 Influence + 1 Wealth** and reveals random terrain from a finite pool of 4 Forests, 4 Meadows and 4 Hills. Each revealed natural territory currently has capacity 2.

Urban expansion is political rather than automatic. When Population reaches or exceeds Urban capacity, an AI Family may propose one civic expansion vote. A YES/NO vote contributes 1 base vote plus Influence spent; YES must strictly exceed NO. If approved, Morneval absorbs the oldest explored non-Urban territory and gains +3 Urban capacity.

See [`rules/Appendix_C_Civic_Expansion_Vote.md`](./rules/Appendix_C_Civic_Expansion_Vote.md).

## Production-Sector development

To activate the next Tier of a Production Sector, complete three phases. A Sector can advance at most one phase per Generation.

- Phase 1: 1 Influence + 1 Wealth, +5 Prestige
- Phase 2: 2 Wealth, +5 Prestige
- Phase 3: 2 Wealth, +5 Prestige and the new Tier activates

The direct +5 Prestige per phase remains a balance placeholder. Activating the new Tier additionally contributes to Scholarium scoring under v0.10.0.

## GitHub Pages

This repository is a static site published from the `main` branch repository root using GitHub Pages.
