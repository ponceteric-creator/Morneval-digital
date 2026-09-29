import "./v090-ui-patch.js?v=0.10.0";

const VERSION_FROM = "0.9.0";
const VERSION_TO = "0.10.0";

let cachedOrder = 2;
let cachedStructuralForce = 0;
let cachedIntervention = 0;
let cachedInstitutionScores = null;
let latestHistorySignature = null;
let forwardingControlChange = false;

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeValue?.includes(from)) node.nodeValue = node.nodeValue.replaceAll(from, to);
  }
}

function currentPopulation(root) {
  return Math.max(1, Math.floor(Number(root.querySelector('[data-city="population"]')?.value) || 1));
}

function currentMilitaryInclination(root) {
  return Math.max(-2, Math.min(2, Math.floor(Number(root.querySelector('[data-axis="militaryMercantile"]')?.value) || 0)));
}

function manpower(population, inclination) {
  const divisors = { [-2]: 2, [-1]: 4, 0: 8, 1: 16, 2: null };
  const divisor = divisors[inclination];
  if (!divisor) return 0;
  return Math.min(4, Math.floor(population / divisor));
}

function syncCachesFromLatestHistory(root) {
  const card = root.querySelector('.history-list .history-card');
  if (!card) return;
  const generation = card.querySelector('.history-head h3')?.textContent?.trim() ?? 'unknown';
  const log = card.querySelector('.action-log')?.textContent ?? '';
  const civic = log.match(/CIVIC STATE\s*—\s*Order\s*(\d+)→(\d+)\s*·\s*Force\s*(\d+)\s*\(Structure\s*(\d+)\s*\+\s*Manpower\s*(\d+)\)\s*·\s*Imperial Intervention\s*(\d+)→(\d+)/);
  if (civic) {
    const signature = `${generation}|${civic[0]}`;
    if (signature !== latestHistorySignature) {
      latestHistorySignature = signature;
      cachedOrder = Number(civic[2]);
      cachedStructuralForce = Number(civic[4]);
      cachedIntervention = Number(civic[7]);
    }
  }
  const institutions = log.match(/INSTITUTIONS\s*—\s*City Guard\s*(\d+)\s*·\s*Temple\s*(\d+)\s*·\s*Merchant Guild\s*(\d+)\s*·\s*Scholarium\s*(\d+)/);
  if (institutions) {
    cachedInstitutionScores = {
      cityGuard: Number(institutions[1]),
      temple: Number(institutions[2]),
      merchantGuild: Number(institutions[3]),
      scholarium: Number(institutions[4]),
      generation,
    };
  }
}

function metric(name, value, marker) {
  return `<div class="metric" data-v100-metric="${marker}"><span class="number">${value}</span><span class="name">${name}</span></div>`;
}

function injectCityMetrics(root) {
  const grid = root.querySelector('.city-grid');
  if (!grid) return;
  grid.querySelectorAll('[data-v100-metric]').forEach(node => node.remove());
  const pop = currentPopulation(root);
  const inclination = currentMilitaryInclination(root);
  const manpowerValue = manpower(pop, inclination);
  const force = cachedStructuralForce + manpowerValue;
  grid.insertAdjacentHTML(
    'beforeend',
    `${metric('Order', cachedOrder, 'order')}${metric('Force', force, 'force')}${metric('Imperial Intervention', cachedIntervention, 'intervention')}`,
  );
}

