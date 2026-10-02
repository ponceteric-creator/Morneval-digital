# Appendix K — Intrigue Cards Core Rules

**Status:** Locked design reference for the current tabletop rules. Individual card effects and costs remain card-specific unless explicitly locked below.

**Relationship to other rules:** This appendix defines the current common handling of Intrigue cards. Where older Intrigue-card notes conflict with this appendix, this appendix takes precedence. The economic effects of Scholarium Patents and City Guard / Military land-Wealth discoveries remain defined in **Appendix J — Alternative Wealth Sources**.

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

The number of cards seen depends on the Agent's current seniority:

- **Seniority 1:** draw 1, keep 1.
- **Seniority 2:** draw 2, keep 1.
- **Seniority 3:** draw 3, keep 1.

Cards not kept are placed in that Institution's discard pile.

Each Agent is resolved separately. Therefore a Family with several Agents can acquire several Intrigue cards in the same Generation.

An Agent placed during the current Generation does **not** generate an Intrigue card immediately. It begins generating card selections from the following Generation, provided it remains deployed.

When an Institution deck is exhausted, shuffle its discard pile to form a new draw pile, excluding cards that have permanently entered play or otherwise left the deck.

---

## K.3 — Hand Expiration

Intrigue cards represent opportunities available during the current Generation rather than a permanent hand of accumulated options.

At the end of the Generation, all unplayed Intrigue cards remaining in a Family's hand are discarded.

They may return to circulation when that Institution's discard pile is reshuffled unless the card's own rules say otherwise.

---

## K.4 — Timing Categories

Every Intrigue card has one of three timing categories.

### Action

Playing an **Action** Intrigue card consumes **1 Player Action**.

The player must also pay the card's printed Influence cost.

### Reaction

A **Reaction** card may be played only when its printed trigger occurs.

Playing it consumes **no Player Action**, but the player must still pay its printed Influence cost.

### Resolution

A **Resolution** card is played during the resolution window specified on the card and consumes **no Player Action** at that moment.

For Vote-related Resolution cards, the Vote itself must first exist under the normal rules. **Placing / initiating the Vote still costs 1 Player Action.**

The player must also pay the card's printed Influence cost.

---

## K.5 — Influence Costs

Every Intrigue card has a printed Influence cost, which may be **0**.

There is no universal cost for the entire Intrigue system: the value is defined card by card according to effect strength and will be calibrated through playtesting.

A card cannot be played unless its full Influence cost can be paid.

The seven permanent cards listed in K.7 are currently locked at **4 Influence each**.

---

## K.6 — Permanent Cards

Some Intrigue cards are **Permanent**.

When a Permanent card is successfully played:

- it leaves the player's hand;
- it does not enter the discard pile;
- it is placed visibly in play or attached to the relevant board element;
- its ongoing effect remains active according to the card's own rules.

A Permanent card may later change owner or be removed if another rule explicitly allows it.

---

## K.7 — Locked Permanent Cards

All seven cards below share the following common parameters:

> **Timing: Action · Cost: 4 Influence · Type: Permanent · Unique: one copy**

Playing any of these cards therefore consumes **1 Player Action** and **4 Influence**.

### Scholarium — Patents

#### Advanced Farming Techniques

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Patent

Citywide effect and Patent income are defined in Appendix J.

#### Civic Sanitation Works

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Patent

Citywide effect and Patent income are defined in Appendix J.

#### Advanced Judicial System

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Patent

Citywide effect and Patent income are defined in Appendix J.

#### Advanced Architecture

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Patent

Citywide effect and Patent income are defined in Appendix J.

### City Guard / Military — Land-Wealth Discoveries

#### Gemstone Vein

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Land Improvement

Choose an eligible Hill you control. The improvement is attached to that territory under the rules in Appendix J.

#### Rare Breed

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Land Improvement

Choose an eligible Meadow you control. The improvement is attached to that territory under the rules in Appendix J.

#### Precious Timber

**Timing:** Action  
**Cost:** 4 Influence  
**Type:** Permanent — Land Improvement

