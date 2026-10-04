# Appendix N — External Relations Tracks (v0.11.19 Simulation)

**Status:** simulation implementation of the currently agreed External Relations structure.  
**Scope:** Elves, Gnomes, Orcs and Mainland.  
**Important:** this appendix does not yet define the Event deck. In automated batches, Population 3 is used only as a stand-in trigger for the future **Meet the Neighbours** Event.

---

## N.1 — General Structure

After **Meet the Neighbours**, External Relations become active.

Relations use a track from **-3 to +3**.

For Elves, Gnomes and Orcs:

- **+1 / +2** can be reached through the structural behaviour of Morneval;
- **+3** represents a **Strategic Alliance** and is never reached automatically;
- +3 requires a dedicated triggered Quest once its prerequisites are met.

External Relations are not raised by a generic Diplomacy action.

Events may still modify relations directly once the Event system is implemented.

---

## N.2 — Mainland Pressure from Foreign Alignment

Mainland starts at **+2** when External Relations are activated.

The first time each foreign nation reaches **+2**:

- Mainland **-1**.

The first time each foreign nation reaches **+3** Strategic Alliance:

- Mainland **-2 additional**.

These are historical triggers. Each nation/threshold can penalise Mainland **once only**. Dropping below the threshold and later returning to it does not trigger the penalty again.

### Imperial Appeasement

One Family may perform **Imperial Appeasement**:

- 1 normal Player Action;
- **4 Influence**;
- Mainland **+1**, maximum +3;
- only **one Imperial Appeasement total per Generation**, regardless of Family.

Appeasement does not reset any historical foreign-alignment trigger.

The exact numeric effects of Mainland relation on **Imperial Aid** and **Imperial Demand** are still TBD. The simulation records the Mainland track but deliberately does not invent those unresolved values.

---

# N.3 — Elves

## Identity

Elven relations measure Morneval's treatment of the forest and its willingness to develop in harmony with the land.

**Reforestation becomes available as soon as Meet the Neighbours occurs**, regardless of current Elven relation. It is therefore always possible to recover from a hostile Elven relationship through territorial change.

## Relation from active Forest count

| Active Forests | Elven relation |
|---:|---:|
| 0 | -3 |
| 1 | -2 |
| 2 | -1 |
| 3 | 0 |
| 4–5 | +1 |
| 6–8 | +2 |
| 9+ | +2, with Strategic Alliance Quest available |
| 9+ after successful Quest | +3 |

The simulation counts both revealed natural Forests and Forests still present in the unexplored terrain pool so that the initial four-forest landscape is represented before every tile is explored.

## Positive effects

### +1 — Elven forest management

Each productive Forest changes its output by:

- **-1 Raw Wood**;
- **+1 Raw Food**.

### +2 — Advanced symbiosis

Retain the +1 effects, and each productive Forest also provides:

- **+1 Raw Textile material** (wool/silk-equivalent input, not finished Textiles).

### +3 — Strategic Alliance

Triggered Quest at 9+ Forests. The thematic reward is military support from Ents / forest guardians.

The exact +Force value remains **TBD** and is not applied automatically in v0.11.19 simulation.

## Negative effects

### -1 — Resistance to deforestation

Converting a Forest into a Civic Farm costs **+1 Influence**.

### -2 — Elven harassment

Forest exploitation requires military protection:

- City Force **0–3**: Forest production **-2**;
- City Force **4–6**: Forest production **-1**;
- City Force **7+**: no production penalty.

The -1 deforestation surcharge remains cumulative.

### -3 — Open war

At the end of each Generation, the Elves convert **1 Civic Farm into a Forest**.

This normally increases the Forest count and therefore naturally moves Elven relations back toward -2, creating the intended self-correcting territorial cycle.

---

# N.4 — Gnomes

## Identity

Gnomes favour commerce, engineering and productive sophistication. They become hostile when Morneval adopts a sustained militarist orientation.

## Relation movement at end of Generation

| Military ↔ Mercantile Inclination | Relation movement |
|---|---|
| **Mercantile II** | +1, maximum +2; enables the +3 Quest when already at +2 |
| **Mercantile I** | +1, maximum +2 |
| **Neutral** | no movement |
| **Military I** | -1, but this stance alone cannot push the relation below -1 |
| **Military II** | -1, down to -3 |

