# HDFC Capital Location Intelligence — concept prototype

A clickable, no-build prototype for a real estate data-intelligence product:
home page → interactive India map + Atlas chat → property type → report sections → generated PDF viewer.
All content is dummy data.

---

## 1. What's in the folder

```
plotform/
├── index.html                  All four screens (home, builder, generating, report)
├── css/styles.css              Design tokens (dark + light theme), layout, components
├── js/
│   ├── config.js               ← EDIT THIS when you swap in your own PDF
│   ├── data.js                 Dummy data: places, metro, upcoming infra, POIs,
│   │                             property taxonomy, report sections, icons
│   ├── app.js                  State + hash router (#home, #build, #generating, #report)
│   ├── city.js                 Animated 3D night city (hero + generating screen), no libraries
│   ├── geocode.js              Search (Esri geocoder) + Google Maps link helpers
│   ├── sitemap.js              Lightweight map for the location / boundary steps (pan, zoom, draw)
│   ├── location.js             Property location, boundary drawing, confirmation, validation
│   ├── home.js                 Hero animation, search, Leaflet map, Atlas chat
│   ├── builder.js              Step 1 property type, Step 2 sections, Step 3 generating
│   └── report.js               Builds the PDF (pdf-lib) and renders it (pdf.js)
├── assets/
│   ├── report.pdf              Master report: Land Parcel Feasibility Report v10 (16 pages)
│   └── vendor/                 pdf.js + pdf-lib (bundled, no CDN needed)
└── tools/                      build_standalone.py (single-file build), compress_pdf.py
```

Only Leaflet (map library), Google Fonts and the CARTO basemap tiles load from the internet.

## 2. Run it locally

**Easiest: double-click `HDFC-Capital-Site-Intelligence.html` (built as `Plotform.html`).** It's a single self-contained file (styles, scripts, PDF libraries and the
sample report are all embedded), so it works straight from your Downloads folder with no server.
Only the live map and fonts need an internet connection. If you change any source files, rebuild it with
`python3 tools/build_standalone.py`.

**Working on the source files instead:**

The report step reads the PDF with `fetch()`, which browsers block on `file://`. Serve the folder:

```bash
cd plotform
python3 -m http.server 8080        # or:  npx serve .
```

Open http://localhost:8080.

## 3. Walk through the flow (what to demo)

1. **Home.** Hero with the thesis, a search bar, and the primary **Generate your report** button.
   The button is also pinned in the nav and, on phones, in a sticky bottom bar.
2. **Explore the map.** *Explore the live map* (hero) or *Explore map* (nav) opens a full-screen map of India.
   Jump to a city, search any location, or click anywhere: a site card shows zoning, master plan, nearest metro,
   airport/city-centre distance and amenity counts (data only, no valuations). Toggle Metro, Upcoming infra,
   Amenities and Satellite layers. *Generate report for this site* starts the builder with that location.
3. (The earlier chat assistant has been removed; the map page is the interactive explorer.)
4. **Generate your report → Step 1.** Pick a category, then the asset type.
5. **Step 2 – Location.** Select on map (with search), paste a Google Maps link, or enter coordinates.
6. **Step 3 – Site boundary.** Draw the parcel (required, optional or skipped, depending on the property type).
7. **Step 4 – Report sections.** Pick one or more of the 6 sections; each shows a description, what it includes and its page count.
8. **Step 5 – Confirm → Generate report.** A short analysis sequence, then the **report viewer**: a PDF assembled from
   only the chosen sections, with a section index, page thumbnails, zoom and download.

## 4. Drop in your own PDF

1. Replace `assets/report.pdf` with your file (keep the name, or change `reportPdf` in `js/config.js`).
   Large image-heavy PDFs can be shrunk first with `python3 tools/compress_pdf.py in.pdf assets/report.pdf` (needs `pip install pikepdf pillow`).
2. In `js/config.js`, map your page numbers (1-based) to each section:

```js
alwaysFirst: [1, 2],              // cover + contents, always included
summaryPages: [3],                // executive summary, always included
sectionPages: {
  overview:   [4, 5],             // 01 Property Overview
  infra:      [6, 7, 8],          // 02 Infrastructure & Connectivity
  regulatory: [9, 10],            // 03 Regulatory & Approvals
  records:    [11],               // 04 Property Records, Ownership & Litigation (placeholder)
  market:     [12, 13],           // 05 Market & Catchment Intelligence
  site:       [14, 15],           // 06 Site Attributes & Considerations
},
alwaysLast: [16],                 // methodology
```

3. What the app adds to the assembled PDF (all in `js/config.js`):
   - `coverStamp`: a "Report configuration" block on the cover (asset type, sections, date, reference).
   - `contents`: fades out the rows of the contents table for sections that weren't selected.
     `rows` holds each row's top/bottom position in points, so update it if your contents page changes.
   - `pageNumbers`: covers the original "Page X of 16" footer and rewrites it for the new page count.
   Set `enabled: false` on any of these to switch it off.
