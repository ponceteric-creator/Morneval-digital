import "./balance-v084.js?v=0.8.5";

const VERSION_FROM = "0.8.4";
const VERSION_TO = "0.8.5";

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
    notice.innerHTML = `<b>v${VERSION_TO}:</b> Every unmet City demand adds +1 to the Squalor target. Squalor still moves by at most 1 per Generation toward that target. Population grows only when local Farms fully feed the city and current Squalor is strictly lower than current Population.`;
  }

  for (const card of root.querySelectorAll(".chart-card")) {
    const heading = card.querySelector("h3");
    if (heading?.textContent?.trim() === "Squalor") {
      const subtitle = card.querySelector(".chart-head span");
      if (subtitle) subtitle.textContent = "Overcrowding + unmet City demand";
    }
  }

  const pressureHeading = [...root.querySelectorAll(".panel h3")]
    .find(node => node.textContent?.trim() === "Raw Food & Imperial pressure");
  const panel = pressureHeading?.closest(".panel");
  if (panel && !panel.querySelector("[data-v085-rule]")) {
    const rule = document.createElement("div");
    rule.className = "prototype-rules";
    rule.style.marginTop = "8px";
    rule.dataset.v085Rule = "true";
    rule.innerHTML = `<b>Squalor / growth:</b> Squalor target = overcrowding + total unmet City demand. Population cannot grow while Squalor ≥ Population, even when local Raw Food is sufficient.`;
    panel.appendChild(rule);
  }
}

function schedulePatch() {
  queueMicrotask(patchRulesText);
  setTimeout(patchRulesText, 0);
}

patchRulesText();
document.addEventListener("click", schedulePatch);
document.addEventListener("change", schedulePatch);
