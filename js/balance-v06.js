import { BALANCE_CONFIG } from "./balance-config.js";
import {
  createGame,
  getSectorStakeCapacity,
  getSectorStakeOccupancy,
  addProductionStakeForTesting,
  removeProductionStake,
  setProductionStakeOwner,
  setProductionStakeAge,
  setResourceStakeOwner,
  setLandBaseCapacity,
  setLandCapacityModifier,
} from "./engine.js";
import {
  getDemandPriorityGroups,
  resolveAllSectorEconomies,
  resolveSectorEconomy,
} from "./economy.js";
import {
  applyAutoDemand,
  calculateProductiveLandPrestige,
  institutionCapacityStatus,
  normalizeActualResourceUsage,
  resolveGeneration,
  setInstitutionLevel,
  totalInstitutionLevels,
} from "./generation.js";

const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root element");

let game = createDiagnosticScenario();
let reports = [];
let previewLandAwards = [];
let message = "v0.6 ready. Institution and External demand now scale with the city, and Wealth depends on who consumes the output.";

function createDiagnosticScenario() {
  const state = createGame(["Valenne", "D'Arcy", "Corven"]);
  state.autoPopulationDemand = true;
  state.autoInstitutionDemand = true;
  state.autoExternalDemand = true;
  state.rngState = 246813579;
  state.history = [];
  state.institutions = [
    { id: "merchant_guild", name: "Merchant Guild", level: 1 },
    { id: "city_guard", name: "City Guard", level: 1 },
    { id: "temple", name: "Temple", level: 1 },
  ];

  Object.assign(state.city, {
    population: 6,
    order: 3,
    squalor: 2,
    force: 2,
    economicStrength: 3,
    renown: 2,
    religionArcane: 1,
    militaryMercantile: 1,
  });

  const setup = {
    food: { tier: 3, demand: { population: 3, institutions: 1, external_markets: 1 } },
    textiles: { tier: 2, demand: { population: 1, institutions: 1, external_markets: 1 } },
    smithing: { tier: 2, demand: { population: 1, institutions: 1, external_markets: 1 } },
  };
  for (const sector of state.productionSectors) {
    sector.tier = setup[sector.id].tier;
    sector.demandThisGeneration = { ...setup[sector.id].demand };
  }

  let placement = 1;
  addRawStake(state, "family_1", "food", "elder", placement++);
  addRawStake(state, "family_2", "food", "mature", placement++);
  addRawStake(state, "family_3", "food", "young", placement++);
  addRawStake(state, "family_2", "textiles", "elder", placement++);
  addRawStake(state, "family_1", "textiles", "young", placement++);
  addRawStake(state, "family_3", "smithing", "mature", placement++);
  addRawStake(state, "family_1", "smithing", "young", placement++);
  state.nextPlacementOrder = placement;

  state.players[0].resourceStakes.push({ id: "valenne-farmland", ownerId: "family_1", landId: "farmland" });
  state.players[1].resourceStakes.push({ id: "darcy-pasture", ownerId: "family_2", landId: "pasture" });
  state.players[2].resourceStakes.push({ id: "corven-mine", ownerId: "family_3", landId: "mine" });

  applyAutoDemand(state);
  return state;
}

function addRawStake(state, ownerId, sectorId, age, placementOrder) {
  state.players.find(p => p.id === ownerId).productionStakes.push({
    id: `${ownerId}-${sectorId}-${placementOrder}`,
    ownerId,
    sectorId,
    age,
    placementOrder,
    servedThisGeneration: false,
    wealthProducedThisGeneration: 0,
    servedDemandCategory: null,
  });
}

function playerName(id) {
  if (!id) return "Uncontrolled";
  return game.players.find(p => p.id === id)?.familyName ?? id;
}

function playerOptions(selected, includeNone = false) {
  return `${includeNone ? `<option value="" ${!selected ? "selected" : ""}>Uncontrolled</option>` : ""}${game.players
    .map(p => `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${p.familyName}</option>`)
    .join("")}`;
}

function ageOptions(selected) {
  return ["young", "mature", "elder"]
    .map(age => `<option value="${age}" ${age === selected ? "selected" : ""}>${age[0].toUpperCase() + age.slice(1)}</option>`)
    .join("");
}

