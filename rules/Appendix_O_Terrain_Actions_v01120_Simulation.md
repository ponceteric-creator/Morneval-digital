# Appendix O — Diplomatic Terrain Actions (v0.11.20 Simulation)

**Status:** locked action costs/effects for the Elven Reforestation action and the Gnome Improve Land action.  
**Supersedes:** the TBD action/cost language for Reforestation / Improve Land in Appendix N.

---

## O.1 — Common action structure

Both actions use the same player-facing cost/reward structure:

- **1 normal Player Action**;
- **2 Influence** paid by the acting Family;
- the acting Family gains **+1 Prestige**;
- the target terrain must either belong to the acting Family or belong to the **City**;
- another Family's private terrain cannot be targeted;
- urban terrain is not a valid target.

---

## O.2 — Reforestation (Elves)

Reforestation is unlocked as soon as **Meet the Neighbours** has occurred. It does not require a positive Elven relation.

**Action:**

- spend 1 Player Action and 2 Influence;
- choose any eligible non-urban terrain owned by the acting Family or by the City;
- convert that terrain into a **Forest**;
- gain +1 Prestige.

The newly created Forest counts immediately toward the Elven relation thresholds.

Current thresholds remain:

- 0 Forests = -3;
- 1 = -2;
- 2 = -1;
- 3 = 0;
- 4–5 = +1;
- 6–8 = +2;
- 9+ = +2 and enables the Strategic Alliance Quest;
- successful Elven Strategic Alliance Quest = +3.

If Reforestation is the first action to make Elves reach +2, it also triggers the one-time **Mainland -1** foreign-alignment consequence.

---

## O.3 — Gnome Improve Land

Improve Land is unlocked at **Gnomes +1**.

**Action:**

- spend 1 Player Action and 2 Influence;
- choose any eligible non-urban terrain owned by the acting Family or by the City;
- that terrain receives a permanent **+1 Production / raw capacity** improvement;
- gain +1 Prestige;
- the same terrain cannot receive this improvement more than once.

The improvement remains attached to the terrain if Gnome relations later deteriorate; negative Gnome relations use the separately defined sabotage rules rather than deleting already-built infrastructure.

### Consequence for the Gnome +2 benefit

The previously proposed Gnome +2 effect — “improved lands gain +1 Capacity” — is now **redundant**, because the Improve Land action itself grants the permanent +1 Production.

Therefore that former +2 benefit must **not stack** with the new action. The Gnome +2 positive benefit is marked **TBD / to redesign** before the track is considered final.

---

## O.4 — Simulation implementation

Rule API layer: `js/v129-terrain-actions-engine.js` (`0.11.20-sim`).

The public web prototype is not routed to this layer.

At this stage the action hooks enforce ownership, Influence cost, Prestige reward and permanent terrain modification. Automated strategic valuation of these two actions remains simulation-policy work and should be calibrated separately from the tabletop rule itself.
