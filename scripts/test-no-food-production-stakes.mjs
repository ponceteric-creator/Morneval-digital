import assert from 'node:assert/strict';

const engine = await import('../js/v131-food-production-cleanup-engine.js?test=no-food-production');

function assertCurrentState(state, summary = null) {
  const ids = Array.from(state.productionSectors ?? []).map(sector => sector.id);
  assert.deepEqual(ids, ['textiles', 'smithing', 'materials'], 'Only the three non-Food Production Sectors may exist.');
  assert.equal(state.productionSectors.find(sector => sector.id === 'food'), undefined, 'Legacy Food proxy must not be visible in current state.');

  for (const player of state.players ?? []) {
    assert.equal((player.productionStakes ?? []).some(stake => stake.sectorId === 'food'), false, 'Food Production Stakes must never exist.');
  }

  if (summary) {
    assert.equal((summary.economyReports ?? []).some(report => report.sectorId === 'food'), false, 'Food must not have a Production economy report.');
    assert.equal((summary.auctions ?? []).some(auction => auction.type === 'production_stake' && auction.sectorId === 'food'), false, 'Food Stake auctions must never exist.');
    assert.equal((summary.actions ?? []).some(action => action.sectorId === 'food' && String(action.actionKind ?? action.type ?? '').toLowerCase().includes('stake')), false, 'Food Stake actions must never exist.');
  }

  const food = engine.getFoodSubsistenceStatus(state);
  assert.ok(food && Number.isFinite(Number(food.requested)), 'Raw Food subsistence must remain available.');
  assert.equal(engine.V084_CONFIG.population.rawFoodPerPopulation, 1, 'Population must consume exactly 1 Raw Food per Population.');
}

for (let game = 0; game < 20; game += 1) {
  const state = engine.createV084Game(['Valenne', "D'Arcy", 'Corven']);
  state.rngState = (135791113 + Math.imul(game + 1, 2654435761)) >>> 0;
  state.firstPlayerId = state.players[game % state.players.length].id;
  assertCurrentState(state);

  for (let generation = 0; generation < 25; generation += 1) {
    if (!state.externalRelations?.active && Number(state.city?.population) >= 3) engine.activateExternalRelations(state);
    const summary = engine.resolveAutomatedGeneration(state);
    assertCurrentState(state, summary);
    if (state.endgame?.triggered) break;
  }
}

console.log('PASS no Food Production Sector / Stake / auction / report; Raw Food remains subsistence-only at 1 per Population.');