function axisLabel(axis, value) {
  if (axis === "religionArcane") {
    return ({ [-2]: "Arcane II", [-1]: "Arcane I", [0]: "Neutral", [1]: "Religion I", [2]: "Religion II" })[value];
  }
  return ({ [-2]: "Military II", [-1]: "Military I", [0]: "Neutral", [1]: "Mercantile I", [2]: "Mercantile II" })[value];
}

function categoryLabel(category) {
  if (category === "external_markets") return "External";
  return category[0].toUpperCase() + category.slice(1);
}

function priorityText() {
  return getDemandPriorityGroups(game.city.religionArcane, game.city.militaryMercantile)
    .map(group => group.map(categoryLabel).join(" + "))
    .join(" → ");
}

function metric(name, value) {
  return `<div class="metric"><span class="number">${value}</span><span class="name">${name}</span></div>`;
}

function axisSelect(axis, value) {
  return `<div class="field"><label>${axis === "religionArcane" ? "Arcane ↔ Religion" : "Military ↔ Mercantile"}</label><select data-axis="${axis}">${[-2, -1, 0, 1, 2]
    .map(v => `<option value="${v}" ${v === value ? "selected" : ""}>${axisLabel(axis, v)}</option>`)
    .join("")}</select></div>`;
}

function isAutoDemand(key) {
  if (key === "population") return game.autoPopulationDemand;
  if (key === "institutions") return game.autoInstitutionDemand;
  return game.autoExternalDemand;
}

function demandInput(sector, key) {
  const auto = isAutoDemand(key);
  return `<div class="field"><label>${categoryLabel(key)}${auto ? " (auto)" : ""}</label><input inputmode="numeric" type="number" min="0" max="99" step="1" data-demand-sector="${sector.id}" data-demand-key="${key}" value="${sector.demandThisGeneration[key]}" ${auto ? "disabled" : ""}></div>`;
}

function awardForPlayer(playerId) {
  return previewLandAwards.filter(a => a.playerId === playerId).reduce((sum, a) => sum + a.amount, 0);
}

function institutionPanel() {
  const status = institutionCapacityStatus(game);
  const warning = status.overCap
    ? `<div class="warning"><b>Over population cap:</b> Institution levels total ${status.total}, but current Population is ${status.cap}. Existing Institutions are not automatically destroyed after Population loss; new development is blocked until the city is back within the cap.</div>`
    : `<div class="capacity-ok">Institution development: ${status.total}/${status.cap} Population capacity used.</div>`;

  return `<section class="panel institution-panel">
    <h3>Institutions — demand scaling prototype</h3>
    <div class="notice">For v0.6, only Institution <b>levels</b> are modeled here. Their specific powers and scoring are not implemented yet. Total Institution levels may not be increased above Population.</div>
    ${warning}
    <div class="institution-grid">
      ${game.institutions.map(inst => `<div class="field"><label>${inst.name} level</label><input type="number" min="0" max="20" step="1" data-institution-level="${inst.id}" value="${inst.level}"></div>`).join("")}
    </div>
    <div class="prototype-rules"><b>Auto Institution demand:</b> total Institution levels = ${totalInstitutionLevels(game)}. Each Sector uses its own configurable divisor. If Population later falls below existing Institution levels, the city is flagged over-cap but Institutions are not automatically removed.</div>
  </section>`;
}

