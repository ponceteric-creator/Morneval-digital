const snapshots = [];
let baseline = null;

const INSTITUTIONS = {
  city_guard: "City Guard",
  temple: "Temple",
  merchant_guild: "Merchant Guild",
  scholarium: "Scholarium",
};
const SERIES = ["series-0", "series-1", "series-2", "series-3", "series-4", "series-5"];

const esc = value => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function metricValue(app, name) {
  const metric = [...app.querySelectorAll(".city-grid .metric")]
    .find(node => node.querySelector(".name")?.textContent?.trim() === name);
  return Number(metric?.querySelector(".number")?.textContent) || 0;
}

function readState() {
  const app = document.querySelector("#app");
  const empty = {
    families: [], agentsFamilies: [], agentsInstitutions: [], institutionPrestige: {},
    population: 0, urbanCapacity: 0, squalor: 0,
  };
  if (!app) return empty;

  const families = [...app.querySelectorAll(".family-card")].map(card => {
    const name = card.querySelector("h3")?.textContent?.replace(" · FIRST PLAYER", "").trim();
    const influenceStat = [...card.querySelectorAll(".family-stat")]
      .find(stat => stat.querySelector("span")?.textContent?.trim() === "Influence");
    return { name, influence: Number(influenceStat?.querySelector("b")?.textContent) || 0 };
  }).filter(item => item.name);

  const familyTotals = new Map(), familyNames = new Map(), institutionTotals = new Map();
  for (const input of app.querySelectorAll("[data-agent-player][data-agent-institution]")) {
    const pid = input.dataset.agentPlayer, iid = input.dataset.agentInstitution;
    const value = Math.max(0, Number(input.value) || 0);
    const label = input.closest(".field")?.querySelector("label")?.textContent ?? "";
    familyNames.set(pid, label.split(" Agents")[0]?.trim() || pid);
    familyTotals.set(pid, (familyTotals.get(pid) || 0) + value);
    institutionTotals.set(iid, (institutionTotals.get(iid) || 0) + value);
  }

  const institutionPrestige = {};
  const heading = [...app.querySelectorAll("h2.section-title")]
    .find(node => node.textContent?.trim() === "Institutions");
  for (const card of heading?.nextElementSibling?.querySelectorAll(".sector-card") ?? []) {
    const name = card.querySelector("h3")?.textContent?.trim();
    const id = Object.entries(INSTITUTIONS).find(([, label]) => name?.startsWith(label))?.[0];
    if (id) institutionPrestige[id] = Number.parseFloat(card.querySelector(".tier-badge")?.textContent ?? "0") || 0;
  }

  return {
    families,
    agentsFamilies: [...familyTotals].map(([id, value]) => ({ id, name: familyNames.get(id) || id, value })),
    agentsInstitutions: [...institutionTotals].map(([id, value]) => ({ id, name: INSTITUTIONS[id] || id, value })),
    institutionPrestige,
    population: metricValue(app, "Population"),
    urbanCapacity: metricValue(app, "Urban capacity"),
    squalor: metricValue(app, "Squalor"),
  };
}

function ensureBaseline() {
  if (!baseline) baseline = readState();
  return baseline;
}

function lineChart(labels, series, ariaLabel) {
  const W=720,H=235,L=44,R=14,T=16,B=34,pw=W-L-R,ph=H-T-B;
  const values=series.flatMap(item=>item.values).filter(Number.isFinite);
  const ymax=Math.max(1,Math.ceil(Math.max(1,...values)*1.15));
  const x=i=>L+(labels.length<=1?pw/2:(i/(labels.length-1))*pw);
  const y=v=>T+ph-((Number(v)||0)/ymax)*ph;
  let grid="";
  for(let i=0;i<=4;i+=1){const val=(ymax*i)/4,yy=y(val);grid+=`<line class="chart-grid-line" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/><text class="chart-axis-label" x="${L-7}" y="${yy+4}" text-anchor="end">${Number.isInteger(val)?val:val.toFixed(1)}</text>`;}
  const step=Math.max(1,Math.ceil(labels.length/10));
  const xLabels=labels.map((label,i)=>(i===labels.length-1||i%step===0)?`<text class="chart-axis-label" x="${x(i)}" y="${H-9}" text-anchor="middle">${i===0?"Start":`G${label}`}</text>`:"").join("");
  const lines=series.map((item,si)=>{
    const cls=SERIES[si%SERIES.length];
    const points=item.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");
    const dots=item.values.map((v,i)=>`<circle class="chart-point ${cls}" cx="${x(i)}" cy="${y(v)}" r="3.5"><title>${esc(item.name)} · ${i===0?"Start":`Generation ${labels[i]}`} · ${v}</title></circle>`).join("");
    return `<polyline class="chart-line ${cls}" points="${points}"/>${dots}`;
  }).join("");
  return `<svg class="evolution-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}">${grid}<line class="chart-axis" x1="${L}" y1="${T}" x2="${L}" y2="${H-B}"/><line class="chart-axis" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/>${xLabels}${lines}</svg>`;
}

