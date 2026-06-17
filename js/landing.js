/* ============================================================
   landing.js — content for the landing page below the globe:
   (1) business segment cards, (2) interactive financial charts.
   Charts are hand-built SVG (no chart library) so they stay
   lightweight and fully styleable; bars animate in on scroll.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Products / segments ---------- */
  fetch("data/products.json")
    .then((r) => r.json())
    .then((data) => {
      const grid = document.getElementById("segments-grid");
      if (!grid) return;
      grid.innerHTML = data.segments
        .map(
          (s, i) => `
        <article class="segment-card reveal" data-delay="${i % 4}" style="--seg-accent:${s.accent}">
          <span class="tagline">${s.tagline}</span>
          <h3>${s.name}</h3>
          <p>${s.description}</p>
        </article>`
        )
        .join("");
      if (window.ShellAtlas) window.ShellAtlas.initReveals();
    });

  /* ---------- Financials ---------- */
  let fin = null;
  let currentMetric = "revenue";

  fetch("data/financials.json")
    .then((r) => r.json())
    .then((data) => {
      fin = data;
      buildControls();
      renderChart(currentMetric, false);
      // animate the chart only when the financials section scrolls into view
      observeChart();
    });

  function buildControls() {
    const ctr = document.getElementById("fin-controls");
    if (!ctr) return;
    ctr.innerHTML = fin.metrics
      .map(
        (m) =>
          `<button data-metric="${m.key}" class="${m.key === currentMetric ? "active" : ""}">${m.label}</button>`
      )
      .join("");
    ctr.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      currentMetric = btn.dataset.metric;
      ctr.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      renderChart(currentMetric, true);
    });
  }

  const fmt = (metric, v) => {
    if (metric.format === "currency") return (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(1) + "B";
    return v.toLocaleString();
  };

  /* Build a responsive SVG bar chart for the chosen metric. */
  function renderChart(metricKey, animate) {
    const holder = document.getElementById("chart-svg");
    if (!holder || !fin) return;
    const metric = fin.metrics.find((m) => m.key === metricKey);
    const series = fin.series;

    // layout
    const W = 720, H = 360, padL = 52, padR = 16, padT = 20, padB = 40;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    const values = series.map((d) => d[metricKey]);
    const minV = Math.min(0, ...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const y = (v) => padT + innerH - ((v - minV) / range) * innerH;
    const bw = (innerW / series.length) * 0.6;
    const step = innerW / series.length;
    const zeroY = y(0);

    // gridlines (5 ticks)
    let grid = "";
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const v = minV + (range * i) / ticks;
      const gy = y(v);
      grid += `<line class="grid-line" x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}"/>`;
      grid += `<text class="axis-label" x="${padL - 8}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${Math.round(v).toLocaleString()}</text>`;
    }

    // bars + labels
    let bars = "";
    series.forEach((d, i) => {
      const v = d[metricKey];
      const x = padL + i * step + (step - bw) / 2;
      const top = Math.min(y(v), zeroY);
      const hgt = Math.abs(y(v) - zeroY);
      const isNeg = v < 0;
      const flagged = d.confidence !== "verified";
      const fill = isNeg ? "var(--shell-red)" : metric.color;
      // animation: start collapsed at the zero line, grow to full height
      const animAttrs = animate
        ? `<animate attributeName="height" from="0" to="${hgt.toFixed(1)}" dur="0.7s" fill="freeze" begin="${(i * 0.04).toFixed(2)}s" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" values="0;${hgt.toFixed(1)}"/>
           <animate attributeName="y" from="${zeroY.toFixed(1)}" to="${top.toFixed(1)}" dur="0.7s" fill="freeze" begin="${(i * 0.04).toFixed(2)}s" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" values="${zeroY.toFixed(1)};${top.toFixed(1)}"/>`
        : "";
      bars += `<rect class="bar" x="${x.toFixed(1)}" y="${animate ? zeroY.toFixed(1) : top.toFixed(1)}"
                 width="${bw.toFixed(1)}" height="${animate ? 0 : hgt.toFixed(1)}" rx="3"
                 fill="${fill}" opacity="${flagged ? 0.75 : 1}">
                 <title>${d.year}: ${fmt(metric, v)}${flagged ? " (" + d.confidence + ")" : ""} — ${d.source}</title>
                 ${animAttrs}
               </rect>`;
      // year labels
      bars += `<text class="axis-label" x="${(x + bw / 2).toFixed(1)}" y="${H - padB + 18}" text-anchor="middle">${d.year}</text>`;
    });

    holder.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="chart-svg-holder" preserveAspectRatio="xMidYMid meet" role="img"
           aria-label="${metric.label} by year (${metric.unit})">
        ${grid}
        <line class="grid-line" x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${W - padR}" y2="${zeroY.toFixed(1)}" style="stroke:var(--line-strong)"/>
        ${bars}
      </svg>`;

    // header + plain-language description (helps non-expert readers)
    const titleEl = document.getElementById("chart-title");
    const unitEl = document.getElementById("chart-unit");
    const descEl = document.getElementById("chart-desc");
    if (titleEl) titleEl.textContent = metric.label;
    if (unitEl) unitEl.textContent = metric.unit + " · 2015–2024";
    if (descEl) descEl.textContent = metric.desc || "";

    renderStats(metricKey, metric);
  }

  /* Quick stat cards: latest value, 10-yr change, peak. */
  function renderStats(metricKey, metric) {
    const box = document.getElementById("fin-stats");
    if (!box || !fin) return;
    const s = fin.series;
    const first = s[0][metricKey];
    const last = s[s.length - 1][metricKey];
    const peak = s.reduce((a, b) => (b[metricKey] > a[metricKey] ? b : a));
    const changePct = first !== 0 ? (((last - first) / Math.abs(first)) * 100).toFixed(0) : "—";
    const up = last >= first;

    // Confidence stat is derived from THIS metric's actual per-year confidence values,
    // so it stays honest whichever metric is selected.
    const approxYears = s.filter((d) => d.confidence !== "verified").map((d) => d.year);
    const confidenceLine = approxYears.length
      ? `${approxYears.join(", ")} <span class="flag approximate">approx.</span>`
      : `All years <span class="flag verified">verified</span>`;
    const confidenceHead = approxYears.length
      ? `Mostly <span class="accent-yellow">verified</span>`
      : `<span class="accent-yellow">Verified</span>`;

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
        <div class="value" style="font-size:1.1rem">${confidenceHead}</div>
        <div class="delta">${confidenceLine}</div>
      </div>`;
  }

  /* Re-render with animation the first time the chart scrolls into view. */
  function observeChart() {
    const target = document.getElementById("financials");
    if (!target || !("IntersectionObserver" in window)) return;
    let played = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !played) {
            played = true;
            renderChart(currentMetric, true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(target);
  }
})();
