import { BALANCE_CONFIG } from "./balance-config.js";
import { createGame, getSectorStakeCapacity, getSectorStakeOccupancy } from "./engine.js";
import { getDemandPriorityGroups, resolveAllSectorEconomies } from "./economy.js";
import { applyAutoDemand, totalInstitutionLevels } from "./generation.js";
import { AUCTION_CONFIG, getTurnOrder, resolveAutomatedGeneration } from "./auction.js";

const VERSION = "0.7.2";
const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root element");

let game = createScenario();
let reports = [];
let message = `v${VERSION} ready. First Player: Influence, then Prestige, then Wealth, then random.`;

function createScenario() {
  const state = createGame(["Valenne", "D'Arcy", "Corven"]);
  state.firstPlayerId = state.players[0].id;
  state.autoPopulationDemand = true;
  state.autoInstitutionDemand = true;
  state.autoExternalDemand = true;
  state.rngState = 246813579;
  state.history = [];
  state.institutions = [
    { id: "merchant_guild", name: "Merchant Guild", level: 0 },
    { id: "city_guard", name: "City Guard", level: 1 },
    { id: "temple", name: "Temple", level: 0 },
  ];

  Object.assign(state.city, {
    population: 1,
    order: 0,
    squalor: 0,
    force: 0,
    economicStrength: 0,
    renown: 0,
    religionArcane: 0,
    militaryMercantile: 0,
  });

  for (const sector of state.productionSectors) {
    sector.tier = 1;
    sector.demandThisGeneration = { population: 0, institutions: 0, external_markets: 0 };
  }

  state.players[0].resourceStakes.push({ id: "valenne-farmland", ownerId: "family_1", landId: "farmland" });
  state.players[1].resourceStakes.push({ id: "darcy-pasture", ownerId: "family_2", landId: "pasture" });
  state.players[2].resourceStakes.push({ id: "corven-mine", ownerId: "family_3", landId: "mine" });

  applyAutoDemand(state);
  return state;
}

function playerName(id) {
  return game.players.find(player => player.id === id)?.familyName ?? id ?? "None";
}

function categoryLabel(category) {
  if (!category) return "none";
  if (category === "external_markets") return "External";
  return category[0].toUpperCase() + category.slice(1);
}

function metric(name, value) {
  return `<div class="metric"><span class="number">${value}</span><span class="name">${name}</span></div>`;
}

function priorityText() {
  return getDemandPriorityGroups(game.city.religionArcane, game.city.militaryMercantile)
    .map(group => group.map(categoryLabel).join(" + "))
    .join(" → ");
}

function currentTurnOrderText() {
  return getTurnOrder(game).map(player => player.familyName).join(" → ");
}

function currentWealthBreakdown(playerId) {
  const result = { population: 0, institutions: 0, external_markets: 0, total: 0 };
  for (const report of reports) {
    for (const stake of report.servedStakes ?? []) {
      if (stake.ownerId !== playerId) continue;
      const amount = Number(stake.wealthGenerated) || 0;
      if (stake.demandCategory in result) result[stake.demandCategory] += amount;
      result.total += amount;
    }
  }
  return result;
}

