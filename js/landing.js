/* ============================================================
   landing.js — content below the globe on the landing page:
   (1) business-segment cards (link to per-segment pages),
   (2) interactive financial bar charts (7 metrics),
   (3) segment Adjusted-Earnings breakdown,
   (4) rebased share-price comparison (Shell vs peers/gold/S&P).
   Charts are hand-built SVG — lightweight, no chart library.
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     1) SEGMENT CARDS
     ============================================================ */
  fetch("data/products.json")
    .then((r) => r.json())
    .then((data) => {
      const grid = document.getElementById("segments-grid");
      if (!grid) return;
      grid.innerHTML = data.segments
        .map(
          (s, i) => `
        <a class="segment-card reveal" data-delay="${i % 4}" href="${s.id}.html" data-link style="--seg-accent:${s.accent}">
          <div class="card-img"><img src="${s.image}" alt="${s.name}" loading="lazy"></div>
          <div class="card-body">
            <span class="tagline">${s.tagline}</span>
            <h3>${s.name}</h3>
            <p>${s.description.split(".")[0]}.</p>
            <div class="earn">${s.earningsShare}</div>
            <span class="card-cta">Explore segment →</span>
          </div>
        </a>`
        )
        .join("");
      if (window.ShellAtlas) window.ShellAtlas.initReveals();
    });

  /* ============================================================
     2) FINANCIAL BAR CHARTS  +  3) EARNINGS  +  4) SHARE PRICE
     ============================================================ */
  let fin = null;
  let currentMetric = "revenue";

  fetch("data/financials.json")
    .then((r) => r.json())
    .then((data) => {
      fin = data;
      buildMetricControls();
      renderChart(currentMetric, false);
      observeChart();
      buildEarnings();
      buildCompare();
    });

  /* ---------- shared helpers ---------- */
  const fmt = (metric, v) => {
    if (metric.format === "currency") return (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(1) + "B";
    if (metric.format === "perShare") return "$" + v.toFixed(2);
    return v.toLocaleString();
  };

  /* ---------- 2) BAR CHART ---------- */
  function buildMetricControls() {
    const ctr = document.getElementById("fin-controls");
    if (!ctr) return;
    ctr.innerHTML = fin.metrics
      .map((m) => `<button data-metric="${m.key}" class="${m.key === currentMetric ? "active" : ""}">${m.label}</button>`)
      .join("");
    ctr.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      currentMetric = btn.dataset.metric;
      ctr.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      renderChart(currentMetric, true);
    });
  }

  function renderChart(metricKey, animate) {
    const holder = document.getElementById("chart-svg");
    if (!holder || !fin) return;
    const metric = fin.metrics.find((m) => m.key === metricKey);
    const series = fin.series;
    const approx = new Set(metric.approxYears || []);

    const W = 720, H = 360, padL = 54, padR = 16, padT = 20, padB = 40;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const values = series.map((d) => d[metricKey]);
    const minV = Math.min(0, ...values), maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const y = (v) => padT + innerH - ((v - minV) / range) * innerH;
    const step = innerW / series.length;
    const bw = step * 0.58;
    const zeroY = y(0);

    let grid = "";
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const v = minV + (range * i) / ticks, gy = y(v);
      grid += `<line class="grid-line" x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}"/>`;
      grid += `<text class="axis-label" x="${padL - 8}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${Math.round(v).toLocaleString()}</text>`;
    }

    let bars = "";
    series.forEach((d, i) => {
      const v = d[metricKey];
      const x = padL + i * step + (step - bw) / 2;
      const top = Math.min(y(v), zeroY), hgt = Math.abs(y(v) - zeroY);
      const isNeg = v < 0;
      const flagged = approx.has(d.year);
      const fill = isNeg ? "var(--shell-red)" : metric.color;
      const anim = animate
        ? `<animate attributeName="height" from="0" to="${hgt.toFixed(1)}" dur="0.7s" fill="freeze" begin="${(i * 0.04).toFixed(2)}s" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" values="0;${hgt.toFixed(1)}"/>
           <animate attributeName="y" from="${zeroY.toFixed(1)}" to="${top.toFixed(1)}" dur="0.7s" fill="freeze" begin="${(i * 0.04).toFixed(2)}s" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" values="${zeroY.toFixed(1)};${top.toFixed(1)}"/>` : "";
      bars += `<rect class="bar" x="${x.toFixed(1)}" y="${animate ? zeroY.toFixed(1) : top.toFixed(1)}" width="${bw.toFixed(1)}" height="${animate ? 0 : hgt.toFixed(1)}" rx="3" fill="${fill}" opacity="${flagged ? 0.74 : 1}">
        <title>${d.year}: ${fmt(metric, v)}${flagged ? " (approx.)" : ""} — ${metric.source}</title>${anim}</rect>`;
      bars += `<text class="axis-label" x="${(x + bw / 2).toFixed(1)}" y="${H - padB + 18}" text-anchor="middle">${d.year}</text>`;
    });

    holder.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart-svg-holder" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${metric.label} by year (${metric.unit})">
      ${grid}
      <line class="grid-line" x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${W - padR}" y2="${zeroY.toFixed(1)}" style="stroke:var(--line-strong)"/>
      ${bars}</svg>`;

    const set = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    set("chart-title", metric.label);
    set("chart-unit", metric.unit + " · 2015–2024");
    set("chart-desc", metric.desc || "");
    renderStats(metricKey, metric);
  }

  function renderStats(metricKey, metric) {
    const box = document.getElementById("fin-stats");
    if (!box || !fin) return;
    const s = fin.series;
    const first = s[0][metricKey], last = s[s.length - 1][metricKey];
    const peak = s.reduce((a, b) => (b[metricKey] > a[metricKey] ? b : a));
    const changePct = first !== 0 ? (((last - first) / Math.abs(first)) * 100).toFixed(0) : "—";
    const up = last >= first;
    const approxYears = metric.approxYears || [];
    const confLine = approxYears.length
      ? `${approxYears.join(", ")} <span class="flag approximate">approx.</span>`
      : `All years <span class="flag verified">verified</span>`;
    const confHead = approxYears.length ? `Mostly <span class="accent-yellow">verified</span>` : `<span class="accent-yellow">Verified</span>`;

    box.innerHTML = `
      <div class="stat-card">
        <div class="label">${s[s.length - 1].year} ${metric.label}</div>
        <div class="value" style="color:${metric.color}">${fmt(metric, last)}</div>
        <div class="delta ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${changePct}% vs ${s[0].year}</div>
      </div>
      <div class="stat-card">
        <div class="label">Peak (2015–2024)</div>
        <div class="value">${fmt(metric, peak[metricKey])}</div>
        <div class="delta">in ${peak.year}</div>
      </div>
      <div class="stat-card">
        <div class="label">Data confidence · ${metric.label}</div>
        <div class="value" style="font-size:1.1rem">${confHead}</div>
        <div class="delta">${confLine}</div>
      </div>`;
  }

  function observeChart() {
    const target = document.getElementById("financials");
    if (!target || !("IntersectionObserver" in window)) return;
    let played = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && !played) { played = true; renderChart(currentMetric, true); io.disconnect(); } });
    }, { threshold: 0.25 });
    io.observe(target);
  }

  /* ---------- 3) SEGMENT EARNINGS BREAKDOWN ---------- */
  let earnYear = "2024";
  function buildEarnings() {
    const ctr = document.getElementById("earn-controls");
    const box = document.getElementById("earn-bars");
    if (!box || !fin || !fin.segmentEarnings) return;
    if (ctr) {
      const years = Object.keys(fin.segmentEarnings.years).sort().reverse();
      ctr.innerHTML = years.map((yr) => `<button data-yr="${yr}" class="${yr === earnYear ? "active" : ""}">${yr}</button>`).join("");
      ctr.addEventListener("click", (e) => {
        const btn = e.target.closest("button"); if (!btn) return;
        earnYear = btn.dataset.yr;
        ctr.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
        renderEarnings();
      });
    }
    renderEarnings();
  }
  function renderEarnings() {
    const box = document.getElementById("earn-bars");
    const data = fin.segmentEarnings.years[earnYear];
    const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)));
    box.innerHTML = data.map((d) => {
      const pct = (Math.abs(d.value) / maxAbs) * 100;
      const neg = d.value < 0;
      return `<div class="earn-row">
        <div class="nm">${d.name}</div>
        <div class="earn-track"><div class="earn-fill ${neg ? "neg" : ""}" style="width:${pct.toFixed(1)}%;background:${d.color}"></div></div>
        <div class="vl" style="color:${neg ? "var(--shell-red)" : "var(--txt-0)"}">${neg ? "-$" : "$"}${Math.abs(d.value).toFixed(1)}B</div>
      </div>`;
    }).join("");
    const note = document.getElementById("earn-note");
    if (note) note.innerHTML = `Adjusted Earnings by segment, ${earnYear} (USD bn). Integrated Gas and Upstream are the clear profit drivers; Renewables & Energy and Corporate were negative in 2024. <span class="flag verified">verified</span> · Source: ${fin.segmentEarnings.source}`;
  }

  /* ---------- 4) SHARE-PRICE COMPARISON (rebased to 100) ---------- */
  let activeSeries, currentRange;
  function buildCompare() {
    const sp = fin.sharePrice;
    if (!sp) return;
    activeSeries = new Set(sp.series.map((s) => s.id)); // all on by default
    currentRange = sp.ranges[0].startYear;

    // series toggles
    const tog = document.getElementById("cmp-series");
    if (tog) {
      tog.innerHTML = sp.series.map((s) =>
        `<button class="series-toggle" data-id="${s.id}"><span class="swatch" style="background:${s.color}"></span>${s.label}</button>`
      ).join("");
      tog.addEventListener("click", (e) => {
        const btn = e.target.closest(".series-toggle"); if (!btn) return;
        const id = btn.dataset.id;
        if (activeSeries.has(id)) { activeSeries.delete(id); btn.classList.add("off"); }
        else { activeSeries.add(id); btn.classList.remove("off"); }
        renderCompare();
      });
    }
    // range toggles
    const rng = document.getElementById("cmp-range");
    if (rng) {
      rng.innerHTML = sp.ranges.map((r, i) => `<button data-start="${r.startYear}" class="${i === 0 ? "active" : ""}">${r.label}</button>`).join("");
      rng.addEventListener("click", (e) => {
        const btn = e.target.closest("button"); if (!btn) return;
        currentRange = +btn.dataset.start;
        rng.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
        renderCompare();
      });
    }
    renderCompare();
  }

  function renderCompare() {
    const holder = document.getElementById("cmp-chart");
    const sp = fin.sharePrice;
    if (!holder || !sp) return;

    const startIdx = sp.years.indexOf(currentRange);
    const years = sp.years.slice(startIdx);
    const W = 760, H = 400, padL = 48, padR = 80, padT = 24, padB = 38;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    // rebase each active series to 100 at the range start
    const lines = sp.series
      .filter((s) => activeSeries.has(s.id))
      .map((s) => {
        const base = s.values[startIdx];
        const pts = years.map((yr, i) => ({ yr, v: (s.values[startIdx + i] / base) * 100 }));
        return { ...s, pts };
      });

    const allVals = lines.flatMap((l) => l.pts.map((p) => p.v));
    const minV = lines.length ? Math.min(100, ...allVals) : 0;
    const maxV = lines.length ? Math.max(100, ...allVals) : 200;
    const pad = (maxV - minV) * 0.08 || 10;
    const lo = Math.max(0, minV - pad), hi = maxV + pad;
    const rangeV = hi - lo || 1;
    const denom = Math.max(1, years.length - 1); // guard single-year ranges
    const x = (i) => padL + (innerW * i) / denom;
    const y = (v) => padT + innerH - ((v - lo) / rangeV) * innerH;

    // gridlines
    let grid = "";
    for (let i = 0; i <= 5; i++) {
      const v = lo + (rangeV * i) / 5, gy = y(v);
      grid += `<line class="grid-line" x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}"/>`;
      grid += `<text class="axis-label" x="${padL - 8}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${Math.round(v)}</text>`;
    }
    years.forEach((yr, i) => {
      grid += `<text class="axis-label" x="${x(i).toFixed(1)}" y="${H - padB + 18}" text-anchor="middle">${yr}</text>`;
    });
    // baseline at 100
    grid += `<line x1="${padL}" y1="${y(100).toFixed(1)}" x2="${W - padR}" y2="${y(100).toFixed(1)}" stroke="var(--line-strong)" stroke-dasharray="4 4"/>`;
    grid += `<text class="axis-label" x="${W - padR + 6}" y="${(y(100) + 3).toFixed(1)}" text-anchor="start" style="font-weight:700">100</text>`;

    let paths = "";
    lines.forEach((l) => {
      const d = l.pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
      paths += `<path class="cmp-line" d="${d}" stroke="${l.color}" style="${l.highlight ? "stroke-width:3.5" : ""}"/>`;
      l.pts.forEach((p, i) => {
        paths += `<circle class="cmp-dot" cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${l.highlight ? 3.4 : 2.6}" fill="${l.color}"><title>${l.label} ${p.yr}: ${Math.round(p.v)} (indexed; ${p.yr === currentRange ? "base" : (p.v >= 100 ? "+" : "") + Math.round(p.v - 100) + "%"})</title></circle>`;
      });
      // end label
      const last = l.pts[l.pts.length - 1];
      paths += `<text x="${(W - padR + 6).toFixed(1)}" y="${(y(last.v) + 3).toFixed(1)}" style="fill:${l.color};font-size:11px;font-weight:700">${Math.round(last.v)}</text>`;
    });

    holder.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="line-chart-holder" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Indexed share-price comparison rebased to 100">
      ${grid}${paths}
      ${lines.length === 0 ? `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="axis-label">Select a series to compare</text>` : ""}
    </svg>`;
  }
})();
