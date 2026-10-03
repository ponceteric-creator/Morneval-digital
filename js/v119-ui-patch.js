import './v118-ui-patch.js?v=0.11.8';

const VERSION='0.11.16';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Market Rewards v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> demand rewards are now destination-specific: Population demand gives <b>+1 Prestige / 0 Wealth</b>; Imperial demand gives <b>0 / 0</b>; External Market demand gives <b>+1 Prestige / +1 Wealth</b>. The endgame trigger remains locked at <b>12 structural Renown</b>.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='Scholarium AI uses the tuned strategic valuation for Patents and Breakthroughs. The demand-reward change is a balance test intended to make the Mercantile route a credible alternative without changing demand priority rules.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
