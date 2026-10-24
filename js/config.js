/* =========================================================================
   Site Intelligence — configuration
   THIS IS THE FILE YOU EDIT WHEN YOU DROP IN YOUR OWN PDF.
   ========================================================================= */

window.PF = window.PF || {};

PF.config = {
  /* Path to the master PDF that contains every section. Replace the file at
     this path with your own PDF (or change the path). */
  reportPdf: 'assets/report.pdf',

  /* Pages (1-based) that are ALWAYS included, in order, before the sections.
     Land Parcel Feasibility Report (redesigned): 1 = cover, 2 = contents table. */
  alwaysFirst: [1, 2],

  /* Executive summary: always included, right after the contents. */
  summaryPages: [3],

  /* Pages for each selectable section (1-based, inclusive).
     Keys must match the section ids in js/data.js → PF.sections.
     An empty list means the section has no pages yet (shown as "In preparation"). */
  sectionPages: {
    overview:   [4, 5],       // 1 Property Overview (ownership, Vaastu)
    infra:      [6, 7, 8, 9],    // 2 Infrastructure & Connectivity (existing, upcoming, satellite)
    regulatory: [10, 11, 12],      // 3 Regulatory & Approvals (boundary & zoning, buildability)
    records:    [13],         // 4 Property Records, Ownership & Litigation (placeholder page)
    market:     [14, 15],     // 5 Market & Catchment Intelligence (market data, demographics)
    site:       [16, 17],     // 6 Site Attributes & Considerations (physical, structures)
  },

  /* Pages always appended at the end. Here: 18 = methodology. */
  alwaysLast: [18],

  /* Writes the chosen asset type, sections, date and reference on the cover,
     in the empty area under the title block. PDF points from bottom-left. */
  coverStamp: {
    enabled: true,
    page: 1,
    x: 45,
    y: 160,
    width: 505,
    size: 9.5,
    lineGap: 16,
    color: [0.17, 0.20, 0.27],
    labelColor: [0.54, 0.58, 0.64],
    accent: [0.63, 0.14, 0.17],   // crimson, matches the report
  },

  /* Contents page: rows for sections that were NOT chosen are faded out.
     rows = [top, bottom] of each table row, in points from the top of the page. */
  contents: {
    enabled: true,
    page: 2,
    x0: 44, x1: 551, labelX: 97, labelAtBottom: true,
    labelColor: [0.63, 0.14, 0.17],
    rows: {
      overview:   [189.5, 262.3],
      infra:      [262.3, 361.4],
      regulatory: [361.4, 423.4],
      records:    [423.4, 544.4],
      market:     [544.4, 680.7],
      site:       [680.7, 764.5],
    },
  },

  /* Footer page numbers: the original "Page X of 18" is covered and rewritten
     so numbering matches the assembled report. */
  pageNumbers: {
    enabled: true,
    skip: [1],                 // source pages without a page number (cover)
    cover: [488, 23, 64, 16],  // white box over the old number: x, y, w, h
    right: 550.4, y: 28.6, size: 7.5,
    color: [0.36, 0.40, 0.46],
  },

  /* Vendored libraries (served from your own site, no CDN needed). */
  vendor: {
    pdfjs: 'assets/vendor/pdf.min.mjs',
    pdfjsWorker: 'assets/vendor/pdf.worker.min.mjs',
    pdflib: 'assets/vendor/pdf-lib.min.js',
  },

  /* Search / geocoding (Esri ArcGIS World Geocoding Service, keyless).
     countryCode biases results to one country (ISO-3); '' searches worldwide. */
  geocoder: { countryCode: 'IND' },

  /* Explore-map basemap tiles. {theme} is replaced with the CARTO style (rastertiles/voyager). */
  tiles: 'https://{s}.basemaps.cartocdn.com/{theme}/{z}/{x}/{y}{r}.png',
  tileAttribution: '&copy; OpenStreetMap contributors &copy; CARTO',

  /* Google Maps Embed API key for the in-platform Street View viewer (free; enable "Maps Embed API"
     in Google Cloud and restrict the key to your domain). Leave empty to use the keyless embed. */
  googleMapsEmbedKey: '',

  /* File name prefix for the downloaded PDF. */
  downloadName: 'HDFC-Capital-Site-Report',

  /* Fake generation time (ms) for the loading screen. */
  generateMs: 5200,
};
