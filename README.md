# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **v0.11.7 — Contrarian AI**.

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
- a Contrarian AI family that plans Institution access from visible opponent concentration and known Intrigue-deck opportunities;
- Action and Reaction Intrigue timing;
- Scholarium Patents and Military Land Enhancements as Permanents;
- Patent transfer through Legal Contestation and Crooked Notary;
- Intrigue-related Wealth bonuses reflected in current state and Generation History;
- Contingency Reserves for Food stabilization before Imperial Aid;
- automatic end-of-Generation City Inclination movement based on Intrigue cards actually played.

## Current version

**v0.11.7** is the canonical prototype version. The root `VERSION` file is the repository version reference. Query-string suffixes used for cache invalidation or implementation routing are not separate semantic versions.

### Contrarian AI

In the default three-Family simulation, the former generic Opportunist seat is now the **Contrarian**. The Opportunist profile remains available in code for custom states.

The Contrarian receives no resource, action or scoring bonus. It uses the same rules and costs as the other Families, but adds a strategic valuation layer for future Intrigue access. It reads only public information: visible Land ownership, Production Stakes, Institution Agents, Permanents / Patents, city conditions and the known composition of the four Intrigue decks. Opponents' hidden Intrigue hands are not inspected.

When the Contrarian decides to invest in an Agent, it compares the future opportunity value of the four Institution decks. The valuation rewards under-contested access, but only when that access also has a concrete exploitation path. For example, concentrated rival Land ownership increases the value of City Guard / Military access because Land Seizure becomes a stronger future option; concentrated mature / elder Stakes increase the value of Merchant Guild access through Hostile Takeover; and rival Patents increase the value of Temple access through Legal Contestation and Crooked Notary.

This is intentionally a planning heuristic rather than a catch-up rule: the Contrarian does not target the Prestige leader automatically and does not receive artificial compensation for being behind.

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

City Inclination is resolved as the **last phase of every Generation** from Intrigue cards actually played during that Generation.

Two independent axes are used:

- **Scholarium ↔ Temple**
- **Military ↔ Merchant Guild**

For each axis, compare the number of cards played from the two opposing Institution decks:

- if one side has a strict relative majority, move the axis **one step** toward that side;
- if the counts are tied, do not move;
- there is **no minimum threshold**;
- an axis can move by at most **one step per Generation**, regardless of the size of the majority.

All cards actually played count: Actions and Reactions, including cards whose effects are later countered. Permanents count only in the Generation in which they are played. A stolen card counts for the Institution deck it originally belongs to.

The current axis scale is five positions: `II ← I ← Neutral → I → II`.

## Known simulation limits

The current build intentionally keeps several limitations explicit:

- Dynasty Members are not yet represented in simulation state, so Assassination against Dynasty Members and Bodyguards are not fully simulated.
- Preferential Contracts and Private Buyer currently use approximate economy hooks.
- Civic Sanitation Works applies its final Squalor reduction, but same-Generation disease timing remains an approximation.
- AI Intrigue valuation and the temporary limit on Intrigue Actions per Family are simulation heuristics, not tabletop rules.
- Contrarian Agent specialization is layered over the existing action heuristic; it changes which Institution a newly chosen Agent supports, but does not grant additional Agent actions or bypass normal Wealth commitment.

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

- **v0.11.7** — added the Intrigue-aware Contrarian AI family, replacing the default Opportunist seat in three-Family simulation without adding resource or scoring bonuses.
- **v0.11.6** — Intrigue-driven City Inclination resolution added as the final Generation phase; README/versioning synchronized.
- **v0.11.5** — active Intrigue decks, AI card selection/play, Permanents, Patent transfer, Contingency Reserves and Intrigue Wealth history synchronization.
- **v0.11.3** — generic Intrigue deck / hand / timing scaffold.
- **v0.11.2** — Temple Tithes and telemetry extensions.
- **v0.11.1** — Influence ceiling and development / Domain cost rebalance.
- **v0.11.0** — Generation sequence, auctions, Renown and Wealth timing refactor.

## GitHub Pages

This repository is a static site published from the `main` branch repository root using GitHub Pages.
