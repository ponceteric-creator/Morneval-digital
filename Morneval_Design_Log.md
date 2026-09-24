# Morneval Design Log

## 24 September 2026 — Production Sector Stake slots

**Correction:** A Production Sector level does not provide one total Stake slot.

Each Sector level provides **three age-specific Stake slots**:
- 1 Young slot
- 1 Mature slot
- 1 Elder slot

Therefore a Tier N Production Sector has:
- N Young slots
- N Mature slots
- N Elder slots
- **3 × N total Stake slots**

Examples:
- Tier I: 3 total slots (1 Young, 1 Mature, 1 Elder)
- Tier II: 6 total slots (2 Young, 2 Mature, 2 Elder)
- Tier III: 9 total slots (3 Young, 3 Mature, 3 Elder)

New ordinary Stakes enter as Young. At generation end, Elder Stakes leave, Mature Stakes become Elder, and Young Stakes become Mature.

This supersedes the earlier prototype interpretation of “1 Stake slot per Sector level” as one total slot per level.

## 24 September 2026 — Replacing an existing Stake

**Locked principle:** replacing an occupied Stake is more expensive than taking an empty slot.

The exact numerical premium remains a playtest parameter.

The user described this as a higher **Prestige cost**. This needs one later rules confirmation because the current core rules state that Prestige is normally accumulated rather than spent. The v0.4/v0.5 diagnostic sandbox therefore lets ownership be changed to simulate replacement, but deliberately charges no game resource yet.

The replacement's treatment of age/seniority is also still to be finalized. In the diagnostic sandbox, changing the owner of a Stake preserves that Stake's current age and placement order solely so economic consequences can be stress-tested without committing the final replacement rule.

## 24 September 2026 — Productive raw-resource land Prestige

**Locked rule implemented:** a Family gains **1 Prestige per controlled raw-resource land whose production is actually used by a Production Sector during the Generation**.

Potential unused capacity does not score. Previewing the economy shows the prospective award, but cumulative Prestige is only changed when the Generation is advanced, preventing repeated preview clicks from scoring repeatedly.

## 24 September 2026 — Diagnostic sandbox v0.4

The browser prototype permits direct testing edits to:
- Production Stake owner
- Production Stake age
- adding/removing Stakes within age-specific slot capacity
- raw-resource Stake owner
- raw-resource base capacity
- raw-resource capacity modifier

These direct edits are diagnostic controls, not player actions, and therefore do not spend Influence or Prestige.

## 24 September 2026 — Generational balance sandbox v0.5

The prototype now supports resolving successive Generations and records a Generation History so long-term city behaviour can be inspected.

The following are **temporary balancing rules**, not locked Morneval rules:
- Population demand can be generated automatically from current Population.
- Food Population demand uses a divisor of 2; Textiles and Smithing use a divisor of 6.
- Full Food Population demand causes Population +1.
- Any unmet Food Population demand causes Population -1 through famine.
- Squalor target is ceil(Population / 3), with +1 target Squalor when Food is unmet.
- Squalor moves by at most 1 toward its target per Generation.
- Disease probability is 0%, 0%, 5%, 10%, 20%, 35%, 50% at Squalor 0–6+ respectively.
- Disease causes 1 Population loss.

Disease uses a deterministic seeded pseudo-random sequence so identical test setups can be reproduced during balancing.

Order, Force, city Economic Strength and Renown remain unchanged automatically until their update rules are designed.
