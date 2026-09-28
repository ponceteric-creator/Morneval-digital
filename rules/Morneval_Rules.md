# Morneval — Indexed Rules Reference

**Rules version:** 0.6  
**Prototype alignment:** v0.8.4  
**Status:** Consolidated design reference

This is the master rules source for **Morneval**. It distinguishes **locked structural rules**, **current prototype rules / balancing values**, and **systems still requiring design completion**. Numerical sandbox values remain provisional unless explicitly marked as locked.

For the detailed economic-development implementation used by the current digital prototype, see [`Appendix_B_Economic_Development.md`](./Appendix_B_Economic_Development.md).

**Rules v0.6 update:** consolidates the v0.8.4 economic model: Production Sectors as refinement, permanent Family base Wealth, hidden Hinterland exploration, Farms and direct Raw Food subsistence, Imperial obligations, removal of Institution production demand, permanent urban expansion, overcrowding-driven Squalor, and the Population-based Renown cap.

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
- [MOR-2.3 — Family Members](#mor-2-3)
- [MOR-2.4 — Prestige](#mor-2-4)
- [MOR-2.5 — Influence](#mor-2-5)
- [MOR-2.6 — Wealth](#mor-2-6)
- [MOR-2.7 — Agents](#mor-2-7)
- [MOR-2.8 — Production Stakes](#mor-2-8)
- [MOR-2.9 — Hinterland, Exploration & Raw Resources](#mor-2-9)
- [MOR-2.10 — Production Sectors](#mor-2-10)
- [MOR-2.11 — Production Rewards](#mor-2-11)
- [MOR-2.12 — Demand](#mor-2-12)
- [MOR-2.13 — City Inclination](#mor-2-13)
- [MOR-2.14 — Inclination and Demand Priority](#mor-2-14)
- [MOR-2.15 — Institutions](#mor-2-15)
- [MOR-2.16 — Developing Institutions](#mor-2-16)
- [MOR-2.17 — Conditional Institution Benefits](#mor-2-17)
- [MOR-2.18 — Knowledge](#mor-2-18)
- [MOR-2.19 — Population & Raw Food](#mor-2-19)
- [MOR-2.20 — Urban Capacity & Squalor](#mor-2-20)
- [MOR-2.21 — Order](#mor-2-21)
- [MOR-2.22 — Force](#mor-2-22)
- [MOR-2.23 — City Economic Strength](#mor-2-23)
- [MOR-2.24 — Renown](#mor-2-24)
- [MOR-2.25 — Intrigue Cards](#mor-2-25)
- [MOR-2.26 — Empire & Imperial Obligations](#mor-2-26)

### [MOR-3 — Turn / Generation Sequence](#mor-3)
- [MOR-3.0 — Generation Structure](#mor-3-0)
  - [MOR-3.0.1 — First Player and Turn Order](#mor-3-0-1)
  - [MOR-3.0.2 — Beginning-of-Generation Intrigue Acquisition](#mor-3-0-2)
- [MOR-3.1 — Possible Player Actions](#mor-3-1)
  - [MOR-3.1.1 — Bid for / Place a Production-Sector Stake](#mor-3-1-1)
  - [MOR-3.1.2 — Replace an Existing Stake](#mor-3-1-2)
  - [MOR-3.1.3 — Explore a Hinterland Territory](#mor-3-1-3)
  - [MOR-3.1.4 — Convert Land to a Farm](#mor-3-1-4)
  - [MOR-3.1.5 — Develop a Production Sector](#mor-3-1-5)
  - [MOR-3.1.6 — Place an Agent](#mor-3-1-6)
  - [MOR-3.1.7 — Develop an Institution](#mor-3-1-7)
  - [MOR-3.1.8 — Use a Minor Institution](#mor-3-1-8)
  - [MOR-3.1.9 — Assassination](#mor-3-1-9)
  - [MOR-3.1.10 — Initiate a Vote](#mor-3-1-10)
- [MOR-3.2 — End-of-Generation Upkeep](#mor-3-2)
  - [MOR-3.2.0 — Resolve Pending Stake Auctions](#mor-3-2-0)
  - [MOR-3.2.1 — Resolve Raw Food Subsistence](#mor-3-2-1)
  - [MOR-3.2.2 — Resolve Refined Production and Demand](#mor-3-2-2)
  - [MOR-3.2.3 — Resolve Imperial Obligations](#mor-3-2-3)
  - [MOR-3.2.4 — Resolve Population Growth](#mor-3-2-4)
  - [MOR-3.2.5 — Update Squalor](#mor-3-2-5)
  - [MOR-3.2.6 — Resolve Disease](#mor-3-2-6)
  - [MOR-3.2.7 — Expand the City](#mor-3-2-7)
  - [MOR-3.2.8 — Update Renown and Other City Characteristics](#mor-3-2-8)
  - [MOR-3.2.9 — Resolve External Relations](#mor-3-2-9)
  - [MOR-3.2.10 — Resolve the Generation Event](#mor-3-2-10)
  - [MOR-3.2.11 — Calculate Family Wealth](#mor-3-2-11)
  - [MOR-3.2.12 — Erode Influence and Determine Next First Player](#mor-3-2-12)
  - [MOR-3.2.13 — Age Production-Sector Stakes](#mor-3-2-13)
  - [MOR-3.2.14 — Age Family Members](#mor-3-2-14)
- [MOR-3.3 — End-of-Generation Scoring](#mor-3-3)
  - [MOR-3.3.1 — Institution Scoring](#mor-3-3-1)
  - [MOR-3.3.2 — City Inclination and Institution Scoring](#mor-3-3-2)
  - [MOR-3.3.3 — Conditional Institution Prestige](#mor-3-3-3)
  - [MOR-3.3.4 — City-Demand Prestige](#mor-3-3-4)
  - [MOR-3.3.5 — Productive Hinterland Prestige](#mor-3-3-5)
  - [MOR-3.3.6 — Imperial Penalties](#mor-3-3-6)
  - [MOR-3.3.7 — Elder Character Scoring](#mor-3-3-7)
  - [MOR-3.3.8 — Event Scoring](#mor-3-3-8)
  - [MOR-3.3.9 — Immediate Development Prestige](#mor-3-3-9)
- [MOR-3.4 — End-of-Generation Intrigue Cleanup](#mor-3-4)

### [MOR-4 — Other Systems](#mor-4)
- [MOR-4.1 — External Powers](#mor-4-1)
- [MOR-4.2 — Elves](#mor-4-2)
- [MOR-4.3 — Gnomes](#mor-4-3)
- [MOR-4.4 — Orcs](#mor-4-4)
- [MOR-4.5 — Empire / Mainland Terminology](#mor-4-5)
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
- [MOR-4.17 — Intrigue Themes and Generic Contributions](#mor-4-17)

---

<a id="mor-1"></a>
# MOR-1 — OVERVIEW OF THE GAME

<a id="mor-1-1"></a>
## MOR-1.1 — Core Premise

**Morneval** is a competitive city-building and political board game set in a medieval-fantasy world. Each player controls a powerful **Family** influencing the development of the same city over centuries. Morneval begins as a small coastal outpost and develops economically, politically, institutionally and territorially.

Players do not build separate cities. They compete inside the same evolving city and share the consequences of its success or failure.

<a id="mor-1-2"></a>
## MOR-1.2 — Player Objective

The primary victory-point measure is **Prestige**. Prestige can come from Production-Sector development, productive Hinterland, satisfying City demand, Institution scoring, characters, Events and the final political destiny of Morneval. Prestige can also be lost through collective failures such as relying on Imperial Food aid or failing Imperial production obligations.

The Family with the greatest Prestige at game end wins.

<a id="mor-1-3"></a>
## MOR-1.3 — Generational Scale

One Generation represents approximately **20 years**. Characters, Stakes, demographics, economic positions and political conditions therefore evolve on a generational rather than annual timescale.

<a id="mor-1-4"></a>
## MOR-1.4 — Shared-City Tension

Morneval is both a shared engine and the principal competitive arena. Families benefit from the same city but do not benefit equally from each decision. Players may profit from external commerce while leaving civic or Imperial needs unresolved, but collective failures can impose Prestige penalties on everyone.

Growth is also physically costly: a larger Morneval consumes its own Hinterland, progressively destroying productive territory.

---

<a id="mor-2"></a>
# MOR-2 — GAME CONCEPTS & TERMINOLOGY

<a id="mor-2-1"></a>
## MOR-2.1 — Generation

A **Generation** is the fundamental turn. Broadly: establish the generational context, acquire Intrigue opportunities, take player actions, resolve subsistence and refined production, apply city upkeep and Imperial obligations, score Prestige, clean up Intrigue and age generational elements.

<a id="mor-2-2"></a>
## MOR-2.2 — Families

Each player represents a dynasty or **Family**. Family presence persists through characters, Production Stakes, Hinterland ownership, Agents, accumulated Influence, Wealth capacity and political positioning.

<a id="mor-2-3"></a>
## MOR-2.3 — Family Members and the Three-Generation Window

Each Family maintains three important members simultaneously:
- **Young** — usually a simple bonus or modifier;
- **Mature** — usually a special action or active power;
- **Elder** — usually a Prestige-scoring condition.

All three are active. At Generation end, the Elder leaves, Mature becomes Elder, Young becomes Mature and a new Young member enters. The complete character roster remains unfinished.

<a id="mor-2-4"></a>
## MOR-2.4 — Prestige

**Prestige** is the primary victory-point measure. It normally accumulates rather than being spent.

Prestige can also be lost. Current v0.8.4 collective penalties always have a floor of **0 Prestige**; a Family never goes below 0 from these penalties.

Stake replacement remains unresolved because the replacement premium was previously discussed as a possible Prestige cost while the core Prestige model normally treats Prestige as cumulative.

<a id="mor-2-5"></a>
## MOR-2.5 — Influence

**Influence** is a stored and spendable Family resource used for investment, development and politics. Influence is capped and erodes at Generation end.

**Locked initiative rule:** after Generation spending and after Influence erosion, the Family with the most remaining Influence becomes First Player for the next Generation. Ties are broken by:
1. Prestige;
2. Wealth generated during that Generation;
3. random selection if still tied.

### Current automated-test income — provisional
The v0.8.4 sandbox gives each Family **+5 gross Influence** before actions and applies the established **−2 Influence erosion** during upkeep. The maximum Influence cap and +5 gross income remain prototype values.

<a id="mor-2-6"></a>
## MOR-2.6 — Wealth

**Wealth is capacity, not a banked resource.** Wealth available during a Generation can support development, exploration, Farms, Agents and other commitments. Unused Wealth does not accumulate into later Generations.

### Current v0.8.4 rule
Every Family has a permanent **base Wealth capacity of 1** each Generation, representing the independent economic resources of the dynasty.

Serving **External Market demand** generates **+1 Wealth capacity per need served** for the serving Production Stake's Family. This is added to the Family's base Wealth for that Generation.

<a id="mor-2-7"></a>
## MOR-2.7 — Agents

**Agents** represent persistent Family presence inside Institutions. They are not workers recalled each turn. Agents provide passive benefits and/or access to Minor Institutions and may create scoring opportunities. Maintaining many Agents should become progressively more expensive through an escalating Wealth-maintenance curve.

Agents also generate **Intrigue opportunities**. At the beginning of each Generation, every Agent allows its Family to keep one card from that Agent's Institution-specific Intrigue deck. Agent seniority determines selection quality:
- seniority 1: draw 1, keep 1;
- seniority 2: draw 2, keep 1;
- seniority 3: draw 3, keep 1.

The draw/keep structure is locked. Exact Agent progression remains unfinished.

<a id="mor-2-8"></a>
## MOR-2.8 — Production Stakes

A Production Stake represents a Family's participation or privileged position inside a refined Production Sector.

### Locked structure
Production Stakes have three ages: **Young, Mature, Elder**. Each Sector tier provides:
- 1 Young slot per tier;
- 1 Mature slot per tier;
- 1 Elder slot per tier.

Therefore a Tier N Sector can contain up to **3 × N Stakes**. New ordinary Stakes enter as Young. At Generation end Elder Stakes leave, Mature become Elder, and Young become Mature.

Each occupied Production Stake represents exactly **1 unit of potential refined production** and can satisfy at most **1 need**, subject to sufficient raw input.

An empty Young slot is acquired through sequential Influence bidding. An occupied Stake may eventually be replaceable at a premium; exact replacement rules remain unresolved.

<a id="mor-2-9"></a>
## MOR-2.9 — Hinterland, Exploration & Raw Resources

The current map abstraction contains **13 spaces**:
- 1 original Morneval city space;
- 12 surrounding Hinterland spaces.

At setup, all 12 Hinterland spaces are **unexplored**. Their hidden terrain pool contains exactly:
- 4 Forests;
- 4 Meadows;
- 4 Hills.

Exploration randomly reveals one terrain from the remaining finite pool. The exploring Family immediately controls that territory and its **exploration order** is recorded.

### Current v0.8.4 capacity
A newly revealed natural territory has **2 raw-resource capacity**. A later development system may raise an individual territory to capacity 3.

Natural terrain produces:
- Meadow → **Wool**;
- Hill → **Ore**;
- Forest → **Wood**.

A controlled natural territory may be converted to a Farm, replacing its natural resource with Raw Food production.

There is **no free city-adjacent raw-resource production** in the v0.8.4 economy.

<a id="mor-2-10"></a>
## MOR-2.10 — Production Sectors

Production Sectors represent **refinement / finished production**, not raw extraction.

Current Sectors:
- **Refined Food** — uses agricultural surplus after Population subsistence;
- **Textiles** — uses Wool;
- **Smithing** — uses Ore;
- **Construction Materials** — uses Wood.

### Locked structural principle
Sector tier creates **Stake capacity**, not output by itself. Each tier adds 1 Young + 1 Mature + 1 Elder slot.

### Current development project — provisional balance values
To advance a Sector from Tier I → II or Tier II → III, complete three successive development phases. Different Families may fund successive phases, but a given Sector can advance at most **one phase per Generation**.

| Phase | Influence | Wealth capacity | Prestige to contributor |
|---:|---:|---:|---:|
| 1 | 1 | 1 | 5 |
| 2 | 0 | 2 | 5 |
| 3 | 0 | 2 | 5 |

After Phase 3, the new Tier activates. The 5-Prestige reward and costs remain balancing values.

<a id="mor-2-11"></a>
## MOR-2.11 — Production Rewards

For refined Production Sectors, each served Production Stake is paired with the demand category receiving that unit.

Current direct rewards:
- **City demand:** +1 Prestige to the serving Stake owner, 0 Wealth;
- **External Market demand:** +1 Wealth capacity to the serving Stake owner, 0 direct Prestige;
- **Imperial demand:** no direct reward.

Imperial demand instead creates a collective penalty when left unmet.

If not every Stake can produce, Stake seniority determines which Stakes receive service: **Elder > Mature > Young**, then earlier placement among Stakes of the same age.

<a id="mor-2-12"></a>
## MOR-2.12 — Demand

Institution demand has been **removed** from the production economy.

### Refined Food
Refined Food has:
- City demand;
- External Market demand;
- **no Imperial demand**.

### Textiles, Smithing and Construction Materials
Each has:
- City demand;
- **Imperial demand permanently equal to 1**;
- External Market demand.

### Current scalable-demand formulas — provisional
The v0.8.4 sandbox currently uses:

| Sector | City demand | Imperial demand | External demand |
|---|---:|---:|---:|
| Refined Food | `ceil(Population / 2)` | 0 | `ceil(Renown / 2)` |
| Textiles | `ceil(Population / 6)` | 1 | `ceil(Renown / 2)` |
| Smithing | `ceil(Population / 6)` | 1 | `ceil(Renown / 2)` |
| Construction Materials | `ceil(Population / 6)` | 1 | `ceil(Renown / 2)` |

These divisors are current playtest values, not locked final numbers.

<a id="mor-2-13"></a>
## MOR-2.13 — City Inclination

Morneval's political/cultural Inclination uses two opposed axes:
- **Arcane / Academic ↔ Religion / Temple**;
- **Military ↔ Commercial / Mercantile**.

The city may be Neutral, Level I, Level II or hybrid across axes. Pure Level II positions should be powerful but carry meaningful danger or drawback.

<a id="mor-2-14"></a>
## MOR-2.14 — Inclination and Demand Priority

As of v0.8.4, **only the Military ↔ Commercial axis affects production allocation**. The Arcane/Academic ↔ Religion axis has no current production-allocation effect and is reserved for institutional/political systems.

Current priority order:
- **Military:** City → Imperial → External;
- **Commercial / Mercantile:** External → Imperial → City;
- **Neutral:** Imperial → City → External.

Refined Food has no Imperial demand, so that step is skipped for that Sector.

<a id="mor-2-15"></a>
## MOR-2.15 — Institutions

Institutions are permanent civic, religious, military, economic, medical or scholarly structures. Families embed Agents within them. Institutions may grant passive benefits, access to Minor Institutions/actions, Intrigue opportunities and Prestige opportunities.

Examples discussed include Merchant Guild, City Guard, Temple, Hospice, College of Medicine and scholarly Institutions.

**Important v0.8.4 correction:** Institutions no longer create a separate Production-Sector demand category.

<a id="mor-2-16"></a>
## MOR-2.16 — Developing Institutions

Institution development costs Influence, grants Prestige, places an Agent and can select/lock a development branch or Minor Institution.

The previously tested Population-based Institution cap remains provisional and is not part of the current v0.8.4 economic simulation.

<a id="mor-2-17"></a>
## MOR-2.17 — Conditional Institution Benefits

Some Institutions should earn extra Prestige only when their purpose is genuinely relevant—for example a crisis-response Institution should not gain crisis Prestige in a Generation with no relevant crisis. This preserves the intended “solution owner may benefit from the problem” tension.

<a id="mor-2-18"></a>
## MOR-2.18 — Knowledge

A scholarly Institution may generate **Knowledge**, intended as a tightly limited wild resource. Possible uses include limited substitution for Influence, Wealth requirements or Prestige conversion. Exact implementation remains unfinished.

<a id="mor-2-19"></a>
## MOR-2.19 — Population & Raw Food

Population measures Morneval's size. Population is fed directly by **Raw Food from Farms**, not by Refined Food Production Stakes.

### Current v0.8.4 subsistence rule
- each Farm produces **2 Raw Food**;
- each Population requires **1 Raw Food**;
- Raw Food is allocated to Population subsistence **before** any agricultural surplus can enter the Refined Food Sector.

Therefore one Farm supports 2 Population, two Farms support 4, three Farms support 6, etc.

If local Farms fully feed the current Population, the prototype allows Population to grow by **+1** that Generation.

If local Raw Food is insufficient, the Empire automatically provides the shortfall. There is no famine Population loss from Food shortage; instead, Imperial Food aid creates a collective Prestige penalty and prevents Food-based growth that Generation.

Current prototype Population minimum is **1**.

<a id="mor-2-20"></a>
## MOR-2.20 — Urban Capacity & Squalor

Morneval begins with **1 Urban tile** supporting **3 Population**.

**Urban capacity = Urban tiles × 3.**

Squalor represents overcrowding and degraded urban conditions. The v0.8.4 prototype ties Squalor directly to Population exceeding existing Urban capacity.

Before disease:

**Overcrowding = max(0, Population − Urban capacity).**

Current target:

**Squalor target = Overcrowding.**

Squalor moves by at most **1 point per Generation** toward its target. Expansion can remove the cause of overcrowding, but accumulated Squalor does not disappear instantly.

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

**Renown** represents Morneval's historical importance and international visibility. It is expected to contribute to the endgame trigger and currently drives External Market demand.

### Final design direction
Renown is intended to be earned principally through **Events and historical achievements**.

### Current v0.8.4 simulation rule
Until Events provide the real Renown engine:
- Morneval gains **+1 Renown every 2 Generations**;
- sustainable Renown is capped at **Population × 2**;
- External demand currently uses `ceil(Renown / 2)` per implemented Sector.

A direct Squalor-to-Renown penalty is deliberately parked until the Population-based cap has been tested further.

<a id="mor-2-25"></a>
## MOR-2.25 — Intrigue Cards

Intrigue cards represent favors, conspiracies, political connections, legal manoeuvres, commercial pressure, institutional leverage and other opportunities generated through a Family's embedded Agents.

### Locked structure
- Each major Institution has its own Intrigue deck.
- At the beginning of each Generation, each Agent generates one Intrigue opportunity from its Institution's deck.
- Agent seniority determines selection quality: 1 → draw 1/keep 1; 2 → draw 2/keep 1; 3 → draw 3/keep 1.
- Intrigue cards are held secretly.
- A card may be used for its printed effect or discarded for its Institution's generic temporary city contribution.
- Generic contributions are public, combine across Families and use diminishing-return thresholds.
- At Generation end, each Family may retain **1 Intrigue card total**; other unused cards are discarded.

The exact card lists and printed-effect costs remain unfinished.

<a id="mor-2-26"></a>
## MOR-2.26 — Empire & Imperial Obligations

The v0.8.4 economic model treats Morneval as an Imperial outpost with ongoing obligations to the Empire.

### Imperial production obligation
Textiles, Smithing and Construction Materials each have **Imperial demand = 1 every Generation**. Meeting that demand gives no direct reward.

If **any Imperial production demand remains unmet anywhere** at Generation end, every Family loses **1 Prestige**, minimum 0. The current prototype applies this as one Generation-wide penalty, not one penalty per unmet Sector.

### Imperial Food aid
If local Farms cannot feed the Population, the Empire supplies all missing Raw Food automatically. Whenever any Imperial Food aid is used:
- all Families lose **1 Prestige**, minimum 0;
- Population does not receive Food-based growth that Generation;
- no famine Population loss occurs.

The Imperial production penalty and Imperial Food-aid penalty are separate and may both apply in the same Generation.

---

<a id="mor-3"></a>
# MOR-3 — TURN / GENERATION SEQUENCE

<a id="mor-3-0"></a>
## MOR-3.0 — Generation Structure

The intended structure is:
1. **Beginning of Generation:** establish/reveal the long-term Event or context, apply start effects and resolve Intrigue acquisition;
2. **Player Action Phase:** Families bid for Stakes, explore Hinterland, convert Farms, advance Production Sectors, develop Institutions and take political/Intrigue actions;
3. **End-of-Generation Upkeep:** resolve subsistence, refined production/demand, Imperial obligations, demographics, Squalor/disease, urban growth, external relations, Wealth and Influence;
4. **End-of-Generation Scoring:** resolve Prestige sources and penalties not already applied immediately;
5. **Intrigue Cleanup:** each Family keeps at most one Intrigue card and discards the rest.

The exact general action count and full non-auction action-round structure remain unfinished.

<a id="mor-3-0-1"></a>
## MOR-3.0.1 — First Player and Turn Order

**Locked rule:** at the end of each Generation, after all spending and after Influence erosion, determine First Player for the next Generation using this hierarchy:
1. most remaining Influence;
2. if tied, most Prestige;
3. if still tied, most Wealth generated during that Generation;
4. if still tied, random selection among the remaining tied Families.

Sequential procedures begin with First Player and continue in normal seating/order around the table.

<a id="mor-3-0-2"></a>
## MOR-3.0.2 — Beginning-of-Generation Intrigue Acquisition

For each Agent, draw from the Intrigue deck of the Institution occupied by that Agent:
- Seniority 1: draw 1, keep 1;
- Seniority 2: draw 2, keep 1;
- Seniority 3: draw 3, keep 1.

Each Agent generates at most one kept Intrigue card. Seniority improves choice, not quantity.

<a id="mor-3-1"></a>
# MOR-3.1 — POSSIBLE PLAYER ACTIONS

<a id="mor-3-1-1"></a>
## MOR-3.1.1 — Bid for / Place a Production-Sector Stake

An available Young Production-Sector Stake slot is acquired through a sequential Influence auction.

### Locked bidding procedure
1. Bidding proceeds in player order, beginning with First Player.
2. On a bidding turn, a player may raise or pass.
3. A raise must establish a strictly higher total bid.
4. A player may bid repeatedly on later circuits provided they have not passed.
5. A player may never commit more Influence than they possess.
6. Influence is not spent when a bid is made; losing bidders spend nothing.
7. Passing removes that player from that auction.
8. Bidding continues until only the current highest bidder remains.
9. The winner pays the full winning bid and places a new Young Stake.

The new Stake may participate in that Generation's production resolution.

<a id="mor-3-1-2"></a>
## MOR-3.1.2 — Replace an Existing Stake

A Family may eventually replace an occupied Production Stake at a premium over filling an empty slot. Exact resource, amount and treatment of age/seniority remain unresolved.

<a id="mor-3-1-3"></a>
## MOR-3.1.3 — Explore a Hinterland Territory

### Current v0.8.4 action
A Family may explore one unrevealed Hinterland space for:
- **3 Influence**;
- **1 Wealth capacity for that Generation**.

The terrain is revealed randomly from the remaining finite pool of 4 Forests, 4 Meadows and 4 Hills. The exploring Family immediately controls the territory. Its exploration order is recorded.

Each newly revealed natural territory currently has capacity 2.

<a id="mor-3-1-4"></a>
## MOR-3.1.4 — Convert Land to a Farm

A Family may convert a revealed natural territory it controls into a Farm.

### Current v0.8.4 cost
- **2 Influence**;
- **1 Wealth capacity for that Generation**.

The territory stops producing its original resource and produces Raw Food instead. Its original terrain remains recorded for future environmental, Event and External-Power consequences.

<a id="mor-3-1-5"></a>
## MOR-3.1.5 — Develop a Production Sector

A Production Sector advances through the three-phase project described in MOR-2.10. Different Families may fund successive phases, but the same Sector advances at most one phase per Generation. Tier activation occurs after Phase 3.

<a id="mor-3-1-6"></a>
## MOR-3.1.6 — Place an Agent in an Institution

Establish Family presence inside an Institution where permitted. Agents provide persistent benefits, Intrigue opportunities and Wealth-maintenance burden.

<a id="mor-3-1-7"></a>
## MOR-3.1.7 — Develop an Institution

Spend Influence to develop Morneval institutionally. The acting Family gains Prestige, places an Agent and may choose a branch/Minor Institution. Exact costs and constraints remain to be finalized.

<a id="mor-3-1-8"></a>
## MOR-3.1.8 — Use a Minor Institution

A Family with appropriate access may use a Minor Institution's special action. Exact costs/frequency are defined by that Institution and remain incomplete.

<a id="mor-3-1-9"></a>
## MOR-3.1.9 — Assassination

Assassination is a **Minor Institution action**, not a standard basic action. Possible targets may include Stakes, Agents and Family members. Family-member assassination should be hardest and include uncertainty. After a Family member is assassinated, bodyguard protection prevents repeated character losses within the relevant protection period. Exact probabilities remain unfinished.

<a id="mor-3-1-10"></a>
## MOR-3.1.10 — Initiate a Vote

A player may initiate a political Vote where permitted. Votes are a primary mechanism for changing City Inclination and political direction. Influencing the result belongs to the Vote procedure rather than being a separate generic action.

<a id="mor-3-2"></a>
# MOR-3.2 — END-OF-GENERATION UPKEEP

<a id="mor-3-2-0"></a>
## MOR-3.2.0 — Resolve Pending Stake Auctions

Resolve completed auctions before refined production:
- highest remaining bidder wins;
- only the winner pays;
- winner pays the full winning bid;
- losing bids cost 0 Influence;
- winning Stake enters as Young and can participate immediately.

<a id="mor-3-2-1"></a>
## MOR-3.2.1 — Resolve Raw Food Subsistence

Before agricultural surplus can enter Refined Food production:
1. total Raw Food from controlled Farms;
2. each Population requires 1 Raw Food;
3. allocate local Farm output to Population first;
4. any remaining Farm output is surplus available as Refined Food raw input;
5. if local Raw Food is insufficient, the Empire supplies the entire shortfall.

Each Farm currently produces 2 Raw Food.

<a id="mor-3-2-2"></a>
## MOR-3.2.2 — Resolve Refined Production and Demand

For each Production Sector:
1. count occupied Production Stakes;
2. determine usable relevant raw input;
3. available refined supply = min(occupied Stake supply, usable raw input);
4. determine current City, Imperial and External demand as applicable;
5. allocate scarce refined supply according to City Inclination priority;
6. assign served units to Stakes by seniority: Elder > Mature > Young, then earlier placement.

Each Stake can satisfy at most one need.

For Refined Food, usable raw input is only **agricultural surplus remaining after Population subsistence**.

<a id="mor-3-2-3"></a>
## MOR-3.2.3 — Resolve Imperial Obligations

After production allocation:
- if any Imperial production demand remains unmet in Textiles, Smithing or Construction Materials, every Family loses 1 Prestige, minimum 0;
- if any Imperial Food aid was used, every Family separately loses 1 Prestige, minimum 0.

Both penalties may apply in the same Generation.

<a id="mor-3-2-4"></a>
## MOR-3.2.4 — Resolve Population Growth

Current prototype rule:
- if local Farms fully fed the current Population without Imperial Food aid, Population grows by **+1**;
- if Imperial Food aid was required, Population does not grow from Food;
- there is no famine Population loss from Food shortage;
- current minimum Population is 1.

<a id="mor-3-2-5"></a>
## MOR-3.2.5 — Update Squalor

Before disease, calculate overcrowding against the city's **existing** Urban capacity:

**Overcrowding = max(0, Population − Urban capacity).**

Current v0.8.4 target:

**Squalor target = Overcrowding.**

Squalor moves by at most 1 point per Generation toward the target.

<a id="mor-3-2-6"></a>
## MOR-3.2.6 — Resolve Disease

Disease risk depends on Squalor and currently causes 1 Population loss if triggered, subject to the current minimum Population of 1.

| Squalor | Disease chance |
|---:|---:|
| 0 | 0% |
| 1 | 0% |
| 2 | 5% |
| 3 | 10% |
| 4 | 20% |
| 5 | 35% |
| 6+ | 50% |

The digital sandbox uses deterministic seeded pseudo-randomness for repeatable testing. The College of Medicine is intended to modify disease probability; final modifiers remain unfinished.

<a id="mor-3-2-7"></a>
## MOR-3.2.7 — Expand the City

After final Population is known, including disease:

**Required Urban tiles = ceil(final Population / 3), minimum 1.**

If the city needs additional Urban capacity, it permanently absorbs Hinterland until it reaches the required footprint.

### Current v0.8.4 territory order
The city absorbs the **oldest explored non-urban territory first**, using exploration order. This abstractly models the earliest explored land as the closest to the original settlement.

When a territory is absorbed:
- its Family loses control;
- no compensation is paid;
- all raw production from that territory is permanently lost;
- the territory becomes Urban permanently, even if Population later declines.

<a id="mor-3-2-8"></a>
## MOR-3.2.8 — Update Renown and Other City Characteristics

Current Renown simulation:
- +1 Renown every 2 Generations;
- after final Population, Renown cannot exceed **Population × 2**.

In the final design, Events are intended to become the real source of Renown and the temporary automatic gain should be removed.

Apply changes to Order, Force, Economic Strength and other city parameters when caused by Institutions, Events, political/external effects or Intrigue. General automatic formulas for those tracks remain unfinished.

<a id="mor-3-2-9"></a>
## MOR-3.2.9 — Resolve External Relations

Recalculate relationships with External Powers from Morneval's actual behavior and development. For example, forest clearing may damage Elven relations. Relationship tally is principally end-of-Generation.

<a id="mor-3-2-10"></a>
## MOR-3.2.10 — Resolve the Generation Event

Evaluate the Event/context established at Generation start. It may modify the city, External Powers, relationships, Prestige, Renown or other outcomes.

<a id="mor-3-2-11"></a>
## MOR-3.2.11 — Calculate Family Wealth

For each Family:
- start from permanent **base Wealth 1**;
- add +1 Wealth for each External Market need served by that Family's Production Stakes;
- compare total Wealth capacity with commitments;
- unsupported commitments must eventually be reduced according to the finalized maintenance procedure;
- unused Wealth disappears and is not banked.

<a id="mor-3-2-12"></a>
## MOR-3.2.12 — Erode Influence and Determine Next First Player

Each Family loses 2 Influence at Generation end under the current established erosion principle.

After erosion, determine First Player by:
1. remaining Influence;
2. Prestige;
3. Wealth generated that Generation;
4. random selection.

<a id="mor-3-2-13"></a>
## MOR-3.2.13 — Age Production-Sector Stakes

Remove Elder Production Stakes; Mature become Elder; Young become Mature. Hinterland ownership does not age.

<a id="mor-3-2-14"></a>
## MOR-3.2.14 — Age Family Members

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
## MOR-3.3.4 — City-Demand Prestige

**Current rule:** whenever a Production Stake satisfies 1 City demand, the Family owning that Stake gains **1 Prestige**. Each Stake can satisfy at most one need, so a Stake can earn at most 1 direct City-demand Prestige from its one served unit in that Generation.

<a id="mor-3-3-5"></a>
## MOR-3.3.5 — Productive Hinterland Prestige

A Family gains **1 Prestige per controlled Hinterland territory whose output was actually used during the Generation**.

Current v0.8.4 digital interpretation: Farm output used directly for Population subsistence counts as productive use, as does raw input consumed by a Production Sector. This Farm-scoring interpretation remains provisional and should be monitored for over-rewarding Farms.

<a id="mor-3-3-6"></a>
## MOR-3.3.6 — Imperial Penalties

Current v0.8.4 collective penalties:
- any unmet Imperial production demand anywhere: every Family −1 Prestige, minimum 0;
- any Imperial Food aid used: every Family −1 Prestige, minimum 0.

These are separate penalties and may stack.

<a id="mor-3-3-7"></a>
## MOR-3.3.7 — Elder Character Scoring

Each Elder may provide a Family-specific Prestige condition. The complete character set is unfinished.

<a id="mor-3-3-8"></a>
## MOR-3.3.8 — Event Scoring

Generation Events may impose special scoring conditions visible early enough for players to adapt strategically.

<a id="mor-3-3-9"></a>
## MOR-3.3.9 — Immediate Development Prestige

Production-Sector and Institution development may award Prestige immediately during the Action Phase; those points remain part of cumulative Prestige.

<a id="mor-3-4"></a>
# MOR-3.4 — END-OF-GENERATION INTRIGUE CLEANUP

After upkeep and scoring, and after all valid opportunities to play or generically contribute Intrigue cards have passed:
1. each Family chooses at most **1 Intrigue card total** to retain for the next Generation;
2. all other unplayed Intrigue cards are discarded;
3. temporary generic Intrigue bonuses and contribution pools reset unless a specific card states otherwise.

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

Gnomes are associated with engineering, trade, productivity and technology. Good relations may improve economic efficiency/trade; hostility may disrupt or close trade routes.

<a id="mor-4-4"></a>
## MOR-4.4 — Orcs

Hostile Orcs raid, pillage and threaten surrounding land. Full alliance may not be appropriate; neutrality may be the best stable relationship. Neutral Orcs may provide a limited trade outlet.

<a id="mor-4-5"></a>
## MOR-4.5 — Empire / Mainland Terminology

The current v0.8.4 economy explicitly uses the **Empire** as Morneval's parent power: the Empire supplies emergency Food and imposes Imperial demand on non-Food Production Sectors.

Earlier endgame design used the term **Mainland / Maritime Power** for the parent political authority. Whether “Empire” fully replaces “Mainland” in the final setting terminology has not yet been formally consolidated. Until then, economic rules use **Empire / Imperial**, while older endgame notes may still say **Mainland**.

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

The game should not simply end after an arbitrary fixed number of Generations. Once Morneval reaches sufficient historical maturity—Renown being part of the trigger—a final window of roughly 2–3 Generations is intended to open. Exact trigger/timing remain provisional.

Three political outcomes currently envisioned:
1. remain with the parent power / Mainland;
2. reject it under Foreign Protection;
3. Full Independence.

Full Independence is intended to be hardest and may therefore offer the highest Prestige opportunity.

<a id="mor-4-11"></a>
## MOR-4.11 — Secret Endgame Allegiance

Players secretly commit to one political ending and gain bonus Prestige if it occurs. Rewards need not be equal; Full Independence should pay most because it is hardest. This creates asymmetric risk between leading and trailing Families.

<a id="mor-4-12"></a>
## MOR-4.12 — Squalor, Unrest and Independence

During the final struggle, Squalor and Unrest should increasingly favor independence. A stable prosperous city may tolerate the existing order; an unstable city may become revolutionary. Exact mechanism remains unfinished.

<a id="mor-4-13"></a>
## MOR-4.13 — Important Design Tensions

- **Shared city vs personal advantage:** everyone needs Morneval, but Families benefit differently.
- **City vs Empire vs external commerce:** civic needs, Imperial obligations and profitable external markets compete for refined output.
- **Subsistence vs refinement:** agricultural capacity must feed the Population before surplus can support Refined Food commerce.
- **Growth vs land:** Population growth increases opportunity but physically consumes productive Hinterland.
- **Exploration vs urban risk:** early exploration secures useful land but also marks that land as the first territory threatened by future city expansion.
- **Public obligation vs free-riding:** Imperial failures punish every Family, so players may hope somebody else bears the cost of compliance.
- **Stability vs opportunity:** crises are harmful but may create scoring opportunities for Institutions positioned to solve them.
- **Long-term investment vs turnover:** Hinterland and Agents persist while Production Stakes age out.
- **Politics vs economy:** Military/Commercial Inclination changes which market receives scarce refined output first.
- **Influence vs initiative:** spending heavily can win investments now but may surrender First Player next Generation.
- **Private intrigue vs public need:** Intrigue can be exploited privately or sacrificed to support Morneval.

<a id="mor-4-14"></a>
## MOR-4.14 — Provisional vs Locked

### Locked structural rules / established design decisions
- each Sector level provides 1 Young + 1 Mature + 1 Elder Production-Stake slot;
- each Production Stake represents exactly 1 unit of potential refined supply and can satisfy at most 1 need;
- Sector tier creates Stake capacity, not production by itself;
- older Stakes receive service before younger Stakes, with earlier placement breaking same-age ties;
- available Young Stakes use sequential Influence bidding and only the winner pays the full winning bid;
- Wealth is capacity rather than a stored currency;
- every Family has a permanent base Wealth of **1** in the current economic design;
- Production Sectors represent refinement, while Hinterland provides raw inputs;
- Institution production demand has been removed;
- Raw Food from Farms feeds Population before agricultural surplus enters Refined Food production;
- each Farm currently produces 2 Raw Food and each Population consumes 1;
- if local Food is insufficient, the Empire supplies the shortfall and all Families lose 1 Prestige, minimum 0;
- Refined Food has no Imperial demand;
- Textiles, Smithing and Construction Materials have Imperial demand 1;
- unmet Imperial production demand causes the current collective −1 Prestige penalty;
- City demand awards 1 Prestige; External demand awards 1 Wealth; Imperial demand gives no direct reward;
- Neutral production priority favors Imperial demand; Military favors City; Commercial favors External;
- Arcane/Academic ↔ Religion currently does not affect production allocation;
- Hinterland begins hidden with exactly 4 Forest / 4 Meadow / 4 Hill outcomes;
- exploration is random from the finite remaining terrain pool and exploration order is recorded;
- city expansion is permanent and consumes the oldest explored non-urban territory first;
- no compensation is paid when urban expansion absorbs Family land;
- after Influence erosion, First Player is determined by Influence → Prestige → Generation Wealth → random;
- Intrigue acquisition, seniority draw/keep structure and one-card retention rules described above remain established.

### Current balancing values / prototype mechanisms — provisional
- +5 gross Influence income and maximum Influence cap;
- Hinterland exploration cost **3 Influence + 1 Wealth**;
- natural territory capacity **2**, with future improvement to 3 not yet designed;
- Farm conversion cost **2 Influence + 1 Wealth**;
- Production-Sector development costs 1I+1W / 2W / 2W and +5 Prestige per phase;
- current City and External demand divisors;
- current interpretation that any unmet Imperial Sector causes one Generation-wide −1 Prestige penalty rather than a penalty per Sector;
- Population +1 when fully fed locally;
- hard Population minimum 1;
- Urban capacity 3 Population per Urban tile;
- Squalor target = overcrowding and movement rate 1;
- disease probability table and 1-Population disease loss;
- productive Farm/Hinterland Prestige interpretation;
- temporary +1 Renown every 2 Generations;
- Renown cap Population ×2;
- AI priorities, valuations and automated actions;
- Agent maintenance curve and Institution development/scoring values;
- External Power modifiers, Event values, assassination probabilities and Knowledge uses;
- exact endgame thresholds and ending Prestige bonuses.

<a id="mor-4-15"></a>
## MOR-4.15 — Systems Still Requiring Design Completion

- **Character roster:** complete Young/Mature/Elder character set.
- **Voting:** final procedure and vote-resolution mechanics.
- **Institution tree:** definitive branches/Minor Institutions and Agent progression.
- **Institution scoring:** exact asymmetric formulas.
- **Stake replacement:** payment resource/premium and treatment of age/seniority.
- **Territory development:** action/cost for improving raw capacity from 2 to 3.
- **Urban expansion as a player action:** current digital expansion is automatic; final design intends players to be forced to fund expansion to relieve Squalor.
- **Renown:** replace automatic test growth with Event-driven Renown.
- **Order, Force and Economic Strength:** final update rules.
- **External Power tables:** exact benefits, penalties and relationship thresholds.
- **Empire/Mainland nomenclature:** decide whether these are the same final setting entity and standardize terminology.
- **Endgame thresholds:** exact trigger and final-window timing.
- **Action structure:** number of non-auction actions and full passing/action-round structure.
- **Intrigue decks:** exact cards, costs, deck size/duplicates and timing windows.
- **Religious Intrigue generic effect:** the old “reduce Population Food demand” wording predates the Raw Food/Farm model and must be redesigned rather than carried forward unchanged.
- **Merchant/Arcane Intrigue scaling:** finalize diminishing-return thresholds and effects.

<a id="mor-4-16"></a>
## MOR-4.16 — Core Design Identity

Morneval is not a set of parallel individual engines. Families invest in the same Production Sectors, Hinterland and Institutions; Influence auctions determine contested refined-production positions; Inclination changes allocation; allocation changes Prestige and Wealth; Farms and exploration determine whether the city can feed itself and refine surplus; Imperial obligations create collective pressure; Population creates overcrowding; urban expansion destroys the Hinterland that sustains the economy; Institutions and External Powers react to city conditions; and accumulated development ultimately produces the political endgame.

The winner is the Family that best converts several centuries of Morneval's shared history into **Prestige**.

<a id="mor-4-17"></a>
## MOR-4.17 — Intrigue Themes and Generic Contributions

Each Institution's Intrigue deck should have a recognizable mechanical identity. Cards should primarily bend existing Morneval mechanisms rather than create a separate card-combo game.

### Merchant Intrigue
**Theme:** commercial manipulation, privileged contracts, market pressure and economic capture.

Candidate effects include hostile takeover of Production Stakes, preferential contracts, manipulation of demand allocation and reductions/modifiers to replacement costs.

**Generic contribution — established role:** temporarily increase Renown for External Market demand purposes. Exact thresholds remain provisional.

### Military Intrigue
**Theme:** coercion, legal force, requisition, protection and suppression.

**Generic contribution — locked thresholds:** public Military contributions temporarily increase Force:

| Military cards contributed | Temporary Force bonus |
|---:|---:|
| 0 | +0 |
| 1–3 | +1 |
| 4–6 | +2 |
| 7–9 | +3 |

The pattern may continue with each additional group of three cards adding another +1 Force.

### Religious Intrigue
**Theme:** legitimacy, charity, social discipline, reputation and communal mobilization.

The previously defined generic effect of reducing Population Food Demand is now **outdated by v0.8.4**, because Population subsistence is no longer a Production-Sector Food-demand category. Its replacement effect is deliberately left unresolved pending redesign around Farms / Raw Food / Imperial Food aid.

### Arcane Intrigue
**Theme:** knowledge, exceptional techniques, information and technological acceleration.

The established design role is a temporary technological/productive boost. Candidate implementation remains reducing technological/Production-Sector development cost and/or temporarily increasing Hinterland capacity. Exact effect and thresholds remain provisional.

### Public contribution principle
Generic Intrigue is not a private resource conversion. Contributed cards are placed visibly into the appropriate Institution contribution pool. Effects depend on total cards contributed by all Families, with diminishing returns, creating cooperation, bargaining and free-riding inside a competitive game.