4. If you change section names, descriptions or page counts shown in the UI, edit `PF.sections` in `js/data.js`.

## 4b. HDFC Capital branding

- Put the official logo at `assets/brand/hdfc-capital-logo.png` (transparent PNG, roughly 300 px tall) or
  `hdfc-capital-logo.svg` (then change the two `src="assets/brand/hdfc-capital-logo.png"` references in `index.html`).
  Until the file is there, a plain text wordmark is shown instead.
- `python3 tools/build_standalone.py` embeds the logo into `Plotform.html` automatically.
- Brand colours live at the top of `css/styles.css`: navy `--ink`/`--navy`, crimson `--brand` (taken from the
  HDFC Capital report), deep maroon `--brand-deep`, gold `--gold`. Fonts: Fraunces (headings) and Manrope (text).

## 5. Customise

| What | Where |
|---|---|
| Brand name / logo | `index.html` (search "Plotform"), `.brand-mark` SVG |
| Colours, fonts, radius | Tokens at the top of `css/styles.css` |
| 3D city look, parcel position, transit lines | `js/city.js` (`P` = subject parcel, `lines` = glowing routes) |
| Hero callouts pinned to the city | `index.html` → `#callouts` (each has a `data-anchor`) |
| Cities, micro-markets, metro lines, projects (pan-India) | `js/data.js` → `PF.cities`, `PF.places`, `PF.metro`, `PF.upcoming` |
| Property types | `js/data.js` → `PF.taxonomy` |
| Chat answers | `js/home.js` → `answer()` (keyword intents) |
| Generation duration | `js/config.js` → `generateMs` |

## 5a. Property location & boundary

Right after the property type, every report asks *where* the property is (map, Google Maps link or coordinates),
then, when relevant, *what the site is* (a drawn land boundary with approximate area), then a confirmation.

- **Which property types need a boundary** is set in `js/data.js` → `PF.propertyTypeConfig`
  (`required`, `optional` or `not_applicable`, by category with per-type overrides). No screen code changes needed.
- **Data model**: `PF.state.location` and `PF.state.boundary` are separate; `PF.reportData()` returns both,
  together with the property type and sections. The boundary is stored as GeoJSON (`[lng, lat]`).
- **Where it's used**: report cover stamp, generation screen, and the Explore map (centres on the property
  and outlines the boundary). *Edit location* is available on the confirmation step, the report toolbar and the map card.
- **Map engine for these steps**: `js/sitemap.js` (no library). Basemaps: Esri Streets and Esri Satellite
  (imagery + road and place labels). Free with the "Powered by Esri" attribution. If Esri tiles can't load, the map falls back to CARTO/OpenStreetMap streets, and if no imagery can load at all (offline, or a page that blocks external images) it shows a coordinate grid so the pin and boundary still work.
- **Search**: `js/geocode.js` uses the Esri ArcGIS World Geocoding Service (keyless, results shown and not stored):
  as-you-type suggestions, place lookup and reverse geocoding for the locality. Results are biased to India via
  `PF.config.geocoder.countryCode` (`'IND'`; set `''` for worldwide). Typed "lat, long" and known localities work offline.
  Used in the hero search, the Explore map search and the Location step.
- **Google Maps**: free official Maps URLs (no API key): *Open in Google Maps* and *Street View* buttons on the
  location result, confirmation card and map card, plus a clickable Google Maps link on the PDF cover.
  An embedded, interactive Google map and Google Places search need a Google Cloud API key with billing enabled,
  which is why Esri powers the in-app map and search.
- **Google Maps links**: full links with `@lat,lng`, `!3d…!4d…`, `?q=lat,lng`, `/place/lat,lng`, `geo:` are read.
  Short `maps.app.goo.gl` links can't be expanded in the browser, so users are asked for the full link instead.

## 6. Taking it beyond a concept

- Swap the keyword chat in `answer()` for a call to an LLM with tool access to your geo APIs.
- Replace `PF.snapshot()` with an API call that returns parcel attributes for a lat/long.
- Generate the PDF server-side per request instead of slicing a master file.
- Port to React/Next.js: each view in `index.html` maps cleanly to a route, and `PF.state` to a store.

## 7. The report document

The sample report (`assets/report.pdf`) is generated from `tools/report/build.js` (docx-js) and
`tools/report/charts.py` + `tools/report/graphics.py` (matplotlib), in the same navy / crimson / gold look as the site:
`python3 charts.py && python3 graphics.py && python3 figures.py && node build.js report.docx` (add `--unbranded` for a version without the logo),
then convert to PDF. The page map, contents rows, cover stamp and footer positions in `js/config.js`
match this layout; re-measure them if the document layout changes.
