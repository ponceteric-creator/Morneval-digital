# Appendix I — Development Costs & Prestige ROI

Status: **v0.11.1 simulation benchmark**. This appendix supersedes the older Wealth-bearing development costs in Appendix B for the current simulation. Intrigue-card costs remain intentionally undefined.

## I.1 — Economic principle

**Wealth is capacity, not a generic construction currency.** One-off development actions therefore no longer spend Wealth.

- **Influence** pays for territorial acquisition, civic conversion and Production-Sector development.
- **Wealth** remains a recurring capacity used by persistent commitments such as deployed Institution Agents.
- **Auctions** continue to determine the Influence price of Production Stakes and the Mercenary Contract.

The current Prestige calibration benchmark is approximately **1.5 Prestige-equivalent per Influence over a three-Generation horizon**, with a five-Generation check. This is a balancing reference rather than a universal printed conversion rate.

## I.2 — Starting Influence and Upkeep ceiling

Each Family begins the simulation with **15 Influence**.

There is no passive Influence erosion. At Upkeep:

**Influence = min(current Influence, Influence ceiling)**

The default simulation ceiling is **15**, and remains adjustable for testing.

Agents remain the main recurring source of Influence. Each Agent generates Influence equal to current seniority during Prestige & Influence Scoring.

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

### Tabletop implementation

The intended physical implementation is a visible **Domain track** on each Family board. Domain markers begin on the printed values `1 / 2 / 4 / 6 / 9 / 12 / 15`. When a Family acquires a territory, it takes the next marker from its board and places it on that territory. The newly uncovered number shows the cost of the next acquisition.

If the Family ceases to control a territory — for example because it becomes a public Civic Farm or is absorbed by Morneval — the corresponding Domain marker returns to the Family board and the marginal acquisition cost falls accordingly.

The simulation implements the same rule by counting currently controlled non-Urban territories.

## I.4 — Civic Farm conversion

Converting a controlled natural territory into a Civic Farm costs:

- **2 Influence**;
- **0 Wealth**.

The contributing Family gains **+3 Prestige** under the current benchmark.

The Farm becomes public property, so the Family no longer counts that territory on its Domain track.

## I.5 — Production-Sector development

A Production Sector still requires three development phases for each Tier increase, with at most one phase funded in that Sector per Generation.

### Tier I → Tier II

| Phase | Influence | Wealth | Prestige |
|---:|---:|---:|---:|
| 1 | 2 | 0 | +4 |
| 2 | 2 | 0 | +3 |
| 3 | 2 | 0 | +2, then Tier II activates |
| **Total** | **6** | **0** | **+9** |

Direct Prestige/Influence ratios are therefore **2.0 / 1.5 / 1.0**.

### Tier II → Tier III

| Phase | Influence | Wealth | Prestige |
|---:|---:|---:|---:|
| 1 | 4 | 0 | +8 |
| 2 | 4 | 0 | +6 |
| 3 | 4 | 0 | +4, then Tier III activates |
| **Total** | **12** | **0** | **+18** |

The Tier III project doubles the Tier II development scale while retaining the same **2.0 / 1.5 / 1.0** phase ROI profile.

### Rationale for front-loaded Prestige

The Family funding Phase 1 waits longest before the upgraded Tier becomes usable. The higher immediate Prestige compensates for that delayed structural return. Phase 3 gives the lowest direct Prestige/Influence ratio because it also receives the immediate public benefit of activating the new Tier.

## I.6 — Institution Agents

Placing an Institution Agent has no Influence payment and no one-off Wealth expenditure.

A deployed Agent reserves exactly **1 Wealth capacity** while it remains deployed.

The former automated-player heuristic that required **2 free Wealth** before placing an Agent — one Wealth for the Agent plus one Wealth kept liquid — is removed in v0.11.1. If a Family has exactly **1 free Wealth**, it may deploy one Agent and reduce its remaining free Wealth to 0.

## I.7 — Items not priced by this appendix

The following remain outside the fixed development-cost schedule:

- Production Stakes — universal Influence auction;
- Mercenary Contract — universal Influence auction plus Raw Food operating requirement;
- voting Influence — spent according to the vote procedure;
- Institution Tier-development costs — still TBD;
- Fortification construction costs — still TBD;
- Intrigue / Innovation / Improvement cards — intentionally TBD until that subsystem is defined.

These should not be assigned placeholder costs merely to complete the table; their benefits must be defined first and then calibrated against the same ROI framework.
