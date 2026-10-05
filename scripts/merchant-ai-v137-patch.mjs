// v137 current-simulation compatibility patches.
// 1) AI valuation: Merchant Guild is evaluated with the locked v0.11.18 Wealth formula.
// 2) Rule-engine compatibility: v127 must create a Merchant Guild Prestige entry for a
//    represented Family even when the legacy pre-v127 score produced no entry.

function replaceFunctionBlock(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing ${label} start: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing ${label} end: ${endMarker}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchMerchantGuildAiScore(source) {
  if (source.includes('v137_merchant_current_wealth_score')) return source;
  const replacement = `function estimatedInstitutionScore(state, institutionId) {
  if (institutionId === "merchant_guild") {
    const institution = (state.institutions ?? []).find(row => row.id === "merchant_guild");
    const tier = Math.max(1, Math.min(3, Math.floor(Number(institution?.tier) || 1)));
    const cap = ({ 1: 2, 2: 4, 3: 8 })[tier] ?? 2;
    const totalWealth = (state.players ?? []).reduce(
      (sum, family) => sum + Math.max(2, Number(family.wealthCapacity) || 0),
      0,
    );
    const baseWealth = 2 * (state.players ?? []).length;
    const commercialWealth = Math.max(0, totalWealth - baseWealth);
    return Math.min(cap, commercialWealth); // v137_merchant_current_wealth_score
  }
  const economy = base.previewEconomy(state);
  return calculateInstitutionScores(state, economy.reports, [], state.city.order, state.city.population)[institutionId]?.score ?? 0;
}`;
  return replaceFunctionBlock(
    source,
    'function estimatedInstitutionScore(state, institutionId) {',
    '\n\nfunction agentUtilityWeights',
    replacement,
    'estimatedInstitutionScore',
  );
}

function patchMerchantGuildMissingAward(source) {
  if (source.includes('v137_missing_merchant_award_compat')) return source;
  const oldBlock = `    const entry = (scoring.entries ?? []).find(item => item.reason === \`institution_\${MERCHANT_GUILD_ID}\`);
    if (!entry) continue;
    const represented = agentCount(player, MERCHANT_GUILD_ID) > 0;
    const before = n(entry.amount);`;
  const newBlock = `    let entry = (scoring.entries ?? []).find(item => item.reason === \`institution_\${MERCHANT_GUILD_ID}\`);
    const represented = agentCount(player, MERCHANT_GUILD_ID) > 0;
    // v137_missing_merchant_award_compat: v127's locked Wealth rule applies to
    // every represented Family. If the legacy pre-v127 score was zero, older
    // code created no scoring entry at all; create the missing zero-baseline
    // entry so the Wealth correction can be applied normally.
    if (!entry && represented) {
      scoring.entries ??= [];
      entry = { reason: \`institution_\${MERCHANT_GUILD_ID}\`, amount: 0 };
      scoring.entries.push(entry);
    }
    if (!entry) continue;
    const before = n(entry.amount);`;
  if (!source.includes(oldBlock)) throw new Error('Missing v127 Merchant Guild award correction block');
  return source.replace(oldBlock, newBlock);
}

export function patchMerchantAiV137(url, source) {
  if (process.env.MERCHANT_AI_V137 === 'off') return source;
  const pathname = new URL(url).pathname;
  if (pathname.endsWith('/js/v110-ai-engine.js')) {
    if (process.env.MERCHANT_GUILD_AI_SCORE_V137 === 'off') return source;
    return patchMerchantGuildAiScore(source);
  }
  if (pathname.endsWith('/js/v127-merchant-guild-wealth-engine.js')) {
    if (process.env.MERCHANT_GUILD_RULE_COMPAT_V137 === 'off') return source;
    return patchMerchantGuildMissingAward(source);
  }
  return source;
}