Choose an eligible Forest you control. The improvement is attached to that territory under the rules in Appendix J.

---

## K.7A — Locked City Guard / Military Non-Permanent Cards

### Assassination

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** variable by target

- **Agent:** 3 Influence
- **Elder Dynasty Member:** 5 Influence
- **Mature Dynasty Member:** 6 Influence
- **Young Dynasty Member:** 7 Influence

The chosen target is eliminated automatically; no die roll is used.

### Bodyguards

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** 2 Influence

Play when an opponent uses **Assassination** against one of your Dynasty Members. The Assassination is cancelled. The attacker still loses the Assassination card, the Player Action used to play it, and the Influence paid for the attempted Assassination.

Bodyguards does not protect Institution Agents.

### Hostile Land Takeover

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** **3 Influence + the acting Family's current next-territory claim cost**

The card enables the acting Family to seize an eligible natural Hinterland territory controlled by another Family. The variable claim component follows the normal Domain-track acquisition cost already defined in Appendix I.

### Martial Law

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Morneval receives **+1 Order until the end of the Generation**, subject to the normal Order maximum. The Family that plays Martial Law immediately gains **+1 Prestige**.

### Officer Purge / Loyalty Commission

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 2 Influence

Each opposing Family must pay **1 Influence for each Agent it has in the City Guard / Military Institution**. For each payment that is refused or cannot be made, that Family chooses one of its own City Guard / Military Agents and removes it.

Agent seniority does not modify this payment.

---

## K.7B — Shelved, Parked and Obsolete City Guard / Military Concepts

### Military Academy — Shelved

The previously proposed **Military Academy** Intrigue card is **not retained in the current deck design**. Its value was judged too low relative to the opportunity cost of drawing and playing an Intrigue card. The concept remains in the historical design appendix only and may be revisited later if Institution-development rules create a stronger use case.

### Military Political Mobilization — Parked

The previously proposed **Military Political Mobilization** card is **parked pending a proper redesign of the City Inclination system**. No timing, Influence cost, Vote modifier or final effect is currently locked.

The concept may be revisited once the City Inclination rules, their strategic consequences, and the relationship between Inclination and Votes have been redesigned.

### Food Requisition — Obsolete

The previously proposed **Food Requisition** card is **removed from the current deck design**. Its original purpose relied on Raw Food being diverted between population supply and commercial sale. Under the current Raw Food rules, Raw Food is no longer sold, so that opportunity-cost mechanism no longer exists and the card no longer creates a meaningful decision.

The historical concept remains in the design archive only; it should not be included in the current City Guard / Military deck unless the Raw Food economy is materially redesigned again.

---

## K.7C — Locked Scholarium Non-Permanent Cards

### Spy Network / Intelligence

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** variable, resolved in stages

Choose one opposing Family.

1. Pay **1 Influence** and look at all Intrigue cards currently in that Family's hand.
2. After seeing the hand, choose one of the following:
   - take no further effect; total cost remains **1 Influence**;
   - pay **+2 Influence** to choose and discard one card from that hand; total cost **3 Influence**;
   - pay **+4 Influence** to choose and steal one card from that hand; total cost **5 Influence**.

A stolen card enters the acting Family's hand and thereafter follows its normal timing, Influence-cost and end-of-Generation expiration rules. Spy Network itself still consumes only the single Player Action used to play it; the optional additional payment does not consume another Action.

### Counter-Intelligence

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** 2 Influence

Play when an opposing Intrigue card specifically targets **your Family, one of your Agents, one of your territories, one of your Stakes, or a card in your hand**. Cancel that card's effect against you.

If the triggering Intrigue card affects several Families, it continues to resolve normally against all other affected Families.

**Counter-Intelligence cannot counter Assassination.** Bodyguards remains the dedicated defence against Assassination targeting Dynasty Members.

### Technological Acceleration

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one Production Sector. Immediately perform **one additional development phase** in that Sector, paying that phase's normal Influence cost and gaining its normal Prestige reward, even if that Sector has already received a development phase during the current Generation.

