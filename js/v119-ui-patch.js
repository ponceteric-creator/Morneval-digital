import './v118-ui-patch.js?v=0.11.8';

const VERSION='0.11.9';

function patch(){
  const root=document.querySelector('#app');
  if(!root)return;
  document.title=`Morneval — Intrigue-aware Agent AI v${VERSION}`;
  const brand=root.querySelector('.brand p');
  if(brand)brand.textContent=`Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice=root.querySelector('.notice');
  if(notice)notice.innerHTML=`<b>v${VERSION}:</b> Agent placement now values the <b>future Intrigue access</b> created by each Institution. Seniority is evaluated as draw 1 / 2 / 3, keep 1, using public board state and known deck composition. The Contrarian no longer receives named-card bonuses (including no special Land Seizure weighting) and no longer retargets Agents after placement.`;
  const footer=root.querySelector('.footer-note');
  if(footer)footer.textContent='Intrigue-aware Agent valuation is an AI simulation heuristic only. It changes no tabletop costs or effects, reads no hidden opponent hands, and uses no card-name-specific strategic multiplier. Political Influence remains all-pay under the v0.11.8 rule.';
}

patch();
document.addEventListener('click',()=>setTimeout(patch,0));
document.addEventListener('change',()=>setTimeout(patch,0));
