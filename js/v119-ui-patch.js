import './v118-ui-patch.js?v=0.11.8';

const VERSION='0.11.10';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Intrigue-aware Agent AI v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> Agent utility is now normalized across <b>Institution / future Influence / Intrigue access</b>. Baseline weighting is 40% / 30% / 30%, with personality-specific mixes and diminishing returns on large Agent networks. Intrigue access still uses draw 1 / 2 / 3, keep 1 and no named-card strategic bonuses.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='Normalized Agent valuation is an AI simulation heuristic only. Dynast weights Institution prestige more, Merchant weights future Influence more but has stronger network diminishing returns, and Contrarian weights Intrigue option value more. No tabletop costs or effects are changed.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
