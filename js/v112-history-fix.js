import "./v112-ui-patch.js?v=0.11.4-stable-ui";

let cleanupQueued = false;

function cleanDiseaseHistory() {
  cleanupQueued = false;
  const root = document.querySelector("#app");
  if (!root) return;

  for (const card of root.querySelectorAll(".history-card")) {
    const disease = card.querySelector(".history-head > span");
    if (disease) {
      const text = disease.textContent?.trim();
      if (text === "No disease") {
        disease.hidden = true;
        disease.classList.remove("v112-disease-badge");
      } else if (text === "Disease") {
        disease.hidden = false;
        disease.classList.add("v112-disease-badge");
      }
    }

    for (const span of card.querySelectorAll(".history-grid span")) {
      if (span.textContent?.startsWith("Order · Disease resolved first ·")) {
        span.textContent = span.textContent.replace("Order · Disease resolved first ·", "Order ·");
      }
    }
  }
}

function scheduleCleanup() {
  if (cleanupQueued) return;
  cleanupQueued = true;
  queueMicrotask(cleanDiseaseHistory);
}

const app = document.querySelector("#app");
if (app) {
  new MutationObserver(scheduleCleanup).observe(app, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

document.addEventListener("click", () => setTimeout(cleanDiseaseHistory, 0));
document.addEventListener("change", () => setTimeout(cleanDiseaseHistory, 0));

cleanDiseaseHistory();
