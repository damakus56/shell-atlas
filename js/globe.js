/* ============================================================
   globe.js — stylized, modern globe on the landing page.
   Uses Globe.gl (wraps three.js). Instead of a realistic
   satellite/topographic earth, it renders clean low-poly
   HEX-POLYGON landmasses on a soft solid sphere — lighter to
   render and on-brand. Plots Shell assets as glowing points,
   animates illustrative supply arcs, hover tooltips, click-focus.
   Tuned for fast, fluid rotation / drag / zoom.
   ============================================================ */

(function () {
  "use strict";

  const mount = document.getElementById("globe");
  if (!mount || typeof Globe === "undefined") {
    if (mount) mount.innerHTML =
      '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#6b7280">Globe could not load (needs an internet connection for the 3D library).</div>';
    return;
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = window.matchMedia("(max-width: 680px)").matches;

  // Stylised palette (fits the light + red/yellow brand system)
  const OCEAN = "#eaedf3";   // soft sphere
  const LAND = "#aab2c2";    // neutral low-poly land (keeps coloured points readable)
  const ATMO = "#DD1D21";    // Shell-red glow

  let assets = [], categories = [], assetById = {};
  const activeTypes = new Set();
  let world, hoveredPoint = null;

  Promise.all([
    fetch("data/projects.json").then((r) => r.json()),
    fetch("data/countries.geojson").then((r) => r.json()).catch(() => ({ features: [] })),
  ])
    .then(([data, geo]) => {
      assets = data.assets;
      categories = data.categories;
      assets.forEach((a) => (assetById[a.id] = a));
      categories.forEach((c) => activeTypes.add(c.type));
      buildLegend();
      initGlobe(data.routes, geo.features || []);
    })
    .catch((err) => {
      console.error("Failed to load globe data", err);
      mount.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#6b7280">Could not load globe data.</div>';
    });

  const colorFor = (type) => { const c = categories.find((x) => x.type === type); return c ? c.color : "#333"; };
  const visibleAssets = () => assets.filter((a) => activeTypes.has(a.type));
  const refreshPoints = () => { if (world) world.pointsData(visibleAssets()); };

  /* ---------- Legend / filter ---------- */
  function buildLegend() {
    const el = document.querySelector(".globe-legend");
    if (!el) return;
    el.innerHTML = categories
      .map((c) => `<button data-type="${c.type}"><span class="dot" style="color:${c.color};background:${c.color}"></span>${c.label}</button>`)
      .join("");
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const type = btn.dataset.type;
      if (activeTypes.has(type)) { activeTypes.delete(type); btn.classList.add("off"); }
      else { activeTypes.add(type); btn.classList.remove("off"); }
      refreshPoints();
    });
  }

  /* ---------- Tooltip ---------- */
  const tip = document.createElement("div");
  tip.className = "globe-tip";
  document.body.appendChild(tip);
  function showTip(a, x, y) {
    const flag = a.confidence !== "verified"
      ? ` <span class="flag ${a.confidence}">${a.confidence === "approximate" ? "approx." : "illustrative"}</span>` : "";
    tip.innerHTML = `<h4>${a.name}${flag}</h4>
      <div class="meta">${a.region}, ${a.country} · ${a.stake}</div>
      <div class="desc">${a.description}</div>`;
    tip.style.left = Math.min(x + 16, window.innerWidth - 300) + "px";
    tip.style.top = y + 16 + "px";
    tip.classList.add("show");
  }
  const hideTip = () => tip.classList.remove("show");

  /* ---------- Init ---------- */
  function initGlobe(routes, landFeatures) {
    const arcs = routes.map((r) => {
      const a = assetById[r.from], b = assetById[r.to];
      if (!a || !b) return null;
      return { startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng, label: r.label };
    }).filter(Boolean);

    world = Globe()(mount)
      .backgroundColor("rgba(0,0,0,0)")
      .showGlobe(true)
      .showGraticules(false)
      .showAtmosphere(true)
      .atmosphereColor(ATMO)
      .atmosphereAltitude(0.2)
      // ---- Stylised low-poly land (no texture) ----
      .hexPolygonsData(landFeatures)
      .hexPolygonResolution(isSmall ? 2 : 3)
      .hexPolygonMargin(0.32)
      .hexPolygonUseDots(true)
      .hexPolygonAltitude(0.012)
      .hexPolygonColor(() => LAND)
      // ---- Asset points ----
      .pointsData(visibleAssets())
      .pointLat("lat").pointLng("lng")
      .pointColor((d) => colorFor(d.type))
      .pointAltitude(0.04)
      .pointRadius(isSmall ? 0.4 : 0.5)
      .pointResolution(isSmall ? 10 : 14)
      .pointsMerge(false)
      .pointLabel(() => "")
      .onPointHover((pt) => { hoveredPoint = pt; mount.style.cursor = pt ? "pointer" : "grab"; if (!pt) hideTip(); })
      .onPointClick((pt) => focusCountry(pt.country))
      // ---- Illustrative supply arcs ----
      .arcsData(arcs)
      .arcColor(() => ["rgba(251,206,7,0.08)", "rgba(221,29,33,0.9)", "rgba(251,206,7,0.08)"])
      .arcAltitudeAutoScale(0.42)
      .arcStroke(0.65)
      .arcDashLength(0.4).arcDashGap(0.5)
      .arcDashAnimateTime(prefersReduced ? 0 : 2400)
      .arcLabel((d) => `${d.label} · illustrative route`);

    // Soft solid ocean sphere (no satellite map).
    const gm = world.globeMaterial();
    if (gm) { if (gm.color) gm.color.set(OCEAN); gm.shininess = 6; if ("emissive" in gm) gm.emissive.set("#ffffff"), (gm.emissiveIntensity = 0.04); }

    mount.addEventListener("mousemove", (e) => { if (hoveredPoint) showTip(hoveredPoint, e.clientX, e.clientY); });

    world.pointOfView({ lat: 22, lng: 8, altitude: isSmall ? 2.7 : 2.15 }, 0);

    // ---- Fast, fluid controls ----
    const controls = world.controls();
    controls.autoRotate = !prefersReduced;
    controls.autoRotateSpeed = 2.2;     // lively
    controls.enableDamping = true;
    controls.dampingFactor = 0.16;      // snappy settle
    controls.rotateSpeed = 1.3;         // responsive drag
    controls.zoomSpeed = 2.0;           // snappy zoom
    controls.enableZoom = true;
    controls.minDistance = 160;
    controls.maxDistance = 560;

    let resumeTimer;
    controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(resumeTimer); });
    controls.addEventListener("end", () => {
      clearTimeout(resumeTimer);
      if (!prefersReduced) resumeTimer = setTimeout(() => (controls.autoRotate = true), 1600);
    });

    sizeGlobe();
    window.addEventListener("resize", sizeGlobe);
  }

  function sizeGlobe() { if (world) world.width(mount.clientWidth).height(mount.clientHeight); }

  /* ---------- Country focus + asset panel ---------- */
  let panel;
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("aside");
    panel.className = "focus-panel";
    panel.innerHTML = `<button class="close" aria-label="Close">×</button>
      <h3 id="fp-country"></h3><div class="count" id="fp-count"></div><div id="fp-list"></div>`;
    document.body.appendChild(panel);
    panel.querySelector(".close").addEventListener("click", () => panel.classList.remove("open"));
    return panel;
  }
  function focusCountry(country) {
    const p = ensurePanel();
    const list = assets.filter((a) => a.country === country);
    p.querySelector("#fp-country").textContent = country;
    p.querySelector("#fp-count").textContent = `${list.length} mapped asset${list.length === 1 ? "" : "s"}`;
    p.querySelector("#fp-list").innerHTML = list.map((a) => {
      const flag = a.confidence !== "verified" ? `<span class="flag ${a.confidence}">${a.confidence === "approximate" ? "approx." : "illustrative"}</span>` : "";
      return `<div class="asset-card">
        <div class="top"><span class="dot" style="color:${colorFor(a.type)};background:${colorFor(a.type)}"></span><h4>${a.name}</h4></div>
        <div class="region">${a.region} ${flag}</div>
        <div class="desc">${a.description}</div>
        <div class="stake">${a.stake} · <span class="muted">${a.source}</span></div>
      </div>`;
    }).join("");
    p.classList.add("open");
    if (list.length && world) {
      const anchor = list[0];
      world.controls().autoRotate = false;
      world.pointOfView({ lat: anchor.lat, lng: anchor.lng, altitude: 1.5 }, 700);
    }
  }
})();
