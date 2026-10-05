import * as base from './v130-elven-alliance-engine.js?base=0.11.22-sim';

export * from './v130-elven-alliance-engine.js?base=0.11.22-sim';

export const V131_VERSION = '0.11.23-sim';
export const ACTIVE_PRODUCTION_SECTORS = Object.freeze(['textiles', 'smithing', 'materials']);

function productionSectorIds(state) {
  return Array.from(state?.productionSectors ?? []).map(sector => sector?.id).filter(Boolean);
}

function sanitizeProductionSectors(state) {
  // v0.8.7 removed Food as a Production Sector. Older compatibility layers can
  // still expose a synthetic `food` result through Array.find(); converting to
  // a plain Array here removes that proxy from the current simulation path.
  const sectors = Array.from(state?.productionSectors ?? [])
    .filter(sector => sector && ACTIVE_PRODUCTION_SECTORS.includes(sector.id));
  const ids = sectors.map(sector => sector.id);
  const missing = ACTIVE_PRODUCTION_SECTORS.filter(id => !ids.includes(id));
  const unexpected = ids.filter(id => !ACTIVE_PRODUCTION_SECTORS.includes(id));
  if (missing.length || unexpected.length || sectors.length !== ACTIVE_PRODUCTION_SECTORS.length) {
    throw new Error(`Invalid Production Sector set: ${JSON.stringify({ ids, missing, unexpected })}`);
  }
  state.productionSectors = sectors;
  return state;
}

function assertNoFoodProductionArtifacts(state, summary = null) {
  const ids = productionSectorIds(state);
  if (ids.includes('food')) throw new Error('Food must not exist as a Production Sector.');

  const foodStakes = (state?.players ?? [])
    .flatMap(player => player.productionStakes ?? [])
    .filter(stake => stake?.sectorId === 'food');
  if (foodStakes.length) throw new Error(`Food Production Stakes detected: ${foodStakes.map(stake => stake.id).join(', ')}`);

  if (summary) {
    const foodReports = (summary.economyReports ?? []).filter(report => report?.sectorId === 'food');
    if (foodReports.length) throw new Error('Food economy report detected; Raw Food must remain subsistence-only.');

    const foodAuctions = (summary.auctions ?? []).filter(auction =>
      auction?.type === 'production_stake' && auction?.sectorId === 'food');
    if (foodAuctions.length) throw new Error('Food Production Stake auction detected.');

    const foodStakeActions = (summary.actions ?? []).filter(action =>
      action?.sectorId === 'food'
      && String(action?.actionKind ?? action?.type ?? '').toLowerCase().includes('stake'));
    if (foodStakeActions.length) throw new Error('Food Production Stake action detected.');
  }

  return true;
}

export function createV084Game(familyNames = ['Valenne', "D'Arcy", 'Corven']) {
  const state = base.createV084Game(familyNames);
  sanitizeProductionSectors(state);
  base.ensureExternalRelationsState(state).version = V131_VERSION;
  assertNoFoodProductionArtifacts(state);
  return state;
}

export function resolveAutomatedGeneration(state) {
  sanitizeProductionSectors(state);
  assertNoFoodProductionArtifacts(state);
  const summary = base.resolveAutomatedGeneration(state);
  sanitizeProductionSectors(state);
  assertNoFoodProductionArtifacts(state, summary);
  const rel = base.ensureExternalRelationsState(state);
  rel.version = V131_VERSION;
  if (summary.externalRelations) summary.externalRelations.version = V131_VERSION;
  return summary;
}

export function assertNoFoodProduction(state, summary = null) {
  sanitizeProductionSectors(state);
  return assertNoFoodProductionArtifacts(state, summary);
}
