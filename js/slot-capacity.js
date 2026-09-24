/* Morneval v0.3.1 — Production Sector slot correction.
 * Each Sector level contributes THREE age-specific Stake slots:
 * one Young, one Mature, and one Elder.
 * Thus a Tier N Sector has N Young + N Mature + N Elder slots (3N total).
 */

const AGE_ORDER = ["young", "mature", "elder"];
const AGE_LABEL = { young: "Young", mature: "Mature", elder: "Elder" };

function injectSlotStyles() {
  if (document.querySelector("#morneval-slot-styles")) return;
  const style = document.createElement("style");
  style.id = "morneval-slot-styles";
  style.textContent = `
    .stake-capacity { margin: 2px 0 12px; padding: 10px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,.34); }
    .stake-capacity-title { display:flex; justify-content:space-between; gap:10px; align-items:baseline; font-size:12px; font-weight:700; margin-bottom:8px; }
    .stake-capacity-total { color:var(--muted); font-weight:600; }
    .stake-capacity-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
    .stake-slot-age { padding:8px 6px; border:1px solid var(--line); border-radius:9px; text-align:center; background:var(--paper); }
    .stake-slot-age b { display:block; font-size:13px; text-transform:capitalize; }
    .stake-slot-age span { display:block; margin-top:2px; font-size:11px; color:var(--muted); }
    .stake-slot-age.over { border-color:#a54b3e; background:#fff1ee; }
    .slot-rule-note { margin-top:7px; font-size:11px; color:var(--muted); line-height:1.35; }
  `;
  document.head.appendChild(style);
}

function annotateSectorCard(card) {
  const tierSelect = card.querySelector("[data-tier-sector]");
  if (!tierSelect) return;
  const tier = Math.max(1, Number(tierSelect.value) || 1);

  const counts = {};
  for (const age of AGE_ORDER) counts[age] = card.querySelectorAll(`.stake.${age}`).length;

  let block = card.querySelector(".stake-capacity");
  if (!block) {
    block = document.createElement("div");
    block.className = "stake-capacity";
    const productionHeading = [...card.querySelectorAll("div")]
      .find((el) => el.textContent?.trim() === "Production Stakes");
    const target = productionHeading?.parentElement;
    if (target) card.insertBefore(block, target);
    else card.appendChild(block);
  }

  const totalOccupied = AGE_ORDER.reduce((sum, age) => sum + counts[age], 0);
  const totalCapacity = tier * 3;
  block.innerHTML = `
    <div class="stake-capacity-title">
      <span>Stake slots</span>
      <span class="stake-capacity-total">${totalOccupied}/${totalCapacity} occupied</span>
    </div>
    <div class="stake-capacity-grid">
      ${AGE_ORDER.map((age) => `
        <div class="stake-slot-age ${counts[age] > tier ? "over" : ""}">
          <b>${AGE_LABEL[age]}</b>
          <span>${counts[age]}/${tier}</span>
        </div>`).join("")}
    </div>
    <div class="slot-rule-note">Each Sector level adds one Young, one Mature and one Elder slot.</div>
  `;
}

function applySlotCorrectionUI() {
  injectSlotStyles();
  document.querySelectorAll(".sector-card").forEach(annotateSectorCard);
  const subtitle = document.querySelector(".brand p");
  if (subtitle && subtitle.textContent?.includes("Engine v0.3")) {
    subtitle.textContent = "Economic diagnostic prototype · Engine v0.3.1";
  }
}

let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    applySlotCorrectionUI();
  });
});

observer.observe(document.documentElement, { childList: true, subtree: true });
applySlotCorrectionUI();