The Family that plays Technological Acceleration also immediately gains **+1 Prestige**.

Technological Acceleration does not reduce or replace the normal cost of the development phase. Its benefit is to bypass the normal limit of one development phase per Production Sector per Generation. The additional Prestige rewards the acting Family for accelerating a structural improvement whose resulting higher Production Tier benefits the city more broadly.

### Experimental Methods

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one natural Hinterland territory. Until the end of the Generation, its Raw Resource capacity increases by **+1**.

The effect represents temporary experimental techniques — for example improved cultivation, extraction, irrigation, selective breeding, alchemical treatment or other Scholarium-led field methods — rather than a permanent structural improvement.

The additional capacity follows the normal production and allocation rules. It does not create an additional Stake and does not cause the territory to score its productive-land Prestige more than once.

The Family that plays Experimental Methods immediately gains **+1 Prestige**, reflecting credit for a temporary productivity improvement that can benefit the city more broadly.

### Purge of Charlatans

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 2 Influence

Each opposing Family must pay **1 Influence for each Agent it has in the Scholarium**. For each payment that is refused or cannot be made, that Family chooses one of its own Scholarium Agents and removes it.

Agent seniority does not modify this payment.

### Insider Information / Bid Advantage

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** 0 Influence

Gain **2 bid-only Influence** for the current Generation. These points may be used only to increase bids for Production-Sector Stakes.

The two points may either be added together to **one bid**, or split as **+1 Influence on each of two different bids**.

Bid-only Influence never becomes normal stored Influence, cannot be spent on any other cost, and any unused amount disappears at the end of the Generation.

### Dark Magic

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 0 Influence

Lose **1 Prestige** and gain **2 Influence** immediately.

The Prestige loss is a mandatory cost of playing the card and cannot be prevented or ignored. The gained Influence is normal stored Influence and remains subject to the normal Family Influence ceiling.

---

## K.7D — Shelved and Parked Scholarium Concepts

### Conclave Development — Shelved

The previously proposed **Conclave Development** card is not retained in the current deck design. Its narrow Institution-development discount was judged too low-value and too utilitarian relative to the opportunity cost of drawing and playing an Intrigue card. **Technological Acceleration** now fills the Scholarium's development-acceleration role more effectively.

### Arcane Political Manipulation — Parked

The previously proposed **Arcane Political Manipulation** card is parked pending redesign of the City Inclination system. Its timing, Influence cost and Vote effect will be reconsidered together with the equivalent Institution political-mobilization cards once Inclinations are redesigned.

### Knowledge / Event Manipulation — Parked

The historical **Knowledge / Event Manipulation** concept is parked until the Event system is sufficiently detailed to define a safe and meaningful scope for player manipulation. Direct cancellation or replacement of a Generation Event is not currently retained.

When revisited, the design should preferentially explore **prediction, constrained choice or limited mitigation** rather than unrestricted Event cancellation, so that Events continue to create a common generational situation to which all Families must adapt.

---

## K.7E — Locked Temple Non-Permanent Cards

### Infernal Pact

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 0 Influence

Lose **2 Prestige** and gain **4 Influence** immediately.

The Prestige loss is a mandatory cost of playing the card and cannot be prevented or ignored. The gained Influence is normal stored Influence and remains subject to the normal Family Influence ceiling.

### Hunt the Heretics

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 2 Influence

Each opposing Family must pay **1 Influence for each Agent it has in the Temple**. For each payment that is refused or cannot be made, that Family chooses one of its own Temple Agents and removes it.

Agent seniority does not modify this payment.

### Threat of Excommunication

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one opposing Family. That Family chooses one of the following losses:

- lose **2 Influence**;
- lose **1 Prestige**.

### Anathema

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 3 Influence

Choose one opposing Family. That Family chooses one of the following losses:

- lose **4 Prestige**;
- remove **1 of its Agents**, chosen by that Family, from any Institution.

