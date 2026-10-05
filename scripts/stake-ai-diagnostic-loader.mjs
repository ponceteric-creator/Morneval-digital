function injectDiagnostics(source) {
  const helperNeedle = 'function productionBidCandidates(state, player, context) {';
  if (!source.includes(helperNeedle)) throw new Error('Could not find productionBidCandidates');
  source = source.replace(helperNeedle, `function ensureStakeAiDiagnostic(state) {
  state.__stakeAiDiagnostic ??= {
    bySector: {},
    roundsWithProductionCandidate: 0,
    roundsProductionChosen: 0,
    roundsProductionLostToOtherAction: 0,
    lostToKind: {},
  };
  return state.__stakeAiDiagnostic;
}
function stakeSectorDiagnostic(state, sectorId) {
  const root = ensureStakeAiDiagnostic(state);
  root.bySector[sectorId] ??= {
    evaluations: 0,
    zeroOrLowUtility: 0,
    zeroOrLowUtilityWithInactiveStake: 0,
    alreadyLeadingAuction: 0,
    nextBidAboveMax: 0,
    nonPositiveBidDelta: 0,
    insufficientInfluence: 0,
    candidatesOffered: 0,
  };
  return root.bySector[sectorId];
}

${helperNeedle}`);

  const estimateNeedle = '    const estimate = expectedStakeValue(state, player, sector);\n    const maxBid = estimate.utility >= 1.15 ? Math.max(1, Math.floor(estimate.utility / 1.45)) : 0;\n    if (!maxBid) continue;';
  if (!source.includes(estimateNeedle)) throw new Error('Could not find Stake estimate block');
  source = source.replace(estimateNeedle, `    const diag = stakeSectorDiagnostic(state, sector.id);
    diag.evaluations += 1;
    const estimate = expectedStakeValue(state, player, sector);
    const maxBid = estimate.utility >= 1.15 ? Math.max(1, Math.floor(estimate.utility / 1.45)) : 0;
    if (!maxBid) {
      diag.zeroOrLowUtility += 1;
      const inactive = state.players.flatMap(p => p.productionStakes ?? [])
        .filter(stake => stake.sectorId === sector.id && stake.diplomacyInactiveThisGeneration).length;
      if (inactive > 0) diag.zeroOrLowUtilityWithInactiveStake += 1;
      continue;
    }`);

  const highNeedle = '    const high = highestBid(auction);\n    if (high?.playerId === player.id) continue;\n    const nextBid = (high?.amount ?? 0) + 1;\n    const old = auction.bids[player.id]?.amount ?? 0;\n    const delta = nextBid - old;\n    if (nextBid > maxBid || delta <= 0 || player.influence < delta) continue;';
  if (!source.includes(highNeedle)) throw new Error('Could not find Stake bid eligibility block');
  source = source.replace(highNeedle, `    const high = highestBid(auction);
    if (high?.playerId === player.id) { diag.alreadyLeadingAuction += 1; continue; }
    const nextBid = (high?.amount ?? 0) + 1;
    const old = auction.bids[player.id]?.amount ?? 0;
    const delta = nextBid - old;
    if (nextBid > maxBid) { diag.nextBidAboveMax += 1; continue; }
    if (delta <= 0) { diag.nonPositiveBidDelta += 1; continue; }
    if (player.influence < delta) { diag.insufficientInfluence += 1; continue; }`);

  const offerNeedle = '    out.push({ kind: "auction_bid", auction, bid: nextBid, score: estimate.utility - nextBid * 0.45,\n      expectedCategory: estimate.category });';
  if (!source.includes(offerNeedle)) throw new Error('Could not find Stake candidate push');
  source = source.replace(offerNeedle, `    diag.candidatesOffered += 1;
    out.push({ kind: "auction_bid", auction, bid: nextBid, score: estimate.utility - nextBid * 0.45,
      expectedCategory: estimate.category });`);

  const chooserNeedle = `function choosePlayerAction(state, player, context) {
  const candidates = [];
  const normal = chooseNormalCandidate(state, player, context.farmBuilt); if (normal) candidates.push(normal);
  const vote = expansionVoteCandidate(state, player, context); if (vote) candidates.push(vote);
  candidates.push(...productionBidCandidates(state, player, context));
  const mercenary = mercenaryBidCandidate(state, player, context); if (mercenary) candidates.push(mercenary);
  return candidates.sort((a, b) => b.score - a.score)[0] ?? null;
}`;
  if (!source.includes(chooserNeedle)) throw new Error('Could not find choosePlayerAction');
  source = source.replace(chooserNeedle, `function choosePlayerAction(state, player, context) {
  const candidates = [];
  const normal = chooseNormalCandidate(state, player, context.farmBuilt); if (normal) candidates.push(normal);
  const vote = expansionVoteCandidate(state, player, context); if (vote) candidates.push(vote);
  const productionCandidates = productionBidCandidates(state, player, context);
  candidates.push(...productionCandidates);
  const mercenary = mercenaryBidCandidate(state, player, context); if (mercenary) candidates.push(mercenary);
  const selected = candidates.sort((a, b) => b.score - a.score)[0] ?? null;
  if (productionCandidates.length) {
    const diag = ensureStakeAiDiagnostic(state);
    diag.roundsWithProductionCandidate += 1;
    if (selected?.auction?.type === 'production_stake') diag.roundsProductionChosen += 1;
    else {
      diag.roundsProductionLostToOtherAction += 1;
      const kind = String(selected?.kind ?? selected?.actionKind ?? selected?.type ?? 'none');
      diag.lostToKind[kind] = (diag.lostToKind[kind] ?? 0) + 1;
    }
  }
  return selected;
}`);

  return source;
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format !== 'module' || result.source == null) return result;
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('/js/v110-ai-engine.js')) return result;
  const source = Buffer.isBuffer(result.source) ? result.source.toString('utf8') : String(result.source);
  return { ...result, source: injectDiagnostics(source), shortCircuit: true };
}
