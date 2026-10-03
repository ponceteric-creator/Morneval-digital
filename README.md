# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **v0.11.9 — Intrigue-aware Agent AI**.

The browser prototype currently supports:

- multi-generation automated simulation with Generation History and telemetry;
- Population, Urban capacity, Squalor, Order, Force, Renown and Imperial Intervention;
- Production Sectors, Stakes, raw-resource capacity, demand allocation and Wealth recalculation;
- political Urban expansion and universal Influence bidding;
- Institution Agents with seniority, Wealth commitment and Influence income;
- Temple Tithes and Mercenary Contract auctions;
- the active four Institution Intrigue decks with their current copy counts;
- Agent-based Intrigue acquisition by seniority (draw 1/2/3, keep 1);
- contextual AI selection and play of Intrigue cards;
- Intrigue-aware Agent placement: all automated Families value future draw-1/2/3 keep-1 access when choosing an Institution;
- a Contrarian AI family that plans Institution access from visible opponent concentration and known Intrigue-deck opportunities;
- Action and Reaction Intrigue timing;
- Scholarium Patents and Military Land Enhancements as Permanents;
- Patent transfer through Legal Contestation and Crooked Notary;
- Intrigue-related Wealth bonuses reflected in current state and Generation History;
- Contingency Reserves for Food stabilization before Imperial Aid;
- end-of-Generation City Inclination movement based on Intrigue cards actually played **plus all-pay Political Influence bids**.

## Current version

**v0.11.9** is the canonical prototype version. The root `VERSION` file is the repository version reference. Query-string suffixes used for cache invalidation or implementation routing are not separate semantic versions.

### Political Influence and City Inclination

During Player Actions, a Family may spend **1 Influence as one normal action** to support one of the four City Inclination poles:

- Military
- Merchant Guild
- Temple
- Scholarium

Each Political Influence bid adds **1 point** to that pole for the end-of-Generation City Inclination resolution.

Political Influence uses an **all-pay** model. The 1 Influence is spent immediately when the action is taken and is never refunded, regardless of whether that pole eventually wins, loses, or ties. This is intentionally different from the normal auction rule, where losing auction bids are refunded.

At City Inclination resolution, each axis compares:

**Intrigue cards actually played + Political Influence bids spent during the Generation.**

A strict majority moves the axis one step. A tie causes no movement. Each axis can still move by at most one step per Generation.

The tabletop rule has no bid cap. The digital simulation uses a per-Family bidding guardrail only to prevent runaway automated loops; that guardrail is an AI implementation detail, not a rule.

### Contrarian AI

In the default three-Family simulation, the former generic Opportunist seat is now the **Contrarian**. The Opportunist profile remains available in code for custom states.

The Contrarian receives no resource, action or scoring bonus. It uses the same rules and costs as the other Families, but adds a strategic valuation layer for future Intrigue access. It reads only public information: visible Land ownership, Production Stakes, Institution Agents, Permanents / Patents, city conditions and the known composition of the four Intrigue decks. Opponents' hidden Intrigue hands are not inspected.

When the Contrarian decides to invest in an Agent, it compares the future opportunity value of all four Institution decks and the amount of rival Agent competition for each Institution. The valuation is derived from generic card metadata and public board state; it contains no card-name-specific strategic multipliers. In particular, Land Seizure receives no special Contrarian bonus beyond the same generic land-attack signals available to any card with equivalent properties.

The Contrarian now makes this choice directly during normal Agent valuation. It no longer retargets newly placed Agents or reallocates existing Agents after the action phase. This avoids hidden free specialization and repeated placement/recall loops.

This is intentionally a planning heuristic rather than a catch-up rule: the Contrarian does not target the Prestige leader automatically and does not receive artificial compensation for being behind.

### Intrigue-aware Agent valuation

In v0.11.9, every automated Family includes future Intrigue access in the continuation value of an Institution Agent. For each Institution the AI estimates the expected value of the best card available from the Agent's seniority draw:

- Seniority 1: draw 1, keep 1;
- Seniority 2: draw 2, keep the best 1;
- Seniority 3: draw 3, keep the best 1.

The estimate uses known deck composition and public state only. Unique Permanents already in play are removed from prospective access value. Current inability to pay a card's Influence cost reduces value but does not make future access automatically worthless. Opponents' hidden hands are never inspected.

This option value is added to the existing Institution-Prestige and Agent-Influence continuation value. The Contrarian gives somewhat more weight to long-horizon Intrigue access and discounts Institutions already crowded by opposing Agents, but still receives no rules bonus.

### Intrigue implementation status

The active Intrigue rules are defined in [`rules/Appendix_K_Intrigue_Cards_Core.md`](./rules/Appendix_K_Intrigue_Cards_Core.md).