The Prestige option is available only if the targeted Family can lose the full **4 Prestige**. Otherwise it must choose the Agent-removal option.

### Alms for the Poor

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Immediately reduce Morneval's **Squalor by 1**, to a minimum of 0. The Family that plays Alms for the Poor immediately gains **+1 Prestige**.

### Ecclesiastical Confiscation

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** the normal Influence cost of converting a Hinterland territory into a Civic Farm, paid by the Family playing this card

Choose one eligible natural Hinterland territory owned by an opposing Family. The territory is permanently **donated to the City**: remove the target Family's ownership marker and return that marker to its Domain track.

The territory continues to produce its normal Raw Resources, but it is permanently municipal: it has no Family owner, cannot be claimed by a Family, and can never be converted into a Civic Farm.

The former owner immediately gains **+2 Prestige**, representing public credit for the donation.

### Public Absolution

**Timing:** Reaction  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Play when an opposing effect would cause your Family to lose Prestige. Reduce that Prestige loss by **2**, to a minimum loss of 0.

Public Absolution cannot reduce a voluntary Prestige loss or a Prestige loss paid as a cost to play or resolve one of your own cards. In particular, it cannot reduce the Prestige costs of **Dark Magic** or **Infernal Pact**.

---

## K.7F — Shelved and Parked Temple Concepts

### Ecclesiastical Reform — Shelved

The previously proposed **Ecclesiastical Reform** card is not retained in the current deck design. Like Military Academy and Conclave Development, its narrow Institution-development role is judged too utilitarian and too low-value relative to the opportunity cost of drawing and playing an Intrigue card.

### Religious Mobilization / Sermon — Parked

The previously proposed **Religious Mobilization / Sermon** card is parked pending redesign of the City Inclination system. Its timing, Influence cost and Vote effect will be reconsidered together with the equivalent political-mobilization cards for the other Institutions once Inclinations are redesigned.

---

## K.7G — Locked Merchant Guild Non-Permanent Cards

### Hostile Takeover

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one **Mature or Elder Production Stake** occupied by an opposing Family. Remove that Stake immediately, leaving its existing age slot vacant.

The Family playing Hostile Takeover must immediately submit an **opening bid of 1 additional Influence** for the newly vacant slot. This opening bid is part of resolving the Hostile Takeover action and does **not** consume an additional Player Action.

The opening bid is reserved and resolved under the normal universal auction rules. The auction for that specific Mature or Elder slot then remains open under those normal rules.

### Binding Bids / All Bidders Pay

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence

Choose one eligible vacant **Young Production Stake slot** before any bid has been submitted for that slot. The Family playing Binding Bids must immediately submit an **opening bid of 1 additional Influence**. This opening bid is part of resolving the card and consumes no additional Player Action.

For this auction only, **every Family that submits a bid pays its final committed bid at Auction Resolution, whether it wins or loses**. A Family pays only its final committed bid, not the sum of its successive raises. This rule applies equally to the Family that played Binding Bids.

### Line of Credit

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** variable

Choose one of the following credit levels when playing the card:

- pay **1 Influence**, requiring at least **10 Prestige**, and gain **5 temporary Influence**;
- pay **2 Influence**, requiring at least **20 Prestige**, and gain **10 temporary Influence**;
- pay **3 Influence**, requiring at least **30 Prestige**, and gain **15 temporary Influence**.

The Prestige requirement is checked when the card is played. The temporary Influence may exceed the normal Family Influence ceiling and may be spent or committed like normal Influence during the remainder of the Player Actions phase.

Resolve all auctions normally. Winning bids are paid and losing bids are refunded under the normal auction rules.

**Immediately after all auctions have been resolved**, the Family must repay the full amount of temporary Influence received: 5, 10 or 15. Repayment is made from the Influence the Family then has available.

For each point of temporary Influence that the Family cannot repay, it loses **2 Prestige**. This means a Family may win several auctions using borrowed Influence and then suffer a substantial Prestige loss when the credit falls due.

### Preferential Contracts

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** variable

Choose one of the following levels when playing the card:

