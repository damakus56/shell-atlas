/* ============================================================
   history.js — a creative, scroll-driven narrative timeline.
   Renders era bands and alternating "story scenes" (big image +
   text + year), with highlighted "Did you know?" callouts, all
   from data/history.json. Each milestone has its own distinct
   image. Reveal-on-scroll handled by the shared observer.
   ============================================================ */

(function () {
  "use strict";

  // Per-era accent colour for visual rhythm (bands, year, callouts).
  const ERA_ACCENT = {
    origins: "#E8A100",
    formation: "#DD1D21",
    expansion: "#FF6B35",
    northsea: "#2563EB",
    crises: "#6B7280",
    modern: "#0E9F6E",
  };

  fetch("data/history.json")
    .then((r) => r.json())
    .then((data) => {
      const root = document.getElementById("history-root");
      if (!root) return;

      let html = "";
      let globalIdx = 0;

      data.eras.forEach((era, eraIdx) => {
        const accent = ERA_ACCENT[era.id] || "#DD1D21";
        const items = data.milestones.filter((m) => m.era === era.id);
        if (!items.length) return;

        // Era divider band
        html += `
          <div class="era-band reveal" style="--era:${accent}">
            <div class="wrap">
              <div class="era-index">Era ${eraIdx + 1}</div>
              <h2 class="era-title">${era.label}</h2>
              <div class="era-span">${era.span}</div>
              <p class="era-blurb">${era.blurb}</p>
            </div>
          </div>`;

        // Story scenes for this era (alternating sides)
        items.forEach((m) => {
          const side = globalIdx % 2 === 0 ? "left" : "right";
          globalIdx++;
          const flag = m.confidence !== "verified"
            ? `<span class="flag ${m.confidence}">${m.confidence === "approximate" ? "approx." : "illustrative"}</span>` : "";
          const callout = m.fact
            ? `<div class="didyouknow" style="--era:${accent}"><span class="dyk-label">Did you know?</span> ${m.fact}</div>`
            : "";
          html += `
            <article class="story-scene ${side} reveal" style="--era:${accent}">
              <div class="scene-media">
                <img src="${m.image}" alt="" loading="lazy">
                <span class="imgtag">Illustrative image</span>
              </div>
              <div class="scene-text">
                <div class="scene-year">${m.year}</div>
                <h3>${m.title} ${flag}</h3>
                <p>${m.text}</p>
                ${callout}
                <div class="scene-src">Source: ${m.source}</div>
              </div>
            </article>`;
        });
      });

      // Closing note
      html += `
        <div class="story-close reveal">
          <div class="wrap">
            <p>From a seashell shop to a global energy system — and now, the slow turn toward transition. The story is still being written.</p>
          </div>
        </div>`;

      root.innerHTML = html;
      if (window.ShellAtlas) window.ShellAtlas.initReveals();
    })
    .catch((err) => console.error("Failed to load history.json", err));
})();