function injectControls(root) {
  const heading = [...root.querySelectorAll('.panel h3')]
    .find(node => node.textContent?.trim() === 'Test controls');
  const panel = heading?.closest('.panel');
  const controls = panel?.querySelector('.v08-controls');
  if (!panel || !controls) return;

  controls.querySelectorAll('[data-v100-control-wrap]').forEach(node => node.remove());
  controls.insertAdjacentHTML('beforeend', `
    <div class="field" data-v100-control-wrap="order"><label>Order (0–4)</label><input type="number" min="0" max="4" data-city="order" data-v100-control="order" value="${cachedOrder}"></div>
    <div class="field" data-v100-control-wrap="force"><label>Structural Force</label><input type="number" min="0" data-city="force" data-v100-control="force" value="${cachedStructuralForce}"></div>
  `);

  panel.querySelectorAll('[data-v100-civic-rule]').forEach(node => node.remove());
  const pop = currentPopulation(root);
  const incl = currentMilitaryInclination(root);
  const mp = manpower(pop, incl);
  const rule = document.createElement('div');
  rule.className = 'prototype-rules';
  rule.style.marginTop = '8px';
  rule.dataset.v100CivicRule = 'true';
  rule.innerHTML = `<b>Order:</b> starts at 2. Any unmet City demand across the three Production Sectors causes −1 Order once per Generation, regardless of quantity. If no Order loss occurs and Order is below 2, it naturally recovers +1 toward 2. <b>Force:</b> Structural Force + Manpower. Current Manpower = <b>${mp}</b> (cap 4), using Military II Population/2; Military I /4; Neutral /8; Commercial I /16; Commercial II 0. Structural Force is a manual benchmark input until the sequential fortification construction track is parameterised.`;
  panel.appendChild(rule);
}

function patchImperialPressure(root) {
  const heading = [...root.querySelectorAll('.panel h3')]
    .find(node => node.textContent?.trim() === 'Raw Food & Imperial pressure');
  const panel = heading?.closest('.panel');
  if (!panel) return;
  const imperialRule = [...panel.querySelectorAll('.prototype-rules')]
    .find(node => node.textContent?.includes('Imperial demand:'));
  if (imperialRule) {
    imperialRule.innerHTML = `<b>Imperial demand:</b> each non-Food Production Sector requests <b>1 + Imperial Intervention</b> units every Generation. Current Intervention is <b>${cachedIntervention}</b>, so baseline Imperial demand is <b>${1 + cachedIntervention}</b> per Sector. Chaos permanently raises Intervention by +1. Meeting Imperial demand gives no direct reward; if any remains unmet, all Families still lose 1 Prestige.`;
  }
}

function scoreValue(key) {
  return cachedInstitutionScores ? cachedInstitutionScores[key] : '—';
}

function injectInstitutionPanel(root) {
  root.querySelectorAll('[data-v100-institutions]').forEach(node => node.remove());
  const familiesTitle = [...root.querySelectorAll('.section-title')]
    .find(node => node.textContent?.trim() === 'Families');
  if (!familiesTitle) return;

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.style.marginTop = '12px';
  panel.dataset.v100Institutions = 'true';
  const generationLabel = cachedInstitutionScores?.generation
    ? `Latest scoring: ${cachedInstitutionScores.generation}`
    : 'Run a Generation to score Institutions';
  panel.innerHTML = `
    <h3>Major Institutions — Prestige benchmark</h3>
    <div class="history-grid" style="margin-top:8px">
      <div><b>${scoreValue('cityGuard')}</b><span>City Guard</span></div>
      <div><b>${scoreValue('temple')}</b><span>Temple</span></div>
      <div><b>${scoreValue('merchantGuild')}</b><span>Merchant Guild</span></div>
      <div><b>${scoreValue('scholarium')}</b><span>Scholarium</span></div>
    </div>
    <div class="prototype-rules" style="margin-top:8px"><b>${generationLabel}.</b> Institution Prestige is calculated globally every Generation. Family payout is Institution score × number of that Family's Agents. Agent placement is not active in this sandbox yet, so the current Institution values are benchmarked without inventing an Agent-placement rule.</div>
    <div class="prototype-rules" style="margin-top:8px"><b>City Guard:</b> Order component = floor(Order/2), maximum 2; Readiness +1 if Force ≥ ceil(Population/3), +2 if Force ≥ ceil(Population/2); total cap 4. <b>Temple:</b> Religion II +2, Religion I +1; Squalor 0 +2, or Squalor ≤ Population/3 +1; cap 4.</div>
    <div class="prototype-rules" style="margin-top:8px"><b>Merchant Guild:</b> 2 × External demand served − inclination-dependent penalties, floor 0 / cap 4. <b>Scholarium:</b> Tier I→II breakthrough +2; Tier II→III +4; plus permanent Arcane I floor(cumulative Tier increases/4), Arcane II floor(/3); no cap.</div>
  `;
  familiesTitle.insertAdjacentElement('beforebegin', panel);
}

