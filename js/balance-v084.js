import {
  V084_CONFIG,
  createV084Game,
  applyAutoDemand,
  previewEconomy,
  resolveAutomatedGeneration,
  setCityValue,
  getTurnOrder,
  getSectorOccupancy,
  sectorResourceCapacity,
  getDemandPriorityGroups,
  resourceLabel,
  getUrbanStatus,
  getFoodSubsistenceStatus,
  getRawProductionBySector,
  getExplorationPoolCounts,
} from "./v084-engine.js";

const VERSION = "0.8.4";
const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root element");

let game = createV084Game();
let reports = [];
let message = `v${VERSION} ready. Imperial demand, direct Farm subsistence and random Hinterland exploration are active.`;

const playerName = id => {
  if (id === "city") return "Morneval";
  return game.players.find(p => p.id === id)?.familyName ?? id ?? "None";
};
const sectorName = id => game.productionSectors.find(s => s.id === id)?.name ?? id ?? "Unknown";
const categoryLabel = key => ({
  population: "City",
  imperial: "Imperial",
  external_markets: "External",
})[key] ?? key ?? "none";
const metric = (name, value) =>
  `<div class="metric"><span class="number">${value}</span><span class="name">${name}</span></div>`;

function axisLabel(axis, value) {
  if (axis === "religionArcane") {
    return ({[-2]:"Academic / Arcane II",[-1]:"Academic / Arcane I",0:"Neutral",1:"Religion I",2:"Religion II"})[value];
  }
  return ({[-2]:"Military II",[-1]:"Military I",0:"Neutral",1:"Commercial / Mercantile I",2:"Commercial / Mercantile II"})[value];
}

function axisSelect(axis, value) {
  const label = axis === "religionArcane"
    ? "Academic / Arcane ↔ Religion"
    : "Military ↔ Commercial / Mercantile";
  return `<div class="field"><label>${label}</label><select data-axis="${axis}">${[-2,-1,0,1,2]
    .map(v => `<option value="${v}" ${v===value?"selected":""}>${axisLabel(axis,v)}</option>`)
    .join("")}</select></div>`;
}

function priorityText() {
  return getDemandPriorityGroups(game)
    .map(group => group.map(categoryLabel).join(" + "))
    .join(" → ");
}

function demandTotal(sector) {
  const d = sector.demandThisGeneration;
  return (d.population || 0) + (d.imperial || 0) + (d.external_markets || 0);
}

const RAW_SERIES = [
  { sectorId: "food", name: "Raw Food" },
  { sectorId: "textiles", name: "Wool" },
  { sectorId: "smithing", name: "Ore" },
  { sectorId: "materials", name: "Wood" },
];

function chartData() {
  const h = game.history ?? [];
  const generations = h.length ? [0, ...h.map(e => e.generation)] : [0];
  const raw = Object.fromEntries(RAW_SERIES.map(def => [
    def.sectorId,
    [0, ...h.map(entry => Number(entry.rawProductionAfterExpansion?.[def.sectorId]) || 0)],
  ]));
  return {
    generations,
    population: [h[0]?.populationBefore ?? game.city.population, ...h.map(e => e.populationAfter)],
    urbanCapacity: [V084_CONFIG.urban.populationPerTile, ...h.map(e => e.urbanCapacityAfter ?? V084_CONFIG.urban.populationPerTile)],
    squalor: [h[0]?.squalorBefore ?? game.city.squalor, ...h.map(e => e.squalorAfter)],
    renown: [h[0]?.renownBeforeGrowth ?? game.city.renown, ...h.map(e => e.renownAfterGrowth)],
    wealth: Object.fromEntries(game.players.map(p => [
      p.id,
      [V084_CONFIG.familyBaseWealth, ...h.map(e => Number(e.wealthAfter?.[p.id]) || V084_CONFIG.familyBaseWealth)],
    ])),
    prestige: Object.fromEntries(game.players.map(p => [
      p.id,
      [0, ...h.map(e => Number(e.prestigeAfter?.[p.id]) || 0)],
    ])),
    raw,
  };
}

