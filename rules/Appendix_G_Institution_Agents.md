# Appendix G — Institution Agents, Tiers, Seniority & Influence

Status: **v0.11.12 locked structural model**. AI valuation coefficients remain simulation tuning.

## 1. Core Institution tiers

The four Core Institutions are:

- City Guard
- Temple
- Merchant Guild
- Scholars’ Collegium

Each Core Institution has three Tiers: **I / II / III**.

Institution development uses the **same three-step development structure, Influence costs and immediate Prestige rewards as Production Sector development**.

Current development track:

### Tier I → Tier II

| Step | Influence cost | Wealth cost | Prestige |
|---|---:|---:|---:|
| 1 | 2 | 0 | 4 |
| 2 | 2 | 0 | 3 |
| 3 | 2 | 0 | 2 |

Completing Step 3 raises the Institution to Tier II.

### Tier II → Tier III

| Step | Influence cost | Wealth cost | Prestige |
|---|---:|---:|---:|
| 1 | 4 | 0 | 8 |
| 2 | 4 | 0 | 6 |
| 3 | 4 | 0 | 4 |

Completing Step 3 raises the Institution to Tier III.

An Institution Tier contributes to structural Renown exactly like a Production Sector Tier:

- Tier I = **0 Renown**
- Tier II = **+1 Renown**
- Tier III = **+2 Renown**

## 2. Agent placement and Wealth support

Each Family begins with **0 deployed Agents**.

Placing an Agent is a normal Player Action, costs no Influence, and reserves **1 Wealth capacity** while the Agent remains deployed.

There is no Agent-slot cap tied to Institution Tier. A Family may therefore place additional Agents even when its Influence income from that Institution is already capped.

Each Agent remains persistent until recalled or removed.

## 3. Seniority

Agents age during Upkeep:

**1 → 2 → 3 → 3 → ...**

Seniority has two functions:

1. it contributes to the Family’s raw Agent Influence income in that Institution;
2. it determines Intrigue access: Seniority 1 draws 1 card, Seniority 2 draws 2 and keeps 1, Seniority 3 draws 3 and keeps 1.

Seniority does **not** multiply Institution Prestige.

## 4. Institution Prestige

At Prestige & Influence Scoring, a Family scores an Institution if it has **at least one Agent** in that Institution.

**Family Prestige gained = Institution score once.**

The score is **per represented Family, not per Agent**.

Additional Agents in the same Institution do not multiply this Prestige award.

## 5. Agent Influence income

For each Family and each Institution, first calculate raw Agent Influence:

**Raw Influence = sum of the seniority of that Family’s Agents in that Institution.**

Then apply the Institution Tier cap:

| Institution Tier | Maximum Agent Influence received by one Family from that Institution |
|---|---:|
| I | **2** |
| II | **4** |
| III | **8** |

The cap is applied **separately for each Family and separately for each Institution**.

Example: a Family with Agents of Seniority 3 and 2 in a Tier II Temple has raw Influence 5 but receives only **4 Influence** from the Temple.

If that same Family also generates 3 Influence from another Tier II Institution, it receives those 3 normally. The cap is not a global Family cap.

## 6. Marginal value of additional Agents

Once a Family has reached the Influence cap of an Institution, additional Agents in that Institution provide:

- **no additional Institution Prestige**;
- **no additional Agent Influence beyond the Tier cap**;
- **additional Intrigue-card access only**.

This is intentional. A Family may maintain a dense Agent network in one Institution specifically to see more cards and improve selection quality, but it does not receive unlimited political income for doing so.

## 7. Wealth support and recall

Each Agent reserves 1 Wealth. Wealth is a capacity, not a stored currency.

Agent support is checked during Upkeep, after Agent ageing. If carried Wealth capacity is lower than the number of deployed Agents, enough Agents are recalled to restore legal support.

Recall is free in action-economy terms, immediately releases 1 Wealth, and destroys the Agent’s seniority. A later replacement is a new Agent at Seniority 1.

## 8. AI implementation note

The digital simulation evaluates Institution development alongside the current strategic state. The automated player currently uses a simulation guardrail of at most one Institution-development action per Family per Generation while this mechanism is being tested.

This guardrail is **not a tabletop rule**. The tabletop restriction is only normal action sequencing and the ability to pay the development cost.
