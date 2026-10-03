# Appendix I — Development Costs & Prestige ROI

Status: **v0.11.12 simulation benchmark**. This appendix supersedes older Wealth-bearing development costs for the current simulation.

## I.1 — Economic principle

**Wealth is capacity, not a generic construction currency.** One-off development actions therefore no longer spend Wealth.

- **Influence** pays for territorial acquisition, civic conversion, Production-Sector development and Core-Institution development.
- **Wealth** remains a recurring capacity used by persistent commitments such as deployed Institution Agents.
- **Auctions** continue to determine the Influence price of Production Stakes and the Mercenary Contract.

The current Prestige calibration benchmark is approximately **1.5 Prestige-equivalent per Influence over a three-Generation horizon**, with a five-Generation check. This is a balancing reference rather than a universal printed conversion rate.

## I.2 — Starting Influence and Upkeep ceiling

Each Family begins the simulation with **15 Influence**.

There is no passive Influence erosion. At Upkeep:

**Influence = min(current Influence, Influence ceiling)**

The default simulation ceiling is **15**.

Agent Influence is generated from Agent seniority but is capped separately for each Family in each Core Institution according to Institution Tier: **2 / 4 / 8** at Tier I / II / III.

## I.3 — Territory acquisition / Domain track

Acquiring an unexplored Hinterland territory costs Influence according to the number of territories the Family currently controls:

| Territory being acquired | Influence cost |
|---:|---:|
| 1st | 1 |
| 2nd | 2 |
| 3rd | 4 |
| 4th | 6 |
| 5th | 9 |
| 6th | 12 |
| 7th and later | 15 |

There is **no Wealth cost**.

## I.4 — Civic Farm conversion

Converting a controlled natural territory into a Civic Farm costs:

- **2 Influence**;
- **0 Wealth**.

The contributing Family gains **+3 Prestige** under the current benchmark.

## I.5 — Shared development-cost schedule

Production Sectors and Core Institutions use the **same three-phase development cost and Prestige schedule**.

At most one phase may be funded in the same Production Sector or Core Institution in one Generation. Completing Phase 3 activates the next Tier.

### Tier I → Tier II

| Phase | Influence | Wealth | Prestige |
|---:|---:|---:|---:|
| 1 | 2 | 0 | +4 |
| 2 | 2 | 0 | +3 |
| 3 | 2 | 0 | +2, then Tier II activates |
| **Total** | **6** | **0** | **+9** |

### Tier II → Tier III

| Phase | Influence | Wealth | Prestige |
|---:|---:|---:|---:|
| 1 | 4 | 0 | +8 |
| 2 | 4 | 0 | +6 |
| 3 | 4 | 0 | +4, then Tier III activates |
| **Total** | **12** | **0** | **+18** |

The Tier III project doubles the Tier II development scale while retaining the same **2.0 / 1.5 / 1.0** phase Prestige/Influence profile.

### Structural Renown

Production and Institution Tier contributions are identical:

- Tier I = **0 Renown**
- Tier II = **+1 Renown**
- Tier III = **+2 Renown**

### Why Prestige is front-loaded

The Family funding Phase 1 waits longest before the upgraded Tier becomes usable. Higher immediate Prestige compensates for delayed structural return. Phase 3 gives the lowest direct Prestige/Influence ratio because it also activates the new Tier.

## I.6 — Additional Core-Institution return

Increasing a Core Institution Tier raises the maximum Agent Influence that **each Family** can obtain from that Institution:

| Institution Tier | Influence cap per Family |
|---|---:|
| I | 2 |
| II | 4 |
| III | 8 |

The cap is per Family and per Institution, not global.

Institution Prestige is scored once for each represented Family, regardless of how many Agents that Family has in the Institution. Consequently, once the Influence cap is reached, additional Agents are valuable only for additional Intrigue-card access.

## I.7 — Institution Agents

Placing an Institution Agent has no Influence payment and no one-off Wealth expenditure.

A deployed Agent reserves exactly **1 Wealth capacity** while it remains deployed.

## I.8 — Items outside this fixed schedule

The following remain outside the development-cost schedule:

- Production Stakes — universal Influence auction;
- Mercenary Contract — universal Influence auction plus Raw Food operating requirement;
- Political Influence for City Inclination — 1 Influence all-pay per action;
- Fortification construction costs — still TBD;
- individual Intrigue-card costs — defined by the relevant card rather than by this development table.
