# Appendix N — External Relations Tracks (v0.11.21 Simulation)

**Status:** simulation implementation of the currently agreed External Relations structure.  
**Scope:** Elves, Gnomes, Orcs and Mainland.  
**Important:** the Event deck is not yet implemented. In automated batches, Population 3 is used only as a stand-in trigger for the future **Meet the Neighbours** Event.

---

## N.1 — General Structure

After **Meet the Neighbours**, External Relations become active.

Relations use a track from **-3 to +3**.

For Elves, Gnomes and Orcs:

- **+1 / +2** can be reached through structural behaviour;
- **+3** represents a **Strategic Alliance** and is never reached automatically;
- +3 requires a dedicated triggered Quest.

External Relations are not raised by a generic Diplomacy action. Events may modify relations directly once the Event system is implemented.

---

## N.2 — Mainland Pressure from Foreign Alignment

Mainland starts at **+2** when External Relations are activated.

For each foreign nation independently:

- first time it reaches **+2**: Mainland **-1**;
- first time it reaches **+3**: Mainland **-2 additional**.

Each threshold consequence happens once only. Falling below and later recovering does not repeat the penalty and never refunds Mainland relation.

### Imperial Appeasement

One Family may perform **Imperial Appeasement**:

- 1 normal Player Action;
- **4 Influence**;
- Mainland **+1**, maximum +3;
- only **one Imperial Appeasement total per Generation**.

Exact numeric Mainland effects on Imperial Aid / Imperial Demand remain TBD.

---

# N.3 — Elves

## Identity

Elven relations measure Morneval's treatment of the forest and its willingness to adopt a forest-based way of life.

**Reforestation** is available as soon as Meet the Neighbours occurs, regardless of current Elven relation.

### Reforestation action

- 1 normal Player Action;
- **2 Influence**;
- target any revealed non-Urban land owned by the acting Family or by the City/public;
- convert it permanently into a Forest;
- acting Family gains **+1 Prestige**.

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

The simulation counts both revealed natural Forests and Forests still present in the unexplored terrain pool for the diplomatic track.

## Positive effects

### +1 — Elven forest management

Each productive Forest changes its output by:

- **-1 Raw Wood**;
- **+1 Raw Food**.

### +2 — Woodland Settlements

Retain +1 effects. In addition:

- each productive Forest provides **+1 Raw Textile material**;
- each active Forest provides **+1 Population Capacity**.

### +3 — One with the Forest

Strategic Alliance effects:

- each productive Forest provides **2 Raw Food total**;
- each active Forest provides **+2 Population Capacity total**;
- retain the +1 Raw Textile material per productive Forest;
- **9–11 Forests: +4 Force**;
- **12 Forests: +5 Force**.

The Population Capacity represents people living in woodland settlements rather than conventional Urban districts.

## Strategic Alliance Quest — One with the Forest

The Quest may be completed only when all three conditions are fulfilled:

1. **9+ Forests**;
2. **0 Farms** remaining in Morneval's territory;
3. **Study the Elf Ways:** **10 Influence** spent cumulatively.

### Study the Elf Ways

- contribution costs 1 normal Player Action;
- a Family must have at least **1 Agent in the Scholarium** to contribute;
- spend **1–2 Influence per action**;
- maximum **2 Influence per action**;
- contributions remain recorded across Generations.

When the Study condition completes:

- every Family that contributed at least 1 Influence receives **+1 Prestige** when the Quest completes;
- the Family with the highest total contribution receives **+1 additional Prestige**;
- in a tie for highest contribution, all tied highest contributors receive the additional +1 Prestige in the simulation.

### Quest completion

When all three conditions are met and the Quest resolves:

- Elves become **+3**;
- Mainland takes its one-time **-2** Strategic Alliance consequence;
- Morneval gains **+2 permanent Renown**;
- that +2 Renown counts toward the normal **12 Renown endgame trigger**;
- One with the Forest effects become active.

The +2 Renown represents the major political signal created by Morneval's transformation and partially compensates for the lower Population Renown expected from the Elven development path.

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

---

# N.4 — Gnomes

## Relation movement

| Military ↔ Mercantile Inclination | Relation movement |
|---|---|
| **Mercantile II** | +1, maximum +2; enables +3 Quest at +2 |
| **Mercantile I** | +1, maximum +2 |
| **Neutral** | no movement |
| **Military I** | -1, floor -1 from this stance alone |
| **Military II** | -1, down to -3 |

Only one normal relation step occurs per Generation.

## Positive effects

### +1 — Technical Exchange / Improve Land

**Improve Land:**

- 1 normal Player Action;
- **2 Influence**;
- target a revealed non-Urban land owned by the acting Family or City/public;
- gain **+1 Prestige**;
- land gains **+1 permanent Production**.

A standard Capacity-2 land therefore becomes Capacity 3.

### +2 — Engineering Partnership

Every Gnome-improved land receives **+1 additional Production while Gnome relation is +2 or +3**.

A standard improved land therefore produces:

- base 2;
- +1 permanent Improvement;
- +1 active Gnome partnership;
- **total 4** at Gnomes +2/+3.

If relations fall below +2, the permanent Improvement remains but the partnership bonus disappears.

### +3 — Grand Engineering Alliance

Excess Raw Resources may count as Raw Food specifically for Population growth. Exact final restrictions remain subject to playtest.

## Negative effects

- **-1:** External Demand reduced by 1 per Production Sector, minimum 0.
- **-2:** each Elder Stake requires 1 Influence to remain active for the Generation.
- **-3:** every active Stake requires 1 Influence to remain active for the Generation.

Unpaid Stakes remain physically present and age normally but are inactive for Production that Generation.

---

# N.5 — Orcs

## Relation movement

| City Force | Relation movement |
|---:|---|
| **0–2** | -1, down to -3 |
| **3–5** | no movement |
| **6+** | +1, maximum +2 |
| **9+** | +1 toward +2 and makes the +3 Quest eligible when other requirements are met |

Only one normal relation step occurs per Generation.

### +2 — Food Trading

A Family may exchange:

- **1 Influence → 1 Raw Food + 1 Prestige**.

### +3 — Military Alliance

Current Quest prerequisite:

- Orc relation +2;
- Force 9+;
- Fortification III+.

Exact Orc alliance Force contribution remains TBD.

### Negative raids

| Orc relation | Production lost |
|---:|---:|
| -1 | 1 |
| -2 | 2 |
| -3 | 4 |

Raid losses remove current-Generation Production rather than destroying Stakes or land.

---

# N.6 — Simulation Notes

For v0.11.21 batch testing:

- Raw Food subsistence is **2 Raw Food per Population**;
- External Relations activate at Population 3 only as a stand-in for Meet the Neighbours;
- the public web prototype is not routed to this engine;
- automated AI does not yet deliberately choose Reforestation, Improve Land, Orc Food Trading, Imperial Appeasement or Study the Elf Ways;
- Strategic Alliance Quests are therefore not auto-completed in ordinary A/B batches;
- a deterministic Elven Quest smoke test verifies the full +3 completion path separately;
- exact Mainland Aid/Demand modifiers remain TBD;
- exact Orc +3 alliance Force remains TBD.
