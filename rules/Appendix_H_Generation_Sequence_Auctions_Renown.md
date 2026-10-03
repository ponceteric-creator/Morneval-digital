# Appendix H — Generation Sequence, Auctions, Mercenary Contract & Renown

Status: **v0.11.11 current simulation sequence**.

## 1. Generation sequence

Each Generation resolves in this order:

1. **UPKEEP**
2. **EVENT**
3. **PLAYER ACTIONS**
4. **AUCTION RESOLUTION**
5. **ECONOMY RESOLUTION**
6. **PRESTIGE & INFLUENCE SCORING**
7. **CITY EVOLUTION**
8. **CIVIL DISORDER RESOLUTION**
9. **WEALTH RECALCULATION**
10. **FIRST PLAYER**
11. **CITY INCLINATION**

### 1.1 Upkeep

Upkeep resolves:

1. apply any Population Growth marker carried from the previous Generation;
2. recalculate structural Renown;
3. apply Influence erosion;
4. age Agents and Production Stakes;
5. verify Agent support against the Family's carried Wealth capacity and force recalls if required;
6. reserve maintenance bids for contracts already held.

### 1.2 Event

The Event phase exists in the timing structure. The Event deck is not yet implemented in the current simulation.

### 1.3 Player Actions

Starting with First Player, Families take **one action successively**. There is no fixed action-round limit. A Family that passes is finished for the Generation. The phase ends when every Family has passed.

Submitting or increasing an auction bid is a normal action.

A Family may also take the **Influence City Inclination** action:

- spend **1 Influence** immediately;
- consume **1 normal Player Action**;
- support exactly one City Inclination pole: **Military, Merchant Guild, Temple, or Scholarium**;
- place one Political Influence bid on that pole for the current Generation.

Political Influence uses an **all-pay** model. The Influence is permanently spent when the action is taken. It is not refunded if that pole later loses or ties.

There is no tabletop limit to the number of Political Influence actions a Family may take in one Generation beyond normal action sequencing and available Influence.

Intrigue **Action** cards consume a normal Player Action according to Appendix K. Intrigue **Reaction** cards consume no Player Action and resolve only when their trigger occurs.

### 1.4 Auction Resolution

All auctions are resolved after every Family has passed and before the economy is resolved.

Political Influence bids are **not auctions** and do not resolve in this phase. Their Influence has already been spent; they are counted only during the final City Inclination phase.

### 1.5 Economy Resolution

Production, demand allocation and Raw Food availability are resolved here. Economic outcomes are known before Prestige & Influence Scoring.

### 1.6 Prestige & Influence Scoring

Institution Prestige, economic Prestige, pending Prestige modifiers from the previous City Evolution, and Agent Influence income are resolved here.

### 1.7 City Evolution

City Evolution resolves, in order:

1. automatic Imperial Food Aid if local Raw Food was insufficient;
2. Squalor recalculation;
3. Disease;
4. Order calculation and identification of Civil Disorder;
5. determination of the Population Growth marker for the next Upkeep;
6. delayed Event consequences when applicable.

Disease therefore modifies Population **before** Order is calculated.

### 1.8 Civil Disorder Resolution

If City Evolution identified Civil Disorder, resolve it immediately in this dedicated phase:

- each Family loses 20% of current Prestige, rounded up;
- Population loses 1, minimum 1;
- Imperial Intervention +1;
- Order resets to 1;
- any Growth marker created during City Evolution is cancelled.

Civil Disorder is an explicit exception to the normal rule that Prestige changes generated after Phase 6 wait until the next Prestige & Influence Scoring phase.

### 1.9 Wealth Recalculation

Wealth is recalculated from the Generation's economic results and becomes the Family's Wealth capacity for the **next** Generation. A Wealth reduction does not force immediate Agent recall here; support is checked at the next Upkeep.

Permanent Intrigue effects that provide owner-specific Wealth, including Scholarium Patents and Military Land Enhancements, are included in the final Wealth state.

### 1.10 First Player

The next First Player is determined after Wealth Recalculation:

**Influence → Prestige → recalculated Wealth → random tie-break.**

City Inclination is resolved only after the next First Player has been determined.

### 1.11 City Inclination

City Inclination is the **last phase of the Generation**.

There is no carry-over of Intrigue-card counts or Political Influence bids between Generations.

The two axes are resolved independently:

- **Scholarium ↔ Temple**
- **Military ↔ Merchant Guild**

For each pole, calculate its final support as:

**Intrigue cards actually played from that Institution during the current Generation + Political Influence bids spent on that pole during the current Generation.**

For each axis:

- if one side has a strict relative majority of total support, move the axis **one step** toward that side;
- if both sides have the same total support, the axis does not move;
- there is **no minimum threshold** for movement;
- an axis can move by at most **one step per Generation**, regardless of the size of the majority;
- normal axis limits remain **II / I / Neutral / I / II**.

