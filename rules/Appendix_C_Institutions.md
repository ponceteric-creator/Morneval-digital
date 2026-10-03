# Appendix C — Institutions

**Status:** Consolidated institution design reference — core Tier/Agent economy updated for v0.11.12  
**Relationship to master rules:** This appendix records the current locked institution structure and the current specialization roster. Numerical values and effects explicitly marked **TBD** remain provisional.

---

## C.1 — Institution Structure

Morneval has one civic institution present from setup and four **Core Institutions** that emerge as the city develops.

| Institution | Status / appearance |
|---|---|
| **City Hall / Council** | Present from the beginning of the game. It is not currently part of the Core specialization tree; its detailed Agent gameplay remains TBD. |
| **Temple** | Core Institution. Eventually appears through Population growth; reaching **Religious I** may cause it to appear earlier. |
| **Merchant Guild** | Core Institution. Eventually appears through Population growth; reaching **Mercantile I** may cause it to appear earlier. |
| **City Guard** | Core Institution. Eventually appears through Population growth; reaching **Military I** may cause it to appear earlier. |
| **Scholars’ Collegium** | Core Institution. Eventually appears through Population growth; reaching **Arcane I** may cause it to appear earlier. |

Exact Population thresholds remain **TBD**.

Once created, a Core Institution remains part of Morneval. Its Tier may subsequently be increased through direct Institution development.

---

## C.2 — Core Institution Tiers and Agents

Each Core Institution has **three Tiers: I, II and III**.

There is **no Agent-slot limit tied to Tier**. Agents are persistent political/institutional investments, not worker-placement pieces. They remain embedded in the Institution rather than being exhausted to take actions.

A Family represented by at least one Agent in an Institution receives that Institution's Prestige score **once per Generation**. Additional Agents do not multiply that Prestige award.

Agents generate raw Influence equal to their Seniority, but the total Influence received by one Family from one Institution is capped by that Institution's Tier:

| Core Tier | Influence cap per Family from that Institution |
|---|---:|
| **I** | **2** |
| **II** | **4** |
| **III** | **8** |

The cap is applied separately for every Family and every Institution. Once a Family has reached the Influence cap in an Institution, the only marginal benefit of adding further Agents there is **additional Intrigue-card access / card selection**.

Agent Seniority remains **1 → 2 → 3 → 3...**. It determines raw Influence and Intrigue access: draw 1 / 2 / 3 cards and keep 1 according to Seniority.

Having at least one Agent in a Core Institution also gives the Family access to eligible active Minor Institutions attached to that Core.

Control rules and tie-breaking for control remain **TBD**.

---

## C.3 — Institutional Development

Core Institutions increase Tier through direct development using the **same three-phase cost and immediate Prestige schedule as Production Sectors**. Agent count is not a prerequisite for development.

### Tier I → Tier II

| Phase | Influence | Wealth | Prestige |
|---:|---:|---:|---:|
| 1 | 2 | 0 | +4 |
| 2 | 2 | 0 | +3 |
| 3 | 2 | 0 | +2, then Tier II activates |

### Tier II → Tier III

| Phase | Influence | Wealth | Prestige |
|---:|---:|---:|---:|
| 1 | 4 | 0 | +8 |
| 2 | 4 | 0 | +6 |
| 3 | 4 | 0 | +4, then Tier III activates |

Institution Tiers contribute to structural Renown exactly like Production Tiers:

- Tier I = **0 Renown**
- Tier II = **+1 Renown**
- Tier III = **+2 Renown**

Under the current locked model, a developed Institution Tier does **not automatically decline** because Agents leave it or City Inclination later moves away. A future explicit decline/reform rule may revisit this, but no such rule is currently active.

A Core Institution does not disappear merely because the city later moves away from the Inclination that helped create it.

---

## C.4 — Minor Institutions and Specialization Capacity

Minor Institutions are **specializations of Core Institutions**. They have no Levels of their own.

A Core Institution’s specialization capacity is:

| Core Level | Active specialization capacity |
|---|---:|
| **I** | 0 Minor Institutions |
| **II** | 1 Minor Institution |
| **III** | 2 Minor Institutions |

When a new specialization slot opens, the Family controlling the parent Core Institution chooses one eligible Minor Institution associated with that Core.

Choosing one Minor Institution does **not** permanently lock out all alternatives. A Level III Core may support two different Minor Institutions. However, because each Core has five possible specializations, every city will normally leave several paths undeveloped.