function render() {
  applyAutoDemand(game);
  const latest = game.history?.[game.history.length - 1];
  root.innerHTML = `<main class="app-shell">
    <header class="topbar">
      <div class="brand"><h1>MORNEVAL</h1><p>Automated investment sandbox · Engine v${VERSION}</p></div>
      <div class="generation"><div class="label">Generation</div><div class="value">${game.generation}</div><div class="label">${game.phase.replaceAll("_", " ")}</div></div>
    </header>

    <div class="toolbar">
      <button class="primary" id="run-one">Run 1 automated generation</button>
      <button class="secondary" id="run-five">Run 5 automated generations</button>
      <button class="secondary" id="preview">Preview current economy</button>
      <button class="secondary" id="reset">Reset simulation</button>
    </div>

    <div class="notice"><b>v${VERSION} auction test:</b> each Generation every Family receives +${AUCTION_CONFIG.grossInfluenceIncome} Influence before bidding, then the normal −2 erosion occurs during upkeep. Winning bids are spent; losing bids cost 0. Bids rise one point at a time in player sequence. Each served Population need awards the Stake owner <b>+${AUCTION_CONFIG.populationPrestigePerNeed} Prestige</b>. First Player next Generation is determined by remaining Influence → Prestige → Generation Wealth → random selection.</div>
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

    <section class="panel simulation-panel" style="margin-top:12px">
      <h3>Starting / live city state</h3>
      <div class="simulation-grid">
        <div class="field"><label>Population</label><input type="number" min="0" max="99" data-city="population" value="${game.city.population}"></div>
        <div class="field"><label>Squalor</label><input type="number" min="0" max="20" data-city="squalor" value="${game.city.squalor}"></div>
        <div class="field"><label>Renown</label><input type="number" min="0" max="99" data-city="renown" value="${game.city.renown}"></div>
      </div>
      <div class="prototype-rules"><b>Institutions:</b> City Guard 1; Merchant Guild 0; Temple 0. Total level ${totalInstitutionLevels(game)} / Population ${game.city.population}. <b>Demand priority:</b> ${priorityText()}.</div>
    </section>

    <section class="panel" style="margin-top:12px">
      <h3>First Player & bidding order</h3>
      <div class="prototype-rules"><b>First Player:</b> ${playerName(game.firstPlayerId)}. <b>Current order:</b> ${currentTurnOrderText()}. At Generation end, after Influence erosion: (1) most Influence; (2) if tied, most Prestige; (3) if still tied, most Wealth generated that Generation; (4) if still tied, random selection. The digital sandbox uses seeded randomness for the final step so repeated tests remain reproducible.</div>
    </section>

    <section class="panel" style="margin-top:12px">
      <h3>Automated bidding heuristic</h3>
      <div class="prototype-rules">The AI estimates which current need a newly placed Young Stake would serve. It values Population at 1 (Prestige), Institutions at ${BALANCE_CONFIG.wealthPerDemand.institutions} (Wealth), and External at ${BALANCE_CONFIG.wealthPerDemand.external_markets} (Wealth), then multiplies that immediate value by ${AUCTION_CONFIG.valuationLifetimeGenerations} for the Stake's three-generation lifetime. This is a transparent simulation heuristic, not a locked player rule.</div>
    </section>

    <h2 class="section-title">Families</h2>
    <section class="grid family-grid">${game.players.map(renderFamily).join("")}</section>

    <h2 class="section-title">Production Sectors</h2>
    <section class="grid sector-grid">${game.productionSectors.map(renderSector).join("")}</section>

    <h2 class="section-title">Latest Auction Resolution</h2>
    <section class="report-list">${latest?.auctions?.length ? latest.auctions.map(renderAuction).join("") : '<div class="panel empty">Run an automated generation to create bids.</div>'}</section>

    <h2 class="section-title">Current Economy</h2>
    <section class="report-list">${reports.length ? reports.map(renderReport).join("") : '<div class="panel empty">No current economy preview. Automated generations record their resolved economy in History.</div>'}</section>

    <h2 class="section-title">Generation History</h2>
    <section class="history-list">${game.history?.length ? [...game.history].reverse().map(renderHistory).join("") : '<div class="panel empty">No Generations resolved yet.</div>'}</section>

    <p class="footer-note">Current automated test does not develop Sector tiers, Institutions, Renown or City Inclination. It automates bidding for empty Young Production Stake slots. The bidding sequence starts with the current First Player and then continues in fixed Family seating order.</p>
  </main>`;
  bindEvents();
}

function renderFamily(player) {
  const wealth = currentWealthBreakdown(player.id);
  const stakeCount = player.productionStakes.length;
  const firstPlayer = player.id === game.firstPlayerId ? ' · <b>FIRST PLAYER</b>' : '';
  return `<article class="panel family-card"><h3>${player.familyName}${firstPlayer}</h3><div class="family-stats"><div class="family-stat"><b>${player.prestige}</b><span>Prestige</span></div><div class="family-stat"><b>${player.influence}</b><span>Influence</span></div><div class="family-stat"><b>${player.wealthGeneratedThisGeneration}</b><span>Last Wealth</span></div></div><div class="land-score-preview">Production Stakes: <b>${stakeCount}</b>${reports.length ? `<br>Current preview Wealth: Population ${wealth.population} · Institutions ${wealth.institutions} · External ${wealth.external_markets}` : ""}</div></article>`;
}