Only one normal relation step occurs per Generation.

### +3 Quest

At Gnomes +2 and Mercantile II, the **Great Engineering Project** Strategic Alliance Quest becomes eligible.

## Positive effects

### +1 — Technical exchange

Unlocks **Improve Land**.

The permanent action/cost of Improve Land remains TBD. The simulation provides a rule hook that can mark a land as Gnome-improved.

### +2 — Infrastructure

Each Gnome-improved land provides **+1 Raw Resource Capacity**.

### +3 — Grand engineering alliance

Excess Raw Resources may count as Raw Food **for Population growth**.

This conversion is specifically for supporting Population growth, not for replacing ordinary Raw Food in every use case.

## Negative effects — sabotage

### -1

Morneval's **External Demand is reduced by 1** per Production Sector, minimum 0.

### -2

Each **Elder Stake** requires **1 Influence** to remain active for the Generation.

### -3

**Every active Stake** requires **1 Influence** to remain active for the Generation.

If the maintenance Influence is not paid, the Stake remains physically present and continues its normal ageing, but is **inactive for Production that Generation** rather than being destroyed.

For automated simulation only, Families pay as much required maintenance as their available Influence permits. This is an AI policy, not a tabletop priority rule.

---

# N.5 — Orcs

## Identity

Orc relations represent respect for strength. A weak Morneval is treated as a source of plunder; a strong Morneval can become a trading partner and ultimately a military ally.

## Relation movement at end of Generation

| City Force | Relation movement |
|---:|---|
| **0–2** | -1, down to -3 |
| **3–5** | no movement |
| **6+** | +1, maximum +2 |
| **9+** | +1 toward +2 and makes the Strategic Alliance Quest eligible once other requirements are met |

Only one normal relation step occurs per Generation.

### +3 Quest

Current simulation prerequisite:

- Orc relation +2;
- City Force **9+**;
- **Fortification Level III+**.

Successful Quest creates a Strategic Military Alliance and sets Orc relation to +3.

The exact Orc +Force contribution remains TBD.

## Positive effects

### +2 — Food Trading

A Family may exchange:

- **1 Influence → 1 Raw Food + 1 Prestige**.

The simulation exposes this as an explicit rule hook. Automated players do not yet choose this action.

### +3 — Military Alliance

Orcs contribute significant Force, intended to matter especially if Morneval later confronts the Mainland during an independence ending.

Exact Force value remains TBD.

## Negative effects — raids

Orcs remove current-Generation Production rather than permanently destroying Stakes or lands:

| Orc relation | Production lost to raids |
|---:|---:|
| -1 | **1** |
| -2 | **2** |
| -3 | **4** |

In the current automated simulation, raid losses are allocated after Player Actions, beginning with the sectors that would otherwise produce the most that Generation. This allocation priority is a simulation policy and can be replaced later by a tabletop choice rule.

---

# N.6 — Strategic Alliance / Quest Hooks

The simulation exposes explicit Strategic Alliance completion hooks. Quests are **not random Events**.

Current eligibility checks:

- **Elves:** relation +2, at least 9 active Forests;
- **Gnomes:** relation +2, Mercantile II;
- **Orcs:** relation +2, Force 9+, Fortification III+.

Completing the relevant Quest:

1. sets that nation to +3;
2. records the Strategic Alliance permanently;
3. triggers the one-time **Mainland -2** threshold consequence.

Automated balance batches intentionally do **not** auto-complete these Quests until the Event/Quest decision logic is designed.

---

# N.7 — Simulation Activation and Known Open Items

For v0.11.19 batch testing only:

- External Relations are automatically activated when Population first reaches **3**;
- this is only a proxy for the future **Meet the Neighbours** Event;
- the public web prototype is not routed to this engine;
- automated AI does not yet deliberately choose Reforestation, Improve Land, Orc Food Trading or Imperial Appeasement;
- Mainland Aid/Demand modifiers remain numerically TBD;
- exact +3 Alliance bonuses remain TBD;
- exact Improve Land action cost remains TBD.

These omissions are intentional: the simulation can measure organic relation movement and negative pressure without inventing unresolved tabletop rules.
