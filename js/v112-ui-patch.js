import "./v111-ui-patch.js?v=0.11.2-base";

const VERSION_TO = "0.11.2";
const snapshots = [];
let patchScheduled = false;

const SERIES_COLORS = ["#315e43", "#815e2f", "#8b4c2e", "#4d5f7a", "#6f4d70", "#5f6840"];
const INSTITUTION_LABELS = {
  city_guard: "City Guard",
  temple: "Temple",
  merchant_guild: "Merchant Guild",
  scholarium: "Scholarium",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeValue?.includes(from)) node.nodeValue = node.nodeValue.replaceAll(from, to);
  }
}

function injectStyles() {
  if (document.querySelector("style[data-v112-dashboard-style]")) return;
  const style = document.createElement("style");
  style.dataset.v112DashboardStyle = "true";
  style.textContent = `
    .v112-dashboard { margin: 14px 0 18px; }
    .v112-dashboard-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin:0 0 10px; }
    .v112-dashboard-head h2 { margin:0; font-family:Georgia,serif; font-size:23px; }
    .v112-dashboard-head span { color:var(--muted); font-size:12px; }
    .v112-dashboard-grid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:12px; align-items:stretch; }
    .v112-dashboard-card { min-width:0; }
    .v112-dashboard-card h3 { margin-bottom:2px; }
    .v112-dashboard-card .chart-head { margin-bottom:8px; }
    .v112-chart { width:100%; height:auto; display:block; overflow:visible; }
    .v112-grid-line { stroke:var(--line); stroke-width:1; opacity:.7; }
    .v112-axis { stroke:var(--muted); stroke-width:1; }
    .v112-axis-label { fill:var(--muted); font-size:10px; }
    .v112-line { fill:none; stroke-width:2.5; vector-effect:non-scaling-stroke; }
    .v112-point { stroke:var(--paper); stroke-width:1.5; vector-effect:non-scaling-stroke; }
    .v112-legend { display:flex; flex-wrap:wrap; gap:8px 12px; margin-top:6px; color:var(--muted); font-size:11px; }
    .v112-legend span { display:inline-flex; align-items:center; gap:5px; }
    .v112-legend i { width:10px; height:10px; border-radius:50%; display:inline-block; }
    .v112-bar-label { fill:var(--ink); font-size:11px; font-weight:700; }
    .v112-bar-value { fill:var(--ink); font-size:11px; font-weight:800; }
    .v112-bar-track { fill:var(--paper-2); }
    .v112-disease-strip { margin-top:6px; padding:7px 8px; border-top:1px solid var(--line); display:flex; gap:7px; align-items:center; flex-wrap:wrap; font-size:11px; color:var(--muted); }
    .v112-disease-strip b { color:var(--ink); }
    .v112-disease-cell { display:inline-grid; grid-template-rows:auto auto; justify-items:center; min-width:22px; gap:1px; }
    .v112-disease-cell .g { font-size:9px; color:var(--muted); }
    .v112-disease-cell .v { font-size:12px; font-weight:800; color:var(--ink); }
    .history-head .v112-disease-badge { display:inline-flex; align-items:center; padding:3px 7px; border-radius:999px; background:#f2dfd5; color:var(--warn); font-size:11px; font-weight:800; }
    @media (max-width: 980px) {
      .v112-dashboard-grid { grid-template-columns:1fr 1fr; }
      .v112-dashboard-card:first-child { grid-column:1 / -1; }
    }
    @media (max-width: 680px) {
      .v112-dashboard-grid { grid-template-columns:1fr; }
      .v112-dashboard-card:first-child { grid-column:auto; }
      .v112-dashboard-head { align-items:flex-start; flex-direction:column; }
    }
  `;
  document.head.append(style);
}

function readCurrentFamilies(root) {
  const result = [];
  for (const card of root.querySelectorAll(".family-card")) {
    const heading = card.querySelector("h3")?.textContent?.replace(" · FIRST PLAYER", "").trim();
    const stats = [...card.querySelectorAll(".family-stat")];
    const influenceStat = stats.find(stat => stat.querySelector("span")?.textContent?.trim() === "Influence");
    const influence = Number(influenceStat?.querySelector("b")?.textContent) || 0;
    if (heading) result.push({ name: heading, influence });
  }
  return result;
}

