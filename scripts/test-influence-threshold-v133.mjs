const engine = await import('../js/v130-elven-alliance-engine.js?test=influence-threshold-v133');

const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);

if (state.city?.influenceErosionThreshold !== 20) {
  throw new Error(`Expected Influence erosion threshold 20, got ${state.city?.influenceErosionThreshold}`);
}
if (state.influenceErosionThreshold !== 20) {
  throw new Error(`Expected stamped Influence threshold 20, got ${state.influenceErosionThreshold}`);
}

console.log(`PASS current simulation ${state.simulationVersion} uses Influence erosion threshold 20.`);
