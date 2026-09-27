import { V082_ACTIVE_DEMAND } from "./v082-balance-patch.js";
import {
  V08_CONFIG, createV08Game, applyAutoDemand, previewEconomy,
  resolveAutomatedGeneration, setCityValue, getTurnOrder,
  getSectorOccupancy, sectorResourceCapacity, getDemandPriorityGroups, resourceLabel,
} from "./v08-engine.js";

const VERSION = "0.8.2";
const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root element");

function createCurrentGame() {
  const state = createV08Game();
  // Institution demand has been removed from the active economy. Keep the old
  // engine field structurally dormant so older engine helpers remain compatible.
  state.institutions = [];
  applyAutoDemand(state);
  return state;
}

let game = createCurrentGame();
let reports = [];
let message = `v${VERSION} ready. Two-market demand model and raw-material chart active.`;

const playerName = id => game.players.find(p => p.id === id)?.familyName ?? id ?? "None";
const sectorName = id => game.productionSectors.find(s => s.id === id)?.name ?? id ?? "Unknown";
const categoryLabel = key => {
  if (key === "population") return "City / Population";
  if (key === "external_markets") return "External";
  return key ?? "none";
};
const metric = (name, value) => `<div class="metric"><span class="number">${value}</span><span class="name">${name}</span></div>`;

function axisLabel(axis, value) {
  if (axis === "religionArcane") return ({[-2]:"Academic / Arcane II",[-1]:"Academic / Arcane I",0:"Neutral",1:"Religion I",2:"Religion II"})[value];
  return ({[-2]:"Military II",[-1]:"Military I",0:"Neutral",1:"Commercial / Mercantile I",2:"Commercial / Mercantile II"})[value];
}
function axisSelect(axis, value) {
  const label = axis === "religionArcane" ? "Academic / Arcane ↔ Religion" : "Military ↔ Commercial / Mercantile";
  return `<div class="field"><label>${label}</label><select data-axis="${axis}">${[-2,-1,0,1,2].map(v=>`<option value="${v}" ${v===value?"selected":""}>${axisLabel(axis,v)}</option>`).join("")}</select></div>`;
}
function priorityText() {
  const groups = getDemandPriorityGroups(game)
    .map(group => group.filter(category => V082_ACTIVE_DEMAND.includes(category)))
    .filter(group => group.length > 0);
  return groups.map(group => group.map(categoryLabel).join(" + ")).join(" → ");
}
function demandTotal(sector) {
  const d = sector.demandThisGeneration;
  return d.population + d.external_markets;
}

const RAW_SERIES = [
  { sectorId: "food", resourceType: "grain", name: "Food / Grain" },
  { sectorId: "textiles", resourceType: "wool", name: "Wool" },
  { sectorId: "smithing", resourceType: "ore", name: "Ore" },
  { sectorId: "materials", resourceType: "wood", name: "Wood" },
];

function chartData() {
  const h = game.history ?? [];
  const generations = h.length ? [0, ...h.map(e => e.generation)] : [0];
  const rawCapacity = Object.fromEntries(RAW_SERIES.map(def => {
    const baseline = V08_CONFIG.cityBaseResourceCapacity[def.resourceType] ?? 0;
    const values = [baseline, ...h.map(entry => {
      const report = entry.economyReports?.find(item => item.sectorId === def.sectorId);
      return Number(report?.totalResourceCapacity) || baseline;
    })];
    return [def.sectorId, values];
  }));
  return {
    generations,
    population: [h[0]?.populationBefore ?? game.city.population, ...h.map(e => e.populationAfter)],
    renown: [h[0]?.renownBeforeGrowth ?? game.city.renown, ...h.map(e => e.renownAfterGrowth)],
    wealth: Object.fromEntries(game.players.map(p => [p.id, [0, ...h.map(e => Number(e.wealthAfter?.[p.id]) || 0)]])),
    prestige: Object.fromEntries(game.players.map(p => [p.id, [0, ...h.map(e => Number(e.prestigeAfter?.[p.id]) || 0)]])),
    rawCapacity,
  };
}

