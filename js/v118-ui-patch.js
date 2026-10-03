import './v117-ui-patch.js?v=0.11.7';

const VERSION='0.11.8';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Political City Inclination Simulation v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> Families may now spend <b>1 Influence as one normal action</b> to support Military, Merchant, Temple or Scholarium in the end-of-Generation City Inclination resolution. Political Influence is <b>all-pay</b>: every bid is spent immediately and is never refunded, including losing bids and ties. Intrigue cards played and Political Influence bids each count as one point.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='City Inclination compares Intrigue cards played + Political Influence bids on each axis. Strict majority moves the axis one step; ties do not move it; maximum movement remains one step per axis per Generation. The simulation AI uses a bidding heuristic, but the tabletop rule has no bid cap.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
