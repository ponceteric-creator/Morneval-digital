const root = document.querySelector("#app");

function patchV062Labels() {
  const brand = document.querySelector(".brand p");
  const expected = "Generational balance sandbox · Engine v0.6.2";
  if (brand && brand.textContent !== expected) {
    brand.textContent = expected;
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

patchV062Labels();

/*
 * Observe only replacement of the root's direct children. The previous v0.6.1
 * helper watched the whole subtree and repeatedly rewrote a version string
 * because "v0.6.1" still contains "v0.6". That created an infinite mutation
 * loop in Safari after any UI redraw. This observer cannot be retriggered by
 * its own edits inside <main>.
 */
if (root) {
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      patchV062Labels();
    });
  });
  observer.observe(root, { childList: true, subtree: false });
}
