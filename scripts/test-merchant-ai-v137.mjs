import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { patchMerchantAiV137 } from './merchant-ai-v137-patch.mjs';
import { patchInstitutionAgentMarginalV137 } from './institution-agent-marginal-v137-patch.mjs';

const engine = await import('../js/v130-elven-alliance-engine.js?test=merchant-ai-v137');
const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);

assert.equal(state.simulationVersion, '0.11.29-sim');
assert.equal(state.familyInfluenceIncome?.incomePerGeneration, 2);
assert.equal(state.city.influenceErosionThreshold, 20);
assert.equal(state.merchantAiModel?.merchantGuildAiScore, 'current_locked_wealth_formula');
assert.equal(state.merchantAiModel?.politicalIntentModel, 'legacy_v119_preserved');
assert.equal(state.merchantAiModel?.rulesChanged, false);

const v110 = fs.readFileSync(new URL('../js/v110-ai-engine.js', import.meta.url), 'utf8');
let patched110 = patchMerchantAiV137(pathToFileURL(`${process.cwd()}/js/v110-ai-engine.js`).href, v110);
patched110 = patchInstitutionAgentMarginalV137(pathToFileURL(`${process.cwd()}/js/v110-ai-engine.js`).href, patched110);
assert.ok(patched110.includes('v137_merchant_current_wealth_score'));
assert.ok(patched110.includes('function v137MarginalInstitutionPrestige'));
assert.ok(patched110.includes('function v137MarginalInstitutionInfluence'));

const v127 = fs.readFileSync(new URL('../js/v127-merchant-guild-wealth-engine.js', import.meta.url), 'utf8');
const patched127 = patchMerchantAiV137(pathToFileURL(`${process.cwd()}/js/v127-merchant-guild-wealth-engine.js`).href, v127);
assert.ok(patched127.includes('v137_missing_merchant_award_compat'));
assert.ok(patched127.includes('if (!entry && represented)'));

const summary = engine.resolveAutomatedGeneration(state);
assert.equal(summary.simulationVersion, '0.11.29-sim');
assert.equal(summary.familyInfluenceIncomeGrants?.length, state.players.length);
assert.ok(Array.isArray(summary.actions));

console.log(JSON.stringify({
  ok: true,
  simulationVersion: state.simulationVersion,
  merchantAiModel: state.merchantAiModel,
  familyInfluenceIncome: state.familyInfluenceIncome,
}, null, 2));
