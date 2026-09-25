const root = document.querySelector("#app");

function patchV061Labels() {
  const brand = document.querySelector(".brand p");
  if (brand && brand.textContent?.includes("Engine v0.6")) {
    brand.textContent = brand.textContent.replace("Engine v0.6", "Engine v0.6.1");
  }

  for (const span of document.querySelectorAll(".report-kpis .kpi span")) {
    if (span.textContent?.trim() === "Tier capacity") {
      span.textContent = "Stake supply";
    }
  }

  const notice = document.querySelector(".notice");
  if (notice && !document.querySelector("#stake-supply-rule")) {
    const rule = document.createElement("div");
    rule.id = "stake-supply-rule";
    rule.className = "prototype-rules";
    rule.style.marginTop = "8px";
    rule.innerHTML = "<b>Production rule:</b> each Production Stake supplies exactly 1 unit and can satisfy 1 need. Sector tier creates Stake slots; it does not create production by itself.";
    notice.insertAdjacentElement("afterend", rule);
  }
}

patchV061Labels();
if (root) new MutationObserver(patchV061Labels).observe(root, { childList: true, subtree: true });
