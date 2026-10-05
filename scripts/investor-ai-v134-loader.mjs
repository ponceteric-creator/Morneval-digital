import { patchMerchantAiV136 } from './merchant-ai-v136-patch.mjs';

function replaceFunctionBlock(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing Investor patch start: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing Investor patch end: ${endMarker}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

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

  const farmReturnNeedle = '  return score >= V090_CONFIG.civicFarm.minimumUtility ? { kind: "farm", score, land: selected.land, target } : null;';
  if (!source.includes(farmReturnNeedle)) throw new Error('Could not find farm return block in v110');
  source = source.replace(
    farmReturnNeedle,
    `  const investorFoodFloor = player.aiPersonality === "investor" ? 12 + Math.max(0, target - food.localCapacity) : 0;\n  const adjustedScore = Math.max(score, investorFoodFloor);\n  return adjustedScore >= V090_CONFIG.civicFarm.minimumUtility\n    ? { kind: "farm", score: adjustedScore, land: selected.land, target }\n    : null;`,
  );

  const exploreNeedle = `  const score = profile.prestige * annuity(profile) * 0.45 + profile.engine * annuity(profile) * 0.65\n    + (noPrivateLand ? 1 : 0) - influenceCost * 0.30 - wealthCost * 0.30;\n  return { kind: "explore", score, land };`;
  if (!source.includes(exploreNeedle)) throw new Error('Could not find exploration scoring block in v110');
  source = source.replace(
    exploreNeedle,
    `  const baseScore = profile.prestige * annuity(profile) * 0.45 + profile.engine * annuity(profile) * 0.65\n    + (noPrivateLand ? 1 : 0) - influenceCost * 0.30 - wealthCost * 0.30;\n  const score = player.aiPersonality === "investor" ? baseScore * 1.15 + 0.50 : baseScore;\n  return { kind: "explore", score, land };`,
  );

  const developmentNeedle = `  const score = cost.prestige * profile.prestige + profile.engine * (sector.developmentPhase > 0 ? 1.8 : 0.9)\n    + profile.wealth * Math.min(2, Number(sector.demandThisGeneration.external_markets) || 0) * 0.35\n    - cost.influenceCost * 0.25 - cost.wealthCost * 0.35;\n  return { kind: "development", score, sector, cost };`;
  if (!source.includes(developmentNeedle)) throw new Error('Could not find development scoring block in v110');
  source = source.replace(
    developmentNeedle,
    `  const baseScore = cost.prestige * profile.prestige + profile.engine * (sector.developmentPhase > 0 ? 1.8 : 0.9)\n    + profile.wealth * Math.min(2, Number(sector.demandThisGeneration.external_markets) || 0) * 0.35\n    - cost.influenceCost * 0.25 - cost.wealthCost * 0.35;\n  const score = player.aiPersonality === "investor" ? baseScore * 0.70 : baseScore;\n  return { kind: "development", score, sector, cost };`,
  );

  source = replaceFunctionBlock(
    source,
    'function choosePlayerAction(state, player, context) {',
    '\n\nfunction executePlayerAction',
    `function choosePlayerAction(state, player, context) {
  const candidates = [];
  const normal = chooseNormalCandidate(state, player, context.farmBuilt); if (normal) candidates.push(normal);
  const vote = expansionVoteCandidate(state, player, context); if (vote) candidates.push(vote);
  const productionCandidates = productionBidCandidates(state, player, context);
  candidates.push(...productionCandidates);
  const mercenary = mercenaryBidCandidate(state, player, context); if (mercenary) candidates.push(mercenary);

  let selected = candidates.sort((a, b) => b.score - a.score)[0] ?? null;
  if (player.aiPersonality === "investor") {
    if (normal?.kind === "farm") selected = normal;
    else if (productionCandidates.length) selected = [...productionCandidates].sort((a, b) => b.score - a.score)[0];
    else if (normal?.kind === "explore") selected = normal;
  }

  if (productionCandidates.length) {
    const diag = ensureStakeAiDiagnostic(state);
    diag.roundsWithProductionCandidate += 1;
    if (selected?.auction?.type === "production_stake") diag.roundsProductionChosen += 1;
    else {
      diag.roundsProductionLostToOtherAction += 1;
      const kind = String(selected?.kind ?? selected?.actionKind ?? selected?.type ?? "none");
      diag.lostToKind[kind] = (diag.lostToKind[kind] ?? 0) + 1;
    }
  }
  return selected;
}`,
  );

  return source;
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('/js/v110-ai-engine.js')) return result;
  const source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  const investorPatched = patchInvestorAI(source);
  const composed = patchMerchantAiV136(url, investorPatched);
  return { ...result, source: composed, shortCircuit: true };
}
