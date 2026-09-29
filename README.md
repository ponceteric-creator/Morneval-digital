# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype candidate: **Engine v0.10.1 — Order recalculation & Imperial Intervention rebalance**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- charts for Population vs Urban capacity, Squalor, Renown, Family Wealth, Family Prestige, raw-material production, Order, Force and Imperial Intervention
- three Production Sectors: **Textiles, Smithing, Construction Materials**
- **City, Imperial and External** demand on those three Production Sectors
- Civic Farms producing Raw Food only for Population subsistence
- three differentiated automated-Family personalities with forward-looking valuation
- political Urban expansion through a civic vote
- four major Institutions with public Generation Prestige scores
- recalculated **Order**, structural + demographic **Force**, **Chaos**, and persistent **Imperial Intervention**

## v0.10.1 — Order & Imperial Intervention rebalance

### Order

Order is recalculated fresh at the end of every Generation rather than carrying negative modifiers forward.

**Final Order = Population-based Base Order + Generation modifiers**

Base Order:

- Population 1–3 → **3**
- Population 4–14 → **2**
- Population 15+ → **1**

Current implemented modifier:

- if any City/Population demand is unmet across the three Production Sectors → **−1 Order once for that Generation**, regardless of quantity.

Repeated unmet demand therefore does not accumulate permanent damage. The browser also exposes a manual **Order modifier** as a benchmark hook for future Intrigue, Events, Institutions or political effects.

Population may grow only if the existing Food and Squalor conditions are satisfied **and Final Order is at least 2**. At Population 15+, active positive Order support is therefore required for further growth.

### Chaos

Chaos triggers when calculated Final Order reaches 0.

- every Family loses **20% of current Prestige, rounded up**;
- Population growth is cancelled;
- Morneval loses 1 Population where possible;
- **Imperial Intervention +1**;
- displayed Order resets to 1 after the crisis.

Because Order is recalculated next Generation, that reset is not a permanent baseline.

### Imperial Intervention

Imperial Intervention starts at **0** and does not automatically decay.

Intervention increases by:

- **+1** each Generation in which Imperial Raw Food aid is needed to feed Population, regardless of how much Food is supplied;
- **+1** each time Chaos occurs.

There is no baseline Imperial production demand at the start of the game.

For each Production Sector:

**Imperial demand = floor(Imperial Intervention / Imperial Demand Threshold)**

Default **Imperial Demand Threshold = 3**. The threshold is editable in the browser Test controls.

At the default threshold:

- Intervention 0–2 → demand 0 per Sector
- Intervention 3–5 → demand 1 per Sector
- Intervention 6–8 → demand 2 per Sector
- Intervention 9–11 → demand 3 per Sector

If any Imperial demand remains unmet, every Family still loses 1 Prestige once for the Generation.

Full v0.10.1 details: [`rules/Appendix_F_Order_Imperial_Rebalance.md`](./rules/Appendix_F_Order_Imperial_Rebalance.md).

## v0.10.0 — Institutions retained

Every Generation, each Institution calculates a public Institution Prestige score. A Family gains:

**Institution Prestige × number of that Family's Agents in the Institution.**

Agent placement, cost and maintenance are not yet automated; Agent counts remain manual benchmark controls.

### City Guard

City Guard Prestige combines Order and military readiness, currently capped at 4.

- Order 0–1 → 0
- Order 2 → +1
- Order 3–4 → +2
- Force < `ceil(Population / 3)` → readiness 0
- Force ≥ `ceil(Population / 3)` → readiness +1
- Force ≥ `ceil(Population / 2)` → readiness +2

### Temple

Temple Prestige = Religious Inclination + Civic Coherence, capped at 4.

- Religion II → +2; Religion I → +1; Neutral / Arcane → 0
- Squalor 0 → +2
- Squalor ≤ `floor(Population / 3)` → +1
- otherwise → 0

### Merchant Guild

**Raw score = 2 × External demand served − inclination-dependent penalty**, clamped to 0–4.

### Scholarium College

The Scholarium has no Prestige cap.

- Arcane I permanent bonus: `floor(cumulative Tier increases / 4)`
- Arcane II permanent bonus: `floor(cumulative Tier increases / 3)`
- Tier I → II breakthrough: +2
- Tier II → III breakthrough: +4

Full Institution details: [`rules/Appendix_E_Institution_Order_Force.md`](./rules/Appendix_E_Institution_Order_Force.md).

## Force

**Force = Structural Force + Manpower Force.**

Manpower is capped at +4:

- Military II: `floor(Population / 2)`
- Military I: `floor(Population / 4)`
- Neutral: `floor(Population / 8)`
- Commercial I: `floor(Population / 16)`
- Commercial II: 0

Current sequential fortification benchmark values are None 0, Palisades 1, Walls 3, Fortifications 6, Citadel 10. Construction costs and automated build decisions are not yet defined.

## AI personalities

The three automated Families retain the v0.9.0 profiles:

- **Dynast** — short horizon, Prestige weighted
- **Merchant** — longer horizon, Wealth and engine weighted
- **Opportunist** — adaptive

See [`rules/Appendix_D_Automated_Player_Heuristics.md`](./rules/Appendix_D_Automated_Player_Heuristics.md).

## Economy, Food and expansion

A Civic Farm costs **2 Influence + 1 Wealth**, gives +3 Prestige once to its contributor, then becomes public infrastructure. Each Farm produces 2 Raw Food used only for Population subsistence.

The active Production chains are Meadow → Wool → Textiles, Hill → Ore → Smithing, and Forest → Wood → Construction Materials. Serving City demand gives the Stake owner 1 Prestige; serving External demand gives 1 Wealth capacity for the Generation.

Squalor is recalculated each Generation as:

**Squalor = Overcrowding + total unmet City demand**

Urban expansion is political rather than automatic. When Population reaches or exceeds Urban capacity, an AI Family may propose a civic expansion vote. If approved, Morneval absorbs the oldest explored non-Urban territory and gains +3 Urban capacity.

See [`rules/Appendix_C_Civic_Expansion_Vote.md`](./rules/Appendix_C_Civic_Expansion_Vote.md).

## Production-Sector development

A Sector activates the next Tier after three phases:

- Phase 1: 1 Influence + 1 Wealth, +5 Prestige
- Phase 2: 2 Wealth, +5 Prestige
- Phase 3: 2 Wealth, +5 Prestige and Tier activation

The +5 Prestige per phase remains a balance placeholder.

## GitHub Pages

This repository is a static site published from the `main` branch repository root using GitHub Pages.
