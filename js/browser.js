import { createGame } from "./engine.js";
import { getDemandPriorityGroups, resolveAllSectorEconomies, resolveSectorEconomy, } from "./economy.js";
const rootCandidate = document.querySelector("#app");
if (!rootCandidate)
    throw new Error("Missing #app root element");
const root = rootCandidate;
let game = createDiagnosticScenario();
let reports = [];
function createDiagnosticScenario() {
    const state = createGame(["Valenne", "D'Arcy", "Corven"]);
    state.city.population = 6;
    state.city.order = 3;
    state.city.squalor = 2;
    state.city.force = 2;
    state.city.economicStrength = 3;
    state.city.renown = 2;
    state.city.religionArcane = 1;
    state.city.militaryMercantile = 1;
    const setup = {
        food: {
            tier: 3,
            demand: { population: 3, institutions: 1, external_markets: 2 },
        },
        textiles: {
            tier: 2,
            demand: { population: 1, institutions: 1, external_markets: 2 },
        },
        smithing: {
            tier: 2,
            demand: { population: 1, institutions: 2, external_markets: 1 },
        },
    };
    for (const sector of state.productionSectors) {
        sector.tier = setup[sector.id].tier;
        sector.demandThisGeneration = { ...setup[sector.id].demand };
    }
    let placement = 1;
    addStake(state, "family_1", "food", "elder", placement++);
    addStake(state, "family_2", "food", "mature", placement++);
    addStake(state, "family_3", "food", "young", placement++);
    addStake(state, "family_2", "textiles", "elder", placement++);
    addStake(state, "family_1", "textiles", "young", placement++);
    addStake(state, "family_3", "smithing", "mature", placement++);
    addStake(state, "family_1", "smithing", "young", placement++);
    state.nextPlacementOrder = placement;
    state.players[0].resourceStakes.push({
        id: "valenne-farmland",
        ownerId: "family_1",
        landId: "farmland",
    });
    state.players[1].resourceStakes.push({
        id: "darcy-pasture",
        ownerId: "family_2",
        landId: "pasture",
    });
    state.players[2].resourceStakes.push({
        id: "corven-mine",
        ownerId: "family_3",
        landId: "mine",
    });
    return state;
}
function addStake(state, ownerId, sectorId, age, placementOrder) {
    state.players.find((p) => p.id === ownerId).productionStakes.push({
        id: `${ownerId}-${sectorId}-${placementOrder}`,
        ownerId,
        sectorId,
        age,
        placementOrder,
        servedThisGeneration: false,
        wealthProducedThisGeneration: 0,
    });
}
function playerName(playerId) {
    if (!playerId)
        return "Uncontrolled";
    return game.players.find((p) => p.id === playerId)?.familyName ?? playerId;
}
function axisLabel(axis, value) {
    if (axis === "religionArcane") {
        if (value === -2)
            return "Arcane II";
        if (value === -1)
            return "Arcane I";
        if (value === 1)
            return "Religion I";
        if (value === 2)
            return "Religion II";
        return "Neutral";
    }
    if (value === -2)
        return "Military II";
    if (value === -1)
        return "Military I";
    if (value === 1)
        return "Mercantile I";
    if (value === 2)
        return "Mercantile II";
    return "Neutral";
}
function categoryLabel(category) {
    if (category === "external_markets")
        return "External";
    return category[0].toUpperCase() + category.slice(1);
}
function priorityText() {
    return getDemandPriorityGroups(game.city.religionArcane, game.city.militaryMercantile)
        .map((group) => group.map(categoryLabel).join(" + "))
        .join(" → ");
}
function numberInput(sector, key) {
    return `<div class="field">
    <label>${categoryLabel(key)}</label>
    <input inputmode="numeric" type="number" min="0" max="20" step="1"
      data-demand-sector="${sector.id}" data-demand-key="${key}"
      value="${sector.demandThisGeneration[key]}" />
  </div>`;
}
function render() {
    root.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <h1>MORNEVAL</h1>
          <p>Economic diagnostic prototype · Engine v0.3</p>
        </div>
        <div class="generation">
          <div class="label">Generation</div>
          <div class="value">${game.generation}</div>
          <div class="label">${game.phase.replaceAll("_", " ")}</div>
        </div>
      </header>

      <div class="toolbar">
        <button class="primary" id="resolve-all">Resolve entire economy</button>
        <button class="secondary" id="reset-scenario">Reset prototype scenario</button>
      </div>

      <div class="notice">
        This screen is a <b>design laboratory</b>, not the final game UI. Change demand, Sector tiers and City Inclination, then resolve the economy to inspect the consequences.
      </div>

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
        <h3>City Inclination</h3>
        <div class="inclination-grid">
          ${axisSelect("religionArcane", game.city.religionArcane)}
          ${axisSelect("militaryMercantile", game.city.militaryMercantile)}
        </div>
        <div class="priority"><b>Current demand priority:</b> ${priorityText()}</div>
      </section>

      <h2 class="section-title">Families</h2>
      <section class="grid family-grid">
        ${game.players.map(renderFamily).join("")}
      </section>

      <h2 class="section-title">Production Sectors</h2>
      <section class="grid sector-grid">
        ${game.productionSectors.map(renderSector).join("")}
      </section>

      <h2 class="section-title">Hinterland & Raw Resources</h2>
      <section class="grid resource-grid">
        ${game.lands.map(renderLand).join("")}
      </section>

      <h2 class="section-title">Economic Resolution</h2>
      <section class="report-list">
        ${reports.length ? reports.map(renderReport).join("") : '<div class="panel empty">No economy resolution has been run yet.</div>'}
      </section>

      <p class="footer-note">
        Prototype rules are intentionally visible. Numerical values remain provisional. Population growth, Squalor changes, disease, Institutions, voting, diplomacy, assassination and endgame resolution are not implemented in this screen.
      </p>
    </main>
  `;
    bindEvents();
}
function metric(name, value) {
    return `<div class="metric"><span class="number">${value}</span><span class="name">${name}</span></div>`;
}
function axisSelect(axis, value) {
    const values = [-2, -1, 0, 1, 2];
    return `<div class="field">
    <label>${axis === "religionArcane" ? "Arcane ↔ Religion" : "Military ↔ Mercantile"}</label>
    <select data-axis="${axis}">
      ${values.map((v) => `<option value="${v}" ${v === value ? "selected" : ""}>${axisLabel(axis, v)}</option>`).join("")}
    </select>
  </div>`;
}
function renderFamily(player) {
    return `<article class="panel family-card">
    <h3>${player.familyName}</h3>
    <div class="family-stats">
      <div class="family-stat"><b>${player.prestige}</b><span>Prestige</span></div>
      <div class="family-stat"><b>${player.influence}</b><span>Influence</span></div>
      <div class="family-stat"><b>${player.wealthGeneratedThisGeneration}</b><span>Wealth</span></div>
    </div>
  </article>`;
}
function renderSector(sector) {
    const stakes = game.players
        .flatMap((p) => p.productionStakes)
        .filter((stake) => stake.sectorId === sector.id)
        .sort((a, b) => a.placementOrder - b.placementOrder);
    return `<article class="panel sector-card">
    <div class="sector-head">
      <h3 class="sector-name">${sector.name}</h3>
      <span class="tier-badge">Tier ${sector.tier}</span>
    </div>
    <div class="field">
      <label>Prototype Sector tier</label>
      <select data-tier-sector="${sector.id}">
        ${[1, 2, 3].map((tier) => `<option value="${tier}" ${tier === sector.tier ? "selected" : ""}>Tier ${tier}</option>`).join("")}
      </select>
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;margin-bottom:6px">Demand</div>
      <div class="demand-row">
        ${numberInput(sector, "population")}
        ${numberInput(sector, "institutions")}
        ${numberInput(sector, "external_markets")}
      </div>
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;margin-bottom:6px">Production Stakes</div>
      <div class="stakes">
        ${stakes.length ? stakes.map((stake) => `<div class="stake ${stake.age} ${stake.servedThisGeneration ? "" : "unserved"}">
          <div><b>${playerName(stake.ownerId)}</b><div class="meta">Placed #${stake.placementOrder}</div></div>
          <div style="text-align:right"><b>${stake.age}</b><div class="meta">${stake.servedThisGeneration ? `served · Wealth +${stake.wealthProducedThisGeneration}` : "not served"}</div></div>
        </div>`).join("") : '<div class="empty">No Stakes</div>'}
      </div>
    </div>
    <button class="sector-resolve" data-resolve-sector="${sector.id}">Resolve ${sector.name}</button>
  </article>`;
}
function renderLand(land) {
    const owner = game.players
        .flatMap((p) => p.resourceStakes)
        .find((stake) => stake.landId === land.id)?.ownerId;
    const capacity = Math.max(0, land.baseCapacity + land.capacityModifier);
    const pct = capacity === 0 ? 0 : Math.min(100, Math.round(100 * land.usedCapacityThisGeneration / capacity));
    return `<article class="panel">
    <h3>${land.name}</h3>
    <div><b>${land.resourceType}</b> · capacity ${capacity}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:4px">Stake: ${playerName(owner)}</div>
    <div class="resource-meter"><span style="width:${pct}%"></span></div>
    <div style="font-size:12px;margin-top:5px">Used ${land.usedCapacityThisGeneration}/${capacity}</div>
  </article>`;
}
function renderReport(report) {
    return `<article class="report">
    <h4>${report.sectorName}</h4>
    <div class="report-kpis">
      <div class="kpi"><b>${report.availableSupply}</b><span>Tier capacity</span></div>
      <div class="kpi"><b>${report.resourceLimitedSupply}</b><span>Resource-limited supply</span></div>
      <div class="kpi"><b>${report.profitableDemand}</b><span>Demand served</span></div>
    </div>
    <div class="priority"><b>Priority:</b> ${report.demand.priorityGroups.map((g) => g.map(categoryLabel).join(" + ")).join(" → ")}</div>
    <table>
      <thead><tr><th>Demand</th><th>Requested</th><th>Served</th><th>Unmet</th></tr></thead>
      <tbody>
        ${["population", "institutions", "external_markets"].map((key) => `<tr><td>${categoryLabel(key)}</td><td>${report.demand.requested[key]}</td><td>${report.demand.served[key]}</td><td>${report.demand.unmet[key]}</td></tr>`).join("")}
      </tbody>
    </table>
    <div style="margin-top:10px;font-size:12px"><b>Served Stakes:</b> ${report.servedStakes.length ? report.servedStakes.map((stake) => `${playerName(stake.ownerId)} (${stake.age})`).join(", ") : "none"}</div>
  </article>`;
}
function bindEvents() {
    document.querySelector("#resolve-all")?.addEventListener("click", () => {
        syncInputs();
        reports = resolveAllSectorEconomies(game);
        render();
    });
    document.querySelector("#reset-scenario")?.addEventListener("click", () => {
        game = createDiagnosticScenario();
        reports = [];
        render();
    });
    for (const button of document.querySelectorAll("[data-resolve-sector]")) {
        button.addEventListener("click", () => {
            syncInputs();
            const sectorId = button.dataset.resolveSector;
            const report = resolveSectorEconomy(game, sectorId);
            reports = [report, ...reports.filter((r) => r.sectorId !== sectorId)];
            render();
        });
    }
    for (const select of document.querySelectorAll("[data-axis]")) {
        select.addEventListener("change", () => {
            const axis = select.dataset.axis;
            const value = Number(select.value);
            game.city[axis] = value;
            reports = [];
            render();
        });
    }
    for (const select of document.querySelectorAll("[data-tier-sector]")) {
        select.addEventListener("change", () => {
            const sector = game.productionSectors.find((s) => s.id === select.dataset.tierSector);
            if (sector)
                sector.tier = Number(select.value);
            reports = [];
            render();
        });
    }
}
function syncInputs() {
    for (const input of document.querySelectorAll("[data-demand-sector]")) {
        const sector = game.productionSectors.find((s) => s.id === input.dataset.demandSector);
        const key = input.dataset.demandKey;
        if (sector && key) {
            sector.demandThisGeneration[key] = Math.max(0, Number(input.value) || 0);
        }
    }
}
render();
