import fs from 'node:fs';

const MODE = process.env.MERCHANT_MODE === 'wealth' ? 'wealth' : 'legacy';
const AI_MODE = process.env.MERCHANT_AI === 'wealth' ? 'ai-aware' : 'rule-only';
const engine = MODE === 'wealth'
  ? await import('../js/v127-merchant-guild-wealth-engine.js?sim=merchant-guild-score')
  : await import('../js/v126-base-wealth-engine.js?sim=merchant-guild-score');

const GAMES = 100;
const RENOWN_TRIGGER = 12;
const MAX_GENERATIONS = 60;
function n(v){return Number(v)||0;} function mean(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:0;}
function sorted(a){return [...a].sort((x,y)=>x-y);} function median(a){const s=sorted(a),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function personalityKey(p){return p.aiPersonality??'unknown';}
function agentCount(p,id){return (p.institutionAgentRoster??[]).filter(a=>a.institutionId===id).length;}
function substantiveAction(a){if(!a||a.freeAction)return false;const k=String(a.actionKind??a.type??'').toLowerCase();return k&&k!=='pass'&&!k.includes('pass action');}
function tierMap(state){return Object.fromEntries((state.institutions??[]).map(x=>[x.id,n(x.tier)]));}

const data=[]; let totalMerchantRepresentedPlayerGenerations=0,totalPlayerGenerations=0,totalMerchantPrestigeAwards=0,totalMerchantScoreRepresentedSamples=0,totalMerchantScoreWhenRepresented=0;
for(let i=0;i<GAMES;i+=1){
  const state=engine.createV084Game(['Valenne',"D'Arcy",'Corven']); state.rngState=(246813579+Math.imul(i+1,2654435761))>>>0; state.firstPlayerId=state.players[i%state.players.length].id;
  let actions=0,triggerGeneration=null,generationCount=0,merchantPrestigeAwards=0,merchantRepresentedPG=0,merchantScoreSumWhenRepresented=0,merchantScoreSamples=0,merchantScoreAtTrigger=0;
  for(let step=0;step<MAX_GENERATIONS;step+=1){
    const summary=engine.resolveAutomatedGeneration(state); generationCount+=1; actions+=(summary.actions??[]).filter(substantiveAction).length;
    const mgScore=Math.max(0,n(summary.institutionScores?.merchant_guild?.score));
    for(const player of state.players){totalPlayerGenerations+=1;if(agentCount(player,'merchant_guild')>0){merchantRepresentedPG+=1;totalMerchantRepresentedPlayerGenerations+=1;merchantScoreSumWhenRepresented+=mgScore;totalMerchantScoreWhenRepresented+=mgScore;merchantScoreSamples+=1;totalMerchantScoreRepresentedSamples+=1;}}
    for(const award of summary.institutionPrestigeAwards??[]){if(award.institutionId==='merchant_guild'){const amount=Math.max(0,n(award.amount));merchantPrestigeAwards+=amount;totalMerchantPrestigeAwards+=amount;}}
    if(state.endgame?.triggered||n(state.city?.renown)>=RENOWN_TRIGGER){triggerGeneration=n(state.endgame?.triggerGeneration)||n(summary.generation)||generationCount;merchantScoreAtTrigger=mgScore;break;}
  }
  const maxPrestige=Math.max(...state.players.map(p=>n(p.prestige))); const winners=state.players.filter(p=>n(p.prestige)===maxPrestige).map(personalityKey); const breakdown=state.city?.renownBreakdown??{}; const tiers=tierMap(state);
  data.push({game:i+1,reached:triggerGeneration!=null,generation:triggerGeneration??MAX_GENERATIONS,actions,estimatedMinutes:actions+5*(triggerGeneration??MAX_GENERATIONS),population:n(state.city?.population),renown:n(state.city?.renown),axis:{militaryMercantile:n(state.city?.militaryMercantile),religionArcane:n(state.city?.religionArcane)},winners,institutionTiers:tiers,renownBreakdown:{populationRenown:n(breakdown.populationRenown),productionRenown:n(breakdown.productionRenown),institutionRenown:n(breakdown.institutionRenown),permanentCardRenown:n(breakdown.permanentCardRenown)},merchantGuild:{scoreAtTrigger:merchantScoreAtTrigger,representedPlayerGenerations:merchantRepresentedPG,prestigeAwards:merchantPrestigeAwards,avgScoreWhenRepresented:merchantScoreSamples?merchantScoreSumWhenRepresented/merchantScoreSamples:0,commercialWealthAtTrigger:Math.max(0,state.players.reduce((s,p)=>s+n(p.wealthCapacity),0)-2*state.players.length)},players:state.players.map(p=>({personality:personalityKey(p),prestige:n(p.prestige),influence:n(p.influence),wealth:n(p.wealthCapacity),agents:{city_guard:agentCount(p,'city_guard'),temple:agentCount(p,'temple'),merchant_guild:agentCount(p,'merchant_guild'),scholarium:agentCount(p,'scholarium')}}))});
}
const personalities=['dynast','merchant','contrarian']; const wins={dynast:0,merchant:0,contrarian:0,tie:0}; for(const row of data){if(row.winners.length!==1)wins.tie++;else wins[row.winners[0]]=(wins[row.winners[0]]??0)+1;}
const playerSummary={}; for(const key of personalities){const rows=data.map(g=>g.players.find(p=>p.personality===key)).filter(Boolean);playerSummary[key]={prestigeMean:mean(rows.map(p=>p.prestige)),wealthMean:mean(rows.map(p=>p.wealth)),influenceMean:mean(rows.map(p=>p.influence)),merchantAgentsMean:mean(rows.map(p=>p.agents.merchant_guild)),totalAgentsMean:mean(rows.map(p=>Object.values(p.agents).reduce((s,v)=>s+v,0)))};}
const instIds=['city_guard','temple','merchant_guild','scholarium'];
const summary={mode:MODE,aiMode:AI_MODE,games:GAMES,reached:data.filter(x=>x.reached).length,generation:{mean:mean(data.map(x=>x.generation)),median:median(data.map(x=>x.generation)),min:Math.min(...data.map(x=>x.generation)),max:Math.max(...data.map(x=>x.generation))},estimatedMinutes:{mean:mean(data.map(x=>x.estimatedMinutes)),median:median(data.map(x=>x.estimatedMinutes))},populationMean:mean(data.map(x=>x.population)),wins,players:playerSummary,merchantGuild:{representationRate:totalPlayerGenerations?totalMerchantRepresentedPlayerGenerations/totalPlayerGenerations:0,prestigeAwardsPerGame:totalMerchantPrestigeAwards/GAMES,avgScoreWhenRepresented:totalMerchantScoreRepresentedSamples?totalMerchantScoreWhenRepresented/totalMerchantScoreRepresentedSamples:0,scoreAtTriggerMean:mean(data.map(x=>x.merchantGuild.scoreAtTrigger)),commercialWealthAtTriggerMean:mean(data.map(x=>x.merchantGuild.commercialWealthAtTrigger))},institutionTierMean:Object.fromEntries(instIds.map(id=>[id,mean(data.map(x=>x.institutionTiers[id]??1))])),institutionTier3Count:Object.fromEntries(instIds.map(id=>[id,data.filter(x=>(x.institutionTiers[id]??1)>=3).length])),renownBreakdownMean:Object.fromEntries(['populationRenown','productionRenown','institutionRenown','permanentCardRenown'].map(k=>[k,mean(data.map(x=>x.renownBreakdown[k]))])),axisMilitaryMercantile:Object.fromEntries([-2,-1,0,1,2].map(v=>[String(v),data.filter(x=>x.axis.militaryMercantile===v).length]))};
fs.mkdirSync('simulation-results',{recursive:true}); const suffix=MODE==='legacy'?'legacy':`wealth-${AI_MODE}`; const path=`simulation-results/merchant-guild-${suffix}.json`; fs.writeFileSync(path,JSON.stringify({summary,data},null,2)); console.log(`WROTE ${path}`); console.log(JSON.stringify(summary));
