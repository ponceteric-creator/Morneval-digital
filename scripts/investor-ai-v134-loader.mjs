function patchInvestorAI(source) {
  const orderNeedle = 'const PERSONALITY_ORDER = ["dynast", "merchant", "opportunist"];';
  if (!source.includes(orderNeedle)) throw new Error('Could not find AI personality order in v110');
  source = source.replace(orderNeedle, 'const PERSONALITY_ORDER = ["investor", "merchant", "opportunist"];');

  const profileNeedle = '  const source = V090_CONFIG.personalities[key] ?? V090_CONFIG.personalities.opportunist;';
  if (!source.includes(profileNeedle)) throw new Error('Could not find profile source in v110');
  source = source.replace(
    profileNeedle,
    `  const source = key === "investor"\n    ? { label: "Investor", prestige: 0.90, wealth: 1.30, engine: 1.70, civic: 0.70, horizon: 5, discount: 0.92 }\n    : (V090_CONFIG.personalities[key] ?? V090_CONFIG.personalities.opportunist);`,
  );

  const exploreNeedle = `  const score = profile.prestige * annuity(profile) * 0.45 + profile.engine * annuity(profile) * 0.65\n    + (noPrivateLand ? 1 : 0) - influenceCost * 0.30 - wealthCost * 0.30;\n  return { kind: "explore", score, land };`;
  if (!source.includes(exploreNeedle)) throw new Error('Could not find exploration scoring block in v110');
  source = source.replace(
    exploreNeedle,
    `  const baseScore = profile.prestige * annuity(profile) * 0.45 + profile.engine * annuity(profile) * 0.65\n    + (noPrivateLand ? 1 : 0) - influenceCost * 0.30 - wealthCost * 0.30;\n  const score = player.aiPersonality === "investor" ? baseScore * 1.25 + 0.75 : baseScore;\n  return { kind: "explore", score, land };`,
  );

  const developmentNeedle = `  const score = cost.prestige * profile.prestige + profile.engine * (sector.developmentPhase > 0 ? 1.8 : 0.9)\n    + profile.wealth * Math.min(2, Number(sector.demandThisGeneration.external_markets) || 0) * 0.35\n    - cost.influenceCost * 0.25 - cost.wealthCost * 0.35;\n  return { kind: "development", score, sector, cost };`;
  if (!source.includes(developmentNeedle)) throw new Error('Could not find development scoring block in v110');
  source = source.replace(
    developmentNeedle,
    `  const baseScore = cost.prestige * profile.prestige + profile.engine * (sector.developmentPhase > 0 ? 1.8 : 0.9)\n    + profile.wealth * Math.min(2, Number(sector.demandThisGeneration.external_markets) || 0) * 0.35\n    - cost.influenceCost * 0.25 - cost.wealthCost * 0.35;\n  const score = player.aiPersonality === "investor" ? baseScore * 0.70 : baseScore;\n  return { kind: "development", score, sector, cost };`,
  );

  return source;
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('/js/v110-ai-engine.js')) return result;
  const source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  return { ...result, source: patchInvestorAI(source), shortCircuit: true };
}
