# Morneval Digital

Digital prototype of the Morneval strategy board game.

Current deployed prototype: **Engine v0.7.2 — automated investment sandbox**.

The current browser prototype supports:

- multi-generation city simulation and Generation History
- Population, Squalor, Renown and Institution-driven demand
- Production Sectors with age-specific Stake capacity
- **1 Production Stake = 1 unit of supply = 1 need that can be satisfied**, subject to raw-resource capacity
- Stake aging: Young → Mature → Elder → removed
- demand priority from City Inclination
- differentiated Wealth by customer category: Population 0 / Institutions 1 / External 2
- **+1 Prestige to the Stake owner for each Population need served**
- productive raw-resource land Prestige
- automated bidding for empty Young Production Stake slots
- sequential bids where only the winning bid is spent
- +5 gross Influence before bidding followed by normal −2 end-of-generation erosion, representing +3 net income before the Influence cap and auction spending
- **dynamic First Player: Influence → Prestige → Generation Wealth → random selection**

## v0.7.2 starting scenario

- Population 1
- Squalor 0
- Renown 0
- neutral City Inclination
- Food, Textiles and Smithing all at Tier I
- no Production Stakes at setup
- City Guard level 1
- Merchant Guild level 0
- Temple level 0
- Valenne starts as First Player
- Families begin with the existing prototype Influence value and maximum Influence cap

The first automated AI is deliberately simple and transparent. It estimates which current demand category a new Young Stake would serve, values Population at 1 because it awards Prestige, Institutions at 1 Wealth, External Markets at 2 Wealth, and multiplies that immediate value by the three-generation lifetime of a Stake to determine a maximum bid. Bids rise by 1 Influence in current player order until all challengers pass.

At the end of each Generation, after the normal −2 Influence erosion, First Player is determined by: **most remaining Influence**, then **most Prestige**, then **most Wealth generated during that Generation**, then **random selection** among any Families still tied. The digital sandbox uses seeded randomness for the final step so identical balance tests remain reproducible.

The AI bidding heuristic, +5 gross Influence income and maximum Influence cap remain simulation/balance parameters rather than locked numerical rules. The First Player hierarchy itself is locked.

The numerical values remain provisional and are intended for playtesting rather than final balance.

## GitHub Pages

This repository is structured as a static site and is published from the `main` branch repository root using GitHub Pages.