function readCurrentAgents(root) {
  const familyTotals = new Map();
  const familyNames = new Map();
  const institutionTotals = new Map();
  for (const input of root.querySelectorAll("[data-agent-player][data-agent-institution]")) {
    const playerId = input.dataset.agentPlayer;
    const institutionId = input.dataset.agentInstitution;
    const value = Math.max(0, Number(input.value) || 0);
    const label = input.closest(".field")?.querySelector("label")?.textContent ?? "";
    const familyName = label.split(" Agents")[0]?.trim() || playerId;
    familyNames.set(playerId, familyName);
    familyTotals.set(playerId, (familyTotals.get(playerId) || 0) + value);
    institutionTotals.set(institutionId, (institutionTotals.get(institutionId) || 0) + value);
  }
  return {
    families: [...familyTotals.entries()].map(([id, value]) => ({ id, name: familyNames.get(id) || id, value })),
    institutions: [...institutionTotals.entries()].map(([id, value]) => ({ id, name: INSTITUTION_LABELS[id] || id, value })),
  };
}

function lineChart(labels, series, ariaLabel) {
  const W = 720, H = 235, L = 44, R = 14, T = 16, B = 34;
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
    grid += `<line class="v112-grid-line" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/><text class="v112-axis-label" x="${L-7}" y="${yy+4}" text-anchor="end">${Number.isInteger(value) ? value : value.toFixed(1)}</text>`;
  }
  const step = Math.max(1, Math.ceil(labels.length / 10));
  const xLabels = labels.map((label, index) => (index === labels.length - 1 || index % step === 0)
    ? `<text class="v112-axis-label" x="${x(index)}" y="${H-9}" text-anchor="middle">${index === 0 ? "Start" : `G${label}`}</text>`
    : "").join("");
  const lines = series.map((item, seriesIndex) => {
    const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
    const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
    const dots = item.values.map((value, index) => `<circle class="v112-point" cx="${x(index)}" cy="${y(value)}" r="3.5" fill="${color}"><title>${escapeHtml(item.name)} · ${index === 0 ? "Start" : `Generation ${labels[index]}`} · ${value}</title></circle>`).join("");
    return `<polyline class="v112-line" points="${points}" stroke="${color}"/>${dots}`;
  }).join("");
  return `<svg class="v112-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(ariaLabel)}">${grid}<line class="v112-axis" x1="${L}" y1="${T}" x2="${L}" y2="${H-B}"/><line class="v112-axis" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/>${xLabels}${lines}</svg>`;
}

function lineLegend(series) {
  return `<div class="v112-legend">${series.map((item, index) => `<span><i style="background:${SERIES_COLORS[index % SERIES_COLORS.length]}"></i>${escapeHtml(item.name)}: <b>${item.values.at(-1) ?? 0}</b></span>`).join("")}</div>`;
}

