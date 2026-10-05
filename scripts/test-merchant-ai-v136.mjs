import assert from 'node:assert/strict';

const engine = await import('../js/v130-elven-alliance-engine.js?test=merchant-ai-v136');
const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);

assert.equal(state.simulationVersion, '0.11.28-sim');
assert.equal(state.merchantAiModel?.guildScoringModel, 'current_wealth_based');
assert.equal(state.merchantAiModel?.politicalIntentModel, 'external_market_wealth_and_agent_capacity');
assert.equal(state.merchantAiModel?.rulesChanged, false);
assert.equal(state.familyInfluenceIncome?.amountPerGeneration, 2, 'v136 must preserve locked +2 Family Influence');
assert.ok(!state.productionSectors.some(sector => sector.id === 'food'), 'v136 must preserve Food cleanup');
assert.ok(state.players.some(player => player.aiPersonality === 'merchant'), 'Merchant personality must remain present');

// Run a complete generation through the composed current-simulation loader chain.
// The behavioral A/B workflow then compares 100 identical-seed games with the
// v136 Merchant correction enabled vs disabled; this catches the private v110/v119
// heuristic instances that are not exposed as a single public calculator export.
const summary = engine.resolveAutomatedGeneration(state);
assert.equal(summary.simulationVersion, '0.11.28-sim');
assert.equal(summary.merchantAiModel?.guildScoringModel, 'current_wealth_based');
assert.equal(summary.merchantAiModel?.rulesChanged, false);
assert.ok(Array.isArray(summary.actions));

console.log(JSON.stringify({
  ok: true,
  simulationVersion: state.simulationVersion,
  merchantAiModel: state.merchantAiModel,
  familyInfluenceIncome: state.familyInfluenceIncome,
}, null, 2));
