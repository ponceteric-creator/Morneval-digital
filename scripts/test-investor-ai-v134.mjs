const engine = await import('../js/v130-elven-alliance-engine.js?test=investor-ai-v134');

const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
const personalities = state.players.map(player => player.aiPersonality);

if (!String(state.simulationVersion ?? '').endsWith('-sim')) {
  throw new Error(`Expected a current simulation version, got ${state.simulationVersion}`);
}
if (state.city.influenceErosionThreshold !== 20) {
  throw new Error(`Expected Influence threshold 20, got ${state.city.influenceErosionThreshold}`);
}
if (personalities[0] !== 'investor') {
  throw new Error(`Expected first AI personality investor, got ${personalities[0]}`);
}
if (personalities.includes('dynast')) {
  throw new Error(`Dynast should be replaced in current simulation: ${personalities.join(', ')}`);
}
if (state.investorAiModel?.personality !== 'investor') {
  throw new Error('Current simulation must retain the Investor AI model metadata.');
}

console.log(JSON.stringify({
  ok: true,
  simulationVersion: state.simulationVersion,
  influenceErosionThreshold: state.city.influenceErosionThreshold,
  personalities,
  investorAiModel: state.investorAiModel,
  familyInfluenceIncome: state.familyInfluenceIncome,
}, null, 2));
