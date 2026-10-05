const engine = await import('../js/v133-influence-cap-engine.js?test=influence-threshold-v133');

const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);

if (state.simulationVersion !== '0.11.25-sim') {
  throw new Error(`Expected v0.11.25-sim, got ${state.simulationVersion}`);
}
if (state.city?.influenceErosionThreshold !== 20) {
  throw new Error(`Expected Influence erosion threshold 20, got ${state.city?.influenceErosionThreshold}`);
}
if (state.influenceErosionThreshold !== 20) {
  throw new Error(`Expected stamped Influence threshold 20, got ${state.influenceErosionThreshold}`);
}

console.log('PASS v0.11.25-sim uses Influence erosion threshold 20.');
