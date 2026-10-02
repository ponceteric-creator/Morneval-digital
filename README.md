# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **v0.11.5 — Intrigue Simulation**.

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
- Action and Reaction Intrigue timing;
- Scholarium Patents and Military Land Enhancements as Permanents;
- Patent transfer through Legal Contestation and Crooked Notary;
- Intrigue-related Wealth bonuses reflected in current state and Generation History;
- Contingency Reserves for Food stabilization before Imperial Aid.

## Current version

**v0.11.5** is the canonical prototype version. The root `VERSION` file is the repository version reference. Query-string suffixes such as `intrigue3`, `safe5`, or `base` are cache / implementation identifiers and are not separate semantic versions.

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

### Known simulation limits

The current build intentionally keeps several limitations explicit:

- Dynasty Members are not yet represented in simulation state, so Assassination against Dynasty Members and Bodyguards are not fully simulated.
- Preferential Contracts and Private Buyer currently use approximate economy hooks.
- Civic Sanitation Works applies its final Squalor reduction, but same-Generation disease timing remains an approximation.
- AI Intrigue valuation and the temporary limit on Intrigue Actions per Family are simulation heuristics, not tabletop rules.

## Rule references

The current rules are split into appendices under [`rules/`](./rules/). The most relevant current references are:

- [`Appendix_H_Generation_Sequence_Auctions_Renown.md`](./rules/Appendix_H_Generation_Sequence_Auctions_Renown.md) — Generation sequence and auction framework
- [`Appendix_I_Development_Costs_ROI.md`](./rules/Appendix_I_Development_Costs_ROI.md) — development and Domain costs
- [`Appendix_J_Alternative_Wealth_Sources.md`](./rules/Appendix_J_Alternative_Wealth_Sources.md) — Tithes, Patents and Land Enhancement Wealth
- [`Appendix_K_Intrigue_Cards_Core.md`](./rules/Appendix_K_Intrigue_Cards_Core.md) — current Intrigue rules and card effects

## Core prototype conventions

- One turn represents one Generation.
- Influence is stored and spent; the current simulation applies an Upkeep ceiling of 15.
- Wealth is a capacity recalculated each Generation rather than a stored currency.
- Institution Agents persist, age through seniority and consume Wealth capacity.
- Production Stakes age Young → Mature → Elder and interact with demand allocation.
- City Inclination currently uses two axes: Scholarium / Temple and Military / Merchant Guild.

## Version history — recent milestones

- **v0.11.5** — active Intrigue decks, AI card selection/play, Permanents, Patent transfer, Contingency Reserves and Intrigue Wealth history synchronization.
- **v0.11.3** — generic Intrigue deck / hand / timing scaffold.
- **v0.11.2** — Temple Tithes and telemetry extensions.
- **v0.11.1** — Influence ceiling and development / Domain cost rebalance.
- **v0.11.0** — Generation sequence, auctions, Renown and Wealth timing refactor.

## GitHub Pages

This repository is a static site published from the `main` branch repository root using GitHub Pages.
