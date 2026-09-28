import "./v089-ui-patch.js?v=0.9.0";

const VERSION_FROM = "0.8.9";
const VERSION_TO = "0.9.0";
const PERSONALITIES = [
  { label: "Dynast", text: "short-horizon · Prestige weighted" },
  { label: "Merchant", text: "long-horizon · Wealth & engine weighted" },
  { label: "Opportunist", text: "adaptive · shifts with relative position and city pressure" },
];

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeValue?.includes(from)) node.nodeValue = node.nodeValue.replaceAll(from, to);
  }
}

function patchUi() {
  const root = document.querySelector("#app");
  if (!root) return;

  replaceText(root, VERSION_FROM, VERSION_TO);

  const notice = root.querySelector(".notice");
  if (notice) {
    notice.innerHTML = `<b>v${VERSION_TO}:</b> The three automated Families now use different economic personalities and multi-Generation valuation. Dynast weights short-term Prestige, Merchant weights Wealth and durable engines, and Opportunist adapts to relative position and city pressure. Civic Farms are built only against a concrete Raw Food target; expansion remains political.`;
  }

  root.querySelectorAll(".family-card").forEach((card, index) => {
    card.querySelectorAll("[data-v090-personality]").forEach(node => node.remove());
    const profile = PERSONALITIES[index % PERSONALITIES.length];
    const line = document.createElement("div");
    line.className = "land-score-preview";
    line.dataset.v090Personality = "true";
    line.innerHTML = `<b>AI personality: ${profile.label}</b> · ${profile.text}`;
    const heading = card.querySelector("h3");
    if (heading) heading.insertAdjacentElement("afterend", line);
    else card.prepend(line);
  });

  for (const span of root.querySelectorAll(".history-grid span")) {
    if (span.textContent?.startsWith("Local raw Food · Imperial aid")) {
      span.textContent = span.textContent.replace(
        "Local raw Food · Imperial aid",
        "Raw Food consumed / capacity · Imperial aid",
      );
    }
  }

  const pressureHeading = [...root.querySelectorAll(".panel h3")]
    .find(node => node.textContent?.trim() === "Raw Food & Imperial pressure");
  const pressurePanel = pressureHeading?.closest(".panel");
  if (pressurePanel) {
    pressurePanel.querySelectorAll("[data-v090-ai-rule]").forEach(node => node.remove());
    const rule = document.createElement("div");
    rule.className = "prototype-rules";
    rule.style.marginTop = "8px";
    rule.dataset.v090AiRule = "true";
    rule.innerHTML = `<b>AI Food target:</b> normally equal to current Population. The AI only plans +1 extra Raw Food need when local Food already covers Population, Squalor allows growth, and Urban capacity has room. This prevents speculative Farm conversion purely for the +3 Prestige reward.`;
    pressurePanel.appendChild(rule);
  }

  const footer = root.querySelector(".footer-note");
  if (footer) {
    footer.textContent = "v0.9.0 tests three differentiated Families with 2–4 Generation planning horizons. Wealth is valued as future action capacity, productive land as a durable engine, and Civic Farms as public infrastructure rather than recurring private scoring.";
  }
}

function schedulePatch() {
  queueMicrotask(patchUi);
  setTimeout(patchUi, 0);
}

patchUi();
document.addEventListener("click", schedulePatch);
document.addEventListener("change", schedulePatch);
