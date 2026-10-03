import './v118-ui-patch.js?v=0.11.8';

const VERSION='0.11.13';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Institution Tiers v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> Core Institution Tier rules are now integrated in the complete Intrigue / City Inclination generation stack. Institutions use the same development costs and Prestige rewards as Production Sectors; Tier Renown is I = 0, II = +1, III = +2; Agent Influence is capped at <b>2 / 4 / 8</b> per Family and Institution.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='Institution Prestige is scored once per represented Family, not once per Agent. Additional Agents beyond the Institution Influence cap provide no extra Prestige or Influence; their marginal benefit is additional Intrigue-card access. v0.11.13 fixes the full-stack routing so these v0.11.12 rules are actually applied during complete simulations.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