Once created, a Minor Institution remains part of the city’s history. The current Tier model has no automatic Tier decline, so Dormancy from Tier loss is not active in the present rules. If a future reform/decline rule is introduced, established Minor Institutions should become Dormant rather than being destroyed unless that future rule explicitly states otherwise.

---

## C.5 — Using Minor Institutions

Minor Institutions are either **Passive** or **Activated**.

### Passive Minor Institutions

A Passive Minor Institution resolves automatically when its condition is relevant.

If the Passive Minor Institution actually produces its effect during the Generation, each Family represented by at least one Agent in the parent Core Institution gains the Minor Institution’s conditional Prestige reward.

The Prestige reward is **per Family, not per Agent**.

If the relevant event never occurs, the Minor Institution gives no conditional Prestige. Example: a Hospice gains no crisis Prestige in a Generation without Famine; if Famine would cause Population loss and the Hospice prevents that loss, represented Temple Families receive the bonus Prestige.

This intentionally creates a **“pyromaniac fireman”** incentive: Families invested in a solution may benefit politically from the problem becoming serious enough for their institution to solve it.

Exact conditional Prestige values remain **TBD**.

### Activated Minor Institutions

A Family may use an Activated Minor Institution only if it has at least one Agent in the parent Core Institution.

Agents are **not exhausted** or removed when the Minor Institution is used.

Default design rule:
- each eligible Family may normally use a given Activated Minor Institution **once per Generation**;
- the effect may also require a thematic cost;
- scalable effects may instead specify a printed cap.

Specific Minor Institutions may override this rule if their design requires it.

---

# C.6 — Specialization Matrix

Each Core Institution has five possible specialization themes:

1. **Population** — supports population survival, provisioning, growth or urban sustainability.
2. **Renown** — makes Morneval famous through that Institution’s characteristic form of prestige.
3. **Force** — contributes military/defensive power through a distinct mechanism.
4. **Civic Order** — controls Criminality or reduces its consequences.
5. **Shadow** — provides powerful illicit/forbidden rule-bending effects at a dangerous cost.

The Shadow branch is deliberately designed as a **temptation**: it should let Families break or bend a normal game constraint rather than merely provide another numerical bonus.

---

## C.7 — Population Specializations — LOCKED

| Core Institution | Minor Institution | Effect |
|---|---|---|
| **Temple** | **Hospice** | Prevent **1 Population loss caused by Famine**. |
| **Merchant Guild** | **Provisioners’ Guild** | Allows excess supply to be **stored from one Generation to the next**. Exact storage limits/details remain TBD. |
| **City Guard** | **Civic Watch / Patrols** *(name provisional)* | Prevent **1 Squalor generated by Population**. |
| **Scholars’ Collegium** | **Medical School** | Prevent **1 Population loss caused by Disease**. |

These are primarily Passive Minor Institutions and therefore earn conditional Prestige only when their protective effect actually resolves.

---

## C.8 — Renown Specializations — IDENTITY LOCKED, EXACT EFFECTS TBD

| Core Institution | Minor Institution | Renown identity |
|---|---|---|
| **Temple** | **Pilgrimage Shrine** | Religious fame / pilgrimage. |
| **Merchant Guild** | **Grand Bazaar / Trade Fair** *(final name TBD)* | Commercial fame and attraction. |
| **City Guard** | **Military Order** | Martial reputation and military prestige. |
| **Scholars’ Collegium** | **Great Library** | Intellectual reputation and learned prestige. |

The design intent is that each should generate Renown because the city is genuinely accomplishing something associated with that Institution, rather than simply providing an unconditional flat Renown bonus. Exact triggers and values remain **TBD**.

---

## C.9 — Force Specializations — LOCKED CONCEPTS

### Temple — Templar Knights

**Templar Knights** provide Force in proportion to the city’s **Religious Inclination**, with no Wealth cost.

Their strength is offset by **intolerance**, which damages diplomatic relations and/or relations with culturally or religiously incompatible External Powers. Exact diplomatic targets and penalties remain **TBD**.

### Merchant Guild — Mercenary Company

The **Mercenary Company** converts Wealth capacity into temporary Force:

> **1 Wealth spent = +1 Force**

The conversion is scalable up to a printed maximum. Exact cap remains **TBD**. Force is temporary and must be funded again in later Generations.

### City Guard — Conscription Office

The **Conscription Office** mobilizes Morneval’s population as military manpower.

