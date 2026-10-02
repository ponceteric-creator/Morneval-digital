# Appendix K — Intrigue Cards Core Rules

**Status:** Locked design reference for the current tabletop rules.

**Relationship to other rules:** This appendix defines the current common handling of Intrigue cards. Where older Intrigue-card notes conflict with this appendix, this appendix takes precedence. Scholarium Patents and City Guard / Military land-Wealth discoveries use the economic effects defined in **Appendix J — Alternative Wealth Sources**.

---

## K.1 — Institution Decks

Intrigue cards are divided into four separate Institution decks:

1. **City Guard / Military**
2. **Temple**
3. **Merchant Guild**
4. **Scholarium**

An Agent gives access only to the Intrigue deck of the Institution in which that Agent is deployed.

---

## K.2 — Intrigue Acquisition

At the beginning of a Generation, each Agent already deployed generates one independent card selection from its Institution deck.

- **Seniority 1:** draw 1, keep 1.
- **Seniority 2:** draw 2, keep 1.
- **Seniority 3:** draw 3, keep 1.

Cards not kept go to that Institution's discard pile. Each Agent is resolved separately.

An Agent placed during the current Generation does **not** generate an Intrigue card immediately. It begins generating selections from the following Generation, provided it remains deployed.

When a deck is exhausted, shuffle its discard pile to form a new draw pile, excluding cards that have permanently entered play or otherwise left the deck.

### K.2A — Deck Composition Target

The founding cadence target is **table-wide**, not per Family: in a standard **3-player game**, the Intrigue decks should collectively support approximately **one powerful Intrigue card costing 4 Influence or more being played by at least one of the three Families every two Generations**.

For composition calculations, use the baseline assumption that each of the three players has normal Intrigue access equivalent to **one Seniority-2 Agent**: each player therefore sees **2 cards per Generation**. Across 3 players and 2 Generations, the table sees approximately **12 card opportunities**.

If `p` is the share of 4+ Influence cards among those opportunities, the approximate chance that the table sees at least one such card over two Generations is:

> **1 − (1 − p)^12**

Reference points:

- **10%** powerful cards → about **72%** chance of seeing at least one over two Generations;
- **12.5%** → about **80%**;
- **15%** → about **86%**;
- **17.5%** → about **90%**;
- **20%** → about **93%**.

Because **seeing** a 4+ card does not guarantee that it can or will actually be **played** — the Family may lack Influence, fail another requirement, or prefer another card — the initial balancing target should be approximately **15–20% of the active deck mix at 4+ Influence**, with **about 17.5%** as the mathematical reference point for roughly 90% table-wide exposure over two Generations.

This remains a composition target rather than a guaranteed draw or guaranteed play. Unique Permanent cards should not be the sole means of meeting it because they progressively leave circulation once played. The final percentage must be validated through 3-player playtesting using actual Agent counts, seniority and card-play rates.

---

## K.3 — Hand Expiration

At the end of the Generation, all unplayed Intrigue cards remaining in a Family's hand are discarded. They may return to circulation when that Institution's discard pile is reshuffled unless the card says otherwise.

---

## K.4 — Timing Categories

### Action

Playing an **Action** Intrigue card consumes **1 Player Action** and requires payment of its printed Influence cost.

### Reaction

A **Reaction** card may be played only when its printed trigger occurs. It consumes **no Player Action**, but its printed Influence cost must still be paid.

### Resolution

A **Resolution** card is played during its specified resolution window and consumes **no Player Action** at that moment. For Vote-related cards, initiating / placing the Vote still costs **1 Player Action**.

---

## K.5 — Costs

Every Intrigue card has a printed Influence cost, which may be **0**. Some cards also impose additional costs in Prestige, bids, territory-claim cost, or other resources as stated on the card.

A card cannot be played unless all mandatory costs required at the time of play can be paid.

---

## K.6 — Permanent Cards

When a Permanent card is successfully played, it leaves the player's hand, does not enter the discard pile, and remains visibly in play according to its own rules.

All seven currently locked Permanent cards are **Action / 4 Influence / Unique**.

### Scholarium — Patents

#### Advanced Farming Techniques

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Patent

Each Civic Farm produces **+1 Raw Food**. The Patent owner gains **+1 Wealth** according to Appendix J.

#### Civic Sanitation Works

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Patent

