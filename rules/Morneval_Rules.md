# Morneval — Indexed Rules Reference

**Rules version:** 0.2  
**Prototype alignment:** v0.6.1  
**Status:** Consolidated design reference

This is the master rules source for Morneval. It distinguishes **locked rules** from **current prototype balancing rules**. Numerical sandbox values remain provisional unless explicitly marked as locked.

**v0.6.1 update:** corrected Production-Sector age-slot capacity and Stake-based supply; documented scalable demand, differentiated Wealth, Population/Squalor/disease, and the Institution-cap model as provisional balancing rules.

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
- [MOR-2.3 — Family Members](#mor-2-3)
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
  - [MOR-3.1.5 — Place an Agent](#mor-3-1-5)
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
  - [MOR-3.2.7 — Update Other City Characteristics](#mor-3-2-7)
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
- [MOR-4.14 — Provisional vs Locked](#mor-4-14)
- [MOR-4.15 — Systems Still Requiring Design Completion](#mor-4-15)
- [MOR-4.16 — Core Design Identity](#mor-4-16)

---

<a id="mor-1"></a>
# MOR-1 — OVERVIEW OF THE GAME

<a id="mor-1-1"></a>
## MOR-1.1 — Core Premise

**Morneval** is a competitive city-building and political board game set in a medieval-fantasy world. Each player controls a powerful **Family** influencing the development of the same city over centuries. Morneval begins as a small **coastal settlement** and develops economically, politically, institutionally and territorially.

Players do not build separate cities. They compete inside the same evolving city.

<a id="mor-1-2"></a>
## MOR-1.2 — Player Objective

The primary victory-point measure is **Prestige**. Prestige can come from Production-Sector and Institution development, productive land, Institution scoring, characters, Events and the final political destiny of Morneval. The Family with the greatest Prestige at game end wins.

<a id="mor-1-3"></a>
## MOR-1.3 — Generational Scale

One Generation represents approximately **20 years**. Characters, Stakes, demographics, economic positions and political conditions therefore evolve on a generational rather than annual timescale.

<a id="mor-1-4"></a>
## MOR-1.4 — Shared-City Tension

Morneval is both a shared engine and the principal competitive arena. A prosperous city creates opportunities for everyone, but what benefits the city is not always what maximizes an individual Family's Prestige or Wealth. Shortages, crises and political instability can sometimes be profitable for one Family, provided the city remains viable.

---

<a id="mor-2"></a>
# MOR-2 — GAME CONCEPTS & TERMINOLOGY

<a id="mor-2-1"></a>
## MOR-2.1 — Generation

A **Generation** is the fundamental turn. Broadly: reveal the generational context, take player actions, resolve production/demand and upkeep, score Prestige, then age generational elements.

<a id="mor-2-2"></a>
## MOR-2.2 — Families

Each player represents a dynasty or **Family**. Family presence persists through characters, Production and Raw-Resource Stakes, Agents, accumulated Influence and political positioning.

<a id="mor-2-3"></a>
## MOR-2.3 — Family Members and the Three-Generation Window

Each Family maintains three important members simultaneously:
- **Young** — usually a simple bonus or modifier;
- **Mature** — usually a special action or active power;
- **Elder** — usually a special Prestige-scoring condition.

All three are active. At Generation end, the Elder leaves, Mature becomes Elder, Young becomes Mature and a new Young member enters. The complete character roster remains unfinished.

<a id="mor-2-4"></a>
## MOR-2.4 — Prestige

**Prestige** is the primary victory-point currency. It is accumulated permanently and is not normally spent. This creates a current unresolved point for Stake replacement: the replacement **premium** is locked, but whether it is paid in Influence, Prestige or another cost has not been finally confirmed.

<a id="mor-2-5"></a>
## MOR-2.5 — Influence

**Influence** is a stored and spendable Family resource used for actions such as investment, development and politics. Influence is capped and erodes at Generation end. The currently established erosion principle is **-2 Influence per Generation**; the maximum capacity remains a playtest value.

<a id="mor-2-6"></a>
## MOR-2.6 — Wealth

**Wealth is a capacity, not a stored resource.** A Family's economic interests generate Wealth; Agents and other commitments consume it. At Generation end compare generation Wealth against obligations. Unsupported commitments must be reduced if obligations exceed capacity. Surplus Wealth disappears and is not banked.

<a id="mor-2-7"></a>
## MOR-2.7 — Agents

**Agents** represent persistent Family presence inside Institutions. They are not workers recalled each turn. Agents provide passive benefits and/or access to Minor Institutions and may create scoring opportunities. Maintaining many Agents should become progressively more expensive through an escalating Wealth-maintenance curve.

<a id="mor-2-8"></a>
## MOR-2.8 — Stakes

A **Stake** represents a Family's economic participation or privileged position.

### Production-Sector Stakes — locked structure
Production Stakes have three ages: **Young, Mature, Elder**. Each Sector tier provides age-specific capacity:
- **1 Young slot per tier**;
- **1 Mature slot per tier**;
- **1 Elder slot per tier**.

Therefore a Tier N Sector can contain up to **N Young + N Mature + N Elder = 3 × N total Stakes**. New ordinary Stakes enter as Young. At Generation end Elder Stakes leave, Mature become Elder, and Young become Mature.

An occupied Stake may be replaced early, but replacement must have a **premium cost** relative to filling an empty slot. The exact resource/amount and whether replacement preserves or resets age/seniority are unresolved. Direct ownership edits in the digital sandbox deliberately charge no resource and preserve age/order only for testing.

### Raw-Resource Stakes
Raw-resource locations have a single Family Stake slot. These Stakes are permanent until replaced and do not age out.

<a id="mor-2-9"></a>
## MOR-2.9 — Hinterland and Raw Resources

Hinterland tiles provide **raw-resource capacity**. Magic or technology may later modify capacity. Raw resources constrain Production-Sector output:

**Actual available Sector supply = min(occupied Production Stakes, relevant raw-resource capacity).**

A Family gains **1 Prestige for each controlled raw-resource land whose production is actually used during the Generation**. Potential but unused capacity does not score.

<a id="mor-2-10"></a>
## MOR-2.10 — Production Sectors

Production Sectors represent increasingly sophisticated economic activities. Higher tiers represent greater specialization and institutional/economic maturity.

### Locked v0.6.1 correction
**Sector tier creates Stake capacity; it does not create production by itself.**

Each tier adds **1 Young + 1 Mature + 1 Elder slot**:
- Tier I: up to **3 Stakes**;
- Tier II: up to **6 Stakes**;
- Tier III: up to **9 Stakes**.

Each occupied Production Stake represents exactly **1 unit of potential supply**, subject to raw-resource capacity. A high-tier Sector with no Stakes produces nothing.

Developing a Sector costs Influence, requires appropriate city size, grants Prestige, adds the three age-specific slots for the new tier, and allows the developing player to place a Stake immediately while still paying the normal placement cost. Exact costs/thresholds/rewards remain provisional.

<a id="mor-2-11"></a>
## MOR-2.11 — Production-Sector Wealth

### Locked production rule
Each occupied Production Stake represents **1 unit of potential supply** and can satisfy **exactly 1 unit of demand / one need**.

For each Sector:
- Potential Stake supply = number of occupied Production Stakes;
- Actual available supply = **min(Potential Stake supply, raw-resource capacity)**.

If not every Stake can be served, Stake seniority applies: **Elder > Mature > Young**, then earlier placement breaks ties.

### Current v0.6.1 Wealth model — provisional
Each served Stake is paired with the demand category that actually receives its unit. Current test values:
- Population: **0 Wealth**;
- Institutions: **1 Wealth**;
- External Markets: **2 Wealth**.

This means City Inclination can change Family Wealth by changing which customer category receives scarce production first. These values are balancing parameters, not locked final numbers. The previously discussed scarcity/Elder bonus is not implemented in v0.6.1 and remains unresolved.

<a id="mor-2-12"></a>
## MOR-2.12 — Demand

Demand comes from three categories: **Population, Institutions, External Markets**.

### Current scalable-demand model — provisional
In v0.6.1:
- Population demand scales from Population;
- Institution demand scales from total Institution levels;
- External Market demand scales from Renown.

Current sandbox formulas:

| Sector | Population demand | Institution demand | External demand |
|---|---:|---:|---:|
| Food | `ceil(Population / 2)` | `ceil(total Institution levels / 3)` | `ceil(Renown / 2)` |
| Textiles | `ceil(Population / 6)` | `ceil(total Institution levels / 3)` | `ceil(Renown / 2)` |
| Smithing | `ceil(Population / 6)` | `ceil(total Institution levels / 3)` | `ceil(Renown / 2)` |

If the driver is 0, demand is 0. All divisors are editable playtest parameters.

City Inclination changes the **priority** of demand; demographic, institutional and geopolitical development change the **amount**.

<a id="mor-2-13"></a>
## MOR-2.13 — City Inclination

Morneval's political/cultural Inclination uses two opposed axes:
- **Arcane ↔ Religion/Temple**;
- **Military ↔ Mercantile**.

The city may be Neutral, Level I, Level II or hybrid across axes. Pure Level II positions should be powerful but carry meaningful danger or drawback.

<a id="mor-2-14"></a>
## MOR-2.14 — Inclination and Demand Priority

City Inclination determines distribution of scarce production:
- **Mercantile:** External Markets priority;
- **Arcane:** Institutions priority;
- **Religious:** Institutions priority;
- **Military:** Population priority;
- **Hybrid:** both favored categories share the first priority group;
- **Neutral:** all three categories share priority.

Within a priority group use the tie-breaker **Population > Institutions > External Markets**.

<a id="mor-2-15"></a>
## MOR-2.15 — Institutions

Institutions are permanent civic, religious, military, economic, medical or scholarly structures. Families embed Agents within them. Institutions may grant passive benefits, access to Minor Institutions/actions and Prestige opportunities. Examples discussed include Merchant Guild, City Guard, Temple, Hospice, College of Medicine and scholarly Institutions.

<a id="mor-2-16"></a>
## MOR-2.16 — Developing Institutions

Institution development costs Influence, grants Prestige, places an Agent and can select/lock a development branch or Minor Institution.

### Current v0.6.1 Institution-cap model — provisional
For balance testing, **total Institution levels may not be increased above current Population**. If Population subsequently falls below the already-developed total:
- Institutions are not automatically destroyed;
- Morneval is flagged over-cap;
- further development is blocked until the city is no longer over-cap.

This is a prototype constraint, not a final Institution-loss rule.

<a id="mor-2-17"></a>
## MOR-2.17 — Conditional Institution Benefits

Some Institutions should earn extra Prestige only when their purpose is genuinely relevant—for example a famine-response Institution should not gain crisis Prestige in a Generation with no famine. This deliberately creates a “solution owner may benefit from the problem” tension.

<a id="mor-2-18"></a>
## MOR-2.18 — Knowledge

A scholarly Institution may generate **Knowledge**, intended as a tightly limited wild resource. Possible uses include limited substitution for Influence, Wealth requirements or Prestige conversion. Exact implementation remains unfinished.

<a id="mor-2-19"></a>
## MOR-2.19 — Population

Population measures Morneval's size. Larger Population increases demand and economic potential but also pressure, Squalor and vulnerability to shortages/disease. Population growth is not automatic and depends particularly on Food supply.

<a id="mor-2-20"></a>
## MOR-2.20 — Squalor

**Squalor** represents crowding, inadequate infrastructure and poor urban conditions. High Squalor raises disease risk. Population growth can therefore create a negative-feedback loop through Squalor and disease.

<a id="mor-2-21"></a>
## MOR-2.21 — Order

**Order** measures civic stability and may matter to City Guard, Temple, unrest and the late-game independence struggle. It remains distinct from Squalor.

<a id="mor-2-22"></a>
## MOR-2.22 — Force

**Force** represents Morneval's ability to defend itself and project military power. It matters particularly to City Guard, raids, external threats and geopolitical development.

<a id="mor-2-23"></a>
## MOR-2.23 — City Economic Strength

Morneval has a city-level economic condition distinct from individual Family Wealth. It can become a scoring input for Institutions such as Merchant Guild. Automatic update rules remain unfinished.

<a id="mor-2-24"></a>
## MOR-2.24 — Renown

**Renown** represents Morneval's historical importance and maturity and is expected to contribute to the endgame trigger.

In the current v0.6.1 demand prototype, Renown also drives External Market demand using `ceil(Renown / 2)` for each implemented Sector. This formula is provisional. Automatic Renown growth is not yet defined; the sandbox allows manual editing.

---

<a id="mor-3"></a>
# MOR-3 — TURN / GENERATION SEQUENCE

<a id="mor-3-0"></a>
## MOR-3.0 — Generation Structure

The intended structure is:
1. **Beginning of Generation:** establish/reveal the long-term Event or context;
2. **Player Action Phase:** Families take economic, institutional and political actions;
3. **End-of-Generation Upkeep:** resolve production/demand, city and Family economy, demographics, Events, relations and aging;
4. **End-of-Generation Scoring:** resolve Prestige sources.

Exact action count, initiative, passing and action-round structure remain unfinished.

<a id="mor-3-1"></a>
# MOR-3.1 — POSSIBLE PLAYER ACTIONS

<a id="mor-3-1-1"></a>
## MOR-3.1.1 — Place a Production-Sector Stake

Pay the appropriate cost to place a new Stake in an available **Young** slot. It enters Young and adds **1 unit of potential supply** to that Sector, subject to raw-resource capacity and demand.

<a id="mor-3-1-2"></a>
## MOR-3.1.2 — Replace an Existing Stake

A Family may replace an occupied Production Stake. Replacement must cost a **premium** over filling an empty slot. Exact resource and numerical premium are unresolved, as is whether replacement inherits or resets age/seniority. The v0.6.1 diagnostic ownership edit is not a final player-action rule.

<a id="mor-3-1-3"></a>
## MOR-3.1.3 — Place / Acquire a Raw-Resource Stake

Take control of an available resource-producing land position. Each raw-resource location has one persistent Stake slot. Productive ownership may generate Prestige when its output is actually used.

<a id="mor-3-1-4"></a>
## MOR-3.1.4 — Develop a Production Sector

Advance a Sector by one tier. The acting Family pays the tier's Influence cost, gains Prestige, adds **1 Young + 1 Mature + 1 Elder slot**, and may place a new Young Stake immediately while paying its normal cost. Tier development alone does not create production; additional occupied Stakes and raw-resource capacity are required. Exact costs/thresholds/rewards remain provisional.

<a id="mor-3-1-5"></a>
## MOR-3.1.5 — Place an Agent in an Institution

Establish Family presence inside an Institution where permitted. Agents provide persistent benefits but increase Wealth-maintenance burden.

<a id="mor-3-1-6"></a>
## MOR-3.1.6 — Develop an Institution

Spend Influence to develop Morneval institutionally. The acting Family gains Prestige, places an Agent and may choose a branch/Minor Institution, potentially locking alternatives. Under the current provisional v0.6.1 cap, total Institution levels may not be increased above Population.

<a id="mor-3-1-7"></a>
## MOR-3.1.7 — Use a Minor Institution

A Family with appropriate access may use a Minor Institution's special action. Exact costs/frequency should be specified by the Institution and are not yet fully consolidated.

<a id="mor-3-1-8"></a>
## MOR-3.1.8 — Assassination

Assassination is a **Minor Institution action**, not a standard basic action. Possible targets may include Stakes, Agents and Family members. Family-member assassination should be hardest and include uncertainty. After a Family member is assassinated, bodyguard protection prevents repeated character losses within the relevant protection period. Exact probabilities remain unfinished.

<a id="mor-3-1-9"></a>
## MOR-3.1.9 — Initiate a Vote

A player may initiate a political Vote where permitted. Influence of the result belongs to the Vote procedure itself rather than being a separate generic action. Votes are a primary mechanism for changing City Inclination and political direction.

<a id="mor-3-2"></a>
# MOR-3.2 — END-OF-GENERATION UPKEEP

<a id="mor-3-2-1"></a>
## MOR-3.2.1 — Resolve Supply and Demand

For each Production Sector:
1. count occupied Production Stakes;
2. determine relevant raw-resource capacity;
3. calculate **available supply = min(occupied Production Stakes, raw-resource capacity)**;
4. determine Population, Institution and External Market demand;
5. allocate supply according to City Inclination and the category tie-breaker.

Each Production Stake can satisfy at most **1 need**. Current v0.6.1 demand quantities use the provisional scalable formulas in MOR-2.12.

<a id="mor-3-2-2"></a>
## MOR-3.2.2 — Determine Which Stakes Are Served

After demand allocation determines how many units are actually served, assign those units to Stakes by seniority: **Elder > Mature > Young**, then earliest placement.

Each served Stake is paired with the customer category receiving its unit. Current provisional Wealth: Population **0**, Institutions **1**, External Markets **2**. Junior/unserved Stakes generate no Wealth that Generation.

<a id="mor-3-2-3"></a>
## MOR-3.2.3 — Resolve Raw-Resource Usage

Track how much raw-resource capacity is actually consumed by each Sector. Raw-resource capacity caps productive supply. Only lands with **used capacity > 0** count as productive for land Prestige; unused potential capacity does not score.

<a id="mor-3-2-4"></a>
## MOR-3.2.4 — Resolve Population Needs and Growth

### Current v0.6.1 balancing rule — provisional
For Food:
- if Population > 0, Food Population demand > 0 and **all Food Population demand is met**, Population **+1**;
- if **any Food Population demand is unmet**, Population **-1** through famine.

The Hospice is intended to prevent **1 Population loss from famine** when applicable; its final digital integration remains part of the Institution implementation.

<a id="mor-3-2-5"></a>
## MOR-3.2.5 — Update Squalor

### Current v0.6.1 balancing rule — provisional
After Population growth/famine:

**Base Squalor target = ceil(current Population / 3)**

If any Food Population demand was unmet, target **+1**. Squalor moves by at most **1 point per Generation** toward the target. These values are playtest parameters.

<a id="mor-3-2-6"></a>
## MOR-3.2.6 — Resolve Disease

Disease risk depends on Squalor and currently causes **1 Population loss** if triggered. Disease does not persist across Generations.

### Current v0.6.1 balancing table — provisional
| Squalor | Disease chance |
|---:|---:|
| 0 | 0% |
| 1 | 0% |
| 2 | 5% |
| 3 | 10% |
| 4 | 20% |
| 5 | 35% |
| 6+ | 50% |

The sandbox uses deterministic seeded pseudo-randomness for repeatable testing; this is not a tabletop rule. The College of Medicine is intended to modify disease probability; final modifiers remain unfinished.

<a id="mor-3-2-7"></a>
## MOR-3.2.7 — Update Order and Other City Characteristics

Apply changes to Order, Force, Economic Strength and other city parameters when caused by Institutions, Events, shortages or political/external effects. General automatic growth/update formulas for these tracks are not yet defined in v0.6.1.

<a id="mor-3-2-8"></a>
## MOR-3.2.8 — Resolve External Relations

Recalculate relationships with External Powers from Morneval's actual behavior and development. For example, large-scale forest exploitation can damage Elven relations. Relationship tally is principally end-of-Generation.

<a id="mor-3-2-9"></a>
## MOR-3.2.9 — Resolve the Generation Event

Evaluate the Event/context established at Generation start. It may modify the city, External Powers, relationships, Prestige or other end-of-Generation outcomes.

<a id="mor-3-2-10"></a>
## MOR-3.2.10 — Calculate Family Wealth

For each Family total Wealth generated by served Production Stakes, compare it with maintenance obligations and reduce unsupported commitments if necessary. Current provisional v0.6.1 Stake Wealth depends on customer category: Population **0**, Institutions **1**, External Markets **2**. Unused Wealth disappears and is not banked.

<a id="mor-3-2-11"></a>
## MOR-3.2.11 — Erode Influence

Each Family loses **2 Influence** at Generation end, subject to the eventual finalized Influence-cap rules.

<a id="mor-3-2-12"></a>
## MOR-3.2.12 — Age Production-Sector Stakes

Remove Elder Production Stakes; Mature become Elder; Young become Mature. Raw-resource Stakes do not age. Age-specific capacity is checked against the Sector tier.

<a id="mor-3-2-13"></a>
## MOR-3.2.13 — Age Family Members

The Elder leaves, Mature becomes Elder, Young becomes Mature and a new Young character enters.

<a id="mor-3-3"></a>
# MOR-3.3 — END-OF-GENERATION SCORING

<a id="mor-3-3-1"></a>
## MOR-3.3.1 — Institution Scoring

Institutions are intended to score from different combinations of city characteristics rather than using one universal formula. Examples: Merchant Guild primarily values economic prosperity; City Guard values Force/Order; Temple values Population/Order. Exact matrix remains unfinished.

<a id="mor-3-3-2"></a>
## MOR-3.3.2 — City Inclination and Institution Scoring

City Inclination can modify the value of Institutions, creating synergy between institutional investment and political direction.

<a id="mor-3-3-3"></a>
## MOR-3.3.3 — Conditional Institution Prestige

Crisis-response Institutions may earn additional Prestige only when the relevant crisis actually occurs, preserving the intended “pyromaniac fireman” tension.

<a id="mor-3-3-4"></a>
## MOR-3.3.4 — Productive Land Prestige

A Family gains **1 Prestige per controlled raw-resource land whose production was actually used during the Generation**. A land scores if its used capacity is greater than 0; unused land/potential capacity does not. In the digital prototype, previews may show prospective awards, but cumulative Prestige is applied only when the Generation advances.

<a id="mor-3-3-5"></a>
## MOR-3.3.5 — Elder Character Scoring

Each Elder may provide a Family-specific Prestige condition. The complete character set is unfinished.

<a id="mor-3-3-6"></a>
## MOR-3.3.6 — Event Scoring

Generation Events may impose special scoring conditions visible early enough for players to adapt strategically.

<a id="mor-3-3-7"></a>
## MOR-3.3.7 — Immediate Development Prestige

Production-Sector and Institution development may award Prestige immediately during the Action Phase; those points remain part of cumulative Prestige.

---

<a id="mor-4"></a>
# MOR-4 — OTHER SYSTEMS

<a id="mor-4-1"></a>
## MOR-4.1 — External Powers

External Powers create differentiated opportunities/threats and should care about different aspects of Morneval. Friendly relations open benefits; hostility creates costs or threats; city development itself changes relations. Morneval should not be able to satisfy every power simultaneously.

<a id="mor-4-2"></a>
## MOR-4.2 — Elves

Elves are associated with nature, low-impact development, Magic and selected raw resources. Deforestation/destructive exploitation damages relations. Good relations should help make a lower-production/magical path viable. Exact modifiers remain unfinished.

<a id="mor-4-3"></a>
## MOR-4.3 — Gnomes

Gnomes replaced the earlier Dwarf concept. They are associated with engineering, trade, productivity and technology. Good relations may improve economic efficiency/trade; hostility may disrupt or close trade routes.

<a id="mor-4-4"></a>
## MOR-4.4 — Orcs

Hostile Orcs raid, pillage and threaten surrounding land. Full alliance may not be appropriate; neutrality may be the best stable relationship. Neutral Orcs may provide a limited trade outlet.

<a id="mor-4-5"></a>
## MOR-4.5 — Mainland / Maritime Power

The Mainland is a distant political/trading power accessed primarily by maritime routes. It may value Morneval's raw materials and external trade while becoming less comfortable with Morneval's autonomy as the city grows. It becomes central to the endgame.

<a id="mor-4-6"></a>
## MOR-4.6 — External Powers and Production

Different External Powers should value different Production Sectors, making diplomacy change the viability of economic paths rather than simply adding generic trade income.

<a id="mor-4-7"></a>
## MOR-4.7 — External Events

At Generation start an Event establishes a long-term historical context—e.g. regime change, migration, climatic change, epidemic or geopolitical shift. Players adapt during the Generation and consequences resolve at Generation end. A campaign mode could use scripted Event sequences.

<a id="mor-4-8"></a>
## MOR-4.8 — Voting and Politics

Voting is a primary mechanism for collectively steering Morneval. Votes can change City Inclination and therefore demand priorities, Institution value, economic incentives and future development. Influencing a Vote belongs to the Vote process rather than being a separate basic action.

<a id="mor-4-9"></a>
## MOR-4.9 — Assassination and Political Violence

Assassination belongs to the Institution system. Stakes should be relatively vulnerable, Agents more consequential, Family members hardest to kill. Character assassination includes uncertainty and bodyguard protection prevents repeated character losses from crippling one Family.

<a id="mor-4-10"></a>
## MOR-4.10 — Endgame

The game should not simply end after an arbitrary fixed number of Generations. Once Morneval reaches sufficient historical maturity—**Renown** being part of the trigger—a final window of roughly **2–3 Generations** is intended to open. Exact trigger/timing remain provisional.

Three political outcomes:
1. **Remain with the Mainland** — safest/easiest path;
2. **Reject the Mainland under Foreign Protection** — autonomy backed by another External Power;
3. **Full Independence** — independence from both Mainland and foreign patrons; intended to be hardest.

<a id="mor-4-11"></a>
## MOR-4.11 — Secret Endgame Allegiance

Players secretly commit to one political ending and gain bonus Prestige if it occurs. Rewards need not be equal; Full Independence should pay most because it is hardest. This creates asymmetric risk: a leader may prefer a safe ending while a trailing Family gambles on a harder outcome.

<a id="mor-4-12"></a>
## MOR-4.12 — Squalor, Unrest and Independence

During the final struggle, Squalor and Unrest should increasingly favor independence. A stable prosperous city may tolerate the existing order; an unstable city may become revolutionary. Exact mechanism remains unfinished.

<a id="mor-4-13"></a>
## MOR-4.13 — Important Design Tensions

- **Shared city vs personal advantage:** everyone needs Morneval, but Families benefit differently.
- **Supply vs scarcity:** production supports the city while scarcity can make certain markets more lucrative.
- **Stability vs opportunity:** crises are harmful but may create scoring opportunities for Institutions positioned to solve them.
- **Long-term investment vs turnover:** Agents/raw-resource Stakes persist while Production Stakes age out.
- **Politics vs economy:** Inclination changes who receives scarce goods and thus can change Wealth.
- **Growth vs sustainability:** Population expands opportunity and pressure simultaneously.
- **Foreign friendship vs autonomy:** diplomacy grants benefits but may compromise independence.

<a id="mor-4-14"></a>
## MOR-4.14 — Provisional vs Locked

### Locked structural rules reflected in v0.6.1
- each Sector level provides **1 Young + 1 Mature + 1 Elder Production-Stake slot**;
- each Production Stake represents exactly **1 unit of potential supply** and can satisfy exactly **1 need**;
- Sector tier creates Stake capacity, not output;
- actual supply is capped by occupied Stakes and raw-resource capacity;
- productive raw-resource land scores **1 Prestige** only when its production is actually used;
- older Stakes receive service before younger Stakes, with earlier placement breaking same-age ties.

### Current balancing values/mechanisms — provisional
- Stake placement/replacement costs and replacement payment resource;
- Sector development costs, thresholds and Prestige rewards;
- Agent maintenance curve and maximum Influence;
- Institution development costs/scoring;
- scalable-demand divisors;
- Wealth values by demand category;
- Institution-development Population cap;
- Population growth/famine values;
- Squalor target and movement rate;
- disease table/loss and College of Medicine values;
- any scarcity/Elder profitability bonus;
- External Power thresholds/trade modifiers;
- Event values;
- assassination probabilities;
- Knowledge limits/uses;
- Renown growth/endgame threshold;
- endgame length and ending Prestige bonuses.

<a id="mor-4-15"></a>
## MOR-4.15 — Systems Still Requiring Design Completion

- **Character roster:** complete Young/Mature/Elder character set.
- **Voting:** final procedure and vote-resolution mechanics.
- **Institution tree:** definitive branches/Minor Institutions.
- **Institution scoring:** exact asymmetric formulas.
- **Institution capacity consequences:** final treatment if Population falls below developed levels.
- **Stake replacement:** payment resource/premium and whether replacement preserves age/seniority.
- **Automatic city-track development:** Renown, Order, Force and Economic Strength update rules.
- **External Power tables:** exact benefits, penalties and relationship thresholds.
- **Endgame thresholds:** exact trigger and final-window timing.
- **Action structure:** number of actions, player order, passing and action-round structure.

<a id="mor-4-16"></a>
## MOR-4.16 — Core Design Identity

Morneval is not a set of parallel individual engines. Families invest in the same Production Sectors and Institutions; Inclination changes allocation; allocation changes Wealth; Population and shortages change Squalor and stability; Institutions and External Powers react to city conditions; and accumulated development ultimately produces the political endgame.

The winner is the Family that best converts several centuries of Morneval's shared history into **Prestige**.
