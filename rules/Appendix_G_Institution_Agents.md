# Appendix G — Institution Agents, Seniority & Influence

Status: **v0.10.2 simulation model**. The structural Agent rules in Sections 1–6 are locked design decisions. The automated-player valuation model in Section 7 is a simulation heuristic and remains subject to playtest tuning.

## 1. Starting state and placement

Each Family begins the game with **0 Agents deployed**.

Placing an Agent:

- is a normal **player action**;
- has no Influence cost and no one-time Wealth payment;
- requires the Family to have **1 Wealth capacity currently free**;
- may target any existing major Institution;
- has no prerequisite or ordering dependency between Institutions.

There is currently **no maximum number of Agents** per Family and **no capacity limit per Institution**. A Family may place several Agents in the same Institution if it can support them.

## 2. Wealth commitment

Each deployed Agent permanently **reserves 1 Wealth capacity** while it remains deployed.

This Wealth is unavailable for other commitments such as exploration, Farms or Production-Sector development.

Example: a Family with Wealth capacity 3 and two deployed Agents has only 1 Wealth free for other uses.

If a Family's Wealth capacity falls below its number of deployed Agents, it must **immediately recall enough Agents to return within its Wealth capacity**.

There is no debt or temporary Agent-maintenance deficit.

## 3. Persistence and recall

Agents persist from Generation to Generation until recalled.

Recalling an Agent:

- costs no action;
- immediately releases its reserved Wealth;
- removes that Agent from the Institution;
- destroys all accumulated Agent seniority.

If that position is later re-established, the newly placed Agent begins again at **Seniority 1** and placing it consumes a normal player action.

Therefore an Agent can be recalled freely in action-economy terms, but relocation has a substantial long-term opportunity cost.

## 4. Seniority

Every newly placed Agent enters as:

**Seniority 1 — Young**

At the end of each Generation, after scoring and Agent Influence income have been resolved, every Agent that remains deployed gains **+1 Seniority**, to a maximum of **Seniority 3**.

An Agent therefore progresses:

**1 → 2 → 3 → 3 → ...**

Seniority will later also determine access to Institution-specific Intrigue cards. The Intrigue implementation is outside v0.10.2.

## 5. Institution Prestige

Institution Prestige continues to use the universal rule:

**Family Prestige gained = Institution Prestige score × number of that Family's Agents in the Institution.**

An Agent placed during the current Generation participates immediately in that Generation's Institution scoring.

Agent seniority does not multiply Institution Prestige. Seniority currently affects Influence income and, later, Intrigue access.

## 6. Agent Influence income and timing

At the end of each Generation, each deployed Agent generates Influence equal to its **current Seniority**:

- Seniority 1 → **+1 Influence**
- Seniority 2 → **+2 Influence**
- Seniority 3 → **+3 Influence**

The locked timing is:

1. resolve normal Generation effects and spending;
2. apply the normal **−2 Influence erosion**;
3. resolve Institution Prestige scoring;
4. each Agent generates Influence according to its current Seniority;
5. apply the Family Influence cap of **10**;
6. age surviving Agents by +1 Seniority, maximum 3;
7. determine the next First Player using the resulting Influence total.

The former prototype rule granting every Family **+5 automatic Influence per Generation is removed**.

Example: a Family has 7 Influence before erosion and its Agents generate 7 Influence. It resolves `7 − 2 + 7 = 12`, then the cap reduces the final value to **10**.

## 7. Automated-player Agent decisions

Agent placement is evaluated as one candidate action among the same pool as exploration, Farms and Production-Sector development. There is no artificial Agent quota and no rule requiring an AI to place an Agent each Generation.

### AI liquidity reserve

The automated-player model applies a **1 Wealth liquidity reserve** when considering a new Agent. An AI may only place an Agent if, after reserving that Agent's 1 Wealth, it would still retain at least **1 Wealth free** for productive or civic actions.

This is an **AI guardrail, not a tabletop rule**. A human player remains free to mobilise all available Wealth into Agents if the rules otherwise allow it.

The guardrail prevents the automated Families from using their only starting Wealth on an Institution Agent and thereby locking themselves out of exploration, Farms and other economy-building actions. In practice, a Family with only 1 free Wealth cannot place a new Agent; with 2 free Wealth it may reserve 1 for an Agent and retain 1 liquid.

The AI evaluates an Agent through two main sources of value:

- expected **Institution Prestige** over that AI personality's planning horizon;
- the future economic value of the Agent's **Influence income**.

Influence is not treated as a fixed Prestige conversion. It is treated as an investment currency whose marginal value depends on the Family's current Influence scarcity and the investment opportunities available to it, including Production Stakes, Production-Sector development, exploration and civic investment. Future action-card uses can later be added to the same valuation layer.

The existing AI personality horizons and discount factors are retained. This means a longer-horizon Family naturally values senior Agents and persistent institutional positions more strongly than a short-horizon Family.

### Voluntary recall

Before choosing an action, the AI may evaluate whether recalling one or more Agents would free enough Wealth for a better action.

The AI compares:

**value of the newly unlocked action − continuation value lost by recalled Agents**

against the best action available without recall. A positive reallocation margin is required so that Agents are not churned for negligible gains.

The Agent continuation value includes expected Institution Prestige plus future seniority-based Influence generation. This gives senior Agents natural inertia without a separate arbitrary seniority bonus.

### Forced recall

When Wealth capacity drops below deployed Agent count, the AI must recall Agents immediately. It removes the Agent with the **lowest estimated continuation value** first and recalculates if additional recalls are required.

This means the AI does not mechanically recall the youngest Agent: a young Agent in a highly valuable Institution may be retained over a senior Agent whose Institution has become strategically weak.

### Simulation-tuning note

The exact AI utility coefficients, the expected Scholarium-breakthrough forecast, the reallocation margin, and the automated liquidity reserve are **simulation tuning parameters**, not tabletop rules. The structural rules above do not depend on those coefficients.
