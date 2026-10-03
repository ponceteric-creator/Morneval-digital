# Appendix M — Merchant Guild Wealth Scoring

**Status: locked v0.11.18 scoring rule.**

This appendix supersedes the previous Merchant Guild Prestige formula based directly on External Market demand served and unmet-demand penalties.

## 1. Design identity

The Merchant Guild represents the commercial prosperity of Morneval as a whole. Its recurring Prestige therefore measures the amount of Family Wealth capacity created by the city's economy above the universal Family baseline.

## 2. Commercial Wealth

Each Family currently has **2 Base Wealth**.

For Merchant Guild scoring:

**Commercial Wealth = Total Family Wealth capacity − cumulative Base Wealth**

With three Families, cumulative Base Wealth is therefore **6**.

Commercial Wealth cannot be negative.

Examples:

- Family Wealth 2 / 2 / 2 → Commercial Wealth 0
- Family Wealth 3 / 2 / 2 → Commercial Wealth 1
- Family Wealth 3 / 3 / 2 → Commercial Wealth 2
- Family Wealth 4 / 4 / 3 → Commercial Wealth 5

Any legitimate source that increases Family Wealth capacity may therefore contribute to commercial prosperity, including External Market activity and active Patents.

## 3. Merchant Guild Prestige

A Family represented by at least one Agent in the Merchant Guild scores the Guild once during Institution Prestige scoring.

**Merchant Guild structural Prestige = min(Commercial Wealth, Institution Tier cap).**

The normal structural Institution caps apply:

| Merchant Guild Tier | Maximum structural Prestige per represented Family |
|---|---:|
| I | 2 |
| II | 4 |
| III | 8 |

Additional Agents do not multiply this Prestige award.

## 4. Removed legacy penalties

Merchant Guild Prestige no longer directly subtracts Prestige for:

- unmet External Market demand;
- unmet Population demand;
- unmet Imperial demand;
- Military or Mercantile City Inclination.

Those conditions already have consequences through their own systems and should not be double-counted inside the Guild score.

City Inclination still affects the Merchant Guild indirectly: Mercantile inclination prioritizes External Markets, which can generate additional Wealth and therefore raise Commercial Wealth.

## 5. Relationship to demand rewards

The demand reward rules remain separate:

- Population demand satisfied: +1 Prestige, 0 Wealth to the supplying Stake owner;
- Imperial demand satisfied: no direct Family Prestige or Wealth;
- External Market demand satisfied: +1 Prestige and +1 Wealth to the supplying Stake owner.

The Merchant Guild score is therefore a citywide secondary consequence of prosperity, not a second direct reward for a specific exported unit.

## 6. AI simulation note

For balance simulations, automated players should evaluate Merchant Guild Agent placement using the same current structural score formula above. This is an AI-information correction, not an additional gameplay bonus.

The current 100-game test with Production development 3/5, Institution development 4/6, Base Wealth 2 and a 12-Renown endgame trigger showed that making the formula visible to the AI materially increases Merchant Guild participation. Personality balance remains a separate tuning problem, especially because the current Contrarian profile exploits this economic route more efficiently than the Merchant profile.
