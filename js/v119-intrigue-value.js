import { ACTIVE_INTRIGUE_CARDS, INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';

export const INTRIGUE_VALUE_VERSION = '0.11.9';
export const INSTITUTION_IDS = ['city_guard','temple','merchant_guild','scholarium'];
export const BASE_POWER_VALUE = Object.freeze({ LOW:1.0, MID:2.2, HIGH:4.0 });

function n(value){ return Number(value) || 0; }
function clamp(value, lo=0, hi=Number.POSITIVE_INFINITY){ return Math.max(lo, Math.min(hi, n(value))); }
function agentCount(player,id=null){
  return (player?.institutionAgentRoster ?? []).filter(agent => !id || agent.institutionId === id).length;
}
function choose(nValue,kValue){
  const nn=Math.max(0,Math.trunc(nValue)), kk=Math.max(0,Math.trunc(kValue));
  if(kk>nn)return 0;
  const k=Math.min(kk,nn-kk);
  let result=1;
  for(let i=1;i<=k;i++) result=result*(nn-k+i)/i;
  return result;
}
function permanentInPlay(state,cardId){ return (state.intrigue?.inPlay ?? []).some(card=>card.cardId===cardId); }

export function publicIntrigueSignals(state,player){
  const opponents=(state.players ?? []).filter(p=>p.id!==player.id);
  const opponentIds=new Set(opponents.map(p=>p.id));
  const oppNatural=(state.lands ?? []).filter(land=>land.revealed&&land.development==='natural'&&opponentIds.has(land.ownerId));
  const landBy=Object.fromEntries(opponents.map(p=>[p.id,0]));
  for(const land of oppNatural) landBy[land.ownerId]=(landBy[land.ownerId]??0)+1;

  const oppStakes=opponents.flatMap(p=>(p.productionStakes??[]).map(stake=>({ownerId:p.id,stake})));
  const matureElder=oppStakes.filter(({stake})=>stake.age==='mature'||stake.age==='elder');
  const stakesBySector={};
  for(const {stake} of oppStakes) stakesBySector[stake.sectorId]=(stakesBySector[stake.sectorId]??0)+1;

  const oppAgents=Object.fromEntries(INSTITUTION_IDS.map(id=>[id,0]));
  for(const p of opponents) for(const id of INSTITUTION_IDS) oppAgents[id]+=agentCount(p,id);

  const oppPatents=(state.intrigue?.inPlay??[]).filter(card=>
    INTRIGUE_CARD_META[card.cardId]?.tags?.includes('patent') && card.ownerId!==player.id).length;
  const ownNatural=(state.lands??[]).filter(land=>land.revealed&&land.development==='natural'&&land.ownerId===player.id);
  const ownTerrain={hill:0,meadow:0,forest:0};
  for(const land of ownNatural){
    const terrain=land.originalTerrain??land.terrain;
    if(terrain in ownTerrain) ownTerrain[terrain]+=1;
  }

  const upgradeable=(state.productionSectors??[]).filter(sector=>sector.id!=='food'&&n(sector.tier)<3).length;
  const vacantYoung=(state.productionSectors??[]).filter(sector=>sector.id!=='food').reduce((sum,sector)=>{
    const used=(state.players??[]).flatMap(p=>p.productionStakes??[]).filter(stake=>stake.sectorId===sector.id&&stake.age==='young').length;
    return sum+Math.max(0,n(sector.tier)-used);
  },0);
  const externalDemand=(state.productionSectors??[]).reduce((sum,sector)=>sum+Math.max(0,n(sector.demandThisGeneration?.external_markets)),0);
  const localFood=(state.lands??[]).filter(land=>land.revealed&&land.development==='farm').reduce((sum,land)=>sum+Math.max(0,n(land.baseCapacity)),0);
  const population=Math.max(1,n(state.city?.population));
  const urbanCapacity=typeof state.city?.urbanCapacity==='number' ? n(state.city.urbanCapacity) : n(state.city?.population)+1;

  return {
    opponentNaturalLands:oppNatural.length,
    maxOpponentNaturalLands:Math.max(0,...Object.values(landBy)),
    opponentMatureElderStakes:matureElder.length,
    maxOpponentSectorConcentration:Math.max(0,...Object.values(stakesBySector)),
    opponentAgentsByInstitution:oppAgents,
    opponentAgentsTotal:Object.values(oppAgents).reduce((a,b)=>a+b,0),
    opponentPatents:oppPatents,
    ownNaturalLands:ownNatural.length,
    ownTerrain,
    ownStakes:(player.productionStakes??[]).length,
    upgradeableSectors:upgradeable,
    vacantYoungSlots:vacantYoung,
    externalDemand,
    foodStress:clamp((population-localFood)/population,0,1.5),
    urbanPressure:clamp((population-Math.max(0,urbanCapacity-1))/population,0,1),
    squalor:Math.max(0,n(state.city?.squalor)),
    order:clamp(state.city?.order??2,0,4),
    influence:Math.max(0,n(player.influence)),
    prestige:Math.max(0,n(player.prestige)),
    generation:Math.max(0,n(state.generation)),
  };
}

// Prospective, public-information value. This deliberately contains no card-id-specific cases.
// It estimates future option value for Agent placement, not the legality/value of playing a card right now.
export function prospectiveCardValue(state,player,cardOrId,signals=null){
  const card=typeof cardOrId==='string' ? INTRIGUE_CARD_META[cardOrId] : cardOrId;
  if(!card)return 0;
  if(card.permanent&&permanentInPlay(state,card.id))return 0;
  const s=signals??publicIntrigueSignals(state,player);
  const tags=new Set(card.tags??[]);
  let value=BASE_POWER_VALUE[card.power]??1;

  // Reactions are useful but conditional. Permanents are long-lived, especially early.
  if(card.timing==='reaction') value*=0.72;
  if(card.permanent) value+=Math.max(0.65,2.15-s.generation*0.10);

  // Generic board affordances. Concentration matters, but no named card receives an extra multiplier.
  if(tags.has('land')&&card.nature==='Attack') value+=s.opponentNaturalLands*0.10+s.maxOpponentNaturalLands*0.18;
  if(tags.has('stake')){
    if(card.nature==='Attack') value+=s.opponentMatureElderStakes*0.11+s.maxOpponentSectorConcentration*0.18;
    else value+=s.ownStakes*0.07+Math.min(0.55,s.vacantYoungSlots*0.05);
  }
  if(tags.has('agents')&&card.nature==='Attack') value+=(s.opponentAgentsByInstitution[card.institutionId]??0)*0.13;
  if(tags.has('agent')&&card.nature==='Attack') value+=s.opponentAgentsTotal*0.07;
  if(tags.has('tax')&&card.nature==='Attack') value+=(s.opponentAgentsByInstitution[card.institutionId]??0)*0.08;
  if(tags.has('patent')&&card.nature==='Attack') value+=s.opponentPatents*0.20;
  if(tags.has('development')) value+=s.upgradeableSectors*0.12;
  if(tags.has('squalor')) value+=Math.min(1.25,s.squalor*0.23);
  if(tags.has('order')) value+=Math.max(0,3-s.order)*0.28;
  if(tags.has('food')||tags.has('reserve')) value+=s.foodStress*0.38;
  if(tags.has('external_demand')) value+=Math.min(0.9,s.externalDemand*0.06)+s.ownStakes*0.08;
  if(tags.has('auction')||tags.has('bid_only')) value+=Math.min(0.8,s.vacantYoungSlots*0.08);
  if(tags.has('influence_gain')||tags.has('temporary_influence')) value+=Math.max(0,8-s.influence)*0.07;
  if(tags.has('hand')) value+=0.28;
  if(tags.has('urban_capacity')) value+=0.25+s.urbanPressure*0.55;
  if(tags.has('raw_capacity')) value+=0.25+Math.min(0.55,s.ownNaturalLands*0.08);
  if(tags.has('wealth')&&!card.permanent) value+=0.20;
  if(tags.has('cancel')||tags.has('redirect')) value+=0.12;

  // Terrain-targeted effects are evaluated generically from targetTerrain metadata.
  if(card.targetTerrain){
    value+=(s.ownTerrain?.[card.targetTerrain]??0)>0 ? 0.75 : 0.08;
  }

  // Costs matter prospectively but current inability to pay does not make future access worthless.
  value-=Math.max(0,n(card.influenceCost))*0.11;
  if(tags.has('prestige_cost')&&s.prestige<3) value-=0.18;
  return Math.max(0,value);
}

function availableCardRows(state,player,institutionId){
  const s=publicIntrigueSignals(state,player);
  return ACTIVE_INTRIGUE_CARDS
    .filter(card=>card.institutionId===institutionId && !(card.permanent&&permanentInPlay(state,card.id)))
    .map(card=>({card,copies:Math.max(1,Math.trunc(n(card.copies)||1)),value:prospectiveCardValue(state,player,card,s)}));
}

export function expectedBestCardValue(state,player,institutionId,drawCount=1){
  const rows=availableCardRows(state,player,institutionId);
  const total=rows.reduce((sum,row)=>sum+row.copies,0);
  if(total<=0)return 0;
  const k=Math.max(1,Math.min(3,Math.trunc(n(drawCount)||1),total));
  const denominator=choose(total,k);
  if(!denominator)return 0;
  const groups=new Map();
  for(const row of rows){
    const key=row.value.toFixed(9);
    const entry=groups.get(key)??{value:row.value,copies:0};
    entry.copies+=row.copies;groups.set(key,entry);
  }
  const ordered=[...groups.values()].sort((a,b)=>a.value-b.value);
  let cumulative=0,expected=0;
  for(const group of ordered){
    const below=cumulative;
    cumulative+=group.copies;
    const maxWays=choose(cumulative,k)-choose(below,k);
    expected+=group.value*(maxWays/denominator);
  }
  return expected;
}

export function intrigueAccessProfile(state,player,institutionId){
  return {
    draw1:expectedBestCardValue(state,player,institutionId,1),
    draw2:expectedBestCardValue(state,player,institutionId,2),
    draw3:expectedBestCardValue(state,player,institutionId,3),
  };
}

export function intrigueAccessTurnValue(state,player,institutionId,seniority,weight=0.78){
  return expectedBestCardValue(state,player,institutionId,Math.max(1,Math.min(3,Math.trunc(n(seniority)||1))))*weight;
}

export function institutionDeckOpportunity(state,player,institutionId){
  const profile=intrigueAccessProfile(state,player,institutionId);
  // A new Agent should be evaluated across its natural ageing curve, not only on today's draw-1.
  return profile.draw1*0.24+profile.draw2*0.33+profile.draw3*0.43;
}
