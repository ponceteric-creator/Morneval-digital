import * as legacy from './v119-contrarian-ai-engine.js?base=0.11.10';
import { INTRIGUE_CARD_META } from './v115-intrigue-card-catalog.js?v=0.11.5';
import { intrigueAccessTurnValue } from './v119-intrigue-value.js?v=0.11.10';

export * from './v119-contrarian-ai-engine.js?base=0.11.10';
export const V090_CONFIG = legacy.V090_CONFIG;

const VERSION = '0.11.10';
const MAX_SIM_BIDS_PER_FAMILY = 6; // Simulation guardrail only; not a tabletop rule.
const MIN_RESERVE = 2;
const AXES = {
  religionArcane: { negative: 'scholarium', positive: 'temple' },
  militaryMercantile: { negative: 'military', positive: 'merchant' },
};
const POLE_TO_INSTITUTION = {
  military: 'city_guard',
  merchant: 'merchant_guild',
  temple: 'temple',
  scholarium: 'scholarium',
};

// All AI personalities value future Intrigue access through the normalized Agent utility model.
// The hook returns raw prospective option value; personality weights are applied in v110-ai-engine.
if (V090_CONFIG?.agents) {
  V090_CONFIG.agents.contrarianCrowdingWeight = 0.18;
  V090_CONFIG.agents.contrarianNeglectedBonus = 0.35;
  V090_CONFIG.agents.intrigueAccessValue = (state, player, institutionId, seniority) => {
    let value=intrigueAccessTurnValue(state, player, institutionId, seniority, 1.0);
    if(player.aiPersonality==='contrarian'){
      let opposingAgents=0;
      for(const opponent of state.players ?? []) if(opponent.id!==player.id) opposingAgents+=agentCount(opponent,institutionId);
      const ownAgents=agentCount(player,institutionId);
      const crowding=Math.max(0,Number(V090_CONFIG.agents.contrarianCrowdingWeight)||0);
      const neglected=Math.max(0,Number(V090_CONFIG.agents.contrarianNeglectedBonus)||0);
      value=value-opposingAgents*crowding-ownAgents*0.08+Math.max(0,neglected-opposingAgents*0.07);
    }
    return Math.max(0,value);
  };
}

function n(value){ return Number(value) || 0; }
function clamp(value, lo=0, hi=Number.POSITIVE_INFINITY){ return Math.max(lo, Math.min(hi, n(value))); }
function agentCount(player,institutionId){ return (player.institutionAgentRoster ?? []).filter(agent => agent.institutionId === institutionId).length; }
function agentSeniority(player,institutionId){ return (player.institutionAgentRoster ?? []).filter(agent => agent.institutionId === institutionId).reduce((sum,agent)=>sum+clamp(agent.seniority ?? 1,1,3),0); }

function turnOrder(state){
  if(typeof legacy.getTurnOrder === 'function') return legacy.getTurnOrder(state);
  const players=[...(state.players ?? [])];
  const first=players.findIndex(player=>player.id===state.firstPlayerId);
  if(first<=0)return players;
  return [...players.slice(first),...players.slice(0,first)];
}

function cardDomain(cardId){
  const def=INTRIGUE_CARD_META[cardId];
  if(!def)return null;
  if(def.institutionId==='city_guard')return 'military';
  if(def.institutionId==='merchant_guild')return 'merchant';
  if(def.institutionId==='temple')return 'temple';
  if(def.institutionId==='scholarium')return 'scholarium';
  return null;
}

function playedCardCounts(state){
  const generation=n(state.generation);
  const counts={military:0,merchant:0,temple:0,scholarium:0};
  for(const play of state.intrigue?.playHistory ?? []){
    if(n(play.generation)!==generation)continue;
    const domain=cardDomain(play.cardId);
    if(domain)counts[domain]+=1;
  }
  return counts;
}

function ownHandByInstitution(state,player){
  const counts={city_guard:0,merchant_guild:0,temple:0,scholarium:0};
  for(const card of state.intrigue?.hands?.[player.id] ?? []){
    const id=INTRIGUE_CARD_META[card.cardId]?.institutionId;
    if(id in counts)counts[id]+=1;
  }
  return counts;
}

function boardSignals(state,player){
  const ownStakes=(player.productionStakes ?? []).length;
  const opponentNaturalLands=(state.lands ?? []).filter(land=>land.ownerId&&land.ownerId!==player.id&&land.ownerId!=='city'&&land.ownerId!=='public'&&land.revealed&&land.development==='natural').length;
  const opponentStakes=(state.players ?? []).filter(p=>p.id!==player.id).reduce((sum,p)=>sum+(p.productionStakes ?? []).length,0);
  const externalDemand=(state.productionSectors ?? []).reduce((sum,sector)=>sum+Math.max(0,n(sector.demandThisGeneration?.external_markets)),0);
  const upgradeable=(state.productionSectors ?? []).filter(sector=>sector.id!=='food'&&n(sector.tier)<3).length;
  return {ownStakes,opponentNaturalLands,opponentStakes,externalDemand,upgradeable,squalor:Math.max(0,n(state.city?.squalor)),order:clamp(state.city?.order ?? 2,0,4)};
}

