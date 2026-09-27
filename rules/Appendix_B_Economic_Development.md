# Appendix B — Economic Development & Hinterland (v0.8.2)

**Status:** current design reference for the v0.8 economic-development prototype.  
**Relationship to master rules:** this appendix supplements `Morneval_Rules.md`; where it provides newer detail on Production-Sector development, market demand/rewards, or Hinterland use, this appendix is the current specification until the next master-rule consolidation.

## B.1 — Production-Sector development projects

Advancing a Production Sector from Tier I → II or Tier II → III requires a **three-phase development project**.

Different Families may contribute successive phases. Contribution is **first-come-first-served**: once one Family funds the available phase of a Sector during a Generation, no other Family can fund another phase of that same Sector project during that Generation.

A given Sector project may therefore advance by **at most one phase per Generation**.

### Phase costs

| Phase | Influence cost | Wealth-capacity cost | Current Prestige reward |
|---:|---:|---:|---:|
| 1 | 1 | 1 | 5 |
| 2 | 0 | 2 | 5 |
| 3 | 0 | 2 | 5 |

The Influence and Wealth requirements are paid/committed by the Family funding that phase. The **5 Prestige per phase is a provisional balance value**.

After Phase 3 is completed, the new Tier becomes active. The Sector then gains the additional age-specific Stake capacity associated with that Tier.

## B.2 — Wealth committed to development

Wealth remains a **capacity**, not a banked currency.

When a Family funds a development phase or a Hinterland action requiring Wealth, that amount of Wealth capacity is **occupied for the current Generation**. It is unavailable for other Wealth-maintenance requirements during that Generation.

Example: a Family generates 3 Wealth during the Generation and has committed 2 Wealth to a development project. It has 1 Wealth capacity remaining for other obligations.

## B.3 — Active demand categories

As of v0.8.2, **Institution demand is removed from the production economy**.

Production Sectors now face only two demand categories:

- **City / Population demand**;
- **External Market demand**.

Institutions may still exist as civic/political structures, but they no longer consume Production-Sector output through a separate Institution-demand category.

Current direct rewards for a Stake that satisfies one need are:

| Demand served | Wealth | Prestige |
|---|---:|---:|
| City / Population | 0 | 1 |
| External Market | 1 | 0 |

Therefore serving the city primarily produces **Prestige**, while serving external markets primarily produces **Wealth capacity**.

The existing City Inclination system continues to determine priority between active demand categories where applicable. The Academic/Arcane ↔ Religion axis remains part of the city-state model for future institutional/political effects, but it no longer creates Institution demand.

## B.4 — Hinterland map structure

The current map abstraction contains **13 spaces**:

- 1 space occupied by Morneval itself;
- 12 surrounding Hinterland spaces.

The 12 Hinterland spaces are currently divided equally:

- **4 Forests**;
- **4 Meadows**;
- **4 Hills**.

This 4/4/4 distribution is the current prototype map structure.

## B.5 — Natural Hinterland production

Each acquired natural Hinterland territory currently provides **2 units of raw-resource production capacity**.

A later development system may improve an individual territory from **2 to 3 capacity**. The exact improvement action/cost is not yet defined.

Natural terrain produces:

- **Meadow → Wool → Textiles**;
- **Hill → Ore → Smithing**;
- **Forest → Wood → Construction Materials**.

The v0.8 prototype therefore includes a fourth Production Sector: **Construction Materials**, supplied by Wood from Forests.

Construction Materials follows the same Production-Stake architecture as the other Production Sectors: each Tier supplies one Young, one Mature and one Elder Stake slot, and each occupied Stake can satisfy at most one need subject to raw-resource capacity.

The exact demand curve and final content of the Construction Materials Sector remain balance/design work.

## B.6 — Acquiring a Hinterland Stake

A Family may acquire an unowned Hinterland space as a player action.

Current prototype cost:

- **3 Influence**;
- **1 Wealth capacity for that Generation**.

Ownership is persistent until a later rule explicitly changes it.

The 3 Influence + 1 Wealth cost is **provisional** and is intended to reflect the long-term nature of Hinterland investment.

## B.7 — Converting land to a Farm

A Family may convert a natural Hinterland space it owns into a **Farm**.

Current prototype cost:

- **2 Influence**;
- **1 Wealth capacity for that Generation**.

A Farm stops producing the natural resource of its original terrain and instead produces **Food raw-resource capacity**.

Under the current v0.8.2 baseline, a converted Farm has the same **2-capacity** production value as the territory it replaced unless a later development improves it.

Therefore:

- a Meadow may be converted from Wool production to Food;
- a Hill may be converted from Ore production to Food;
- a Forest may be cleared and converted from Wood production to Food.

The original terrain should remain recorded because clearing/conversion may later interact with External Powers, Events or environmental consequences (for example Elven relations).

## B.8 — Productive Hinterland Prestige

The existing productive-land scoring rule remains in force:

**A Family gains 1 Prestige for each Hinterland space it controls whose raw-resource capacity is actually consumed by a Production Sector during that Generation.**

Unused potential capacity does not score.

This Prestige is awarded per productive territory, not per capacity unit consumed.

## B.9 — v0.8 digital bootstrap assumption

The v0.8 digital sandbox temporarily provides **3 units of city-adjacent base capacity for each implemented raw resource**: Food/Grain, Wool, Ore and Wood.

This is **not a locked tabletop rule**. It exists to avoid a startup deadlock in the automated simulation: the first Families otherwise have no Wealth-producing economy with which to fund the first Hinterland acquisitions.

Owned Hinterland capacity is added on top of this temporary base. Each acquired territory currently adds **2 capacity** of its active resource. The design should later decide what the physical tabletop equivalent of Morneval's starting raw-resource access actually is.

## B.10 — Automated-player heuristic in v0.8

The automated-player strategy is a test heuristic, not a player rule.

The AI may choose among:

- bidding for a Young Production Stake;
- funding the next available phase of a Production-Sector project;
- acquiring an unowned Hinterland space;
- converting owned natural land to a Farm;
- passing on a Stake auction.

For the current simulation, it prioritizes genuine raw-resource bottlenecks, then Sector-development pressure, then Stake investment. Wealth-funded actions are only taken against projected Wealth from positions already established before unresolved auction wins. This deliberately conservative behavior is intended to keep the balance test legible rather than to model optimal human play.

Because External Market service now yields **1 Wealth instead of 2**, the automated investment model should be treated as newly rebalanced and may require further tuning after multi-generation tests.

## B.11 — Digital balance graphs

The v0.8.2 sandbox tracks the following across resolved Generations:

- Population;
- Renown;
- gross Family Wealth generated in each Generation;
- cumulative Family Prestige;
- **available raw-material production capacity** for Food/Grain, Wool, Ore and Wood.

The raw-material graph tracks available capacity rather than only consumed output. It therefore shows the economic effect of Hinterland acquisitions and Farm conversions even when some capacity remains unused.
