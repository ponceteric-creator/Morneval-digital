function replaceFunctionBlock(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing patch start: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing patch end: ${endMarker}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchProductionStakeAI(source) {
  source = replaceFunctionBlock(
    source,
    'function expectedStakeValue(state, player, sector) {',
    '\n\nfunction revealTerrain',
    `function stakeAgeAfterV132(age, generations) {
  const ages = ["young", "mature", "elder"];
  const start = Math.max(0, ages.indexOf(age));
  const index = start + generations;
  return index >= ages.length ? null : ages[index];
}

function stakeAgeRankV132(age) {
  if (age === "elder") return 3;
  if (age === "mature") return 2;
  return 1;
}

function projectedSectorStakesV132(state, sectorId, generations) {
  return state.players
    .flatMap(p => p.productionStakes ?? [])
    .filter(stake => stake.sectorId === sectorId)
    .filter(stake => !(generations === 0 && stake.diplomacyInactiveThisGeneration))
    .map(stake => ({ ...stake, age: stakeAgeAfterV132(stake.age, generations) }))
    .filter(stake => stake.age);
}

function expectedStakeValue(state, player, sector) {
  const profile = profileFor(state, player);
  const priorityGroups = base.getDemandPriorityGroups(state);
  const rawCapacity = Math.max(0, base.sectorResourceCapacity(state, sector.id));
  const slotCapacity = Math.max(0, Math.floor(Number(sector.tier) || 1) * 3);
  const hypothetical = {
    id: "__v132_hypothetical_stake__",
    ownerId: player.id,
    sectorId: sector.id,
    age: "young",
    placementOrder: Number.MAX_SAFE_INTEGER,
    __v132Hypothetical: true,
  };

  const projection = [];
  let capitalUtility = 0;
  let currentCategory = null;
  let currentDirectUtility = 0;
  let futureUtility = 0;

  for (let t = 0; t < 3; t += 1) {
    const projectedAge = stakeAgeAfterV132("young", t);
    if (!projectedAge) break;
    const existing = projectedSectorStakesV132(state, sector.id, t);
    const projectedHypothetical = { ...hypothetical, age: projectedAge };
    const withStake = [...existing, projectedHypothetical]
      .sort((a, b) => stakeAgeRankV132(b.age) - stakeAgeRankV132(a.age)
        || (Number(a.placementOrder) || 0) - (Number(b.placementOrder) || 0));

    const supplyWith = Math.min(rawCapacity, slotCapacity, withStake.length);
    const sequenceWith = allocateDemand(supplyWith, sector.demandThisGeneration, priorityGroups);
    const hypotheticalIndex = withStake.findIndex(stake => stake.__v132Hypothetical);
    const category = hypotheticalIndex >= 0 && hypotheticalIndex < sequenceWith.length
      ? sequenceWith[hypotheticalIndex]
      : null;
    const directUtility = category ? categoryUtility(category, profile) : 0;
    const discountedUtility = directUtility * (profile.discount ** t);
    capitalUtility += discountedUtility;
    if (t === 0) {
      currentCategory = category;
      currentDirectUtility = directUtility;
    } else {
      futureUtility += discountedUtility;
    }
    projection.push({
      generationOffset: t,
      age: projectedAge,
      category,
      directUtility,
      discountedUtility,
      activeExistingStakes: existing.length,
      productionWith: sequenceWith.length,
    });
  }

  // Capital value answers "how much is this asset worth?" and is used to cap
  // the auction bid. Action priority answers "should I spend my action on it
  // now?". When the Stake produces now we deliberately preserve the legacy
  // action scale, so this patch does not make a three-generation asset crowd
  // out Farms/Exploration simply because its full NPV is larger. A Stake that
  // is inactive today can still be bought as a replacement option when Elder
  // turnover makes its discounted future value strong enough.
  if (capitalUtility > 0) capitalUtility += profile.engine * 0.20;
  const actionUtility = currentDirectUtility > 0
    ? currentDirectUtility * annuity(profile, Math.min(3, profile.horizon)) + profile.engine * 0.25
    : futureUtility * 0.65 + (futureUtility > 0 ? profile.engine * 0.15 : 0);

  return {
    category: currentCategory ?? projection.find(item => item.category)?.category ?? null,
    utility: capitalUtility,
    capitalUtility,
    actionUtility,
    currentDirectUtility,
    futureUtility,
    projection,
  };
}`,
  );

  source = replaceFunctionBlock(
    source,
    'function productionBidCandidates(state, player, context) {',
    '\n\nfunction mercenaryBidCandidate',
    `function ensureStakeAiDiagnostic(state) {
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

function productionBidCandidates(state, player, context) {
  ensureProductionAuctions(state, context);
  const out = [];
  for (const auction of context.auctions.values()) {
    if (auction.type !== "production_stake") continue;
    const sector = state.productionSectors.find(item => item.id === auction.sectorId);
    if (!sector) continue;
    const diag = stakeSectorDiagnostic(state, sector.id);
    diag.evaluations += 1;
    const estimate = expectedStakeValue(state, player, sector);
    const profile = profileFor(state, player);
    const shadowValue = Math.max(0.25, influenceShadowValue(state, player, profile));
    const maxBid = estimate.capitalUtility > 0
      ? Math.max(0, Math.floor((estimate.capitalUtility - 0.001) / shadowValue))
      : 0;
    if (!maxBid || estimate.actionUtility <= 0) {
      diag.zeroOrLowUtility += 1;
      const inactive = state.players.flatMap(p => p.productionStakes ?? [])
        .filter(stake => stake.sectorId === sector.id && stake.diplomacyInactiveThisGeneration).length;
      if (inactive > 0) diag.zeroOrLowUtilityWithInactiveStake += 1;
      continue;
    }
    const high = highestBid(auction);
    if (high?.playerId === player.id) { diag.alreadyLeadingAuction += 1; continue; }
    const nextBid = (high?.amount ?? 0) + 1;
    const old = auction.bids[player.id]?.amount ?? 0;
    const delta = nextBid - old;
    if (nextBid > maxBid) { diag.nextBidAboveMax += 1; continue; }
    if (delta <= 0) { diag.nonPositiveBidDelta += 1; continue; }
    if (player.influence < delta) { diag.insufficientInfluence += 1; continue; }

    // Only the incremental raise is a new action cost; a previous bid is sunk
    // and already reserved from Influence.
    const score = estimate.actionUtility - delta * shadowValue;
    if (score < V090_CONFIG.actionUtilityFloor) {
      diag.zeroOrLowUtility += 1;
      continue;
    }
    diag.candidatesOffered += 1;
    out.push({
      kind: "auction_bid",
      auction,
      bid: nextBid,
      bidDelta: delta,
      maxBid,
      score,
      stakeUtility: estimate.capitalUtility,
      stakeActionUtility: estimate.actionUtility,
      influenceShadowValue: shadowValue,
      expectedCategory: estimate.category,
      stakeProjection: estimate.projection,
    });
  }
  return out;
}`,
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
  const selected = candidates.sort((a, b) => b.score - a.score)[0] ?? null;

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
  return { ...result, source: patchProductionStakeAI(source), shortCircuit: true };
}
