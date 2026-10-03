import * as legacy from './v124-endgame-ai-engine.js?base=0.11.15';

export * from './v124-endgame-ai-engine.js?base=0.11.15';
export const V090_CONFIG = legacy.V090_CONFIG;
export const V125_VERSION = '0.11.16';

function n(value){ return Number(value)||0; }

function servedByPlayer(summary, category){
  const out = new Map();
  for(const report of summary.economyReports ?? []){
    for(const stake of report.servedStakes ?? []){
      if(stake.demandCategory !== category) continue;
      out.set(stake.ownerId, (out.get(stake.ownerId) ?? 0) + 1);
    }
  }
  return out;
}

function applyMarketRewardModel(state, summary){
  const populationServed = servedByPlayer(summary, 'population');
  const externalServed = servedByPlayer(summary, 'external_markets');
  const imperialServed = servedByPlayer(summary, 'imperial');
  const corrections = [];

  for(const player of state.players ?? []){
    const pop = populationServed.get(player.id) ?? 0;
    const ext = externalServed.get(player.id) ?? 0;
    const imp = imperialServed.get(player.id) ?? 0;
    const scoring = (summary.prestigeScoring ?? []).find(row => row.playerId === player.id);

    // Population demand already grants +1 Prestige in the legacy ledger.
    // External demand now grants the same +1 Prestige to the Stake owner.
    if(scoring && ext > 0){
      scoring.entries ??= [];
      scoring.entries.push({ amount: ext, reason: 'external_market_served' });
      scoring.delta = n(scoring.delta) + ext;
      scoring.after = n(scoring.after) + ext;
      player.prestige = n(player.prestige) + ext;
    }

    // Legacy production awards +1 Wealth for every served Stake regardless of destination.
    // Remove that Wealth for Population- and Imperial-served Stakes. Only External-served Stakes retain +1 Wealth.
    const beforeWealth = n(player.wealthCapacity);
    const floorWealth = 1;
    const afterWealth = Math.max(floorWealth, beforeWealth - pop - imp);
    const removedNonExternalWealth = beforeWealth - afterWealth;
    player.wealthCapacity = afterWealth;
    player.wealthGeneratedThisGeneration = afterWealth;

    const commitment = (summary.wealthCommitments ?? []).find(row => row.playerId === player.id);
    if(commitment){
      commitment.gross = afterWealth;
      commitment.available = Math.max(0, afterWealth - n(commitment.committed));
      commitment.shortfall = Math.max(0, n(commitment.committed) - afterWealth);
    }

    corrections.push({
      playerId: player.id,
      populationDemandServed: pop,
      imperialDemandServed: imp,
      externalDemandServed: ext,
      populationPrestige: pop,
      populationWealth: 0,
      imperialPrestige: 0,
      imperialWealth: 0,
      externalPrestige: ext,
      externalWealth: ext,
      wealthBeforeCorrection: beforeWealth,
      nonExternalWealthRemoved: removedNonExternalWealth,
      wealthAfterCorrection: afterWealth,
    });
  }

  summary.prestigeAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, n(player.prestige)]));
  summary.wealthAfter = Object.fromEntries((state.players ?? []).map(player => [player.id, n(player.wealthCapacity)]));
  summary.marketRewardModel = {
    version: V125_VERSION,
    population: { prestigePerServedDemand: 1, wealthPerServedDemand: 0 },
    imperial: { prestigePerServedDemand: 0, wealthPerServedDemand: 0 },
    externalMarkets: { prestigePerServedDemand: 1, wealthPerServedDemand: 1 },
    corrections,
  };
  return corrections;
}

function recomputeFirstPlayer(state, summary){
  const players=[...(state.players ?? [])];
  if(!players.length) return;
  const maxInfluence=Math.max(...players.map(p=>n(p.influence)));
  let finalists=players.filter(p=>n(p.influence)===maxInfluence);
  let tieBreakMethod='influence';
  let maxPrestige=null,maxWealth=null;
  if(finalists.length>1){
    maxPrestige=Math.max(...finalists.map(p=>n(p.prestige)));
    finalists=finalists.filter(p=>n(p.prestige)===maxPrestige);
    tieBreakMethod='prestige';
  }
  if(finalists.length>1){
    maxWealth=Math.max(...finalists.map(p=>n(p.wealthCapacity)));
    finalists=finalists.filter(p=>n(p.wealthCapacity)===maxWealth);
    tieBreakMethod='wealth';
  }
  if(finalists.length>1){
    const previous=summary.firstPlayerResolution?.nextFirstPlayerId ?? summary.nextFirstPlayerId ?? state.firstPlayerId;
    const preserved=finalists.find(p=>p.id===previous);
    finalists=[preserved ?? finalists[0]];
    tieBreakMethod='existing_random_result_preserved';
  }
  state.firstPlayerId=finalists[0]?.id ?? state.firstPlayerId;
  summary.firstPlayerResolution={...(summary.firstPlayerResolution ?? {}),nextFirstPlayerId:state.firstPlayerId,maxInfluence,maxPrestige,maxWealth,tieBreakMethod,correctedForMarketRewards:true};
  summary.nextFirstPlayerId=state.firstPlayerId;
}

export function createV084Game(familyNames=['Valenne',"D'Arcy",'Corven']){
  return legacy.createV084Game(familyNames);
}
export function prepareV111State(state,options={}){
  return typeof legacy.prepareV111State==='function' ? legacy.prepareV111State(state,options) : state;
}
export function resolveAutomatedGeneration(state){
  const summary=legacy.resolveAutomatedGeneration(state);
  applyMarketRewardModel(state,summary);
  recomputeFirstPlayer(state,summary);
  return summary;
}
