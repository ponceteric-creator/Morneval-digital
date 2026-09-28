import "./balance-v084.js?v=0.8.7.1";

const VERSION_FROM = "0.8.4";
const VERSION_TO = "0.8.7.1";

function replaceVersionText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeValue?.includes(VERSION_FROM)) {
      node.nodeValue = node.nodeValue.replaceAll(VERSION_FROM, VERSION_TO);
    }
  }
}

function patchRulesText() {
  const root = document.querySelector("#app");
  if (!root) return;

  replaceVersionText(root);

  const notice = root.querySelector(".notice");
  if (notice) {
    notice.innerHTML = `<b>v${VERSION_TO}:</b> Refined Food is removed from the Production economy. Farms produce Raw Food only for Population subsistence. Market demand now exists only for Textiles, Smithing and Construction Materials. Squalor remains a direct calculation: overcrowding + total unmet City demand.`;
  }

  for (const card of root.querySelectorAll(".chart-card")) {
    const heading = card.querySelector("h3");
    if (heading?.textContent?.trim() === "Squalor") {
      const subtitle = card.querySelector(".chart-head span");
      if (subtitle) subtitle.textContent = "Direct: overcrowding + unmet City demand";
    }
    if (heading?.textContent?.trim() === "Raw-material production") {
      const latest = card.querySelector(".chart-latest");
      if (latest) latest.textContent = "Raw Food is Farm output used only for Population subsistence. Wool, Ore and Wood feed the three refinement Sectors.";
    }
  }

  for (const span of root.querySelectorAll(".history-grid span")) {
    if (span.textContent?.startsWith("Squalor · target ")) {
      span.textContent = span.textContent.replace("Squalor · target ", "Squalor · direct calculation ");
    }
  }

  const pressureHeading = [...root.querySelectorAll(".panel h3")]
    .find(node => node.textContent?.trim() === "Raw Food & Imperial pressure");
  const panel = pressureHeading?.closest(".panel");
  if (panel) {
    pressureHeading.textContent = "Raw Food & Imperial pressure";
    const rules = panel.querySelectorAll(".prototype-rules");
    if (rules[0]) {
      const local = rules[0].textContent?.match(/Farms currently produce ([0-9]+) raw Food for ([0-9]+) Population need/);
      const capacity = local?.[1] ?? "current";
      const need = local?.[2] ?? "current";
      rules[0].innerHTML = `<b>Subsistence:</b> Farms currently produce ${capacity} Raw Food for ${need} Population need. Raw Food is used only to feed Population; it never enters a Production Sector and has no City, Imperial or External market demand. Missing Food is supplied by the Empire; if any aid is used, all Families lose 1 Prestige, minimum 0, and Population does not grow.`;
    }
    panel.querySelectorAll("[data-v085-rule],[data-v086-rule],[data-v087-rule]").forEach(node => node.remove());
    const rule = document.createElement("div");
    rule.className = "prototype-rules";
    rule.style.marginTop = "8px";
    rule.dataset.v087Rule = "true";
    rule.innerHTML = `<b>Squalor / growth:</b> Squalor = overcrowding + total unmet City demand, recalculated immediately each Generation. Population cannot grow while Squalor ≥ Population, even when local Raw Food is sufficient.`;
    panel.appendChild(rule);
  }

  const sectorTitle = [...root.querySelectorAll(".section-title")]
    .find(node => node.textContent?.trim() === "Production Sectors & Refinement");
  if (sectorTitle) sectorTitle.textContent = "Production Sectors & Refinement — non-Food only";

  const footer = root.querySelector(".footer-note");
  if (footer) {
    footer.textContent = "The current AI treats exploration and Farm conversion as economic actions. Farms are created only to close a Raw Food subsistence deficit; they have no market-demand chain. Terrain revealed by exploration remains random.";
  }
}

function schedulePatch() {
  queueMicrotask(patchRulesText);
  setTimeout(patchRulesText, 0);
}

patchRulesText();
document.addEventListener("click", schedulePatch);
document.addEventListener("change", schedulePatch);
