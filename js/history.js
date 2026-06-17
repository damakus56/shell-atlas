/* ============================================================
   history.js — renders the animated vertical timeline from
   data/history.json. Cards reveal on scroll (alternating sides).
   ============================================================ */

(function () {
  "use strict";

  fetch("data/history.json")
    .then((r) => r.json())
    .then((data) => {
      const tl = document.getElementById("timeline");
      if (!tl) return;
      tl.innerHTML = data.milestones
        .map((m) => {
          const flag =
            m.confidence !== "verified"
              ? `<span class="flag ${m.confidence}">${m.confidence === "approximate" ? "approx." : "illustrative"}</span>`
              : "";
          return `
          <div class="tl-item reveal">
            <span class="node"></span>
            <div class="tl-card">
              <div class="tl-year">${m.year}</div>
              <h3>${m.title} ${flag}</h3>
              <p>${m.text}</p>
              <div class="src">Source: ${m.source}</div>
            </div>
          </div>`;
        })
        .join("");
      // register the newly-added cards with the shared reveal observer
      if (window.ShellAtlas) window.ShellAtlas.initReveals();
    })
    .catch((err) => {
      console.error("Failed to load history.json", err);
    });
})();
