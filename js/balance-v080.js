import {
  V08_CONFIG,
  createV08Game,
  applyAutoDemand,
  previewEconomy,
  resolveAutomatedGeneration,
  setCityValue,
  getTurnOrder,
  getSectorOccupancy,
  sectorResourceCapacity,
  getDemandPriorityGroups,
  resourceLabel,
} from "./v08-engine.js";

const VERSION = "0.8.0";
const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root element");

let game = createV08Game();
let reports = [];
let message = `v${VERSION} ready. Sector development and Hinterland investment are now automated economic actions.`;

function playerName(id) {
  return game.players.find(player => player.id === id)?.familyName ?? id ?? "None";
}

function sectorName(id) {
  return game.productionSectors.find(sector => sector.id === id)?.name ?? id ?? "Unknown";
}

function categoryLabel(category) {
  if (category === "external_markets") return "External";
  if (!category) return "none";
  return category[0].toUpperCase() + category.slice(1);
}

function axisLabel(axis, value) {
  if (axis === "religionArcane") {
    return ({ [-2]: "Academic / Arcane II", [-1]: "Academic / Arcane I", [0]: "Neutral", [1]: "Religion I", [2]: "Religion II" })[value];
  }
  return ({ [-2]: "Military II", [-1]: "Military I", [0]: "Neutral", [1]: "Commercial / Mercantile I", [2]: "Commercial / Mercantile II" })[value];
}

function axisSelect(axis, value) {
  const label = axis === "religionArcane"
    ? "Academic / Arcane ↔ Religion"
    : "Military ↔ Commercial / Mercantile";
  return `<div class="field"><label>${label}</label><select data-axis="${axis}">${[-2, -1, 0, 1, 2]
    .map(v => `<option value="${v}" ${v === value ? "selected" : ""}>${axisLabel(axis, v)}</option>`)
    .join("")}</select></div>`;
}

function priorityText() {
  return getDemandPriorityGroups(game)
    .map(group => group.map(categoryLabel).join(" + "))
    .join(" → ");
}

function metric(name, value) {
  return `<div class="metric"><span class="number">${value}</span><span class="name">${name}</span></div>`;
}

function currentOrderText() {
  return getTurnOrder(game).map(player => player.familyName).join(" → ");
}

function demandTotal(sector) {
  return sector.demandThisGeneration.population
    + sector.demandThisGeneration.institutions
    + sector.demandThisGeneration.external_markets;
}

