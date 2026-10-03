# Appendix D — Automated Player Heuristics (v0.11.9)

**Status:** digital-prototype testing specification only. These heuristics are **not tabletop rules**.

## D.1 — Purpose

The automated Families are deliberately asymmetric so the sandbox can test interactions between different strategic incentives rather than three copies of the same short-horizon optimiser.

The simulation currently assigns the three Families, in seat order, to:

1. **Dynast** — favours short-term Prestige;
2. **Merchant** — favours Wealth capacity and durable economic engines;
3. **Contrarian** — seeks under-contested strategic access and long-horizon option value without receiving rules bonuses.

## D.2 — Planning horizon

The AI now values actions over several Generations rather than only their immediate reward.

Current provisional horizons:

- Dynast: **2 Generations**;
- Merchant: **4 Generations**;
- Contrarian: **4 Generations**.

Future benefits are discounted rather than valued at full current value.

## D.3 — Wealth valuation

Wealth is not converted into Prestige in the rules. For AI decision-making, however, recurring Wealth capacity has strategic value because it enables later exploration, Production-Sector development, Civic Farm conversion and other Wealth-funded actions.

The Merchant therefore gives substantially more weight to External-demand service and to long-term Production capacity than the Dynast.

## D.4 — Productive land valuation

Before converting a private Forest, Meadow or Hill into a Civic Farm, the AI estimates the opportunity cost of surrendering that land, including:

- expected recurring productive-land Prestige;
- the scarcity of the associated raw resource;
- future Production-Stake opportunities;
- future External-market / Wealth opportunities.

The Merchant applies the strongest weight to this long-term engine value. The Dynast applies a shorter horizon and therefore discounts future land value more heavily.

## D.5 — Civic Farm guardrail

The AI no longer treats +3 Prestige from Civic Farm conversion as sufficient reason to create speculative Farms.

Its Raw Food target is normally:

**Target Raw Food = current Population.**

It may raise the target to:

**Target Raw Food = current Population + 1**

only when all of the following are already true:

- local Raw Food covers current Population;
- current Squalor would allow Population growth;
- current Urban capacity has room for another Population.

At most **one Civic Farm may be created by the automated Families in a Generation**.

A Farm is still created only if a Family judges the one-time Prestige and public Food benefit to outweigh the long-term value of the private land being surrendered.

## D.6 — Production-Sector development

Production-Sector development now receives a forward-looking value based on:

- the immediate Prestige from funding the phase;
- progress already made on the current three-phase project;
- future slot capacity unlocked by the next Tier;
- current and expected usable raw-resource capacity;
- the value of the demand categories that additional supply could serve.

This is intended to allow non-Commercial games to develop Production Sectors when the long-term return justifies it, rather than requiring an already-visible immediate payoff.

## D.7 — Production Stakes

For automated testing, open Young Stake positions are resolved through a personality-weighted bidding heuristic.

A Family estimates the demand category likely to be served by an additional Stake under the current City-Inclination priority. It then values that service over the expected lifetime of the Stake.

Consequently:

- Dynast tends to value City-serving positions more highly;
- Merchant tends to value External-serving positions more highly;
- Contrarian gives additional weight to under-contested strategic access and future Intrigue options.

This bidding heuristic is a simulator convenience and does not replace the intended tabletop sequential Influence-auction procedure.

## D.8 — Contrarian adaptation

The Contrarian uses the same legal actions, costs and scoring rules as the other Families. Its difference is entirely evaluative.

It gives additional weight to:

- long-horizon option value;
- Institutions with low opposing-Agent congestion;
- card opportunities supported by visible public board state.

The Contrarian does **not** receive a named-card bonus. Card strategic value is derived from generic metadata such as power, cost, timing, Permanent status, tags and public board affordances. Opponents' hidden Intrigue hands are never inspected.

The Contrarian no longer retargets or reallocates Agents after normal placement. Institution choice is made through the same direct Agent valuation path as the other automated Families.

## D.9 — Expansion voting

The same personality weights are used when evaluating Civic Expansion Votes.

The AI compares:

- relief of Overcrowding;
- future population headroom;
- loss of productive raw capacity;
- loss of its own private productive territory;
- Food-security consequences if a Civic Farm would be absorbed;
- Influence required to influence the result.

This should allow Families to disagree on expansion instead of converging automatically on the same vote.

## D.10 — Generation-report Raw Food display

The Generation History now displays:

**Raw Food consumed / Raw Food capacity**

rather than consumed / Population need.

Examples:

- Population 1 supplied by one Farm → **1 / 2**;
- Population 3 supplied by two Farms → **3 / 4**.

Imperial Food aid remains shown separately.

## D.11 — Intrigue-aware Institution Agents (v0.11.9)

Every automated Family now values the future Intrigue access created by an Institution Agent in addition to Institution Prestige and Agent Influence income.

For prospective access, the AI computes the expected best-card value for the Agent's seniority draw:

- Seniority 1: expected value of draw 1 / keep 1;
- Seniority 2: expected maximum of draw 2 / keep 1;
- Seniority 3: expected maximum of draw 3 / keep 1.

The calculation uses known deck composition and public game state. A card's strategic estimate is based on generic characteristics rather than its name. Unique Permanents already in play no longer contribute future access value.

This is a simulator heuristic only. It does not modify the tabletop Agent, Intrigue, Influence, Wealth or City Inclination rules.
