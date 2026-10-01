function cleanDiseaseHistory() {
  const app = document.querySelector("#app");
  if (!app) return;

  for (const card of app.querySelectorAll(".history-card")) {
    const disease = card.querySelector(".history-head > span");
    if (disease) {
      const text = disease.textContent?.trim();
      if (text === "No disease") disease.hidden = true;
      else if (text === "Disease") disease.hidden = false;
    }

    for (const span of card.querySelectorAll(".history-grid span")) {
      if (span.textContent?.includes("Disease resolved first ·")) {
        span.textContent = span.textContent.replaceAll("Disease resolved first · ", "");
      }
    }
  }
}

function scheduleCleanup() {
  setTimeout(cleanDiseaseHistory, 0);
  setTimeout(cleanDiseaseHistory, 25);
}

document.addEventListener("click", scheduleCleanup);
document.addEventListener("change", scheduleCleanup);
setTimeout(cleanDiseaseHistory, 0);
