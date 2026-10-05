export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (!url.includes('/js/v110-ai-engine.js') || typeof result.source !== 'string') return result;
  let source = result.source;
  const needle = '  const merchantRaw = externalServed * 2 - merchantPenalty;';
  const replacement = `  const merchantRaw = externalServed * 2 - merchantPenalty;\n  // Diagnostic only: align AI Merchant Guild valuation with the current v0.11.18+ Wealth-based rule.\n  const merchantInstitution = (state.institutions ?? []).find(inst => inst.id === "merchant_guild");\n  const merchantTier = Math.max(1, Math.min(3, Math.floor(Number(merchantInstitution?.tier) || 1)));\n  const merchantCap = ({ 1: 2, 2: 4, 3: 8 })[merchantTier] ?? 2;\n  const merchantTotalWealth = (state.players ?? []).reduce((sum, p) => sum + Math.max(2, Number(p.wealthCapacity) || 0), 0);\n  const merchantBaseWealth = 2 * (state.players ?? []).length;\n  const merchantGeneratedWealth = Math.max(0, merchantTotalWealth - merchantBaseWealth);\n  const merchantCurrentRuleScore = Math.min(merchantCap, merchantGeneratedWealth);`;
  if (!source.includes(needle)) throw new Error('Merchant AI diagnostic patch target not found (merchantRaw)');
  source = source.replace(needle, replacement);
  const oldBlock = `    merchant_guild: {\n      score: Math.min(4, Math.max(0, merchantRaw)), rawScore: merchantRaw,\n      externalServed, externalUnmet, populationUnmet, imperialUnmet, penalty: merchantPenalty,\n      inclination: commercialAxis,\n    },`;
  const newBlock = `    merchant_guild: {\n      score: merchantCurrentRuleScore, rawScore: merchantGeneratedWealth,\n      externalServed, externalUnmet, populationUnmet, imperialUnmet, penalty: merchantPenalty,\n      inclination: commercialAxis, merchantTier, merchantCap, merchantTotalWealth, merchantGeneratedWealth,\n      diagnosticAiModelAlignedToCurrentRule: true,\n    },`;
  if (!source.includes(oldBlock)) throw new Error('Merchant AI diagnostic patch target not found (merchant block)');
  source = source.replace(oldBlock, newBlock);
  return { ...result, source, shortCircuit: true };
}
