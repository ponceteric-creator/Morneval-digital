import fs from 'node:fs';

const engine = await import('../js/v130-elven-alliance-engine.js?sim=commerce-structure-ai');
const MODE = process.env.STRATEGY_MODE === 'allmerchant' ? 'allmerchant' : 'mixed';
const GAMES = Math.max(1, Number(process.env.GAMES) || 100);
const MAX_GENERATIONS = 60;
const RENOWN_TRIGGER = 12;
const BASE_WEALTH = 2;
const AXES = [-2,-1,0,1,2];

const n=v=>Number(v)||0;
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const pk=p=>p.aiPersonality??'unknown';
const bucket=()=>({samples:0,totalWealth:0,generatedWealth:0,totalAgents:0,totalInfluence:0,merchantAgents:0,guardAgents:0,actualMerchantScore:0,legacyMerchantScore:0,gnomeLevel:0,gnomeMaintenance:0});
const byAxis=Object.fromEntries(AXES.map(x=>[String(x),bucket()]));
const byPersonality={};
const finals=[];
let actualScores=[], legacyScores=[], scoreGaps=[];
let merchantBids=0,militaryBids=0;

function persRow(key){return byPersonality[key]??=( {samples:0,wealth:0,influence:0,agents:0,merchantAgents:0,guardAgents:0,merchantBids:0,militaryBids:0} );}
function legacyMerchantScore(state){
  try{
    const eco=engine.previewEconomy(state);
    return n(engine.calculateInstitutionScores(state,eco.reports??[],[],state.city?.order,state.city?.population)?.merchant_guild?.score);
  }catch{return 0;}
}

for(let i=0;i<GAMES;i++){
  const state=engine.createV084Game(['Valenne',"D'Arcy",'Corven']);
  if(MODE==='allmerchant') for(const p of state.players) p.aiPersonality='merchant';
  state.rngState=(246813579+Math.imul(i+1,2654435761))>>>0;
  state.firstPlayerId=state.players[i%state.players.length].id;
  let trigger=null;
  for(let step=0;step<MAX_GENERATIONS;step++){
    if(!state.externalRelations?.active && n(state.city?.population)>=3) engine.activateExternalRelations(state);
    const legacyBefore=legacyMerchantScore(state);
    const summary=engine.resolveAutomatedGeneration(state);
    const actual=n(summary.institutionScores?.merchant_guild?.score);
    actualScores.push(actual);legacyScores.push(legacyBefore);scoreGaps.push(actual-legacyBefore);
    const axis=Math.max(-2,Math.min(2,Math.trunc(n(state.city?.militaryMercantile))));
    const row=byAxis[String(axis)];
    const totalWealth=state.players.reduce((s,p)=>s+Math.max(BASE_WEALTH,n(p.wealthCapacity)),0);
    const generatedWealth=Math.max(0,totalWealth-BASE_WEALTH*state.players.length);
    const totalAgents=state.players.reduce((s,p)=>s+(p.institutionAgentRoster??[]).length,0);
    const totalInfluence=state.players.reduce((s,p)=>s+n(p.influence),0);
    const merchantAgentsTotal=state.players.reduce((s,p)=>s+(p.institutionAgentRoster??[]).filter(a=>a.institutionId==='merchant_guild').length,0);
    const guardAgentsTotal=state.players.reduce((s,p)=>s+(p.institutionAgentRoster??[]).filter(a=>a.institutionId==='city_guard').length,0);
    const maintenance=(summary.externalRelations?.gnomeStakeMaintenance??[]).reduce((s,r)=>s+n(r.influenceSpent),0);
    Object.assign(row,{samples:row.samples+1,totalWealth:row.totalWealth+totalWealth,generatedWealth:row.generatedWealth+generatedWealth,totalAgents:row.totalAgents+totalAgents,totalInfluence:row.totalInfluence+totalInfluence,merchantAgents:row.merchantAgents+merchantAgentsTotal,guardAgents:row.guardAgents+guardAgentsTotal,actualMerchantScore:row.actualMerchantScore+actual,legacyMerchantScore:row.legacyMerchantScore+legacyBefore,gnomeLevel:row.gnomeLevel+n(state.externalRelations?.levels?.gnomes),gnomeMaintenance:row.gnomeMaintenance+maintenance});
    const bids=summary.cityInclinationBids?.bids??[];
    for(const b of bids){
      if(b.pole==='merchant') merchantBids+=1;
      if(b.pole==='military') militaryBids+=1;
      const p=state.players.find(x=>x.id===b.playerId); if(!p)continue;
      const pr=persRow(pk(p)); if(b.pole==='merchant')pr.merchantBids+=1;if(b.pole==='military')pr.militaryBids+=1;
    }
    for(const p of state.players){
      const pr=persRow(pk(p));pr.samples+=1;pr.wealth+=n(p.wealthCapacity);pr.influence+=n(p.influence);pr.agents+=(p.institutionAgentRoster??[]).length;pr.merchantAgents+=(p.institutionAgentRoster??[]).filter(a=>a.institutionId==='merchant_guild').length;pr.guardAgents+=(p.institutionAgentRoster??[]).filter(a=>a.institutionId==='city_guard').length;
    }
    if(state.endgame?.triggered||n(state.city?.renown)>=RENOWN_TRIGGER){trigger=n(state.endgame?.triggerGeneration)||n(summary.generation)||step+1;break;}
  }
  const maxPrestige=Math.max(...state.players.map(p=>n(p.prestige)));
  finals.push({generation:trigger??MAX_GENERATIONS,axis:n(state.city?.militaryMercantile),gnomes:n(state.externalRelations?.levels?.gnomes),population:n(state.city?.population),totalWealth:state.players.reduce((s,p)=>s+n(p.wealthCapacity),0),totalInfluence:state.players.reduce((s,p)=>s+n(p.influence),0),totalAgents:state.players.reduce((s,p)=>s+(p.institutionAgentRoster??[]).length,0),merchantAgents:state.players.reduce((s,p)=>s+(p.institutionAgentRoster??[]).filter(a=>a.institutionId==='merchant_guild').length,0),winners:state.players.filter(p=>n(p.prestige)===maxPrestige).map(pk)});
}