function chartSvg(labels, series, ariaLabel) {
  const W=720,H=240,L=46,R=16,T=16,B=34,pw=W-L-R,ph=H-T-B;
  const values=series.flatMap(s=>s.values).filter(Number.isFinite);
  const max=Math.max(1,...values), ymax=Math.max(1,Math.ceil(max*1.15));
  const x=i=>L+(labels.length===1?pw/2:(i/(labels.length-1))*pw);
  const y=v=>T+ph-(v/ymax)*ph;
  let grid="";
  for(let i=0;i<=4;i+=1){const val=(ymax*i)/4,yy=y(val);grid+=`<line class="chart-grid-line" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/><text class="chart-axis-label" x="${L-7}" y="${yy+4}" text-anchor="end">${Number.isInteger(val)?val:val.toFixed(1)}</text>`;}
  const step=Math.max(1,Math.ceil(labels.length/10));
  const xl=labels.map((g,i)=>(i===labels.length-1||i%step===0)?`<text class="chart-axis-label" x="${x(i)}" y="${H-9}" text-anchor="middle">${i===0?"Start":`G${g}`}</text>`:"").join("");
  const lines=series.map((s,si)=>{
    const pts=s.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");
    const dots=s.values.map((v,i)=>`<circle class="chart-point series-${si}" cx="${x(i)}" cy="${y(v)}" r="3.5"><title>${s.name} · ${i===0?"Start":`Generation ${labels[i]}`} · ${v}</title></circle>`).join("");
    return `<polyline class="chart-line series-${si}" points="${pts}"/>${dots}`;
  }).join("");
  return `<svg class="evolution-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ariaLabel}">${grid}<line class="chart-axis" x1="${L}" y1="${T}" x2="${L}" y2="${H-B}"/><line class="chart-axis" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/>${xl}${lines}</svg>`;
}
function legend(series) {
  return series.length<2?"":`<div class="chart-legend">${series.map((s,i)=>`<span><i class="legend-swatch series-${i}"></i>${s.name}: <b>${s.values.at(-1) ?? 0}</b></span>`).join("")}</div>`;
}
function chartsHtml() {
  const d=chartData();
  const pop=[{name:"Population",values:d.population}], ren=[{name:"Renown",values:d.renown}];
  const wealth=game.players.map(p=>({name:p.familyName,values:d.wealth[p.id]}));
  const prestige=game.players.map(p=>({name:p.familyName,values:d.prestige[p.id]}));
  const raw=RAW_SERIES.map(def=>({name:def.name,values:d.rawCapacity[def.sectorId]}));
  return `<section class="chart-grid">
    <article class="panel chart-card"><div class="chart-head"><h3>Population</h3><span>End of Generation</span></div>${chartSvg(d.generations,pop,"Population by generation")}<div class="chart-latest">Latest: <b>${d.population.at(-1)}</b></div></article>
    <article class="panel chart-card"><div class="chart-head"><h3>Renown</h3><span>End of Generation</span></div>${chartSvg(d.generations,ren,"Renown by generation")}<div class="chart-latest">Latest: <b>${d.renown.at(-1)}</b></div></article>
    <article class="panel chart-card"><div class="chart-head"><h3>Family Wealth</h3><span>Gross Wealth generated that Generation</span></div>${chartSvg(d.generations,wealth,"Family Wealth by generation")}${legend(wealth)}</article>
    <article class="panel chart-card"><div class="chart-head"><h3>Family Prestige</h3><span>Cumulative at Generation end</span></div>${chartSvg(d.generations,prestige,"Family Prestige by generation")}${legend(prestige)}</article>
    <article class="panel chart-card raw-chart"><div class="chart-head"><h3>Raw-material production capacity</h3><span>Available capacity after action phase</span></div>${chartSvg(d.generations,raw,"Raw material production capacity by generation")}${legend(raw)}<div class="chart-latest">Tracks available capacity, not only the amount consumed. Each acquired natural territory currently adds 2 capacity to its resource; a converted Farm contributes its 2 capacity to Food instead.</div></article>
  </section>`;
}