function render() {
  const instStatus = institutionCapacityStatus(game);
  root.innerHTML = `<main class="app-shell">
    <header class="topbar">
      <div class="brand"><h1>MORNEVAL</h1><p>Generational balance sandbox · Engine v0.6</p></div>
      <div class="generation"><div class="label">Generation</div><div class="value">${game.generation}</div><div class="label">${game.phase.replaceAll("_", " ")}</div></div>
    </header>

    <div class="toolbar">
      <button class="primary" id="advance-generation">Advance generation</button>
      <button class="secondary" id="advance-three">Advance 3 · no actions</button>
      <button class="secondary" id="resolve-all">Preview economy</button>
      <button class="secondary" id="reset-scenario">Reset scenario</button>
    </div>

    <div class="notice"><b>v0.6:</b> Demand now scales from Population, Institution development and Renown. Wealth per served unit is currently <b>Population ${BALANCE_CONFIG.wealthPerDemand.population} / Institutions ${BALANCE_CONFIG.wealthPerDemand.institutions} / External ${BALANCE_CONFIG.wealthPerDemand.external_markets}</b>. Older Stakes are served first and therefore capture the highest-priority market first.</div>
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

    <section class="panel simulation-panel">
      <h3>Generation controls</h3>
      <div class="simulation-grid">
        <div class="field"><label>Population</label><input type="number" min="0" max="99" data-city="population" value="${game.city.population}"></div>
        <div class="field"><label>Squalor</label><input type="number" min="0" max="20" data-city="squalor" value="${game.city.squalor}"></div>
        <div class="field"><label>Renown</label><input type="number" min="0" max="99" data-city="renown" value="${game.city.renown}"></div>
      </div>
      <div class="toggle-grid">
        <label class="toggle"><input type="checkbox" id="auto-pop-demand" ${game.autoPopulationDemand ? "checked" : ""}><span>Auto Population demand</span></label>
        <label class="toggle"><input type="checkbox" id="auto-inst-demand" ${game.autoInstitutionDemand ? "checked" : ""}><span>Auto Institution demand</span></label>
        <label class="toggle"><input type="checkbox" id="auto-external-demand" ${game.autoExternalDemand ? "checked" : ""}><span>Auto External demand</span></label>
      </div>
      <div class="prototype-rules"><b>Scaling:</b> Population demand uses Population; Institution demand uses total Institution levels (${instStatus.total}); External demand uses Renown (${game.city.renown}). Exact divisors are editable in Prototype balance parameters below.</div>
    </section>

    ${institutionPanel()}

    <section class="panel" style="margin-top:12px">
      <h3>City Inclination</h3>
      <div class="inclination-grid">${axisSelect("religionArcane", game.city.religionArcane)}${axisSelect("militaryMercantile", game.city.militaryMercantile)}</div>
      <div class="priority"><b>Current demand priority:</b> ${priorityText()}</div>
    </section>

    <h2 class="section-title">Families</h2>
    <section class="grid family-grid">${game.players.map(renderFamily).join("")}</section>

    <h2 class="section-title">Production Sectors</h2>
    <section class="grid sector-grid">${game.productionSectors.map(renderSector).join("")}</section>

    <h2 class="section-title">Hinterland & Raw Resources</h2>
    <section class="grid resource-grid">${game.lands.map(renderLand).join("")}</section>

    <h2 class="section-title">Economic Resolution</h2>
    <section class="report-list">${reports.length ? reports.map(renderReport).join("") : '<div class="panel empty">No economy preview/resolution yet.</div>'}</section>

    <h2 class="section-title">Generation History</h2>
    <section class="history-list">${game.history?.length ? [...game.history].reverse().map(renderHistory).join("") : '<div class="panel empty">Advance a generation to start the history.</div>'}</section>

    <p class="footer-note">Renown is manually adjustable in v0.6 because its final growth rules are not yet defined. Institution levels are a demand proxy only; Institution powers, Agents and Institution scoring are still future layers.</p>
  </main>`;
  bindEvents();
}

function renderFamily(player) {
  return `<article class="panel family-card"><h3>${player.familyName}</h3><div class="family-stats"><div class="family-stat"><b>${player.prestige}</b><span>Prestige</span></div><div class="family-stat"><b>${player.influence}</b><span>Influence</span></div><div class="family-stat"><b>${player.wealthGeneratedThisGeneration}</b><span>Wealth</span></div></div><div class="land-score-preview">Productive-land Prestige if the generation ended now: <b>+${awardForPlayer(player.id)}</b></div></article>`;
}

function renderSlotSummary(sector) {
  const cap = getSectorStakeCapacity(game, sector.id);
  const occ = getSectorStakeOccupancy(game, sector.id);
  const chip = age => `<div class="slot-chip ${occ[age] > cap[age] ? "overflow" : ""}"><b>${occ[age]}/${cap[age]}</b><span>${age}</span></div>`;
  return `<div class="slot-summary">${chip("young")}${chip("mature")}${chip("elder")}<div class="slot-chip total"><b>${occ.total}/${cap.total}</b><span>total</span></div></div>`;
}

