
import assert from 'node:assert/strict';
import {
  createHumanPlaytest, beginInteractiveGeneration, advanceUntilHuman, listHumanActions,
  playHumanAction, finishInteractiveGeneration, queuePoliticalBid, queueInstitutionDevelopment,
  PLAYTEST_VERSION, ENGINE_VERSION,
} from '../js/v138-human-playtest-engine.js';

function toHumanTurn(session) {
  let guard=0;
  while (!['human_turn','actions_complete'].includes(session.status) && guard++<200) {
    advanceUntilHuman(session,{singleAiStep:false});
  }
  assert.ok(guard<200,'interactive phase should terminate');
  return session;
}

function finishWithPass(session) {
  let guard=0;
  while (session.status!=='actions_complete' && guard++<300) {
    toHumanTurn(session);
    if (session.status==='human_turn') {
      const pass=playHumanAction(session,{kind:'pass'});
      assert.equal(pass.ok,true,'human pass should be legal');
    }
    if (session.status!=='actions_complete') advanceUntilHuman(session,{singleAiStep:false});
  }
  assert.equal(session.status,'actions_complete');
  const result=finishInteractiveGeneration(session);
  assert.equal(result.ok,true);
  return result;
}

{
  const game=createHumanPlaytest({humanSeat:1,replacePersonality:'merchant',externalRelations:true});
  assert.equal(PLAYTEST_VERSION,'0.1.0');
  assert.equal(ENGINE_VERSION,'0.11.29-sim');
  assert.equal(game.players[1].aiPersonality,'human');
  assert.equal(game.players[1].playtestReplacesPersonality,'merchant');
  const before=game.players[1].influence;
  let session=beginInteractiveGeneration(game);
  assert.equal(session.status,'pre_actions');
  assert.ok(session.planningState.players[1].influence>=before,'capture must include Upkeep/start-of-generation effects');

  advanceUntilHuman(session,{singleAiStep:false});
  assert.equal(session.status,'human_turn');
  const legal=listHumanActions(session);
  assert.ok(Array.isArray(legal));
  const choice=legal.find(row=>row.kind!=='expansion_vote')?.spec ?? {kind:'pass'};
  const action=playHumanAction(session,choice);
  assert.equal(action.ok,true);
  const resolved=finishWithPass(session);
  assert.equal(resolved.state.generation,2);
  assert.equal(resolved.state.playtest.analytics.length,1);
  const humanActions=(resolved.summary.actions??[]).filter(row=>row.playerId===game.playtest.humanPlayerId);
  assert.ok(humanActions.length>=1,'human script should replay into the real resolution');
  console.log('core interactive generation ok', {
    legalActions:legal.length,
    humanActions:humanActions.map(row=>row.actionKind??row.type),
    influenceBefore:before,
    influenceAtActions:session.planningState.players[1].influence,
  });
}

{
  const game=createHumanPlaytest({humanSeat:1,replacePersonality:'merchant',externalRelations:true});
  let session=beginInteractiveGeneration(game);
  const influenceBefore=game.players[1].influence;
  session=queuePoliticalBid(session,'merchant');
  const result=finishWithPass((advanceUntilHuman(session,{singleAiStep:false}),session));
  const bid=(result.summary.cityInclinationBids?.bids??[]).find(row=>row.playerId===game.playtest.humanPlayerId&&row.pole==='merchant');
  assert.ok(bid,'queued human political bid must be present in generation summary');
  assert.ok(result.state.players[1].influence<=influenceBefore+10,'political bid path should resolve normally');
  console.log('political queue ok');
}

