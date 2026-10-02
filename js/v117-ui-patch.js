import './v116-ui-patch.js?v=0.11.6c';

const VERSION = '0.11.7';

function patch() {
  const root = document.querySelector('#app');
  if (!root) return;
  document.title = `Morneval — Contrarian AI Simulation v${VERSION}`;
  const brand = root.querySelector('.brand p');
  if (brand) brand.textContent = `Institutions & civic stability sandbox · Engine v${VERSION}`;
  const notice = root.querySelector('.notice');
  if (notice) notice.innerHTML = `<b>v${VERSION}:</b> the default third AI family is now the <b>Contrarian</b>. It receives no resource bonus: it reads visible concentrations of land, Stakes, Agents and patents, evaluates the known Intrigue decks, and prepares access to under-contested Institutions whose cards can exploit those positions. Example: concentrated rival land raises the future value of Military / City Guard access through Land Seizure.`;
  const footer = root.querySelector('.footer-note');
  if (footer) footer.textContent = 'Contrarian planning uses public board state and known deck composition only; opponents’ hidden Intrigue hands are ignored. Agent placements still consume the normal action and Wealth commitment. City Inclination resolution remains unchanged from v0.11.6.';
}

patch();
document.addEventListener('click', () => setTimeout(patch, 0));
document.addEventListener('change', () => setTimeout(patch, 0));
