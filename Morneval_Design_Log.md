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

## 25 September 2026 — Scalable demand and differentiated Wealth (v0.6)

**Design direction implemented for balancing:** the three demand categories no longer need to remain fixed as the city develops.

- **Population demand** continues to scale from Population using sector-specific divisors.
- **Institution demand** now scales from the sum of Institution levels using sector-specific divisors.
- **External demand** now scales from city Renown using sector-specific divisors.

The sandbox includes three prototype Institutions — Merchant Guild, City Guard and Temple — only to provide Institution levels for demand testing. Their unique powers and scoring are not implemented yet.

### Institution development cap

For prototype testing, the sum of Institution levels cannot be **increased** above current Population.

If Population subsequently falls below the existing total Institution levels, Institutions are not automatically destroyed. The city is instead flagged as over-cap and further Institution development is blocked. This avoids inventing an Institution-loss rule before that mechanism is designed.

### Wealth by customer category

Prototype Wealth per unit served is now:
- Population: **0 Wealth**
- Institutions: **1 Wealth**
- External Markets: **2 Wealth**

These values are editable playtest parameters.

Stake seniority still determines which Stakes are served first. Each served Stake is paired with the demand category actually receiving that unit of production, so City Inclination can directly alter Family Wealth by changing which market receives scarce goods first.

### Still provisional

The exact demand divisors, Wealth values and Institution cap mechanism remain subject to balancing. Renown is manually editable in v0.6 because its automatic growth rules are not yet defined.

## 25 September 2026 — Production is generated by Stakes (v0.6.1)

**Locked correction:** each Production Stake represents exactly **1 unit of supply** and can satisfy exactly **1 unit of demand / one need**.

Sector tier does not itself create production. It creates capacity for Stakes:
- Tier I can contain up to 3 Stakes (1 Young, 1 Mature, 1 Elder)
- Tier II up to 6 Stakes
- Tier III up to 9 Stakes

Therefore, if a Sector contains one Young, one Mature and one Elder Stake, it has **3 units of potential supply**, subject to sufficient raw-resource capacity.

Actual Sector supply is now:

**min(number of occupied Production Stakes, raw-resource capacity)**

with the Sector's tier/age-slot rules limiting how many Stakes may legally exist.

This fixes the earlier prototype error where supply was incorrectly capped directly at the Sector tier (1/2/3), which meant three Stakes could incorrectly satisfy only one need in a Tier I Sector.
