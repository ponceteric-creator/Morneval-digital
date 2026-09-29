# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype candidate: **Engine v0.10.0 — Major Institutions and civic stability benchmark**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- charts for **Population vs Urban capacity, Squalor, Renown, Family Wealth, Family Prestige and raw-material production**
- three refinement Sectors: **Textiles, Smithing, Construction Materials**
- **City, Imperial and External** demand on those three Production Sectors
- **no Food Production Sector and no Food market demand**
- Civic Farms producing Raw Food only for Population subsistence
- Civic Farm conversion: **2 Influence + 1 Wealth → +3 Prestige once → Farm becomes public**
- serving City demand gives **1 Prestige**; serving External demand gives **1 Wealth**
- persistent **Imperial Intervention**, increasing Imperial demand after Chaos
- permanent **base Wealth 1** for every Family
- random finite-pool Hinterland exploration: exactly 4 Forests, 4 Meadows and 4 Hills
- Imperial Food aid that prevents famine but costs every Family **−1 Prestige** when used
- three-phase Production-Sector development projects
- dynamic First Player
- direct Squalor calculation from **overcrowding + unmet City demand**
- volatile **Order 0–4** with Chaos at 0
- **Force = Structural Force + inclination-driven Manpower**
- end-of-Generation Prestige scores for **City Guard, Temple, Merchant Guild and Scholarium College**
- Population growth blocked while **Squalor ≥ Population**
- **political urban expansion via civic vote rather than automatic expansion**
- three differentiated automated-Family personalities with forward-looking valuation

## v0.10.0 Major Institutions & civic stability

Every Generation now calculates a global Prestige value for four Major Institutions. The intended tabletop payout is:

**Family Prestige gained = Institution Prestige score × number of that Family's Agents in that Institution.**

Agent placement is deliberately not simulated yet because its action, cost and maintenance rules have not been designed. The current sandbox therefore exposes the Institution scores themselves for balance testing without inventing Agent behaviour.

Current Institution models:

- **City Guard** — Order plus Force readiness relative to Population, cap 4;
- **Temple** — Religious Inclination plus low Squalor / civic coherence, cap 4;
- **Merchant Guild** — external commerce served, offset by inclination-dependent unmet-demand penalties, cap 4;
- **Scholarium College** — strong one-Generation bonuses for Production-Sector Tier breakthroughs plus a small permanent Arcane knowledge bonus; no cap.

Order starts at 2. If any City/Population demand is unmet during a Generation, Order falls by 1 once, regardless of the number of missing demand units. If no Order loss occurs while Order is below 2, it recovers +1 toward 2.

If that loss brings Order to 0, **Chaos** occurs: every Family loses 20% of current Prestige rounded up, Morneval loses 1 Population, Population growth for the Generation is cancelled, Imperial Intervention rises by 1 and Order resets to 1.

Each Imperial Intervention level permanently raises Imperial demand in each of the three Production Sectors by +1. This deliberately makes repeated Chaos a costly collective strategy even though percentage-based Prestige loss can help a trailing Family close an absolute Prestige gap.

Force is calculated as **Structural Force + Manpower**. Manpower is capped at +4 and depends strongly on the Military ↔ Commercial Inclination: Military II uses `floor(Population/2)`, Military I `/4`, Neutral `/8`, Commercial I `/16`, and Commercial II receives no Population-based Force. Structural Force is currently a manual benchmark input until the sequential fortification track's costs and bonuses are defined.

See [`rules/Appendix_E_Institutions_and_Civic_Stability.md`](./rules/Appendix_E_Institutions_and_Civic_Stability.md).

## v0.9.0 AI personalities

The three automated Families use different strategic profiles:

- **Dynast** — short horizon, strongly values immediate Prestige;
- **Merchant** — longer horizon, strongly values Wealth capacity and durable production engines;
- **Opportunist** — balanced baseline that shifts toward Prestige, Wealth or civic stability depending on relative position and city pressure.

Actions are no longer judged only by immediate payoff. The AI discounts benefits over approximately **2–4 Generations** depending on personality. Productive land therefore has a future engine value, External demand has a future Wealth-capacity value, and Production-Sector development can be justified by the additional supply it unlocks later.