function renderSector(sector) {
  const stakes = game.players.flatMap(p => p.productionStakes).filter(s => s.sectorId === sector.id).sort((a, b) => a.placementOrder - b.placementOrder);
  return `<article class="panel sector-card">
    <div class="sector-head"><h3 class="sector-name">${sector.name}</h3><span class="tier-badge">Tier ${sector.tier}</span></div>
    <div class="field"><label>Sector tier</label><select data-tier-sector="${sector.id}">${[1, 2, 3].map(t => `<option value="${t}" ${t === sector.tier ? "selected" : ""}>Tier ${t}</option>`).join("")}</select></div>
    <div><div class="mini-title">Stake slots</div>${renderSlotSummary(sector)}</div>
    <div><div class="mini-title">Demand</div><div class="demand-row">${demandInput(sector, "population")}${demandInput(sector, "institutions")}${demandInput(sector, "external_markets")}</div></div>
    <div><div class="mini-title">Production Stakes</div><div class="stakes">${stakes.length ? stakes.map(renderStake).join("") : '<div class="empty">No Stakes</div>'}</div></div>
    <div class="sandbox-add"><div class="mini-title">Add Stake for testing</div><div class="editor-row"><select data-new-owner="${sector.id}">${playerOptions(game.players[0].id)}</select><select data-new-age="${sector.id}">${ageOptions("young")}</select><button data-add-stake="${sector.id}">Add</button></div></div>
    <button class="sector-resolve" data-resolve-sector="${sector.id}">Preview ${sector.name}</button>
  </article>`;
}

function renderStake(stake) {
  const market = stake.servedDemandCategory ? categoryLabel(stake.servedDemandCategory) : "—";
  return `<div class="stake ${stake.age} ${stake.servedThisGeneration ? "" : "unserved"}"><div class="stake-main"><b>${playerName(stake.ownerId)}</b><div class="meta">Placed #${stake.placementOrder} · ${stake.servedThisGeneration ? `${market} · Wealth +${stake.wealthProducedThisGeneration}` : "not served"}</div></div><div class="stake-edit"><select data-stake-owner="${stake.id}">${playerOptions(stake.ownerId)}</select><select data-stake-age="${stake.id}">${ageOptions(stake.age)}</select><button class="danger-small" data-remove-stake="${stake.id}">×</button></div></div>`;
}

function renderLand(land) {
  const owner = game.players.flatMap(p => p.resourceStakes).find(s => s.landId === land.id)?.ownerId;
  const capacity = Math.max(0, land.baseCapacity + land.capacityModifier);
  const pct = capacity === 0 ? 0 : Math.min(100, Math.round(100 * land.usedCapacityThisGeneration / capacity));
  const scores = land.usedCapacityThisGeneration > 0 && owner;
  return `<article class="panel"><h3>${land.name}</h3><div><b>${land.resourceType}</b> · effective capacity ${capacity}</div><div class="resource-editor"><div class="field"><label>Stake owner</label><select data-land-owner="${land.id}">${playerOptions(owner, true)}</select></div><div class="field"><label>Base capacity</label><input type="number" min="0" max="20" data-land-base="${land.id}" value="${land.baseCapacity}"></div><div class="field"><label>Capacity modifier</label><input type="number" min="-20" max="20" data-land-modifier="${land.id}" value="${land.capacityModifier}"></div></div><div class="resource-meter"><span style="width:${pct}%"></span></div><div class="land-usage">Actually used ${land.usedCapacityThisGeneration}/${capacity}${scores ? ` · <b>+${BALANCE_CONFIG.rawResourcePrestigePerUsedLand} Prestige to ${playerName(owner)}</b>` : ""}</div></article>`;
}