Its effect is deliberately double-edged:
- if Morneval has sufficient **Food surplus**, conscription provides Force without an additional civic penalty;
- if there is no surplus / Food is strained, conscription still provides Force but creates additional **Squalor and/or Unrest**.

Exact Force amount, cap and penalty remain **TBD**.

### Scholars’ Collegium — Sapper Academy

The **Sapper Academy** provides **defensive Force only**, representing fortification, engineering and prepared defences. It applies when Morneval is defending against external attack rather than as general-purpose offensive Force.

Exact defensive bonus remains **TBD**.

---

## C.10 — Civic Order / Criminality Specializations — LOCKED

These Minor Institutions deliberately attack different stages of the Criminality problem rather than all simply reducing the Criminality track.

| Core Institution | Minor Institution | Effect |
|---|---|---|
| **Temple** | **Almoners’ Order** | Prevent **1 Food Supply loss caused by Criminality**. |
| **Merchant Guild** | **Guild Wardens** | Prevent **1 non-Food Supply loss caused by Criminality**. |
| **City Guard** | **Constabulary** | Directly reduce **Criminality by 1**. |
| **Scholars’ Collegium** | **College of Magistrates** | Prevent **1 Criminality increase caused by Squalor**. |

These are intended primarily as Passive Minor Institutions. Conditional Prestige is earned when the Institution actually prevents or suppresses the relevant Criminality effect.

---

## C.11 — Shadow Specializations — LOCKED IDENTITIES

Shadow Minor Institutions provide powerful ways to bend normal rules but should carry meaningful costs, risks or damage to Morneval.

### Temple — Dark Cult

The **Dark Cult** allows access to unholy power through pacts, sacrifices or bargains with demons. It should permit unusually powerful effects in exchange for serious civic or Family consequences.

Exact powers and costs remain **TBD**.

### Merchant Guild — Thieves’ Guild

The **Thieves’ Guild** represents smuggling, fencing, black markets and illicit commercial networks. Its design role is to **break or bypass normal economic constraints** rather than merely generate more Wealth.

Exact activated effects remain **TBD**.

### City Guard — Assassin Guild

The **Assassin Guild** provides coercive removal of rival Family presence. Its primary design role is to forcibly remove or displace:
- rival **Agents**;
- rival **Production Stakes / Interests**.

Such actions should carry an appropriate cost and/or civic consequence. Character assassination is governed separately and is intended to be harder and riskier.

Exact costs, chances and consequences remain **TBD**.

### Scholars’ Collegium — Necromancers

The **Necromancers** allow Elders to remain in position beyond their normal generational tenure.

The benefit must come at the expense of the younger generation: the old remain powerful by obstructing, consuming or sacrificing the city’s/family’s generational renewal. Exact implementation remains **TBD**.

---

## C.12 — Current Institution Roster at a Glance

| Core | Population | Renown | Force | Civic Order | Shadow |
|---|---|---|---|---|---|
| **Temple** | Hospice | Pilgrimage Shrine | Templar Knights | Almoners’ Order | Dark Cult |
| **Merchant Guild** | Provisioners’ Guild | Grand Bazaar / Trade Fair | Mercenary Company | Guild Wardens | Thieves’ Guild |
| **City Guard** | Civic Watch / Patrols | Military Order | Conscription Office | Constabulary | Assassin Guild |
| **Scholars’ Collegium** | Medical School | Great Library | Sapper Academy | College of Magistrates | Necromancers |

---

## C.13 — Items Still Requiring Design Completion

The following institution rules remain intentionally open:

- exact Population thresholds for automatic creation of the four Core Institutions;
- exact effect of matching City Inclination on early creation timing;
- tie-break procedure for control of Core Institutions;
- Knowledge cap per action/check and Prestige conversion rate, if Knowledge remains in the final design;
- final names for **Civic Watch / Patrols** and **Grand Bazaar / Trade Fair**;
- exact Renown-specialization triggers and values;
- detailed effects/costs of the four Shadow specializations;
- caps and numerical values for Mercenaries, Conscription, Sappers and Templars;
- any future explicit Institution decline/reform procedure;
- City Hall Agent gameplay and whether City Hall eventually develops its own civic branches.

The following are **no longer TBD** as of v0.11.12: Core Institution development costs, Tier Renown contribution, Agent Influence caps, Agent slot limits (none tied to Tier), and Institution Prestige being scored once per represented Family rather than per Agent.
