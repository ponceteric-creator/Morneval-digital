import './v118-ui-patch.js?v=0.11.8';

const VERSION='0.11.17';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Base Wealth Test v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> active balance test: each Family now has <b>2 base Wealth capacity</b> instead of 1. Demand rewards remain Population <b>+1 Prestige / 0 Wealth</b>, Imperial <b>0 / 0</b>, External Market <b>+1 Prestige / +1 Wealth</b>. Endgame trigger remains <b>12 structural Renown</b>.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='Base Wealth 2 is currently a balance-test hypothesis. All other v0.11.16 market-reward, Institution Tier, Scholarium and 12-Renown trigger rules remain unchanged.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
