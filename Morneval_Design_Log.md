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

The user described this as a higher **Prestige cost**. This needs one later rules confirmation because the current core rules state that Prestige is normally accumulated rather than spent. The v0.4 diagnostic sandbox therefore lets ownership be changed to simulate replacement, but deliberately charges no game resource yet.

The replacement's treatment of age/seniority is also still to be finalized. In v0.4, changing the owner of a Stake preserves that Stake's current age and placement order solely so economic consequences can be stress-tested without committing the final replacement rule.

## 24 September 2026 — Diagnostic sandbox v0.4

The browser prototype now permits direct testing edits to:
- Production Stake owner
- Production Stake age
- adding/removing Stakes within age-specific slot capacity
- raw-resource Stake owner
- raw-resource base capacity
- raw-resource capacity modifier

These direct edits are diagnostic controls, not player actions, and therefore do not spend Influence or Prestige.