function barChart(items, ariaLabel) {
  const W = 390, L = 126, R = 34, T = 12, row = 42;
  const H = Math.max(132, T * 2 + row * Math.max(1, items.length));
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

function influenceSeries(root) {
  if (!snapshots.length) {
    const current = readCurrentFamilies(root);
    return {
      labels: [0],
      series: current.map(item => ({ name: item.name, values: [item.influence] })),
    };
  }
  const first = snapshots[0];
  const ids = Object.keys(first.familyNames || first.influenceBefore || {});
  return {
    labels: [0, ...snapshots.map(item => item.generation)],
    series: ids.map(id => ({
      name: first.familyNames?.[id] || id,
      values: [Number(first.influenceBefore?.[id]) || 0, ...snapshots.map(item => Number(item.influenceAfter?.[id]) || 0)],
    })),
  };
}

function renderDashboard(root) {
  const shell = root.querySelector(".app-shell");
  const toolbar = shell?.querySelector(".toolbar");
  if (!shell || !toolbar) return;

  let dashboard = shell.querySelector("[data-v112-dashboard]");
  if (!dashboard) {
    dashboard = document.createElement("section");
    dashboard.dataset.v112Dashboard = "true";
    dashboard.className = "v112-dashboard";
    toolbar.insertAdjacentElement("afterend", dashboard);
  }

  const influence = influenceSeries(root);
  const agents = readCurrentAgents(root);
  const html = `<div class="v112-dashboard-head"><h2>Playtest telemetry</h2><span>Primary monitoring · updates after each resolved Generation</span></div>
    <div class="v112-dashboard-grid">
      <article class="panel v112-dashboard-card"><div class="chart-head"><h3>Family Influence</h3><span>evolution by Generation</span></div>${lineChart(influence.labels, influence.series, "Family Influence by generation")}${lineLegend(influence.series)}</article>
      <article class="panel v112-dashboard-card"><div class="chart-head"><h3>Agents by Family</h3><span>current deployed Agents</span></div>${barChart(agents.families, "Current Agents by Family")}</article>
      <article class="panel v112-dashboard-card"><div class="chart-head"><h3>Agents by Institution</h3><span>current deployed Agents</span></div>${barChart(agents.institutions, "Current Agents by Institution")}</article>
    </div>`;
  if (dashboard.innerHTML !== html) dashboard.innerHTML = html;
}

function patchDiseaseHistory(root) {
  for (const card of root.querySelectorAll(".history-card")) {
    const disease = card.querySelector(".history-head > span");
    if (disease) {
      const text = disease.textContent?.trim();
      if (text === "No disease") {
        disease.hidden = true;
        disease.classList.remove("v112-disease-badge");
      } else if (text === "Disease") {
        disease.hidden = false;
        disease.classList.add("v112-disease-badge");
      }
    }
    for (const span of card.querySelectorAll(".history-grid span")) {
      if (span.textContent?.startsWith("Order · Disease resolved first ·")) {
        span.textContent = span.textContent.replace("Order · Disease resolved first ·", "Order ·");
      }
    }
  }
}

function patchSqualorDisease(root) {
  const card = [...root.querySelectorAll(".chart-card")]
    .find(item => item.querySelector("h3")?.textContent?.trim() === "Squalor");
  if (!card) return;
  card.querySelector("[data-v112-disease-strip]")?.remove();
  const strip = document.createElement("div");
  strip.dataset.v112DiseaseStrip = "true";
  strip.className = "v112-disease-strip";
  if (!snapshots.length) {
    strip.innerHTML = `<b>Disease 1/0:</b><span>no resolved Generation yet</span>`;
  } else {
    strip.innerHTML = `<b>Disease 1/0:</b>${snapshots.map(item => `<span class="v112-disease-cell"><span class="g">G${item.generation}</span><span class="v">${item.diseaseOccurred ? 1 : 0}</span></span>`).join("")}`;
  }
  const latest = card.querySelector(".chart-latest");
  if (latest) latest.insertAdjacentElement("beforebegin", strip);
  else card.append(strip);
}

function patchNotice(root) {
  document.title = "Morneval — Influence Development Economy v0.11.2";
  replaceText(root, "0.11.1", VERSION_TO);
  const notice = root.querySelector(".notice");
  if (notice && !notice.textContent?.includes("playtest telemetry")) {
    notice.insertAdjacentHTML("beforeend", ` <b>UI:</b> playtest telemetry is now pinned to the top of the page; Disease is shown only when it occurs and as a 1/0 track on Squalor.`);
  }
}

function patchUi() {
  patchScheduled = false;
  const root = document.querySelector("#app");
  if (!root) return;
  injectStyles();
  patchNotice(root);
  renderDashboard(root);
  patchDiseaseHistory(root);
  patchSqualorDisease(root);
}

function schedulePatch() {
  if (patchScheduled) return;
  patchScheduled = true;
  queueMicrotask(patchUi);
}

window.addEventListener("morneval:generation-resolved", event => {
  const detail = event.detail;
  if (!detail || typeof detail !== "object") return;
  snapshots.push(detail);
  schedulePatch();
});

document.addEventListener("click", event => {
  const target = event.target;
  if (target instanceof HTMLElement && target.id === "reset") snapshots.length = 0;
  schedulePatch();
});
document.addEventListener("change", schedulePatch);

const observer = new MutationObserver(schedulePatch);
const app = document.querySelector("#app");
if (app) observer.observe(app, { childList: true, subtree: true });

patchUi();
