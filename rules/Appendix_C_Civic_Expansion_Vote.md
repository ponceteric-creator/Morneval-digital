# Appendix C — Civic Expansion Vote (v0.8.9)

**Status:** current design reference for urban expansion and its automated-test implementation.  
**Supersedes:** the automatic-expansion procedure previously described in Appendix B sections B.12–B.13.

## C.1 — Core principle

Urban expansion is a **political decision**, not an automatic consequence of Population growth.

Morneval begins with 1 Urban tile. Each Urban tile supports **3 Population**.

When Population reaches or exceeds current Urban capacity, a Family may propose that the city absorb one additional Hinterland territory.

At most **one expansion proposal / vote** may occur in a Generation.

If no proposal passes, Morneval does not expand. Population may therefore exceed Urban capacity and generate Overcrowding/Squalor over multiple Generations.

## C.2 — Eligible proposal

A civic expansion proposal is available when:

- `Population ≥ current Urban capacity`; and
- at least one explored, non-Urban Hinterland territory remains.

The territory that would be absorbed is known before the vote: the city always targets the **oldest explored non-Urban territory**, according to exploration order.

This retains the existing abstract spatial model in which the earliest explored territory is treated as the closest to the original settlement.

## C.3 — Proposal and vote

The proposing Family must commit at least **1 Influence in favour of YES**.

Each Family may then vote:

- **YES**;
- **NO**;
- **Abstain**.

A Family voting YES or NO contributes **1 base vote** to that side and may spend additional Influence to increase the strength of that side.

**Vote strength = 1 base vote + Influence spent.**

Influence committed to the vote is spent whether that side wins or loses.

The proposal passes only if:

**YES > NO**

A tie therefore fails and preserves the status quo.

## C.4 — Result of a successful vote

If the proposal passes:

- Morneval absorbs exactly **1** Hinterland territory;
- that territory is the oldest explored non-Urban territory;
- the current owner, if any, loses control;
- no compensation is paid;
- all Raw-resource production on that territory is permanently lost;
- the territory becomes Urban permanently;
- Urban capacity increases by **+3 Population**.

No second expansion may occur during the same Generation.

## C.5 — Failed or absent vote

If the vote fails, ties, or no Family proposes expansion:

- Urban capacity does not change;
- no territory is absorbed;
- Overcrowding remains possible;
- Squalor continues to be calculated normally from current Overcrowding plus unmet City demand.

This creates a deliberate strategic choice between preserving productive Hinterland and accepting demographic/urban pressure.

## C.6 — Civic Farms and expansion

A Civic Farm is public property of Morneval and may still be the next territory in exploration order.

If expansion would absorb a Civic Farm, its **2 Raw Food capacity is lost** permanently. The vote therefore creates a direct trade-off between Urban capacity and Food security.

If removing that Farm leaves insufficient local Raw Food, Imperial Food aid and its existing consequences apply normally.

## C.7 — Automated-player heuristic — prototype only

The digital AI uses a heuristic to decide whether to propose, support or oppose expansion. This heuristic is **not a tabletop rule**.

The AI currently considers:

- relief of existing Overcrowding;
- the value of creating headroom when Population already equals Urban capacity;
- loss of general raw-production capacity;
- a stronger penalty when its own private productive territory would be absorbed;
- Food-security consequences when the target is a Civic Farm;
- the existing cost of Influence committed to the vote.

AI Families may spend additional Influence when their estimated stake in the result is high.

The digital implementation suppresses the legacy automatic end-of-Generation expansion so the civic vote is the **only** route to a new Urban tile.

## C.8 — Current test objective

The v0.8.9 test is intended to determine whether political control of expansion breaks the previous feedback loop:

`Population growth → automatic expansion → productive/Farm loss → new Farm conversion → more Population growth`.

The key metrics to observe are:

- number of Civic Farms after 10, 20 and 30 Generations;
- Population versus Urban capacity;
- frequency of successful and failed expansion votes;
- amount of Influence spent on expansion politics;
- frequency of Civic Farm destruction through expansion;
- whether long-term Squalor becomes a meaningful alternative to territorial loss.