const axisSummary=Object.fromEntries(Object.entries(byAxis).map(([k,r])=>[k,{samples:r.samples,share:0,...Object.fromEntries(['totalWealth','generatedWealth','totalAgents','totalInfluence','merchantAgents','guardAgents','actualMerchantScore','legacyMerchantScore','gnomeLevel','gnomeMaintenance'].map(f=>[f+'Mean',r.samples?r[f]/r.samples:0]))}]));
const totalAxisSamples=Object.values(byAxis).reduce((s,r)=>s+r.samples,0);for(const r of Object.values(axisSummary))r.share=totalAxisSamples?r.samples/totalAxisSamples:0;
const persSummary=Object.fromEntries(Object.entries(byPersonality).map(([k,r])=>[k,{samples:r.samples,wealthMean:r.samples?r.wealth/r.samples:0,influenceMean:r.samples?r.influence/r.samples:0,agentsMean:r.samples?r.agents/r.samples:0,merchantAgentsMean:r.samples?r.merchantAgents/r.samples:0,guardAgentsMean:r.samples?r.guardAgents/r.samples:0,merchantBids:r.merchantBids,militaryBids:r.militaryBids}]));
const out={mode:MODE,games:GAMES,simulationVersion:engine.V135_VERSION??engine.V134_VERSION??null,merchantGuildModelMismatch:{actualScoreMean:mean(actualScores),actualScoreMedian:median(actualScores),legacyAiEstimateMean:mean(legacyScores),legacyAiEstimateMedian:median(legacyScores),gapMean:mean(scoreGaps),generationsActualAboveLegacy:scoreGaps.filter(x=>x>0).length,generationSamples:scoreGaps.length},political:{merchantBids,militaryBids,merchantToMilitaryRatio:militaryBids?merchantBids/militaryBids:null},byAxis:axisSummary,byPersonality:persSummary,final:{generationMean:mean(finals.map(x=>x.generation)),populationMean:mean(finals.map(x=>x.population)),axisMean:mean(finals.map(x=>x.axis)),axisDistribution:Object.fromEntries(AXES.map(a=>[String(a),finals.filter(x=>x.axis===a).length])),gnomeRelationMean:mean(finals.map(x=>x.gnomes)),gnomeDistribution:Object.fromEntries([-3,-2,-1,0,1,2,3].map(a=>[String(a),finals.filter(x=>x.gnomes===a).length])),totalWealthMean:mean(finals.map(x=>x.totalWealth)),totalInfluenceMean:mean(finals.map(x=>x.totalInfluence)),totalAgentsMean:mean(finals.map(x=>x.totalAgents)),merchantAgentsMean:mean(finals.map(x=>x.merchantAgents))}};
fs.mkdirSync('simulation-results',{recursive:true});const path=`simulation-results/commerce-structure-ai-${MODE}.json`;fs.writeFileSync(path,JSON.stringify({summary:out,finals},null,2));console.log(JSON.stringify(out));