function exposeV100History(root) {
  for (const card of root.querySelectorAll('.history-card')) {
    const notes = card.querySelector('.history-notes');
    const log = card.querySelector('.action-log');
    if (!notes || !log) continue;
    notes.querySelectorAll('[data-v100-history]').forEach(node => node.remove());
    const text = log.textContent ?? '';
    const civic = text.match(/CIVIC STATE\s*—\s*[^\n]+/);
    const institutions = text.match(/INSTITUTIONS\s*—\s*[^\n]+/);
    const chaos = text.match(/CHAOS\s*—\s*[^\n]+/);
    if (!civic && !institutions && !chaos) continue;
    const block = document.createElement('div');
    block.dataset.v100History = 'true';
    block.style.marginTop = '6px';
    block.innerHTML = [civic?.[0], institutions?.[0], chaos?.[0]]
      .filter(Boolean)
      .map(line => `<div>${line}</div>`)
      .join('');
    notes.appendChild(block);
  }
}

function patchUi() {
  const root = document.querySelector('#app');
  if (!root) return;

  replaceText(root, VERSION_FROM, VERSION_TO);
  syncCachesFromLatestHistory(root);

  const notice = root.querySelector('.notice');
  if (notice) {
    notice.innerHTML = `<b>v${VERSION_TO}:</b> Major-Institution Prestige scoring, volatile Order, Force = Structure + inclination-driven Manpower, Chaos and persistent Imperial Intervention are now active. Institution scores are benchmarked independently; Agent placement remains deliberately unimplemented until its action/cost rules are defined.`;
  }

  injectCityMetrics(root);
  injectControls(root);
  patchImperialPressure(root);
  injectInstitutionPanel(root);
  exposeV100History(root);

  const footer = root.querySelector('.footer-note');
  if (footer) {
    footer.textContent = 'v0.10.0 benchmarks the four Major Institutions and civic-stability loop. Chaos cuts every Family’s current Prestige by 20% rounded up, removes 1 Population, blocks growth, raises Imperial Intervention by 1, then resets Order to 1. Events and Agent placement are intentionally deferred.';
  }
}

function schedulePatch() {
  queueMicrotask(patchUi);
  setTimeout(patchUi, 0);
}

function forwardInjectedControlChange(target) {
  if (forwardingControlChange) return;
  if (!(target instanceof HTMLInputElement) || !target.dataset.v100Control) return;

  if (target.dataset.v100Control === 'order') {
    cachedOrder = Math.max(0, Math.min(4, Math.floor(Number(target.value) || 0)));
  } else if (target.dataset.v100Control === 'force') {
    cachedStructuralForce = Math.max(0, Math.floor(Number(target.value) || 0));
  }

  const trigger = document.querySelector('[data-city="population"]');
  if (!(trigger instanceof HTMLInputElement)) return;
  forwardingControlChange = true;
  try {
    trigger.dispatchEvent(new Event('change', { bubbles: true }));
  } finally {
    forwardingControlChange = false;
  }
}

patchUi();
document.addEventListener('click', event => {
  if (event.target instanceof HTMLElement && event.target.id === 'reset') {
    cachedOrder = 2;
    cachedStructuralForce = 0;
    cachedIntervention = 0;
    cachedInstitutionScores = null;
    latestHistorySignature = null;
  }
  schedulePatch();
});
document.addEventListener('change', event => {
  if (!forwardingControlChange) forwardInjectedControlChange(event.target);
  schedulePatch();
});
