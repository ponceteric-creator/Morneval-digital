# Appendix G — Institution Agents, Seniority & Influence

Status: **v0.11.0 simulation model**. Structural Agent rules are locked; AI valuation coefficients remain simulation tuning.

## 1. Starting state and placement

Each Family begins with **0 deployed Agents**.

Placing an Agent is a normal player action, costs no Influence, and reserves **1 Wealth capacity** while the Agent remains deployed. A Family may place Agents in any major Institution without prerequisite or Institution capacity limit. A newly placed Agent begins at **Seniority 1** and participates immediately in that Generation's Institution Prestige scoring and Agent Influence income.

## 2. Wealth support and recall

Each Agent reserves 1 Wealth. Wealth is a capacity, not a stored currency.

Agent support is checked during **Upkeep**, after Agent ageing. If the Wealth capacity carried from the previous Generation is lower than the number of deployed Agents, enough Agents are recalled to restore legal support. There is no second forced-support check later in the Generation; a Wealth reduction determined during Wealth Recalculation takes effect on Agent support at the next Upkeep.

Recall is free in action-economy terms, immediately releases 1 Wealth, and destroys the Agent's seniority. A later replacement is a new normal action and returns at Seniority 1.

## 3. Seniority

Agents age during **Upkeep**:

**1 → 2 → 3 → 3 → ...**

Seniority does not multiply Institution Prestige. It determines Agent Influence income and will later interact with Intrigue cards.

## 4. Institution Prestige

At Phase 6 — **Prestige & Influence Scoring**:

**Family Prestige gained = Institution score × number of that Family's Agents in the Institution.**

An Agent placed during the current Generation counts immediately.

## 5. Agent Influence income

At Phase 6, every deployed Agent generates Influence equal to current seniority:

- Seniority 1: +1 Influence
- Seniority 2: +2 Influence
- Seniority 3: +3 Influence

There is **no hard Influence cap** and the former automatic +5 Influence income is removed.

Influence erosion happens in Upkeep before actions. The simulation uses an adjustable soft-cap threshold `T`:

**new Influence = max(0, min(T, current Influence − 1))**

Thus every Family with positive Influence loses at least 1 during Upkeep, while values above the threshold are compressed back toward the threshold. The threshold is adjustable in the simulation and will be fixed in the tabletop game after playtesting.

## 6. AI liquidity reserve

The automated-player model keeps **1 Wealth liquid** before voluntarily placing a new Agent. An AI therefore needs at least 2 free Wealth to place a new Agent: 1 becomes reserved by the Agent and 1 remains free.

This is an **AI guardrail, not a tabletop rule**.

## 7. AI voluntary and forced recall

The AI may voluntarily recall Agents if the value of an unlocked action exceeds the continuation value lost from the recalled Agent(s) by a tuning margin.

At Upkeep, forced recall removes the lowest estimated continuation-value Agent first until Agent count fits Wealth capacity. Continuation value includes expected Institution Prestige and future seniority-based Influence income.

Exact utility weights and the AI liquidity reserve are simulation parameters rather than tabletop rules.
