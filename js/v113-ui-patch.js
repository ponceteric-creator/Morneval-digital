import "./v112-history-fix.js?v=0.11.3-base";

const SERIES_COLORS = ["#315e43", "#815e2f", "#8b4c2e", "#4d5f7a", "#6f4d70", "#5f6840"];
let patchScheduled = false;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readInstitutionPrestige(root) {
  const heading = [...root.querySelectorAll("h2.section-title")]
    .find(node => node.textContent?.trim() === "Institutions");
  const grid = heading?.nextElementSibling;
  if (!grid) return [];

  return [...grid.querySelectorAll(".sector-card")].map(card => {
    const name = card.querySelector("h3")?.textContent?.trim() || "Institution";
    const badge = card.querySelector(".tier-badge")?.textContent ?? "0";
    const match = badge.match(/-?\d+(?:\.\d+)?/);
    return { name, value: match ? Number(match[0]) : 0 };
  }).filter(item => item.name);
}

function barChart(items, ariaLabel) {
  const W = 520, L = 160, R = 42, T = 12, row = 42;
  const H = Math.max(150, T * 2 + row * Math.max(1, items.length));
  const barWidth = W - L - R;
  const max = Math.max(1, ...items.map(item => Number(item.value) || 0));
  const rows = items.map((item, index) => {
    const y = T + index * row;
    const value = Number(item.value) || 0;
    const width = (value / max) * barWidth;
    const color = SERIES_COLORS[index % SERIES_COLORS.length];
    return `<text class="v112-bar-label" x="${L-8}" y="${y+20}" text-anchor="end">${escapeHtml(item.name)}</text><rect class="v112-bar-track" x="${L}" y="${y+6}" width="${barWidth}" height="22" rx="6"/><rect x="${L}" y="${y+6}" width="${Math.max(0, width)}" height="22" rx="6" fill="${color}"/><text class="v112-bar-value" x="${L + Math.max(0, width) + 6}" y="${y+21}">${value}</text>`;
  }).join("");
  return `<svg class="v112-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(ariaLabel)}">${rows}</svg>`;
}

function patchInstitutionPrestige(root) {
  const grid = root.querySelector("[data-v112-dashboard] .v112-dashboard-grid");
  if (!grid) return;

  const prestige = readInstitutionPrestige(root);
  let card = grid.querySelector("[data-v113-institution-prestige]");
  if (!card) {
    card = document.createElement("article");
    card.dataset.v113InstitutionPrestige = "true";
    card.className = "panel v112-dashboard-card";
    grid.append(card);
  }

  const html = `<div class="chart-head"><h3>Institution Prestige</h3><span>current Prestige value by Institution</span></div>${barChart(prestige, "Current Prestige value by Institution")}`;
  if (card.innerHTML !== html) card.innerHTML = html;
}

function patchUi() {
  const root = document.querySelector("#app");
  if (!root) return;
  document.title = "Morneval — Influence Development Economy v0.11.3";
  patchInstitutionPrestige(root);
}

function schedulePatch() {
  if (patchScheduled) return;
  patchScheduled = true;
  requestAnimationFrame(() => {
    patchScheduled = false;
    patchUi();
  });
}

const app = document.querySelector("#app");
if (app) {
  const observer = new MutationObserver(schedulePatch);
  observer.observe(app, { childList: true, subtree: true });
}

document.addEventListener("click", schedulePatch);
document.addEventListener("change", schedulePatch);
patchUi();