After normal Squalor resolution, reduce total Squalor by **1**, minimum 0. The Patent owner gains **+1 Wealth** according to Appendix J.

#### Advanced Judicial System

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Patent

Morneval receives **+1 Order**, subject to the normal maximum. The Patent owner gains **+1 Wealth** according to Appendix J.

#### Advanced Architecture

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Patent

Urban tile capacity becomes **4 instead of 3**. The Patent owner gains **+1 Wealth** according to Appendix J.

### City Guard / Military — Land-Wealth Discoveries

#### Gemstone Vein

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Land Improvement

Attach to an eligible controlled **Hill**. It provides **+1 Wealth** according to Appendix J and follows the territory.

#### Rare Breed

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Land Improvement

Attach to an eligible controlled **Meadow**. It provides **+1 Wealth** according to Appendix J and follows the territory.

#### Precious Timber

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Land Improvement

Attach to an eligible controlled **Forest**. It provides **+1 Wealth** according to Appendix J and follows the territory.

---

## K.7 — Active Non-Permanent Cards

### K.7A — City Guard / Military

#### Assassination

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** variable by target

- **Agent:** 3 Influence
- **Elder Dynasty Member:** 5 Influence
- **Mature Dynasty Member:** 6 Influence
- **Young Dynasty Member:** 7 Influence

Eliminate the chosen target automatically. No die roll is used.

#### Bodyguards

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** **3 Influence**

Play when an opponent uses **Assassination** against one of your Dynasty Members. Cancel the Assassination. The attacker still loses the Assassination card, the Player Action used to play it, and the Influence paid for it.

Bodyguards does not protect Institution Agents.

#### Hostile Land Takeover

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** **2 Influence + the acting Family's current next-territory claim cost**

Seize an eligible natural Hinterland territory controlled by another Family. The variable claim component follows the normal Domain-track acquisition cost in Appendix I.

#### Martial Law

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Morneval receives **+1 Order until the end of the Generation**, subject to the normal Order maximum. The acting Family immediately gains **+1 Prestige**.

#### Officer Purge / Loyalty Commission

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** **1 Influence**

Each opposing Family must pay **1 Influence for each Agent it has in the City Guard / Military Institution**. For each payment refused or impossible, that Family removes one of its own City Guard / Military Agents.

Agent seniority does not modify this payment.

---

### K.7B — Scholarium

#### Spy Network / Intelligence

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** variable — **1 / 2 / 3 Influence total**

Choose one opposing Family.

1. Pay **1 Influence** to look at all Intrigue cards currently in that Family's hand.
2. After seeing the hand, choose one of the following:
   - stop; total cost remains **1 Influence**;
   - pay **+1 Influence** to choose and discard one card from that hand; total cost **2 Influence**;
   - pay **+2 Influence** to choose and steal one card from that hand; total cost **3 Influence**.

A stolen card enters the acting Family's hand and follows its normal timing, cost and end-of-Generation expiration rules. The optional additional payment consumes no additional Player Action.

#### Counter-Intelligence

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** 2 Influence

Play when an opposing Intrigue card specifically targets **your Family, one of your Agents, one of your territories, one of your Stakes, or a card in your hand**. Cancel that card's effect against you.

If the triggering card affects several Families, it continues to resolve normally against the others.

**Counter-Intelligence cannot counter Assassination.**

#### Technological Acceleration

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one Production Sector. Immediately perform **one additional development phase** in that Sector, paying its normal development cost and gaining its normal Prestige reward, even if that Sector has already been developed this Generation.

The acting Family also immediately gains **+1 Prestige**.

#### Experimental Methods

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one natural Hinterland territory. Until the end of the Generation, its Raw Resource capacity increases by **+1**. The acting Family immediately gains **+1 Prestige**.

The additional capacity follows normal production and allocation rules. It does not create an additional Stake and does not make the territory score productive-land Prestige more than once.

#### Expose the Charlatans

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 2 Influence

For **each Scholarium Agent** controlled by an opposing Family, that Family must choose one of the following for that Agent:

- pay **2 Influence** to maintain the Agent;
- pay nothing and **remove that Agent**.

Payment is all-or-nothing for each Agent; partial payment does not preserve an Agent. Agent seniority does not modify the payment.

#### Insider Information / Bid Advantage

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** 0 Influence

