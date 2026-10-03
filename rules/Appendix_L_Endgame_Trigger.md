# Appendix L — Endgame Trigger

Status: **v0.11.15 locked trigger rule**. The detailed resolution of the three ending paths remains a separate design layer.

## L.1 — Structural Renown trigger

Morneval enters its endgame when the city reaches **12 structural Renown**.

The threshold is checked **at the end of a Generation**, using the final structural Renown value after that Generation has resolved.

Reaching 12 Renown does **not** immediately end the game. It opens the endgame / closing phase beginning with the following Generation.

The trigger is **irreversible**: once Morneval has reached the 12-Renown threshold and the endgame has opened, a later reduction in Renown does not close or reset the endgame.

## L.2 — Renown definition

The trigger uses the locked structural Renown formula from Appendix H:

**Renown = floor(Population / 2) + Production Tier contribution + Institution Tier contribution + qualifying Permanent contribution.**

Tier contributions remain:

- Tier I = 0 Renown
- Tier II = +1 Renown
- Tier III = +2 Renown

Each qualifying Permanent Intrigue card that provides +1 Wealth contributes +1 city Renown while it remains in play.

## L.3 — Endgame resolution status

The 12-Renown threshold is now locked as the **opening trigger** for the endgame.

The existing design direction remains three political outcomes for Morneval:

1. remain aligned with the Mainland;
2. resist the Mainland with the support of a foreign power;
3. become fully independent.

The exact closing-window duration, declaration procedure and final Prestige bonuses for those endings are not defined by this appendix and should not be inferred from the trigger itself.

## L.4 — Digital simulation

The digital engine records the first Generation in which structural Renown reaches or exceeds 12.

The current automated simulation marks the endgame as triggered but does not automatically resolve one of the three ending paths. A simulation may therefore stop at 12 Renown for duration/balance studies, or continue beyond the trigger to study the prospective closing phase.
