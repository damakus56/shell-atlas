/* ============================================================
   explore.js — the Q&A explorer.
   Questions/answers come from data/faq.json today, but ALL answer
   retrieval goes through a single modular getAnswer() function so
   it can later be swapped to a live AI backend without touching
   the UI. See the clearly-marked hook inside getAnswer().
   ============================================================ */

(function () {
  "use strict";

  let faq = [];
  let activeId = null;

  // Escape user-typed text before putting it in innerHTML (defensive).
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  /* ============================================================
     getAnswer(question) — THE SWAPPABLE ANSWER SOURCE.
     Returns a Promise resolving to { q, a, source } (or null).

     Today: looks the question up in the locally-loaded faq array.
     Later: replace the body of the `// === LIVE BACKEND HOOK ===`
     block with a fetch() to your AI endpoint. The UI calls only
     this function and awaits a Promise, so nothing else changes.
     ============================================================ */
  async function getAnswer(question) {
    const query = (question || "").toString().trim().toLowerCase();

    // === LIVE BACKEND HOOK ===========================================
    // To go live, uncomment and adapt. Keep the same return shape
    // ({ q, a, source }) and the rest of the app keeps working:
    //
    //   const res = await fetch("https://your-api.example/ask", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ question }),
    //   });
    //   const data = await res.json();
    //   return { q: question, a: data.answer, source: data.source || "Live AI" };
    //
    // ⚠️ SECURITY: today's answers come from author-controlled JSON and
    // are rendered with innerHTML. A live AI/remote response is UNTRUSTED
    // — sanitize it or render it as textContent before swapping this in,
    // or you introduce an XSS vector via ans.a / ans.source.
    // =================================================================

    // ---- Local fallback (current implementation) ----
    // Exact id match first, then exact question text, then fuzzy contains.
    let hit =
      faq.find((f) => f.id === query) ||
      faq.find((f) => f.q.toLowerCase() === query) ||
      faq.find((f) => f.q.toLowerCase().includes(query) && query.length > 2);
    return hit ? { q: hit.q, a: hit.a, source: hit.source } : null;
  }

  // expose for debugging / future reuse
  window.ShellAtlas = window.ShellAtlas || {};
  window.ShellAtlas.getAnswer = getAnswer;

  /* ---------- Boot ---------- */
  fetch("data/faq.json")
    .then((r) => r.json())
    .then((data) => {
      faq = data.questions;
      renderList(faq);
      if (faq.length) selectQuestion(faq[0].id);
      wireSearch();
    })
    .catch((err) => console.error("Failed to load faq.json", err));

  function renderList(items) {
    const list = document.getElementById("q-list");
    if (!list) return;
    if (!items.length) {
      list.innerHTML = `<div class="no-results">No questions match your search.</div>`;
      return;
    }
    list.innerHTML = items
      .map(
        (f) => `
      <button class="q-item ${f.id === activeId ? "active" : ""}" data-id="${f.id}">
        ${f.q}
        <span class="tags">${(f.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</span>
      </button>`
      )
      .join("");
    list.querySelectorAll(".q-item").forEach((btn) =>
      btn.addEventListener("click", () => selectQuestion(btn.dataset.id))
    );
  }

  async function selectQuestion(id) {
    activeId = id;
    document
      .querySelectorAll(".q-item")
      .forEach((b) => b.classList.toggle("active", b.dataset.id === id));

    const panel = document.getElementById("answer-panel");
    if (!panel) return;
    panel.classList.remove("fade");
    panel.innerHTML = `<div class="loading">Fetching answer…</div>`;

    // Always go through getAnswer() — same path a live backend would use.
    const ans = await getAnswer(id);
    // reflow to restart the CSS animation
    void panel.offsetWidth;
    panel.classList.add("fade");

    if (!ans) {
      panel.innerHTML = `<div class="no-results">No answer found.</div>`;
      return;
    }
    panel.innerHTML = `
      <div class="q">${ans.q}</div>
      <div class="a">${ans.a}</div>
      <div class="src">Source: ${ans.source}</div>`;
  }

  function wireSearch() {
    const input = document.getElementById("q-search");
    if (!input) return;
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      const filtered = !q
        ? faq
        : faq.filter(
            (f) =>
              f.q.toLowerCase().includes(q) ||
              f.a.toLowerCase().includes(q) ||
              (f.tags || []).some((t) => t.includes(q))
          );
      renderList(filtered);
    });

    // Enter key → answer the typed question directly via getAnswer()
    input.addEventListener("keydown", async (e) => {
      if (e.key !== "Enter") return;
      const typed = input.value.trim();
      if (!typed) return;
      const ans = await getAnswer(typed);
      const panel = document.getElementById("answer-panel");
      if (!panel) return;
      activeId = null;
      document.querySelectorAll(".q-item").forEach((b) => b.classList.remove("active"));
      void panel.offsetWidth;
      panel.classList.add("fade");
      if (ans) {
        panel.innerHTML = `
          <div class="q">${ans.q}</div>
          <div class="a">${ans.a}</div>
          <div class="src">Source: ${ans.source}</div>`;
      } else {
        // Give clear feedback on a miss — the placeholder invites typing a question.
        panel.innerHTML = `<div class="no-results">No saved answer for "${esc(typed)}". Try one of the questions on the left, or search a keyword.</div>`;
      }
    });
  }
})();
