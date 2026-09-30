import "./v110-ui-patch.js?v=0.11.1-base";

const VERSION_TO = "0.11.1";
const DEFAULT_INFLUENCE_CEILING = 15;
let defaultInfluenceCeilingApplied = false;

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeValue?.includes(from)) node.nodeValue = node.nodeValue.replaceAll(from, to);
  }
}

function initializeInfluenceCeiling(root) {
  const input = root.querySelector('[data-v110-influence-threshold="true"]');
  if (!(input instanceof HTMLInputElement)) return;
  const field = input.closest('.field');
  const label = field?.querySelector('label');
  if (label) label.textContent = 'Influence ceiling (Upkeep)';

  if (!defaultInfluenceCeilingApplied) {
    defaultInfluenceCeilingApplied = true;
    if (Number(input.value) !== DEFAULT_INFLUENCE_CEILING) {
      input.value = String(DEFAULT_INFLUENCE_CEILING);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
  }
}

function patchTestRules(root) {
  const heading = [...root.querySelectorAll('.panel h3')]
    .find(node => node.textContent?.trim() === 'Test controls');
  const panel = heading?.closest('.panel');
  const rules = panel?.querySelector('.prototype-rules');
  if (!rules) return;
  rules.innerHTML = `<b>Influence:</b> each Family starts with <b>15 Influence</b>. At Upkeep there is no passive −1 erosion; Influence is only clipped to the test ceiling: <b>Influence = min(current Influence, ceiling)</b>. Agents remain the recurring source of Influence. <b>Wealth:</b> one deployed Agent reserves exactly 1 Wealth; there is no additional AI liquidity requirement.`;
}

function patchInstitutionRules(root) {
  const rules = [...root.querySelectorAll('.prototype-rules')]
    .find(node => node.textContent?.includes('Institution payout:'));
  if (!rules) return;
  rules.innerHTML = `<b>Institution payout:</b> Institution Prestige × that Family's Agents. Each deployed Agent reserves exactly <b>1 Wealth</b>. An Agent may be placed whenever that 1 Wealth is available; the former simulation rule requiring a second Wealth to remain liquid has been removed. Agents age during Upkeep (1→2→3→3), are force-recalled there only when carried Wealth capacity can no longer support them, and generate Influence equal to current seniority during Phase 6.`;
}

function patchDevelopmentRules(root) {
  replaceText(root, ' + 0W', '');
  replaceText(root, '3 Influence + 1 Wealth capacity', 'Domain track Influence; no Wealth cost');

  const hinterlandHeading = [...root.querySelectorAll('h2.section-title')]
    .find(node => node.textContent?.trim() === 'Hinterland exploration');
  const hinterlandPanel = hinterlandHeading?.nextElementSibling;
  const hinterlandRule = hinterlandPanel?.querySelector('.prototype-rules');
  if (hinterlandRule) {
    hinterlandRule.innerHTML = `<b>Explore / acquire a territory:</b> no Wealth cost. The Influence cost is the next visible Domain value on the Family board: <b>1 / 2 / 4 / 6 / 9 / 12 / 15</b> for the 1st / 2nd / 3rd / 4th / 5th / 6th / 7th+ currently controlled territory. When a territory stops being privately controlled, the Family drops back on this track. <b>Civic Farm:</b> 2 Influence, 0 Wealth, +3 Prestige; the converted territory becomes public.`;
  }

  const productionHeading = [...root.querySelectorAll('h2.section-title')]
    .find(node => node.textContent?.trim() === 'Production Sectors & Refinement');
  if (productionHeading && !root.querySelector('[data-v111-development-costs]')) {
    productionHeading.insertAdjacentHTML('afterend', `
      <section class="panel" style="margin-bottom:12px" data-v111-development-costs="true">
        <h3>Development costs — v0.11.1 test values</h3>
        <div class="prototype-rules"><b>No development spends Wealth.</b> Tier I→II uses three phases: <b>2I→4P · 2I→3P · 2I→2P + Tier II</b>. Tier II→III doubles the investment scale: <b>4I→8P · 4I→6P · 4I→4P + Tier III</b>. The higher early Prestige compensates for the longer wait before the structural Tier benefit becomes usable.</div>
      </section>
    `);
  }
}

function patchNotice(root) {
  const notice = root.querySelector('.notice');
  if (notice) {
    notice.innerHTML = `<b>v${VERSION_TO}:</b> development-cost rebalance. Starting Influence is 15; Upkeep only clips Influence to the adjustable ceiling and no longer applies passive erosion. Exploration and Civic Farm conversion no longer spend Wealth. Territory acquisition follows the escalating Domain track 1/2/4/6/9/12/15 Influence. Production development is 2I per phase for Tier II (4/3/2 Prestige) and 4I per phase for Tier III (8/6/4 Prestige). The AI Agent liquidity reserve has been removed: an Agent only needs the 1 Wealth it actually reserves.`;
  }
  const footer = root.querySelector('.footer-note');
  if (footer) footer.textContent = 'v0.11.1 tests the Influence-only development economy and escalating Domain costs. Intrigue cards remain intentionally unimplemented; the temporary +1 Renown every 5 completed Generations remains simulation scaffolding.';
}

function patchUi() {
  const root = document.querySelector('#app');
  if (!root) return;
  document.title = 'Morneval — Influence Development Economy v0.11.1';
  replaceText(root, '0.11.0', VERSION_TO);
  initializeInfluenceCeiling(root);
  patchTestRules(root);
  patchInstitutionRules(root);
  patchDevelopmentRules(root);
  patchNotice(root);
}

function schedulePatch() {
  queueMicrotask(patchUi);
  setTimeout(patchUi, 0);
}

patchUi();

document.addEventListener('change', schedulePatch);
document.addEventListener('click', event => {
  const target = event.target;
  if (target instanceof HTMLElement && target.id === 'reset') {
    defaultInfluenceCeilingApplied = false;
  }
  schedulePatch();
});
