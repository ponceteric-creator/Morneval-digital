# Appendix B — Economic Development, Hinterland & Urban Growth (v0.8.3)

**Status:** current design reference for the v0.8 economic-development prototype.  
**Relationship to master rules:** this appendix supplements `Morneval_Rules.md`; where it provides newer detail on Production-Sector development, market demand/rewards, Hinterland use, Squalor, Urban expansion or Renown, this appendix is the current specification until the next master-rule consolidation.

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

The v0.8 prototype includes a fourth Production Sector: **Construction Materials**, supplied by Wood from Forests.

Construction Materials follows the same Production-Stake architecture as the other Production Sectors: each Tier supplies one Young, one Mature and one Elder Stake slot, and each occupied Stake can satisfy at most one need subject to raw-resource capacity.

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

Under the current v0.8 baseline, a converted Farm has the same **2-capacity** production value as the territory it replaced unless a later development improves it.

The original terrain remains recorded because clearing/conversion may later interact with External Powers, Events or environmental consequences.

## B.8 — Productive Hinterland Prestige

The existing productive-land scoring rule remains in force:

**A Family gains 1 Prestige for each Hinterland space it controls whose raw-resource capacity is actually consumed by a Production Sector during that Generation.**

Unused potential capacity does not score. Prestige is awarded per productive territory, not per capacity unit consumed.

## B.9 — v0.8 digital bootstrap assumption

The digital sandbox temporarily provides **3 units of city-adjacent base capacity for each implemented raw resource**: Food/Grain, Wool, Ore and Wood.

This is **not a locked tabletop rule**. It exists to avoid a startup deadlock in the automated simulation. Owned Hinterland capacity is added on top of this temporary base.

## B.10 — Automated-player heuristic

The automated-player strategy is a test heuristic, not a player rule.

The AI may choose among bidding for a Young Production Stake, funding the next available phase of a Production-Sector project, acquiring an unowned Hinterland space, converting owned natural land to a Farm, or passing on a Stake auction.

It prioritizes genuine raw-resource bottlenecks, then Sector-development pressure, then Stake investment. Wealth-funded actions are only taken against projected Wealth from positions already established before unresolved auction wins.

## B.11 — Balance graphs

The sandbox tracks across resolved Generations:

- Population;
- Urban capacity / footprint;
- Squalor;
- Renown;
- gross Family Wealth generated in each Generation;
- cumulative Family Prestige;
- raw-material potential for Food/Grain, Wool, Ore and Wood.

The raw-material graph now tracks **city-base capacity plus all remaining non-urban terrain potential**, including unowned land. This lets urbanisation visibly remove future production potential even when the swallowed land had not yet been acquired by a Family.

## B.12 — Urban capacity and permanent expansion

Morneval begins on **1 Urban tile**, supporting a comfortable **Urban capacity of 3 Population**.

Each additional Urban tile supports another **3 Population**:

**Urban capacity = number of Urban tiles × 3.**

The original City space supports Population 1–3. If final Population requires more capacity, Morneval permanently absorbs enough Hinterland spaces to reach:

**Required Urban tiles = ceil(final Population / 3), minimum 1.**

Expansion is resolved **after the final Population calculation**, including disease. Urbanisation is permanent: if Population later falls, Urban tiles do not revert to Hinterland.

### Territory selection in the automated prototype

When automatic expansion is required:

1. choose among **unowned non-urban Hinterland first**;
2. choose randomly among those eligible unowned spaces;
3. only when no unowned Hinterland remains, choose randomly among owned non-urban Hinterland;
4. if an owned territory is absorbed, the Family loses it with **no compensation**.

This ordering models Families avoiding investment in land most likely to be swallowed by the expanding city.

An absorbed territory becomes Urban and permanently loses all raw-resource capacity. A current capacity-2 territory therefore removes 2 potential raw-resource capacity; a future improved capacity-3 territory would remove 3.

In the final tabletop game, automatic expansion is intended to be replaced by a **player-funded civic expansion mechanism**. The current automatic step exists to test the demographic/resource feedback loop before the final action cost and incentives are designed.

## B.13 — Overcrowding-driven Squalor

As of v0.8.3, the previous provisional rule `ceil(Population / 3)` as an automatic Squalor baseline is replaced in the digital prototype.

Squalor is now driven primarily by **overcrowding relative to existing Urban capacity**.

Before disease, after Food-driven growth/famine:

**Overcrowding = max(0, Population − current Urban capacity).**

Current target:

**Squalor target = Overcrowding + Food-shortage penalty.**

The Food-shortage penalty is currently **+1** if any Population Food demand is unmet.

Squalor remains persistent: it moves by at most **1 point per Generation** toward its target. Expansion removes the cause of overcrowding for future Generations, but accumulated Squalor does not disappear immediately.

Disease is then checked against the resulting Squalor using the existing provisional disease table. The same deterministic seeded roll system is retained in the digital sandbox.

The intended design role is that rising Population creates overcrowding and Squalor, which pressures players to fund City expansion. Expansion relieves overcrowding but permanently consumes productive Hinterland.

## B.14 — Renown cap

Until Events become the true source of Renown, the prototype keeps the temporary automatic **+1 Renown every 2 Generations**.

However, sustainable Renown is now capped by City size:

**Maximum Renown = final Population × 2.**

At Generation end, after final Population is known, Renown cannot remain above this cap. If Population contracts, excess Renown is immediately lost down to the new cap.

A direct Squalor-to-Renown penalty is deliberately **parked** for now. The Population-based cap will be tested first before adding another negative Renown mechanism.