function renderReport(report) {
  return `<article class="report"><h4>${report.sectorName}</h4><div class="report-kpis"><div class="kpi"><b>${report.availableSupply}</b><span>Tier capacity</span></div><div class="kpi"><b>${report.resourceLimitedSupply}</b><span>Resource-limited supply</span></div><div class="kpi"><b>${report.actualProduction}</b><span>Actual production</span></div></div><div class="priority"><b>Priority:</b> ${report.demand.priorityGroups.map(g => g.map(categoryLabel).join(" + ")).join(" → ")}</div><table><thead><tr><th>Demand</th><th>Requested</th><th>Served</th><th>Unmet</th><th>Wealth/unit</th></tr></thead><tbody>${["population", "institutions", "external_markets"].map(k => `<tr><td>${categoryLabel(k)}</td><td>${report.demand.requested[k]}</td><td>${report.demand.served[k]}</td><td>${report.demand.unmet[k]}</td><td>${BALANCE_CONFIG.wealthPerDemand[k]}</td></tr>`).join("")}</tbody></table><div class="report-detail"><b>Served Stakes:</b> ${report.servedStakes.length ? report.servedStakes.map(s => `${playerName(s.ownerId)} (${s.age}, #${s.placementOrder}) → ${categoryLabel(s.demandCategory)} = ${s.wealthGenerated} Wealth`).join("; ") : "none"}</div><div class="report-detail"><b>Raw resources actually used:</b> ${report.rawResourcesUsed.map(r => `${r.landName} ${r.usedCapacity}/${r.availableCapacity}${r.stakeOwnerId ? ` (${playerName(r.stakeOwnerId)})` : ""}`).join(", ") || "none"}</div></article>`;
}

function renderHistory(entry) {
  const landPrestige = entry.landPrestigeAwards.length
    ? entry.landPrestigeAwards.map(a => `${playerName(a.playerId)} +${a.amount} (${a.landName})`).join(", ")
    : "none";
  const wealth = game.players.map(p => `${p.familyName} ${entry.wealthAfter?.[p.id] ?? 0}`).join(" · ");
  return `<article class="panel history-card"><div class="history-head"><h3>Generation ${entry.generation}</h3><span>${entry.diseaseOccurred ? "Disease" : "No disease"}</span></div><div class="history-grid"><div><b>${entry.populationBefore} → ${entry.populationAfter}</b><span>Population</span></div><div><b>${entry.foodServed}/${entry.foodRequested}</b><span>Food to Population</span></div><div><b>${entry.squalorBefore} → ${entry.squalorAfter}</b><span>Squalor · target ${entry.squalorTarget}</span></div><div><b>${entry.institutionStatusBefore.total}/${entry.institutionStatusBefore.cap}</b><span>Institution levels / Pop cap</span></div><div><b>${entry.renown}</b><span>Renown driving External demand</span></div><div><b>${Math.round(entry.diseaseChance * 100)}%</b><span>Disease · roll ${entry.diseaseRoll.toFixed(3)}</span></div></div><div class="history-notes">Population effects: +${entry.growth} growth, −${entry.famineLoss} famine, −${entry.diseaseLoss} disease.<br><b>Wealth:</b> ${wealth}<br><b>Land Prestige:</b> ${landPrestige}${entry.institutionStatusAfter.overCap ? `<br><b>Warning:</b> Institution levels (${entry.institutionStatusAfter.total}) now exceed Population (${entry.institutionStatusAfter.cap}).` : ""}</div></article>`;
}

function syncInputs() {
  for (const input of document.querySelectorAll("[data-demand-sector]")) {
    if (input.disabled) continue;
    const sector = game.productionSectors.find(s => s.id === input.dataset.demandSector);
    const key = input.dataset.demandKey;
    if (sector && key) sector.demandThisGeneration[key] = Math.max(0, Number(input.value) || 0);
  }
  for (const input of document.querySelectorAll("[data-city]")) {
    const key = input.dataset.city;
    if (key) game.city[key] = Math.max(0, Number(input.value) || 0);
  }
  applyAutoDemand(game);
}

function invalidate(text) {
  reports = [];
  previewLandAwards = [];
  message = text;
  applyAutoDemand(game);
  render();
}

function safe(action, success) {
  try {
    action();
    invalidate(success);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
    applyAutoDemand(game);
    render();
  }
}

function bindEvents() {
  document.querySelector("#resolve-all")?.addEventListener("click", () => {
    syncInputs();
    reports = resolveAllSectorEconomies(game);
    normalizeActualResourceUsage(game, reports);
    previewLandAwards = calculateProductiveLandPrestige(game, reports);
    message = `Economy preview resolved. Family Wealth: ${game.players.map(p => `${p.familyName} ${p.wealthGeneratedThisGeneration}`).join(", ")}.`;
    render();
  });

  document.querySelector("#advance-generation")?.addEventListener("click", () => {
    syncInputs();
    const result = resolveGeneration(game);
    reports = result.economyReports;
    previewLandAwards = [];
    message = `Generation ${result.generation} resolved. Population ${result.populationBefore}→${result.populationAfter}; Squalor ${result.squalorBefore}→${result.squalorAfter}.`;
    render();
  });

  document.querySelector("#advance-three")?.addEventListener("click", () => {
    syncInputs();
    const start = game.generation;
    let last;
    for (let i = 0; i < 3; i++) last = resolveGeneration(game);
    reports = last.economyReports;
    previewLandAwards = [];
    message = `Generations ${start}–${game.generation - 1} resolved with no intervening player actions.`;
    render();
  });

  document.querySelector("#reset-scenario")?.addEventListener("click", () => {
    game = createDiagnosticScenario();
    reports = [];
    previewLandAwards = [];
    message = "Prototype scenario reset.";
    render();
  });

  const toggles = [
    ["#auto-pop-demand", "autoPopulationDemand", "Population"],
    ["#auto-inst-demand", "autoInstitutionDemand", "Institution"],
    ["#auto-external-demand", "autoExternalDemand", "External"],
  ];
  for (const [selector, property, label] of toggles) {
    document.querySelector(selector)?.addEventListener("change", event => {
      game[property] = event.target.checked;
      invalidate(`${label} automatic demand ${game[property] ? "enabled" : "disabled"}.`);
    });
  }

  for (const input of document.querySelectorAll("[data-city]")) {
    input.addEventListener("change", () => {
      syncInputs();
      invalidate("City starting value changed; scaled demand recalculated.");
    });
  }

  for (const input of document.querySelectorAll("[data-institution-level]")) {
    input.addEventListener("change", () => {
      safe(
        () => setInstitutionLevel(game, input.dataset.institutionLevel, input.value),
        "Institution level changed; Institution demand recalculated.",
      );
    });
  }

  for (const button of document.querySelectorAll("[data-resolve-sector]")) {
    button.addEventListener("click", () => {
      syncInputs();
      const id = button.dataset.resolveSector;
      const report = resolveSectorEconomy(game, id);
      reports = [report, ...reports.filter(r => r.sectorId !== id)];
      previewLandAwards = [];
      message = `${report.sectorName} preview resolved.`;
      render();
    });
  }

  for (const select of document.querySelectorAll("[data-axis]")) {
    select.addEventListener("change", () => {
      game.city[select.dataset.axis] = Number(select.value);
      invalidate("City Inclination changed.");
    });
  }

  for (const select of document.querySelectorAll("[data-tier-sector]")) {
    select.addEventListener("change", () => {
      const sector = game.productionSectors.find(s => s.id === select.dataset.tierSector);
      if (sector) sector.tier = Number(select.value);
      invalidate("Sector tier changed.");
    });
  }

  for (const button of document.querySelectorAll("[data-add-stake]")) {
    button.addEventListener("click", () => {
      const id = button.dataset.addStake;
      const owner = document.querySelector(`[data-new-owner="${id}"]`).value;
      const age = document.querySelector(`[data-new-age="${id}"]`).value;
      safe(() => addProductionStakeForTesting(game, owner, id, age), `Added ${age} Stake.`);
    });
  }

  for (const button of document.querySelectorAll("[data-remove-stake]")) {
    button.addEventListener("click", () => safe(() => removeProductionStake(game, button.dataset.removeStake), "Stake removed."));
  }

  for (const select of document.querySelectorAll("[data-stake-owner]")) {
    select.addEventListener("change", () => safe(() => setProductionStakeOwner(game, select.dataset.stakeOwner, select.value), "Stake owner changed for sandbox testing."));
  }

  for (const select of document.querySelectorAll("[data-stake-age]")) {
    select.addEventListener("change", () => safe(() => setProductionStakeAge(game, select.dataset.stakeAge, select.value), "Stake age changed."));
  }

  for (const select of document.querySelectorAll("[data-land-owner]")) {
    select.addEventListener("change", () => safe(() => setResourceStakeOwner(game, select.dataset.landOwner, select.value || null), "Raw-resource owner changed."));
  }

  for (const input of document.querySelectorAll("[data-land-base]")) {
    input.addEventListener("change", () => safe(() => setLandBaseCapacity(game, input.dataset.landBase, input.value), "Land base capacity changed."));
  }

  for (const input of document.querySelectorAll("[data-land-modifier]")) {
    input.addEventListener("change", () => safe(() => setLandCapacityModifier(game, input.dataset.landModifier, input.value), "Land capacity modifier changed."));
  }
}

render();
