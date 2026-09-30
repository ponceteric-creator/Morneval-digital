import "./balance-v100.js?v=0.11.0-core";

const VERSION_TO = "0.11.0";
const DEFAULT_INFLUENCE_THRESHOLD = 12;
const DEFAULT_IMPERIAL_THRESHOLD = 3;
let cachedInfluenceThreshold = DEFAULT_INFLUENCE_THRESHOLD;
let cachedImperialThreshold = DEFAULT_IMPERIAL_THRESHOLD;
let forwardingChange = false;

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeValue?.includes(from)) node.nodeValue = node.nodeValue.replaceAll(from, to);
  }
}

function patchControls(root) {
  const heading = [...root.querySelectorAll('.panel h3')]
    .find(node => node.textContent?.trim() === 'Test controls');
  const panel = heading?.closest('.panel');
  const controls = panel?.querySelector('.v08-controls');
  if (!panel || !controls) return;

  const orderInput = controls.querySelector('[data-city="order"]');
  if (orderInput instanceof HTMLInputElement) {
    const field = orderInput.closest('.field');
    const label = field?.querySelector('label');
    if (label) label.textContent = 'Order modifier (simulation)';
    orderInput.dataset.city = 'orderModifier';
    orderInput.min = '-4';
    orderInput.max = '4';
    orderInput.value = '0';
  }

  const renownInput = controls.querySelector('[data-city="renown"]');
  if (renownInput instanceof HTMLInputElement) {
    const field = renownInput.closest('.field');
    const label = field?.querySelector('label');
    if (label) label.textContent = 'Renown (structural — read only)';
    renownInput.disabled = true;
    renownInput.removeAttribute('data-city');
  }

  controls.querySelectorAll('[data-v110-extra-control]').forEach(node => node.remove());
  controls.insertAdjacentHTML('beforeend', `
    <div class="field" data-v110-extra-control="influence">
      <label>Influence erosion threshold</label>
      <input type="number" min="1" step="1" data-city="influenceErosionThreshold" data-v110-influence-threshold="true" value="${cachedInfluenceThreshold}">
    </div>
    <div class="field" data-v110-extra-control="imperial">
      <label>Imperial demand threshold</label>
      <input type="number" min="1" step="1" data-city="imperialDemandThreshold" data-v110-imperial-threshold="true" value="${cachedImperialThreshold}">
    </div>
  `);

  const rules = panel.querySelector('.prototype-rules');
  if (rules) {
    rules.innerHTML = `<b>Turn timing:</b> Upkeep applies pending Population growth, recalculates structural Renown, applies Influence erosion, ages Agents/Stakes, checks Agent Wealth support, then reserves contract-maintenance bids. Influence erosion is <b>min(threshold, Influence − 1)</b> with a floor of 0; there is no hard Influence cap.`;
  }
}

function patchRenown(root) {
  for (const card of root.querySelectorAll('.chart-card')) {
    if (card.querySelector('h3')?.textContent?.trim() !== 'Renown') continue;
    const subtitle = card.querySelector('.chart-head span');
    if (subtitle) subtitle.textContent = 'floor(Population ÷ 2) + Production tiers + Institution tiers + temporary +1 / 5 completed Generations';
  }
}

function patchImperial(root) {
  const heading = [...root.querySelectorAll('.panel h3')]
    .find(node => node.textContent?.trim() === 'Chaos & Imperial pressure');
  const panel = heading?.closest('.panel');
  if (!panel) return;
  const rules = panel.querySelectorAll('.prototype-rules');
  if (rules[0]) {
    rules[0].innerHTML = `<b>Civil Disorder:</b> identified during City Evolution when calculated Order reaches 0, then resolved immediately in its own phase: −20% current Prestige (round up), −1 Population where possible, +1 Imperial Intervention, Order resets to 1, and any pending growth marker is cancelled.`;
  }
  if (rules[1]) {
    rules[1].innerHTML = `<b>Imperial pressure:</b> Imperial production demand per sector = floor(Intervention ÷ threshold). Imperial Raw Food aid is automatic during City Evolution when local food is short; it adds +1 Intervention and queues its Prestige penalty for the <b>next</b> Prestige & Influence Scoring phase.`;
  }
  if (!panel.nextElementSibling?.matches?.('[data-v110-sequence]')) {
    panel.insertAdjacentHTML('afterend', `
      <section class="panel" style="margin-top:12px" data-v110-sequence="true">
        <h3>Generation sequence & Mercenary Contract</h3>
        <div class="prototype-rules"><b>Sequence:</b> 1 Upkeep → 2 Event → 3 Player Actions → 4 Auction Resolution → 5 Economy Resolution → 6 Prestige & Influence Scoring → 7 City Evolution → 8 Civil Disorder Resolution → 9 Wealth Recalculation → 10 First Player.</div>
        <div class="prototype-rules" style="margin-top:8px"><b>Mercenary Contract:</b> one contract citywide. The previous holder reserves a 1-Influence maintenance bid during Upkeep. Challengers bid during normal actions; every bid consumes one action and reserved Influence is unavailable elsewhere. At resolution invalid bids are ignored and refunded; only the highest valid bidder pays. Eligibility requires a City Guard Agent. If, after feeding the Population, 1 Raw Food remains, the contract consumes it and generates +1 Wealth for its holder at Wealth Recalculation.</div>
      </section>
    `);
  }
}