function cityHistoryChart(labels, population, urbanCapacity, squalor, disease) {
  const W=720,H=250,L=44,R=44,T=18,B=34,pw=W-L-R,ph=H-T-B;
  const primary=[population,urbanCapacity,squalor];
  const values=primary.flatMap(item=>item.values).filter(Number.isFinite);
  const ymax=Math.max(1,Math.ceil(Math.max(1,...values)*1.15));
  const x=i=>L+(labels.length<=1?pw/2:(i/(labels.length-1))*pw);
  const y=v=>T+ph-((Number(v)||0)/ymax)*ph;
  const yd=v=>T+ph-(Number(v)?ph:0);
  let grid="";
  for(let i=0;i<=4;i+=1){const val=(ymax*i)/4,yy=y(val);grid+=`<line class="chart-grid-line" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/><text class="chart-axis-label" x="${L-7}" y="${yy+4}" text-anchor="end">${Number.isInteger(val)?val:val.toFixed(1)}</text>`;}
  const step=Math.max(1,Math.ceil(labels.length/10));
  const xLabels=labels.map((label,i)=>(i===labels.length-1||i%step===0)?`<text class="chart-axis-label" x="${x(i)}" y="${H-9}" text-anchor="middle">${i===0?"Start":`G${label}`}</text>`:"").join("");
  const primaryLines=primary.map((item,si)=>{
    const cls=SERIES[si];
    const points=item.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ");
    const dots=item.values.map((v,i)=>`<circle class="chart-point ${cls}" cx="${x(i)}" cy="${y(v)}" r="3.5"><title>${esc(item.name)} · ${i===0?"Start":`Generation ${labels[i]}`} · ${v}</title></circle>`).join("");
    return `<polyline class="chart-line ${cls}" points="${points}"/>${dots}`;
  }).join("");
  const diseaseCls=SERIES[3];
  const diseasePoints=disease.values.map((v,i)=>`${x(i)},${yd(v)}`).join(" ");
  const diseaseDots=disease.values.map((v,i)=>`<circle class="chart-point ${diseaseCls}" cx="${x(i)}" cy="${yd(v)}" r="4"><title>Disease · ${i===0?"Start":`Generation ${labels[i]}`} · ${v}</title></circle>`).join("");
  return `<svg class="evolution-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Population Squalor Urban capacity and Disease by generation">${grid}<line class="chart-axis" x1="${L}" y1="${T}" x2="${L}" y2="${H-B}"/><line class="chart-axis" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/><line class="chart-axis" x1="${W-R}" y1="${T}" x2="${W-R}" y2="${H-B}"/><text class="chart-axis-label" x="${W-R+7}" y="${T+4}" text-anchor="start">1</text><text class="chart-axis-label" x="${W-R+7}" y="${H-B+4}" text-anchor="start">0</text><text class="chart-axis-label" x="${W-R+8}" y="${T+16}" text-anchor="start">Disease</text>${xLabels}${primaryLines}<polyline class="chart-line ${diseaseCls}" points="${diseasePoints}"/>${diseaseDots}</svg>`;
}

function legend(series) {
  return `<div class="chart-legend">${series.map((item,i)=>`<span><i class="legend-swatch ${SERIES[i%SERIES.length]}"></i>${esc(item.name)}: <b>${item.values.at(-1)??0}</b></span>`).join("")}</div>`;
}

function histories(base) {
  if (!snapshots.length) {
    return {
      labels:[0],
      influence:base.families.map(item=>({name:item.name,values:[item.influence]})),
      institutions:Object.entries(INSTITUTIONS).map(([id,name])=>({name,values:[Number(base.institutionPrestige[id])||0]})),
      population:{name:"Population",values:[Number(base.population)||0]},
      urbanCapacity:{name:"Urban capacity",values:[Number(base.urbanCapacity)||0]},
      squalor:{name:"Squalor",values:[Number(base.squalor)||0]},
      disease:{name:"Disease",values:[0]},
    };
  }
  const first=snapshots[0], ids=Object.keys(first.familyNames??first.influenceBefore??{});
  const labels=[0,...snapshots.map(item=>item.generation)];
  return {
    labels,
    influence:ids.map(id=>({name:first.familyNames?.[id]||id,values:[Number(first.influenceBefore?.[id])||0,...snapshots.map(item=>Number(item.influenceAfter?.[id])||0)]})),
    institutions:Object.entries(INSTITUTIONS).map(([id,name])=>({name,values:[Number(base.institutionPrestige[id])||0,...snapshots.map(item=>Number(item.institutionPrestigeAfter?.[id])||0)]})),
    population:{name:"Population",values:[Number(first.populationBefore ?? base.population)||0,...snapshots.map(item=>Number(item.populationAfter)||0)]},
    urbanCapacity:{name:"Urban capacity",values:[Number(base.urbanCapacity)||0,...snapshots.map(item=>Number(item.urbanCapacityAfter)||0)]},
    squalor:{name:"Squalor",values:[Number(base.squalor)||0,...snapshots.map(item=>Number(item.squalorAfter)||0)]},
    disease:{name:"Disease",values:[0,...snapshots.map(item=>item.diseaseOccurred?1:0)]},
  };
}

