import * as legacy from './v116-city-inclination-engine.js?base=0.11.6-v118';

export * from './v116-city-inclination-engine.js?base=0.11.6-v118';

const VERSION='0.11.10';
function n(value){return Number(value)||0;}
function clampAxis(value){return Math.max(-2,Math.min(2,Math.trunc(n(value))));}
function sign(value){return value>0?1:value<0?-1:0;}
function label(axis,value){
  const v=clampAxis(value);
  if(axis==='religionArcane')return ({[-2]:'Scholarium II',[-1]:'Scholarium I',[0]:'Neutral',[1]:'Temple I',[2]:'Temple II'})[v];
  return ({[-2]:'Military II',[-1]:'Military I',[0]:'Neutral',[1]:'Merchant I',[2]:'Merchant II'})[v];
}

function applyPoliticalBids(state,summary){
  const base=summary.cityInclination;if(!base)return null;
  const bids=summary.cityInclinationBids?.bidTotals??{};
  const cardCounts=base.counts??{};
  const combined={
    temple:n(cardCounts.temple)+n(bids.temple),
    scholarium:n(cardCounts.scholarium)+n(bids.scholarium),
    military:n(cardCounts.military)+n(bids.military),
    merchant:n(cardCounts.merchant)+n(bids.merchant),
  };
  const before={religionArcane:clampAxis(base.before?.religionArcane),militaryMercantile:clampAxis(base.before?.militaryMercantile)};
  const requestedDelta={
    religionArcane:sign(combined.temple-combined.scholarium),
    militaryMercantile:sign(combined.merchant-combined.military),
  };
  const after={
    religionArcane:clampAxis(before.religionArcane+requestedDelta.religionArcane),
    militaryMercantile:clampAxis(before.militaryMercantile+requestedDelta.militaryMercantile),
  };
  const actualDelta={religionArcane:after.religionArcane-before.religionArcane,militaryMercantile:after.militaryMercantile-before.militaryMercantile};
  state.city.religionArcane=after.religionArcane;state.city.militaryMercantile=after.militaryMercantile;
  const result={
    ...base,
    version:VERSION,
    cardCounts:{...cardCounts},
    counts:combined,
    politicalBids:{...bids},
    combinedTotals:combined,
    before,requestedDelta,actualDelta,after,
    labels:{
      religionArcaneBefore:label('religionArcane',before.religionArcane),
      religionArcaneAfter:label('religionArcane',after.religionArcane),
      militaryMercantileBefore:label('militaryMercantile',before.militaryMercantile),
      militaryMercantileAfter:label('militaryMercantile',after.militaryMercantile),
    },
    rule:'relative_majority_cards_plus_all_pay_political_influence_max_one_step_per_axis',
  };
  summary.cityInclination=result;
  const history=[...(state.history??[])].reverse().find(item=>n(item.generation)===n(summary.generation));
  if(history&&history!==summary)history.cityInclination=JSON.parse(JSON.stringify(result));
  if(typeof window!=='undefined'&&typeof window.dispatchEvent==='function'&&typeof CustomEvent!=='undefined'){
    window.dispatchEvent(new CustomEvent('morneval:inclination-resolved',{detail:JSON.parse(JSON.stringify(result))}));
  }
  return result;
}

export function resolveAutomatedGeneration(state){
  const summary=legacy.resolveAutomatedGeneration(state);
  applyPoliticalBids(state,summary);
  legacy.applyAutoDemand(state);
  return summary;
}