function familyCard(p) {
  const land=game.lands.filter(l=>l.ownerId===p.id).length;
  return `<article class="panel family-card"><h3>${p.familyName}${p.id===game.firstPlayerId?" · FIRST PLAYER":""}</h3><div class="family-stats"><div class="family-stat"><b>${p.prestige}</b><span>Prestige</span></div><div class="family-stat"><b>${p.influence}</b><span>Influence</span></div><div class="family-stat"><b>${p.wealthGeneratedThisGeneration}</b><span>Gross Wealth</span></div></div><div class="land-score-preview">Production Stakes: <b>${p.productionStakes.length}</b> · Hinterland: <b>${land}</b><br>Last Wealth: ${p.lastWealthCommitted} committed · ${p.lastWealthAvailable} free</div></article>`;
}
function sectorCard(s) {
  const o=getSectorOccupancy(game,s.id),cap=sectorResourceCapacity(game,s.id),next=s.tier<3?s.developmentPhase+1:null,cost=next?V08_CONFIG.developmentPhases[next]:null;
  const stakes=game.players.flatMap(p=>p.productionStakes).filter(st=>st.sectorId===s.id).sort((a,b)=>a.placementOrder-b.placementOrder);
  return `<article class="panel sector-card"><div class="sector-head"><h3>${s.name}</h3><span class="tier-badge">Tier ${s.tier}</span></div><div class="slot-summary"><div class="slot-chip"><b>${o.young}/${s.tier}</b><span>young</span></div><div class="slot-chip"><b>${o.mature}/${s.tier}</b><span>mature</span></div><div class="slot-chip"><b>${o.elder}/${s.tier}</b><span>elder</span></div></div><div class="phase-track">${[1,2,3].map(p=>`<div class="phase-dot ${p<=s.developmentPhase?"done":""}">P${p}</div>`).join("")}</div><div>${s.tier>=3?"Maximum Tier reached":`<b>Toward Tier ${s.tier+1}</b> · next P${next}: ${cost.influenceCost}I + ${cost.wealthCost}W → +${cost.prestige} Prestige`}</div><div class="sector-pressure">Demand ${demandTotal(s)} · raw capacity ${cap} · slot capacity ${s.tier*3}</div><div class="resource-row"><span class="resource-chip">City ${s.demandThisGeneration.population}</span><span class="resource-chip">External ${s.demandThisGeneration.external_markets}</span></div><div class="mini-title">Stakes</div><div class="stakes">${stakes.length?stakes.map(st=>`<div class="stake ${st.age}"><b>${playerName(st.ownerId)}</b> · ${st.age} · #${st.placementOrder}</div>`).join(""):"<div class=\"empty\">No Production Stakes</div>"}</div></article>`;
}
function landCard(l) {
  return `<article class="panel hinterland-tile"><div class="tile-type">${l.development==="farm"?`converted ${l.originalTerrain}`:l.originalTerrain}</div><h3>${l.development==="farm"?`Farm (${l.name})`:l.name}</h3><div class="tile-output">Output: ${resourceLabel(l.resourceType)} +${l.baseCapacity}</div><div class="tile-owner">Owner: <b>${l.ownerId?playerName(l.ownerId):"Unowned"}</b>${l.usedCapacityThisGeneration>0?`<br>Used: ${l.usedCapacityThisGeneration}`:""}</div></article>`;
}
function reportCard(r) {
  return `<article class="report"><h4>${r.sectorName}</h4><div class="report-kpis"><div class="kpi"><b>${r.stakeSupply}</b><span>Stake supply</span></div><div class="kpi"><b>${r.totalResourceCapacity}</b><span>Raw capacity</span></div><div class="kpi"><b>${r.actualProduction}</b><span>Needs served</span></div></div><table><thead><tr><th>Demand</th><th>Req.</th><th>Served</th><th>Reward/unit</th></tr></thead><tbody>${V082_ACTIVE_DEMAND.map(k=>`<tr><td>${categoryLabel(k)}</td><td>${r.demand.requested[k]}</td><td>${r.demand.served[k]}</td><td>${k==="population"?"1 Prestige":"1 Wealth"}</td></tr>`).join("")}</tbody></table></article>`;
}
function actionText(a){
  if(a.type==="sector_development") return `${playerName(a.playerId)} funded ${sectorName(a.sectorId)} P${a.phase} (${a.influenceCost}I + ${a.wealthCost}W, +${a.prestige}P)${a.tierActivated?` — Tier ${a.newTier} active`:""}`;
  if(a.type==="hinterland_acquisition") return `${playerName(a.playerId)} acquired ${a.landId} (${a.influenceCost}I + ${a.wealthCost}W)`;
  if(a.type==="farm_conversion") return `${playerName(a.playerId)} converted ${a.landId} to Farm (${a.influenceCost}I + ${a.wealthCost}W)`;
  if(a.type==="bid") return `${playerName(a.playerId)} bid ${a.bid} on ${sectorName(a.sectorId)}`;
  if(a.type==="pass_auction") return `${playerName(a.playerId)} passed on ${sectorName(a.sectorId)}`;
  return a.type;
}
function historyCard(e){
  const wealth=e.wealthCommitments.map(w=>`${playerName(w.playerId)} ${w.gross}W`).join(" · ");
  return `<article class="panel history-card"><div class="history-head"><h3>Generation ${e.generation}</h3><span>${e.diseaseOccurred?"Disease":"No disease"}</span></div><div class="history-grid"><div><b>${e.populationBefore} → ${e.populationAfter}</b><span>Population</span></div><div><b>${e.renownBeforeGrowth} → ${e.renownAfterGrowth}</b><span>Renown</span></div><div><b>${wealth}</b><span>Family Wealth</span></div><div><b>${playerName(e.nextFirstPlayerId)}</b><span>Next First Player</span></div></div><details><summary>Action log (${e.actions.length})</summary><div class="action-log">${e.actions.map((a,i)=>`${i+1}. ${actionText(a)}`).join("<br>")}</div></details></article>`;
}