function chartSvg(labels, series, ariaLabel) {
  const W=720,H=240,L=46,R=16,T=16,B=34,pw=W-L-R,ph=H-T-B;
  const values=series.flatMap(s=>s.values).filter(Number.isFinite);
  const max=Math.max(1,...values), ymax=Math.max(1,Math.ceil(max*1.15));
  const x=i=>L+(labels.length===1?pw/2:(i/(labels.length-1))*pw);
  const y=v=>T+ph-(v/ymax)*ph;
  let grid="";
  for(let i=0;i<=4;i+=1){
    const val=(ymax*i)/4,yy=y(val);
    grid+=`<line class="chart-grid-line" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/><text class="chart-axis-label" x="${L-7}" y="${yy+4}" text-anchor="end">${Number.isInteger(val)?val:val.toFixed(1)}</text>`;
  }
  const step=Math.max(1,Math.ceil(labels.length/10));
  const xl=labels.map((g,i)=>(i===labels.length-1||i%step===0)
    ?`<text class="chart-axis-label" x="${x(i)}" y="${H-9}" text-anchor="middle">${i===0?"Start":`G${g}`}</text>`:"").join("");
  const lines=series.map((s,si)=>{
    const pts=s.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");
    const dots=s.values.map((v,i)=>`<circle class="chart-point series-${si}" cx="${x(i)}" cy="${y(v)}" r="3.5"><title>${s.name} · ${i===0?"Start":`Generation ${labels[i]}`} · ${v}</title></circle>`).join("");
    return `<polyline class="chart-line series-${si}" points="${pts}"/>${dots}`;
  }).join("");
  return `<svg class="evolution-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ariaLabel}">${grid}<line class="chart-axis" x1="${L}" y1="${T}" x2="${L}" y2="${H-B}"/><line class="chart-axis" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/>${xl}${lines}</svg>`;
}

function legend(series) {
  return series.length<2 ? "" : `<div class="chart-legend">${series.map((s,i)=>
    `<span><i class="legend-swatch series-${i}"></i>${s.name}: <b>${s.values.at(-1) ?? 0}</b></span>`).join("")}</div>`;
}

function chartsHtml() {
  const d=chartData();
  const pop=[{name:"Population",values:d.population},{name:"Urban capacity",values:d.urbanCapacity}];
  const sq=[{name:"Squalor",values:d.squalor}];
  const ren=[{name:"Renown",values:d.renown}];
  const wealth=game.players.map(p=>({name:p.familyName,values:d.wealth[p.id]}));
  const prestige=game.players.map(p=>({name:p.familyName,values:d.prestige[p.id]}));
  const raw=RAW_SERIES.map(def=>({name:def.name,values:d.raw[def.sectorId]}));
  return `<section class="chart-grid">
    <article class="panel chart-card"><div class="chart-head"><h3>Population & urban capacity</h3><span>3 Population per Urban tile</span></div>${chartSvg(d.generations,pop,"Population and urban capacity by generation")}${legend(pop)}</article>
    <article class="panel chart-card"><div class="chart-head"><h3>Squalor</h3><span>Driven by overcrowding</span></div>${chartSvg(d.generations,sq,"Squalor by generation")}<div class="chart-latest">Latest: <b>${d.squalor.at(-1)}</b></div></article>
    <article class="panel chart-card"><div class="chart-head"><h3>Renown</h3><span>Maximum = Population × 2</span></div>${chartSvg(d.generations,ren,"Renown by generation")}<div class="chart-latest">Latest: <b>${d.renown.at(-1)}</b></div></article>
    <article class="panel chart-card"><div class="chart-head"><h3>Family Wealth</h3><span>Includes permanent base Wealth 1</span></div>${chartSvg(d.generations,wealth,"Family Wealth by generation")}${legend(wealth)}</article>
    <article class="panel chart-card"><div class="chart-head"><h3>Family Prestige</h3><span>Cumulative after rewards and Imperial penalties</span></div>${chartSvg(d.generations,prestige,"Family Prestige by generation")}${legend(prestige)}</article>
    <article class="panel chart-card raw-chart"><div class="chart-head"><h3>Raw-material production</h3><span>Gross revealed productive capacity after expansion</span></div>${chartSvg(d.generations,raw,"Raw material production by generation")}${legend(raw)}<div class="chart-latest">Raw Food is Farm output before subsistence; Wool, Ore and Wood are explored productive territory capacity.</div></article>
  </section>`;
}

