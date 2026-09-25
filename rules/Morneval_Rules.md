# Morneval — Indexed Rules Reference

**Version:** 0.1  
**Status:** Consolidated design reference

This document is the master indexed rules source for Morneval. Each rule section has a stable identifier (`MOR-X.Y.Z`). Use these identifiers when discussing, revising, or cross-referencing rules.

---

<a id="index"></a>
## Index

### [MOR-1 — Overview of the Game](#mor-1)
- [MOR-1.1 — Core Premise](#mor-1-1)
- [MOR-1.2 — Player Objective](#mor-1-2)
- [MOR-1.3 — Generational Scale](#mor-1-3)
- [MOR-1.4 — Shared-City Tension](#mor-1-4)

### [MOR-2 — Game Concepts & Terminology](#mor-2)
- [MOR-2.1 — Generation](#mor-2-1)
- [MOR-2.2 — Families](#mor-2-2)
- [MOR-2.3 — Family Members and the Three-Generation Window](#mor-2-3)
- [MOR-2.4 — Prestige](#mor-2-4)
- [MOR-2.5 — Influence](#mor-2-5)
- [MOR-2.6 — Wealth](#mor-2-6)
- [MOR-2.7 — Agents](#mor-2-7)
- [MOR-2.8 — Stakes](#mor-2-8)
- [MOR-2.9 — Hinterland and Raw Resources](#mor-2-9)
- [MOR-2.10 — Production Sectors](#mor-2-10)
- [MOR-2.11 — Production-Sector Wealth](#mor-2-11)
- [MOR-2.12 — Demand](#mor-2-12)
- [MOR-2.13 — City Inclination](#mor-2-13)
- [MOR-2.14 — Inclination and Demand Priority](#mor-2-14)
- [MOR-2.15 — Institutions](#mor-2-15)
- [MOR-2.16 — Developing Institutions](#mor-2-16)
- [MOR-2.17 — Conditional Institution Benefits](#mor-2-17)
- [MOR-2.18 — Knowledge](#mor-2-18)
- [MOR-2.19 — Population](#mor-2-19)
- [MOR-2.20 — Squalor](#mor-2-20)
- [MOR-2.21 — Order](#mor-2-21)
- [MOR-2.22 — Force](#mor-2-22)
- [MOR-2.23 — City Economic Strength](#mor-2-23)
- [MOR-2.24 — Renown](#mor-2-24)

### [MOR-3 — Turn / Generation Sequence](#mor-3)
- [MOR-3.0 — Generation Structure](#mor-3-0)
- [MOR-3.1 — Possible Player Actions](#mor-3-1)
  - [MOR-3.1.1 — Place a Production-Sector Stake](#mor-3-1-1)
  - [MOR-3.1.2 — Replace an Existing Stake](#mor-3-1-2)
  - [MOR-3.1.3 — Place / Acquire a Raw-Resource Stake](#mor-3-1-3)
  - [MOR-3.1.4 — Develop a Production Sector](#mor-3-1-4)
  - [MOR-3.1.5 — Place an Agent in an Institution](#mor-3-1-5)
  - [MOR-3.1.6 — Develop an Institution](#mor-3-1-6)
  - [MOR-3.1.7 — Use a Minor Institution](#mor-3-1-7)
  - [MOR-3.1.8 — Assassination](#mor-3-1-8)
  - [MOR-3.1.9 — Initiate a Vote](#mor-3-1-9)
- [MOR-3.2 — End-of-Generation Upkeep](#mor-3-2)
  - [MOR-3.2.1 — Resolve Supply and Demand](#mor-3-2-1)
  - [MOR-3.2.2 — Determine Which Stakes Are Served](#mor-3-2-2)
  - [MOR-3.2.3 — Resolve Raw-Resource Usage](#mor-3-2-3)
  - [MOR-3.2.4 — Resolve Population Needs and Growth](#mor-3-2-4)
  - [MOR-3.2.5 — Update Squalor](#mor-3-2-5)
  - [MOR-3.2.6 — Resolve Disease](#mor-3-2-6)
  - [MOR-3.2.7 — Update Order and Other City Characteristics](#mor-3-2-7)
  - [MOR-3.2.8 — Resolve External Relations](#mor-3-2-8)
  - [MOR-3.2.9 — Resolve the Generation Event](#mor-3-2-9)
  - [MOR-3.2.10 — Calculate Family Wealth](#mor-3-2-10)
  - [MOR-3.2.11 — Erode Influence](#mor-3-2-11)
  - [MOR-3.2.12 — Age Production-Sector Stakes](#mor-3-2-12)
  - [MOR-3.2.13 — Age Family Members](#mor-3-2-13)
- [MOR-3.3 — End-of-Generation Scoring](#mor-3-3)
  - [MOR-3.3.1 — Institution Scoring](#mor-3-3-1)
  - [MOR-3.3.2 — City Inclination and Institution Scoring](#mor-3-3-2)
  - [MOR-3.3.3 — Conditional Institution Prestige](#mor-3-3-3)
  - [MOR-3.3.4 — Productive Land Prestige](#mor-3-3-4)
  - [MOR-3.3.5 — Elder Character Scoring](#mor-3-3-5)
  - [MOR-3.3.6 — Event Scoring](#mor-3-3-6)
  - [MOR-3.3.7 — Immediate Development Prestige](#mor-3-3-7)

### [MOR-4 — Other Systems](#mor-4)
- [MOR-4.1 — External Powers](#mor-4-1)
- [MOR-4.2 — Elves](#mor-4-2)
- [MOR-4.3 — Gnomes](#mor-4-3)
- [MOR-4.4 — Orcs](#mor-4-4)
- [MOR-4.5 — Mainland / Maritime Power](#mor-4-5)
- [MOR-4.6 — External Powers and Production](#mor-4-6)
- [MOR-4.7 — External Events](#mor-4-7)
- [MOR-4.8 — Voting and Politics](#mor-4-8)
- [MOR-4.9 — Assassination and Political Violence](#mor-4-9)
- [MOR-4.10 — Endgame](#mor-4-10)
- [MOR-4.11 — Secret Endgame Allegiance](#mor-4-11)
- [MOR-4.12 — Squalor, Unrest and Independence](#mor-4-12)
- [MOR-4.13 — Important Design Tensions](#mor-4-13)
- [MOR-4.14 — Locked in Principle but Numerically Provisional](#mor-4-14)
- [MOR-4.15 — Systems Still Requiring Design Completion](#mor-4-15)
- [MOR-4.16 — Core Design Identity](#mor-4-16)

---

<a id="mor-1"></a>
# MOR-1 — Overview of the Game

<a id="mor-1-1"></a>
## MOR-1.1 — Core Premise

**Morneval** is a competitive city-building and political board game set in a medieval-fantasy world.

Each player controls a powerful **Family** whose members influence the development of the same city across centuries. Morneval begins as a relatively small **coastal settlement** and develops economically, politically, institutionally, and territorially over successive generations.

Players are not building separate cities. They are jointly developing Morneval while competing for control, opportunity, and historical importance.

[↑ Back to index](#index)

<a id="mor-1-2"></a>
## MOR-1.2 — Player Objective

The primary victory-point measure is **Prestige**.

Prestige comes from sources including:
- developing Production Sectors;
- developing Institutions;
- benefiting from investments;
- controlling productive land;
- Institution-related scoring;
- character abilities;
- Events;
- the final political destiny of Morneval.

The winning Family is the Family with the greatest accumulated Prestige at game end.

[↑ Back to index](#index)

<a id="mor-1-3"></a>
## MOR-1.3 — Generational Scale

One Generation represents approximately **20 years**.

The game is intentionally generational rather than year-by-year. Characters, Stakes, city development, demographic change, and political evolution therefore operate on a long historical timescale.

[↑ Back to index](#index)

<a id="mor-1-4"></a>
## MOR-1.4 — Shared-City Tension

The city is simultaneously:
- a shared engine that all players need to keep functioning;
- and the principal competitive arena.

What is good for Morneval is not necessarily what is best for an individual Family.

Players may benefit from developments created by rivals. Conversely, a Family may sometimes profit from shortages, instability, or crises, provided the city is not damaged beyond usefulness.

[↑ Back to index](#index)

---

<a id="mor-2"></a>
# MOR-2 — Game Concepts & Terminology

<a id="mor-2-1"></a>
## MOR-2.1 — Generation

A **Generation** is the fundamental turn of the game.

During a Generation:
1. a long-term Event establishes the historical context;
2. Families take actions;
3. production and demand are resolved;
4. Morneval undergoes demographic, economic, and political upkeep;
5. players score Prestige;
6. characters and Production-Sector Stakes age.

[↑ Back to index](#index)

<a id="mor-2-2"></a>
## MOR-2.2 — Families

Each player represents a dynasty or **Family**.

A Family persists across generations through:
- family members;
- Stakes;
- Agents;
- land/resource holdings;
- accumulated Influence;
- political positioning.

Families accumulate Prestige across the game.

[↑ Back to index](#index)

<a id="mor-2-3"></a>
## MOR-2.3 — Family Members and the Three-Generation Window

Each Family maintains three important members simultaneously:
- **Young**;
- **Mature**;
- **Elder**.

All three are active at the same time.

Intended structure:
- **Young:** usually a simple bonus or modifier;
- **Mature:** usually a special action or active power;
- **Elder:** usually a special Prestige-scoring condition.

At the end of a Generation:
- the Elder leaves;
- the Mature becomes Elder;
- the Young becomes Mature;
- a new Young member enters.

Character abilities should primarily benefit the owning Family. The complete roster remains to be finalized.

[↑ Back to index](#index)

<a id="mor-2-4"></a>
## MOR-2.4 — Prestige

**Prestige** is the main victory-point currency.

Prestige is accumulated permanently and is not normally spent.

Typical sources include Production-Sector development, Institution development, Institution scoring, Elder character objectives, productive land holdings, Events, and final political objectives.

Prestige is distinct from both Wealth and Influence.

[↑ Back to index](#index)

<a id="mor-2-5"></a>
## MOR-2.5 — Influence

**Influence** is a stored and spendable Family resource.

Influence is used for:
- placing Stakes;
- replacing existing Stakes;
- developing Production Sectors;
- developing Institutions;
- political activity and Votes;
- other Institution-related actions.

Influence is subject to a maximum capacity.

At the end of each Generation, each Family loses **2 Influence** through natural erosion.

The exact maximum Influence capacity remains a playtest value.

[↑ Back to index](#index)

<a id="mor-2-6"></a>
## MOR-2.6 — Wealth

**Wealth is a capacity, not a stored resource.**

A Family's investments generate Wealth during a Generation. Its network of Agents and other commitments consumes Wealth.

At the end of the Generation:
1. calculate Wealth generated;
2. calculate Wealth obligations;
3. compare the two.

If obligations exceed available Wealth, the Family cannot support its entire network and must remove unsupported elements such as Agents.

If Wealth exceeds expenditure, the surplus disappears. Unused Wealth is not banked between Generations.

[↑ Back to index](#index)

<a id="mor-2-7"></a>
## MOR-2.7 — Agents

**Agents** represent members of a Family permanently embedded in Institutions.

Agents:
- remain associated with Institutions;
- provide passive benefits;
- grant access to relevant Minor Institutions or actions;
- may create Prestige opportunities.

Agents are not worker-placement pawns that return every turn.

Maintaining a large Agent network becomes progressively more expensive. The intended model is an escalating Wealth-maintenance track on the player board, similar in principle to *Eclipse*.

Exact costs remain subject to playtesting.

[↑ Back to index](#index)

<a id="mor-2-8"></a>
## MOR-2.8 — Stakes

A **Stake** represents a Family's economic participation or privileged position.

### Production-Sector Stakes
Production-Sector Stakes age through:
- Young;
- Mature;
- Elder.

At Generation end:
- Elder Stakes leave;
- Mature Stakes become Elder;
- Young Stakes become Mature.

A Stake may be replaced early by another Family by paying an additional Influence cost.

### Raw-Resource Stakes
Raw-resource Stakes use a single Stake slot. They are permanent until deliberately replaced and do not age out during generational upkeep.

[↑ Back to index](#index)

<a id="mor-2-9"></a>
## MOR-2.9 — Hinterland and Raw Resources

Hinterland tiles provide **production capacity**.

Later technological or magical development may increase that capacity.

Families may hold Stakes in raw-resource locations.

A Family earns **1 Prestige for each controlled raw-resource land whose production is actually used by a Production Sector**.

Unused land does not generate this Prestige.

[↑ Back to index](#index)

<a id="mor-2-10"></a>
## MOR-2.10 — Production Sectors

Production Sectors represent increasingly sophisticated economic activities.

Each Sector has development tiers. Higher tiers represent greater specialization, refining capability, mastery, and economic importance.

The current structural rule is:

> **1 Stake slot per Production-Sector level.**

Developing a Sector:
- costs Influence;
- requires an appropriate city-size threshold;
- grants Prestige;
- increases Sector capacity;
- allows the developing player to place a Stake immediately while still paying the normal Stake cost.

Exact numerical values remain subject to playtesting.

[↑ Back to index](#index)

<a id="mor-2-11"></a>
## MOR-2.11 — Production-Sector Wealth

Production-sector profitability depends on actual demand.

Base rule:

> **A served Stake generates 1 Wealth.**

If demand is insufficient to support every Stake, service is allocated by seniority:
1. oldest Stake generation;
2. earliest placement within the same generation.

Scarcity may grant additional profitability to Elder Stakes. The exact scarcity bonus requires numerical confirmation during balancing.

[↑ Back to index](#index)

<a id="mor-2-12"></a>
## MOR-2.12 — Demand

Goods must satisfy demand from three categories:
1. **Population**;
2. **Institutions**;
3. **External Markets**.

Production does not automatically generate value.

Political and diplomatic development can change the amount or priority of demand.

The system deliberately creates tension between expanding supply, maintaining scarcity, satisfying basic city needs, and maximizing Family profitability.

[↑ Back to index](#index)

<a id="mor-2-13"></a>
## MOR-2.13 — City Inclination

Morneval has a political/cultural **Inclination** represented on a cross-shaped map.

The four directions are:
- Arcane;
- Religion / Temple;
- Military;
- Mercantile.

Opposing pairs:
- Arcane ↔ Religion;
- Military ↔ Mercantile.

The city may be Neutral, Level I aligned, Level II strongly aligned, or hybrid across the two axes.

Pure Level II positions should be powerful but dangerous.

[↑ Back to index](#index)

<a id="mor-2-14"></a>
## MOR-2.14 — Inclination and Demand Priority

City Inclination determines how scarce production is distributed.

### Mercantile
External Markets have priority.

### Arcane
Institutions have priority.

### Religious
Institutions have priority.

### Military
Population has priority.

### Hybrid Inclinations
Both favored categories share priority.

Example: Mercantile I + Religious I prioritizes External Markets and Institutions before Population.

### Neutral
All three demand categories receive equal priority.

### Tie-breaker
Where a further tie is required:

> **Population > Institutions > External Markets**

[↑ Back to index](#index)

<a id="mor-2-15"></a>
## MOR-2.15 — Institutions

Institutions are permanent civic, religious, military, economic, medical, or scholarly structures within Morneval.

Families place Agents in Institutions.

Institutions can provide:
- passive benefits;
- special actions through Minor Institutions;
- Prestige opportunities.

Examples previously discussed include Merchant Guild, City Guard, Temple, Hospice, College of Medicine, and scholarly Institutions.

Agents remain in Institutions rather than being recalled each turn.

[↑ Back to index](#index)

<a id="mor-2-16"></a>
## MOR-2.16 — Developing Institutions

A Family may develop an Institution by spending Influence.

The developing Family:
- gains Prestige;
- places an Agent;
- selects the associated Minor Institution or development branch.

Selecting one branch may permanently lock out alternatives.

Morneval therefore develops path-dependently and cannot necessarily contain every possible option.

[↑ Back to index](#index)

<a id="mor-2-17"></a>
## MOR-2.17 — Conditional Institution Benefits

Some Institutions earn additional Prestige only when their purpose is genuinely relevant.

Example: a famine-response Institution should not earn crisis Prestige in a Generation with no famine.

This creates an intentional incentive where a player controlling the solution may sometimes benefit from the existence of the problem.

[↑ Back to index](#index)

<a id="mor-2-18"></a>
## MOR-2.18 — Knowledge

A scholarly Institution may generate **Knowledge**.

Knowledge is intended as a limited wild resource.

Potential uses include restricted substitution for:
- Influence;
- part of a Wealth requirement;
- Prestige conversion.

Knowledge must be tightly capped so that it supplements rather than replaces normal resources.

The exact implementation remains unfinished.

[↑ Back to index](#index)

<a id="mor-2-19"></a>
## MOR-2.19 — Population

Population represents the size of Morneval.

Larger Population creates more demand, more economic potential, more pressure on resources, more potential Squalor, and greater vulnerability to shortages and disease.

Population growth is not automatic.

A city whose basic Population demand is not met should not continue growing normally.

[↑ Back to index](#index)

<a id="mor-2-20"></a>
## MOR-2.20 — Squalor

**Squalor** represents crowding, inadequate infrastructure, poor living conditions, and unmet urban needs.

Higher Squalor increases disease risk.

Disease reduces Population.

This creates a negative-feedback loop:

> Population growth → pressure → Squalor → disease → Population loss → reduced pressure.

Disease is resolved on the scale of a Generation rather than persisting as a multi-generation state.

[↑ Back to index](#index)

<a id="mor-2-21"></a>
## MOR-2.21 — Order

**Order** represents internal civic stability.

Order is relevant to City Guard, Temple, unrest, political stability, and potentially the late-game independence struggle.

Order and Squalor are related but remain separate concepts.

[↑ Back to index](#index)

<a id="mor-2-22"></a>
## MOR-2.22 — Force

**Force** represents Morneval's ability to defend itself and project military power.

Force matters particularly for City Guard, raids, external threats, and geopolitical development.

[↑ Back to index](#index)

<a id="mor-2-23"></a>
## MOR-2.23 — City Economic Strength

Morneval has an economic condition distinct from individual Family Wealth.

This city-level economic strength can be used as a scoring parameter for Institutions.

The Merchant Guild, for example, is intended to care strongly about city prosperity.

[↑ Back to index](#index)

<a id="mor-2-24"></a>
## MOR-2.24 — Renown

**Renown** represents Morneval's overall historical importance and maturity.

Renown is not a Family victory score.

It is expected to form part of the endgame trigger.

Exact thresholds remain to be determined.

[↑ Back to index](#index)

---

<a id="mor-3"></a>
# MOR-3 — Turn / Generation Sequence

<a id="mor-3-0"></a>
## MOR-3.0 — Generation Structure

The agreed structure is:

### A. Beginning of Generation
Reveal the long-term Generation Event.

### B. Player Action Phase
Families take actions to alter their economic, institutional, and political position.

### C. End-of-Generation Upkeep
Resolve city economy, Family economy, demographics, external relations, Events, and aging.

### D. End-of-Generation Scoring
Resolve Prestige from Institutions, characters, productive land, Events, and other conditions.

The exact number of actions, initiative system, passing procedure, and action-round structure remain unfinished.

[↑ Back to index](#index)

<a id="mor-3-1"></a>
# MOR-3.1 — Possible Player Actions

<a id="mor-3-1-1"></a>
## MOR-3.1.1 — Place a Production-Sector Stake

Spend Influence to place a Stake in an available Production-Sector slot.

The Stake enters as Young and may generate Wealth if sufficient demand exists.

[↑ Back to index](#index)

<a id="mor-3-1-2"></a>
## MOR-3.1.2 — Replace an Existing Stake

A Family may replace an occupied Stake.

Replacement requires additional Influence beyond normal placement cost.

This preserves the value of established economic positions while allowing aggressive entry.

[↑ Back to index](#index)

<a id="mor-3-1-3"></a>
## MOR-3.1.3 — Place / Acquire a Raw-Resource Stake

Take control of an available resource-producing land position.

Each raw-resource location has one Stake slot.

Raw-resource Stakes remain until replaced. They may generate Prestige when their output is actually used.

[↑ Back to index](#index)

<a id="mor-3-1-4"></a>
## MOR-3.1.4 — Develop a Production Sector

Advance a Production Sector by one tier.

Requirements include an appropriate city-size threshold.

The acting Family:
1. pays the tier's Influence cost;
2. gains Prestige;
3. increases the Sector's development;
4. gains the opportunity to place a Stake immediately;
5. still pays the normal Stake-placement cost.

Exact costs, thresholds, and Prestige rewards remain playtest values.

[↑ Back to index](#index)

<a id="mor-3-1-5"></a>
## MOR-3.1.5 — Place an Agent in an Institution

Establish Family representation inside an Institution where permitted.

Agents provide persistent benefits but increase the Family's Wealth-maintenance burden.

[↑ Back to index](#index)

<a id="mor-3-1-6"></a>
## MOR-3.1.6 — Develop an Institution

Spend Influence to advance Morneval institutionally.

The acting Family:
- gains Prestige;
- places an Agent;
- chooses the relevant Minor Institution / branch.

Alternative branches may become permanently unavailable.

[↑ Back to index](#index)

<a id="mor-3-1-7"></a>
## MOR-3.1.7 — Use a Minor Institution

A Family with the required access may use a Minor Institution's special action.

Minor Institution actions are restricted rather than freely repeatable.

Exact costs and frequency should be specified on the Institution itself.

[↑ Back to index](#index)

<a id="mor-3-1-8"></a>
## MOR-3.1.8 — Assassination

Assassination is a **Minor Institution action**, not a standard basic action.

Potential targets may include:
- Stakes;
- Agents;
- Family members.

Assassination contains uncertainty.

Family members must be harder to kill than Agents or Stakes.

A successful character assassination removes only one of the target Family's three active character bonuses.

After suffering a character assassination, the Family gains bodyguard protection against repeated character assassinations during the relevant protection period.

Exact probabilities remain unfinished.

[↑ Back to index](#index)

<a id="mor-3-1-9"></a>
## MOR-3.1.9 — Initiate a Vote

A player may initiate a political Vote where permitted.

Influencing the outcome belongs to the Vote procedure itself rather than existing as a separate generic action.

Votes are a principal mechanism for altering City Inclination and political direction.

[↑ Back to index](#index)

<a id="mor-3-2"></a>
# MOR-3.2 — End-of-Generation Upkeep

<a id="mor-3-2-1"></a>
## MOR-3.2.1 — Resolve Supply and Demand

Determine available production and demand for each relevant Sector.

Demand originates from Population, Institutions, and External Markets.

Where supply is insufficient, allocate according to Morneval's City Inclination. Use the established tie-breaker when necessary.

[↑ Back to index](#index)

<a id="mor-3-2-2"></a>
## MOR-3.2.2 — Determine Which Stakes Are Served

Within each Production Sector, determine which Stakes are supported by available demand.

Priority:
1. oldest Stake generation;
2. earliest placement.

Each served Stake normally generates **1 Wealth**.

Scarcity may provide additional returns to Elder Stakes.

[↑ Back to index](#index)

<a id="mor-3-2-3"></a>
## MOR-3.2.3 — Resolve Raw-Resource Usage

Determine which raw-resource production is actually consumed by active Production Sectors.

This affects both city production capacity and Family Prestige.

[↑ Back to index](#index)

<a id="mor-3-2-4"></a>
## MOR-3.2.4 — Resolve Population Needs and Growth

Check whether Population demand is adequately supplied.

A city whose basic demand is not satisfied does not grow normally.

Food shortages may cause famine and Population loss.

The **Hospice** can prevent **1 Population loss caused by famine** when applicable.

[↑ Back to index](#index)

<a id="mor-3-2-5"></a>
## MOR-3.2.5 — Update Squalor

Adjust Squalor based on urban pressure and how effectively Morneval supports its Population.

Conceptually:

> larger and/or underserved city → more Squalor.

The exact numerical table requires final consolidation.

[↑ Back to index](#index)

<a id="mor-3-2-6"></a>
## MOR-3.2.6 — Resolve Disease

Disease risk depends on Squalor.

Disease causes Population loss and does not normally remain on the board across multiple Generations.

The **College of Medicine** modifies disease probability rather than simply cancelling Population loss afterward.

The exact probability table requires confirmation from the original locked discussion.

[↑ Back to index](#index)

<a id="mor-3-2-7"></a>
## MOR-3.2.7 — Update Order and Other City Characteristics

Apply changes to Order, Force, and other city parameters caused by shortages, Institutions, Events, political decisions, and external interactions.

[↑ Back to index](#index)

<a id="mor-3-2-8"></a>
## MOR-3.2.8 — Resolve External Relations

Recalculate Morneval's relationships with each External Power.

Relations are affected by Morneval's actual development and behavior.

Example: large-scale exploitation of forests damages relations with Elves.

Relationship changes are primarily tallied at Generation end.

[↑ Back to index](#index)

<a id="mor-3-2-9"></a>
## MOR-3.2.9 — Resolve the Generation Event

Evaluate the Event revealed at the beginning of the Generation.

Its resolution may modify Morneval, External Powers, Prestige, diplomatic relationships, or other end-of-Generation outcomes.

[↑ Back to index](#index)

<a id="mor-3-2-10"></a>
## MOR-3.2.10 — Calculate Family Wealth

For each Family:
1. total Wealth generated;
2. determine maintenance obligations;
3. compare Wealth capacity against expenditure.

Agents use the escalating Wealth-maintenance structure.

If a Family cannot support its network, unsupported Agents or other commitments must be removed until expenditure is supportable.

Unused Wealth disappears.

[↑ Back to index](#index)

<a id="mor-3-2-11"></a>
## MOR-3.2.11 — Erode Influence

Each Family loses **2 Influence**.

Influence may not exceed the Family's maximum capacity.

[↑ Back to index](#index)

<a id="mor-3-2-12"></a>
## MOR-3.2.12 — Age Production-Sector Stakes

For ordinary Production-Sector Stakes:
- Elder Stakes leave;
- Mature Stakes become Elder;
- Young Stakes become Mature.

Raw-resource Stakes do not age.

[↑ Back to index](#index)

<a id="mor-3-2-13"></a>
## MOR-3.2.13 — Age Family Members

Advance the Family character window:
- Elder leaves;
- Mature becomes Elder;
- Young becomes Mature;
- introduce a new Young character.

[↑ Back to index](#index)

<a id="mor-3-3"></a>
# MOR-3.3 — End-of-Generation Scoring

<a id="mor-3-3-1"></a>
## MOR-3.3.1 — Institution Scoring

Institutions are major recurring Prestige sources.

Each Institution should score according to a distinct combination of city characteristics.

Examples:

### Merchant Guild
Primarily scores city economic prosperity.

### City Guard
Scores factors such as Force and Order.

### Temple
Scores factors such as Population and Order.

The full scoring matrix remains unfinished.

[↑ Back to index](#index)

<a id="mor-3-3-2"></a>
## MOR-3.3.2 — City Inclination and Institution Scoring

City Inclination modifies the value of Institutions.

Players may therefore gain from direct institutional association and indirect synergy between an Institution and Morneval's current political direction.

[↑ Back to index](#index)

<a id="mor-3-3-3"></a>
## MOR-3.3.3 — Conditional Institution Prestige

Institutions that respond to crises may gain additional Prestige only when the relevant crisis actually occurs.

This preserves the intended “pyromaniac fireman” incentive structure.

[↑ Back to index](#index)

<a id="mor-3-3-4"></a>
## MOR-3.3.4 — Productive Land Prestige

A Family gains:

> **1 Prestige per controlled raw-resource land whose production is actually being used by a Production Sector.**

Unused land does not score.

[↑ Back to index](#index)

<a id="mor-3-3-5"></a>
## MOR-3.3.5 — Elder Character Scoring

Each Elder may provide a Family-specific Prestige condition.

The complete character set remains unfinished.

[↑ Back to index](#index)

<a id="mor-3-3-6"></a>
## MOR-3.3.6 — Event Scoring

Generation Events may impose special Prestige conditions.

Players see the Event before taking their actions, allowing deliberate adaptation.

[↑ Back to index](#index)

<a id="mor-3-3-7"></a>
## MOR-3.3.7 — Immediate Development Prestige

Some Prestige is gained during the Action Phase.

In particular:
- Production-Sector development;
- Institution development.

These points are added immediately to the Family's total Prestige.

[↑ Back to index](#index)

---

<a id="mor-4"></a>
# MOR-4 — Other Systems

<a id="mor-4-1"></a>
## MOR-4.1 — External Powers

Morneval is surrounded by external societies creating both opportunities and threats.

Each External Power should:
- care about different aspects of Morneval;
- offer distinct benefits;
- impose distinct risks;
- react to the city's development.

Morneval should not be able to satisfy every External Power simultaneously.

[↑ Back to index](#index)

<a id="mor-4-2"></a>
## MOR-4.2 — Elves

Elves are associated with nature, low-impact development, Magic, and selected raw resources and economic sectors.

Deforestation and destructive exploitation damage relations.

Good relations should make a low-production / magical development path viable.

Exact modifiers remain unfinished.

[↑ Back to index](#index)

<a id="mor-4-3"></a>
## MOR-4.3 — Gnomes

Gnomes replaced the earlier Dwarf concept.

They are associated with engineering, trade, productivity, and technology.

Good relations may improve economic efficiency or trade.

Hostile Gnomes may disrupt or close trade routes.

[↑ Back to index](#index)

<a id="mor-4-4"></a>
## MOR-4.4 — Orcs

Orcs create strong physical pressure.

Hostile Orcs can raid, pillage the city, and devastate surrounding land.

Full alliance may not be appropriate. Neutrality may represent the best stable relationship.

Neutral Orcs may provide a limited external trade outlet.

[↑ Back to index](#index)

<a id="mor-4-5"></a>
## MOR-4.5 — Mainland / Maritime Power

The Mainland is a major distant political and trading power accessed primarily through maritime routes.

It may value Morneval's raw materials, provide external market opportunities, and become increasingly hostile to Morneval's autonomy as the city grows.

The relationship is broadly colonial in structure.

The Mainland becomes central to the endgame.

[↑ Back to index](#index)

<a id="mor-4-6"></a>
## MOR-4.6 — External Powers and Production

External Powers should value different Production Sectors differently.

Diplomacy therefore changes the viability of different development paths rather than providing only generic trade income.

[↑ Back to index](#index)

<a id="mor-4-7"></a>
## MOR-4.7 — External Events

At the start of each Generation, an Event establishes a long-term historical situation.

Events should represent developments such as regime changes, migration, climate shifts, epidemics, geopolitical changes, or major territorial developments.

The Event:
1. creates an initial condition;
2. gives players a Generation to respond;
3. resolves at Generation end;
4. may alter Prestige, Morneval, or External Powers.

A future campaign mode may use scripted Event sequences.

[↑ Back to index](#index)

<a id="mor-4-8"></a>
## MOR-4.8 — Voting and Politics

Voting is a primary mechanism for collectively steering Morneval.

Votes can change City Inclination and therefore influence demand priorities, Institution values, economic incentives, and future city development.

Political decisions are intended to alter the functioning of the city, not merely distribute Prestige.

[↑ Back to index](#index)

<a id="mor-4-9"></a>
## MOR-4.9 — Assassination and Political Violence

Assassination belongs to the Institution system.

The intended target hierarchy is:
- Stakes = relatively vulnerable;
- Agents = more valuable;
- Family members = hardest to kill.

Character assassination must contain uncertainty.

A Family should not be able to lose its entire three-character engine to repeated attacks.

Bodyguard protection exists to limit repeated character assassinations.

[↑ Back to index](#index)

<a id="mor-4-10"></a>
## MOR-4.10 — Endgame

The game should not simply end after a fixed number of Generations.

Instead, Morneval eventually becomes important enough that its political relationship with the Mainland must be resolved.

**Renown** forms part of the trigger.

Once the endgame conditions are met, a final window of approximately **2–3 Generations** is intended to open.

Exact timing remains to be balanced.

Three political outcomes exist:

### Ending I — Remain with the Mainland
Morneval remains aligned with / part of the Mainland system.

### Ending II — Reject the Mainland under Foreign Protection
Morneval breaks with the Mainland but relies on another External Power.

### Ending III — Full Independence
Morneval becomes genuinely independent of both the Mainland and foreign patrons.

Full Independence should be the hardest outcome.

[↑ Back to index](#index)

<a id="mor-4-11"></a>
## MOR-4.11 — Secret Endgame Allegiance

Players secretly commit to one of the possible political endings.

If their chosen outcome becomes Morneval's actual destiny, they gain bonus Prestige.

The three endings need not award equal Prestige.

Full Independence should award the largest bonus because it is intended to be the hardest outcome to achieve.

This creates asymmetric risk: a leading player may prefer a safer outcome, while a trailing player may pursue a harder, higher-value outcome.

[↑ Back to index](#index)

<a id="mor-4-12"></a>
## MOR-4.12 — Squalor, Unrest and Independence

During the final political struggle, Squalor and Unrest should increasingly favor independence.

A prosperous and stable Morneval may be more comfortable remaining within the existing political order.

A city suffering instability may become more revolutionary.

The concept is inspired by the independence buildup in *Sid Meier's Colonization*.

The precise mechanism remains unfinished.

[↑ Back to index](#index)

<a id="mor-4-13"></a>
## MOR-4.13 — Important Design Tensions

### Shared city vs personal advantage
Players need Morneval to function, but not necessarily in the same way.

### Supply vs scarcity
More production strengthens the city, while scarcity can increase profitability for established interests.

### Stability vs opportunity
Order helps the city, but crises can create scoring opportunities.

### Long-term investment vs turnover
Agents and raw-resource Stakes persist, while Production-Sector Stakes naturally age out.

### Political ideology vs economic reality
City Inclination changes economic allocation and Institution value.

### Growth vs sustainability
Population creates opportunities and pressure simultaneously.

### Foreign friendship vs autonomy
External relationships provide benefits but may compromise independence.

[↑ Back to index](#index)

<a id="mor-4-14"></a>
## MOR-4.14 — Locked in Principle but Numerically Provisional

The following are conceptually established but remain subject to playtesting:
- Influence costs for Stakes;
- Stake replacement costs;
- Sector-development costs;
- Population requirements for Sector tiers;
- Prestige rewards for development;
- Agent-maintenance curve;
- maximum Influence;
- Institution-development costs;
- Institution scoring formulas;
- exact Demand values;
- Squalor thresholds;
- disease probabilities;
- College of Medicine values;
- scarcity bonus for Elder Stakes;
- External Power relationship thresholds;
- trade modifiers;
- Event values;
- assassination probabilities;
- Knowledge limits and uses;
- Renown endgame threshold;
- endgame-window length;
- final Prestige rewards for political endings.

[↑ Back to index](#index)

<a id="mor-4-15"></a>
## MOR-4.15 — Systems Still Requiring Design Completion

The following remain structurally incomplete:

### Character roster
The Young/Mature/Elder framework exists, but the complete character set has not been finalized.

### Full voting procedure
The purpose and links to City Inclination are established, but the exact procedure requires consolidation.

### Complete Institution tree
The branching/development system exists, but the definitive list must be restored into the central rules source.

### Institution scoring matrix
The principle of asymmetric scoring is locked; exact formulas are not.

### External Power tables
Strategic identities exist, but exact relationship benefits and penalties remain unfinished.

### Endgame thresholds
Political endings and secret commitments exist, but exact trigger conditions are unresolved.

### Action structure
The action types exist, but the exact number of actions, player order, passing, and round structure are not yet codified.

[↑ Back to index](#index)

<a id="mor-4-16"></a>
## MOR-4.16 — Core Design Identity

Morneval is not a set of parallel individual engines.

All major systems feed into the same city.

A Family's investments alter production. City Inclination changes how production is allocated. Allocation determines Family Wealth. Population and shortages affect Squalor and stability. Institutions respond to those conditions. External Powers react to the city's development. Foreign relationships alter trade and strategic possibilities. Eventually Morneval's accumulated development produces a political crisis over its future.

The winner is the Family that best exploits several centuries of Morneval's history to accumulate Prestige.

[↑ Back to index](#index)
