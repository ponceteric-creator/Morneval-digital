import * as engine from '../js/v130-elven-alliance-engine.js?test=industrialist-v134';

const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
const industrialists = state.players.filter(player => player.aiPersonality === 'industrialist');
const dynasts = state.players.filter(player => player.aiPersonality === 'dynast');

if (state.simulationVersion !== '0.11.26-sim') {
  throw new Error(`Expected v0.11.26-sim, got ${state.simulationVersion}`);
}
if (state.city.influenceErosionThreshold !== 20) {
  throw new Error(`Expected Influence threshold 20, got ${state.city.influenceErosionThreshold}`);
}
if (industrialists.length !== 1 || dynasts.length !== 0) {
  throw new Error(`Expected exactly one Industrialist and no Dynast; industrialists=${industrialists.length}, dynasts=${dynasts.length}`);
}

const industrialist = industrialists[0];
const summary = engine.resolveAutomatedGeneration(state);
const firstIndustrialistAction = (summary.actions ?? []).find(action =>
  action.playerId === industrialist.id && action.type !== 'pass');

if (!firstIndustrialistAction) {
  throw new Error('Industrialist took no substantive action in opening generation');
}
if (firstIndustrialistAction.type !== 'hinterland_exploration') {
  throw new Error(`Expected opening Industrialist priority to acquire Hinterland, got ${firstIndustrialistAction.type}`);
}

console.log(JSON.stringify({
  ok: true,
  simulationVersion: state.simulationVersion,
  industrialistId: industrialist.id,
  firstAction: firstIndustrialistAction.type,
  influenceThreshold: state.city.influenceErosionThreshold,
}, null, 2));
