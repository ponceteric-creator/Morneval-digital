function replaceFunctionBlock(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing ${label} start: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing ${label} end: ${endMarker}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchMerchantGuildScoring(source) {
  if (source.includes('aiValuationModel: "v136_current_wealth_based"')) return source;
  const scoreNeedle = '  const merchantRaw = externalServed * 2 - merchantPenalty;';
  if (!source.includes(scoreNeedle)) throw new Error('Missing Merchant Guild legacy score calculation in v110');
  source = source.replace(scoreNeedle, `${scoreNeedle}\n\n  // v136 AI correction: evaluate the Merchant Guild with the current v0.11.18+\n  // Wealth-based rule instead of the obsolete External Market formula. This is\n  // an AI valuation change only; v127 remains authoritative for actual scoring.\n  const merchantInstitution = (state.institutions ?? []).find(inst => inst.id === "merchant_guild");\n  const merchantTier = Math.max(1, Math.min(3, Math.floor(Number(merchantInstitution?.tier) || 1)));\n  const merchantPrestigeCap = ({ 1: 2, 2: 4, 3: 8 })[merchantTier] ?? 2;\n  const totalFamilyWealth = (state.players ?? []).reduce(\n    (sum, family) => sum + Math.max(2, Number(family.wealthCapacity) || 0),\n    0,\n  );\n  const totalBaseWealth = 2 * (state.players ?? []).length;\n  const commercialWealth = Math.max(0, totalFamilyWealth - totalBaseWealth);\n  const merchantCurrentRuleScore = Math.min(merchantPrestigeCap, commercialWealth);`);

  const oldBlock = `    merchant_guild: {\n      score: Math.min(4, Math.max(0, merchantRaw)), rawScore: merchantRaw,\n      externalServed, externalUnmet, populationUnmet, imperialUnmet, penalty: merchantPenalty,\n      inclination: commercialAxis,\n    },`;
  const newBlock = `    merchant_guild: {\n      score: merchantCurrentRuleScore, rawScore: commercialWealth,\n      structuralRaw: commercialWealth, structuralCapped: merchantCurrentRuleScore,\n      institutionTier: merchantTier, institutionPrestigeCap: merchantPrestigeCap,\n      totalFamilyWealth, totalBaseWealth, commercialWealth,\n      legacyExternalScore: Math.min(4, Math.max(0, merchantRaw)), legacyExternalRaw: merchantRaw,\n      externalServed, externalUnmet, populationUnmet, imperialUnmet, penalty: merchantPenalty,\n      inclination: commercialAxis, aiValuationModel: "v136_current_wealth_based",\n    },`;
  if (!source.includes(oldBlock)) throw new Error('Missing Merchant Guild score object in v110');
  return source.replace(oldBlock, newBlock);
}

function patchMerchantPoliticalIntent(source) {
  if (source.includes('const externalCapturePotential=Math.min(s.ownStakes,s.externalDemand);')) return source;
  const replacement = `function poleUtilities(state,player){
  const hand=ownHandByInstitution(state,player),s=boardSignals(state,player);
  const base={
    military: agentCount(player,'city_guard')*1.05 + agentSeniority(player,'city_guard')*0.20 + hand.city_guard*0.18,
    merchant: agentCount(player,'merchant_guild')*1.05 + agentSeniority(player,'merchant_guild')*0.20 + hand.merchant_guild*0.18 + s.ownStakes*0.16 + s.externalDemand*0.05,
    temple: agentCount(player,'temple')*1.05 + agentSeniority(player,'temple')*0.20 + hand.temple*0.18 + Math.min(1.2,s.squalor*0.18),
    scholarium: agentCount(player,'scholarium')*1.05 + agentSeniority(player,'scholarium')*0.20 + hand.scholarium*0.18 + s.upgradeable*0.11,
  };
  if(player.aiPersonality==='merchant'){
    // v136 AI correction: a Merchant evaluates Mercantile policy by the economic
    // engine it enables. External-served Stakes retain +1 Wealth under v125;
    // that Wealth supports persistent Agents, which in turn generate Influence.
    // Existing Guard Agents are treated as portfolio assets, not as a reason to
    // turn the whole city Military. Orc pressure can still pull the Merchant back
    // toward Military when security deteriorates.
    const externalCapturePotential=Math.min(s.ownStakes,s.externalDemand);
    const wealthSurplus=Math.max(0,n(player.wealthCapacity)-2);
    const gnomeLevel=n(state.externalRelations?.levels?.gnomes);
    const orcLevel=n(state.externalRelations?.levels?.orcs);
    const commerceEngineValue=1.15
      + externalCapturePotential*0.70
      + wealthSurplus*0.35
      + Math.max(0,-gnomeLevel)*0.20;
    const securityPressure=Math.max(0,-orcLevel)*0.35;
    base.merchant+=commerceEngineValue;
    base.military=base.military*0.45+securityPressure;
  }
  if(player.aiPersonality==='dynast'){ base.military+=0.45; base.temple+=0.25; }
  if(player.aiPersonality==='contrarian'){
    const opponentAgents={city_guard:0,merchant_guild:0,temple:0,scholarium:0};
    for(const opponent of state.players ?? [])if(opponent.id!==player.id){
      for(const id of Object.keys(opponentAgents))opponentAgents[id]+=agentCount(opponent,id);
    }
    for(const [pole,id] of Object.entries(POLE_TO_INSTITUTION)) base[pole]+=Math.max(0,0.55-opponentAgents[id]*0.08);
  }
  return base;
}`;
  return replaceFunctionBlock(
    source,
    'function poleUtilities(state,player){',
    '\n\nfunction axisIntent',
    replacement,
    'Merchant political intent patch',
  );
}

export function patchMerchantAiV136(url, source) {
  if (process.env.MERCHANT_AI_V136 === 'off') return source;
  const pathname = new URL(url).pathname;
  let patched = source;
  if (pathname.endsWith('/js/v110-ai-engine.js')) patched = patchMerchantGuildScoring(patched);
  if (pathname.endsWith('/js/v119-political-influence-ai-engine.js')) patched = patchMerchantPoliticalIntent(patched);
  return patched;
}
