import './v115-ui-patch.js?v=0.11.5';

const VERSION='0.11.6';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Intrigue & City Inclination Simulation v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice) notice.innerHTML=`<b>v${VERSION}:</b> Intrigue cards now drive City Inclination at the end of each Generation. Temple vs Scholarium and Military vs Merchant are resolved by relative majority of cards actually played; each axis moves by at most one step, ties do not move, and no minimum threshold applies.`;
  const footer=root.querySelector('.footer-note');
  if(footer) footer.textContent='City Inclination is the final Generation phase. Actions, Reactions, countered cards and stolen cards all count when actually played; stolen cards count for their original Institution deck. Dynasty-member Assassination remains outside simulation until Dynasty Members exist in state.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
