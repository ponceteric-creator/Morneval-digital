
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
console.log('human playtest v138 regression passed');