function render() {
  applyAutoDemand(game);
  root.innerHTML = `<main class="app-shell">
    <header class="topbar">
      <div class="brand"><h1>MORNEVAL</h1><p>Economic development sandbox · Engine v${VERSION}</p></div>
      <div class="generation"><div class="label">Generation</div><div class="value">${game.generation}</div><div class="label">${game.phase.replaceAll("_", " ")}</div></div>
    </header>

    <div class="toolbar">
      <button class="primary" id="run-one">Run 1 automated generation</button>
      <button class="secondary" id="run-five">Run 5 automated generations</button>
      <button class="secondary" id="preview">Preview current economy</button>
      <button class="secondary" id="reset">Reset simulation</button>
    </div>

    <div class="notice"><b>v${VERSION} economic-development test:</b> Production Sectors now advance through three funded phases before a new Tier activates. Families can also acquire Hinterland and convert owned land to Farms. Development and land costs consume Influence immediately and reserve Wealth capacity for the Generation.</div>
    <div class="status">${message}</div>

    <h2 class="section-title">Morneval</h2>
    <section class="grid city-grid">
      ${metric("Population", game.city.population)}
      ${metric("Squalor", game.city.squalor)}
      ${metric("Order", game.city.order)}
      ${metric("Force", game.city.force)}
      ${metric("Economy", game.city.economicStrength)}
      ${metric("Renown", game.city.renown)}
    </section>

    <section class="panel" style="margin-top:12px">
      <h3>Test controls</h3>
      <div class="v08-grid v08-controls">
        <div class="field"><label>Population</label><input type="number" min="0" max="99" data-city="population" value="${game.city.population}"></div>
        <div class="field"><label>Squalor</label><input type="number" min="0" max="20" data-city="squalor" value="${game.city.squalor}"></div>
        <div class="field"><label>Renown</label><input type="number" min="0" max="99" data-city="renown" value="${game.city.renown}"></div>
        ${axisSelect("religionArcane", game.city.religionArcane)}
        ${axisSelect("militaryMercantile", game.city.militaryMercantile)}
      </div>
      <div class="prototype-rules"><b>Current demand priority:</b> ${priorityText()}. Prototype Renown still gains +1 after every two resolved Generations.</div>
    </section>

    <section class="panel" style="margin-top:12px">
      <h3>v0.8 temporary economic assumptions</h3>
      <div class="prototype-rules">Each raw resource begins with <b>3 units of city-adjacent base capacity</b>, so the Tier-I economy can function before Hinterland investment. This is a simulation bootstrap assumption, not a locked map rule. Beyond that base, only <b>owned</b> Hinterland contributes capacity. A natural tile adds 1 unit; a converted Farm instead adds 1 Food capacity.</div>
      <div class="prototype-rules" style="margin-top:8px"><b>Sector project:</b> Phase 1 = 1 Influence + 1 Wealth; Phase 2 = 2 Wealth; Phase 3 = 2 Wealth. Each completed phase gives its contributor +5 Prestige. Only one phase of a given Sector project may be completed per Generation. Phase 3 activates the new Tier.</div>
      <div class="prototype-rules" style="margin-top:8px"><b>Hinterland:</b> acquire an unowned tile for 3 Influence + 1 Wealth. Convert any owned natural tile to a Farm for 2 Influence + 1 Wealth. Meadow → Wool, Hill → Ore, Forest → Wood / Construction Materials; Farm → Food.</div>
    </section>

    <h2 class="section-title">Families</h2>
    <section class="grid family-grid">${game.players.map(renderFamily).join("")}</section>

    <section class="panel" style="margin-top:12px">
      <h3>First Player</h3>
      <div class="prototype-rules"><b>${playerName(game.firstPlayerId)}</b> is First Player. Order: ${currentOrderText()}. End-of-Generation hierarchy remains Influence → Prestige → Generation Wealth → random.</div>
    </section>

    <h2 class="section-title">Production Sectors & Development Projects</h2>
    <section class="v08-grid development-grid">${game.productionSectors.map(renderSector).join("")}</section>

    <h2 class="section-title">Hinterland — 13-space test map</h2>
    <section class="v08-grid hinterland-grid">
      <article class="panel hinterland-tile city-tile"><div class="tile-type">City</div><h3>Morneval</h3><div class="tile-output">1 central map space</div><div class="tile-owner">The 12 surrounding spaces are 4 Forests, 4 Meadows and 4 Hills.</div></article>
      ${game.lands.map(renderLand).join("")}
    </section>

    <h2 class="section-title">Current Economy</h2>
    <section class="report-list">${reports.length ? reports.map(renderReport).join("") : '<div class="panel empty">Use Preview or resolve a Generation to inspect current production.</div>'}</section>

    <h2 class="section-title">Generation History</h2>
    <section class="history-list">${game.history.length ? [...game.history].reverse().map(renderHistory).join("") : '<div class="panel empty">No Generations resolved yet.</div>'}</section>

    <p class="footer-note">The automated player strategy is deliberately provisional. It prioritizes resource bottlenecks, then Sector development pressure, then Stake bidding. Wealth-funded actions are allowed only against projected Wealth from positions already in place, so the AI is conservative about borrowing against an unresolved auction win.</p>
  </main>`;
  bindEvents();
}