Gain **2 bid-only Influence** for the current Generation. Use both as **+2 on one Production-Stake bid**, or split them as **+1 on each of two different Production-Stake bids**.

Bid-only Influence cannot be spent on any other cost and unused points disappear at the end of the Generation.

#### Dark Magic

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** **0 Influence + 3 Prestige**

Lose **3 Prestige** and gain **6 normal Influence** immediately.

The Prestige loss is mandatory and cannot be prevented or ignored. The gained Influence is subject to the normal Family Influence ceiling.

---

### K.7C — Temple

#### Infernal Pact

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 0 Influence + 2 Prestige

Lose **2 Prestige** and gain **4 normal Influence** immediately.

The Prestige loss is mandatory and cannot be prevented or ignored. The gained Influence is subject to the normal Family Influence ceiling.

#### Hunt the Heretics

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 2 Influence

For **each Temple Agent** controlled by an opposing Family, that Family must choose one of the following for that Agent:

- pay **2 Influence** to maintain the Agent;
- pay nothing and **remove that Agent**.

Payment is all-or-nothing for each Agent; partial payment does not preserve an Agent. Agent seniority does not modify the payment.

#### Threat of Excommunication

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one opposing Family. That Family chooses to either:

- lose **2 Influence**; or
- lose **1 Prestige**.

#### Anathema

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 3 Influence

Choose one opposing Family. That Family chooses to either:

- lose **4 Prestige**; or
- remove **1 of its Agents**, chosen by that Family, from any Institution.

The Prestige option is available only if the targeted Family can lose the full 4 Prestige. Otherwise it must choose Agent removal.

#### Alms for the Poor

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Immediately reduce Morneval's **Squalor by 1**, minimum 0. The acting Family immediately gains **+1 Prestige**.

#### Ecclesiastical Confiscation

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** the normal Influence cost of converting a Hinterland territory into a Civic Farm

Choose one eligible natural Hinterland territory owned by an opposing Family. Permanently donate it to the City: remove the target Family's ownership marker and return that marker to its Domain track.

The territory continues producing its normal Raw Resources but becomes permanently municipal: it has no Family owner, cannot be claimed by a Family, and cannot be converted into a Civic Farm.

The former owner immediately gains **+2 Prestige**.

#### Public Absolution

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Play when an opposing effect would cause your Family to lose Prestige. Reduce that loss by **2**, minimum 0.

Public Absolution cannot reduce voluntary Prestige losses or Prestige paid as a cost of your own cards, including **Dark Magic**, **Infernal Pact**, or **Criminal Network**.

---

### K.7D — Merchant Guild

#### Criminal Network

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** **0 Influence + 1 Prestige**

Lose **1 Prestige** and gain **2 normal Influence** immediately.

The Prestige loss is mandatory and cannot be prevented or ignored. The gained Influence is subject to the normal Family Influence ceiling.

#### Hostile Takeover

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one **Mature or Elder Production Stake** occupied by an opposing Family and remove it.

The acting Family must immediately submit an **opening bid of 1 additional Influence** for that same age slot. This opening bid is part of resolving the card and consumes no additional Player Action. The auction then follows the normal universal auction rules.

#### Binding Bids / All Bidders Pay

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one eligible vacant **Young Production Stake slot** before any bid has been submitted. The acting Family must immediately submit an **opening bid of 1 additional Influence**; this consumes no additional Player Action.

For this auction only, **every Family that submits a bid pays its final committed bid at Auction Resolution, whether it wins or loses**. A Family pays only its final committed bid, not the sum of successive raises.

#### Line of Credit

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** variable

Choose one level:

- pay **1 Influence**, requiring at least **10 Prestige**, and gain **5 temporary Influence**;
- pay **2 Influence**, requiring at least **20 Prestige**, and gain **10 temporary Influence**;
- pay **3 Influence**, requiring at least **30 Prestige**, and gain **15 temporary Influence**.

The Prestige requirement is checked when the card is played. Temporary Influence may exceed the normal Influence ceiling and may be spent or committed like normal Influence during the remainder of the Player Actions phase.

Resolve all auctions normally. **After all auctions have been resolved**, repay the full temporary amount received. Repayment is made from available Influence. For each point that cannot be repaid, lose **2 Prestige**.

#### Preferential Contracts

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** variable