function render(){
  applyAutoDemand(game);
  root.innerHTML=`<main class="app-shell"><header class="topbar"><div class="brand"><h1>MORNEVAL</h1><p>Economic development sandbox · Engine v${VERSION}</p></div><div class="generation"><div class="label">Generation</div><div class="value">${game.generation}</div><div class="label">${game.phase.replaceAll("_"," ")}</div></div></header>
  <div class="toolbar"><button class="primary" id="run-one">Run 1 automated generation</button><button class="secondary" id="run-five">Run 5 automated generations</button><button class="secondary" id="preview">Preview current economy</button><button class="secondary" id="reset">Reset simulation</button></div>
  <div class="notice"><b>v${VERSION}:</b> Institution demand has been removed. Only City/Population and External demand remain. Serving City demand awards 1 Prestige; serving External demand awards 1 Wealth. Natural Hinterland territories now provide 2 raw-material capacity.</div><div class="status">${message}</div>
  <h2 class="section-title">Morneval</h2><section class="grid city-grid">${metric("Population",game.city.population)}${metric("Squalor",game.city.squalor)}${metric("Order",game.city.order)}${metric("Force",game.city.force)}${metric("Economy",game.city.economicStrength)}${metric("Renown",game.city.renown)}</section>
  <section class="panel" style="margin-top:12px"><h3>Test controls</h3><div class="v08-grid v08-controls"><div class="field"><label>Population</label><input type="number" min="0" data-city="population" value="${game.city.population}"></div><div class="field"><label>Squalor</label><input type="number" min="0" data-city="squalor" value="${game.city.squalor}"></div><div class="field"><label>Renown</label><input type="number" min="0" data-city="renown" value="${game.city.renown}"></div>${axisSelect("religionArcane",game.city.religionArcane)}${axisSelect("militaryMercantile",game.city.militaryMercantile)}</div><div class="prototype-rules"><b>Active demand priority:</b> ${priorityText()}. The Academic/Religion axis remains visible for future systems, but no longer creates an Institution demand category.</div></section>
  <section class="panel" style="margin-top:12px"><h3>Current market rewards</h3><div class="prototype-rules"><b>City / Population:</b> 1 Prestige per need served, 0 Wealth. <b>External:</b> 1 Wealth per need served, 0 direct Prestige. There is no Institution demand.</div><div class="prototype-rules" style="margin-top:8px"><b>Hinterland production:</b> every natural or converted territory currently has base capacity 2. Future land development may raise an individual territory to capacity 3.</div></section>
  <h2 class="section-title">Families</h2><section class="grid family-grid">${game.players.map(familyCard).join("")}</section>
  <section class="panel" style="margin-top:12px"><h3>First Player</h3><div class="prototype-rules"><b>${playerName(game.firstPlayerId)}</b> · order ${getTurnOrder(game).map(p=>p.familyName).join(" → ")} · next First Player: Influence → Prestige → Wealth → random.</div></section>
  <h2 class="section-title">Evolution by Generation</h2>${chartsHtml()}
  <h2 class="section-title">Production Sectors & Development</h2><section class="v08-grid development-grid">${game.productionSectors.map(sectorCard).join("")}</section>
  <h2 class="section-title">Hinterland — 13-space test map</h2><section class="v08-grid hinterland-grid"><article class="panel hinterland-tile city-tile"><div class="tile-type">City</div><h3>Morneval</h3><div class="tile-output">Central space</div><div class="tile-owner">12 surrounding spaces: 4 Forests, 4 Meadows, 4 Hills. Each territory has base production capacity 2.</div></article>${game.lands.map(landCard).join("")}</section>
  <h2 class="section-title">Current Economy</h2><section class="report-list">${reports.length?reports.map(reportCard).join(""):"<div class=\"panel empty\">Use Preview or resolve a Generation.</div>"}</section>
  <h2 class="section-title">Generation History</h2><section class="history-list">${game.history.length?[...game.history].reverse().map(historyCard).join(""):"<div class=\"panel empty\">No Generations resolved yet.</div>"}</section>
  <p class="footer-note">Population/Renown charts are city-wide. Wealth shows gross Wealth generated by each Family in each Generation. Prestige is cumulative. Raw-material production tracks available capacity, so Hinterland acquisitions and Farm conversions are visible even when all capacity is not consumed.</p></main>`;
  bindEvents();
}

