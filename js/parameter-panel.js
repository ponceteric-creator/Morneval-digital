import { BALANCE_CONFIG } from "./balance-config.js";

const root = document.querySelector("#app");
if (!root) throw new Error("Missing #app root element");

function field(label, key, value, min = 0, step = 1) {
  return `<div class="field"><label>${label}</label><input type="number" min="${min}" step="${step}" data-balance-key="${key}" value="${value}"></div>`;
}

function injectPanel() {
  if (document.querySelector("#balance-parameter-panel")) return;
  const anchor = document.querySelector(".simulation-panel");
  if (!anchor) return;

  const panel = document.createElement("details");
  panel.id = "balance-parameter-panel";
  panel.className = "panel";
  panel.style.marginTop = "12px";
  panel.innerHTML = `
    <summary style="font-weight:800;cursor:pointer">Prototype balance parameters</summary>
    <div class="notice" style="margin-top:12px">These values are temporary playtest parameters. Changes apply to the next Preview/Advance and reset when the page is reloaded.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
      ${field("Population + when fully fed", "growth", BALANCE_CONFIG.population.growthOnFullFood)}
      ${field("Population − on famine", "famine", BALANCE_CONFIG.population.famineLossWhenFoodUnmet)}
      ${field("Population per Squalor point", "popPerSqualor", BALANCE_CONFIG.squalor.populationPerPoint, 1)}
      ${field("Unmet Food Squalor penalty", "foodSqualorPenalty", BALANCE_CONFIG.squalor.unmetFoodPenalty)}
      ${field("Max Squalor change / generation", "squalorStep", BALANCE_CONFIG.squalor.maxChangePerGeneration, 1)}
      ${field("Disease Population loss", "diseaseLoss", BALANCE_CONFIG.disease.populationLoss)}
      ${field("Food demand divisor", "foodDivisor", BALANCE_CONFIG.populationDemandDivisors.food, 1)}
      ${field("Textiles demand divisor", "textilesDivisor", BALANCE_CONFIG.populationDemandDivisors.textiles, 1)}
      ${field("Smithing demand divisor", "smithingDivisor", BALANCE_CONFIG.populationDemandDivisors.smithing, 1)}
    </div>
    <div class="mini-title" style="margin-top:14px">Disease chance by Squalor (%)</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px">
      ${Object.keys(BALANCE_CONFIG.disease.chanceBySqualor).map(level => field(`Squalor ${level}${level === "6" ? "+" : ""}`, `disease_${level}`, Math.round(BALANCE_CONFIG.disease.chanceBySqualor[level] * 100), 0, 1)).join("")}
    </div>`;

  anchor.insertAdjacentElement("afterend", panel);
  bindPanel(panel);
}

function bindPanel(panel) {
  for (const input of panel.querySelectorAll("[data-balance-key]")) {
    input.addEventListener("change", () => {
      const key = input.dataset.balanceKey;
      const value = Math.max(Number(input.min || 0), Number(input.value) || 0);
      input.value = String(value);

      if (key === "growth") BALANCE_CONFIG.population.growthOnFullFood = value;
      else if (key === "famine") BALANCE_CONFIG.population.famineLossWhenFoodUnmet = value;
      else if (key === "popPerSqualor") BALANCE_CONFIG.squalor.populationPerPoint = Math.max(1, value);
      else if (key === "foodSqualorPenalty") BALANCE_CONFIG.squalor.unmetFoodPenalty = value;
      else if (key === "squalorStep") BALANCE_CONFIG.squalor.maxChangePerGeneration = Math.max(1, value);
      else if (key === "diseaseLoss") BALANCE_CONFIG.disease.populationLoss = value;
      else if (key === "foodDivisor") BALANCE_CONFIG.populationDemandDivisors.food = Math.max(1, value);
      else if (key === "textilesDivisor") BALANCE_CONFIG.populationDemandDivisors.textiles = Math.max(1, value);
      else if (key === "smithingDivisor") BALANCE_CONFIG.populationDemandDivisors.smithing = Math.max(1, value);
      else if (key?.startsWith("disease_")) {
        const level = key.split("_")[1];
        BALANCE_CONFIG.disease.chanceBySqualor[level] = Math.min(100, value) / 100;
      }
    });
  }
}

injectPanel();
new MutationObserver(injectPanel).observe(root, { childList: true, subtree: true });
