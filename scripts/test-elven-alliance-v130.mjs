import assert from 'node:assert/strict';

const engine = await import('../js/v130-elven-alliance-engine.js?test=elven-alliance-v130');

const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
engine.activateExternalRelations(state);

// Build a deterministic 9-Forest, 0-Farm landscape for the Quest test.
state.terrainPool = [];
for (let i = 0; i < state.lands.length; i += 1) {
  const land = state.lands[i];
  land.revealed = true;
  land.ownerId = i % 3 === 0 ? 'public' : state.players[i % state.players.length].id;
  land.development = 'natural';
  land.terrain = i < 9 ? 'forest' : 'meadow';
  land.resourceType = i < 9 ? 'wood' : 'wool';
  land.baseCapacity = 2;
}
state.externalRelations.levels.elves = 2;
state.externalRelations.levels.mainland = 1; // assumes the +2 threshold consequence already occurred.
state.externalRelations.mainlandThresholdsTriggered.elves.plus2 = true;

for (const player of state.players) {
  player.influence = 10;
  player.prestige = 0;
  player.institutionAgentRoster ??= [];
  player.institutionAgentRoster.push({
    id: `test_scholarium_${player.id}`,
    institutionId: 'scholarium',
    seniority: 1,
    placementOrder: 999,
  });
}

let status = engine.getElvenQuestStatus(state);
assert.equal(status.conditions.forests.met, true);
assert.equal(status.conditions.noFarms.met, true);
assert.equal(status.conditions.studyElfWays.met, false);
assert.equal(status.readyToComplete, false);

assert.equal(engine.studyElfWays(state, state.players[0].id, 3).ok, false, 'Study action must cap at 2 Influence');
assert.equal(engine.studyElfWays(state, state.players[0].id, 2).ok, true);
assert.equal(engine.studyElfWays(state, state.players[0].id, 2).ok, true);
assert.equal(engine.studyElfWays(state, state.players[1].id, 2).ok, true);
assert.equal(engine.studyElfWays(state, state.players[1].id, 2).ok, true);
assert.equal(engine.studyElfWays(state, state.players[2].id, 2).ok, true);

status = engine.getElvenQuestStatus(state);
assert.equal(status.conditions.studyElfWays.current, 10);
assert.equal(status.readyToComplete, true);

const beforeRenown = state.city.renown;
const completion = engine.completeStrategicAlliance(state, 'elves');
assert.equal(completion.ok, true);
assert.equal(state.externalRelations.levels.elves, 3);
assert.equal(state.externalRelations.levels.mainland, -1, 'Elven +3 causes the one-time additional Mainland -2');
assert.equal(state.city.permanentPoliticalRenown, 2);
assert.equal(state.city.renown, beforeRenown + 2, 'Quest +2 Renown must survive structural recalculation');

// Contributions are 4 / 4 / 2, so the two tied top contributors each receive the +1 top-contributor bonus.
assert.equal(state.players[0].prestige, 2);
assert.equal(state.players[1].prestige, 2);
assert.equal(state.players[2].prestige, 1);

const effects = engine.getElvenSocietyEffects(state);
assert.equal(effects.forests, 9);
assert.equal(effects.rawFoodPerProductiveForest, 2);
assert.equal(effects.populationCapacityPerForest, 2);
assert.equal(effects.populationCapacityBonus, 18);
assert.equal(effects.forceBonus, 4);

console.log(JSON.stringify({
  ok: true,
  quest: status,
  completion,
  effects,
  renown: state.city.renown,
  prestige: Object.fromEntries(state.players.map(player => [player.id, player.prestige])),
}, null, 2));