{
  const game=createHumanPlaytest({humanSeat:0,replacePersonality:'investor',externalRelations:true});
  let session=beginInteractiveGeneration(game);
  const options=(session.planningState.institutions??[]).filter(inst=>inst.tier<3);
  if (options.length) {
    const target=options[0];
    session=queueInstitutionDevelopment(session,target.id);
    const result=finishWithPass((advanceUntilHuman(session,{singleAiStep:false}),session));
    const action=(result.summary.actions??[]).find(row=>row.playerId===game.playtest.humanPlayerId&&row.actionKind==='institution_development'&&row.institutionId===target.id);
    assert.ok(action,'queued human Institution development must replay');
    console.log('institution queue ok',target.id);
  }
}


{
  const game=createHumanPlaytest({humanSeat:0,replacePersonality:'investor',externalRelations:true});
  game.players[0].influence=20;
  game.externalRelations.levels.orcs=-1;
  let session=beginInteractiveGeneration(game);
  advanceUntilHuman(session,{singleAiStep:false});
  const fortification=listHumanActions(session).find(row=>row.kind==='fortification');
  assert.ok(fortification,'human must see Fortification when Orc relations are hostile');
  assert.equal(playHumanAction(session,fortification.spec).ok,true);
  const result=finishWithPass(session);
  const action=(result.summary.actions??[]).find(row=>row.playerId===game.playtest.humanPlayerId&&row.actionKind==='fortification_construction');
  assert.ok(action,'Fortification must replay into final generation');
  console.log('fortification human action ok');
}

{
  const game=createHumanPlaytest({humanSeat:0,replacePersonality:'investor',externalRelations:true});
  game.players[0].influence=20;
  game.externalRelations.levels.gnomes=1;
  const target=(game.lands??[])[0];
  target.revealed=true;
  target.ownerId=game.players[0].id;
  target.development='natural';
  target.terrain='plains';
  target.resourceType='wool';
  target.baseCapacity=2;
  let session=beginInteractiveGeneration(game);
  advanceUntilHuman(session,{singleAiStep:false});
  const legal=listHumanActions(session);
  const reforest=legal.find(row=>row.kind==='reforestation'&&row.landId===target.id);
  const improve=legal.find(row=>row.kind==='gnome_land_improvement'&&row.landId===target.id);
  assert.ok(reforest,'human must see Reforestation on an eligible non-Forest land');
  assert.ok(improve,'human must see Gnome Improve Land at Gnome relation +1');
  assert.equal(playHumanAction(session,improve.spec).ok,true);
  const result=finishWithPass(session);
  const action=(result.summary.actions??[]).find(row=>row.playerId===game.playtest.humanPlayerId&&row.actionKind==='gnome_land_improvement');
  assert.ok(action,'Gnome Improve Land must replay into final generation');
  const finalLand=(result.state.lands??[]).find(row=>row.id===target.id);
  assert.equal(finalLand.gnomeImprovementPermanent,true);
  assert.ok(finalLand.baseCapacity>=3);
  console.log('gnome terrain action ok');
}

{
  const game=createHumanPlaytest({humanSeat:0,replacePersonality:'investor',externalRelations:true});
  game.players[0].influence=20;
  const target=(game.lands??[])[0];
  target.revealed=true;
  target.ownerId=game.players[0].id;
  target.development='farm';
  target.terrain='farm';
  target.resourceType='grain';
  target.baseCapacity=2;
  let session=beginInteractiveGeneration(game);
  advanceUntilHuman(session,{singleAiStep:false});
  const reforest=listHumanActions(session).find(row=>row.kind==='reforestation'&&row.landId===target.id);
  assert.ok(reforest);
  assert.equal(playHumanAction(session,reforest.spec).ok,true);
  const result=finishWithPass(session);
  const action=(result.summary.actions??[]).find(row=>row.playerId===game.playtest.humanPlayerId&&row.actionKind==='reforestation');
  assert.ok(action,'Reforestation must replay into final generation');
  const finalLand=(result.state.lands??[]).find(row=>row.id===target.id);
  assert.equal(finalLand.terrain,'forest');
  console.log('reforestation human action ok');
}

console.log('human playtest v138 regression passed');
