import './v111-ui-patch.js?v=0.11.5-base';

const VERSION='0.11.5';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Intrigue Simulation v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice) notice.innerHTML=`<b>v${VERSION}:</b> active Intrigue decks are now simulated. Agents draw/keep by seniority with contextual AI valuation; Actions spend Influence and resolve before the legacy action planner; Reactions defend against simulated Intrigue attacks; Patents and land enhancements enter play and can change ownership; Contingency Reserves can prevent one Food shortage before Imperial Aid. Dynasty-member Assassination remains outside the simulation until Dynasty Members exist in state.`;
  const footer=root.querySelector('.footer-note');
  if(footer) footer.textContent='Intrigue telemetry is recorded in each generation summary: cards seen/kept/played, LOW/MID/HIGH mix, dead draws, reactions, permanents, patent transfers and reserve use. Preferential Contracts and Private Buyer are currently simulation approximations; Dynasty targets are not simulated.';
}

patch();
document.addEventListener('click',()=>queueMicrotask(patch));
document.addEventListener('change',()=>queueMicrotask(patch));