- pay **1 Influence** to prioritize up to **1 External Demand**;
- pay **3 Influence** to prioritize up to **2 External Demands**;
- pay **5 Influence** to prioritize up to **3 External Demands**.

During Economy Resolution, choose up to the corresponding number of production units generated by your own Production Stakes. Those units satisfy available **External Demand before the normal demand-allocation priorities are applied**.

Each such production unit follows the normal rules for satisfying External Demand, including its normal Wealth gain and Raw Resource consumption. Preferential Contracts does not itself create additional External Demand. If fewer External Demands are available than the selected level permits, the unused priority is lost.

### Private Buyer

**Timing:** Action  
**Type:** Non-Permanent  
**Cost:** 1 Influence  
**Effect:** Instant

Immediately create **+1 External Demand for the current Generation**. This additional demand is not automatically satisfied and is subsequently resolved under the normal External Demand and production-allocation rules.

---

## K.8 — Current Simulation Status

The generic Intrigue engine supports:

- Institution-specific decks;
- Agent-seniority draw / keep rules;
- Family hands;
- discard and reshuffle;
- end-of-Generation expiration;
- Action / Reaction / Resolution timing metadata;
- Influence costs, including a printed cost of 0;
- Permanent cards leaving the normal deck cycle.

The seven cards in K.7 are recorded in the simulation card catalogue with their locked metadata, but are **not yet inserted into the active simulation decks** and their individual effects are not yet executed by the simulation.

This is deliberate: the full initial composition of the Scholarium and City Guard / Military decks must be defined before these unique Permanent cards are activated, otherwise they would appear at an artificially high frequency.

---

## K.9 — Locked vs Open Points

### Locked

