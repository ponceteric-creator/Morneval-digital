const engine = await import('../js/v130-elven-alliance-engine.js?test=family-influence-v135');

const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
const before = state.players.map(player => player.influence);

if (state.simulationVersion !== '0.11.27-sim') {
  throw new Error(`Expected v0.11.27-sim, got ${state.simulationVersion}`);
}
if (state.familyInfluenceIncome?.incomePerGeneration !== 2) {
  throw new Error(`Expected +2 Family Influence per generation, got ${JSON.stringify(state.familyInfluenceIncome)}`);
}

const summary = engine.resolveAutomatedGeneration(state);
const grants = summary.familyInfluenceIncomeGrants ?? [];
if (grants.length !== state.players.length) {
  throw new Error(`Expected ${state.players.length} family Influence grants, got ${grants.length}`);
}
for (let i = 0; i < grants.length; i += 1) {
  if (grants[i].before !== before[i]) {
    throw new Error(`Grant ${i} recorded before=${grants[i].before}, expected ${before[i]}`);
  }
  if (grants[i].granted !== 2 || grants[i].after !== before[i] + 2) {
    throw new Error(`Grant ${i} is not exactly +2: ${JSON.stringify(grants[i])}`);
  }
}

console.log(JSON.stringify({
  ok: true,
  simulationVersion: state.simulationVersion,
  initialInfluenceBeforeGenerationIncome: before,
  grants,
  influenceErosionThreshold: state.city.influenceErosionThreshold,
}, null, 2));
