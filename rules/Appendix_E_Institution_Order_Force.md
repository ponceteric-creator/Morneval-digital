# Appendix E — Institution Prestige, Order, Force & Imperial Intervention

Status: **v0.10.2 reference**. Institution and Force formulas below remain active. For current Order and Imperial Intervention timing/scaling, Appendix F supersedes Sections 7–9 where they conflict. For Agent placement, Wealth commitment, seniority and Influence income, see Appendix G.

## 1. Institution Prestige — universal rule

At the end of every Generation, each major Institution calculates one public **Institution Prestige score**, whether or not any Family has Agents there.

For each Family:

**Prestige gained = Institution Prestige score × number of that Family's Agents in the Institution.**

As of v0.10.2, Agent placement and persistence are automated. Each deployed Agent reserves 1 Wealth, enters at Seniority 1, generates seniority-based Influence at Generation end, and persists until recalled. Full Agent rules are defined in [`Appendix_G_Institution_Agents.md`](./Appendix_G_Institution_Agents.md).

## 2. City Guard

The City Guard represents internal security, military readiness, fortifications and later crisis achievements.

Current score:

**City Guard Prestige = Order component + Readiness component**, capped at **4**.

### Order component

- Order 0–1: **0**
- Order 2: **+1**
- Order 3–4: **+2**

### Readiness component

- Force < `ceil(Population / 3)`: **0**
- Force ≥ `ceil(Population / 3)`: **+1**
- Force ≥ `ceil(Population / 2)`: **+2**

These readiness thresholds are a **simulation tuning parameter** until threat/event benchmarks exist.

Future Events may add punctual City Guard achievements such as repelling raids or controlling unrest. They are not implemented in v0.10.2.

## 3. Temple

The Temple represents religious legitimacy plus notarial, administrative and social-cohesion functions.

**Temple Prestige = Religious Inclination + Civic Coherence**, capped at **4**.

### Religious Inclination

- Religion II: **+2**
- Religion I: **+1**
- Neutral / Arcane: **0**

### Civic Coherence

- Squalor = 0: **+2**
- Squalor ≤ `floor(Population / 3)`: **+1**
- otherwise: **0**

Future Events may add contextual Temple achievements. They are not implemented in v0.10.2.

## 4. Merchant Guild

The Merchant Guild scores city-wide external commerce rather than any one Family's private Wealth.

Let:

- `External served` = total External demand served across Textiles, Smithing and Construction Materials;
- `External unmet`, `Population unmet`, `Imperial unmet` = corresponding unmet totals.

Base:

**Raw score = 2 × External served − penalty**

Penalty depends on Military ↔ Commercial Inclination:

- Military II: `External unmet + 2 × Population unmet`
- Military I: `External unmet + Population unmet`
- Neutral: `External unmet + Imperial unmet`
- Commercial I: `ceil(External unmet / 2)`
- Commercial II: `floor(External unmet / 3)`

Final Merchant Guild Prestige:

**`min(4, max(0, raw score))`**

## 5. Scholarium College

The Scholarium is primarily milestone-driven. It has **no Prestige cap**.

### Permanent accumulated-knowledge component

Count cumulative Production-Sector Tier increases across the three active Sectors. Each Sector can advance I→II and II→III, so the maximum is six increases.

- Arcane I: `floor(cumulative Tier increases / 4)`
- Arcane II: `floor(cumulative Tier increases / 3)`
- Neutral / Religion: **0**

### Breakthrough component

Whenever a Production Sector activates a higher Tier during the Generation:

- Tier I → Tier II: **+2 Scholarium Prestige**
- Tier II → Tier III: **+4 Scholarium Prestige**

Multiple breakthroughs in the same Generation stack. There is no cap.

Event-driven scientific or technological scoring is deferred until Events are designed.

## 6. Force

Force is approximately **70–80% structural** at mature development and the remainder demographic.

**Force = Structural Force + Manpower Force**

### Manpower Force

The city's Military ↔ Commercial Inclination determines how efficiently Population can be mobilised:

- Military II: `floor(Population / 2)`
- Military I: `floor(Population / 4)`
- Neutral: `floor(Population / 8)`
- Commercial I: `floor(Population / 16)`
- Commercial II: **0**

Manpower Force is capped at **+4**.

### Structural Force — sequential fortification track

The fortification track is sequential. Construction costs and automated build decisions are not yet defined, so v0.10.2 exposes the level as a manual benchmark control.

Current structural values are a **simulation tuning parameter**:

- None: **0**
- Palisades: **1**
- Walls: **3** cumulative
- Fortifications: **6** cumulative
- Citadel: **10** cumulative

The full track therefore gives 10 structural Force versus at most 4 Manpower Force, keeping mature Force roughly 71% structural at maximum mobilisation.

## 7. Legacy Order reference

This section records the earlier v0.10.0 model only. **Appendix F is authoritative for current Order rules.**

Earlier model: Order was a volatile persistent city characteristic on a 0–4 scale, starting at 2, losing 1 for unmet City demand and recovering toward 2. This persistent-erosion model is no longer used.

Current v0.10.2 Order is recalculated from Population-based Base Order each Generation; see Appendix F.

## 8. Chaos

When current calculated Order reaches **0**, resolve Chaos:

1. each Family loses **20% of its current Prestige, rounded up**;
2. Population growth for that Generation is cancelled;
3. Morneval loses **1 Population** where possible, respecting the minimum Population of 1;
4. **Imperial Intervention +1**;
5. displayed Order resets to **1**.

The percentage Prestige loss is intentionally asymmetric in absolute points and therefore compresses score gaps, allowing Chaos to function as a risky destabilisation/catch-up weapon.

## 9. Imperial Intervention

**Appendix F is authoritative for current Imperial Intervention scaling.**

Imperial Intervention is persistent and begins at **0**. Imperial Raw Food aid and Chaos can each add +1. There is no automatic decay.

Current production demand is:

**Imperial demand per Production Sector = floor(Imperial Intervention / Imperial Demand Threshold)**

with a default threshold of 3. See Appendix F for the complete current rule.
