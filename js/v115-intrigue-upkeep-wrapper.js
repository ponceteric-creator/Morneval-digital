import * as legacy from './v115-intrigue-sim-engine.js?core=0.11.5-intrigue1';

export * from './v115-intrigue-sim-engine.js?core=0.11.5-intrigue1';

function activePermanent(state, cardId){
  return (state.intrigue?.inPlay ?? []).some(card => card.cardId === cardId);
}

function removeDestroyedLandImprovements(state){
  const kept=[];
  const removed=[];
  for(const card of state.intrigue?.inPlay ?? []){
    const isImprovement=['gemstone_vein','rare_breed','precious_timber'].includes(card.cardId);
    if(!isImprovement){ kept.push(card); continue; }
    const land=(state.lands ?? []).find(item => item.id === card.targetLandId);
    if(land && land.development === 'natural'){ kept.push(card); continue; }
    removed.push(card);
    state.intrigue.decks.city_guard.removed.push({instanceId:card.instanceId,cardId:card.cardId});
  }
  if(state.intrigue) state.intrigue.inPlay=kept;
  return removed;
}

function withPermanentPreviewModifiers(state, fn){
  const reversions=[];
  if(activePermanent(state,'advanced_architecture') && legacy.V084_CONFIG?.urban){
    const before=legacy.V084_CONFIG.urban.populationPerTile;
    legacy.V084_CONFIG.urban.populationPerTile=4;
    reversions.push(()=>{ legacy.V084_CONFIG.urban.populationPerTile=before; });
  }
  if(activePermanent(state,'advanced_farming_techniques')){
    for(const land of state.lands ?? []){
      if(land.development !== 'farm') continue;
      const before=land.baseCapacity;
      land.baseCapacity=(Number(land.baseCapacity)||0)+1;
      reversions.push(()=>{ land.baseCapacity=before; });
    }
  }
  try { return fn(); }
  finally { for(const revert of reversions.reverse()) revert(); }
}

export function previewEconomy(state){
  return withPermanentPreviewModifiers(state,()=>legacy.previewEconomy(state));
}

export function resolveAutomatedGeneration(state){
  const threshold=Math.max(1,Math.floor(Number(state.city?.influenceErosionThreshold)||15));
  const manualClips=[];
  for(const player of state.players ?? []){
    const before=Math.max(0,Number(player.influence)||0);
    const after=Math.min(threshold,before);
    player.influence=after;
    manualClips.push({playerId:player.id,before,after,lost:before-after,mode:'pre_intrigue_upkeep_clip'});
  }

  // Intrigue Actions occur after the Upkeep ceiling. The underlying legacy engine
  // performs its own Upkeep internally, so temporarily lift that second ceiling
  // to avoid clipping Influence gained/spent by Intrigue (especially Line of Credit).
  const raised=Math.max(threshold,...(state.players ?? []).map(player=>Math.max(0,Number(player.influence)||0)),60);
  state.city.influenceErosionThreshold=raised;
  let summary;
  try { summary=legacy.resolveAutomatedGeneration(state); }
  finally { state.city.influenceErosionThreshold=threshold; }

  const generation=Number(summary?.generation ?? Math.max(0,(Number(state.generation)||1)-1));
  if(summary?.contingencyReserve?.created){
    state.city.contingencyReserveExpiresAfter=generation+1;
  } else if(state.city.contingencyReserveFood>0
      && state.city.contingencyReserveExpiresAfter!=null
      && generation>=state.city.contingencyReserveExpiresAfter
      && !summary?.intrigueReserveConsumed){
    state.city.contingencyReserveFood=0;
    summary.contingencyReserveExpired=true;
  }

  const destroyedImprovements=removeDestroyedLandImprovements(state);
  summary.influenceErosion=manualClips;
  summary.influenceErosionMode='threshold_clip_before_intrigue';
  summary.intrigueDestroyedLandImprovements=destroyedImprovements.map(card=>({cardId:card.cardId,targetLandId:card.targetLandId}));
  summary.intrigueSimulationNotes=[
    'Dynasty-member Assassination and Bodyguards are not simulated until Dynasty Members exist in state.',
    'Preferential Contracts and Private Buyer use approximate economy hooks in v0.11.5.',
    'Civic Sanitation Works reduces final Squalor correctly but its same-generation disease timing remains approximate.'
  ];
  return summary;
}
