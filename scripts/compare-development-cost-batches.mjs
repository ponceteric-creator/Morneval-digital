import fs from 'node:fs';

const baseline = JSON.parse(fs.readFileSync('simulation-results/development-costs-baseline.json', 'utf8')).summary;
const proposed = JSON.parse(fs.readFileSync('simulation-results/development-costs-proposed.json', 'utf8')).summary;

function diff(a, b) { return Number(b) - Number(a); }
const comparison = {
  baselineCosts: { production: { tier1: 2, tier2: 4 }, institutions: { tier1: 2, tier2: 4 }, familyBaseWealth: 2 },
  proposedCosts: { production: { tier1: 3, tier2: 5 }, institutions: { tier1: 4, tier2: 7 }, familyBaseWealth: 2 },
  baseline,
  proposed,
  delta: {
    generationMean: diff(baseline.generation.mean, proposed.generation.mean),
    minutesMean: diff(baseline.estimatedMinutes.mean, proposed.estimatedMinutes.mean),
    populationMean: diff(baseline.populationMean, proposed.populationMean),
    institutionDevelopmentMean: diff(baseline.actions.institutionDevelopmentMean, proposed.actions.institutionDevelopmentMean),
    sectorDevelopmentMean: diff(baseline.actions.sectorDevelopmentMean, proposed.actions.sectorDevelopmentMean),
    agentPlacementsMean: diff(baseline.actions.agentPlacementsMean, proposed.actions.agentPlacementsMean),
    institutionRenownMean: diff(baseline.renownBreakdownMean.institutionRenown, proposed.renownBreakdownMean.institutionRenown),
    productionRenownMean: diff(baseline.renownBreakdownMean.productionRenown, proposed.renownBreakdownMean.productionRenown),
    allInstitutionsT3Count: diff(baseline.allInstitutionsT3Count, proposed.allInstitutionsT3Count),
    merchantWins: diff(baseline.wins.merchant ?? 0, proposed.wins.merchant ?? 0),
    contrarianWins: diff(baseline.wins.contrarian ?? 0, proposed.wins.contrarian ?? 0),
    dynastWins: diff(baseline.wins.dynast ?? 0, proposed.wins.dynast ?? 0),
  },
};

fs.writeFileSync('simulation-results/development-costs-comparison.json', JSON.stringify(comparison, null, 2));
console.log('=== DEVELOPMENT COST COMPARISON ===');
console.log(JSON.stringify(comparison));
