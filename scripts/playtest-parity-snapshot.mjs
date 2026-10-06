
import {
  createHumanPlaytest, beginInteractiveGeneration, advanceUntilHuman,
  listHumanActions, playHumanAction, finishInteractiveGeneration,
  queuePoliticalBid, queueInstitutionDevelopment,
} from '../js/v138-human-playtest-engine.js';

const GAMES = Math.max(1, Number(process.env.PARITY_GAMES) || 6);
const GENERATIONS = Math.max(1, Number(process.env.PARITY_GENERATIONS) || 5);

function n(v){ return Number(v)||0; }
function cleanAction(action){
  return {
    k:String(action?.actionKind??action?.type??''),
    p:action?.playerId??null,
    s:action?.sectorId??null,
    i:action?.institutionId??null,
    l:action?.landId??null,
    b:n(action?.bid),
    c:n(action?.influenceCost),
    q:n(action?.prestigeAward??action?.prestige),
  };
}
function digestState(state){
  return {
    generation:n(state.generation),
    city:{
      population:n(state.city?.population),
      squalor:n(state.city?.squalor),
      order:n(state.city?.order),
      force:n(state.city?.force),
      renown:n(state.city?.renown),
      milMerc:n(state.city?.militaryMercantile),
      relArc:n(state.city?.religionArcane),
      fort:n(state.city?.fortificationLevel),
      imperial:n(state.city?.imperialIntervention),
    },
    players:(state.players??[]).map(p=>({
      id:p.id,
      ai:p.aiPersonality,
      prestige:n(p.prestige),
      influence:n(p.influence),
      wealth:n(p.wealthCapacity),
      stakes:(p.productionStakes??[]).map(s=>({
        id:s.id,sector:s.sectorId,age:s.age,order:n(s.placementOrder),
      })),
      agents:(p.institutionAgentRoster??[]).map(a=>({
        id:a.id,institution:a.institutionId,seniority:n(a.seniority),order:n(a.placementOrder),
      })),
    })),
    sectors:(state.productionSectors??[]).map(s=>({
      id:s.id,tier:n(s.tier),phase:n(s.developmentPhase),
      demand:{...(s.demandThisGeneration??{})},
    })),
    institutions:(state.institutions??[]).map(i=>({
      id:i.id,tier:n(i.tier),phase:n(i.developmentPhase),
    })),
    relations:{...(state.externalRelations?.levels??{})},
    lands:(state.lands??[]).map(l=>({
      id:l.id,revealed:Boolean(l.revealed),owner:l.ownerId??null,
      development:l.development??null,resource:l.resourceType??null,
      capacity:n(l.baseCapacity),
    })),
  };
}
function deterministicHumanChoice(actions, gameIndex, generationIndex){
  const priority=['auction_bid','agent','development','explore','farm','expansion_vote'];
  for(const kind of priority){
    const rows=actions.filter(a=>a.kind===kind);
    if(rows.length){
      return rows[(gameIndex+generationIndex)%rows.length].spec;
    }
  }
  return {kind:'pass'};
}
function finishGeneration(session, gameIndex, generationIndex){
  let guard=0;
  while(session.status!=='actions_complete'&&guard++<400){
    advanceUntilHuman(session,{singleAiStep:false});
    if(session.status==='human_turn'){
      const actions=listHumanActions(session);
      const choice=deterministicHumanChoice(actions,gameIndex,generationIndex);
      const played=playHumanAction(session,choice);
      if(!played.ok){
        const fallback=playHumanAction(session,{kind:'pass'});
        if(!fallback.ok) throw new Error('Could not pass human action');
      }
    }
  }
  if(session.status!=='actions_complete') throw new Error('Action phase parity guard exceeded');
  const result=finishInteractiveGeneration(session);
  if(!result.ok) throw new Error('Generation resolution failed: '+result.reason);
  return result;
}

const rows=[];
for(let g=0;g<GAMES;g++){
  const replace=['investor','merchant','contrarian'][g%3];
  const seat={investor:0,merchant:1,contrarian:2}[replace];
  let state=createHumanPlaytest({humanSeat:seat,replacePersonality:replace,externalRelations:true});
  state.rngState=(246813579+Math.imul(g+1,2654435761))>>>0;
  state.firstPlayerId=state.players[g%state.players.length].id;

  const generations=[];
  for(let gen=0;gen<GENERATIONS;gen++){
    let session=beginInteractiveGeneration(state);

    // Exercise the two pre-action queues deterministically when affordable.
    const human=state.players.find(p=>p.id===state.playtest.humanPlayerId);
    if(gen===1 && n(human?.influence)>=1){
      session=queuePoliticalBid(session, gen%2===0?'merchant':'scholarium');
    }
    if(gen===2){
      const target=(session.planningState.institutions??[]).find(i=>n(i.tier)<3);
      if(target) session=queueInstitutionDevelopment(session,target.id);
    }

    const result=finishGeneration(session,g,gen);
    state=result.state;
    generations.push({
      summary:{
        generation:n(result.summary.generation),
        populationAfter:n(result.summary.populationAfter),
        squalorAfter:n(result.summary.squalorAfter),
        orderAfter:n(result.summary.orderAfter),
        actions:(result.summary.actions??[]).map(cleanAction),
      },
      state:digestState(state),
    });
    if(state.endgame?.triggered) break;
  }
  rows.push({game:g+1,replace,generations});
}
process.stdout.write(JSON.stringify({games:GAMES,generations:GENERATIONS,rows}));
