import assert from 'node:assert/strict';

const engine = await import('../js/v130-elven-alliance-engine.js?test=merchant-ai-v136');
const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);

assert.equal(state.simulationVersion, '0.11.28-sim');
assert.equal(state.merchantAiModel?.guildScoringModel, 'current_wealth_based');
assert.equal(state.merchantAiModel?.rulesChanged, false);

const merchantGuild = state.institutions.find(inst => inst.id === 'merchant_guild');
assert.ok(merchantGuild, 'Merchant Guild institution must exist');

// The AI valuation must use the same structural Wealth basis as the current
// Merchant Guild rule: total Family Wealth above the permanent 2W/family base,
// capped by Institution Tier (2 / 4 / 8).
state.players[0].wealthCapacity = 4;
state.players[1].wealthCapacity = 3;
state.players[2].wealthCapacity = 2;
merchantGuild.tier = 1;
let economy = engine.previewEconomy(state);
let scores = engine.calculateInstitutionScores(state, economy.reports ?? [], [], state.city.order, state.city.population);
assert.equal(scores.merchant_guild.score, 2);
assert.equal(scores.merchant_guild.commercialWealth, 3);
assert.equal(scores.merchant_guild.institutionPrestigeCap, 2);
assert.equal(scores.merchant_guild.aiValuationModel, 'v136_current_wealth_based');

merchantGuild.tier = 2;
economy = engine.previewEconomy(state);
scores = engine.calculateInstitutionScores(state, economy.reports ?? [], [], state.city.order, state.city.population);
assert.equal(scores.merchant_guild.score, 3);
assert.equal(scores.merchant_guild.institutionPrestigeCap, 4);

console.log('Merchant AI v136 regression test passed');
