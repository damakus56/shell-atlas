/* ============================================================
   history.js — renders the image-rich animated timeline from
   data/history.json. Cards alternate sides and reveal on scroll;
   each carries an image (illustrative AI scene or credited photo).
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
          const flag = m.confidence !== "verified"
            ? `<span class="flag ${m.confidence}">${m.confidence === "approximate" ? "approx." : "illustrative"}</span>` : "";
          const imgtag = m.imageType === "photo"
            ? (m.imageCredit || "Photo")
            : "Illustrative image";
          const img = m.image
            ? `<div class="tl-img"><img src="${m.image}" alt="${m.title}" loading="lazy"><span class="imgtag">${imgtag}</span></div>`
            : "";
          return `
          <div class="tl-item reveal">
            <span class="node"></span>
            <div class="tl-card">
              ${img}
              <div class="tl-body">
                <div class="tl-year">${m.year}</div>
                <h3>${m.title} ${flag}</h3>
                <p>${m.text}</p>
                <div class="src">Source: ${m.source}</div>
              </div>
            </div>
          </div>`;
        })
        .join("");
      if (window.ShellAtlas) window.ShellAtlas.initReveals();
    })
    .catch((err) => console.error("Failed to load history.json", err));
})();
