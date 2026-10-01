const telemetry = document.querySelector("#telemetry");
let mountScheduled = false;

function findMornevalHeading() {
  const app = document.querySelector("#app");
  if (!app) return null;
  return [...app.querySelectorAll("h2.section-title")]
    .find(node => node.textContent?.trim() === "Morneval") ?? null;
}

function mountTelemetry() {
  mountScheduled = false;
  if (!(telemetry instanceof HTMLElement)) return;
  const heading = findMornevalHeading();
  if (!heading) return;

  heading.insertAdjacentElement("beforebegin", telemetry);
  telemetry.classList.add("telemetry-inline");
}

function scheduleMount() {
  if (mountScheduled) return;
  mountScheduled = true;
  queueMicrotask(() => {
    mountScheduled = false;
    mountTelemetry();
  });
  setTimeout(mountTelemetry, 0);
}

if (!document.querySelector("style[data-telemetry-placement-v2]")) {
  const style = document.createElement("style");
  style.dataset.telemetryPlacementV2 = "true";
  style.textContent = `
    #telemetry.telemetry-inline {
      max-width: none;
      margin: 12px 0 18px;
      padding: 0;
    }
  `;
  document.head.append(style);
}

window.addEventListener("morneval:generation-resolved", scheduleMount);
document.addEventListener("click", scheduleMount);
document.addEventListener("change", scheduleMount);

scheduleMount();
