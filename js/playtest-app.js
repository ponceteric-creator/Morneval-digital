
import {
  createHumanPlaytest, beginInteractiveGeneration, advanceUntilHuman, listHumanActions,
  playHumanAction, undoLastHumanAction, queueInstitutionDevelopment, queuePoliticalBid,
  queueIntrigueCard, intrigueTargets, finishInteractiveGeneration, intrigueHand, economyPreview,
  externalRelations, engine, V110_PLAYTEST_API, PLAYTEST_VERSION, ENGINE_VERSION
} from "./v138-human-playtest-engine.js?v=0.1.0";

const root = document.querySelector("#playtest-app");
if (!root) throw new Error("Missing #playtest-app");

let game = null;
let session = null;
let replacePersonality = "investor";
let tab = "board";
let selectedCard = null;
let selectedIntrigueChoice = null;
let debug = false;
let stepAi = false;
let flash = "";

const h = value => String(value ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const num = value => Number(value) || 0;
const pretty = value => String(value ?? "").replaceAll("_"," ").replace(/\b\w/g, c => c.toUpperCase());
const total = object => Object.values(object ?? {}).reduce((sum,value) => sum + num(value), 0);

function human(state) {
  return (state.players ?? []).find(player => player.id === state.playtest?.humanPlayerId) ?? state.players?.[0];
}
function family(state, id) {
  return (state.players ?? []).find(player => player.id === id)?.familyName ?? id ?? "—";
}
function activeState() {
  return session?.planningState ?? game;
}
function humanActions() {
  return session?.status === "human_turn" ? listHumanActions(session) : [];
}
function personalityLabel(value) {
  return ({human:"You",investor:"Investor",merchant:"Merchant",contrarian:"Contrarian",opportunist:"Contrarian",dynast:"Investor"})[value] ?? pretty(value);
}
function notify(message) {
  flash = message;
  render();
  setTimeout(() => { if (flash === message) { flash = ""; render(); } }, 1800);
}
function encodeSpec(spec) {
  return encodeURIComponent(JSON.stringify(spec));
}
function decodeSpec(raw) {
  return JSON.parse(decodeURIComponent(raw));
}

function startGame() {
  const seat = ({investor:0,merchant:1,contrarian:2})[replacePersonality] ?? 0;
  game = createHumanPlaytest({humanSeat:seat,replacePersonality,externalRelations:true});
  game.playtest.debug = debug;
  game.playtest.stepAi = stepAi;
  session = beginInteractiveGeneration(game);
  selectedCard = null;
  selectedIntrigueChoice = null;
  tab = "board";
  render();
}
function resetGame() {
  game = null;
  session = null;
  selectedCard = null;
  selectedIntrigueChoice = null;
  render();
}

function setupHtml() {
  const option = (id, text) =>
    '<button data-replace="'+id+'" class="'+(replacePersonality===id?'active':'')+'"><b>'+pretty(id)+'</b><br><span class="small">'+text+'</span></button>';
  return '<div class="setup"><section class="setup-card">'+
    '<h1>MORNEVAL</h1><p>Human playtest · mobile-first. Choose which AI personality you replace.</p>'+
    '<div class="choice">'+
      option("investor","Production / Stakes / Hinterland")+
      option("merchant","Wealth / trade / economic engine")+
      option("contrarian","Counterplay / under-contested opportunities")+
    '</div>'+
    '<div class="switch"><span>Step AI mode</span><button id="toggle-step">'+(stepAi?'On':'Off')+'</button></div>'+
    '<div class="switch"><span>Debug</span><button id="setup-debug">'+(debug?'On':'Off')+'</button></div>'+
    '<button class="primary" id="new-game" style="width:100%">Start playtest</button>'+
    '<p class="small">Optimised for iPhone portrait. No hover interaction is required.</p>'+
  '</section></div>';
}

function topBar(state) {
  const me = human(state);
  const city = state.city ?? {};
  return '<header class="sticky-top">'+
    '<div class="top-row"><div class="brand">MORNEVAL</div><div class="gen">G'+state.generation+' · '+h(session?.status ?? state.phase ?? "")+'</div></div>'+
    '<div class="kpis">'+
      '<div class="kpi"><b>'+num(me?.prestige)+'</b><span>Prestige</span></div>'+
      '<div class="kpi"><b>'+num(me?.influence)+'</b><span>Influence</span></div>'+
      '<div class="kpi"><b>'+num(me?.wealthCapacity)+'</b><span>Wealth</span></div>'+
      '<div class="kpi"><b>'+num(city.population)+'</b><span>Population</span></div>'+
      '<div class="kpi"><b>'+num(city.squalor)+'</b><span>Squalor</span></div>'+
    '</div>'+
    '<div class="nav">'+["board","analysis","log","debug"].map(id =>
      '<button data-tab="'+id+'" class="'+(tab===id?'active':'')+'">'+pretty(id)+'</button>'
    ).join("")+'</div>'+
  '</header>';
}

function cityHtml(state) {
  const city = state.city ?? {};
  const rel = externalRelations(state);
  const coreActions = humanActions();
  const relation = ([id,value]) =>
    '<span class="chip '+(value>0?'good':value<0?'bad':'')+'">'+pretty(id)+' '+(value>0?'+':'')+value+'</span>';
  let political = "";
  if (session?.status === "pre_actions") {
    political = '<div class="actions">'+
      '<button data-politics="military">+1 Military</button>'+
      '<button data-politics="merchant">+1 Mercantile</button>'+
      '<button data-politics="temple">+1 Religion</button>'+
      '<button data-politics="scholarium">+1 Arcane</button>'+
    '</div>';
  }
  const strategic = coreActions.filter(action => action.kind === "fortification" || action.kind === "study_elf_ways");
  const strategicButtons = strategic.length ? '<div class="actions">'+strategic.map(action => {
    if (action.kind === "fortification") {
      return '<button data-spec="'+encodeSpec(action.spec)+'">Fortify L'+num(action.spec.nextLevel)+' · '+num(action.spec.nextLevel===1?2:action.spec.nextLevel===2?3:4)+'I</button>';
    }
    return '<button data-spec="'+encodeSpec(action.spec)+'">Study Elf Ways · '+num(action.spec.amount)+'I</button>';
  }).join("")+'</div>' : "";
  return '<div class="section-title">City</div><section class="card">'+
    '<div class="metrics">'+
      '<div class="metric"><b>'+num(city.order)+'</b><span>Order</span></div>'+
      '<div class="metric"><b>'+num(city.force)+'</b><span>Force</span></div>'+
      '<div class="metric"><b>'+num(city.renown)+'</b><span>Renown</span></div>'+
      '<div class="metric"><b>'+num(city.imperialIntervention)+'</b><span>Imperial</span></div>'+
    '</div>'+
    '<div class="chips" style="margin-top:8px">'+
      '<span class="chip accent">Mil/Merc '+num(city.militaryMercantile)+'</span>'+
      '<span class="chip accent">Arc/Rel '+num(city.religionArcane)+'</span>'+
      '<span class="chip">Fortification L'+num(city.fortificationLevel)+'</span>'+
    '</div>'+
    '<div class="chips" style="margin-top:7px">'+Object.entries(rel).map(relation).join("")+'</div>'+
    political+strategicButtons+
  '</section>';
}

function familiesHtml(state) {
  return '<div class="section-title">Families</div><section class="grid">'+
    (state.players ?? []).map(player => {
      const mine = player.id === state.playtest?.humanPlayerId;
      return '<article class="card '+(mine?'family-me':'')+'">'+
        '<div class="row"><h3>'+h(player.familyName)+(mine?' · YOU':'')+'</h3><span class="chip">'+personalityLabel(player.aiPersonality)+'</span></div>'+
        '<div class="chips">'+
          '<span class="chip">P '+num(player.prestige)+'</span>'+
          '<span class="chip">I '+num(player.influence)+'</span>'+
          '<span class="chip">W '+num(player.wealthCapacity)+'</span>'+
          '<span class="chip">Agents '+(player.institutionAgentRoster ?? []).length+'</span>'+
          '<span class="chip">Stakes '+(player.productionStakes ?? []).length+'</span>'+
        '</div>'+
      '</article>';
    }).join("")+
  '</section>';
}

function auctionHtml(state, candidate) {
  if (!candidate || !session) return "";
  const auction = session.context.auctions.get(candidate.auctionId);
  const high = auction ? V110_PLAYTEST_API.highestBid(auction) : null;
  const minimum = num(candidate.minimumBid ?? candidate.bid);
  const maximum = Math.max(minimum, num(candidate.maximumBid ?? minimum));
  const middle = Math.min(maximum, minimum + 1);
  return '<div class="bid"><div><strong>Bid:</strong> leader '+h(high?family(state,high.playerId):"None")+
    ' '+num(high?.amount)+'I · next '+minimum+'I</div>'+
    '<div class="actions">'+
      '<button data-auction="'+h(candidate.auctionId)+'" data-bid="'+minimum+'">+1</button>'+
      '<button data-auction="'+h(candidate.auctionId)+'" data-bid="'+middle+'">+2</button>'+
      '<button data-auction="'+h(candidate.auctionId)+'" data-bid="'+maximum+'">Max '+maximum+'</button>'+
    '</div></div>';
}

function productionHtml(state) {
  const actions = humanActions();
  let preview = {reports:[]};
  try { preview = economyPreview(state); } catch {}
  const reports = preview.reports ?? [];
  const cards = (state.productionSectors ?? []).filter(sector => sector.id !== "food").map(sector => {
    const stakes = (state.players ?? []).flatMap(p => (p.productionStakes ?? []).map(stake => ({...stake,family:p.familyName})))
      .filter(stake => stake.sectorId === sector.id);
    const raw = typeof engine.sectorResourceCapacity === "function" ? engine.sectorResourceCapacity(state,sector.id) : 0;
    const demand = total(sector.demandThisGeneration);
    const report = reports.find(row => row.sectorId === sector.id);
    const develop = actions.find(row => row.kind === "development" && row.sectorId === sector.id);
    const auction = actions.find(row => row.kind === "auction_bid" && row.sectorId === sector.id);
    return '<article class="card">'+
      '<div class="row"><h3>'+h(sector.name)+'</h3><span class="chip accent">T'+sector.tier+'</span></div>'+
      '<div class="chips"><span class="chip">Prod '+num(report?.actualProduction)+'/'+demand+'</span><span class="chip">Raw '+raw+'</span><span class="chip">Stakes '+stakes.length+'/'+(sector.tier*3)+'</span></div>'+
      '<div class="stake-line">'+(stakes.length?stakes.map(s => h(s.family)+' '+String(s.age).charAt(0).toUpperCase()+'#'+s.placementOrder).join(" · "):"No Stakes")+'</div>'+
      auctionHtml(state,auction)+
      (develop?'<div class="actions"><button data-spec="'+encodeSpec(develop.spec)+'">Develop sector</button></div>':'')+
    '</article>';
  });
  const resources = {grain:0,wool:0,ore:0,wood:0};
  for (const land of state.lands ?? []) {
    if (!land.revealed || land.development === "urban") continue;
    resources[land.resourceType] = (resources[land.resourceType] ?? 0) + num(land.baseCapacity);
  }
  return '<div class="section-title">Production & raw resources</div><section class="grid">'+cards.join("")+'</section>'+
    '<section class="card" style="margin-top:8px"><h3>Raw capacity</h3><div class="chips">'+
    Object.entries(resources).map(([key,value]) => '<span class="chip">'+pretty(key)+' '+value+'</span>').join("")+
    '</div></section>';
}

function merchantScore(state) {
  const institution = (state.institutions ?? []).find(row => row.id === "merchant_guild");
  const tier = Math.max(1,Math.min(3,Math.floor(num(institution?.tier) || 1)));
  const cap = ({1:2,2:4,3:8})[tier];
  const totalWealth = (state.players ?? []).reduce((sum,p) => sum + Math.max(2,num(p.wealthCapacity)),0);
  return Math.min(cap,Math.max(0,totalWealth - 2*(state.players ?? []).length));
}
function institutionScoreMap(state) {
  let scores = {};
  try { scores = V110_PLAYTEST_API.institutionScores(state) ?? {}; } catch {}
  const out = {};
  for (const id of ["city_guard","temple","merchant_guild","scholarium"]) {
    const value = scores[id];
    out[id] = num(value?.score ?? value?.value ?? value);
  }
  out.merchant_guild = merchantScore(state);
  return out;
}
function institutionsHtml(state) {
  const actions = humanActions();
  const scores = institutionScoreMap(state);
  const ids = ["city_guard","temple","merchant_guild","scholarium"];
  return '<div class="section-title">Institutions</div><section class="grid two">'+ids.map(id => {
    const institution = (state.institutions ?? []).find(row => row.id === id) ?? {id,name:pretty(id),tier:1,developmentPhase:0};
    const cap = typeof engine.getInstitutionInfluenceCap === "function"
      ? engine.getInstitutionInfluenceCap(state,id) : ({1:2,2:4,3:8})[institution.tier] ?? 2;
    const agent = actions.find(row => row.kind === "agent" && row.institutionId === id);
    const agents = (state.players ?? []).map(p => ({
      name:p.familyName,count:(p.institutionAgentRoster ?? []).filter(a => a.institutionId === id).length
    })).filter(row => row.count);
    const cost = typeof engine.getInstitutionDevelopmentCost === "function" ? engine.getInstitutionDevelopmentCost(institution) : null;
    const queued = (game.__playtestInstitutionDevelopmentQueue ?? []).some(row =>
      row.playerId === game.playtest.humanPlayerId && row.institutionId === id);
    return '<article class="card">'+
      '<div class="row"><h3>'+h(institution.name ?? pretty(id))+'</h3><span class="chip accent">T'+institution.tier+' · P'+num(institution.developmentPhase)+'</span></div>'+
      '<div class="chips"><span class="chip good">Score '+num(scores[id])+'P</span><span class="chip">Influence cap '+cap+'</span></div>'+
      '<div class="stake-line">'+(agents.length?agents.map(row => h(row.name)+' ×'+row.count).join(" · "):"No Agents")+'</div>'+
      '<div class="actions">'+
        (agent?'<button data-spec="'+encodeSpec(agent.spec)+'">Place Agent</button>':'')+
        (session?.status==="pre_actions" && cost && !queued?'<button data-inst="'+id+'">Develop '+cost.influenceCost+'I → +'+cost.prestige+'P</button>':'')+
        (queued?'<button disabled>Development queued</button>':'')+
      '</div>'+
    '</article>';
  }).join("")+'</section>';
}

function hinterlandHtml(state) {
  const byLand = new Map();
  for (const action of humanActions()) {
    if (!action.landId) continue;
    if (!byLand.has(action.landId)) byLand.set(action.landId,[]);
    byLand.get(action.landId).push(action);
  }
  const lands = (state.lands ?? []).filter(land => land.revealed || byLand.has(land.id));
  const actionLabel = action => {
    if (action.kind === "farm") return "Convert to Farm";
    if (action.kind === "expansion_vote") return "Propose expansion";
    if (action.kind === "explore") return "Explore";
    if (action.kind === "reforestation") return "Reforest · 2I → +1P";
    if (action.kind === "gnome_land_improvement") return "Gnome Improve · 2I → +1P";
    return pretty(action.kind);
  };
  return '<div class="section-title">Hinterland</div><section class="grid two">'+lands.map(land => {
    const landActions = byLand.get(land.id) ?? [];
    const kind = !land.revealed ? "Unexplored" : land.development === "farm" ? "Farm" : pretty(land.terrain ?? land.originalTerrain);
    const buttons = landActions.length ? '<div class="actions">'+landActions.map(action =>
      '<button data-spec="'+encodeSpec(action.spec)+'">'+actionLabel(action)+'</button>'
    ).join("")+'</div>' : "";
    const improvement = land.gnomeImprovementPermanent ? " · Gnome +1" : "";
    return '<article class="card"><div class="row"><h4>'+h(land.name ?? land.id)+'</h4><span class="chip">'+kind+'</span></div>'+
      '<div class="small">'+(land.revealed?(pretty(land.resourceType)+' +'+num(land.baseCapacity)+' · owner '+h(family(state,land.ownerId))+improvement):"Terrain hidden")+'</div>'+
      buttons+'</article>';
  }).join("")+'</section>';
}

function intrigueHtml(state) {
  const hand = intrigueHand(state,state.playtest.humanPlayerId);
  let targetHtml = "";
  if (selectedCard && session?.status === "pre_actions") {
    const targetInfo = intrigueTargets(session,selectedCard);
    if (targetInfo.requiresTarget) {
      targetHtml = '<section class="card" style="margin-top:8px"><h3>Choose target</h3>'+
        (targetInfo.options.length
          ? '<div class="actions">'+targetInfo.options.map(option =>
              '<button data-intrigue-choice="'+encodeSpec(option.choice)+'" class="'+
              (JSON.stringify(selectedIntrigueChoice)===JSON.stringify(option.choice)?'primary':'')+'">'+h(option.label)+'</button>'
            ).join("")+'</div>'
          : '<div class="small">No legal target for this card.</div>')+
        '</section>';
    }
  }
  return '<div class="section-title">Intrigue</div>'+
    (hand.length?'<section class="card-strip">'+hand.map(card => {
      const meta = card.meta ?? {};
      return '<article class="card intrigue '+(selectedCard===card.instanceId?'selected':'')+'" data-card="'+h(card.instanceId)+'">'+
        '<div class="power">'+h(meta.power ?? meta.timing ?? "Intrigue")+'</div><h3>'+h(meta.name ?? card.cardId)+'</h3>'+
        '<div class="small">'+h(meta.shortText ?? meta.effectText ?? meta.description ?? meta.timing ?? "")+'</div>'+
        '<div class="chips" style="margin-top:8px"><span class="chip">'+h(meta.institutionId ?? "")+'</span><span class="chip">Cost '+num(meta.influenceCost ?? meta.cost)+'I</span></div>'+
      '</article>';
    }).join("")+'</section>'+targetHtml:'<section class="card"><span class="small">No Intrigue cards in hand.</span></section>');
}

function boardHtml(state) {
  return '<main><div class="notice">Human playtest v'+PLAYTEST_VERSION+' · engine '+ENGINE_VERSION+'. Tap the board area you want to use; legal actions appear directly on that card.</div>'+
    cityHtml(state)+familiesHtml(state)+productionHtml(state)+institutionsHtml(state)+hinterlandHtml(state)+intrigueHtml(state)+
  '</main>';
}
function analysisHtml(state) {
  const rows = game.playtest.analytics ?? [];
  const latest = rows.at(-1);
  const inst = latest?.institutionPrestige ?? {};
  return '<main><div class="section-title">Playtest analysis</div>'+
    '<section class="card"><div class="metrics">'+
      '<div class="metric"><b>'+num(human(state)?.prestige)+'</b><span>Prestige</span></div>'+
      '<div class="metric"><b>'+num(human(state)?.influence)+'</b><span>Influence</span></div>'+
      '<div class="metric"><b>'+num(human(state)?.wealthCapacity)+'</b><span>Wealth</span></div>'+
      '<div class="metric"><b>'+rows.length+'</b><span>Generations</span></div>'+
    '</div></section>'+
    '<div class="section-title">Generation ledger</div><section class="card"><table class="analytics-table"><thead><tr><th>Gen</th><th>ΔP</th><th>Agent I</th><th>W</th><th>Pop</th><th>Sq</th></tr></thead><tbody>'+
      (rows.length?rows.slice().reverse().map(row => '<tr><td>G'+row.generation+'</td><td>'+row.prestigeDelta+'</td><td>'+row.agentInfluence+'</td><td>'+row.wealthGross+'</td><td>'+row.population+'</td><td>'+row.squalor+'</td></tr>').join("")
      :'<tr><td colspan="6">Resolve a Generation to populate analytics.</td></tr>')+
    '</tbody></table></section>'+
    (latest?'<div class="section-title">Latest Institution Prestige</div><section class="card"><div class="chips">'+
      ["city_guard","temple","merchant_guild","scholarium"].map(id => '<span class="chip">'+pretty(id)+' '+num(inst[id])+'P</span>').join("")+
    '</div></section>':"")+
  '</main>';
}
function logHtml() {
  const rows = [...(game.playtest.actionLog ?? []),...(session?.coreLog ?? [])];
  const summary = game.playtest.lastSummary;
  return '<main><div class="section-title">Action log</div><section class="log">'+
    (rows.length?rows.slice().reverse().map(row => '<div class="log-row '+(row.source==="human"?"human":"ai")+'">G'+(row.generation ?? game.generation)+' · '+h(row.label ?? row.type ?? row.actionKind)+'</div>').join("")
      :'<div class="log-row">No actions yet.</div>')+
    '</section>'+
    (summary?'<div class="section-title">Last generation</div><section class="card"><div class="small">Population '+summary.populationBefore+' → '+summary.populationAfter+' · Squalor '+summary.squalorBefore+' → '+summary.squalorAfter+' · Order '+summary.orderBefore+' → '+summary.orderAfter+'</div></section>':"")+
  '</main>';
}
function debugHtml(state) {
  if (!debug) return '<main><div class="section-title">Debug</div><section class="card"><p>Debug is disabled.</p><button id="toggle-debug">Enable Debug</button></section></main>';
  const serial = session ? {...session,rootState:undefined,planningState:undefined,context:undefined,active:[...session.active]} : null;
  return '<main><div class="section-title">Debug</div><section class="card"><div class="actions"><button id="toggle-debug">Disable Debug</button><button id="restart-game">Restart</button></div><pre>'+
    h(JSON.stringify({game,session:serial},null,2))+'</pre></section></main>';
}

function drawerHtml(state) {
  if (!session) return "";
  const me = human(state);
  let status = "";
  let controls = "";
  if (session.status === "pre_actions") {
    status = "Optional pre-actions, then start the action phase.";
    if (selectedCard) {
      const targetInfo = intrigueTargets(session,selectedCard);
      const disabled = targetInfo.requiresTarget && !selectedIntrigueChoice;
      controls += '<button class="primary" id="play-card" '+(disabled?'disabled':'')+'>'+(disabled?'Choose target':'Play card')+'</button>';
    }
    controls += '<button class="primary" id="start-actions">Start actions</button><button class="ghost" id="restart-game">Restart</button>';
  } else if (session.status === "human_turn") {
    status = "Your action · "+me.familyName+" · "+num(me.influence)+" Influence";
    controls = '<button id="undo" '+(session.undo?'':'disabled')+'>Undo</button><button class="danger" id="pass">Pass</button>';
  } else if (session.status === "ai_step") {
    status = "AI paused after one decision.";
    controls = '<button class="primary" id="step-ai">Step AI</button><button id="auto-ai">Run to my turn</button>';
  } else if (session.status === "actions_complete") {
    status = "Action phase complete. Resolve auctions and the generation.";
    controls = '<button class="primary" id="resolve-generation">Resolve generation</button>';
  } else {
    status = "AI is resolving actions.";
    controls = '<button class="primary" id="continue-ai">Continue</button>';
  }
  return '<div class="drawer"><div class="status">'+h(flash || status)+'</div><div class="drawer-row">'+controls+'</div></div>';
}

function render() {
  if (!game) {
    root.innerHTML = setupHtml();
    bind();
    return;
  }
  const state = activeState();
  const body = tab==="board" ? boardHtml(state) : tab==="analysis" ? analysisHtml(state) : tab==="log" ? logHtml() : debugHtml(state);
  root.innerHTML = '<div class="app">'+topBar(state)+body+drawerHtml(state)+'</div>';
  bind();
}

function continueAi(single) {
  advanceUntilHuman(session,{singleAiStep:single});
  render();
}
function doHuman(spec) {
  const result = playHumanAction(session,spec);
  if (!result.ok) { notify("Action rejected: "+result.reason); return; }
  selectedCard = null;
  if (stepAi) {
    session.status = "actions";
    continueAi(true);
  } else {
    advanceUntilHuman(session,{singleAiStep:false});
    render();
  }
}

function bind() {
  root.querySelectorAll("[data-replace]").forEach(button => button.addEventListener("click",() => { replacePersonality=button.dataset.replace;render(); }));
  root.querySelector("#toggle-step")?.addEventListener("click",() => { stepAi=!stepAi;render(); });
  root.querySelector("#setup-debug")?.addEventListener("click",() => { debug=!debug;render(); });
  root.querySelector("#new-game")?.addEventListener("click",startGame);
  root.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click",() => { tab=button.dataset.tab;render(); }));
  root.querySelector("#toggle-debug")?.addEventListener("click",() => { debug=!debug;if(game)game.playtest.debug=debug;render(); });
  root.querySelectorAll("[data-spec]").forEach(button => button.addEventListener("click",() => doHuman(decodeSpec(button.dataset.spec))));
  root.querySelectorAll("[data-auction]").forEach(button => button.addEventListener("click",() => {
    const action = humanActions().find(row => row.auctionId === button.dataset.auction);
    if (action) doHuman({...action.spec,bid:Number(button.dataset.bid)});
  }));
  root.querySelectorAll("[data-inst]").forEach(button => button.addEventListener("click",() => {
    session = queueInstitutionDevelopment(session,button.dataset.inst);
    selectedCard = null;
    render();
  }));
  root.querySelectorAll("[data-politics]").forEach(button => button.addEventListener("click",() => {
    session = queuePoliticalBid(session,button.dataset.politics);
    render();
  }));
  root.querySelectorAll("[data-card]").forEach(card => card.addEventListener("click",() => {
    if (selectedCard !== card.dataset.card) selectedIntrigueChoice = null;
    selectedCard = card.dataset.card;
    render();
  }));
  root.querySelectorAll("[data-intrigue-choice]").forEach(button => button.addEventListener("click",() => {
    selectedIntrigueChoice = decodeSpec(button.dataset.intrigueChoice);
    render();
  }));
  root.querySelector("#play-card")?.addEventListener("click",() => {
    if (!selectedCard || session.status !== "pre_actions") { notify("Select an Intrigue card before core actions."); return; }
    const targetInfo = intrigueTargets(session,selectedCard);
    if (targetInfo.requiresTarget && !selectedIntrigueChoice) { notify("Choose a legal target first."); return; }
    session = queueIntrigueCard(session,selectedCard,selectedIntrigueChoice);
    selectedCard = null;
    selectedIntrigueChoice = null;
    render();
  });
  root.querySelector("#start-actions")?.addEventListener("click",() => { advanceUntilHuman(session,{singleAiStep:stepAi});render(); });
  root.querySelector("#continue-ai")?.addEventListener("click",() => continueAi(stepAi));
  root.querySelector("#step-ai")?.addEventListener("click",() => continueAi(true));
  root.querySelector("#auto-ai")?.addEventListener("click",() => continueAi(false));
  root.querySelector("#pass")?.addEventListener("click",() => doHuman({kind:"pass"}));
  root.querySelector("#undo")?.addEventListener("click",() => {
    const result = undoLastHumanAction(session);
    if (!result.ok) notify(result.reason);
    render();
  });
  root.querySelector("#resolve-generation")?.addEventListener("click",() => {
    const result = finishInteractiveGeneration(session);
    if (!result.ok) { notify(result.reason); return; }
    game = result.state;
    session = beginInteractiveGeneration(game);
    selectedCard = null;
    selectedIntrigueChoice = null;
    tab = "board";
    render();
  });
  root.querySelectorAll("#restart-game").forEach(button => button.addEventListener("click",resetGame));
}

render();
