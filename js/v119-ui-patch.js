import './v118-ui-patch.js?v=0.11.8';

const VERSION='0.11.14';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Institution Prestige v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> recurring Institution Prestige is now capped by Institution Tier at <b>2 / 4 / 8</b>. Generation-specific transient Prestige events are added after the cap. Each active Scholarium Patent adds <b>+1</b> to the Scholarium's recurring Institution score; Scholarium Breakthrough Prestige remains outside the cap.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='Institution Prestige is scored once per represented Family. Structural/recurrent score is capped by Tier I/II/III at 2/4/8; explicitly transient event Prestige is uncapped. Active Patents contribute +1 each to the structural Scholarium score.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
