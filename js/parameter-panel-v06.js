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
    <div class="notice" style="margin-top:12px">Changes apply immediately to the next Preview/Advance and reset when the page reloads.</div>

    <div class="mini-title">Wealth by demand category</div>
    <div class="balance-grid">
      ${field("Population Wealth / unit", "wealth_population", BALANCE_CONFIG.wealthPerDemand.population)}
      ${field("Institution Wealth / unit", "wealth_institutions", BALANCE_CONFIG.wealthPerDemand.institutions)}
      ${field("External Wealth / unit", "wealth_external", BALANCE_CONFIG.wealthPerDemand.external_markets)}
    </div>

    <div class="mini-title">Population & city effects</div>
    <div class="balance-grid">
      ${field("Population + when fully fed", "growth", BALANCE_CONFIG.population.growthOnFullFood)}
      ${field("Population − on famine", "famine", BALANCE_CONFIG.population.famineLossWhenFoodUnmet)}
      ${field("Population per Squalor point", "popPerSqualor", BALANCE_CONFIG.squalor.populationPerPoint, 1)}
      ${field("Unmet Food Squalor penalty", "foodSqualorPenalty", BALANCE_CONFIG.squalor.unmetFoodPenalty)}
      ${field("Max Squalor change / generation", "squalorStep", BALANCE_CONFIG.squalor.maxChangePerGeneration, 1)}
      ${field("Disease Population loss", "diseaseLoss", BALANCE_CONFIG.disease.populationLoss)}
    </div>

    <div class="mini-title">Population demand divisors</div>
    <div class="balance-grid">
      ${field("Food", "pop_food", BALANCE_CONFIG.populationDemandDivisors.food, 1)}
      ${field("Textiles", "pop_textiles", BALANCE_CONFIG.populationDemandDivisors.textiles, 1)}
      ${field("Smithing", "pop_smithing", BALANCE_CONFIG.populationDemandDivisors.smithing, 1)}
    </div>

    <div class="mini-title">Institution demand divisors — demand = ceil(total Institution levels / divisor)</div>
    <div class="balance-grid">
      ${field("Food", "inst_food", BALANCE_CONFIG.institutionDemandDivisors.food, 1)}
      ${field("Textiles", "inst_textiles", BALANCE_CONFIG.institutionDemandDivisors.textiles, 1)}
      ${field("Smithing", "inst_smithing", BALANCE_CONFIG.institutionDemandDivisors.smithing, 1)}
    </div>

    <div class="mini-title">External demand divisors — demand = ceil(Renown / divisor)</div>
    <div class="balance-grid">
      ${field("Food", "ext_food", BALANCE_CONFIG.externalDemandDivisors.food, 1)}
      ${field("Textiles", "ext_textiles", BALANCE_CONFIG.externalDemandDivisors.textiles, 1)}
      ${field("Smithing", "ext_smithing", BALANCE_CONFIG.externalDemandDivisors.smithing, 1)}
    </div>

    <div class="mini-title">Disease chance by Squalor (%)</div>
    <div class="balance-grid disease-grid">
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

      if (key === "wealth_population") BALANCE_CONFIG.wealthPerDemand.population = value;
      else if (key === "wealth_institutions") BALANCE_CONFIG.wealthPerDemand.institutions = value;
      else if (key === "wealth_external") BALANCE_CONFIG.wealthPerDemand.external_markets = value;
      else if (key === "growth") BALANCE_CONFIG.population.growthOnFullFood = value;
      else if (key === "famine") BALANCE_CONFIG.population.famineLossWhenFoodUnmet = value;
      else if (key === "popPerSqualor") BALANCE_CONFIG.squalor.populationPerPoint = Math.max(1, value);
      else if (key === "foodSqualorPenalty") BALANCE_CONFIG.squalor.unmetFoodPenalty = value;
      else if (key === "squalorStep") BALANCE_CONFIG.squalor.maxChangePerGeneration = Math.max(1, value);
      else if (key === "diseaseLoss") BALANCE_CONFIG.disease.populationLoss = value;
      else if (key === "pop_food") BALANCE_CONFIG.populationDemandDivisors.food = Math.max(1, value);
      else if (key === "pop_textiles") BALANCE_CONFIG.populationDemandDivisors.textiles = Math.max(1, value);
      else if (key === "pop_smithing") BALANCE_CONFIG.populationDemandDivisors.smithing = Math.max(1, value);
      else if (key === "inst_food") BALANCE_CONFIG.institutionDemandDivisors.food = Math.max(1, value);
      else if (key === "inst_textiles") BALANCE_CONFIG.institutionDemandDivisors.textiles = Math.max(1, value);
      else if (key === "inst_smithing") BALANCE_CONFIG.institutionDemandDivisors.smithing = Math.max(1, value);
      else if (key === "ext_food") BALANCE_CONFIG.externalDemandDivisors.food = Math.max(1, value);
      else if (key === "ext_textiles") BALANCE_CONFIG.externalDemandDivisors.textiles = Math.max(1, value);
      else if (key === "ext_smithing") BALANCE_CONFIG.externalDemandDivisors.smithing = Math.max(1, value);
      else if (key?.startsWith("disease_")) {
        const level = key.split("_")[1];
        BALANCE_CONFIG.disease.chanceBySqualor[level] = Math.min(100, value) / 100;
      }
    });
  }
}

injectPanel();
new MutationObserver(injectPanel).observe(root, { childList: true, subtree: true });