function familyCard(p) {
  const land=game.lands.filter(l=>l.ownerId===p.id && l.development!=="urban").length;
  return `<article class="panel family-card"><h3>${p.familyName}${p.id===game.firstPlayerId?" · FIRST PLAYER":""}</h3><div class="family-stats"><div class="family-stat"><b>${p.prestige}</b><span>Prestige</span></div><div class="family-stat"><b>${p.influence}</b><span>Influence</span></div><div class="family-stat"><b>${p.wealthGeneratedThisGeneration}</b><span>Wealth capacity</span></div></div><div class="land-score-preview">Permanent Family base: <b>1 Wealth</b><br>Production Stakes: <b>${p.productionStakes.length}</b> · productive territories: <b>${land}</b><br>Last commitment: ${p.lastWealthCommitted} · free: ${p.lastWealthAvailable}</div></article>`;
}

function sectorCard(s) {
  const o=getSectorOccupancy(game,s.id),cap=sectorResourceCapacity(game,s.id),next=s.tier<3?s.developmentPhase+1:null,cost=next?V084_CONFIG.developmentPhases[next]:null;
  const stakes=game.players.flatMap(p=>p.productionStakes).filter(st=>st.sectorId===s.id).sort((a,b)=>a.placementOrder-b.placementOrder);
  const imperial = s.id === "food" ? "" : `<span class="resource-chip">Imperial ${s.demandThisGeneration.imperial}</span>`;
  return `<article class="panel sector-card"><div class="sector-head"><h3>${s.name}</h3><span class="tier-badge">Tier ${s.tier}</span></div>
    <div class="slot-summary"><div class="slot-chip"><b>${o.young}/${s.tier}</b><span>young</span></div><div class="slot-chip"><b>${o.mature}/${s.tier}</b><span>mature</span></div><div class="slot-chip"><b>${o.elder}/${s.tier}</b><span>elder</span></div></div>
    <div class="phase-track">${[1,2,3].map(p=>`<div class="phase-dot ${p<=s.developmentPhase?"done":""}">P${p}</div>`).join("")}</div>
    <div>${s.tier>=3?"Maximum Tier reached":`<b>Toward Tier ${s.tier+1}</b> · next P${next}: ${cost.influenceCost}I + ${cost.wealthCost}W → +${cost.prestige} Prestige`}</div>
    <div class="sector-pressure">Demand ${demandTotal(s)} · usable raw input ${cap} · slot capacity ${s.tier*3}</div>
    <div class="resource-row"><span class="resource-chip">City ${s.demandThisGeneration.population}</span>${imperial}<span class="resource-chip">External ${s.demandThisGeneration.external_markets}</span></div>
    <div class="mini-title">Stakes</div><div class="stakes">${stakes.length?stakes.map(st=>`<div class="stake ${st.age}"><b>${playerName(st.ownerId)}</b> · ${st.age} · #${st.placementOrder}</div>`).join(""):"<div class=\"empty\">No Production Stakes</div>"}</div></article>`;
}

function landCard(l) {
  if (!l.revealed) {
    return `<article class="panel hinterland-tile"><div class="tile-type">Unexplored</div><h3>${l.name}</h3><div class="tile-output">Terrain unknown</div><div class="tile-owner">Explore: 3 Influence + 1 Wealth capacity</div></article>`;
  }
  if (l.development === "urban") {
    return `<article class="panel hinterland-tile city-tile"><div class="tile-type">Urbanised ${l.originalTerrain}</div><h3>${l.name} → Morneval</h3><div class="tile-output">Raw production permanently lost: ${l.formerCapacity ?? 0}</div><div class="tile-owner">Exploration #${l.explorationOrder} · absorbed G${l.urbanizedGeneration ?? "?"}${l.formerOwnerId?`<br>Former owner: <b>${playerName(l.formerOwnerId)}</b> · no compensation`:""}</div></article>`;
  }
  return `<article class="panel hinterland-tile"><div class="tile-type">${l.development==="farm"?`Farm · former ${l.originalTerrain}`:l.originalTerrain}</div><h3>${l.name}</h3><div class="tile-output">Output: ${resourceLabel(l.resourceType)} +${l.baseCapacity}</div><div class="tile-owner">Owner: <b>${playerName(l.ownerId)}</b> · exploration #${l.explorationOrder}${l.usedCapacityThisGeneration>0?`<br>Used last Generation: ${l.usedCapacityThisGeneration}`:""}</div></article>`;
}

