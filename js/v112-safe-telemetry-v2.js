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

function readState() {
  const app = document.querySelector("#app");
  const empty = { families: [], agentsFamilies: [], agentsInstitutions: [], institutionPrestige: {}, squalor: 0 };
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
  const heading = [...app.querySelectorAll("h2.section-title")].find(node => node.textContent?.trim() === "Institutions");
  for (const card of heading?.nextElementSibling?.querySelectorAll(".sector-card") ?? []) {
    const name = card.querySelector("h3")?.textContent?.trim();
    const id = Object.entries(INSTITUTIONS).find(([, label]) => name?.startsWith(label))?.[0];
    if (id) institutionPrestige[id] = Number.parseFloat(card.querySelector(".tier-badge")?.textContent ?? "0") || 0;
  }

  const squalorMetric = [...app.querySelectorAll(".city-grid .metric")]
    .find(metric => metric.querySelector(".name")?.textContent?.trim() === "Squalor");

  return {
    families,
    agentsFamilies: [...familyTotals].map(([id, value]) => ({ id, name: familyNames.get(id) || id, value })),
    agentsInstitutions: [...institutionTotals].map(([id, value]) => ({ id, name: INSTITUTIONS[id] || id, value })),
    institutionPrestige,
    squalor: Number(squalorMetric?.querySelector(".number")?.textContent) || 0,
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

function legend(series) {
  return `<div class="chart-legend">${series.map((item,i)=>`<span><i class="legend-swatch ${SERIES[i%SERIES.length]}"></i>${esc(item.name)}: <b>${item.values.at(-1)??0}</b></span>`).join("")}</div>`;
}

function barChart(items, ariaLabel) {
  const W=390,L=126,R=34,T=12,row=42,H=Math.max(132,T*2+row*Math.max(1,items.length)),bw=W-L-R;
  const max=Math.max(1,...items.map(item=>Number(item.value)||0));
  const rows=items.map((item,i)=>{const y=T+i*row,v=Number(item.value)||0,w=(v/max)*bw,cls=SERIES[i%SERIES.length];return `<text class="telemetry-bar-label" x="${L-8}" y="${y+20}" text-anchor="end">${esc(item.name)}</text><rect class="telemetry-bar-track" x="${L}" y="${y+6}" width="${bw}" height="22" rx="6"/><rect class="telemetry-bar ${cls}" x="${L}" y="${y+6}" width="${w}" height="22" rx="6"/><text class="telemetry-bar-value" x="${L+w+6}" y="${y+21}">${v}</text>`;}).join("");
  return `<svg class="evolution-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}">${rows}</svg>`;
}

function histories(base) {
  if (!snapshots.length) {
    return {
      labels:[0],
      influence:base.families.map(item=>({name:item.name,values:[item.influence]})),
      institutions:Object.entries(INSTITUTIONS).map(([id,name])=>({name,values:[Number(base.institutionPrestige[id])||0]})),
      squalor:[{name:"Squalor",values:[Number(base.squalor)||0]}],
    };
  }
  const first=snapshots[0], ids=Object.keys(first.familyNames??first.influenceBefore??{});
  const labels=[0,...snapshots.map(item=>item.generation)];
  return {
    labels,
    influence:ids.map(id=>({name:first.familyNames?.[id]||id,values:[Number(first.influenceBefore?.[id])||0,...snapshots.map(item=>Number(item.influenceAfter?.[id])||0)]})),
    institutions:Object.entries(INSTITUTIONS).map(([id,name])=>({name,values:[Number(base.institutionPrestige[id])||0,...snapshots.map(item=>Number(item.institutionPrestigeAfter?.[id])||0)]})),
    squalor:[{name:"Squalor",values:[Number(base.squalor)||0,...snapshots.map(item=>Number(item.squalorAfter)||0)]}],
  };
}

function agents(base) {
  const last=snapshots.at(-1);
  if(!last) return {families:base.agentsFamilies,institutions:base.agentsInstitutions};
  return {
    families:Object.entries(last.agentTotalsAfter??{}).map(([id,value])=>({id,name:last.familyNames?.[id]||id,value:Number(value)||0})),
    institutions:Object.keys(INSTITUTIONS).map(id=>({id,name:INSTITUTIONS[id],value:Number(last.agentsByInstitutionAfter?.[id])||0})),
  };
}

function diseaseStrip() {
  return snapshots.length
    ? `<div class="telemetry-disease"><b>Disease 1/0:</b>${snapshots.map(item=>`<span class="telemetry-disease-cell"><small>G${item.generation}</small><strong>${item.diseaseOccurred?1:0}</strong></span>`).join("")}</div>`
    : `<div class="telemetry-disease"><b>Disease 1/0:</b><span>no resolved Generation yet</span></div>`;
}

function styles() {
  if(document.querySelector("style[data-safe-telemetry-v2]")) return;
  const style=document.createElement("style"); style.dataset.safeTelemetryV2="true";
  style.textContent=`#telemetry{max-width:1480px;margin:0 auto;padding:14px 18px 0}.telemetry-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin:0 0 10px}.telemetry-head h2{margin:0;font-family:Georgia,serif;font-size:23px}.telemetry-head span{color:var(--muted);font-size:12px}.telemetry-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;align-items:stretch}.telemetry-grid .panel{min-width:0}.telemetry-wide{grid-column:1/-1}.telemetry-bar-label,.telemetry-bar-value{fill:var(--ink);font-size:11px;font-weight:700}.telemetry-bar-track{fill:var(--paper-2)}.telemetry-bar.series-0{fill:#315e43}.telemetry-bar.series-1{fill:#815e2f}.telemetry-bar.series-2{fill:#8b4c2e}.telemetry-bar.series-3{fill:#4d5f7a}.telemetry-disease{border-top:1px solid var(--line);margin-top:6px;padding-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:11px}.telemetry-disease-cell{display:inline-grid;justify-items:center;gap:1px;min-width:24px}.telemetry-disease-cell small{font-size:9px}.telemetry-disease-cell strong{color:var(--ink);font-size:12px}.history-head .telemetry-disease-badge{display:inline-flex;padding:3px 7px;border-radius:999px;background:#f2dfd5;color:var(--warn);font-size:11px;font-weight:800}@media(max-width:980px){.telemetry-grid{grid-template-columns:1fr 1fr}.telemetry-grid .panel:first-child{grid-column:1/-1}}@media(max-width:680px){.telemetry-grid{grid-template-columns:1fr}.telemetry-grid .panel:first-child,.telemetry-wide{grid-column:auto}.telemetry-head{align-items:flex-start;flex-direction:column}}`;
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
  const base=ensureBaseline(), h=histories(base), a=agents(base);
  root.innerHTML=`<section><div class="telemetry-head"><h2>Playtest telemetry</h2><span>isolated dashboard · generation history</span></div><div class="telemetry-grid"><article class="panel"><div class="chart-head"><h3>Family Influence</h3><span>evolution by Generation</span></div>${lineChart(h.labels,h.influence,"Family Influence by generation")}${legend(h.influence)}</article><article class="panel"><div class="chart-head"><h3>Agents by Family</h3><span>current deployed Agents</span></div>${barChart(a.families,"Current Agents by Family")}</article><article class="panel"><div class="chart-head"><h3>Agents by Institution</h3><span>current deployed Agents</span></div>${barChart(a.institutions,"Current Agents by Institution")}</article><article class="panel telemetry-wide"><div class="chart-head"><h3>Institution Prestige</h3><span>historical value by Generation</span></div>${lineChart(h.labels,h.institutions,"Institution Prestige by generation")}${legend(h.institutions)}</article><article class="panel telemetry-wide"><div class="chart-head"><h3>Squalor & Disease</h3><span>Disease shown as 1/0 below the same Generation axis</span></div>${lineChart(h.labels,h.squalor,"Squalor by generation")}${diseaseStrip()}</article></div></section>`;
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
