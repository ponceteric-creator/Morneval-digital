# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **Engine v0.6.4 — stable Wealth diagnostic / generational balance sandbox**.

The current browser prototype supports:

- Morneval city tracks and multi-generation history
- City Inclination on both political axes
- Production Sector tiers
- age-specific Production Stake capacity: 1 Young + 1 Mature + 1 Elder slot per Sector level
- **1 Production Stake = 1 unit of supply = 1 need that can be satisfied**, subject to raw-resource capacity
- direct sandbox editing of Stake owner and age
- adding/removing Stakes for testing
- raw-resource ownership, capacity and usage editing
- productive raw-resource land Prestige
- Population demand scaling from Population
- Institution demand scaling from total Institution levels
- External demand scaling from Renown
- prototype Institution-level cap tied to Population
- demand-priority resolution
- Stake seniority
- differentiated Wealth by customer category: Population 0 / Institutions 1 / External 2 by default
- explicit per-Family Wealth breakdown by demand category
- automatic clearing of stale Wealth whenever an economic input changes

Sector tier creates capacity for Stakes; it does not directly create output. A Sector with three occupied Stakes has three units of potential supply, provided sufficient raw resources are available.

The v0.6.4 stability build intentionally does not load the experimental balance-parameter editor or any DOM MutationObserver helper. Those controls will be reintroduced only after the core simulation is stable on mobile Safari.

Direct sandbox edits do not spend game resources. They exist so the economic and demographic rules can be stress-tested before final player-action costs and replacement rules are locked.

The numerical values are provisional and intended for playtesting rather than final balance.

## GitHub Pages

This repository is structured as a static site and is published from the `main` branch repository root using GitHub Pages.
