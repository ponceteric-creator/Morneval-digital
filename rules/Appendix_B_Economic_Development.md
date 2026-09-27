# Appendix B — Economic Development & Hinterland (v0.8)

**Status:** current design reference for the v0.8 economic-development prototype.  
**Relationship to master rules:** this appendix supplements `Morneval_Rules.md`; where it provides newer detail on Production-Sector development or Hinterland use, this appendix is the current specification until the next master-rule consolidation.

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

## B.3 — Hinterland map structure

The current map abstraction contains **13 spaces**:

- 1 space occupied by Morneval itself;
- 12 surrounding Hinterland spaces.

The 12 Hinterland spaces are currently divided equally:

- **4 Forests**;
- **4 Meadows**;
- **4 Hills**.

This 4/4/4 distribution is the current prototype map structure.

## B.4 — Natural Hinterland production

Each natural Hinterland space currently provides **1 unit of raw-resource capacity** when developed/controlled for production.

- **Meadow → Wool → Textiles**;
- **Hill → Ore → Smithing**;
- **Forest → Wood → Construction Materials**.

The v0.8 prototype therefore adds a fourth Production Sector: **Construction Materials**, supplied by Wood from Forests.

Construction Materials follows the same Production-Stake architecture as the other Production Sectors: each Tier supplies one Young, one Mature and one Elder Stake slot, and each occupied Stake can satisfy at most one need subject to raw-resource capacity.

The exact demand curve and final content of the Construction Materials Sector remain balance/design work.

## B.5 — Acquiring a Hinterland Stake

A Family may acquire an unowned Hinterland space as a player action.

Current prototype cost:

- **3 Influence**;
- **1 Wealth capacity for that Generation**.

Ownership is persistent until a later rule explicitly changes it.

The 3 Influence + 1 Wealth cost is **provisional** and is intended to reflect the long-term nature of Hinterland investment.

## B.6 — Converting land to a Farm

A Family may convert a natural Hinterland space it owns into a **Farm**.

Current prototype cost:

- **2 Influence**;
- **1 Wealth capacity for that Generation**.

A Farm stops producing the natural resource of its original terrain and instead produces **Food raw-resource capacity**.

Therefore:

- a Meadow may be converted from Wool production to Food;
- a Hill may be converted from Ore production to Food;
- a Forest may be cleared and converted from Wood production to Food.

The original terrain should remain recorded because clearing/conversion may later interact with External Powers, Events or environmental consequences (for example Elven relations).

## B.7 — Productive Hinterland Prestige

The existing productive-land scoring rule remains in force:

**A Family gains 1 Prestige for each Hinterland space it controls whose raw-resource capacity is actually consumed by a Production Sector during that Generation.**

Unused potential capacity does not score.

## B.8 — v0.8 digital bootstrap assumption

The v0.8 digital sandbox temporarily provides **3 units of city-adjacent base capacity for each implemented raw resource**: Food, Wool, Ore and Wood.

This is **not a locked tabletop rule**. It exists to avoid a startup deadlock in the automated simulation: the first Families otherwise have no Wealth-producing economy with which to fund the first Hinterland acquisitions.

Owned Hinterland capacity is added on top of this temporary base. The design should later decide what the physical tabletop equivalent of Morneval's starting raw-resource access actually is.

## B.9 — Automated-player heuristic in v0.8

The automated-player strategy is a test heuristic, not a player rule.

The AI may now choose among:

- bidding for a Young Production Stake;
- funding the next available phase of a Production-Sector project;
- acquiring an unowned Hinterland space;
- converting owned natural land to a Farm;
- passing on a Stake auction.

For the current simulation, it prioritizes genuine raw-resource bottlenecks, then Sector-development pressure, then Stake investment. Wealth-funded actions are only taken against projected Wealth from positions already established before unresolved auction wins. This deliberately conservative behavior is intended to keep the balance test legible rather than to model optimal human play.
