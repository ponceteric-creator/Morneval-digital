# Appendix D — Automated Player Heuristics (v0.9.0)

**Status:** digital-prototype testing specification only. These heuristics are **not tabletop rules**.

## D.1 — Purpose

The automated Families are deliberately asymmetric so the sandbox can test interactions between different strategic incentives rather than three copies of the same short-horizon optimiser.

The simulation currently assigns the three Families, in seat order, to:

1. **Dynast** — favours short-term Prestige;
2. **Merchant** — favours Wealth capacity and durable economic engines;
3. **Opportunist** — adapts its priorities to relative standing and city pressure.

## D.2 — Planning horizon

The AI now values actions over several Generations rather than only their immediate reward.

Current provisional horizons:

- Dynast: **2 Generations**;
- Merchant: **4 Generations**;
- Opportunist: **3 Generations**.

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
- Opportunist changes its weighting with circumstances.

This bidding heuristic is a simulator convenience and does not replace the intended tabletop sequential Influence-auction procedure.

## D.8 — Opportunist adaptation

The Opportunist starts from balanced weights, then shifts emphasis when circumstances change.

Current prototype triggers include:

- falling materially behind the table in Prestige → more Prestige-oriented;
- falling behind in projected Wealth capacity → more Wealth / engine-oriented;
- Raw Food shortage or severe Squalor → more civic / stability-oriented.

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