The simulation uses four separate Institution decks:

- City Guard / Military
- Temple
- Merchant Guild
- Scholarium

Current deck composition and LOW / MID / HIGH labels are balancing metadata. LOW / MID / HIGH are not gameplay rules.

The current mid-game composition reference is approximately 4 Agents per Family: 2 Seniority-1, 1 Seniority-2 and 1 Seniority-3 Agent, for about 7 cards seen per Family per Generation. At 3 players this is about 21 cards seen per Generation.

Unique Patents and Land Enhancements leave their source decks when played. Their owner-specific Wealth bonus follows current ownership. Patents may later circulate through Temple Intrigue cards.

## City Inclination resolution

City Inclination is resolved as the **last phase of every Generation**.

Two independent axes are used:

- **Scholarium ↔ Temple**
- **Military ↔ Merchant Guild**

For each axis, total each side's:

- Intrigue cards actually played during the current Generation; plus
- Political Influence bids spent on that pole during the current Generation.

Then:

- if one side has a strict relative majority, move the axis **one step** toward that side;
- if the totals are tied, do not move;
- there is **no minimum threshold**;
- an axis can move by at most **one step per Generation**, regardless of the size of the majority.

All Intrigue cards actually played count: Actions and Reactions, including cards whose effects are later countered. Permanents count only in the Generation in which they are played. A stolen card counts for the Institution deck it originally belongs to.

The current axis scale is five positions: `II ← I ← Neutral → I → II`.

## Known simulation limits

The current build intentionally keeps several limitations explicit:

- Dynasty Members are not yet represented in simulation state, so Assassination against Dynasty Members and Bodyguards are not fully simulated.
- Preferential Contracts and Private Buyer currently use approximate economy hooks.
- Civic Sanitation Works applies its final Squalor reduction, but same-Generation disease timing remains an approximation.
- AI Intrigue valuation and the temporary limit on Intrigue Actions per Family are simulation heuristics, not tabletop rules.
- Intrigue-aware Agent valuation is a simulation heuristic. It changes AI choices only; Agent action costs, Wealth commitment, seniority and card rules are unchanged.
- Political Influence AI bidding uses a simulation-only spending guardrail; the tabletop rule itself has no maximum number of Political Influence actions per Family.

## Rule references

The current rules are split into appendices under [`rules/`](./rules/). The most relevant current references are:

- [`Appendix_H_Generation_Sequence_Auctions_Renown.md`](./rules/Appendix_H_Generation_Sequence_Auctions_Renown.md) — Generation sequence, auctions and final City Inclination phase
- [`Appendix_I_Development_Costs_ROI.md`](./rules/Appendix_I_Development_Costs_ROI.md) — development and Domain costs
- [`Appendix_J_Alternative_Wealth_Sources.md`](./rules/Appendix_J_Alternative_Wealth_Sources.md) — Tithes, Patents and Land Enhancement Wealth
- [`Appendix_K_Intrigue_Cards_Core.md`](./rules/Appendix_K_Intrigue_Cards_Core.md) — current Intrigue rules and card effects

## Core prototype conventions

- One turn represents one Generation.
- Influence is stored and spent; the current simulation applies an Upkeep ceiling of 15.
- Wealth is a capacity recalculated each Generation rather than a stored currency.
- Institution Agents persist, age through seniority and consume Wealth capacity.
- Production Stakes age Young → Mature → Elder and interact with demand allocation.
- City Inclination uses two axes: Scholarium / Temple and Military / Merchant Guild.

## Version history — recent milestones

- **v0.11.9** — added Intrigue-aware Agent continuation value for every AI, removed named-card strategic multipliers from Contrarian planning, and removed post-hoc Contrarian Agent retarget/reallocation.
- **v0.11.8** — added all-pay Political Influence actions for City Inclination; each 1 Influence action counts as one point alongside Intrigue cards in the final axis comparison.
- **v0.11.7** — added the Intrigue-aware Contrarian AI family, replacing the default Opportunist seat in three-Family simulation without adding resource or scoring bonuses.
- **v0.11.6** — Intrigue-driven City Inclination resolution added as the final Generation phase; README/versioning synchronized.
- **v0.11.5** — active Intrigue decks, AI card selection/play, Permanents, Patent transfer, Contingency Reserves and Intrigue Wealth history synchronization.
- **v0.11.3** — generic Intrigue deck / hand / timing scaffold.
- **v0.11.2** — Temple Tithes and telemetry extensions.
- **v0.11.1** — Influence ceiling and development / Domain cost rebalance.
- **v0.11.0** — Generation sequence, auctions, Renown and Wealth timing refactor.

## GitHub Pages

This repository is a static site published from the `main` branch repository root using GitHub Pages.
