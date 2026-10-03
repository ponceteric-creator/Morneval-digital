import './v118-ui-patch.js?v=0.11.8';

const VERSION='0.11.15';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Endgame & Scholarium AI v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> the locked endgame trigger is now <b>12 structural Renown</b>, checked at the end of a Generation. The trigger opens the endgame rather than ending the game immediately. Automated Families now understand more of the Scholarium's forward value: active Patents, future Patent access and near-term uncapped Breakthrough Prestige.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='Scholarium AI changes are valuation-only: they grant no resources or scoring bonus. Patents remain permanent +1 Wealth improvements, +1 city Renown and +1 recurring Scholarium structural score; Breakthrough Prestige remains transient and outside the Institution Tier cap.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
