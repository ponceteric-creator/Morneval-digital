# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype candidate: **Engine v0.10.2 — Agent AI & Influence Economy**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- charts for Population vs Urban capacity, Squalor, Renown, Family Wealth, Family Prestige, raw-material production, Order, Force and Imperial Intervention
- three Production Sectors: **Textiles, Smithing, Construction Materials**
- **City, Imperial and External** demand on those three Production Sectors
- Civic Farms producing Raw Food only for Population subsistence
- three differentiated automated-Family personalities with forward-looking valuation
- political Urban expansion through a civic vote
- four major Institutions with public Generation Prestige scores
- **AI-controlled persistent Institution Agents** with seniority, Wealth reservation, recall and Influence income
- recalculated **Order**, structural + demographic **Force**, **Chaos**, and persistent **Imperial Intervention**

## v0.10.2 — Agent AI & Influence Economy

### Institution Agents

Every Family starts with **0 deployed Agents**.

Placing an Agent is now a normal automated-player action competing with exploration, Farms and Production-Sector development. Placement costs no Influence, but requires and permanently reserves **1 free Wealth capacity** while that Agent remains deployed.

Agents may be placed in any major Institution, in any order. There is currently no per-Institution capacity and no Family Agent limit beyond available Wealth.

Agents persist between Generations. Recall is free, immediately releases the reserved Wealth, but destroys accumulated seniority. A later placement starts again at Seniority 1 and consumes a normal player action.

If a Family's Wealth capacity falls below its number of deployed Agents, enough Agents are recalled immediately to restore the Wealth constraint.

### Seniority and Influence

A newly placed Agent enters at **Seniority 1**. At the end of each Generation it:

1. contributes normally to Institution Prestige scoring;
2. generates Influence equal to its current seniority;
3. then gains +1 seniority, maximum **3**.

Therefore a persistent Agent generates **1 → 2 → 3 → 3... Influence** across successive Generations.

The normal **−2 Influence erosion resolves before Agent Influence income**. Agent income is then added and the Family Influence cap remains **10**.

The former prototype rule granting every Family **+5 automatic Influence per Generation has been removed**.

Full Agent rules and AI valuation notes: [`rules/Appendix_G_Institution_Agents.md`](./rules/Appendix_G_Institution_Agents.md).

### Agent AI valuation

Agent placement has no quota or special priority. Each AI compares it against its other candidate actions.

The Agent valuation combines expected Institution Prestige with the future economic value of seniority-based Influence. Influence is treated as an investment currency rather than a fixed Prestige equivalent. The AI also evaluates voluntary recall when freeing Wealth enables a sufficiently better action, while forced recalls remove the lowest estimated continuation-value Agent first.

The exact utility coefficients are simulation tuning parameters rather than tabletop rules.

## v0.10.1 / v0.10.2 — Order & Imperial Intervention

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

Below Population 15, there is **no independent Order ≥ 2 growth requirement**. From Population 15 onward, otherwise-valid Population growth requires **Final Order ≥ 2**. Since Base Order falls to 1 at Population 15+, further large-city growth therefore needs positive Order support.

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

Full Order / Intervention details: [`rules/Appendix_F_Order_Imperial_Rebalance.md`](./rules/Appendix_F_Order_Imperial_Rebalance.md).

## Institutions

Every Generation, each Institution calculates a public Institution Prestige score. A Family gains:

**Institution Prestige × number of that Family's Agents in the Institution.**

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
