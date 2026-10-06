import * as legacy from './v113-intrigue-engine.js?base=0.11.3-intrigue';
import * as ai from './v111-ai-engine.js?intrigue=0.11.5';
import { getActiveIntrigueCardDefinitions, INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';

export * from './v113-intrigue-engine.js?base=0.11.3-intrigue';

const POWER_VALUE = { LOW: 1.0, MID: 2.2, HIGH: 4.0 };
const INFLUENCE_CEILING = 15;
const AI_PLAY_FLOOR = 1.05;
const MAX_INTRIGUE_ACTIONS_PER_FAMILY = 2; // AI simulation guardrail, not a tabletop rule.
const INSTITUTIONS = ['city_guard','temple','merchant_guild','scholarium'];

function clampInt(v, lo=0, hi=Number.POSITIVE_INFINITY){ const n=Math.floor(Number(v)||0); return Math.max(lo,Math.min(hi,n)); }
function playerById(state,id){ return (state.players??[]).find(p=>p.id===id)??null; }
function turnOrder(state){ return typeof legacy.getTurnOrder==='function' ? legacy.getTurnOrder(state) : [...(state.players??[])]; }
function meta(cardId){ return INTRIGUE_CARD_META[cardId]??null; }
function powerValue(cardId){ return POWER_VALUE[meta(cardId)?.power]??1; }
function familyLeader(state, excludeId=null){ return [...(state.players??[])].filter(p=>p.id!==excludeId).sort((a,b)=>(b.prestige??0)-(a.prestige??0) || (b.influence??0)-(a.influence??0))[0]??null; }
function ensureMetrics(state){
  state.intrigueSim ??= { generations:[], totals:{ seen:0, kept:0, played:0, deadDraws:0, reactions:0, highSeen:0, highPlayed:0, patentsPlayed:0, patentTransfers:0 } };
  return state.intrigueSim;
}
function nextRand(state){
  state.intrigueAiRngState ??= ((Number(state.rngState)>>>0)^0x51f15e5d)>>>0;
  state.intrigueAiRngState=(Math.imul(1664525,state.intrigueAiRngState>>>0)+1013904223)>>>0;
  return state.intrigueAiRngState/4294967296;
}
function shuffle(state, arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(nextRand(state)*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function ensureConfigured(state){
  const intrigue=legacy.ensureIntrigueState(state);
  ensureMetrics(state);
  if (!intrigue.v115Configured){
    legacy.configureIntrigueDecks(state,getActiveIntrigueCardDefinitions());
    state.intrigue.v115Configured=true;
    state.intrigue.v115Version='0.11.5';
  }
  state.city.contingencyReserveFood ??= 0;
  state.city.contingencyReserveExpiresAfter ??= null;
  state.intrigueTemporary ??= {};
  return state.intrigue;
}

function recycle(state, institutionId){
  const d=state.intrigue.decks[institutionId];
  if(!d.drawPile.length && d.discardPile.length) d.drawPile=shuffle(state,d.discardPile.splice(0));
}
function draw(state,institutionId){ recycle(state,institutionId); return state.intrigue.decks[institutionId].drawPile.pop()??null; }
function discard(state,card){ if(!card)return; const m=meta(card.cardId); if(!m)return; state.intrigue.decks[m.institutionId].discardPile.push({instanceId:card.instanceId,cardId:card.cardId}); }
function removeFromHand(state,playerId,instanceId){ const h=state.intrigue.hands[playerId]??[]; const idx=h.findIndex(c=>c.instanceId===instanceId); if(idx<0)return null; return h.splice(idx,1)[0]; }
function findReaction(state,playerId,cardId){ return (state.intrigue.hands[playerId]??[]).find(c=>c.cardId===cardId)??null; }
function consumeReaction(state,player,cardId,cost,reason){
  const c=findReaction(state,player.id,cardId); if(!c || player.influence<cost)return false;
  player.influence-=cost; removeFromHand(state,player.id,c.instanceId); discard(state,c);
  state.intrigue.playHistory.push({generation:state.generation,playerId:player.id,instanceId:c.instanceId,cardId,timing:'reaction',influenceCost:cost,permanent:false,reason});
  ensureMetrics(state).totals.reactions++; return true;
}
function normalInfluenceGain(player,amount){ player.influence=Math.min(INFLUENCE_CEILING,Math.max(0,player.influence)+amount); }
function syncAgentCounts(player){
  player.institutionAgents ??= {};
  for(const id of INSTITUTIONS) player.institutionAgents[id]=(player.institutionAgentRoster??[]).filter(a=>a.institutionId===id).length;
}
function removeAgent(player,agent){ if(!agent)return false; const roster=player.institutionAgentRoster??[]; const i=roster.findIndex(a=>a.id===agent.id); if(i<0)return false; roster.splice(i,1); syncAgentCounts(player); return true; }
function lowestAgent(player,institutionId=null){ return [...(player.institutionAgentRoster??[])].filter(a=>!institutionId||a.institutionId===institutionId).sort((a,b)=>(a.seniority??1)-(b.seniority??1)||(b.placementOrder??0)-(a.placementOrder??0))[0]??null; }
function bestAgent(player,institutionId=null){ return [...(player.institutionAgentRoster??[])].filter(a=>!institutionId||a.institutionId===institutionId).sort((a,b)=>(b.seniority??1)-(a.seniority??1)||(a.placementOrder??0)-(b.placementOrder??0))[0]??null; }
function patents(state){ return (state.intrigue.inPlay??[]).filter(c=>meta(c.cardId)?.tags?.includes('patent')); }
function landImprovements(state){ return (state.intrigue.inPlay??[]).filter(c=>meta(c.cardId)?.tags?.includes('land_improvement')); }
function unownedPatentTarget(state,playerId){ return patents(state).filter(c=>c.ownerId!==playerId).sort((a,b)=>(playerById(state,b.ownerId)?.prestige??0)-(playerById(state,a.ownerId)?.prestige??0))[0]??null; }
function eligibleLand(state,playerId,terrain=null,owned=true){ return (state.lands??[]).filter(l=>l.revealed && l.development==='natural' && (!terrain || (l.originalTerrain??l.terrain)===terrain) && (owned ? l.ownerId===playerId : l.ownerId && l.ownerId!==playerId && l.ownerId!=='city')); }
function hasPermanent(state,cardId){ return (state.intrigue.inPlay??[]).some(c=>c.cardId===cardId); }

function legalCardScore(state, player, card){
  const m=meta(card.cardId); if(!m)return 0;
  let score=powerValue(card.cardId);
  const influence=Math.max(0,Number(player.influence)||0);
  const minCost=Math.max(0,Number(m.influenceCost)||0);
  if(influence<minCost)return 0;
  if(m.permanent && hasPermanent(state,m.id))return 0;
  if(m.permanent) score += Math.max(0,2.2-(Number(state.generation)||0)*0.08);
  switch(m.id){
    case 'gemstone_vein': case 'rare_breed': case 'precious_timber': if(!eligibleLand(state,player.id,m.targetTerrain,true).length)return 0; break;
    case 'assassination': if(!(state.players??[]).some(p=>p.id!==player.id && (p.institutionAgentRoster??[]).length))return 0; score+=0.4; break;
    case 'bodyguards': return 0.55;
    case 'land_seizure': if(!eligibleLand(state,player.id,null,false).length)return 0; score+=0.7; break;
    case 'martial_law': if((state.city.order??2)>=4)score*=0.55; break;
    case 'officer_purge': if(!(state.players??[]).some(p=>p.id!==player.id&&(p.institutionAgents?.city_guard??0)>0))return 0; break;
    case 'contingency_reserves': if(state.city.contingencyReserveFood>0)return 0.15; score += (legacy.getFoodSubsistenceStatus?.(state)?.localCapacity??0)>=state.city.population ? 0.8 : 0.1; break;
    case 'spy_network': if(!(state.players??[]).some(p=>p.id!==player.id&&(state.intrigue.hands[p.id]??[]).length))return 0; break;
    case 'counter_intelligence': return 0.8;
    case 'technological_acceleration': if(!(state.productionSectors??[]).some(s=>s.id!=='food'&&s.tier<3))return 0; break;
    case 'experimental_methods': if(!(state.lands??[]).some(l=>l.revealed&&l.development==='natural'))return 0; break;
    case 'expose_charlatans': if(!(state.players??[]).some(p=>p.id!==player.id&&(p.institutionAgents?.scholarium??0)>0))return 0; break;
    case 'insider_information': score += (state.productionSectors??[]).some(s=>s.tier>0)?0.35:0; break;
    case 'dark_magic': if((player.prestige??0)<3)return 0; score += influence<=6?1.2:0; break;
    case 'infernal_pact': if((player.prestige??0)<2)return 0; score += influence<=7?0.9:0; break;
    case 'hunt_heretics': if(!(state.players??[]).some(p=>p.id!==player.id&&(p.institutionAgents?.temple??0)>0))return 0; break;
    case 'anathema': if(!(state.players??[]).some(p=>p.id!==player.id))return 0; score+=0.5; break;
    case 'alms_poor': if((state.city.squalor??0)<=0)score*=0.35; break;
    case 'ecclesiastical_confiscation': if(!eligibleLand(state,player.id,null,false).length)return 0; score+=0.45; break;
    case 'public_absolution': return 0.65;
    case 'legal_contestation': if(!unownedPatentTarget(state,player.id)||influence<3)return 0; score+=0.6; break;
    case 'crooked_notary': if(!unownedPatentTarget(state,player.id))return 0; score+=1.1; break;
    case 'criminal_network': if((player.prestige??0)<1)return 0; score+=influence<=9?0.6:0; break;
    case 'hostile_takeover': if(!(state.players??[]).some(p=>p.id!==player.id&&(p.productionStakes??[]).some(s=>s.age==='mature'||s.age==='elder'))||influence<2)return 0; score+=0.6; break;
    case 'binding_bids': if(influence<2)return 0; break;
    case 'line_of_credit': if((player.prestige??0)<10)return 0; score+=influence<=6?0.8:0.1; break;
    case 'preferential_contracts': score += (player.productionStakes??[]).length?0.4:0; break;
    case 'private_buyer': score += (player.productionStakes??[]).length?0.55:0; break;
    case 'misdirection': return 0.75;
    case 'audit_license_privileges': if(!(state.players??[]).some(p=>p.id!==player.id&&(p.institutionAgents?.merchant_guild??0)>0))return 0; break;
  }
  score -= minCost*0.12;
  return Math.max(0,score);
}

function acquireIntrigueCardsAI(state){
  ensureConfigured(state);
  const generation=Number(state.generation)||0;
  if(state.intrigue.lastAcquiredGeneration===generation) return state.intrigue.acquisitionHistory.find(e=>e.generation===generation)??null;
  const selections=[]; const metrics=ensureMetrics(state).totals;
  for(const player of state.players??[]){
    const agents=[...(player.institutionAgentRoster??[])].sort((a,b)=>(a.placementOrder??0)-(b.placementOrder??0));
    for(const agent of agents){
      if(!INSTITUTIONS.includes(agent.institutionId))continue;
      const n=clampInt(agent.seniority??1,1,3), options=[];
      for(let i=0;i<n;i++){ const c=draw(state,agent.institutionId); if(c)options.push(c); }
      metrics.seen+=options.length; metrics.highSeen+=options.filter(c=>meta(c.cardId)?.power==='HIGH').length;
      if(!options.length){ selections.push({playerId:player.id,agentId:agent.id,institutionId:agent.institutionId,seniority:n,cardsSeen:[],keptCard:null,reason:'deck_empty'}); continue; }
      const ranked=options.map(c=>({c,score:legalCardScore(state,player,c)})).sort((a,b)=>b.score-a.score || nextRand(state)-0.5);
      const kept=ranked[0].c; if(ranked[0].score<=0)metrics.deadDraws++;
      for(const c of options) if(c.instanceId!==kept.instanceId)discard(state,c);
      state.intrigue.hands[player.id].push({...kept,acquiredGeneration:generation,sourceAgentId:agent.id});
      metrics.kept++;
      selections.push({playerId:player.id,agentId:agent.id,institutionId:agent.institutionId,seniority:n,cardsSeen:options.map(c=>c.cardId),keptCard:kept.cardId,keptInstanceId:kept.instanceId,aiKeepScore:ranked[0].score});
    }
  }
  const entry={generation,selections}; state.intrigue.acquisitionHistory.push(entry); state.intrigue.lastAcquiredGeneration=generation; return entry;
}

function maybeRedirect(state,source,target,attackId){
  if(!target||source.id===target.id)return target;
  if(!findReaction(state,target.id,'misdirection')||target.influence<3)return target;
  const alternatives=(state.players??[]).filter(p=>p.id!==source.id&&p.id!==target.id); if(!alternatives.length)return target;
  const redirected=[...alternatives].sort((a,b)=>(b.prestige??0)-(a.prestige??0))[0]; consumeReaction(state,target,'misdirection',3,`redirect_${attackId}`); return redirected;
}
function maybeCounter(state,target,attackId){ if(!target||attackId==='assassination')return false; return consumeReaction(state,target,'counter_intelligence',2,`counter_${attackId}`); }
function adversePrestigeLoss(state,target,amount,sourceId){ let loss=Math.max(0,amount); if(target&&sourceId!==target.id&&loss>0&&findReaction(state,target.id,'public_absolution')&&target.influence>=1){consumeReaction(state,target,'public_absolution',1,'prestige_loss');loss=Math.max(0,loss-2);} target.prestige=Math.max(0,(target.prestige??0)-loss);return loss; }
function taxAgents(state,source,institutionId,costPerAgent){ const out=[]; for(const target of state.players??[]){ if(target.id===source.id)continue; const agents=[...(target.institutionAgentRoster??[])].filter(a=>a.institutionId===institutionId); let paid=0,removed=0; for(const a of agents){ if(target.influence>=costPerAgent+1){target.influence-=costPerAgent;paid+=costPerAgent;}else if(removeAgent(target,a))removed++; } out.push({targetId:target.id,paid,removed}); } return out; }
function chooseLandTarget(state,source){ return eligibleLand(state,source.id,null,false).sort((a,b)=>((playerById(state,b.ownerId)?.prestige??0)-(playerById(state,a.ownerId)?.prestige??0))||((b.baseCapacity??0)-(a.baseCapacity??0)))[0]??null; }
function chooseOwnLand(state,source,terrain=null){ return eligibleLand(state,source.id,terrain,true).sort((a,b)=>(b.baseCapacity??0)-(a.baseCapacity??0))[0]??null; }
function chooseNaturalLand(state){ return (state.lands??[]).filter(l=>l.revealed&&l.development==='natural').sort((a,b)=>(b.baseCapacity??0)-(a.baseCapacity??0))[0]??null; }
function playtestChoicePlayer(state, source, choice){
  const target=playerById(state,choice?.playerId);
  return target&&target.id!==source.id?target:null;
}
function playtestChoiceLand(state, choice, predicate=()=>true){
  const land=(state.lands??[]).find(row=>row.id===choice?.landId);
  return land&&predicate(land)?land:null;
}
function playtestChoiceSector(state, choice, predicate=()=>true){
  const sector=(state.productionSectors??[]).find(row=>row.id===choice?.sectorId);
  return sector&&predicate(sector)?sector:null;
}
function playtestChoicePatent(state, source, choice){
  const patent=patents(state).find(row=>row.instanceId===choice?.patentInstanceId);
  return patent&&patent.ownerId!==source.id?patent:null;
}
function playtestChoiceStake(state, source, choice){
  for(const target of state.players??[]){
    if(target.id===source.id)continue;
    const stake=(target.productionStakes??[]).find(row=>row.id===choice?.stakeId);
    if(stake)return{player:target,stake};
  }
  return null;
}
function playtestChoiceAgent(target, choice){
  return (target?.institutionAgentRoster??[]).find(row=>row.id===choice?.agentId)??null;
}
function playtestIntrigueTargets(state, player, card){
  const m=meta(card?.cardId); if(!m)return{requiresTarget:false,options:[]};
  const option=(id,label,choice,extra={})=>({id,label,choice,...extra});
  let options=[];
  switch(m.id){
    case 'gemstone_vein':case 'rare_breed':case 'precious_timber':
      options=eligibleLand(state,player.id,m.targetTerrain,true).map(land=>option(land.id,land.name??land.id,{landId:land.id},{type:'land'}));break;
    case 'assassination':
      options=(state.players??[]).filter(p=>p.id!==player.id).flatMap(target=>(target.institutionAgentRoster??[]).map(agent=>
        option(agent.id,target.familyName+' · '+agent.institutionId+' S'+(agent.seniority??1),{playerId:target.id,agentId:agent.id},{type:'agent'})));break;
    case 'land_seizure':case 'ecclesiastical_confiscation':
      options=eligibleLand(state,player.id,null,false).map(land=>option(land.id,(land.name??land.id)+' · '+(playerById(state,land.ownerId)?.familyName??land.ownerId),{landId:land.id},{type:'land'}));break;
    case 'spy_network':
      options=(state.players??[]).filter(p=>p.id!==player.id&&(state.intrigue.hands[p.id]??[]).length).flatMap(target=>{
        const out=[option(target.id+':inspect',target.familyName+' · inspect',{playerId:target.id,mode:'inspect'},{type:'player'})];
        if(player.influence>=(m.influenceCost??0)+1)out.push(option(target.id+':discard',target.familyName+' · discard best (+1I)',{playerId:target.id,mode:'discard'},{type:'player'}));
        if(player.influence>=(m.influenceCost??0)+2)out.push(option(target.id+':steal',target.familyName+' · steal best (+2I)',{playerId:target.id,mode:'steal'},{type:'player'}));
        return out;
      });break;
    case 'technological_acceleration':
      options=(state.productionSectors??[]).filter(sector=>sector.id!=='food'&&sector.tier<3&&ai.getProductionDevelopmentCost?.(sector)).map(sector=>
        option(sector.id,sector.name??sector.id,{sectorId:sector.id},{type:'sector'}));break;
    case 'experimental_methods':
      options=(state.lands??[]).filter(land=>land.revealed&&land.development==='natural').map(land=>option(land.id,land.name??land.id,{landId:land.id},{type:'land'}));break;
    case 'threat_excommunication':case 'anathema':
      options=(state.players??[]).filter(p=>p.id!==player.id).map(target=>option(target.id,target.familyName,{playerId:target.id},{type:'player'}));break;
    case 'legal_contestation':case 'crooked_notary':
      options=patents(state).filter(patent=>patent.ownerId!==player.id).map(patent=>option(patent.instanceId,(meta(patent.cardId)?.name??patent.cardId)+' · '+(playerById(state,patent.ownerId)?.familyName??patent.ownerId),{patentInstanceId:patent.instanceId},{type:'patent'}));break;
    case 'hostile_takeover':
      options=stakeEntries(state,(stake,p)=>p.id!==player.id&&(stake.age==='mature'||stake.age==='elder')).map(entry=>
        option(entry.stake.id,entry.player.familyName+' · '+entry.stake.sectorId+' '+entry.stake.age,{stakeId:entry.stake.id},{type:'stake'}));break;
    case 'binding_bids':
      options=(state.productionSectors??[]).filter(sector=>sector.id!=='food'&&sector.tier>stakeEntries(state,stake=>stake.sectorId===sector.id&&stake.age==='young').length).map(sector=>
        option(sector.id,sector.name??sector.id,{sectorId:sector.id},{type:'sector'}));break;
    case 'private_buyer':
      options=(state.productionSectors??[]).filter(sector=>sector.id!=='food').map(sector=>option(sector.id,sector.name??sector.id,{sectorId:sector.id},{type:'sector'}));break;
    case 'line_of_credit':
      options=[1,2,3].filter(level=>level===1||(level===2&&(player.prestige??0)>=20)||(level===3&&(player.prestige??0)>=30)).map(level=>{
        const amount=level===1?5:level===2?10:15;
        return option(String(level),'Level '+level+' · +'+amount+' Influence',{level},{type:'level'});
      });break;
    case 'preferential_contracts':
      options=[1,2,3].filter(level=>player.influence>=level).map(level=>option(String(level),'Level '+level+' · '+(level===1?1:level===2?3:5)+' Influence',{level},{type:'level'}));break;
    default:return{requiresTarget:false,options:[]};
  }
  return{requiresTarget:true,options};
}
function stakeEntries(state,filter=()=>true){ const out=[]; for(const p of state.players??[])for(const s of p.productionStakes??[])if(filter(s,p))out.push({player:p,stake:s});return out; }
function removeStake(player,stakeId){ const i=(player.productionStakes??[]).findIndex(s=>s.id===stakeId);if(i<0)return null;return player.productionStakes.splice(i,1)[0]; }
function addStake(state,player,sectorId,age='young'){ state.nextProductionStakeOrder=Math.max(1,Number(state.nextProductionStakeOrder)||1); const order=state.nextProductionStakeOrder++; const s={id:`stake_${order}`,ownerId:player.id,sectorId,age,placementOrder:order,servedThisGeneration:false,servedDemandCategory:null,wealthProducedThisGeneration:0}; player.productionStakes??=[];player.productionStakes.push(s);return s; }
function simpleAuction(state,source,opening,eligiblePlayers,{allPay=false,bonusByPlayer={}}={}){ const bids=[]; for(const p of eligiblePlayers){const bonus=bonusByPlayer[p.id]??0,available=Math.max(0,p.influence+bonus);let willingness=Math.min(available,Math.max(opening,1+Math.floor((p.prestige??0)/12)));if(p.id===source.id)willingness=Math.max(opening,willingness);bids.push({player:p,bid:willingness,bonus});} bids.sort((a,b)=>b.bid-a.bid||(a.player.id===source.id?-1:1));const winner=bids[0]??null;for(const b of bids)if(allPay||b===winner){const cash=Math.max(0,b.bid-b.bonus);b.player.influence=Math.max(0,b.player.influence-cash);}return{winner,bids:bids.map(b=>({playerId:b.player.id,bid:b.bid,bonus:b.bonus}))}; }
function transferPatent(state,patent,newOwnerId){ const old=patent.ownerId;patent.ownerId=newOwnerId;ensureMetrics(state).totals.patentTransfers++;return{cardId:patent.cardId,from:old,to:newOwnerId}; }
function logPlay(state,player,card,cost,effect){ state.intrigue.playHistory.push({generation:Number(state.generation)||0,playerId:player.id,instanceId:card.instanceId,cardId:card.cardId,timing:meta(card.cardId)?.timing,influenceCost:cost,permanent:Boolean(meta(card.cardId)?.permanent),effect}); ensureMetrics(state).totals.played++; if(meta(card.cardId)?.power==='HIGH')ensureMetrics(state).totals.highPlayed++; }

function resolveCard(state,player,card,choice=null){
  const m=meta(card.cardId);if(!m)return{ok:false,reason:'unknown'};const baseCost=m.influenceCost??0;if(player.influence<baseCost)return{ok:false,reason:'insufficient_influence'};const t=state.intrigueTemporary;let cost=baseCost,effect={};player.influence-=baseCost;
  switch(m.id){
    case 'advanced_farming_techniques':case 'civic_sanitation_works':case 'advanced_judicial_system':case 'advanced_architecture':effect={permanent:true};break;
    case 'gemstone_vein':case 'rare_breed':case 'precious_timber':{const land=choice?playtestChoiceLand(state,choice,l=>l.revealed&&l.development==='natural'&&(l.originalTerrain??l.terrain)===m.targetTerrain&&l.ownerId===player.id):chooseOwnLand(state,player,m.targetTerrain);if(!land){player.influence+=baseCost;return{ok:false,reason:'no_land_target'};}effect={targetLandId:land.id};break;}
    case 'assassination':{let target=choice?playtestChoicePlayer(state,player,choice):familyLeader(state,player.id);target=maybeRedirect(state,player,target,'assassination');const agent=(choice&&target?.id===choice.playerId?playtestChoiceAgent(target,choice):null)??bestAgent(target);if(!target||!agent){player.influence+=baseCost;return{ok:false,reason:'no_agent_target'};}removeAgent(target,agent);effect={targetPlayerId:target.id,targetAgentId:agent.id,dynastyNotSimulated:true};break;}
    case 'land_seizure':{let land=choice?playtestChoiceLand(state,choice,l=>l.revealed&&l.development==='natural'&&l.ownerId&&l.ownerId!==player.id&&l.ownerId!=='city'):chooseLandTarget(state,player);if(!land){player.influence+=baseCost;return{ok:false,reason:'no_land_target'};}let target=playerById(state,land.ownerId);target=maybeRedirect(state,player,target,'land_seizure');if(target&&target.id!==land.ownerId){const alt=eligibleLand(state,player.id,null,false).find(l=>l.ownerId===target.id);if(alt)land=alt;}if(target&&maybeCounter(state,target,'land_seizure')){effect={cancelled:true};break;}const domainCost=ai.getDomainAcquisitionCost?.(state,player.id)??1;if(player.influence<domainCost){player.influence+=baseCost;return{ok:false,reason:'insufficient_domain_cost'};}player.influence-=domainCost;cost+=domainCost;effect={landId:land.id,from:land.ownerId,to:player.id,domainCost};land.ownerId=player.id;break;}
    case 'martial_law':t.orderModifier=(t.orderModifier??0)+1;player.prestige=(player.prestige??0)+1;effect={order:1,prestige:1};break;
    case 'officer_purge':effect={tax:taxAgents(state,player,'city_guard',1)};break;
    case 'contingency_reserves':if(state.city.contingencyReserveFood>0){player.influence+=baseCost;return{ok:false,reason:'reserve_exists'};}t.reserveIntentBy=player.id;effect={reserveIntent:true};break;
    case 'spy_network':{let target=choice?playtestChoicePlayer(state,player,choice):familyLeader(state,player.id);target=maybeRedirect(state,player,target,'spy_network');if(!target){player.influence+=baseCost;return{ok:false,reason:'no_target'};}if(maybeCounter(state,target,'spy_network')){effect={cancelled:true};break;}const hand=state.intrigue.hands[target.id]??[];if(!hand.length){effect={targetId:target.id,seen:[]};break;}const best=[...hand].sort((a,b)=>legalCardScore(state,target,b)-legalCardScore(state,target,a))[0];const mode=choice?.mode??(player.influence>=2?'steal':player.influence>=1?'discard':'inspect');if(mode==='steal'&&player.influence>=2){player.influence-=2;cost+=2;removeFromHand(state,target.id,best.instanceId);state.intrigue.hands[player.id].push({...best,stolenGeneration:state.generation});effect={targetId:target.id,mode:'steal',cardId:best.cardId};}else if(mode==='discard'&&player.influence>=1){player.influence-=1;cost+=1;removeFromHand(state,target.id,best.instanceId);discard(state,best);effect={targetId:target.id,mode:'discard',cardId:best.cardId};}else effect={targetId:target.id,mode:'inspect',seen:hand.map(c=>c.cardId)};break;}
    case 'technological_acceleration':{const sectors=(state.productionSectors??[]).filter(s=>s.id!=='food'&&s.tier<3).map(s=>({s,c:ai.getProductionDevelopmentCost?.(s)})).filter(x=>x.c&&player.influence>=x.c.influenceCost).sort((a,b)=>(b.c.prestige??0)-(a.c.prestige??0));const selected=choice?playtestChoiceSector(state,choice,s=>s.id!=='food'&&s.tier<3):null;const pick=selected?sectors.find(x=>x.s.id===selected.id):sectors[0];if(!pick){player.influence+=baseCost;return{ok:false,reason:'no_affordable_development'};}player.influence-=pick.c.influenceCost;cost+=pick.c.influenceCost;const targetTier=pick.s.tier+1;pick.s.developmentPhase=pick.c.phase;pick.s.developmentTargetTier=targetTier;pick.s.lastDevelopmentGeneration=state.generation;pick.s.lastDevelopmentContributorId=player.id;let tierActivated=false;if(pick.c.phase===3){pick.s.tier=targetTier;pick.s.developmentPhase=0;pick.s.developmentTargetTier=pick.s.tier<3?pick.s.tier+1:null;tierActivated=true;}player.prestige=(player.prestige??0)+(pick.c.prestige??0)+1;effect={sectorId:pick.s.id,developmentCost:pick.c.influenceCost,prestige:(pick.c.prestige??0)+1,tierActivated};break;}
    case 'experimental_methods':{const land=choice?playtestChoiceLand(state,choice,l=>l.revealed&&l.development==='natural'):chooseNaturalLand(state);if(!land){player.influence+=baseCost;return{ok:false,reason:'no_natural_land'};}t.capacityBoosts??=[];t.capacityBoosts.push({landId:land.id,amount:1});player.prestige=(player.prestige??0)+1;effect={landId:land.id,capacity:1,prestige:1};break;}
    case 'expose_charlatans':effect={tax:taxAgents(state,player,'scholarium',2)};break;
    case 'insider_information':t.bidBonusByPlayer??={};t.bidBonusByPlayer[player.id]=(t.bidBonusByPlayer[player.id]??0)+2;effect={bidOnlyInfluence:2};break;
    case 'dark_magic':if((player.prestige??0)<3){player.influence+=baseCost;return{ok:false,reason:'insufficient_prestige'};}player.prestige-=3;normalInfluenceGain(player,6);effect={prestige:-3,influence:6};break;
    case 'infernal_pact':if((player.prestige??0)<2){player.influence+=baseCost;return{ok:false,reason:'insufficient_prestige'};}player.prestige-=2;normalInfluenceGain(player,4);effect={prestige:-2,influence:4};break;
    case 'hunt_heretics':effect={tax:taxAgents(state,player,'temple',2)};break;
    case 'threat_excommunication':{let target=choice?playtestChoicePlayer(state,player,choice):familyLeader(state,player.id);target=maybeRedirect(state,player,target,'threat_excommunication');if(!target){player.influence+=baseCost;return{ok:false,reason:'no_target'};}if(maybeCounter(state,target,'threat_excommunication')){effect={cancelled:true};break;}if(target.influence>=4){target.influence-=2;effect={targetId:target.id,influence:-2};}else effect={targetId:target.id,prestige:-adversePrestigeLoss(state,target,1,player.id)};break;}
    case 'anathema':{let target=choice?playtestChoicePlayer(state,player,choice):familyLeader(state,player.id);target=maybeRedirect(state,player,target,'anathema');if(!target){player.influence+=baseCost;return{ok:false,reason:'no_target'};}if(maybeCounter(state,target,'anathema')){effect={cancelled:true};break;}const agent=lowestAgent(target);if(agent){removeAgent(target,agent);effect={targetId:target.id,removedAgentId:agent.id};}else effect={targetId:target.id,prestige:-adversePrestigeLoss(state,target,4,player.id)};break;}
    case 'alms_poor':state.city.squalor=Math.max(0,(state.city.squalor??0)-1);player.prestige=(player.prestige??0)+1;effect={squalor:-1,prestige:1};break;
    case 'ecclesiastical_confiscation':{let land=choice?playtestChoiceLand(state,choice,l=>l.revealed&&l.development==='natural'&&l.ownerId&&l.ownerId!==player.id&&l.ownerId!=='city'):chooseLandTarget(state,player);if(!land){player.influence+=baseCost;return{ok:false,reason:'no_land_target'};}let target=playerById(state,land.ownerId);target=maybeRedirect(state,player,target,'ecclesiastical_confiscation');if(target&&target.id!==land.ownerId){const alt=eligibleLand(state,player.id,null,false).find(l=>l.ownerId===target.id);if(alt)land=alt;}if(target&&maybeCounter(state,target,'ecclesiastical_confiscation')){effect={cancelled:true};break;}const former=playerById(state,land.ownerId);land.ownerId='city';land.municipalDonation=true;if(former)former.prestige=(former.prestige??0)+2;effect={landId:land.id,formerOwnerId:former?.id??null,formerPrestige:2};break;}
    case 'legal_contestation':{const patent=choice?playtestChoicePatent(state,player,choice):unownedPatentTarget(state,player.id);if(!patent||player.influence<1){player.influence+=baseCost;return{ok:false,reason:'no_patent_or_opening_bid'};}const auc=simpleAuction(state,player,1,state.players??[],{bonusByPlayer:t.bidBonusByPlayer??{}});if(!auc.winner){player.influence+=baseCost;return{ok:false,reason:'auction_failed'};}effect={auction:auc,transfer:transferPatent(state,patent,auc.winner.player.id)};break;}
    case 'crooked_notary':{const patent=choice?playtestChoicePatent(state,player,choice):unownedPatentTarget(state,player.id);if(!patent){player.influence+=baseCost;return{ok:false,reason:'no_patent'};}const owner=playerById(state,patent.ownerId);if(owner&&maybeCounter(state,owner,'crooked_notary')){effect={cancelled:true};break;}effect={transfer:transferPatent(state,patent,player.id)};break;}
    case 'criminal_network':if((player.prestige??0)<1){player.influence+=baseCost;return{ok:false,reason:'insufficient_prestige'};}player.prestige-=1;normalInfluenceGain(player,2);effect={prestige:-1,influence:2};break;
    case 'hostile_takeover':{const entries=stakeEntries(state,(s,p)=>p.id!==player.id&&(s.age==='mature'||s.age==='elder')).sort((a,b)=>(b.player.prestige??0)-(a.player.prestige??0));if(!entries.length||player.influence<1){player.influence+=baseCost;return{ok:false,reason:'no_stake_target'};}const target=(choice?playtestChoiceStake(state,player,choice):null)??entries[0];if(maybeCounter(state,target.player,'hostile_takeover')){effect={cancelled:true};break;}removeStake(target.player,target.stake.id);const auc=simpleAuction(state,player,1,state.players??[],{bonusByPlayer:t.bidBonusByPlayer??{}});if(auc.winner)addStake(state,auc.winner.player,target.stake.sectorId,target.stake.age);effect={removedStakeId:target.stake.id,sectorId:target.stake.sectorId,age:target.stake.age,auction:auc};break;}
    case 'binding_bids':{const eligible=(state.productionSectors??[]).filter(s=>s.id!=='food'&&s.tier>stakeEntries(state,x=>x.sectorId===s.id&&x.age==='young').length);const sector=(choice?playtestChoiceSector(state,choice,s=>eligible.some(e=>e.id===s.id)):null)??eligible[0];if(!sector||player.influence<1){player.influence+=baseCost;return{ok:false,reason:'no_vacant_young'};}const auc=simpleAuction(state,player,1,state.players??[],{allPay:true,bonusByPlayer:t.bidBonusByPlayer??{}});if(auc.winner)addStake(state,auc.winner.player,sector.id,'young');effect={sectorId:sector.id,auction:auc,allPay:true};break;}
    case 'line_of_credit':{let level=Math.max(1,Math.min(3,Math.floor(Number(choice?.level)||0)));if(!choice){level=1;if((player.prestige??0)>=30&&player.influence<=4)level=3;else if((player.prestige??0)>=20&&player.influence<=6)level=2;}if(level===3&&(player.prestige??0)<30)level=2;if(level===2&&(player.prestige??0)<20)level=1;const amount=level===1?5:level===2?10:15;const extra=level-baseCost;if(extra>0){if(player.influence<extra){player.influence+=baseCost;return{ok:false,reason:'insufficient_variable_cost'};}player.influence-=extra;cost+=extra;}player.influence+=amount;t.creditDebts??=[];t.creditDebts.push({playerId:player.id,amount});effect={level,temporaryInfluence:amount};break;}
    case 'preferential_contracts':{let level=Math.max(1,Math.min(3,Math.floor(Number(choice?.level)||0)));if(!choice){level=1;if(player.influence>=4)level=3;else if(player.influence>=2)level=2;}const total=level===1?1:level===2?3:5,extra=total-baseCost;if(player.influence<extra){player.influence+=baseCost;return{ok:false,reason:'insufficient_variable_cost'};}player.influence-=extra;cost=total;t.preferential??=[];t.preferential.push({playerId:player.id,units:level});effect={priorityUnits:level,simulationApproximation:true};break;}
    case 'private_buyer':{const sectors=(state.productionSectors??[]).filter(s=>s.id!=='food').sort((a,b)=>((player.productionStakes??[]).filter(x=>x.sectorId===b.id).length)-((player.productionStakes??[]).filter(x=>x.sectorId===a.id).length));const sector=(choice?playtestChoiceSector(state,choice,s=>s.id!=='food'):null)??sectors[0];if(!sector){player.influence+=baseCost;return{ok:false,reason:'no_sector'};}t.privateBuyer??=[];t.privateBuyer.push({sectorId:sector.id,amount:1});effect={sectorId:sector.id,externalDemand:1,simulationApproximation:true};break;}
    case 'audit_license_privileges':effect={tax:taxAgents(state,player,'merchant_guild',1)};break;
    default:player.influence+=baseCost;return{ok:false,reason:'unsupported'};
  }
  const played=removeFromHand(state,player.id,card.instanceId);if(!played){player.influence+=cost;return{ok:false,reason:'card_missing'};}
  if(m.permanent){state.intrigue.inPlay.push({...played,ownerId:player.id,playedGeneration:Number(state.generation)||0,...(effect.targetLandId?{targetLandId:effect.targetLandId}:{})});ensureMetrics(state).totals.patentsPlayed+=m.tags?.includes('patent')?1:0;}else discard(state,played);logPlay(state,player,played,cost,effect);return{ok:true,cardId:m.id,cost,effect};
}

function runIntrigueActionPhase(state){ const order=turnOrder(state),actions=[],used=Object.fromEntries(order.map(p=>[p.id,0]));
  const queued=Array.isArray(state.__playtestIntrigueQueue)?state.__playtestIntrigueQueue.splice(0):[];
  for(const spec of queued){const player=playerById(state,spec.playerId);const card=(state.intrigue?.hands?.[spec.playerId]??[]).find(c=>c.instanceId===spec.instanceId);if(!player||!card)continue;const r=resolveCard(state,player,card,spec.choice??null);if(r.ok){used[player.id]=(used[player.id]??0)+1;actions.push({playerId:player.id,sequence:actions.length+1,score:null,humanPlaytest:true,...r});}}
  let rounds=0,progress=true;while(progress&&rounds<MAX_INTRIGUE_ACTIONS_PER_FAMILY){progress=false;rounds++;for(const player of order){if(player.aiPersonality==='human')continue;if(used[player.id]>=MAX_INTRIGUE_ACTIONS_PER_FAMILY)continue;const ranked=(state.intrigue.hands[player.id]??[]).filter(c=>meta(c.cardId)?.timing==='action').map(c=>({c,score:legalCardScore(state,player,c)})).sort((a,b)=>b.score-a.score);const pick=ranked[0];if(!pick||pick.score<AI_PLAY_FLOOR)continue;const r=resolveCard(state,player,pick.c);if(r.ok){used[player.id]++;progress=true;actions.push({playerId:player.id,sequence:actions.length+1,score:pick.score,...r});}}}return actions; }

function applyBeforeLegacy(state){ const t=state.intrigueTemporary;t.reverts=[];if(hasPermanent(state,'advanced_farming_techniques'))for(const land of state.lands??[])if(land.development==='farm'){t.reverts.push({landId:land.id,before:land.baseCapacity});land.baseCapacity=(Number(land.baseCapacity)||0)+1;}for(const b of t.capacityBoosts??[]){const land=(state.lands??[]).find(l=>l.id===b.landId);if(land){t.reverts.push({landId:land.id,before:land.baseCapacity});land.baseCapacity=(Number(land.baseCapacity)||0)+b.amount;}}
  if(state.city.contingencyReserveFood>0&&typeof legacy.getFoodSubsistenceStatus==='function'){const food=legacy.getFoodSubsistenceStatus(state);if((food.localCapacity??0)<state.city.population){const land=(state.lands??[]).find(l=>l.resourceType==='grain'&&l.development!=='urban');if(land){t.reverts.push({landId:land.id,before:land.baseCapacity});land.baseCapacity=(Number(land.baseCapacity)||0)+1;state.city.contingencyReserveFood=0;t.reserveConsumed=true;}}}
  t.orderBefore=state.city.orderModifier??0;state.city.orderModifier=(state.city.orderModifier??0)+(t.orderModifier??0)+(hasPermanent(state,'advanced_judicial_system')?1:0);if(hasPermanent(state,'advanced_architecture')&&legacy.V084_CONFIG?.urban){t.urbanPerTileBefore=legacy.V084_CONFIG.urban.populationPerTile;legacy.V084_CONFIG.urban.populationPerTile=4;}
  for(const b of t.privateBuyer??[]){const sector=(state.productionSectors??[]).find(s=>s.id===b.sectorId);if(sector?.demandThisGeneration?.external_markets!=null)sector.demandThisGeneration.external_markets+=b.amount;}
}
function restoreAfterLegacy(state){const t=state.intrigueTemporary;for(const r of [...(t.reverts??[])].reverse()){const land=(state.lands??[]).find(l=>l.id===r.landId);if(land)land.baseCapacity=r.before;}state.city.orderModifier=t.orderBefore??state.city.orderModifier;if(t.urbanPerTileBefore!=null&&legacy.V084_CONFIG?.urban)legacy.V084_CONFIG.urban.populationPerTile=t.urbanPerTileBefore;}
function applyAfterLegacy(state,summary){const t=state.intrigueTemporary;if(hasPermanent(state,'civic_sanitation_works')){const before=state.city.squalor??0;state.city.squalor=Math.max(0,before-1);summary.intrigueSanitation={before,after:state.city.squalor};}
  const wealthBonus={};for(const p of patents(state))wealthBonus[p.ownerId]=(wealthBonus[p.ownerId]??0)+1;for(const imp of landImprovements(state)){const owner=(state.lands??[]).find(l=>l.id===imp.targetLandId)?.ownerId;if(owner&&owner!=='city')wealthBonus[owner]=(wealthBonus[owner]??0)+1;}for(const[id,bonus]of Object.entries(wealthBonus)){const p=playerById(state,id);if(!p)continue;p.wealthCapacity=(p.wealthCapacity??0)+bonus;p.wealthGeneratedThisGeneration=(p.wealthGeneratedThisGeneration??p.wealthCapacity)+bonus;summary.wealthAfter??={};summary.wealthAfter[id]=(summary.wealthAfter[id]??p.wealthCapacity-bonus)+bonus;}
  if(t.reserveIntentBy&&state.city.contingencyReserveFood<=0&&typeof legacy.getFoodSubsistenceStatus==='function'){const food=legacy.getFoodSubsistenceStatus(state);if((food.localCapacity??0)>state.city.population){state.city.contingencyReserveFood=1;state.city.contingencyReserveExpiresAfter=(Number(state.generation)||0)+1;const p=playerById(state,t.reserveIntentBy);if(p)p.prestige=(p.prestige??0)+1;summary.contingencyReserve={created:true,playerId:t.reserveIntentBy};}else summary.contingencyReserve={created:false,playerId:t.reserveIntentBy};}
  if(state.city.contingencyReserveFood>0&&state.city.contingencyReserveExpiresAfter!=null&&Number(state.generation)>state.city.contingencyReserveExpiresAfter){state.city.contingencyReserveFood=0;summary.contingencyReserveExpired=true;}
  const debts=[];for(const d of t.creditDebts??[]){const p=playerById(state,d.playerId);if(!p)continue;const repaid=Math.min(d.amount,Math.max(0,p.influence));p.influence-=repaid;const unpaid=d.amount-repaid;if(unpaid>0)p.prestige=Math.max(0,(p.prestige??0)-unpaid*2);debts.push({...d,repaid,unpaid,prestigePenalty:unpaid*2});}summary.intrigueCreditRepayment=debts;summary.intriguePreferentialContracts=(t.preferential??[]).map(x=>({...x,simulationApproximation:true}));summary.intrigueReserveConsumed=Boolean(t.reserveConsumed);state.intrigueTemporary={};}

export const V115_PLAYTEST_API=Object.freeze({
  listActionCards(state,playerId){
    ensureConfigured(state);
    return (state.intrigue?.hands?.[playerId]??[]).filter(card=>meta(card.cardId)?.timing==='action').map(card=>({
      ...card,
      meta:meta(card.cardId),
    }));
  },
  listTargets(state,playerId,instanceId){
    ensureConfigured(state);
    const player=playerById(state,playerId);
    const card=(state.intrigue?.hands?.[playerId]??[]).find(row=>row.instanceId===instanceId);
    if(!player||!card)return {requiresTarget:false,options:[]};
    return playtestIntrigueTargets(state,player,card);
  },
  applyIntrigueNow(state,playerId,instanceId,choice=null){
    ensureConfigured(state);
    const player=playerById(state,playerId);
    const card=(state.intrigue?.hands?.[playerId]??[]).find(row=>row.instanceId===instanceId);
    if(!player||!card)return {ok:false,reason:'card_not_found'};
    return resolveCard(state,player,card,choice);
  },
  queueIntrigue(state,playerId,instanceId,choice=null){
    state.__playtestIntrigueQueue??=[];
    state.__playtestIntrigueQueue.push({playerId,instanceId,choice});
  },
});

export function createV084Game(familyNames=['Valenne',"D'Arcy",'Corven']){const state=legacy.createV084Game(familyNames);ensureConfigured(state);return state;}
export function applyAutoDemand(state){ensureConfigured(state);legacy.applyAutoDemand(state);}
export function previewEconomy(state){ensureConfigured(state);return legacy.previewEconomy(state);}
export function setInstitutionAgentCount(state,playerId,institutionId,value){ensureConfigured(state);legacy.setInstitutionAgentCount(state,playerId,institutionId,value);}
export function setCityValue(state,key,value){ensureConfigured(state);legacy.setCityValue(state,key,value);}
export function getInstitutionPreview(state){ensureConfigured(state);return legacy.getInstitutionPreview(state);}
export function getIntrigueSimulationSnapshot(state){ensureConfigured(state);return{...legacy.getIntrigueSnapshot(state),metrics:JSON.parse(JSON.stringify(state.intrigueSim)),reserveFood:state.city.contingencyReserveFood??0};}
export function resolveAutomatedGeneration(state){ensureConfigured(state);const generation=Number(state.generation)||0,acquisition=acquireIntrigueCardsAI(state),intrigueActions=runIntrigueActionPhase(state);applyBeforeLegacy(state);const summary=legacy.resolveAutomatedGeneration(state),legacyIntrigue=summary.intrigue??null;restoreAfterLegacy(state);applyAfterLegacy(state,summary);const cleanup=legacyIntrigue?.cleanup??{generation,expired:[]},generationMetric={generation,acquisition,intrigueActions,cleanup,highInPlay:patents(state).length+landImprovements(state).length,reserveFood:state.city.contingencyReserveFood??0};state.intrigueSim.generations.push(generationMetric);const actionRows=intrigueActions.map(a=>({type:`Intrigue — ${meta(a.cardId)?.name??a.cardId}`,intrigue:true,playerId:a.playerId,cardId:a.cardId,influenceCost:a.cost,effect:a.effect}));summary.actions=[...actionRows,...(summary.actions??[])];summary.intrigue={generation,acquisition,actions:intrigueActions,cleanup,snapshotAfterCleanup:getIntrigueSimulationSnapshot(state)};return summary;}
