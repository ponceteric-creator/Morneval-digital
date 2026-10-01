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

Every Intrigue card has a printed Influence cost.

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

## K.8 — Current Simulation Status

The generic Intrigue engine supports:

- Institution-specific decks;
- Agent-seniority draw / keep rules;
- Family hands;
- discard and reshuffle;
- end-of-Generation expiration;
- Action / Reaction / Resolution timing metadata;
- Influence costs;
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
- Every Intrigue card has a printed Influence cost.
- The four Scholarium Patents and three City Guard / Military land-Wealth discoveries are **Action / Permanent** cards costing **4 Influence each**.

### Still Open / Future Design

- Full deck composition and number of copies of non-unique cards.
- Influence costs for all other Intrigue cards.
- Timing categories for all other Intrigue cards.
- AI valuation and play heuristics for individual Intrigue effects.
- Specific contest / theft / counter-card procedures for Patents and land ownership.
