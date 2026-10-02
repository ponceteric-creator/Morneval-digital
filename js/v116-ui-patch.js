import './v115-ui-patch.js?v=0.11.5';

const VERSION='0.11.6';
const inclinationHistory=new Map();

function patchHistory(root){
  for(const card of root.querySelectorAll('.history-card')){
    const heading=card.querySelector('.history-head h3')?.textContent?.trim() ?? '';
    const match=heading.match(/Generation\s+(\d+)/i);
    if(!match)continue;
    const data=inclinationHistory.get(Number(match[1]));
    if(!data)continue;
    const notes=card.querySelector('.history-notes');
    if(!notes)continue;
    notes.querySelector('[data-v116-inclination-note]')?.remove();
    const c=data.counts;
    notes.insertAdjacentHTML('beforeend',`<br data-v116-inclination-note><span data-v116-inclination-note><b>City Inclination:</b> Temple ${c.temple} vs Scholarium ${c.scholarium} · ${data.labels.religionArcaneBefore} → ${data.labels.religionArcaneAfter}; Military ${c.military} vs Merchant ${c.merchant} · ${data.labels.militaryMercantileBefore} → ${data.labels.militaryMercantileAfter}</span>`);
  }
}

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Intrigue & City Inclination Simulation v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const developmentHeading=[...root.querySelectorAll('[data-v111-development-costs] h3')][0];
  if(developmentHeading)developmentHeading.textContent='Development costs — current test values';
  const notice=root.querySelector('.notice');
  if(notice) notice.innerHTML=`<b>v${VERSION}:</b> Intrigue cards now drive City Inclination at the end of each Generation. Temple vs Scholarium and Military vs Merchant are resolved by relative majority of cards actually played; each axis moves by at most one step, ties do not move, and no minimum threshold applies.`;
  const footer=root.querySelector('.footer-note');
  if(footer) footer.textContent='City Inclination is the final Generation phase. Actions, Reactions, countered cards and stolen cards all count when actually played; stolen cards count for their original Institution deck. Dynasty-member Assassination remains outside simulation until Dynasty Members exist in state.';
  patchHistory(root);
}

window.addEventListener('morneval:inclination-resolved',event=>{
  const detail=event.detail;
  if(detail?.generation!=null)inclinationHistory.set(Number(detail.generation),detail);
});

patch();
document.addEventListener('click',event=>{
  const target=event.target;
  if(target instanceof HTMLElement && target.id==='reset')inclinationHistory.clear();
  setTimeout(patch,0);
});
document.addEventListener('change',()=>setTimeout(patch,0));