function demandReward(category) {
  if (category === "population") return "1 Prestige";
  if (category === "external_markets") return "1 Wealth";
  return "No reward";
}

function reportCard(r) {
  const rows = r.sectorId === "food"
    ? ["population","external_markets"]
    : ["imperial","population","external_markets"];
  return `<article class="report"><h4>${r.sectorName}</h4><div class="report-kpis"><div class="kpi"><b>${r.stakeSupply}</b><span>Stake supply</span></div><div class="kpi"><b>${r.totalResourceCapacity}</b><span>Raw input</span></div><div class="kpi"><b>${r.actualProduction}</b><span>Needs served</span></div></div><table><thead><tr><th>Demand</th><th>Req.</th><th>Served</th><th>Effect/unit</th></tr></thead><tbody>${rows.map(k=>`<tr><td>${categoryLabel(k)}</td><td>${r.demand.requested[k]}</td><td>${r.demand.served[k]}</td><td>${demandReward(k)}</td></tr>`).join("")}</tbody></table></article>`;
}

function actionText(a){
  if(a.type==="sector_development") return `${playerName(a.playerId)} funded ${sectorName(a.sectorId)} P${a.phase} (${a.influenceCost}I + ${a.wealthCost}W, +${a.prestige}P)${a.tierActivated?` — Tier ${a.newTier} active`:""}`;
  if(a.type==="hinterland_exploration") return `${playerName(a.playerId)} explored ${a.landId}: ${a.terrain} (#${a.explorationOrder}) for ${a.influenceCost}I + ${a.wealthCost}W`;
  if(a.type==="farm_conversion") return `${playerName(a.playerId)} converted ${a.landId} to Farm (${a.influenceCost}I + ${a.wealthCost}W)`;
  if(a.type==="bid") return `${playerName(a.playerId)} bid ${a.bid} on ${sectorName(a.sectorId)} (${categoryLabel(a.expectedCategory)})`;
  if(a.type==="pass_auction") return `${playerName(a.playerId)} passed on ${sectorName(a.sectorId)}`;
  return a.type;
}

function expansionText(e) {
  if (!e.expansionEvents?.length) return "none";
  return e.expansionEvents.map(x =>
    `${x.landName} (#${x.explorationOrder}, ${x.originalTerrain}, ${x.lostCapacity} capacity${x.previousOwnerId?`, ${playerName(x.previousOwnerId)} lost ownership`:""})`)
    .join("; ");
}