function syncInputs(){
  document.querySelectorAll("[data-city]").forEach(el=>setCityValue(game,el.dataset.city,el.value));
  document.querySelectorAll("[data-axis]").forEach(el=>setCityValue(game,el.dataset.axis,el.value));
  applyAutoDemand(game);
}
function run(count){
  syncInputs(); let last=null,start=game.generation;
  for(let i=0;i<count;i+=1) last=resolveAutomatedGeneration(game);
  reports=last?.economyReports??[];
  message=count===1?`Generation ${start} resolved.`:`Generations ${start}–${game.generation-1} resolved.`;
  render();
}
function bindEvents(){
  document.querySelector("#run-one")?.addEventListener("click",()=>run(1));
  document.querySelector("#run-five")?.addEventListener("click",()=>run(5));
  document.querySelector("#preview")?.addEventListener("click",()=>{syncInputs();reports=previewEconomy(game).reports;message="Economy preview recalculated.";render();});
  document.querySelector("#reset")?.addEventListener("click",()=>{game=createCurrentGame();reports=[];message=`v${VERSION} simulation reset.`;render();});
  document.querySelectorAll("[data-city],[data-axis]").forEach(el=>el.addEventListener("change",()=>{syncInputs();reports=[];message="Test value changed; demand recalculated.";render();}));
}
render();
