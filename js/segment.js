/* ============================================================
   segment.js — renders a single business-segment page.
   The page declares which segment via <body data-segment="id">;
   all content comes from data/products.json, so the six segment
   pages share one template and one script (fully data-driven).
   ============================================================ */

(function () {
  "use strict";

  const id = document.body.getAttribute("data-segment");
  if (!id) return;

  const ORDER = ["integrated-gas", "upstream", "marketing", "chemicals-products", "renewables", "corporate"];

  fetch("data/products.json")
    .then((r) => r.json())
    .then((data) => {
      const seg = data.segments.find((s) => s.id === id);
      if (!seg) { document.getElementById("seg-root").innerHTML = "<p>Segment not found.</p>"; return; }
      document.title = `${seg.name} — Shell Atlas`;
      render(seg, data.segments);
      if (window.ShellAtlas) window.ShellAtlas.initReveals();
    })
    .catch((err) => console.error("Failed to load products.json", err));

  function fmtEarn(v) {
    if (v == null) return "";
    return (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(1) + "B adjusted earnings (2024)";
  }

  function render(seg, all) {
    const root = document.getElementById("seg-root");
    const idx = ORDER.indexOf(seg.id);
    const prev = all.find((s) => s.id === ORDER[(idx - 1 + ORDER.length) % ORDER.length]);
    const next = all.find((s) => s.id === ORDER[(idx + 1) % ORDER.length]);

    const facts = seg.facts.map((f, i) => {
      const flag = f.confidence !== "verified" ? `<span class="flag ${f.confidence}">${f.confidence === "approximate" ? "approx." : "illustrative"}</span>` : "";
      return `<div class="fact-item reveal" data-delay="${i % 4}">
        <span class="bullet" style="background:${seg.accent}">${i + 1}</span>
        <div class="ft">${f.text} ${flag}<div class="muted" style="font-size:.75rem;margin-top:3px">Source: ${f.source}</div></div>
      </div>`;
    }).join("");

    const chips = seg.flagship.map((f) => `<span class="chip">${f}</span>`).join("");

    const photo = seg.realImage
      ? `<div class="seg-photo reveal"><img src="${seg.realImage}" alt="${seg.name} — real photo" loading="lazy"><div class="cap">${seg.realCredit}</div></div>`
      : "";

    root.innerHTML = `
      <section class="seg-hero" style="--seg-accent:${seg.accent}">
        <img class="bg" src="${seg.image}" alt="" aria-hidden="true">
        <span class="imgtag" style="position:absolute;bottom:10px;right:12px;z-index:3;font-size:.6rem;color:#fff;background:rgba(0,0,0,0.5);padding:2px 8px;border-radius:6px">Illustrative image</span>
        <div class="veil"></div>
        <div class="wrap seg-hero-inner">
          <div class="eyebrow">Shell Business · Segment</div>
          <h1>${seg.name}</h1>
          <p class="sub">${seg.tagline}.</p>
          ${seg.earnings2024 != null ? `<div class="earn-badge"><span class="swatch" style="width:10px;height:10px;border-radius:50%;background:${seg.accent}"></span>${fmtEarn(seg.earnings2024)} · ${seg.earningsShare}</div>` : ""}
        </div>
      </section>

      <section class="section alt">
        <div class="wrap">
          <div class="seg-grid">
            <div>
              <div class="section-head reveal" style="margin-bottom:32px">
                <div class="eyebrow" style="color:var(--shell-red)">What it does</div>
                <p style="font-size:1.15rem;color:var(--txt-0);margin-top:8px">${seg.description}</p>
              </div>
              <h3 class="reveal" style="margin-bottom:18px">Key facts &amp; figures</h3>
              <div class="facts-list">${facts}</div>
            </div>
            <div class="seg-side">
              ${photo}
              <div class="info-panel reveal">
                <h4>Flagship assets &amp; brands</h4>
                <div class="chip-row">${chips}</div>
              </div>
              <div class="info-panel reveal">
                <h4>How it connects</h4>
                <p>${seg.connects}</p>
              </div>
              <div class="info-panel reveal" style="border-left:3px solid ${seg.accent}">
                <h4>Challenge &amp; debate</h4>
                <p>${seg.challenge}</p>
              </div>
            </div>
          </div>

          <div class="seg-nav" style="margin-top:48px">
            <a href="${prev.id}.html" data-link>← ${prev.name}</a>
            <a href="index.html#segments" data-link>All businesses</a>
            <a href="${next.id}.html" data-link>${next.name} →</a>
          </div>
        </div>
      </section>`;
  }
})();