function historyCard(e){
  const wealth=e.wealthCommitments.map(w=>`${playerName(w.playerId)} ${w.gross}W`).join(" · ");
  const penalties = [
    e.imperialFoodAidUsed ? `Imperial food aid: all Families −1 Prestige` : null,
    e.imperialDemandPenaltyApplied ? `Unmet Imperial demand (${e.imperialUnmetTotal}): all Families −1 Prestige` : null,
  ].filter(Boolean).join(" · ") || "none";
  return `<article class="panel history-card"><div class="history-head"><h3>Generation ${e.generation}</h3><span>${e.diseaseOccurred?"Disease":"No disease"}</span></div><div class="history-grid">
    <div><b>${e.populationBefore} → ${e.populationAfter}</b><span>Population</span></div>
    <div><b>${e.rawFoodLocalServed}/${e.rawFoodRequested}</b><span>Local raw Food · Imperial aid ${e.imperialFoodAid}</span></div>
    <div><b>${e.squalorBefore} → ${e.squalorAfter}</b><span>Squalor · target ${e.squalorTarget}</span></div>
    <div><b>${e.urbanTilesBefore} → ${e.urbanTilesAfter}</b><span>Urban tiles · capacity ${e.urbanCapacityAfter}</span></div>
    <div><b>${e.renownBeforeGrowth} → ${e.renownAfterGrowth}</b><span>Renown · cap ${e.renownCap}</span></div>
    <div><b>${wealth}</b><span>Family Wealth</span></div>
  </div><div class="history-notes"><b>Imperial penalties:</b> ${penalties}<br><b>Expansion:</b> ${expansionText(e)}<br><b>Next First Player:</b> ${playerName(e.nextFirstPlayerId)}</div><details><summary>Action log (${e.actions.length})</summary><div class="action-log">${e.actions.map((a,i)=>`${i+1}. ${actionText(a)}`).join("<br>")}</div></details></article>`;
}

function render(){
  applyAutoDemand(game);
  const urban=getUrbanStatus(game);
  const subsistence=getFoodSubsistenceStatus(game);
  const pool=getExplorationPoolCounts(game);
  const raw=getRawProductionBySector(game);
  const renownCap=game.city.population*V084_CONFIG.renown.capPerPopulation;

  root.innerHTML=`<main class="app-shell"><header class="topbar"><div class="brand"><h1>MORNEVAL</h1><p>Imperial outpost economy · Engine v${VERSION}</p></div><div class="generation"><div class="label">Generation</div><div class="value">${game.generation}</div><div class="label">${game.phase.replaceAll("_"," ")}</div></div></header>
  <div class="toolbar"><button class="primary" id="run-one">Run 1 automated generation</button><button class="secondary" id="run-five">Run 5 automated generations</button><button class="secondary" id="preview">Preview current economy</button><button class="secondary" id="reset">Reset simulation</button></div>
  <div class="notice"><b>v${VERSION}:</b> Farms directly feed Population first. Surplus Farm output can enter the Refined Food sector. Non-Food sectors have constant Imperial demand 1; if any Imperial demand remains unmet, every Family loses 1 Prestige. External service gives 1 Wealth. Every Family has permanent base Wealth 1.</div><div class="status">${message}</div>

  <h2 class="section-title">Morneval</h2><section class="grid city-grid">${metric("Population",game.city.population)}${metric("Urban tiles",urban.urbanTiles)}${metric("Urban capacity",urban.urbanCapacity)}${metric("Overcrowding",urban.overcrowding)}${metric("Squalor",game.city.squalor)}${metric("Renown",game.city.renown)}${metric("Renown cap",renownCap)}${metric("Local raw Food",subsistence.localCapacity)}${metric("Imperial Food aid",subsistence.imperialAid)}</section>

  <section class="panel" style="margin-top:12px"><h3>Test controls</h3><div class="v08-grid v08-controls"><div class="field"><label>Population</label><input type="number" min="1" data-city="population" value="${game.city.population}"></div><div class="field"><label>Squalor</label><input type="number" min="0" data-city="squalor" value="${game.city.squalor}"></div><div class="field"><label>Renown</label><input type="number" min="0" data-city="renown" value="${game.city.renown}"></div>${axisSelect("religionArcane",game.city.religionArcane)}${axisSelect("militaryMercantile",game.city.militaryMercantile)}</div><div class="prototype-rules"><b>Production priority:</b> ${priorityText()}. Military prioritises City demand; Commercial prioritises External; Neutral prioritises Imperial. Academic/Religion does not change economic allocation.</div></section>

  <section class="panel" style="margin-top:12px"><h3>Raw Food & Imperial pressure</h3><div class="prototype-rules"><b>Subsistence:</b> Farms currently produce ${subsistence.localCapacity} raw Food for ${subsistence.requested} Population need. City subsistence always consumes raw Food before Refined Food production. Missing Food is supplied by the Empire; if any aid is used, all Families lose 1 Prestige, minimum 0, and Population does not grow.</div><div class="prototype-rules" style="margin-top:8px"><b>Imperial demand:</b> Textiles, Smithing and Construction Materials each request 1 Imperial unit every Generation. It gives no reward when met. If any Imperial demand is left unmet, all Families lose 1 Prestige, minimum 0.</div></section>

  <h2 class="section-title">Families</h2><section class="grid family-grid">${game.players.map(familyCard).join("")}</section>
  <section class="panel" style="margin-top:12px"><h3>First Player</h3><div class="prototype-rules"><b>${playerName(game.firstPlayerId)}</b> · ${getTurnOrder(game).map(p=>p.familyName).join(" → ")} · next First Player: Influence → Prestige → Generation Wealth → random.</div></section>

  <h2 class="section-title">Evolution by Generation</h2>${chartsHtml()}

  <h2 class="section-title">Production Sectors & Refinement</h2><section class="v08-grid development-grid">${game.productionSectors.map(sectorCard).join("")}</section>

  <h2 class="section-title">Hinterland exploration</h2><section class="panel" style="margin-bottom:12px"><div class="prototype-rules"><b>Explore:</b> 3 Influence + 1 Wealth capacity. Terrain is random from a finite pool of 4 Forests, 4 Meadows and 4 Hills. Remaining hidden pool: Forest ${pool.forest} · Meadow ${pool.meadow} · Hill ${pool.hill}. Each revealed territory has capacity 2. Current gross raw production: Food ${raw.food} · Wool ${raw.textiles} · Ore ${raw.smithing} · Wood ${raw.materials}.</div><div class="prototype-rules" style="margin-top:8px"><b>City expansion:</b> when Morneval needs another Urban tile, it absorbs the oldest explored territory still available. Ownership and all production are lost without compensation.</div></section>
  <section class="v08-grid hinterland-grid"><article class="panel hinterland-tile city-tile"><div class="tile-type">Original City</div><h3>Morneval</h3><div class="tile-output">Urban capacity 3</div><div class="tile-owner">Every additional Urban tile supports +3 Population.</div></article>${game.lands.map(landCard).join("")}</section>

  <h2 class="section-title">Current Economy</h2><section class="report-list">${reports.length?reports.map(reportCard).join(""):"<div class=\"panel empty\">Use Preview or resolve a Generation.</div>"}</section>

  <h2 class="section-title">Generation History</h2><section class="history-list">${game.history.length?[...game.history].reverse().map(historyCard).join(""):"<div class=\"panel empty\">No Generations resolved yet.</div>"}</section>
  <p class="footer-note">The current AI treats exploration and Farm conversion as economic actions. Terrain selection itself is random; the AI cannot choose whether an explored space is Forest, Meadow or Hill.</p></main>`;
  bindEvents();
}

