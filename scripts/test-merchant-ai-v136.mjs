import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { patchInstitutionAgentMarginalV136 } from './institution-agent-marginal-v136-patch.mjs';

const engine = await import('../js/v130-elven-alliance-engine.js?test=merchant-ai-v136');
const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);

assert.equal(state.simulationVersion, '0.11.28-sim');
assert.equal(state.merchantAiModel?.guildScoringModel, 'current_wealth_forward');
assert.equal(
  state.merchantAiModel?.agentPortfolioModel,
  'marginal_single_association_prestige_and_tier_capped_influence',
);
assert.equal(state.merchantAiModel?.politicalIntentModel, 'legacy_v119_preserved');
assert.equal(state.merchantAiModel?.rulesChanged, false);
assert.equal(state.familyInfluenceIncome?.incomePerGeneration, 2, 'v136 must preserve locked +2 Family Influence');
assert.equal(state.familyInfluenceIncome?.timing, 'start_of_generation_before_actions');
assert.equal(state.familyInfluenceIncome?.appliesTo, 'each_family');
assert.ok(!state.productionSectors.some(sector => sector.id === 'food'), 'v136 must preserve Food cleanup');
assert.ok(state.players.some(player => player.aiPersonality === 'merchant'), 'Merchant personality must remain present');

// Source-level smoke check: v110 must be transformable so Agent institution
// Prestige is marginal under the single-association rule, and Agent Influence
// is marginal under the Institution Tier cap.
const v110Source = fs.readFileSync(new URL('../js/v110-ai-engine.js', import.meta.url), 'utf8');
const patched = patchInstitutionAgentMarginalV136(
  pathToFileURL(`${process.cwd()}/js/v110-ai-engine.js`).href,
  v110Source,
);
assert.ok(patched.includes('function v136MarginalInstitutionPrestige'));
assert.ok(patched.includes('function v136MarginalInstitutionInfluence'));
assert.ok(patched.includes('otherCount>0?0:Math.max(0,Number(institutionScore)||0)'));
assert.ok(patched.includes('Math.min(cap,other+own)-Math.min(cap,other)'));

// Run a complete generation through the composed current-simulation loader chain.
const summary = engine.resolveAutomatedGeneration(state);
assert.equal(summary.simulationVersion, '0.11.28-sim');
assert.equal(summary.merchantAiModel?.guildScoringModel, 'current_wealth_forward');
assert.equal(summary.merchantAiModel?.politicalIntentModel, 'legacy_v119_preserved');
assert.equal(summary.merchantAiModel?.rulesChanged, false);
assert.ok(Array.isArray(summary.actions));

console.log(JSON.stringify({
  ok: true,
  simulationVersion: state.simulationVersion,
  merchantAiModel: state.merchantAiModel,
  familyInfluenceIncome: state.familyInfluenceIncome,
}, null, 2));