function patchInstitutionRules(root) {
  const rules = [...root.querySelectorAll('.prototype-rules')]
    .find(node => node.textContent?.includes('Institution payout:'));
  if (rules) {
    rules.innerHTML = `<b>Institution payout:</b> Institution Prestige × that Family's Agents. Agents reserve 1 Wealth while deployed. Agents age during Upkeep (1→2→3→3), are force-recalled there only if the Family's carried Wealth capacity cannot support them, and generate Influence equal to current seniority during Phase 6. Newly placed Agents score and generate 1 Influence immediately in the same Generation. AI keeps 1 Wealth liquid before voluntary Agent placement; that liquidity reserve is a simulation heuristic, not a tabletop rule.`;
  }
  replaceText(root, 'institution test Agents', 'Institution Agents');
}

function patchNotice(root) {
  const notice = root.querySelector('.notice');
  if (notice) {
    notice.innerHTML = `<b>v${VERSION_TO}:</b> full Generation timing refactor, universal reserved-Influence auctions, Mercenary Contract, soft-cap Influence erosion, Upkeep ageing/support, Economy-before-Prestige scoring, delayed City-Evolution Prestige modifiers, Disease-before-Order, pending Population growth, dedicated Civil Disorder resolution, and structural Renown with External Demand = floor(Renown ÷ 4). Intrigue cards remain intentionally unimplemented.`;
  }
  const footer = root.querySelector('.footer-note');
  if (footer) footer.textContent = 'v0.11.0 implements the agreed Generation sequence and non-Intrigue systems. The +1 Renown every 5 completed Generations is simulation-only scaffolding until permanent Intrigue Improvements are implemented.';
}

function patchHistory(root) {
  for (const card of root.querySelectorAll('.history-card')) {
    const spans = [...card.querySelectorAll('.history-grid span')];
    const renown = spans.find(node => node.textContent?.startsWith('Renown ·'));
    if (renown) renown.textContent = 'Renown · structural Upkeep recalculation';
    const order = spans.find(node => node.textContent?.startsWith('Order ·'));
    if (order) order.textContent = order.textContent.replace('Order ·', 'Order · Disease resolved first ·');
    const food = spans.find(node => node.textContent?.startsWith('Raw Food consumed'));
    if (food) food.textContent = food.textContent.replace('Raw Food consumed / capacity', 'Population Raw Food / local capacity');
  }
}

function patchUi() {
  const root = document.querySelector('#app');
  if (!root) return;
  replaceText(root, '0.10.0', VERSION_TO);
  replaceText(root, '0.10.2', VERSION_TO);
  patchControls(root);
  patchRenown(root);
  patchImperial(root);
  patchInstitutionRules(root);
  patchNotice(root);
  patchHistory(root);
}

function schedulePatch() {
  queueMicrotask(patchUi);
  setTimeout(patchUi, 0);
}

function forwardChange() {
  const trigger = document.querySelector('[data-city="population"]');
  if (!(trigger instanceof HTMLInputElement)) return;
  forwardingChange = true;
  try { trigger.dispatchEvent(new Event('change', { bubbles: true })); }
  finally { forwardingChange = false; }
}

patchUi();

document.addEventListener('change', event => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.dataset.v110InfluenceThreshold === 'true') {
    cachedInfluenceThreshold = Math.max(1, Math.floor(Number(target.value) || DEFAULT_INFLUENCE_THRESHOLD));
    if (!forwardingChange) forwardChange();
  }
  if (target instanceof HTMLInputElement && target.dataset.v110ImperialThreshold === 'true') {
    cachedImperialThreshold = Math.max(1, Math.floor(Number(target.value) || DEFAULT_IMPERIAL_THRESHOLD));
    if (!forwardingChange) forwardChange();
  }
  schedulePatch();
});

document.addEventListener('click', event => {
  const target = event.target;
  if (target instanceof HTMLElement && target.id === 'reset') {
    cachedInfluenceThreshold = DEFAULT_INFLUENCE_THRESHOLD;
    cachedImperialThreshold = DEFAULT_IMPERIAL_THRESHOLD;
  }
  schedulePatch();
});