function syncInputs(){
  document.querySelectorAll("[data-city]").forEach(el=>setCityValue(game,el.dataset.city,el.value));
  document.querySelectorAll("[data-axis]").forEach(el=>setCityValue(game,el.dataset.axis,el.value));
  applyAutoDemand(game);
}

function run(count){
  syncInputs();
  let last=null,start=game.generation;
  for(let i=0;i<count;i+=1) last=resolveAutomatedGeneration(game);
  reports=last?.economyReports??[];
  message=count===1?`Generation ${start} resolved.`:`Generations ${start}–${game.generation-1} resolved.`;
  render();
}

function bindEvents(){
  document.querySelector("#run-one")?.addEventListener("click",()=>run(1));
  document.querySelector("#run-five")?.addEventListener("click",()=>run(5));
  document.querySelector("#preview")?.addEventListener("click",()=>{
    syncInputs();
    reports=previewEconomy(game).reports;
    message="Economy preview recalculated.";
    render();
  });
  document.querySelector("#reset")?.addEventListener("click",()=>{
    game=createV084Game();
    reports=[];
    message=`v${VERSION} simulation reset.`;
    render();
  });
  document.querySelectorAll("[data-city],[data-axis]").forEach(el=>el.addEventListener("change",()=>{
    syncInputs();
    reports=[];
    message="Test value changed; demand recalculated.";
    render();
  }));
}

render();
