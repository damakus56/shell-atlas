# Shell Atlas

An **unofficial, educational** interactive web experience visualizing Shell plc's global energy
operations, business segments, finances and history.

> ⚠️ **Disclaimer:** This project is **not affiliated with, authorised by, or endorsed by Shell plc.**
> Shell's trademarks belong to their owner. Data is compiled from public sources and may be incomplete
> or out of date. Any figure flagged `approx.` or `illustrative` is **not** a confirmed fact.

## Pages

| Page | File | What it shows |
|------|------|---------------|
| **Atlas** (landing) | `index.html` | Full-screen interactive 3D globe of Shell's real assets, plus business-segment cards and a decade of financial charts. |
| **History** | `history.html` | An animated timeline of Shell's milestones, 1833 → today. |
| **Explore** | `explore.html` | A searchable Q&A explorer with sourced answers about Shell and the energy industry. |

## Tech

- **Vanilla HTML / CSS / JavaScript** — no build step, no framework.
- **[Globe.gl](https://github.com/vasturiano/globe.gl)** (wraps three.js) for the 3D globe, loaded from CDN.
- All content lives in **local JSON** under `data/` — edit those to change the site's data.
- Charts are **hand-built SVG** (no chart library).
- Shared header/footer/nav are injected by `js/shared.js`; client-side fade transitions between pages.

## Project structure

```
shell-atlas/
├── index.html          # Landing: globe + segments + financials
├── history.html        # Timeline page
├── explore.html        # Q&A explorer
├── css/style.css       # Single design-system stylesheet
├── js/
│   ├── shared.js       # Header/footer/nav, scroll progress, reveals, page transitions
│   ├── globe.js        # Globe.gl setup, points, arcs, tooltips, country focus
│   ├── landing.js      # Segment cards + SVG financial charts
│   ├── history.js      # Timeline rendering
│   └── explore.js      # Q&A explorer + modular getAnswer()
├── data/
│   ├── projects.json   # Globe assets + supply-route arcs
│   ├── financials.json # Year-by-year financials
│   ├── products.json   # Business segments
│   ├── history.json    # Timeline milestones
│   └── faq.json        # Q&A content
└── assets/             # Atmospheric imagery
```

## Run locally

Because the pages `fetch()` local JSON, open them via a **local web server** (not `file://`):

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works (`npx serve`, etc.).

## Data honesty

Every data point in the JSON carries a `source` and a `confidence` field:

- **`verified`** — from a real cited source.
- **`approximate`** — real entity, but an estimated detail (e.g. offshore coordinates, a 2015 figure from a single source).
- **`illustrative`** — invented for completeness; clearly flagged in the UI and never presented as fact.

Supply-route arcs on the globe are **illustrative** and labelled as such. See each JSON file's `_meta`
block for the primary sources.

## Customising

- **Data:** edit the JSON in `data/`. The UI reads field-for-field; add/remove array items freely.
- **Styling:** all tokens (colours, spacing, radii) are CSS variables at the top of `css/style.css`.
- **Live AI answers:** `js/explore.js` routes every answer through one `getAnswer()` function with a
  clearly-marked `// === LIVE BACKEND HOOK ===` — swap the local lookup for a `fetch()` to your AI
  endpoint and the rest of the UI is unchanged.
- **Official logo:** the header/footer use a text wordmark and a placeholder `.brand-logo-slot` mark
  (intentionally **not** the official Shell pecten). Drop a licensed logo there if you have rights.

## Deploy (GitHub Pages)

The site is fully static with relative paths, so it works on GitHub Pages as-is. A `.nojekyll` file is
included so Pages serves all files verbatim.
