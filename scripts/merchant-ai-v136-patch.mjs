function replaceFunctionBlock(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing ${label} start: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing ${label} end: ${endMarker}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchMerchantGuildScoring(source) {
  if (source.includes('aiValuationModel: "v136_wealth_forward"')) return source;
  const scoreNeedle = '  const merchantRaw = externalServed * 2 - merchantPenalty;';
  if (!source.includes(scoreNeedle)) throw new Error('Missing Merchant Guild legacy score calculation in v110');
  source = source.replace(scoreNeedle, `${scoreNeedle}\n\n  // v136 AI correction: use the current Wealth-based Merchant Guild rule and\n  // forecast the immediately reachable commercial Wealth under External-first\n  // allocation. The forecast is AI-only; v127 remains authoritative for actual\n  // end-of-generation scoring.\n  const merchantInstitution = (state.institutions ?? []).find(inst => inst.id === "merchant_guild");\n  const merchantTier = Math.max(1, Math.min(3, Math.floor(Number(merchantInstitution?.tier) || 1)));\n  const merchantPrestigeCap = ({ 1: 2, 2: 4, 3: 8 })[merchantTier] ?? 2;\n  const totalFamilyWealth = (state.players ?? []).reduce(\n    (sum, family) => sum + Math.max(2, Number(family.wealthCapacity) || 0),\n    0,\n  );\n  const totalBaseWealth = 2 * (state.players ?? []).length;\n  const commercialWealth = Math.max(0, totalFamilyWealth - totalBaseWealth);\n  const merchantCurrentRuleScore = Math.min(merchantPrestigeCap, commercialWealth);\n  const merchantExternalFirstPotential = (reports ?? []).reduce((sum, report) => {\n    if (report?.sectorId === "food") return sum;\n    const requested = Math.max(0, Number(report?.demand?.requested?.external_markets) || 0);\n    const feasibleProduction = Math.max(0, Number(report?.actualProduction) || 0);\n    return sum + Math.min(requested, feasibleProduction);\n  }, 0);\n  const merchantProjectedCommercialWealth = Math.max(commercialWealth, merchantExternalFirstPotential);\n  const merchantAiValuationScore = Math.min(merchantPrestigeCap, merchantProjectedCommercialWealth);`);

  const oldBlock = `    merchant_guild: {\n      score: Math.min(4, Math.max(0, merchantRaw)), rawScore: merchantRaw,\n      externalServed, externalUnmet, populationUnmet, imperialUnmet, penalty: merchantPenalty,\n      inclination: commercialAxis,\n    },`;
  const newBlock = `    merchant_guild: {\n      score: merchantAiValuationScore, rawScore: merchantProjectedCommercialWealth,\n      currentRuleScore: merchantCurrentRuleScore, currentCommercialWealth: commercialWealth,\n      projectedCommercialWealth: merchantProjectedCommercialWealth,\n      externalFirstPotential: merchantExternalFirstPotential,\n      institutionTier: merchantTier, institutionPrestigeCap: merchantPrestigeCap,\n      totalFamilyWealth, totalBaseWealth,\n      legacyExternalScore: Math.min(4, Math.max(0, merchantRaw)), legacyExternalRaw: merchantRaw,\n      externalServed, externalUnmet, populationUnmet, imperialUnmet, penalty: merchantPenalty,\n      inclination: commercialAxis, aiValuationModel: "v136_wealth_forward",\n    },`;
  if (!source.includes(oldBlock)) throw new Error('Missing Merchant Guild score object in v110');
  return source.replace(oldBlock, newBlock);
}

function patchMerchantPoliticalIntent(source) {
  if (source.includes('function merchantMarginalPolicyValue(state,player,targetAxis)')) return source;

  const helper = `function predictedGnomeLevel(state,targetAxis){
  const before=n(state.externalRelations?.levels?.gnomes);
  if(targetAxis===-2)return Math.max(-3,before-1);
  if(targetAxis===-1)return before>-1?before-1:before;
  if(targetAxis===1||targetAxis===2)return before<3?Math.min(2,before+1):before;
  return before;
}
function projectedGnomeMaintenance(player,level){
  const stakes=player.productionStakes ?? [];
  if(level<=-3)return stakes.length;
  if(level===-2)return stakes.filter(stake=>stake.age==='elder').length;
  return 0;
}
function merchantMarginalPolicyValue(state,player,targetAxis){
  const beforeAxis=n(state.city?.militaryMercantile);
  let preview={reports:[]};
  try{
    state.city.militaryMercantile=Math.max(-2,Math.min(2,targetAxis));
    preview=typeof legacy.previewEconomy==='function'?legacy.previewEconomy(state):preview;
  }finally{
    state.city.militaryMercantile=beforeAxis;
    if(typeof legacy.applyAutoDemand==='function')legacy.applyAutoDemand(state);
  }
  let ownExternal=0,ownPopulation=0,unmetPopulation=0,unmetImperial=0,totalExternal=0;
  for(const report of preview.reports ?? []){
    unmetPopulation+=Math.max(0,n(report?.demand?.unmet?.population));
    unmetImperial+=Math.max(0,n(report?.demand?.unmet?.imperial));
    for(const served of report?.servedStakes ?? []){
      if(served.demandCategory==='external_markets')totalExternal+=1;
      if(served.ownerId!==player.id)continue;
      if(served.demandCategory==='external_markets')ownExternal+=1;
      else if(served.demandCategory==='population')ownPopulation+=1;
    }
  }

  // Current Merchant profile: Prestige .75, Wealth 1.45, Engine 1.45, Civic .65.
  // External service grants the same +1 Prestige as Population plus +1 Wealth;
  // Wealth also creates option value by supporting another persistent Agent.
  const ownStakeValue=ownExternal*(0.75+1.45+0.55)+ownPopulation*0.75;
  const civicCost=unmetPopulation*0.95+unmetImperial*0.75;

  const gnomeBefore=n(state.externalRelations?.levels?.gnomes);
  const gnomeAfter=predictedGnomeLevel(state,targetAxis);
  const maintenance=projectedGnomeMaintenance(player,gnomeAfter);
  const gnomeMaintenanceCost=maintenance*1.35;
  const gnomeTrajectoryValue=(gnomeAfter-gnomeBefore)*0.35;

  // Merchant Guild scoring is city-wide commercial Wealth. A represented
  // Merchant therefore also values External service generated by rivals.
  const guildAgents=agentCount(player,'merchant_guild');
  const guildTier=Math.max(1,Math.min(3,Math.floor(n((state.institutions ?? []).find(inst=>inst.id==='merchant_guild')?.tier)||1)));
  const guildCap=({1:2,2:4,3:8})[guildTier] ?? 2;
  const projectedGuildScore=Math.min(guildCap,totalExternal);
  const guildPrestigeValue=guildAgents*projectedGuildScore*0.75;

  return ownStakeValue+guildPrestigeValue+gnomeTrajectoryValue-civicCost-gnomeMaintenanceCost;
}`;

  const insertion = source.indexOf('function poleUtilities(state,player){');
  if (insertion < 0) throw new Error('Missing poleUtilities for Merchant policy helper insertion');
  source = source.slice(0, insertion) + helper + '\n\n' + source.slice(insertion);

  const replacement = `function poleUtilities(state,player){
  const hand=ownHandByInstitution(state,player),s=boardSignals(state,player);
  const base={
    military: agentCount(player,'city_guard')*1.05 + agentSeniority(player,'city_guard')*0.20 + hand.city_guard*0.18,
    merchant: agentCount(player,'merchant_guild')*1.05 + agentSeniority(player,'merchant_guild')*0.20 + hand.merchant_guild*0.18 + s.ownStakes*0.16 + s.externalDemand*0.05,
    temple: agentCount(player,'temple')*1.05 + agentSeniority(player,'temple')*0.20 + hand.temple*0.18 + Math.min(1.2,s.squalor*0.18),
    scholarium: agentCount(player,'scholarium')*1.05 + agentSeniority(player,'scholarium')*0.20 + hand.scholarium*0.18 + s.upgradeable*0.11,
  };
  if(player.aiPersonality==='merchant'){
    // v136: compare the actual marginal economic consequences of moving the
    // city one step toward Mercantile or Military. Existing Institution Agents
    // no longer dictate policy merely because they are already deployed there.
    const axis=Math.max(-2,Math.min(2,n(state.city?.militaryMercantile)));
    const merchantTarget=Math.min(2,axis+1);
    const militaryTarget=Math.max(-2,axis-1);
    base.merchant=merchantMarginalPolicyValue(state,player,merchantTarget)+hand.merchant_guild*0.18;
    base.military=merchantMarginalPolicyValue(state,player,militaryTarget)+hand.city_guard*0.18;
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
