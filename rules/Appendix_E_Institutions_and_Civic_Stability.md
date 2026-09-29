# Appendix E — Major Institutions & Civic Stability

Status: **v0.10.0 benchmark rules**.

This appendix records the Major-Institution Prestige model and the provisional civic-stability rules used by the digital simulation. Event-driven modifiers are deliberately deferred until the Event system is designed. Agent placement, Agent costs and the detailed fortification-construction action are also deferred; the simulation exposes Structural Force as a benchmark input and calculates Institution values independently of Agent placement.

## 1. Universal Institution Prestige rule

At the end of every Generation, each Major Institution independently calculates an **Institution Prestige score**, whether or not any Family has Agents there.

When Agent placement is active, a Family gains:

**Family Prestige gained = Institution Prestige score × number of that Family's Agents in that Institution.**

The four Major Institutions are currently:

- City Guard
- Temple
- Merchant Guild
- Scholarium College

The current digital sandbox calculates and displays all four Institution scores. It does not invent an Agent-placement rule before that system has been designed.

## 2. City Guard

The City Guard represents internal security, military readiness and the city's capacity to protect itself.

**City Guard Prestige = Order component + Readiness component, capped at 4.**

### Order component

Order is on a 0–4 track.

- Order 0–1: +0
- Order 2–3: +1
- Order 4: +2

Equivalent benchmark formula: `floor(Order / 2)`, maximum 2.

### Readiness component

Readiness compares total Force with Population.

- Force < `ceil(Population / 3)`: +0
- Force ≥ `ceil(Population / 3)`: +1
- Force ≥ `ceil(Population / 2)`: +2

Future Events may award additional contextual City Guard Prestige for achievements such as repelling attacks or suppressing major disturbances. Those bonuses are not yet implemented.

## 3. Temple

The Temple represents religion, civic legitimacy, notarial/administrative functions and social cohesion.

**Temple Prestige = Religious Inclination + Civic Coherence, capped at 4.**

### Religious Inclination

- Religion II: +2
- Religion I: +1
- Neutral: +0
- Arcane I or II: +0

### Civic Coherence

- Squalor = 0: +2
- otherwise, Squalor ≤ Population / 3: +1
- otherwise: +0

The digital implementation evaluates the one-third threshold without rounding by checking `3 × Squalor ≤ Population`.

## 4. Merchant Guild

The Merchant Guild scores the city's global external commerce rather than any one Family's private Wealth.

Start with:

**Raw Merchant Guild score = 2 × External demand served − penalty.**

Then apply a floor of 0 and a cap of 4.

The penalty depends on the Military ↔ Commercial Inclination:

| Inclination | Penalty |
| --- | --- |
| Military II | External unmet + 2 × Population unmet |
| Military I | External unmet + Population unmet |
| Neutral | External unmet + Imperial unmet |
| Commercial I | `ceil(External unmet / 2)` |
| Commercial II | `floor(External unmet / 3)` |

All served and unmet values are totals across Textiles, Smithing and Construction Materials.

## 5. Scholarium College

The Scholarium primarily rewards technological breakthroughs rather than providing a large automatic recurring score.

### Breakthrough Prestige

Whenever a Production Sector activates a higher Tier during the current Generation:

- Tier I → Tier II: +2 Scholarium Prestige
- Tier II → Tier III: +4 Scholarium Prestige

Breakthrough bonuses are cumulative if multiple sectors advance during the same Generation.

### Permanent accumulated-knowledge bonus

Count all cumulative Production-Sector Tier increases achieved so far. There are six possible increases in total across the three Production Sectors.

- Arcane I: `floor(cumulative Tier increases / 4)`
- Arcane II: `floor(cumulative Tier increases / 3)`
- Neutral or Religion: +0

The Scholarium has **no Prestige cap**.

Future scientific, magical or technological Event bonuses are intentionally deferred until the Event system is designed.

## 6. Force

Force is predominantly structural, with a smaller Population-based Manpower component.

**Total Force = Structural Force + Manpower.**

### Manpower

Manpower depends on Population and the Military ↔ Commercial Inclination and is currently capped at **+4 Force**.

| Inclination | Manpower |
| --- | --- |
| Military II | `floor(Population / 2)` |
| Military I | `floor(Population / 4)` |
| Neutral | `floor(Population / 8)` |
| Commercial I | `floor(Population / 16)` |
| Commercial II | 0 |

Apply the +4 Manpower cap after calculating the value.

### Structural Force

Structural Force will eventually come from a single sequential fortification-development track, conceptually along the lines of:

**Palisades → Walls → Fortifications → Citadel.**

The exact construction costs and Force values of those steps have not yet been locked. Until they are, the v0.10 digital sandbox exposes Structural Force as a manual benchmark input rather than inventing missing rules.

## 7. Order

Order is a **persistent but volatile** city characteristic on a 0–4 track.

Initial Order: **2**.

Order describes the city's political and social stability, not material living conditions. Squalor remains a separate characteristic.

At the end of each Generation:

- if at least one unit of Population/City demand is unmet across the three Production Sectors, Order falls by **1**, regardless of whether the total unmet demand is 1 or 10;
- if no Order loss occurs and Order is below 2, Order naturally recovers by **+1**, up to 2;
- passive recovery never raises Order above 2.

Future Events, Intrigues, Institutions and political effects may raise or lower Order directly.

There is no separate Squalor check for Order.

## 8. Chaos — Order 0

If a Generation's Order loss causes Order to reach 0, **Chaos** is triggered immediately.

Resolve all of the following:

1. Every Family loses **20% of its current Prestige, rounded up**. There is no cap on this loss. Prestige cannot fall below 0.
2. Morneval loses **1 Population**, subject to the normal minimum Population of 1.
3. Morneval cannot gain Population during that Generation. Any Population growth that would otherwise have occurred is cancelled.
4. **Imperial Intervention +1**.
5. Order resets to **1** after the Chaos resolution.

The percentage Prestige loss is intended to create a real catch-up/destabilisation weapon: a trailing Family loses less absolute Prestige than an established leader. The Population and Imperial consequences ensure that repeatedly provoking Chaos imposes a collective long-term cost.

## 9. Imperial Intervention

Imperial Intervention is persistent and currently has no automatic decay.

Each level increases Imperial demand in **every** non-Food Production Sector:

**Imperial demand per Sector = 1 + Imperial Intervention.**

Because there are three active Production Sectors, one Chaos therefore increases total Imperial demand by three units per Generation.

Reducing Imperial Intervention will later require political, diplomatic or Event-based rules. Those rules are not yet implemented.

## 10. Deferred systems

The following elements are intentionally outside the v0.10.0 benchmark implementation:

- Agent placement actions, costs, maintenance and capacity;
- exact fortification-track construction costs and Structural Force rewards;
- Event-specific Institution Prestige bonuses;
- Intrigue-driven Order changes;
- mechanisms for reducing Imperial Intervention.

These are design dependencies rather than omissions to be filled by arbitrary simulation assumptions.
