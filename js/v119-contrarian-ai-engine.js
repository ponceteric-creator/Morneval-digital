import * as legacy from './v111-ai-engine.js?original=0.11.1-v119';
import { ACTIVE_INTRIGUE_CARDS } from './v115-intrigue-card-catalog.js?v=0.11.5';
import { publicIntrigueSignals, prospectiveCardValue, intrigueAccessProfile, institutionDeckOpportunity } from './v119-intrigue-value.js?v=0.11.9';

export * from './v111-ai-engine.js?original=0.11.1-v119';
export const V090_CONFIG = legacy.V090_CONFIG;

const VERSION='0.11.9';
const INST=['city_guard','temple','merchant_guild','scholarium'];
const LABEL={city_guard:'City Guard',temple:'Temple',merchant_guild:'Merchant Guild',scholarium:'Scholarium College'};
const n=value=>Number(value)||0;
const agentCount=(player,id=null)=>(player?.institutionAgentRoster??[]).filter(agent=>!id||agent.institutionId===id).length;

// No resource/scoring bonus. The Contrarian differs only in how the shared AI values future options.
V090_CONFIG.personalities.contrarian={
  label:'Contrarian',prestige:1.20,wealth:1.20,engine:1.40,civic:0.70,horizon:4,discount:0.92,
};

function ensureContrarian(state){
  if(!state?.players?.length)return null;
  let player=state.players.find(p=>p.aiPersonality==='contrarian')??null;
  if(player)return player;
  player=state.players.find(p=>p.aiPersonality==='opportunist')??state.players.at(-1)??null;
  if(player)player.aiPersonality='contrarian';
  return player;
}

function institutionValue(state,player,id){
  const signals=publicIntrigueSignals(state,player);
  const rows=ACTIVE_INTRIGUE_CARDS.filter(card=>card.institutionId===id).map(card=>({
    cardId:card.id,name:card.name,copies:Math.max(1,n(card.copies)),score:prospectiveCardValue(state,player,card,signals),
  })).sort((a,b)=>b.score-a.score||b.copies-a.copies);
  const copies=rows.reduce((sum,row)=>sum+row.copies,0)||1;
  const expected=rows.reduce((sum,row)=>sum+row.score*row.copies,0)/copies;
  const selection=intrigueAccessProfile(state,player,id);
  const opportunity=institutionDeckOpportunity(state,player,id);
  const opponentAgents=signals.opponentAgentsByInstitution[id]??0;
  const ownAgents=agentCount(player,id);
  const neglectedBonus=Math.max(0,.62-opponentAgents*.10);
  const congestionPenalty=ownAgents*.22;
  return {
    institutionId:id,label:LABEL[id],score:Math.max(0,opportunity+neglectedBonus-congestionPenalty),
    expected,selection,opportunity,topCards:rows.slice(0,3),opponentAgents,ownAgents,neglectedBonus,congestionPenalty,
  };
}

function plan(state,player){
  const opportunities=INST.map(id=>institutionValue(state,player,id)).sort((a,b)=>b.score-a.score);
  return {
    generation:n(state.generation),playerId:player.id,familyName:player.familyName,opportunities,
    bestInstitutionId:opportunities[0]?.institutionId??null,bestScore:opportunities[0]?.score??0,
    signals:publicIntrigueSignals(state,player),hiddenOpponentHandsIgnored:true,namedCardBiases:false,directAgentValuation:true,
  };
}

export function prepareV111State(state,options={}){legacy.prepareV111State(state,options);ensureContrarian(state);return state;}
export function createV084Game(familyNames=['Valenne',"D'Arcy",'Corven']){const state=legacy.createV084Game(familyNames);ensureContrarian(state);return state;}

export function resolveAutomatedGeneration(state){
  legacy.prepareV111State(state);
  const player=ensureContrarian(state);
  if(!player)return legacy.resolveAutomatedGeneration(state);
  const planBefore=plan(state,player);
  const summary=legacy.resolveAutomatedGeneration(state);
  const planAfter=plan(state,player);
  const record={
    version:VERSION,generation:summary.generation,playerId:player.id,planBefore,planAfter,
    strategicReallocation:null,retargetedAgents:[],institutionPrestigeCorrection:0,
    hiddenOpponentHandsIgnored:true,namedCardBiases:false,directAgentValuation:true,
  };
  state.contrarianAi??={version:VERSION,history:[]};
  state.contrarianAi.version=VERSION;state.contrarianAi.history.push(record);
  summary.contrarianAi=record;
  summary.aiProfiles??={};
  summary.aiProfiles[player.id]={...(summary.aiProfiles[player.id]??{}),personality:'contrarian',label:'Contrarian',intrigueAware:true,counterpointPlanning:true,directAgentValuation:true};
  return summary;
}
