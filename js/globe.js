/* ============================================================
   globe.js — the interactive 3D globe on the landing page.
   Uses Globe.gl (which wraps three.js), loaded from CDN.
   Plots Shell assets as glowing points categorised by type,
   animates illustrative supply-route arcs, shows hover tooltips,
   and focuses a country (with an asset panel) on click.
   Degrades sensibly on small screens / reduced motion.
   ============================================================ */

(function () {
  "use strict";

  const mount = document.getElementById("globe");
  if (!mount || typeof Globe === "undefined") {
    console.warn("Globe.gl not available — globe skipped.");
    if (mount) mount.innerHTML =
      '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#7c8497">Globe could not load (needs an internet connection for the 3D library).</div>';
    return;
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = window.matchMedia("(max-width: 680px)").matches;

  let assets = [];
  let categories = [];
  const activeTypes = new Set();   // which categories are currently shown
  let assetById = {};

  fetch("data/projects.json")
    .then((r) => r.json())
    .then((data) => {
      assets = data.assets;
      categories = data.categories;
      assets.forEach((a) => (assetById[a.id] = a));
      categories.forEach((c) => activeTypes.add(c.type));
      buildLegend();
      initGlobe(data.routes);
    })
    .catch((err) => {
      console.error("Failed to load projects.json", err);
      mount.innerHTML =
        '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#7c8497">Could not load asset data.</div>';
    });

  const colorFor = (type) => {
    const c = categories.find((x) => x.type === type);
    return c ? c.color : "#ffffff";
  };

  /* ---------- Legend (also acts as a category filter) ---------- */
  function buildLegend() {
    const el = document.querySelector(".globe-legend");
    if (!el) return;
    el.innerHTML = categories
      .map(
        (c) =>
          `<button data-type="${c.type}"><span class="dot" style="color:${c.color};background:${c.color}"></span>${c.label}</button>`
      )
      .join("");
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const type = btn.dataset.type;
      if (activeTypes.has(type)) {
        activeTypes.delete(type);
        btn.classList.add("off");
      } else {
        activeTypes.add(type);
        btn.classList.remove("off");
      }
      refreshPoints();
    });
  }

  let world;

  function visibleAssets() {
    return assets.filter((a) => activeTypes.has(a.type));
  }

  function refreshPoints() {
    if (world) world.pointsData(visibleAssets());
  }

  /* ---------- Tooltip ---------- */
  const tip = document.createElement("div");
  tip.className = "globe-tip";
  document.body.appendChild(tip);

  function showTip(a, x, y) {
    const flag =
      a.confidence !== "verified"
        ? ` <span class="flag ${a.confidence}">${a.confidence === "approximate" ? "approx." : "illustrative"}</span>`
        : "";
    tip.innerHTML = `
      <h4>${a.name}${flag}</h4>
      <div class="meta">${a.region}, ${a.country} · ${a.stake}</div>
      <div class="desc">${a.description}</div>`;
    tip.style.left = Math.min(x + 16, window.innerWidth - 300) + "px";
    tip.style.top = y + 16 + "px";
    tip.classList.add("show");
  }
  function hideTip() { tip.classList.remove("show"); }

  /* ---------- Globe init ---------- */
  function initGlobe(routes) {
    // Resolve route endpoints from asset coordinates.
    const arcs = routes
      .map((r) => {
        const a = assetById[r.from], b = assetById[r.to];
        if (!a || !b) return null;
        return {
          startLat: a.lat, startLng: a.lng,
          endLat: b.lat, endLng: b.lng,
          label: r.label, confidence: r.confidence,
        };
      })
      .filter(Boolean);

    world = Globe()(mount)
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("#DD1D21")
      .atmosphereAltitude(0.18)
      // Dark earth texture from the Globe.gl example assets (CDN).
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      // ---- Points (assets) ----
      .pointsData(visibleAssets())
      .pointLat("lat")
      .pointLng("lng")
      .pointColor((d) => colorFor(d.type))
      .pointAltitude(0.02)
      .pointRadius(isSmall ? 0.32 : 0.42)
      .pointResolution(isSmall ? 8 : 12)
      .pointsMerge(false)
      .pointLabel(() => "") // we use our own DOM tooltip instead
      .onPointHover((pt) => {
        hoveredPoint = pt;                       // cached for the mousemove handler
        mount.style.cursor = pt ? "pointer" : "grab";
        if (!pt) hideTip();
      })
      .onPointClick((pt) => focusCountry(pt.country))
      // ---- Arcs (illustrative supply routes) ----
      .arcsData(arcs)
      .arcColor(() => ["rgba(251,206,7,0.0)", "rgba(251,206,7,0.85)", "rgba(221,29,33,0.0)"])
      .arcAltitudeAutoScale(0.45)
      .arcStroke(0.5)
      .arcDashLength(0.4)
      .arcDashGap(0.6)
      .arcDashAnimateTime(prefersReduced ? 0 : 4000)
      .arcLabel((d) => `${d.label} · illustrative route`);

    // Track pointer to position the custom tooltip (datum cached via onPointHover above).
    mount.addEventListener("mousemove", (e) => {
      if (hoveredPoint) showTip(hoveredPoint, e.clientX, e.clientY);
    });

    // Initial camera + gentle auto-rotation.
    world.pointOfView({ lat: 20, lng: 10, altitude: isSmall ? 2.8 : 2.3 }, 0);
    const controls = world.controls();
    controls.autoRotate = !prefersReduced;
    controls.autoRotateSpeed = 0.45;
    controls.enableZoom = true;
    controls.minDistance = 180;
    controls.maxDistance = 600;

    // Pause rotation while the user interacts.
    controls.addEventListener("start", () => (controls.autoRotate = false));
    let resumeTimer;
    controls.addEventListener("end", () => {
      clearTimeout(resumeTimer);
      if (!prefersReduced) resumeTimer = setTimeout(() => (controls.autoRotate = true), 3500);
    });

    sizeGlobe();
    window.addEventListener("resize", sizeGlobe);
  }

  // module-scoped hovered point used by the mousemove handler
  let hoveredPoint = null;

  function sizeGlobe() {
    if (!world) return;
    world.width(mount.clientWidth).height(mount.clientHeight);
  }

  /* ---------- Country focus + asset panel ---------- */
  let panel;
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("aside");
    panel.className = "focus-panel";
    panel.innerHTML = `<button class="close" aria-label="Close">×</button>
      <h3 id="fp-country"></h3>
      <div class="count" id="fp-count"></div>
      <div id="fp-list"></div>`;
    document.body.appendChild(panel);
    panel.querySelector(".close").addEventListener("click", () => panel.classList.remove("open"));
    return panel;
  }

  function focusCountry(country) {
    const p = ensurePanel();
    const list = assets.filter((a) => a.country === country);
    p.querySelector("#fp-country").textContent = country;
    p.querySelector("#fp-count").textContent =
      `${list.length} mapped asset${list.length === 1 ? "" : "s"}`;
    p.querySelector("#fp-list").innerHTML = list
      .map((a) => {
        const flag =
          a.confidence !== "verified"
            ? `<span class="flag ${a.confidence}">${a.confidence === "approximate" ? "approx." : "illustrative"}</span>`
            : "";
        return `<div class="asset-card">
          <div class="top"><span class="dot" style="color:${colorFor(a.type)};background:${colorFor(a.type)}"></span>
            <h4>${a.name}</h4></div>
          <div class="region">${a.region} ${flag}</div>
          <div class="desc">${a.description}</div>
          <div class="stake">${a.stake} · <span class="muted">${a.source}</span></div>
        </div>`;
      })
      .join("");
    p.classList.add("open");

    // Fly the camera to the country's assets (use the first as anchor).
    if (list.length && world) {
      const anchor = list[0];
      world.controls().autoRotate = false;
      world.pointOfView({ lat: anchor.lat, lng: anchor.lng, altitude: 1.6 }, 1100);
    }
  }
})();
