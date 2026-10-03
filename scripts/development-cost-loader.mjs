import { pathToFileURL } from 'node:url';

const ROOT = pathToFileURL(`${process.cwd()}/`).href;
const mode = process.env.COST_MODE === 'proposed' ? 'proposed' : 'baseline';
const merchantAiMode = process.env.MERCHANT_AI === 'wealth' ? 'wealth' : 'legacy';

const COSTS = mode === 'proposed'
  ? { production: { 1: 3, 2: 5 }, institution: { 1: 4, 2: 6 } }
  : { production: { 1: 2, 2: 4 }, institution: { 1: 2, 2: 4 } };

function local(rel) { return new URL(rel, ROOT).href; }

export async function resolve(specifier, context, nextResolve) {
  let candidate = null;
  try { candidate = new URL(specifier, context.parentURL ?? ROOT); } catch {}
  if (candidate) {
    const p = candidate.pathname;
    const q = candidate.search;
    if (p.endsWith('/js/v090-engine.js') && q === '?base=0.9.0') {
      return { url: local('js/v121-institution-tier-engine.js?v=0.11.17-sim'), shortCircuit: true };
    }
    if (p.endsWith('/js/v111-ai-engine.js') && (q === '?direct=0.11.1-v112-tithe' || q === '?intrigue=0.11.5')) {
      return { url: local('js/v121-institution-tier-engine.js?v=0.11.17-sim'), shortCircuit: true };
    }
    if (p.endsWith('/js/v089-engine.js') && q === '?base=0.8.9') {
      return { url: local('js/v111-base.js?v=0.11.11-renown'), shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}

function productionCostFunction() {
  const t1 = COSTS.production[1], t2 = COSTS.production[2];
  return `function nextDevelopmentCost(sector) {
  if (sector.tier >= 3) return null;
  const tier = Math.max(1, Math.min(2, Math.floor(Number(sector.tier) || 1)));
  const phase = Math.max(1, Math.min(3, Math.floor(Number(sector.developmentPhase) || 0) + 1));
  const influenceCost = tier === 1 ? ${t1} : ${t2};
  const prestigeByTier = tier === 1 ? { 1: 4, 2: 3, 3: 2 } : { 1: 8, 2: 6, 3: 4 };
  return { phase, influenceCost, wealthCost: 0, prestige: prestigeByTier[phase] };
}`;
}

function institutionCostBlock() {
  const t1 = COSTS.institution[1], t2 = COSTS.institution[2];
  return `const DEVELOPMENT_COSTS = Object.freeze({
  1: Object.freeze({
    1: Object.freeze({ influenceCost: ${t1}, wealthCost: 0, prestige: 4 }),
    2: Object.freeze({ influenceCost: ${t1}, wealthCost: 0, prestige: 3 }),
    3: Object.freeze({ influenceCost: ${t1}, wealthCost: 0, prestige: 2 }),
  }),
  2: Object.freeze({
    1: Object.freeze({ influenceCost: ${t2}, wealthCost: 0, prestige: 8 }),
    2: Object.freeze({ influenceCost: ${t2}, wealthCost: 0, prestige: 6 }),
    3: Object.freeze({ influenceCost: ${t2}, wealthCost: 0, prestige: 4 }),
  }),
});`;
}

function merchantAwareInstitutionScoreFunction() {
  return `function estimatedInstitutionScore(state, institutionId) {
  if (institutionId === "merchant_guild") {
    const familyBaseWealth = 2;
    const totalWealth = (state.players ?? []).reduce((sum, player) => sum + Math.max(familyBaseWealth, Number(player.wealthCapacity) || 0), 0);
    const commercialWealth = Math.max(0, totalWealth - familyBaseWealth * (state.players ?? []).length);
    const institution = (state.institutions ?? []).find(row => row.id === institutionId);
    const tier = Math.max(1, Math.min(3, Math.floor(Number(institution?.tier) || 1)));
    const cap = tier === 1 ? 2 : tier === 2 ? 4 : 8;
    return Math.min(cap, commercialWealth);
  }
  const economy = base.previewEconomy(state);
  return calculateInstitutionScores(state, economy.reports, [], state.city.order, state.city.population)[institutionId]?.score ?? 0;
}`;
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  let source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  let changed = false;

  if (pathname.endsWith('/js/v110-ai-engine.js')) {
    const costRe = /function nextDevelopmentCost\(sector\) \{[\s\S]*?\n\}/;
    if (!costRe.test(source)) throw new Error('Could not patch production development cost function');
    source = source.replace(costRe, productionCostFunction());
    changed = true;
    if (merchantAiMode === 'wealth') {
      const scoreRe = /function estimatedInstitutionScore\(state, institutionId\) \{[\s\S]*?\n\}/;
      if (!scoreRe.test(source)) throw new Error('Could not patch Merchant Guild AI institution score');
      source = source.replace(scoreRe, merchantAwareInstitutionScoreFunction());
    }
  }

  if (pathname.endsWith('/js/v121-institution-tier-engine.js') || pathname.endsWith('/js/v122-institution-tier-full-engine.js')) {
    const re = /const DEVELOPMENT_COSTS = Object\.freeze\(\{[\s\S]*?\n\}\);/;
    if (!re.test(source)) throw new Error(`Could not patch institution cost block in ${pathname}`);
    source = source.replace(re, institutionCostBlock());
    changed = true;
  }

  if (!changed) return result;
  return { ...result, source, shortCircuit: true };
}
