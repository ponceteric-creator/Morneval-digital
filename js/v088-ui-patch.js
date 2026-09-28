import "./v087-ui-patch.js?v=0.8.8";

const VERSION_FROM = "0.8.7";
const VERSION_TO = "0.8.8";

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
    notice.innerHTML = `<b>v${VERSION_TO}:</b> Farms are civic public goods. Converting a controlled natural territory to a Farm still costs 2 Influence + 1 Wealth, awards the contributor +3 Prestige immediately, then transfers the Farm to Morneval. Public Farms provide Raw Food to everyone and never generate recurring productive-land Prestige.`;
  }

  for (const owner of root.querySelectorAll(".tile-owner")) {
    if (owner.textContent?.includes("Owner: public")) {
      owner.innerHTML = owner.innerHTML.replace("Owner: <b>public</b>", "Owner: <b>Morneval (public)</b>");
    }
    if (owner.textContent?.includes("Former owner: public")) {
      owner.innerHTML = owner.innerHTML.replace("Former owner: <b>public</b>", "Former owner: <b>Morneval (public)</b>");
    }
  }

  const hinterlandHeading = [...root.querySelectorAll(".section-title")]
    .find(node => node.textContent?.trim() === "Hinterland exploration");
  if (hinterlandHeading) {
    const infoPanel = hinterlandHeading.nextElementSibling;
    if (infoPanel?.classList.contains("panel") && !infoPanel.querySelector("[data-v088-farm-rule]")) {
      const rule = document.createElement("div");
      rule.className = "prototype-rules";
      rule.style.marginTop = "8px";
      rule.dataset.v088FarmRule = "true";
      rule.innerHTML = `<b>Civic Farm:</b> convert one controlled natural territory for 2 Influence + 1 Wealth → gain +3 Prestige immediately → the Farm becomes public property of Morneval. It produces 2 Raw Food for Population and gives no recurring productive-land Prestige.`;
      infoPanel.appendChild(rule);
    }
  }

  const footer = root.querySelector(".footer-note");
  if (footer) {
    footer.textContent = "AI Farm conversion is a food-security action. Once converted, a Farm is public: the contributor receives +3 Prestige once, ownership is surrendered, and no recurring Farm Prestige is generated.";
  }
}

function schedulePatch() {
  queueMicrotask(patchUi);
  setTimeout(patchUi, 0);
}

patchUi();
document.addEventListener("click", schedulePatch);
document.addEventListener("change", schedulePatch);