The automated Stake procedure is personality-weighted for simulation purposes. This remains a digital heuristic and does not replace the intended tabletop sequential Influence-auction mechanism.

See [`rules/Appendix_D_Automated_Player_Heuristics.md`](./rules/Appendix_D_Automated_Player_Heuristics.md).

## Civic Farm decision rule

The AI does not create Farms speculatively merely because conversion gives +3 Prestige.

Its normal Food target is:

**Target Raw Food = current Population.**

It only plans one extra unit of future Food need when current Food already covers Population, Squalor allows growth, and Urban capacity has room for another Population. At most **one Civic Farm** may be created by the automated Families in a Generation.

Before sacrificing private land, the AI values the expected future Prestige, resource scarcity, Production-Stake opportunities and External-market Wealth that the Forest, Meadow or Hill could generate.

## Generation History — Raw Food

The Generation History reports:

**Raw Food consumed / Raw Food capacity**

rather than consumed / Population requirement.

For example:

- Population 1 with one Civic Farm → **1 / 2**;
- Population 3 with two Civic Farms → **3 / 4**.

Imperial Food aid remains displayed separately.

## Civic expansion vote

Urban expansion is not automatic.

A proposal becomes available when:

**Population ≥ current Urban capacity**

and at least one explored non-Urban Hinterland territory remains.

At most one expansion proposal may occur per Generation. The proposing Family must commit at least **1 Influence to YES**.

Each Family may vote YES, NO or Abstain. A YES/NO vote contributes:

**1 base vote + Influence spent**

Influence committed to the vote is spent regardless of outcome. The proposal passes only when **YES > NO**; ties fail.

If approved, Morneval absorbs exactly one territory: the **oldest explored non-Urban territory**. The territory loses its owner and all raw production without compensation, and Urban capacity rises by **+3 Population**.

If the proposal fails or nobody proposes it, the city does not expand. Population may therefore remain above Urban capacity and create political pressure through Overcrowding and Squalor.

The AI evaluates this vote through its personality weights, including the value of lost private production and Food-security risk when a Civic Farm would be absorbed.

See [`rules/Appendix_C_Civic_Expansion_Vote.md`](./rules/Appendix_C_Civic_Expansion_Vote.md).

## Food model

Each Civic Farm produces **2 Raw Food**. Each Population consumes **1 Raw Food**.

Raw Food is used **only for Population subsistence**. It does not enter a Production Sector, does not satisfy City/Imperial/External market demand and does not generate Wealth through trade.

A controlled natural territory may be converted into a Civic Farm for **2 Influence + 1 Wealth**. The contributing Family gains **+3 Prestige immediately**, then ownership transfers to Morneval. Civic Farms generate no recurring productive-land Prestige.

If local Farms cannot feed current Population, the Empire supplies all missing Food automatically. Population does not fall from famine and cannot fall below 1. If any Imperial Food aid is required, all Families lose 1 Prestige, minimum 0, and Population does not grow that Generation.

## Production economy

The active refinement chains are:

- Meadow → Wool → **Textiles**
- Hill → Ore → **Smithing**
- Forest → Wood → **Construction Materials**

Each active Sector has City, Imperial and External demand.

Base Imperial demand is **1 per Sector**, plus persistent Imperial Intervention. Meeting it gives no direct reward. If any Imperial demand remains unmet anywhere at Generation end, every Family loses **1 Prestige**, minimum 0.

Economic allocation priority is currently:

- Military: **City → Imperial → External**
- Commercial: **External → Imperial → City**
- Neutral: **Imperial → City → External**

The Academic/Arcane ↔ Religion axis does not change production-allocation priority, but now contributes to Temple and Scholarium scoring.

## Squalor and Population growth

Squalor has no target or gradual movement. Each Generation:

**Squalor = Overcrowding + total unmet City demand**

where:

**Overcrowding = max(0, current Population − current Urban capacity).**

Only unmet City demand from Textiles, Smithing and Construction Materials contributes to this calculation. Raw Food shortage is handled separately through Imperial Food aid.

Population can grow by +1 only when both conditions are satisfied:

1. local Farms fully feed current Population without Imperial Food aid; and
2. freshly calculated **Squalor < Population**.

Disease then uses that same current Squalor value. Chaos separately cancels any growth that would otherwise occur in that Generation.

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