function agentHistories(base, labels) {
  const first=snapshots[0];
  const baseFamilies=new Map(base.agentsFamilies.map(item=>[item.id,item]));
  const familyIds=first ? Object.keys(first.familyNames??first.agentTotalsAfter??{}) : base.agentsFamilies.map(item=>item.id);
  const families=familyIds.map(id=>({
    name:first?.familyNames?.[id]||baseFamilies.get(id)?.name||id,
    values:[Number(baseFamilies.get(id)?.value)||0,...snapshots.map(item=>Number(item.agentTotalsAfter?.[id])||0)],
  }));
  const baseInstitutions=new Map(base.agentsInstitutions.map(item=>[item.id,item.value]));
  const institutions=Object.entries(INSTITUTIONS).map(([id,name])=>({
    name,
    values:[Number(baseInstitutions.get(id))||0,...snapshots.map(item=>Number(item.agentsByInstitutionAfter?.[id])||0)],
  }));
  return {labels,families,institutions};
}

function styles() {
  if(document.querySelector("style[data-safe-telemetry-v4]")) return;
  const style=document.createElement("style"); style.dataset.safeTelemetryV4="true";
  style.textContent=`#telemetry{max-width:1480px;margin:0 auto;padding:14px 18px 0}.telemetry-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin:0 0 10px}.telemetry-head h2{margin:0;font-family:Georgia,serif;font-size:23px}.telemetry-head span{color:var(--muted);font-size:12px}.telemetry-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:stretch}.telemetry-grid .panel{min-width:0}.telemetry-wide{grid-column:1/-1}.history-head .telemetry-disease-badge{display:inline-flex;padding:3px 7px;border-radius:999px;background:#f2dfd5;color:var(--warn);font-size:11px;font-weight:800}@media(max-width:980px){.telemetry-grid{grid-template-columns:1fr 1fr}}@media(max-width:680px){.telemetry-grid{grid-template-columns:1fr}.telemetry-wide{grid-column:auto}.telemetry-head{align-items:flex-start;flex-direction:column}}`;
  document.head.append(style);
}

function cleanDiseaseHistory() {
  const app=document.querySelector("#app"); if(!app) return;
  for(const card of app.querySelectorAll(".history-card")){
    const disease=card.querySelector(".history-head > span");
    if(disease){const text=disease.textContent?.trim();if(text==="No disease") disease.hidden=true;else if(text==="Disease"){disease.hidden=false;disease.classList.add("telemetry-disease-badge");}}
    for(const span of card.querySelectorAll(".history-grid span")) if(span.textContent?.startsWith("Order · Disease resolved first ·")) span.textContent=span.textContent.replace("Order · Disease resolved first ·","Order ·");
  }
}

function render() {
  const root=document.querySelector("#telemetry"); if(!root) return;
  styles();
  const base=ensureBaseline(), h=histories(base), a=agentHistories(base,h.labels);
  const citySeries=[h.population,h.urbanCapacity,h.squalor,h.disease];
  root.innerHTML=`<section><div class="telemetry-head"><h2>Playtest telemetry</h2><span>generation history</span></div><div class="telemetry-grid"><article class="panel"><div class="chart-head"><h3>Family Influence</h3><span>historical evolution</span></div>${lineChart(h.labels,h.influence,"Family Influence by generation")}${legend(h.influence)}</article><article class="panel"><div class="chart-head"><h3>Agents by Family</h3><span>historical evolution</span></div>${lineChart(a.labels,a.families,"Agents by Family by generation")}${legend(a.families)}</article><article class="panel"><div class="chart-head"><h3>Agents by Institution</h3><span>historical evolution</span></div>${lineChart(a.labels,a.institutions,"Agents by Institution by generation")}${legend(a.institutions)}</article><article class="panel"><div class="chart-head"><h3>Institution Prestige</h3><span>historical evolution</span></div>${lineChart(h.labels,h.institutions,"Institution Prestige by generation")}${legend(h.institutions)}</article><article class="panel telemetry-wide"><div class="chart-head"><h3>Population, Squalor & Disease</h3><span>Disease uses the binary 0–1 axis at right</span></div>${cityHistoryChart(h.labels,h.population,h.urbanCapacity,h.squalor,h.disease)}${legend(citySeries)}</article></div></section>`;
  cleanDiseaseHistory();
}

window.addEventListener("morneval:generation-resolved",event=>{
  ensureBaseline();
  snapshots.push({...(event.detail??{})});
  render();
});

document.addEventListener("click",event=>{
  const target=event.target;
  if(target instanceof HTMLElement && target.id==="reset"){
    snapshots.length=0;
    baseline=null;
    setTimeout(render,0);
  }
  setTimeout(cleanDiseaseHistory,0);
});

document.addEventListener("change",()=>{
  if(!snapshots.length) baseline=null;
  setTimeout(render,0);
});

setTimeout(render,0);