function poleUtilities(state,player){
  const hand=ownHandByInstitution(state,player),s=boardSignals(state,player);
  const base={
    military: agentCount(player,'city_guard')*1.05 + agentSeniority(player,'city_guard')*0.20 + hand.city_guard*0.18,
    merchant: agentCount(player,'merchant_guild')*1.05 + agentSeniority(player,'merchant_guild')*0.20 + hand.merchant_guild*0.18 + s.ownStakes*0.16 + s.externalDemand*0.05,
    temple: agentCount(player,'temple')*1.05 + agentSeniority(player,'temple')*0.20 + hand.temple*0.18 + Math.min(1.2,s.squalor*0.18),
    scholarium: agentCount(player,'scholarium')*1.05 + agentSeniority(player,'scholarium')*0.20 + hand.scholarium*0.18 + s.upgradeable*0.11,
  };
  if(player.aiPersonality==='merchant') base.merchant+=1.15;
  if(player.aiPersonality==='dynast'){ base.military+=0.45; base.temple+=0.25; }
  if(player.aiPersonality==='contrarian'){
    const opponentAgents={city_guard:0,merchant_guild:0,temple:0,scholarium:0};
    for(const opponent of state.players ?? [])if(opponent.id!==player.id){
      for(const id of Object.keys(opponentAgents))opponentAgents[id]+=agentCount(opponent,id);
    }
    for(const [pole,id] of Object.entries(POLE_TO_INSTITUTION)) base[pole]+=Math.max(0,0.55-opponentAgents[id]*0.08);
  }
  return base;
}

function axisIntent(state,player,axis){
  const poles=AXES[axis],u=poleUtilities(state,player);
  const neg=u[poles.negative]??0,pos=u[poles.positive]??0,diff=pos-neg;
  if(Math.abs(diff)<0.45)return null;
  const desired=diff>0?poles.positive:poles.negative;
  const strength=Math.abs(diff);
  const influence=Math.max(0,n(player.influence));
  const spendable=Math.max(0,influence-MIN_RESERVE);
  const strategicBudget=Math.max(1,Math.min(MAX_SIM_BIDS_PER_FAMILY,Math.floor(strength*0.85)+1));
  return {axis,desired,opposite:desired===poles.positive?poles.negative:poles.positive,strength,budget:Math.min(spendable,strategicBudget),spent:0,utilities:u};
}

function provisionalDiff(totals,intent){ return n(totals[intent.desired])-n(totals[intent.opposite]); }
function bidUrgency(intent,totals,intentsByPlayer){
  if(!intent||intent.spent>=intent.budget)return -Infinity;
  const diff=provisionalDiff(totals,intent);
  if(diff<=0)return intent.strength*(1.0+Math.min(3,-diff)*0.24);
  const opposition=Object.values(intentsByPlayer).flat().filter(other=>other&&other.axis===intent.axis&&other.desired===intent.opposite&&other.spent<other.budget).length;
  if(diff===1&&opposition>0)return intent.strength*0.62;
  return -Infinity;
}

function runPoliticalInfluenceBids(state){
  const cardCounts=playedCardCounts(state);
  const totals={...cardCounts};
  const order=turnOrder(state);
  const intents={};
  for(const player of order){
    intents[player.id]=[
      axisIntent(state,player,'religionArcane'),
      axisIntent(state,player,'militaryMercantile'),
    ].filter(Boolean);
  }
  const bids=[];
  let round=0,progress=true;
  while(progress&&round<MAX_SIM_BIDS_PER_FAMILY*2){
    progress=false;round+=1;
    for(const player of order){
      if(n(player.influence)<=MIN_RESERVE)continue;
      const choices=(intents[player.id]??[]).map(intent=>({intent,urgency:bidUrgency(intent,totals,intents)})).filter(x=>Number.isFinite(x.urgency)&&x.urgency>0).sort((a,b)=>b.urgency-a.urgency);
      const pick=choices[0];if(!pick)continue;
      player.influence-=1;
      pick.intent.spent+=1;
      totals[pick.intent.desired]=(totals[pick.intent.desired]??0)+1;
      bids.push({playerId:player.id,familyName:player.familyName,axis:pick.intent.axis,pole:pick.intent.desired,influenceSpent:1,allPay:true,round,utilityStrength:pick.intent.strength,provisionalTotals:{...totals}});
      progress=true;
    }
  }
  return {
    version:VERSION,generation:n(state.generation),cardCounts,
    bidTotals:{
      military:Math.max(0,totals.military-cardCounts.military),
      merchant:Math.max(0,totals.merchant-cardCounts.merchant),
      temple:Math.max(0,totals.temple-cardCounts.temple),
      scholarium:Math.max(0,totals.scholarium-cardCounts.scholarium),
    },
    combinedTotals:totals,bids,allPay:true,influencePerBid:1,actionPerBid:1,simulationGuardrail:MAX_SIM_BIDS_PER_FAMILY,
  };
}

function injectBidActions(summary,political){
  if(!political?.bids?.length)return;
  const rows=political.bids.map((bid,index)=>({
    sequence:index+1,
    type:`Political Influence: ${bid.familyName ?? bid.playerId} → ${bid.pole} (-1 Influence)`,
    actionKind:'city_inclination_bid',playerId:bid.playerId,axis:bid.axis,pole:bid.pole,influenceCost:1,allPay:true,politicalBid:true,
  }));
  summary.actions=[...rows,...(summary.actions ?? [])];
  summary.actions.forEach((action,index)=>{ action.sequence=index+1; });
}

export function prepareV111State(state,options={}){ return legacy.prepareV111State(state,options); }
export function createV084Game(familyNames=['Valenne',"D'Arcy",'Corven']){ return legacy.createV084Game(familyNames); }
export function resolveAutomatedGeneration(state){
  legacy.prepareV111State(state);
  const political=runPoliticalInfluenceBids(state);
  const summary=legacy.resolveAutomatedGeneration(state);
  injectBidActions(summary,political);
  summary.cityInclinationBids=political;
  state.cityInclinationBidsHistory??=[];
  state.cityInclinationBidsHistory.push(JSON.parse(JSON.stringify(political)));
  return summary;
}
