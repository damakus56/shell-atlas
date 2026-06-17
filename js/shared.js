/* ============================================================
   shared.js — site-wide chrome and behaviours (LIGHT theme).
   Injects shared header + footer, an original pecten-inspired
   logo, the Businesses dropdown, scroll progress, reveal-on-scroll,
   header scroll state, and slick page transitions.
   Loaded on every page. Vanilla JS, no dependencies.
   ============================================================ */

(function () {
  "use strict";

  /* ---- Original, pecten-INSPIRED logo mark (NOT the Shell trademark) ----
     A stylised fan of five rounded ribs in a yellow→red gradient — evokes a
     scallop without copying Shell's specific pecten artwork. */
  const LOGO_SVG = `
    <svg class="logo-mark" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pectenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FBCE07"/>
          <stop offset="0.55" stop-color="#FBA907"/>
          <stop offset="1" stop-color="#DD1D21"/>
        </linearGradient>
      </defs>
      <g transform="translate(50,86)">
        <rect x="-7" y="-58" width="14" height="58" rx="7" transform="rotate(-50)" fill="url(#pectenGrad)" opacity="0.92"/>
        <rect x="-7" y="-66" width="14" height="66" rx="7" transform="rotate(-25)" fill="url(#pectenGrad)" opacity="0.96"/>
        <rect x="-7" y="-70" width="14" height="70" rx="7" transform="rotate(0)"   fill="url(#pectenGrad)"/>
        <rect x="-7" y="-66" width="14" height="66" rx="7" transform="rotate(25)"  fill="url(#pectenGrad)" opacity="0.96"/>
        <rect x="-7" y="-58" width="14" height="58" rx="7" transform="rotate(50)"  fill="url(#pectenGrad)" opacity="0.92"/>
        <circle cx="0" cy="0" r="7" fill="#DD1D21"/>
      </g>
    </svg>`;

  /* ---- Primary nav ---- */
  const NAV = [
    { href: "index.html", label: "Atlas" },
    { href: "history.html", label: "History" },
    { href: "explore.html", label: "Explore" },
  ];

  /* ---- Business segment pages (also used for the dropdown) ---- */
  const SEGMENTS = [
    { href: "integrated-gas.html", label: "Integrated Gas", color: "#E8A100" },
    { href: "upstream.html", label: "Upstream", color: "#DD1D21" },
    { href: "marketing.html", label: "Marketing", color: "#FFB81C" },
    { href: "chemicals-products.html", label: "Chemicals & Products", color: "#FF6B35" },
    { href: "renewables.html", label: "Renewables & Energy", color: "#0E9F6E" },
    { href: "corporate.html", label: "Corporate", color: "#6B7280" },
  ];

  const DISCLAIMER =
    "This is an <strong>unofficial</strong>, educational data-visualization project. " +
    "It is <strong>not affiliated with, authorised by, or endorsed by Shell plc</strong>. " +
    "The logo is an original design, not Shell's trademark; Shell trademarks belong to their owner. " +
    "Data is compiled from public sources and may be incomplete or out of date; figures flagged " +
    "<em>approx.</em> or <em>illustrative</em> are not confirmed facts.";

  const here = location.pathname.split("/").pop() || "index.html";
  const segmentHrefs = SEGMENTS.map((s) => s.href);

  /* ---------- Header ---------- */
  function buildHeader() {
    const header = document.createElement("header");
    header.className = "site-header";
    const businessesActive = segmentHrefs.includes(here) ? "active" : "";
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html" data-link>
          ${LOGO_SVG}
          <span>Shell<span class="atlas"> Atlas</span></span>
        </a>
        <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">☰</button>
        <nav class="nav">
          <a href="index.html" data-link class="${here === "index.html" ? "active" : ""}">Atlas</a>
          <div class="nav-drop">
            <button aria-haspopup="true" aria-expanded="false" style="${businessesActive ? "color:#DD1D21" : ""}">Businesses <span class="caret">▾</span></button>
            <div class="nav-drop-menu">
              ${SEGMENTS.map((s) => `<a href="${s.href}" data-link><span class="swatch" style="background:${s.color}"></span>${s.label}</a>`).join("")}
            </div>
          </div>
          <a href="history.html" data-link class="${here === "history.html" ? "active" : ""}">History</a>
          <a href="explore.html" data-link class="${here === "explore.html" ? "active" : ""}">Explore</a>
        </nav>
      </div>`;
    document.body.prepend(header);

    // Mobile menu toggle
    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".nav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Businesses dropdown
    const drop = header.querySelector(".nav-drop");
    const dropBtn = drop.querySelector("button");
    dropBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = drop.classList.toggle("open");
      dropBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", () => drop.classList.remove("open"));

    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });

    // Header shadow on scroll
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Footer ---------- */
  function buildFooter() {
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer-top">
          <div>
            <div class="brand" style="font-size:1.1rem">${LOGO_SVG}<span>Shell<span class="atlas"> Atlas</span></span></div>
            <p class="footer-meta" style="margin-top:10px">An interactive look at a global energy company — built for learning.</p>
          </div>
          <nav class="footer-links">
            ${NAV.map((n) => `<a href="${n.href}" data-link>${n.label}</a>`).join("")}
            ${SEGMENTS.slice(0, 3).map((s) => `<a href="${s.href}" data-link>${s.label}</a>`).join("")}
            <a href="https://www.shell.com" target="_blank" rel="noopener">Shell.com ↗</a>
          </nav>
        </div>
        <div class="disclaimer">${DISCLAIMER}</div>
        <div class="footer-meta">© ${new Date().getFullYear()} Shell Atlas (fan/educational project). Data is attributed to its public sources in the underlying JSON. Images are AI-generated (illustrative) or credited CC-licensed photographs.</div>
      </div>`;
    document.body.appendChild(footer);
  }

  /* ---------- Scroll progress ---------- */
  function buildScrollProgress() {
    const bar = document.createElement("div");
    bar.id = "scroll-progress";
    document.body.appendChild(bar);
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal-on-scroll ---------- */
  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
  }
  window.ShellAtlas = window.ShellAtlas || {};
  window.ShellAtlas.initReveals = initReveals;

  /* ---------- Page transitions ---------- */
  function initPageTransitions() {
    const fade = document.createElement("div");
    fade.id = "page-fade";
    document.body.appendChild(fade);
    document.body.classList.add("page-enter");
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-link]");
      if (!a) return;
      const url = a.getAttribute("href");
      if (!url || url.startsWith("http") || url.startsWith("#")) return;
      if (url === here) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      e.preventDefault();
      document.body.classList.add("is-leaving");
      setTimeout(() => (window.location.href = url), 400);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildHeader();
    buildFooter();
    buildScrollProgress();
    initReveals();
    initPageTransitions();
  });
})();