Examples:

- **3 Temple cards + 1 Temple bid vs 2 Scholarium cards + 1 Scholarium bid** gives Temple 4 vs Scholarium 3 and moves one step toward Temple;
- **2 Military cards + 2 Military bids vs 3 Merchant cards + 1 Merchant bid** gives 4 vs 4 and causes no movement;
- **5 Merchant total support vs 0 Military total support** still moves the axis only one step toward Merchant.

All Intrigue cards actually played count:

- Actions count;
- Reactions count;
- a card whose effect is cancelled or countered still counts because it was played;
- a Permanent counts only in the Generation in which it is played;
- a stolen card counts for the **Institution deck it originally belongs to**, not for the Institution of the Family that currently holds it.

All Political Influence bids count, including bids from a Family whose preferred pole ultimately loses or ties. Because Political Influence is all-pay, none of that Influence is refunded after resolution.

The resulting Inclination becomes the city's starting Inclination for the **following Generation**.

## 2. Universal auction rule

All actual auctions, including Production Stakes and contracts, use the same structure.

- A Family submits or raises a bid during its normal action turn.
- Each bid consumes one action.
- A new bid must exceed the current highest bid by at least **1 Influence**.
- Influence committed to a bid is **reserved immediately** and is unavailable for other bids or spending.
- Bids remain open until all Families have passed.
- At Auction Resolution, eligibility is checked.
- Invalid bids are ignored.
- The highest valid bid wins.
- Only the winner permanently spends its bid.
- Every losing or invalid bid is fully refunded.
- If every bid is invalid, the auction has no winner.

This makes the order in which a Family enters different auctions strategically relevant because reserved Influence cannot be reused while the Player Actions phase is still open.

**Political Influence for City Inclination is explicitly not covered by this refund rule.** It is an all-pay political action, not an auction: each 1 Influence spent is permanently lost as soon as the action is taken.

## 3. Mercenary Contract

There is **one Mercenary Contract in the city**.

### Eligibility

A Family must have at least one Agent in the **City Guard** when the auction is resolved. Eligibility is checked only at resolution; a bid can therefore become invalid if the Family loses its last City Guard Agent before resolution.

### Maintenance and bidding

If the contract was held in the previous Generation, its holder must reserve a **1 Influence maintenance bid during Upkeep**. This is the holder's current bid, not an additional fee.

A challenger must therefore bid at least 2 while that maintenance bid remains highest. If the contract is vacant, bidding opens at 1.

If the current holder cannot reserve its maintenance bid, the contract becomes vacant.

### Wealth production

The newly awarded contract is active immediately for the Economy Resolution of the same Generation.

After Raw Food required by the Population has been allocated, the Mercenary Contract attempts to consume **1 remaining Raw Food**. Population always has priority.

- If 1 Raw Food is consumed, the contract generates **+1 Wealth** for its holder during Wealth Recalculation.
- If no Raw Food remains, the contract generates no Wealth that Generation.

The contract therefore represents a persistent income capacity with an ongoing operating requirement rather than a one-off raid or windfall.

## 4. Prestige timing ledger

Prestige is normally modified only during Phase 6.

Any Prestige effect created during City Evolution is recorded as a **pending Prestige modifier** and applied at the next Phase 6. Its value is determined when the effect occurs rather than recalculated later.

Imperial Food Aid follows this rule: the Intervention marker increases immediately during City Evolution, while the associated Prestige penalty is applied during the next Generation's Prestige & Influence Scoring.

Civil Disorder remains an immediate exception because it is a major crisis resolved in its dedicated phase.

## 5. Population growth timing

City Evolution no longer directly increases Population. Instead it creates a **Growth marker** if the Generation meets the growth conditions.

Civil Disorder can cancel this marker. If it survives, Population increases at the beginning of the next Upkeep.

This means the consequences of becoming a larger city begin from the new Generation rather than being retroactively applied to the Generation that produced the growth.

## 6. Structural Renown

Renown must be recalculable at any time from visible, persistent game state. Transient events do not directly leave hidden Renown bookkeeping.

Current formula:

**Renown = floor(Population / 2) + Production Tier contribution + Institution Tier contribution + permanent Improvement/Event contribution**

Production and Institution contribution per element:

- Tier I: 0 Renown
- Tier II: +1 Renown
- Tier III: +2 Renown

Each **Permanent Intrigue card that provides +1 Wealth** contributes **+1 Renown while it remains in play**. This contribution belongs to the city, not to the owning Family: transferring ownership of the Permanent does not remove its Renown contribution.

The former simulation-only **+1 Renown per 5 completed Generations** placeholder has been removed.

There is no Population ×2 Renown cap.

## 7. External Demand

External Demand per Production Sector is:

**floor(Renown / 4)**

This replaces the previous `ceil(Renown / 2)` model and is intended to keep external demand compatible with the broader structural Renown scale.