Choose one level:

- **1 Influence** → prioritize up to **1 External Demand**;
- **3 Influence** → prioritize up to **2 External Demands**;
- **5 Influence** → prioritize up to **3 External Demands**.

During Economy Resolution, choose up to the corresponding number of production units generated by your own Production Stakes. Those units satisfy available **External Demand before normal demand-allocation priorities**.

Each unit follows the normal External Demand rules, including normal Wealth gain and Raw Resource consumption. This card does not create External Demand. Unused priority is lost.

#### Private Buyer

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Immediately create **+1 External Demand for the current Generation**. The additional demand is not automatically satisfied and is subsequently handled under the normal production-allocation rules.

#### Misdirection / Straw Man

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** 3 Influence

Play after an opposing Intrigue card with exactly one target designates **your Family or one of your assets**, but before that card resolves.

Choose a different **legal target** satisfying all normal restrictions of the triggering card. The triggering card resolves normally against the new target.

**Assassination may be redirected.** The new target may not be the Family that played the triggering card or an asset controlled by that Family. The triggering card's Action and costs remain spent normally.

#### Licence Revocation / Audit of Privileges

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** **1 Influence**

Each opposing Family must pay **1 Influence for each Agent it has in the Merchant Guild**. For each payment refused or impossible, that Family removes one of its own Merchant Guild Agents.

Agent seniority does not modify this payment.

---

## K.8 — Parked, Shelved and Obsolete Concepts

### City Guard / Military

#### Military Academy — Shelved

Not retained in the current deck design. Its narrow Institution-development role is too utilitarian relative to the opportunity cost of drawing and playing an Intrigue card.

#### Military Political Mobilization — Parked

Parked pending redesign of the City Inclination and Vote systems.

#### Food Requisition — Obsolete

Removed from the current deck because Raw Food is no longer sold, eliminating the opportunity-cost mechanism on which the card depended.

### Scholarium

#### Conclave Development — Shelved

Not retained in the current deck design. **Technological Acceleration** fills the development-acceleration role more effectively.

#### Arcane Political Manipulation — Parked

Parked pending redesign of the City Inclination and Vote systems.

#### Knowledge / Event Manipulation — Parked

Parked until the Event system is sufficiently developed to define a constrained and meaningful manipulation effect.

### Temple

#### Ecclesiastical Reform — Shelved

Not retained in the current deck design because its narrow Institution-development role is too utilitarian.

#### Religious Mobilization / Sermon — Parked

Parked pending redesign of the City Inclination and Vote systems.

### Merchant Guild

#### Commercial Charter — Shelved

Not retained in the current deck design because a simple Merchant-Institution development discount is too utilitarian.

#### Merchant Lobbying — Parked

Parked pending redesign of the City Inclination and Vote systems. Its eventual purpose is to support movement toward the **Mercantile Inclination**.

---

## K.9 — Current Simulation / Implementation Status

The generic Intrigue engine supports:

- Institution-specific decks;
- Agent-seniority draw / keep rules;
- Family hands;
- discard and reshuffle;
- end-of-Generation expiration;
- Action / Reaction / Resolution timing metadata;
- Influence costs, including printed cost 0;
- Permanent cards leaving the normal deck cycle.

Individual card effects are not necessarily implemented in the digital prototype merely because their tabletop design is locked here.

---

## K.10 — Locked vs Open Points

### Locked

- The generic Intrigue acquisition, timing, cost, expiration and Permanent-card rules in this appendix.
- The seven Permanent cards and all **Active** card parameters written above.
- The parked / shelved / obsolete status of the concepts in K.8.
- In a standard **3-player game**, deck composition should support approximately **one 4+ Influence powerful card being played by at least one Family every two Generations** at the table level, not once per Family. Under the reference model of one Seniority-2 Agent per player, this implies 12 card opportunities over two Generations and an initial target of roughly **15–20% 4+ Influence cards**, with **17.5%** giving about **90%** probability of at least one such card being seen before accounting for affordability and player choice.

### Still Open / Future Design

- Exact physical deck composition and copy counts for non-unique cards.
- AI valuation and play heuristics for individual Intrigue effects.
- Specific contest / theft / counter-card procedures for Patents and land ownership.
- City Inclination redesign and the final implementation of parked political-mobilization cards.
