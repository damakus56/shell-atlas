/* ============================================================
   shared.js — site-wide chrome and behaviours.
   Injects the shared header + footer, wires up navigation,
   scroll progress, reveal-on-scroll, and slick page transitions.
   Loaded on every page. Pure vanilla JS, no dependencies.
   ============================================================ */

(function () {
  "use strict";

  /* ---- Config: nav items shared across all pages ---- */
  const NAV = [
    { href: "index.html", label: "Atlas" },
    { href: "history.html", label: "History" },
    { href: "explore.html", label: "Explore" },
  ];

  const DISCLAIMER =
    "This is an <strong>unofficial</strong>, educational data-visualization project. " +
    "It is <strong>not affiliated with, authorised by, or endorsed by Shell plc</strong>. " +
    'Shell trademarks belong to their owner. Data is compiled from public sources and may be ' +
    "incomplete or out of date; figures flagged <em>approx.</em> or <em>illustrative</em> are not confirmed facts.";

  /* current page filename for active-state highlighting */
  const here = location.pathname.split("/").pop() || "index.html";

  /* ---------- Build header ---------- */
  function buildHeader() {
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html" data-link>
          <!-- Placeholder wordmark mark — NOT the official Shell pecten.
               Replace .brand-logo-slot contents with a licensed logo if available. -->
          <span class="brand-logo-slot" aria-hidden="true">S</span>
          <span>Shell<span class="atlas"> Atlas</span></span>
        </a>
        <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">☰</button>
        <nav class="nav">
          ${NAV.map(
            (n) =>
              `<a href="${n.href}" data-link class="${n.href === here ? "active" : ""}">${n.label}</a>`
          ).join("")}
        </nav>
      </div>`;
    document.body.prepend(header);

    // mobile menu toggle
    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".nav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Build footer (with the always-visible disclaimer) ---------- */
  function buildFooter() {
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer-top">
          <div>
            <div class="brand" style="font-size:1.05rem">
              <span class="brand-logo-slot" aria-hidden="true">S</span>
              <span>Shell<span class="atlas"> Atlas</span></span>
            </div>
            <p class="footer-meta" style="margin-top:10px">An interactive look at a global energy company — built for learning.</p>
          </div>
          <nav class="footer-links">
            ${NAV.map((n) => `<a href="${n.href}" data-link>${n.label}</a>`).join("")}
            <a href="https://www.shell.com" target="_blank" rel="noopener">Shell.com ↗</a>
          </nav>
        </div>
        <div class="disclaimer">${DISCLAIMER}</div>
        <div class="footer-meta">© ${new Date().getFullYear()} Shell Atlas (fan/educational project). All data attributed to its public sources in the underlying JSON.</div>
      </div>`;
    document.body.appendChild(footer);
  }

  /* ---------- Scroll progress bar + header tint ---------- */
  function buildScrollProgress() {
    const bar = document.createElement("div");
    bar.id = "scroll-progress";
    document.body.appendChild(bar);

    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal-on-scroll (IntersectionObserver) ---------- */
  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  // Expose so dynamically-added content can register new reveals.
  window.ShellAtlas = window.ShellAtlas || {};
  window.ShellAtlas.initReveals = initReveals;

  /* ---------- Slick client-side page transitions ----------
     Intercepts internal links, fades out, then navigates.
     Falls back to normal navigation if anything is off. */
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
      if (url === here) {
        // same page → just scroll to top smoothly
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      e.preventDefault();
      document.body.classList.add("is-leaving");
      setTimeout(() => (window.location.href = url), 420);
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    buildHeader();
    buildFooter();
    buildScrollProgress();
    initReveals();
    initPageTransitions();
  });
})();