- Four separate Institution Intrigue decks.
- One independent card selection per deployed Agent at the beginning of the Generation.
- Seniority 1 / 2 / 3 means draw 1 / 2 / 3 and keep exactly 1.
- An Agent placed during the current Generation does not draw until the following Generation.
- Unchosen cards go to the Institution discard pile.
- Unplayed cards in hand expire at the end of the Generation.
- **Action** cards consume 1 Player Action.
- **Reaction** cards consume no Player Action.
- **Resolution** cards consume no Player Action during their resolution window; initiating a Vote still requires a Player Action.
- Every Intrigue card has a printed Influence cost, which may be 0.
- The four Scholarium Patents and three City Guard / Military land-Wealth discoveries are **Action / Permanent** cards costing **4 Influence each**.
- Assassination is Action / non-Permanent with target costs Agent 3, Elder 5, Mature 6, Young 7.
- Bodyguards is Reaction / non-Permanent / 2 Influence and protects Dynasty Members from Assassination.
- Hostile Land Takeover is Action / non-Permanent and costs 3 Influence plus the acting Family's current next-territory claim cost.
- Martial Law is Action / non-Permanent / 1 Influence, gives +1 Order until the end of the Generation, and grants +1 Prestige to the Family that plays it.
- Officer Purge / Loyalty Commission is Action / non-Permanent / 2 Influence; opposing Families pay 1 Influence per City Guard / Military Agent or remove an Agent for each unpaid amount.
- Military Academy is shelved and is not part of the current deck design.
- Military Political Mobilization is parked until the City Inclination system is redesigned.
- Food Requisition is obsolete under the current Raw Food rules and is removed from the current deck design.
- Spy Network / Intelligence is Action / non-Permanent with staged cost: 1 Influence to inspect an opposing hand, +2 to discard one inspected card, or +4 to steal one inspected card, for totals of 1 / 3 / 5 Influence respectively.
- Counter-Intelligence is Reaction / non-Permanent / 2 Influence; it cancels a targeted opposing Intrigue effect against the acting Family or one of its listed assets, but cannot counter Assassination.
- Technological Acceleration is Action / non-Permanent / 1 Influence; it permits one additional normally paid Production-Sector development phase in a Sector already developed that Generation and grants the acting Family +1 Prestige.
- Experimental Methods is Action / non-Permanent / 1 Influence; it gives one natural Hinterland territory +1 Raw Resource capacity until the end of the Generation and grants the acting Family +1 Prestige.
- Purge of Charlatans is Action / non-Permanent / 2 Influence; opposing Families pay 1 Influence per Scholarium Agent or remove an Agent for each unpaid amount.
- Insider Information / Bid Advantage is Reaction / non-Permanent / 0 Influence; it provides 2 bid-only Influence for the Generation, usable as +2 on one Stake bid or +1 on each of two different Stake bids.
- Dark Magic is Action / non-Permanent / 0 Influence; it costs 1 Prestige and grants 2 normal Influence, subject to the normal Influence ceiling.
- Conclave Development is shelved and is not part of the current deck design.
- Arcane Political Manipulation is parked until the City Inclination system is redesigned.
- Knowledge / Event Manipulation is parked pending further Event-system design.
- Infernal Pact is Action / non-Permanent / 0 Influence; it costs 2 Prestige and grants 4 normal Influence, subject to the normal Influence ceiling.
- Hunt the Heretics is Action / non-Permanent / 2 Influence; opposing Families pay 1 Influence per Temple Agent or remove an Agent for each unpaid amount.
- Threat of Excommunication is Action / non-Permanent / 1 Influence; the target chooses to lose 2 Influence or 1 Prestige.
- Anathema is Action / non-Permanent / 3 Influence; the target chooses to lose 4 Prestige or remove one of its Agents, with the Prestige option available only if the full 4 Prestige can be lost.
- Alms for the Poor is Action / non-Permanent / 1 Influence; it reduces Squalor by 1, minimum 0, and grants +1 Prestige to the acting Family.
- Ecclesiastical Confiscation is Action / non-Permanent; its Influence cost equals the normal Civic Farm conversion cost paid by the acting Family; it permanently donates an opposing natural Hinterland territory to the City, returns the former owner's Domain marker, preserves normal Raw Resource production, permanently prevents Family ownership and Civic Farm conversion, and grants the former owner +2 Prestige.
- Public Absolution is Reaction / non-Permanent / 1 Influence; it reduces a Prestige loss caused by an opposing effect by 2, but cannot reduce voluntary Prestige losses or Prestige paid as the cost of the acting Family's own cards.
- Ecclesiastical Reform is shelved and is not part of the current deck design.
- Religious Mobilization / Sermon is parked until the City Inclination system is redesigned.
- Hostile Takeover is Action / non-Permanent / 1 Influence; it removes one opposing Mature or Elder Production Stake and immediately opens an auction for that same age slot with a mandatory 1-Influence opening bid from the acting Family; the opening bid is additional to the card cost and is part of the card action.
- Binding Bids / All Bidders Pay is Action / non-Permanent / 1 Influence; it opens an auction for an eligible vacant Young slot with a mandatory 1-Influence opening bid from the acting Family, and every bidder pays its final committed bid at resolution whether it wins or loses.
- Line of Credit is Action / non-Permanent with three credit levels: 1/2/3 Influence cost for 5/10/15 temporary Influence, requiring 10/20/30 Prestige respectively when played; after all auctions resolve, the full temporary amount is repaid, and each unpaid point costs 2 Prestige.
- Preferential Contracts is Action / non-Permanent with variable cost 1/3/5 Influence; it lets up to 1/2/3 production units from the acting Family's Production Stakes satisfy available External Demand before normal allocation priorities, while retaining the normal External Demand Wealth reward and resource-consumption rules.
- Private Buyer is Action / non-Permanent / 1 Influence with an instant effect: it creates +1 External Demand for the current Generation, which is then handled under the normal allocation rules.

### Still Open / Future Design

- Full deck composition and number of copies of non-unique cards.
- Influence costs and timing categories for remaining Intrigue cards not explicitly locked above.
- AI valuation and play heuristics for individual Intrigue effects.
- Specific contest / theft / counter-card procedures for Patents and land ownership.
- City Inclination redesign, including the eventual fate and implementation of parked political-mobilization cards.