# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **Engine v0.5 — generational balance sandbox**.

The current browser prototype supports:

- Morneval city tracks
- City Inclination on both political axes
- Production Sector tiers
- age-specific Production Stake capacity: 1 Young + 1 Mature + 1 Elder slot per Sector level
- direct sandbox editing of Stake owner and age
- adding/removing Stakes for testing
- Population / Institution / External Market demand
- optional automatic Population-driven demand
- demand-priority resolution
- Stake seniority
- Family Wealth from served Stakes
- raw-resource ownership, capacity and usage editing
- **1 Prestige for each controlled raw-resource land actually used by production**
- Generation advancement
- Population growth/famine prototype rules
- Squalor evolution
- deterministic disease resolution for reproducible balancing
- Influence erosion
- Stake aging
- multi-generation history
- a three-Generation no-action simulation for stress testing

Direct sandbox edits do not spend game resources. They exist so the economic and demographic rules can be stress-tested before final player-action costs and replacement rules are locked.

Population, Squalor and disease values in v0.5 are explicit prototype balancing parameters, not final locked rules. Order, Force, city Economic Strength and Renown are not yet automatically updated.

## GitHub Pages

This repository is structured as a static site and is published from the `main` branch repository root using GitHub Pages.
