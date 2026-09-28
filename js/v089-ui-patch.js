import "./v088-ui-patch.js?v=0.8.9";

const VERSION_FROM = "0.8.8";
const VERSION_TO = "0.8.9";

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.nodeValue?.includes(from)) node.nodeValue = node.nodeValue.replaceAll(from, to);
  }
}

function exposeVoteSummaries(root) {
  for (const card of root.querySelectorAll(".history-card")) {
    const notes = card.querySelector(".history-notes");
    const actionLog = card.querySelector(".action-log");
    if (!notes || !actionLog || notes.querySelector("[data-v089-vote-summary]")) continue;

    const firstActionHtml = actionLog.innerHTML.split("<br>")[0] ?? "";
    const firstActionText = firstActionHtml
      .replace(/<[^>]*>/g, "")
      .replace(/^\s*1\.\s*/, "")
      .trim();
    if (!firstActionText.startsWith("Civic expansion vote")) continue;

    const line = document.createElement("div");
    line.dataset.v089VoteSummary = "true";
    line.style.marginTop = "6px";
    line.innerHTML = `<b>Civic vote:</b> ${firstActionText.replace(/^Civic expansion vote\s*—\s*/, "")}`;
    notes.appendChild(line);
  }
}

function patchUi() {
  const root = document.querySelector("#app");
  if (!root) return;

  replaceText(root, VERSION_FROM, VERSION_TO);

  const notice = root.querySelector(".notice");
  if (notice) {
    notice.innerHTML = `<b>v${VERSION_TO}:</b> Urban expansion is no longer automatic. When Population reaches or exceeds Urban capacity, an AI Family may propose one civic expansion vote. Every voting Family has 1 base vote and may spend Influence to strengthen YES or NO. Ties fail. At most one Urban tile can be added per Generation.`;
  }

  const pressureHeading = [...root.querySelectorAll(".panel h3")]
    .find(node => node.textContent?.trim() === "Raw Food & Imperial pressure");
  const pressurePanel = pressureHeading?.closest(".panel");
  if (pressurePanel && !pressurePanel.querySelector("[data-v089-expansion-rule]")) {
    const rule = document.createElement("div");
    rule.className = "prototype-rules";
    rule.style.marginTop = "8px";
    rule.dataset.v089ExpansionRule = "true";
    rule.innerHTML = `<b>Civic expansion vote:</b> available when Population ≥ Urban capacity. One Family proposes and commits Influence to YES; every Family then has 1 base vote plus any Influence it spends. YES must strictly exceed NO. Only one expansion vote can occur per Generation, and automatic expansion is disabled.`;
    pressurePanel.appendChild(rule);
  }

  const hinterlandHeading = [...root.querySelectorAll(".section-title")]
    .find(node => node.textContent?.trim() === "Hinterland exploration");
  if (hinterlandHeading) {
    const infoPanel = hinterlandHeading.nextElementSibling;
    if (infoPanel?.classList.contains("panel")) {
      const rules = [...infoPanel.querySelectorAll(".prototype-rules")];
      const expansionRule = rules.find(node => node.textContent?.includes("City expansion:"));
      if (expansionRule) {
        expansionRule.innerHTML = `<b>City expansion:</b> no longer automatic. If a civic expansion vote passes, Morneval absorbs exactly one tile: the oldest explored non-urban territory. Ownership and raw production are lost without compensation.`;
      }
    }
  }

  exposeVoteSummaries(root);

  const footer = root.querySelector(".footer-note");
  if (footer) {
    footer.textContent = "v0.8.9 isolates urban growth as a political choice. AI Families compare civic benefits with lost private production and Food security, and spend Influence in the expansion vote when the issue matters enough.";
  }
}

function schedulePatch() {
  queueMicrotask(patchUi);
  setTimeout(patchUi, 0);
}

patchUi();
document.addEventListener("click", schedulePatch);
document.addEventListener("change", schedulePatch);
