const SERIES_COLORS = ["#315e43", "#815e2f", "#8b4c2e", "#4d5f7a"];
const INSTITUTIONS = [
  { key: "guard", name: "City Guard" },
  { key: "temple", name: "Temple" },
  { key: "guild", name: "Merchant Guild" },
  { key: "scholarium", name: "Scholarium" },
];
let renderTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readInstitutionHistory(root) {
  const entries = [];
  for (const card of root.querySelectorAll(".history-card")) {
    const title = card.querySelector(".history-head h3")?.textContent ?? "";
    const generationMatch = title.match(/Generation\s+(\d+)/i);
    const notes = card.querySelector(".history-notes")?.textContent ?? "";
    const scoreMatch = notes.match(/Institutions:\s*Guard\s*(-?\d+(?:\.\d+)?)\s*·\s*Temple\s*(-?\d+(?:\.\d+)?)\s*·\s*Guild\s*(-?\d+(?:\.\d+)?)\s*·\s*Scholarium\s*(-?\d+(?:\.\d+)?)/i);
    if (!generationMatch || !scoreMatch) continue;
    entries.push({
      generation: Number(generationMatch[1]),
      guard: Number(scoreMatch[1]),
      temple: Number(scoreMatch[2]),
      guild: Number(scoreMatch[3]),
      scholarium: Number(scoreMatch[4]),
    });
  }
  entries.sort((a, b) => a.generation - b.generation);
  return entries;
}

function readCurrentInstitutionPrestige(root) {
  const heading = [...root.querySelectorAll("h2.section-title")]
    .find(node => node.textContent?.trim() === "Institutions");
  const grid = heading?.nextElementSibling;
  if (!grid) return [];
  return [...grid.querySelectorAll(".sector-card")].map(card => {
    const name = card.querySelector("h3")?.textContent?.trim() || "Institution";
    const badge = card.querySelector(".tier-badge")?.textContent ?? "0";
    const match = badge.match(/-?\d+(?:\.\d+)?/);
    return { name, value: match ? Number(match[0]) : 0 };
  });
}

function buildSeries(root) {
  const history = readInstitutionHistory(root);
  if (history.length) {
    return {
      labels: history.map(entry => entry.generation),
      series: INSTITUTIONS.map(def => ({
        name: def.name,
        values: history.map(entry => Number(entry[def.key]) || 0),
      })),
    };
  }
  const current = readCurrentInstitutionPrestige(root);
  return {
    labels: [0],
    series: current.map(item => ({ name: item.name, values: [Number(item.value) || 0] })),
  };
}

function lineChart(labels, series) {
  const W = 960, H = 260, L = 48, R = 18, T = 18, B = 36;
  const pw = W - L - R, ph = H - T - B;
  const values = series.flatMap(item => item.values).filter(Number.isFinite);
  const max = Math.max(1, ...values);
  const ymax = Math.max(1, Math.ceil(max * 1.15));
  const x = index => L + (labels.length <= 1 ? pw / 2 : (index / (labels.length - 1)) * pw);
  const y = value => T + ph - (value / ymax) * ph;
  let grid = "";
  for (let i = 0; i <= 4; i += 1) {
    const value = (ymax * i) / 4;
    const yy = y(value);
    grid += `<line class="v114-grid-line" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/><text class="v114-axis-label" x="${L-7}" y="${yy+4}" text-anchor="end">${Number.isInteger(value) ? value : value.toFixed(1)}</text>`;
  }
  const step = Math.max(1, Math.ceil(labels.length / 12));
  const xLabels = labels.map((label, index) => (index === labels.length - 1 || index % step === 0)
    ? `<text class="v114-axis-label" x="${x(index)}" y="${H-10}" text-anchor="middle">${label === 0 ? "Start" : `G${label}`}</text>`
    : "").join("");
  const lines = series.map((item, seriesIndex) => {
    const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
    const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
    const dots = item.values.map((value, index) => `<circle class="v114-point" cx="${x(index)}" cy="${y(value)}" r="3.5" fill="${color}"><title>${escapeHtml(item.name)} · ${labels[index] === 0 ? "Start" : `Generation ${labels[index]}`} · ${value} Prestige</title></circle>`).join("");
    return `<polyline class="v114-line" points="${points}" stroke="${color}"/>${dots}`;
  }).join("");
  return `<svg class="v114-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Institution Prestige by generation">${grid}<line class="v114-axis" x1="${L}" y1="${T}" x2="${L}" y2="${H-B}"/><line class="v114-axis" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/>${xLabels}${lines}</svg>`;
}

function legend(series) {
  return `<div class="v114-legend">${series.map((item, index) => `<span><i style="background:${SERIES_COLORS[index % SERIES_COLORS.length]}"></i>${escapeHtml(item.name)}: <b>${item.values.at(-1) ?? 0}</b></span>`).join("")}</div>`;
}

function ensureStyle() {
  if (document.querySelector("style[data-v114-standalone-style]")) return;
  const style = document.createElement("style");
  style.dataset.v114StandaloneStyle = "true";
  style.textContent = `
    .v114-institution-history { margin: -6px 0 18px; }
    .v114-institution-history .panel { min-width:0; }
    .v114-chart { width:100%; height:auto; display:block; overflow:visible; }
    .v114-grid-line { stroke:var(--line); stroke-width:1; opacity:.7; }
    .v114-axis { stroke:var(--muted); stroke-width:1; }
    .v114-axis-label { fill:var(--muted); font-size:10px; }
    .v114-line { fill:none; stroke-width:2.5; vector-effect:non-scaling-stroke; }
    .v114-point { stroke:var(--paper); stroke-width:1.5; vector-effect:non-scaling-stroke; }
    .v114-legend { display:flex; flex-wrap:wrap; gap:8px 12px; margin-top:6px; color:var(--muted); font-size:11px; }
    .v114-legend span { display:inline-flex; align-items:center; gap:5px; }
    .v114-legend i { width:10px; height:10px; border-radius:50%; display:inline-block; }
  `;
  document.head.append(style);
}

function renderInstitutionHistory() {
  renderTimer = null;
  const root = document.querySelector("#app");
  const dashboard = root?.querySelector("[data-v112-dashboard]");
  if (!root || !dashboard) return;
  ensureStyle();
  let section = root.querySelector("[data-v114-institution-history]");
  if (!section) {
    section = document.createElement("section");
    section.dataset.v114InstitutionHistory = "true";
    section.className = "v114-institution-history";
    dashboard.insertAdjacentElement("afterend", section);
  }
  const data = buildSeries(root);
  section.innerHTML = `<article class="panel"><div class="chart-head"><h3>Institution Prestige</h3><span>historical Prestige value by Institution</span></div>${lineChart(data.labels, data.series)}${legend(data.series)}</article>`;
}

function scheduleRender(delay = 0) {
  if (renderTimer !== null) clearTimeout(renderTimer);
  renderTimer = setTimeout(renderInstitutionHistory, delay);
}

window.addEventListener("load", () => scheduleRender(0));
window.addEventListener("morneval:generation-resolved", () => scheduleRender(0));
document.addEventListener("click", () => scheduleRender(0));
document.addEventListener("change", () => scheduleRender(0));

scheduleRender(0);
