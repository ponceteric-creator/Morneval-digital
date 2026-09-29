import "./balance-v100.js?v=0.10.1";

const VERSION_FROM = "0.10.0";
const VERSION_TO = "0.10.1";
const DEFAULT_THRESHOLD = 3;

let cachedOrderModifier = 0;
let cachedImperialDemandThreshold = DEFAULT_THRESHOLD;
let forwardingChange = false;

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeValue?.includes(from)) node.nodeValue = node.nodeValue.replaceAll(from, to);
  }
}

function populationValue(root) {
  return Math.max(1, Math.floor(Number(root.querySelector('[data-city="population"]')?.value) || 1));
}

function baseOrder(population) {
  if (population <= 3) return 3;
  if (population >= 15) return 1;
  return 2;
}

function interventionValue(root) {
  return Math.max(0, Math.floor(Number(root.querySelector('[data-city="imperialIntervention"]')?.value) || 0));
}

function imperialDemand(intervention, threshold) {
  return Math.floor(Math.max(0, intervention) / Math.max(1, threshold));
}

function metric(name, value, marker) {
  return `<div class="metric" data-v101-metric="${marker}"><span class="number">${value}</span><span class="name">${name}</span></div>`;
}

function patchControls(root) {
  const heading = [...root.querySelectorAll('.panel h3')]
    .find(node => node.textContent?.trim() === 'Test controls');
  const panel = heading?.closest('.panel');
  const controls = panel?.querySelector('.v08-controls');
  if (!panel || !controls) return;

  const legacyOrderInput = controls.querySelector('[data-city="order"]');
  if (legacyOrderInput instanceof HTMLInputElement) {
    const field = legacyOrderInput.closest('.field');
    const label = field?.querySelector('label');
    if (label) label.textContent = 'Order modifier (simulation)';
    legacyOrderInput.dataset.city = 'orderModifier';
    legacyOrderInput.min = '-4';
    legacyOrderInput.max = '4';
    legacyOrderInput.value = String(cachedOrderModifier);
  }

  const existingModifier = controls.querySelector('[data-city="orderModifier"]');
  if (existingModifier instanceof HTMLInputElement) {
    existingModifier.value = String(cachedOrderModifier);
  }

  controls.querySelectorAll('[data-v101-threshold-wrap]').forEach(node => node.remove());
  controls.insertAdjacentHTML('beforeend', `
    <div class="field" data-v101-threshold-wrap="true">
      <label>Imperial demand threshold</label>
      <input type="number" min="1" step="1" data-city="imperialDemandThreshold" data-v101-threshold="true" value="${cachedImperialDemandThreshold}">
    </div>
  `);

  const oldRule = [...panel.querySelectorAll('.prototype-rules')]
    .find(node => node.textContent?.includes('Order:'));
  if (oldRule) {
    const html = oldRule.innerHTML;
    const marker = '<b>Order:</b>';
    const index = html.indexOf(marker);
    if (index >= 0) {
      oldRule.innerHTML = `${html.slice(0, index)}${marker} recalculated fresh every Generation: Base Order 3 at Population 1–3, 2 at Population 4–14, and 1 at Population 15+. Any unmet City demand applies −1 once for that Generation. The simulation Order modifier above represents future positive/negative effects without making them persistent damage. Population growth requires final Order ≥ 2.`;
    }
  }
}

function patchCityMetrics(root) {
  const grid = root.querySelector('.city-grid');
  if (!grid) return;
  grid.querySelectorAll('[data-v101-metric]').forEach(node => node.remove());
  const pop = populationValue(root);
  grid.insertAdjacentHTML('beforeend', metric('Base Order', baseOrder(pop), 'base-order'));
}

function patchImperialPanel(root) {
  const heading = [...root.querySelectorAll('.panel h3')]
    .find(node => node.textContent?.trim() === 'Chaos & Imperial pressure');
  const panel = heading?.closest('.panel');
  if (!panel) return;

  const rules = panel.querySelectorAll('.prototype-rules');
  if (rules[0]) {
    rules[0].innerHTML = `<b>Order 0:</b> Chaos cancels Population growth, causes −1 Population where possible, makes every Family lose 20% of current Prestige rounded up, then resets displayed Order to 1. Chaos adds +1 Imperial Intervention.`;
  }

  const intervention = interventionValue(root);
  const demand = imperialDemand(intervention, cachedImperialDemandThreshold);
  if (rules[1]) {
    rules[1].innerHTML = `<b>Imperial Intervention:</b> starts at 0. Every Generation in which Imperial Raw Food aid is required adds +1 Intervention; Chaos also adds +1. Imperial demand per Production Sector = <b>floor(Intervention ÷ threshold)</b>. Current: floor(${intervention} ÷ ${cachedImperialDemandThreshold}) = <b>${demand}</b>. The threshold is editable in Test controls. Unmet Imperial demand retains the existing global −1 Prestige penalty.`;
  }
}

function patchNotice(root) {
  const notice = root.querySelector('.notice');
  if (notice) {
    notice.innerHTML = `<b>v${VERSION_TO}:</b> Order is recalculated from a Population-based baseline each Generation rather than accumulating −1 damage. Population 1–3 has Base Order 3, 4–14 has 2, and 15+ has 1; growth requires final Order ≥ 2. Imperial demand now starts at 0 and scales by a configurable Intervention threshold. Imperial Food aid adds +1 Intervention.`;
  }
}

function patchHistory(root) {
  for (const card of root.querySelectorAll('.history-card')) {
    const orderSpan = [...card.querySelectorAll('.history-grid span')]
      .find(node => node.textContent?.startsWith('Order ·'));
    if (orderSpan) {
      orderSpan.textContent = orderSpan.textContent.replace('Order ·', 'Order recalculated ·');
    }
  }
}

function patchUi() {
  const root = document.querySelector('#app');
  if (!root) return;
  replaceText(root, VERSION_FROM, VERSION_TO);
  patchControls(root);
  patchCityMetrics(root);
  patchImperialPanel(root);
  patchNotice(root);
  patchHistory(root);

  const footer = root.querySelector('.footer-note');
  if (footer) {
    footer.textContent = 'v0.10.1 recalculates Order from a Population-based baseline each Generation and slows Imperial economic pressure. Imperial demand begins at zero; Food aid and Chaos raise Intervention, and the Intervention-to-demand threshold is a live simulation parameter.';
  }
}

function schedulePatch() {
  queueMicrotask(patchUi);
  setTimeout(patchUi, 0);
}

function forwardThresholdChange() {
  const trigger = document.querySelector('[data-city="population"]');
  if (!(trigger instanceof HTMLInputElement)) return;
  forwardingChange = true;
  try {
    trigger.dispatchEvent(new Event('change', { bubbles: true }));
  } finally {
    forwardingChange = false;
  }
}

patchUi();

document.addEventListener('change', event => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    schedulePatch();
    return;
  }

  if (target.dataset.city === 'orderModifier') {
    cachedOrderModifier = Math.max(-4, Math.min(4, Math.floor(Number(target.value) || 0)));
  }

  if (target.dataset.v101Threshold === 'true') {
    cachedImperialDemandThreshold = Math.max(1, Math.floor(Number(target.value) || DEFAULT_THRESHOLD));
    if (!forwardingChange) forwardThresholdChange();
  }

  schedulePatch();
});

document.addEventListener('click', event => {
  const target = event.target;
  if (target instanceof HTMLElement && target.id === 'reset') {
    cachedOrderModifier = 0;
    cachedImperialDemandThreshold = DEFAULT_THRESHOLD;
  }
  schedulePatch();
});
