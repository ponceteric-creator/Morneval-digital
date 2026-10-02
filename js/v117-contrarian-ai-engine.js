import * as legacy from './v111-ai-engine.js?original=0.11.1-v117';
import { ACTIVE_INTRIGUE_CARDS, INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';

export * from './v111-ai-engine.js?original=0.11.1-v117';
export const V090_CONFIG = legacy.V090_CONFIG;

const VERSION = '0.11.7';
const INST = ['city_guard', 'temple', 'merchant_guild', 'scholarium'];
const LABEL = { city_guard:'City Guard', temple:'Temple', merchant_guild:'Merchant Guild', scholarium:'Scholarium College' };
const POWER = { LOW:0.85, MID:1.55, HIGH:2.45 };
const RETARGET_MARGIN = 0.28;
const RETARGET_MIN = 1.15;

// No resource/scoring bonus: this profile only gives the existing AI a longer planning horizon.
V090_CONFIG.personalities.contrarian = {
  label:'Contrarian', prestige:1.20, wealth:1.20, engine:1.40, civic:0.70, horizon:4, discount:0.92,
};

const n = v => Number(v) || 0;
const clamp = (v, lo=0, hi=Infinity) => Math.max(lo, Math.min(hi, n(v)));
const agentCount = (p,id=null) => (p?.institutionAgentRoster ?? []).filter(a => !id || a.institutionId === id).length;

function syncAgents(player){
  player.institutionAgents ??= {};
  for(const id of INST) player.institutionAgents[id]=agentCount(player,id);
}

function ensureContrarian(state){
  if(!state?.players?.length) return null;
  let p=state.players.find(x=>x.aiPersonality==='contrarian') ?? null;
  if(p) return p;
  p=state.players.find(x=>x.aiPersonality==='opportunist') ?? state.players.at(-1) ?? null;
  if(p) p.aiPersonality='contrarian';
  return p;
}

function inPlay(state,cardId){ return (state.intrigue?.inPlay ?? []).some(c=>c.cardId===cardId); }

function signals(state,player){
  const opponents=(state.players ?? []).filter(p=>p.id!==player.id);
  const opponentIds=new Set(opponents.map(p=>p.id));
  const oppNatural=(state.lands ?? []).filter(l=>l.revealed&&l.development==='natural'&&opponentIds.has(l.ownerId));
  const landBy=Object.fromEntries(opponents.map(p=>[p.id,0]));
  for(const l of oppNatural) landBy[l.ownerId]=(landBy[l.ownerId]??0)+1;

  const oppStakes=opponents.flatMap(p=>(p.productionStakes??[]).map(stake=>({p,stake})));
  const matureElder=oppStakes.filter(x=>x.stake.age==='mature'||x.stake.age==='elder');
  const sectorConc={};
  for(const {stake} of oppStakes) sectorConc[stake.sectorId]=(sectorConc[stake.sectorId]??0)+1;

  const oppAgents=Object.fromEntries(INST.map(id=>[id,0]));
  for(const p of opponents) for(const id of INST) oppAgents[id]+=agentCount(p,id);

  const oppPatents=(state.intrigue?.inPlay??[]).filter(c=>
    INTRIGUE_CARD_META[c.cardId]?.tags?.includes('patent') && c.ownerId!==player.id).length;
  const ownNatural=(state.lands??[]).filter(l=>l.revealed&&l.development==='natural'&&l.ownerId===player.id);
  const terrain={hill:0,meadow:0,forest:0};
  for(const l of ownNatural){const t=l.originalTerrain??l.terrain;if(t in terrain)terrain[t]++;}

  const upgradeable=(state.productionSectors??[]).filter(s=>s.id!=='food'&&s.tier<3).length;
  const vacantYoung=(state.productionSectors??[]).filter(s=>s.id!=='food').reduce((sum,s)=>{
    const used=(state.players??[]).flatMap(p=>p.productionStakes??[]).filter(x=>x.sectorId===s.id&&x.age==='young').length;
    return sum+Math.max(0,n(s.tier)-used);
  },0);
  const external=(state.productionSectors??[]).reduce((sum,s)=>sum+Math.max(0,n(s.demandThisGeneration?.external_markets)),0);
  const food=(state.lands??[]).filter(l=>l.revealed&&l.development==='farm').reduce((sum,l)=>sum+Math.max(0,n(l.baseCapacity)),0);
  const pop=Math.max(1,n(state.city?.population));

  return {
    opponentNaturalLands:oppNatural.length,
    maxOpponentNaturalLands:Math.max(0,...Object.values(landBy)),
    opponentMatureElderStakes:matureElder.length,
    maxOpponentSectorConcentration:Math.max(0,...Object.values(sectorConc)),
    opponentAgentsByInstitution:oppAgents,
    opponentAgentsTotal:Object.values(oppAgents).reduce((a,b)=>a+b,0),
    opponentPatents:oppPatents,
    ownNaturalLands:ownNatural.length,
    ownTerrain:terrain,
    ownStakes:(player.productionStakes??[]).length,
    upgradeableSectors:upgradeable,
    vacantYoungSlots:vacantYoung,
    externalDemand:external,
    foodStress:clamp((pop-food)/pop,0,1.5),
    squalor:Math.max(0,n(state.city?.squalor)),
    order:clamp(state.city?.order??2,0,4),
    influence:Math.max(0,n(player.influence)),
    prestige:Math.max(0,n(player.prestige)),
    generation:Math.max(0,n(state.generation)),
  };
}

function cardValue(state,card,s){
  if(card.permanent&&inPlay(state,card.id)) return 0;
  let v=POWER[card.power]??1;
  const tags=new Set(card.tags??[]);
  const oppAgents=s.opponentAgentsByInstitution[card.institutionId]??0;

  if(tags.has('land'))v+=s.opponentNaturalLands*.18+s.maxOpponentNaturalLands*.35;
  if(tags.has('stake'))v+=s.opponentMatureElderStakes*.20+s.maxOpponentSectorConcentration*.30;
  if(tags.has('agents')||tags.has('agent'))v+=oppAgents*.24;
  if(tags.has('tax'))v+=oppAgents*.18;
  if(tags.has('patent'))v+=s.opponentPatents*.33;
  if(tags.has('development'))v+=s.upgradeableSectors*.24;
  if(tags.has('squalor'))v+=Math.min(2,s.squalor*.35);
  if(tags.has('order'))v+=Math.max(0,3-s.order)*.42;
  if(tags.has('food')||tags.has('reserve'))v+=s.foodStress*.55;
  if(tags.has('external_demand'))v+=Math.min(1.5,s.externalDemand*.10)+s.ownStakes*.10;
  if(tags.has('auction'))v+=Math.min(1,s.vacantYoungSlots*.12);
  if(tags.has('influence_gain')||tags.has('temporary_influence'))v+=Math.max(0,8-s.influence)*.10;

  switch(card.id){
    case 'land_seizure': v+=s.opponentNaturalLands*.30+s.maxOpponentNaturalLands*.62; break;
    case 'ecclesiastical_confiscation': v+=s.opponentNaturalLands*.14+s.maxOpponentNaturalLands*.24; break;
    case 'hostile_takeover': v+=s.opponentMatureElderStakes*.30+s.maxOpponentSectorConcentration*.55; break;
    case 'officer_purge': case 'hunt_heretics': case 'expose_charlatans': case 'audit_license_privileges': v+=oppAgents*.35; break;
    case 'crooked_notary': case 'legal_contestation': v+=s.opponentPatents*.65; break;
    case 'technological_acceleration': v+=s.upgradeableSectors*.38; break;
    case 'alms_poor': v+=Math.min(2.2,s.squalor*.50); break;
    case 'martial_law': v+=Math.max(0,3-s.order)*.58; break;
    case 'gemstone_vein': v+=s.ownTerrain.hill?1.35:-1.30; break;
    case 'rare_breed': v+=s.ownTerrain.meadow?1.35:-1.30; break;
    case 'precious_timber': v+=s.ownTerrain.forest?1.35:-1.30; break;
    case 'binding_bids': v+=Math.min(1.4,s.vacantYoungSlots*.20); break;
    case 'preferential_contracts': case 'private_buyer': v+=s.ownStakes*.22; break;
    case 'assassination': v+=Math.min(1.8,s.opponentAgentsTotal*.12); break;
    case 'spy_network': v+=.45; break; // generic option value; hidden opponent hands are never inspected.
  }
  const cost=Math.max(0,n(card.influenceCost));
  v-=cost>s.influence?(cost-s.influence)*.24:cost*.05;
  return Math.max(0,v);
}

function institutionValue(state,player,id){
  const s=signals(state,player);
  const rows=ACTIVE_INTRIGUE_CARDS.filter(c=>c.institutionId===id).map(c=>({
    cardId:c.id,name:c.name,copies:Math.max(1,n(c.copies)),score:cardValue(state,c,s),
  }));
  const copies=rows.reduce((sum,r)=>sum+r.copies,0)||1;
  const expected=rows.reduce((sum,r)=>sum+r.score*r.copies,0)/copies;
  rows.sort((a,b)=>b.score-a.score||b.copies-a.copies);
  const opp=s.opponentAgentsByInstitution[id]??0, own=agentCount(player,id);
  const neglected=Math.max(0,.75-opp*.14), congestion=own*.27;
  const score=expected*.64+(rows[0]?.score??0)*.25+(rows[1]?.score??0)*.11+neglected-congestion;
  return {institutionId:id,label:LABEL[id],score:Math.max(0,score),expected,topCards:rows.slice(0,3),opponentAgents:opp,ownAgents:own,neglectedBonus:neglected,congestionPenalty:congestion};
}

function plan(state,player){
  const opportunities=INST.map(id=>institutionValue(state,player,id)).sort((a,b)=>b.score-a.score);
  return {generation:n(state.generation),playerId:player.id,familyName:player.familyName,opportunities,bestInstitutionId:opportunities[0]?.institutionId??null,bestScore:opportunities[0]?.score??0,signals:signals(state,player),hiddenOpponentHandsIgnored:true};
}

function strategicReallocation(state,player){
  const agents=[...(player.institutionAgentRoster??[])];
  if(!agents.length)return null;
  const best=INST.map(id=>institutionValue(state,player,id)).sort((a,b)=>b.score-a.score)[0];
  if(!best||best.score<RETARGET_MIN)return null;
  const choices=agents.map(agent=>{
    const current=institutionValue(state,player,agent.institutionId);
    const seniority=Math.max(1,n(agent.seniority));
    const seniorityLoss=(seniority-1)*.55;
    return {agent,current,seniority,gain:best.score-current.score-seniorityLoss};
  }).filter(x=>x.agent.institutionId!==best.institutionId).sort((a,b)=>b.gain-a.gain);
  const pick=choices[0];
  if(!pick||pick.gain<RETARGET_MARGIN+.20)return null;
  const old={...pick.agent};
  const order=Math.max(1,n(state.nextInstitutionAgentOrder)||1);
  state.nextInstitutionAgentOrder=order+1;
  pick.agent.id=`agent_${order}`;
  pick.agent.institutionId=best.institutionId;
  pick.agent.seniority=1;
  pick.agent.placementOrder=order;
  pick.agent.placedGeneration=state.generation;
  syncAgents(player);
  return {oldAgentId:old.id,newAgentId:pick.agent.id,fromInstitutionId:old.institutionId,toInstitutionId:best.institutionId,seniorityLost:Math.max(0,n(old.seniority)-1),fromScore:pick.current.score,toScore:best.score,netStrategicGain:pick.gain,topCards:best.topCards.slice(0,2)};
}

function instrumentActionPhaseReallocation(state,player){
  let stored=n(player.wealthCommittedThisGeneration),triggered=false,reallocation=null;
  const descriptor=Object.getOwnPropertyDescriptor(player,'wealthCommittedThisGeneration');
  if(descriptor&&!descriptor.configurable)return {restore(){},get reallocation(){return null;}};
  Object.defineProperty(player,'wealthCommittedThisGeneration',{configurable:true,enumerable:true,get(){return stored;},set(value){stored=Math.max(0,n(value));if(!triggered&&state.phase==='player_actions'&&stored===0){triggered=true;reallocation=strategicReallocation(state,player);}}});
  return {
    get reallocation(){return reallocation;},
    restore(){delete player.wealthCommittedThisGeneration;if(descriptor)Object.defineProperty(player,'wealthCommittedThisGeneration',descriptor);player.wealthCommittedThisGeneration=stored;},
  };
}

function injectReallocationLog(summary,player,r){
  if(!r)return;
  const action={type:`Agent reallocation: ${player.familyName} · ${LABEL[r.fromInstitutionId]} → ${LABEL[r.toInstitutionId]} (seniority reset to 1) · Contrarian plan`,actionKind:'agent_reallocation',playerId:player.id,agentId:r.newAgentId,formerAgentId:r.oldAgentId,fromInstitutionId:r.fromInstitutionId,institutionId:r.toInstitutionId,seniorityLost:r.seniorityLost,contrarianPlanScore:r.toScore,contrarianTopCards:r.topCards};
  summary.actions??=[];
  let i=0;while(i<summary.actions.length&&summary.actions[i]?.actionKind==='agent_recall'&&summary.actions[i]?.forced)i++;
  summary.actions.splice(i,0,action);summary.actions.forEach((a,index)=>{a.sequence=index+1;});
}

function retarget(state,player,newAgents){
  const moves=[];
  for(const agent of newAgents){
    const current=institutionValue(state,player,agent.institutionId);
    const best=INST.map(id=>institutionValue(state,player,id)).sort((a,b)=>b.score-a.score)[0];
    if(!best||best.institutionId===agent.institutionId||best.score<RETARGET_MIN||best.score<current.score+RETARGET_MARGIN)continue;
    // Do not invalidate a Mercenary Contract that the baseline action phase just won using its only City Guard Agent.
    if(agent.institutionId==='city_guard'&&state.mercenaryContract?.ownerId===player.id&&agentCount(player,'city_guard')<=1)continue;
    const from=agent.institutionId;
    agent.institutionId=best.institutionId;syncAgents(player);
    moves.push({agentId:agent.id,fromInstitutionId:from,toInstitutionId:best.institutionId,fromScore:current.score,toScore:best.score,topCards:best.topCards.slice(0,2)});
  }
  return moves;
}

function patchActions(summary,player,moves){
  for(const m of moves){
    const a=(summary.actions??[]).find(x=>x.agentId===m.agentId&&x.playerId===player.id);if(!a)continue;
    a.institutionId=m.toInstitutionId;a.aiPersonality='contrarian';a.aiUtilityBeforeContrarian=a.aiUtility;
    a.contrarianRetargeted=true;a.contrarianFromInstitutionId=m.fromInstitutionId;a.contrarianPlanScore=m.toScore;a.contrarianTopCards=m.topCards;
    a.type=`Agent placement: ${player.familyName} → ${LABEL[m.toInstitutionId]} (seniority 1, 1W reserved) · Contrarian plan`;
  }
}

function correctPrestige(state,summary,player,moves){
  if(!moves.length)return 0;
  const scores=summary.institutionScores??{};
  const delta=moves.reduce((sum,m)=>sum+n(scores[m.toInstitutionId]?.score)-n(scores[m.fromInstitutionId]?.score),0);
  if(!delta)return 0;
  const row=(summary.prestigeScoring??[]).find(x=>x.playerId===player.id);
  if(row){
    for(const m of moves){
      const from=`institution_${m.fromInstitutionId}`,to=`institution_${m.toInstitutionId}`;
      const fv=n(scores[m.fromInstitutionId]?.score),tv=n(scores[m.toInstitutionId]?.score);
      const fe=row.entries?.find(x=>x.reason===from),te=row.entries?.find(x=>x.reason===to);
      if(fe)fe.amount-=fv;else row.entries?.push({amount:-fv,reason:from});
      if(te)te.amount+=tv;else row.entries?.push({amount:tv,reason:to});
    }
    row.delta=n(row.delta)+delta;row.after=Math.max(0,n(row.after)+delta);
  }
  const chaos=summary.chaos?.triggered?summary.chaos.prestigeLosses?.find(x=>x.playerId===player.id):null;
  if(chaos){
    const before=Math.max(0,n(chaos.before)+delta),loss=before>0?Math.ceil(before*.20):0,after=Math.max(0,before-loss);
    Object.assign(chaos,{before,requestedLoss:loss,actualLoss:before-after,after});player.prestige=after;
  }else player.prestige=Math.max(0,n(player.prestige)+delta);
  summary.prestigeAfter??={};summary.prestigeAfter[player.id]=player.prestige;
  summary.institutionPrestigeAwards=(summary.institutionPrestigeAwards??[]).filter(x=>x.playerId!==player.id);
  for(const id of INST){const amount=agentCount(player,id)*n(scores[id]?.score);if(amount)summary.institutionPrestigeAwards.push({playerId:player.id,institutionId:id,amount});}
  return delta;
}

export function prepareV111State(state,options={}){legacy.prepareV111State(state,options);ensureContrarian(state);return state;}
export function createV084Game(familyNames=['Valenne',"D'Arcy",'Corven']){const state=legacy.createV084Game(familyNames);ensureContrarian(state);return state;}

export function resolveAutomatedGeneration(state){
  legacy.prepareV111State(state);
  const player=ensureContrarian(state);if(!player)return legacy.resolveAutomatedGeneration(state);
  const beforePlan=plan(state,player),beforeIds=new Set((player.institutionAgentRoster??[]).map(a=>a.id));
  const phaseHook=instrumentActionPhaseReallocation(state,player);
  let summary;try{summary=legacy.resolveAutomatedGeneration(state);}finally{phaseHook.restore();}
  const reallocation=phaseHook.reallocation;injectReallocationLog(summary,player,reallocation);
  const newAgents=(player.institutionAgentRoster??[]).filter(a=>!beforeIds.has(a.id)&&a.id!==reallocation?.newAgentId);
  const moves=retarget(state,player,newAgents);patchActions(summary,player,moves);
  const prestigeDelta=correctPrestige(state,summary,player,moves),afterPlan=plan(state,player);
  const record={version:VERSION,generation:summary.generation,playerId:player.id,planBefore:beforePlan,strategicReallocation:reallocation,retargetedAgents:moves,institutionPrestigeCorrection:prestigeDelta,planAfter:afterPlan,hiddenOpponentHandsIgnored:true};
  state.contrarianAi??={version:VERSION,history:[]};state.contrarianAi.version=VERSION;state.contrarianAi.history.push(record);
  summary.contrarianAi=record;summary.aiProfiles??={};summary.aiProfiles[player.id]={...(summary.aiProfiles[player.id]??{}),personality:'contrarian',label:'Contrarian',intrigueAware:true,counterpointPlanning:true};
  return summary;
}
