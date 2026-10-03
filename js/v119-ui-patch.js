import './v118-ui-patch.js?v=0.11.8';

const VERSION='0.11.11';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Structural Renown v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> structural Renown now counts each in-play <b>Permanent Intrigue card that provides +1 Wealth</b> as +1 Renown. Production and Institution tiers remain unchanged: Tier I = 0, Tier II = +1, Tier III = +2. The former simulation-only +1 Renown every 5 Generations placeholder has been removed.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='Renown is recalculated from persistent city state: floor(Population / 2), Production tier increases, Institution tier increases, and qualifying Permanent Wealth Intrigue cards. Ownership changes do not remove city Renown while the Permanent remains in play.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