function renderSector(sector) {
  const cap = getSectorStakeCapacity(game, sector.id);
  const occ = getSectorStakeOccupancy(game, sector.id);
  const stakes = game.players
    .flatMap(player => player.productionStakes)
    .filter(stake => stake.sectorId === sector.id)
    .sort((a, b) => a.placementOrder - b.placementOrder);
  return `<article class="panel sector-card">
    <div class="sector-head"><h3 class="sector-name">${sector.name}</h3><span class="tier-badge">Tier ${sector.tier}</span></div>
    <div class="slot-summary">
      <div class="slot-chip"><b>${occ.young}/${cap.young}</b><span>young</span></div>
      <div class="slot-chip"><b>${occ.mature}/${cap.mature}</b><span>mature</span></div>
      <div class="slot-chip"><b>${occ.elder}/${cap.elder}</b><span>elder</span></div>
    </div>
    <div class="mini-title">Auto demand</div>
    <div>Population ${sector.demandThisGeneration.population} · Institutions ${sector.demandThisGeneration.institutions} · External ${sector.demandThisGeneration.external_markets}</div>
    <div class="mini-title" style="margin-top:10px">Stakes</div>
    <div class="stakes">${stakes.length ? stakes.map(stake => `<div class="stake ${stake.age}"><div class="stake-main"><b>${playerName(stake.ownerId)}</b><div class="meta">${stake.age} · placed #${stake.placementOrder}</div></div></div>`).join("") : '<div class="empty">No Production Stakes yet</div>'}</div>
  </article>`;
}

function renderAuction(auction) {
  const sector = game.productionSectors.find(item => item.id === auction.sectorId);
  if (auction.skipped) return `<article class="report"><h4>${sector?.name ?? auction.sectorId}</h4><div>${auction.reason}</div></article>`;
  const turns = auction.turns.map(turn => turn.action === "bid"
    ? `${playerName(turn.playerId)} bid ${turn.bid}`
    : `${playerName(turn.playerId)} passed at ${turn.bid}`).join(" → ");
  const order = auction.turnOrder?.map(playerName).join(" → ") ?? currentTurnOrderText();
  return `<article class="report"><h4>${sector?.name ?? auction.sectorId}</h4><div class="report-detail"><b>Starting order:</b> ${order}</div><div class="report-detail"><b>Expected market for winner:</b> ${categoryLabel(auction.expectedCategory)}</div><div class="report-detail"><b>Result:</b> ${auction.winnerId ? `${playerName(auction.winnerId)} wins for ${auction.winningBid} Influence` : "No bid / no Stake placed"}</div><div class="report-detail"><b>Bidding:</b> ${turns || "none"}</div></article>`;
}

function renderReport(report) {
  return `<article class="report"><h4>${report.sectorName}</h4><div class="report-kpis"><div class="kpi"><b>${report.stakeSupply}</b><span>Stake supply</span></div><div class="kpi"><b>${report.resourceLimitedSupply}</b><span>Resource-limited</span></div><div class="kpi"><b>${report.actualProduction}</b><span>Needs served</span></div></div><table><thead><tr><th>Demand</th><th>Requested</th><th>Served</th><th>Wealth/unit</th></tr></thead><tbody>${["population", "institutions", "external_markets"].map(key => `<tr><td>${categoryLabel(key)}</td><td>${report.demand.requested[key]}</td><td>${report.demand.served[key]}</td><td>${BALANCE_CONFIG.wealthPerDemand[key]}</td></tr>`).join("")}</tbody></table><div class="report-detail"><b>Served Stakes:</b> ${report.servedStakes.length ? report.servedStakes.map(stake => `${playerName(stake.ownerId)} (${stake.age}) → ${categoryLabel(stake.demandCategory)} = ${stake.wealthGenerated} Wealth${stake.demandCategory === "population" ? " + 1 Prestige" : ""}`).join("; ") : "none"}</div></article>`;
}

function firstPlayerResolutionText(resolution) {
  if (!resolution) return "";
  if (resolution.tieBreakMethod === "influence") return "highest Influence";
  if (resolution.tieBreakMethod === "prestige") {
    return `Influence tie; won on Prestige (${resolution.maxPrestige})`;
  }
  if (resolution.tieBreakMethod === "wealth") {
    return `Influence + Prestige tie; won on Wealth (${resolution.maxWealth})`;
  }
  if (resolution.tieBreakMethod === "random") {
    const roll = Number.isFinite(resolution.randomRoll) ? resolution.randomRoll.toFixed(3) : "?";
    return `Influence + Prestige + Wealth tie; random selection (seeded roll ${roll})`;
  }
  return resolution.tieBreakMethod ?? "";
}

function renderHistory(entry) {
  const income = game.players.map(player => {
    const row = entry.influenceIncome?.find(item => item.playerId === player.id);
    return `${player.familyName} ${row?.before ?? "?"}→${row?.afterIncome ?? "?"} before bids→${entry.influenceAfter?.[player.id] ?? "?"} after upkeep`;
  }).join(" · ");
  const popPrestige = entry.populationPrestigeAwards?.length
    ? entry.populationPrestigeAwards.map(award => `${playerName(award.playerId)} +${award.amount} (${award.sectorId})`).join(", ")
    : "none";
  const landPrestige = entry.landPrestigeAwards?.length
    ? entry.landPrestigeAwards.map(award => `${playerName(award.playerId)} +${award.amount} (${award.landName})`).join(", ")
    : "none";
  const winners = entry.auctions?.filter(auction => auction.winnerId).map(auction => `${auction.sectorId}: ${playerName(auction.winnerId)} ${auction.winningBid}`).join(" · ") || "none";
  const wealth = game.players.map(player => `${player.familyName} ${entry.wealthAfter?.[player.id] ?? 0}`).join(" · ");
  const firstPlayerLine = `${playerName(entry.firstPlayerBefore)} → ${playerName(entry.nextFirstPlayerId)}`;
  const resolutionText = firstPlayerResolutionText(entry.firstPlayerResolution);
  return `<article class="panel history-card"><div class="history-head"><h3>Generation ${entry.generation}</h3><span>${entry.diseaseOccurred ? "Disease" : "No disease"}</span></div><div class="history-grid"><div><b>${entry.populationBefore} → ${entry.populationAfter}</b><span>Population</span></div><div><b>${entry.foodServed}/${entry.foodRequested}</b><span>Food to Population</span></div><div><b>${entry.squalorBefore} → ${entry.squalorAfter}</b><span>Squalor</span></div><div><b>${winners}</b><span>Auction winners / bids</span></div><div><b>${firstPlayerLine}</b><span>First Player current → next</span></div></div><div class="history-notes"><b>Influence:</b> ${income}<br><b>Next First Player:</b> ${playerName(entry.nextFirstPlayerId)} with ${entry.firstPlayerResolution?.maxInfluence ?? "?"} Influence — ${resolutionText}<br><b>Wealth:</b> ${wealth}<br><b>Population Prestige:</b> ${popPrestige}<br><b>Land Prestige:</b> ${landPrestige}</div></article>`;
}

function syncCityInputs() {
  for (const input of document.querySelectorAll("[data-city]")) {
    const key = input.dataset.city;
    if (key) game.city[key] = Math.max(0, Number(input.value) || 0);
  }
  applyAutoDemand(game);
}

function runGenerations(count) {
  syncCityInputs();
  let last = null;
  const start = game.generation;
  for (let i = 0; i < count; i++) last = resolveAutomatedGeneration(game);
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
    syncCityInputs();
    reports = resolveAllSectorEconomies(game);
    message = "Current economy preview resolved. This preview does not run auctions or advance the Generation.";
    render();
  });
  document.querySelector("#reset")?.addEventListener("click", () => {
    game = createScenario();
    reports = [];
    message = "Simulation reset to Population 1, Tier I sectors, City Guard 1, no Production Stakes. Valenne is First Player.";
    render();
  });
  for (const input of document.querySelectorAll("[data-city]")) {
    input.addEventListener("change", () => {
      syncCityInputs();
      reports = [];
      message = "City value changed; automatic demand recalculated.";
      render();
    });
  }
}

render();