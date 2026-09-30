# Appendix F — Order Recalculation & Imperial Intervention Rebalance

Status: **v0.10.2 simulation model**. This appendix supersedes the Order and Imperial Intervention timing/scaling in Appendix E where the two conflict.

## 1. Order is recalculated, not eroded persistently

Order is recalculated fresh at the end of every Generation.

**Final Order = Population-based Base Order + Generation modifiers**

Base Order:

- Population 1–3: **3**
- Population 4–14: **2**
- Population 15+: **1**

Current implemented Generation modifier:

- if any City/Population demand remains unmet across the three Production Sectors: **−1 Order once**, regardless of the number of unmet units.

Repeated unmet demand therefore does not accumulate permanent −1 damage. Example: at Population 8, two consecutive Generations with unmet City demand each resolve independently as Base Order 2 − 1 = Order 1.

The digital sandbox also exposes a **manual Order modifier** for benchmark purposes. This is not a new tabletop action; it is a test hook for future Intrigue, Event, Institution or political effects.

Order remains bounded to 0–4.

## 2. Order only gates growth from Population 15 onward

Below Population 15, there is **no independent Order ≥ 2 requirement** for Population growth. Food, Squalor and other existing growth conditions still apply normally.

From **Population 15 onward**, Population may grow only if the existing Food and Squalor requirements are met **and Final Order is at least 2**.

This creates the intended city-size pressure without producing an artificial growth wall in the middle game:

- Population 1–3 has Base Order 3;
- Population 4–14 has Base Order 2, but temporary Order 1 does not by itself cancel otherwise-valid growth;
- at Population 15+, Base Order falls to 1, so further growth requires at least +1 active Order support.

## 3. Chaos

Chaos still triggers when calculated Final Order reaches **0**.

The existing Chaos consequences remain:

- every Family loses 20% of current Prestige, rounded up;
- Population growth is cancelled;
- Morneval loses 1 Population where possible;
- Imperial Intervention +1;
- displayed Order resets to 1 after the crisis.

Because Order is recalculated next Generation, the reset to 1 is not a persistent new baseline.

## 4. Imperial Intervention begins at zero

Imperial Intervention begins at **0**.

Intervention increases by:

- **+1** each Generation in which Imperial Raw Food aid is required to feed Population, regardless of how much Food is supplied;
- **+1** each time Chaos occurs.

Both can occur in the same Generation and stack.

Imperial Intervention does not automatically decay.

## 5. Imperial demand starts at zero

There is no baseline Imperial production demand at the start of the game.

For each Production Sector:

**Imperial demand = floor(Imperial Intervention / Imperial Demand Threshold)**

The default **Imperial Demand Threshold = 3**.

Therefore, at the default threshold:

- Intervention 0–2 → demand 0 per Sector
- Intervention 3–5 → demand 1 per Sector
- Intervention 6–8 → demand 2 per Sector
- Intervention 9–11 → demand 3 per Sector

The threshold is an editable simulation parameter in the browser Test controls and has a minimum value of 1.

The existing consequence for unmet Imperial demand remains: if any Imperial demand is unmet, every Family loses 1 Prestige once for the Generation.
