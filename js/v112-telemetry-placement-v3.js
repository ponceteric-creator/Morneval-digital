const telemetry = document.querySelector("#telemetry");
let mountScheduled = false;

function findHeading(app, text) {
  return [...app.querySelectorAll("h2.section-title")]
    .find(node => node.textContent?.trim() === text) ?? null;
}

function pruneNativeDuplicates(chartGrid) {
  for (const card of chartGrid?.querySelectorAll(".chart-card") ?? []) {
    const title = card.querySelector("h3")?.textContent?.trim();
    if (title === "Population & urban capacity" || title === "Squalor") card.remove();
  }
}

function mountCharts() {
  mountScheduled = false;
  const app = document.querySelector("#app");
  if (!app || !(telemetry instanceof HTMLElement)) return;

  const toolbar = app.querySelector(".toolbar");
  const evolutionHeading = findHeading(app, "Evolution by Generation");
  const nativeGrid = evolutionHeading?.nextElementSibling?.matches?.(".chart-grid")
    ? evolutionHeading.nextElementSibling
    : null;
  if (!toolbar || !evolutionHeading || !nativeGrid) return;

  pruneNativeDuplicates(nativeGrid);

  toolbar.insertAdjacentElement("afterend", evolutionHeading);
  evolutionHeading.insertAdjacentElement("afterend", telemetry);
  telemetry.insertAdjacentElement("afterend", nativeGrid);
  telemetry.classList.add("telemetry-inline");
}

function scheduleMount() {
  if (mountScheduled) return;
  mountScheduled = true;
  queueMicrotask(() => {
    mountScheduled = false;
    mountCharts();
  });
  setTimeout(mountCharts, 0);
}

if (!document.querySelector("style[data-telemetry-placement-v3]")) {
  const style = document.createElement("style");
  style.dataset.telemetryPlacementV3 = "true";
  style.textContent = `
    #telemetry.telemetry-inline {
      max-width: none;
      margin: 0 0 12px;
      padding: 0;
    }
    #telemetry.telemetry-inline + .chart-grid {
      margin-top: 0;
      margin-bottom: 18px;
    }
  `;
  document.head.append(style);
}

window.addEventListener("morneval:generation-resolved", scheduleMount);
document.addEventListener("click", scheduleMount);
document.addEventListener("change", scheduleMount);

scheduleMount();