function renderFamily(player) {
  const ownedLand = game.lands.filter(land => land.ownerId === player.id).length;
  const first = player.id === game.firstPlayerId ? " · FIRST PLAYER" : "";
  const shortfall = player.lastWealthShortfall > 0 ? `<div class="wealth-warning">Wealth shortfall: ${player.lastWealthShortfall}</div>` : "";
  return `<article class="panel family-card"><h3>${player.familyName}${first}</h3><div class="family-stats"><div class="family-stat"><b>${player.prestige}</b><span>Prestige</span></div><div class="family-stat"><b>${player.influence}</b><span>Influence</span></div><div class="family-stat"><b>${player.wealthGeneratedThisGeneration}</b><span>Gross Wealth</span></div></div><div class="land-score-preview">Production Stakes: <b>${player.productionStakes.length}</b> · Hinterland: <b>${ownedLand}</b><br>Last Wealth commitment: ${player.lastWealthCommitted} · available after commitments: ${player.lastWealthAvailable}</div>${shortfall}</article>`;
}

function renderSector(sector) {
  const occ = getSectorOccupancy(game, sector.id);
  const resourceCapacity = sectorResourceCapacity(game, sector.id);
  const totalDemand = demandTotal(sector);
  const nextPhase = sector.tier < 3 ? sector.developmentPhase + 1 : null;
  const nextCost = nextPhase ? V08_CONFIG.developmentPhases[nextPhase] : null;
  const completedDots = sector.developmentPhase;
  const stakes = game.players.flatMap(player => player.productionStakes)
    .filter(stake => stake.sectorId === sector.id)
    .sort((a, b) => a.placementOrder - b.placementOrder);
  return `<article class="panel sector-card">
    <div class="sector-head"><h3 class="sector-name">${sector.name}</h3><span class="tier-badge">Tier ${sector.tier}</span></div>
    <div class="slot-summary"><div class="slot-chip"><b>${occ.young}/${sector.tier}</b><span>young</span></div><div class="slot-chip"><b>${occ.mature}/${sector.tier}</b><span>mature</span></div><div class="slot-chip"><b>${occ.elder}/${sector.tier}</b><span>elder</span></div></div>
    <div class="phase-track">${[1,2,3].map(phase => `<div class="phase-dot ${phase <= completedDots ? "done" : ""}">P${phase}</div>`).join("")}</div>
    <div>${sector.tier >= 3 ? "Maximum Tier reached" : `<b>Project toward Tier ${sector.tier + 1}</b> · next phase ${nextPhase}: ${nextCost.influenceCost} Influence + ${nextCost.wealthCost} Wealth → +${nextCost.prestige} Prestige`}</div>
    <div class="sector-pressure">Demand ${totalDemand} · raw capacity ${resourceCapacity} · Tier slot capacity ${sector.tier * 3}</div>
    <div class="resource-row"><span class="resource-chip">Population ${sector.demandThisGeneration.population}</span><span class="resource-chip">Institutions ${sector.demandThisGeneration.institutions}</span><span class="resource-chip">External ${sector.demandThisGeneration.external_markets}</span></div>
    <div class="mini-title" style="margin-top:10px">Stakes</div><div class="stakes">${stakes.length ? stakes.map(stake => `<div class="stake ${stake.age}"><div class="stake-main"><b>${playerName(stake.ownerId)}</b><div class="meta">${stake.age} · #${stake.placementOrder}</div></div></div>`).join("") : '<div class="empty">No Production Stakes</div>'}</div>
  </article>`;
}

function renderLand(land) {
  const owner = land.ownerId ? playerName(land.ownerId) : "Unowned";
  const title = land.development === "farm" ? `Farm (${land.name})` : land.name;
  const type = land.development === "farm" ? `Converted ${land.originalTerrain}` : land.originalTerrain;
  return `<article class="panel hinterland-tile"><div class="tile-type">${type}</div><h3>${title}</h3><div class="tile-output">Output: ${resourceLabel(land.resourceType)} +${land.baseCapacity}</div><div class="tile-owner">Owner: <b>${owner}</b>${land.usedCapacityThisGeneration > 0 ? `<br>Used this Generation: ${land.usedCapacityThisGeneration}` : ""}</div></article>`;
}

function renderReport(report) {
  return `<article class="report"><h4>${report.sectorName}</h4><div class="report-kpis"><div class="kpi"><b>${report.stakeSupply}</b><span>Stake supply</span></div><div class="kpi"><b>${report.totalResourceCapacity}</b><span>Raw capacity</span></div><div class="kpi"><b>${report.actualProduction}</b><span>Needs served</span></div></div><div class="report-detail"><b>Raw capacity:</b> base ${report.baseResourceCapacity} + owned Hinterland ${report.hinterlandCapacity}</div><table><thead><tr><th>Demand</th><th>Requested</th><th>Served</th><th>Wealth/unit</th></tr></thead><tbody>${["population","institutions","external_markets"].map(key => `<tr><td>${categoryLabel(key)}</td><td>${report.demand.requested[key]}</td><td>${report.demand.served[key]}</td><td>${V08_CONFIG.wealthPerDemand[key]}</td></tr>`).join("")}</tbody></table><div class="report-detail"><b>Served Stakes:</b> ${report.servedStakes.length ? report.servedStakes.map(stake => `${playerName(stake.ownerId)} (${stake.age}) → ${categoryLabel(stake.demandCategory)} = ${stake.wealthGenerated} Wealth${stake.demandCategory === "population" ? " +1 Prestige" : ""}`).join("; ") : "none"}</div><div class="report-detail"><b>Hinterland used:</b> ${report.rawResourcesUsed.filter(item => item.source === "hinterland" && item.usedCapacity > 0).map(item => `${item.landName} (${playerName(item.ownerId)})`).join(", ") || "none"}</div></article>`;
}

function actionText(action) {
  if (action.type === "sector_development") {
    return `${playerName(action.playerId)} funded ${sectorName(action.sectorId)} Phase ${action.phase} toward Tier ${action.targetTier} (${action.influenceCost}I + ${action.wealthCost}W, +${action.prestige} Prestige)${action.tierActivated ? ` — Tier ${action.newTier} activated` : ""}`;
  }
  if (action.type === "hinterland_acquisition") {
    const land = game.lands.find(item => item.id === action.landId);
    return `${playerName(action.playerId)} acquired ${land?.name ?? action.landId} for ${action.influenceCost}I + ${action.wealthCost}W${action.purposeSectorId ? ` for ${sectorName(action.purposeSectorId)} pressure` : ""}`;
  }
  if (action.type === "farm_conversion") {
    return `${playerName(action.playerId)} converted ${action.landId} from ${action.originalTerrain} to Farm for ${action.influenceCost}I + ${action.wealthCost}W`;
  }
  if (action.type === "bid") return `${playerName(action.playerId)} bid ${action.bid} on ${sectorName(action.sectorId)}`;
  if (action.type === "pass_auction") return `${playerName(action.playerId)} passed on ${sectorName(action.sectorId)}`;
  return action.type;
}

function firstPlayerResolutionText(resolution) {
  if (!resolution) return "";
  if (resolution.tieBreakMethod === "influence") return "highest Influence";
  if (resolution.tieBreakMethod === "prestige") return `Influence tie → Prestige ${resolution.maxPrestige}`;
  if (resolution.tieBreakMethod === "wealth") return `Influence + Prestige tie → Wealth ${resolution.maxWealth}`;
  if (resolution.tieBreakMethod === "random") return "Influence + Prestige + Wealth tie → random";
  return resolution.tieBreakMethod;
}

function renderHistory(entry) {
  const development = entry.actions.filter(action => action.type === "sector_development");
  const land = entry.actions.filter(action => action.type === "hinterland_acquisition" || action.type === "farm_conversion");
  const winners = entry.auctions.filter(auction => auction.winnerId)
    .map(auction => `${sectorName(auction.sectorId)}: ${playerName(auction.winnerId)} ${auction.winningBid}I`)
    .join(" · ") || "none";
  const wealth = entry.wealthCommitments.map(row => `${playerName(row.playerId)} ${row.gross} gross / ${row.committed} committed / ${row.available} free`).join(" · ");
  const popPrestige = entry.populationPrestigeAwards.map(item => `${playerName(item.playerId)} +${item.amount}`).join(", ") || "none";
  const landPrestige = entry.landPrestigeAwards.map(item => `${playerName(item.playerId)} +${item.amount} (${item.landName})`).join(", ") || "none";
  return `<article class="panel history-card"><div class="history-head"><h3>Generation ${entry.generation}</h3><span>${entry.diseaseOccurred ? "Disease" : "No disease"}</span></div><div class="history-grid"><div><b>${entry.populationBefore} → ${entry.populationAfter}</b><span>Population</span></div><div><b>${entry.renownBeforeGrowth} → ${entry.renownAfterGrowth}</b><span>Renown</span></div><div><b>${entry.foodServed}/${entry.foodRequested}</b><span>Food to Population</span></div><div><b>${playerName(entry.nextFirstPlayerId)}</b><span>Next First Player</span></div></div><div class="history-notes"><b>Sector development:</b> ${development.length ? development.map(actionText).join("; ") : "none"}<br><b>Hinterland:</b> ${land.length ? land.map(actionText).join("; ") : "none"}<br><b>Auction winners:</b> ${winners}<br><b>Wealth capacity:</b> ${wealth}<br><b>Population Prestige:</b> ${popPrestige}<br><b>Productive-land Prestige:</b> ${landPrestige}<br><b>First Player rule:</b> ${firstPlayerResolutionText(entry.firstPlayerResolution)}</div><details style="margin-top:8px"><summary>Automated action log (${entry.actions.length} actions)</summary><div class="action-log">${entry.actions.map((action, index) => `${index + 1}. ${actionText(action)}`).join("<br>")}</div></details></article>`;
}

function syncInputs() {
  for (const input of document.querySelectorAll("[data-city]")) {
    setCityValue(game, input.dataset.city, input.value);
  }
  for (const select of document.querySelectorAll("[data-axis]")) {
    setCityValue(game, select.dataset.axis, select.value);
  }
  applyAutoDemand(game);
}

function runGenerations(count) {
  syncInputs();
  let last = null;
  const start = game.generation;
  for (let i = 0; i < count; i += 1) last = resolveAutomatedGeneration(game);
  reports = last?.economyReports ?? [];
  message = count === 1
    ? `Generation ${start} resolved. ${playerName(game.firstPlayerId)} is First Player for Generation ${game.generation}.`
    : `Generations ${start}–${game.generation - 1} resolved. ${playerName(game.firstPlayerId)} is now First Player.`;
  render();
}

function bindEvents() {
  document.querySelector("#run-one")?.addEventListener("click", () => runGenerations(1));
  document.querySelector("#run-five")?.addEventListener("click", () => runGenerations(5));
  document.querySelector("#preview")?.addEventListener("click", () => {
    syncInputs();
    reports = previewEconomy(game).reports;
    message = "Economy preview recalculated without advancing the Generation.";
    render();
  });
  document.querySelector("#reset")?.addEventListener("click", () => {
    game = createV08Game();
    reports = [];
    message = `v${VERSION} reset to Population 1, Renown 0, neutral Inclination, four Tier-I Sectors and an unowned 12-tile Hinterland.`;
    render();
  });
  for (const input of document.querySelectorAll("[data-city]")) {
    input.addEventListener("change", () => {
      syncInputs();
      reports = [];
      message = input.dataset.city === "renown"
        ? "Renown changed; External demand recalculated."
        : "City value changed; demand recalculated.";
      render();
    });
  }
  for (const select of document.querySelectorAll("[data-axis]")) {
    select.addEventListener("change", () => {
      syncInputs();
      reports = [];
      message = `City Inclination changed. Demand priority is now ${priorityText()}.`;
      render();
    });
  }
}

render();
