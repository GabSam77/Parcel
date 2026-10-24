/* =========================================================================
   Land Parcel Feasibility Report — redesigned in the Location Intelligence look
   node build.js [--unbranded] [out.docx]
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const d = require('docx');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, AlignmentType, VerticalAlign, Header, Footer, PageNumber, SectionType, LevelFormat,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, HorizontalPositionAlign, VerticalPositionAlign,
  TextWrappingType, TabStopType, HeightRule,
} = d;

const UNBRANDED = process.argv.includes('--unbranded');
const OUT = process.argv.filter(a => a.endsWith('.docx'))[0] || 'report.docx';
const A = f => path.join(__dirname, 'assets', f);

/* ---------- design tokens (from the website) ---------- */
const C = {
  ink: '0E2240', navy: '0E2A55', brand: 'A1232B', deep: '711528', gold: 'B48A3C',
  text: '2B3445', muted: '5B6676', dim: '8A93A3', line: 'DADCE0', soft: 'F5F6F8', soft2: 'EEF1F5',
  brandSoft: 'F7E9EA', navySoft: 'EAF0F8', ok: '18794E', okSoft: 'E3F3EA', warn: 'B26A00', warnSoft: 'FBF0DC', white: 'FFFFFF',
};
const SERIF = 'Georgia', SANS = 'Calibri';
const PAGE_W = 11906, PAGE_H = 16838, MX = 900;
const CW = PAGE_W - MX * 2;           // content width in twips
const PX = tw => Math.round(tw / 15); // twips → px (96 dpi)

/* ---------- primitives ---------- */
const NB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NOB = { top: NB, bottom: NB, left: NB, right: NB };
const TBL_NOB = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const line = (sz = 4, color = C.line) => ({ style: BorderStyle.SINGLE, size: sz, color });

const r = (text, o = {}) => new TextRun({ text, font: o.font || SANS, size: o.size || 19, color: o.color || C.text,
  bold: o.bold, italics: o.italics, characterSpacing: o.sp, allCaps: o.caps, shading: o.shade ? { type: ShadingType.CLEAR, color: 'auto', fill: o.shade } : undefined });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], alignment: o.align,
  spacing: { before: o.before ?? 0, after: o.after ?? 80, line: o.line, lineRule: o.line ? 'auto' : undefined }, keepNext: o.keepNext, keepLines: o.keepLines,
  pageBreakBefore: o.pageBreak, border: o.border, indent: o.indent, numbering: o.numbering });
const sp = (h = 120) => new Paragraph({ children: [], spacing: { before: 0, after: 0, line: h, lineRule: 'exact' } });

const label = (t, color = C.dim) => r(t.toUpperCase(), { size: 15, bold: true, color, sp: 22 });
const eyebrow = (t, color = C.gold) => p(label(t, color), { after: 60, keepNext: true });

function img(file, wPx, hPx, o = {}) {
  const data = fs.readFileSync(A(file));
  const type = /\.jpe?g$/i.test(file) ? 'jpg' : 'png';
  return new ImageRun({ type, data, transformation: { width: wPx, height: hPx }, altText: o.alt ? { title: o.alt, description: o.alt, name: o.alt } : undefined });
}
function sizeOf(file) { // png/jpeg header parse
  const b = fs.readFileSync(A(file));
  if (b[0] === 0x89) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  let i = 2; while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + len; }
  throw new Error('size ' + file);
}
const picture = (file, wPx, o = {}) => { const s = sizeOf(file); const h = Math.round(wPx * s.h / s.w); return p(img(file, wPx, o.maxH && h > o.maxH ? o.maxH : h, o), { align: o.align ?? AlignmentType.LEFT, after: o.after ?? 60, keepNext: o.keepNext }); };
const pictureFit = (file, wPx, hPx) => { const s = sizeOf(file); let w = wPx, h = Math.round(wPx * s.h / s.w); if (h > hPx) { h = hPx; w = Math.round(hPx * s.w / s.h); } return img(file, w, h); };
const caption = t => p(r(t, { size: 15, italics: true, color: C.muted }), { after: 160 });

function cell(children, o = {}) {
  return new TableCell({ children: Array.isArray(children) ? children : [children], width: { size: o.w, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    margins: { top: o.mt ?? 100, bottom: o.mb ?? 100, left: o.ml ?? 140, right: o.mr ?? 140 },
    borders: o.borders || NOB, verticalAlign: o.va || VerticalAlign.TOP, rowSpan: o.rowSpan, columnSpan: o.span });
}
function table(widths, rows, o = {}) {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    borders: o.borders || TBL_NOB, rows, alignment: o.align });
}
const row = (cells, o = {}) => new TableRow({ children: cells, cantSplit: o.cantSplit ?? true, tableHeader: o.header, height: o.h ? { value: o.h, rule: HeightRule.ATLEAST } : undefined });

/* ---------- components ---------- */
// sub-section heading: crimson tick + letterspaced caps
let h2 = (t, o = {}) => p([r('▌ ', { color: C.brand, size: 20 }), r(t.toUpperCase(), { size: 18, bold: true, color: C.ink, sp: 30 })], { before: o.pageBreak ? 0 : 240, after: 120, keepNext: true, pageBreak: o.pageBreak });

// rule with a short crimson lead-in, like the website's section heads
function rule(after = 200) {
  return table([1100, CW - 1100], [row([
    cell(p('', { after: 0 }), { w: 1100, mt: 0, mb: 0, ml: 0, mr: 0, borders: { ...NOB, bottom: line(18, C.brand) } }),
    cell(p('', { after: 0 }), { w: CW - 1100, mt: 0, mb: 0, ml: 0, mr: 0, borders: { ...NOB, bottom: line(4, C.line) } }),
  ])]);
}

// section opener: big serif number + title + one-line intro
function opener(num, title, intro, kicker) {
  const out = [];
  out.push(table([1250, CW - 1250], [row([
    cell(p(r(num, { font: SERIF, size: 64, color: C.brand }), { after: 0 }), { w: 1250, ml: 0, mt: 0, mb: 0, va: VerticalAlign.BOTTOM }),
    cell([p(label(kicker || 'Section ' + num, C.gold), { after: 30 }), p(r(title, { font: SERIF, size: 44, color: C.ink }), { after: 0, line: 240 })],
      { w: CW - 1250, ml: 60, mt: 0, mb: 40, va: VerticalAlign.BOTTOM }),
  ])]));
  out.push(sp(100));
  out.push(rule());
  if (intro) out.push(p(r(intro, { size: 20, color: C.muted }), { before: 120, after: 160 }));
  return out;
}

// stat tiles grid: items [label, value, sub, valueColor]; real gap columns so every tile keeps its accent
function tiles(items, cols, o = {}) {
  const gap = 110, total = o.width || CW, w = Math.floor((total - gap * (cols - 1)) / cols);
  const widths = []; for (let i = 0; i < cols; i++) { widths.push(w); if (i < cols - 1) widths.push(gap); }
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    if (i) rows.push(row(widths.map(x => cell(p('', { after: 0, line: 40 }), { w: x, mt: 0, mb: 0, ml: 0, mr: 0 })), { h: gap }));
    const slice = items.slice(i, i + cols); while (slice.length < cols) slice.push(null);
    const cells = [];
    slice.forEach((it, k) => {
      cells.push(cell(it ? [
        p(label(it[0]), { after: 40 }),
        p(r(it[1], { font: SERIF, size: o.vsize || 26, color: it[3] || C.ink }), { after: it[2] ? 20 : 0 }),
        ...(it[2] ? [p(r(it[2], { size: 16, color: C.muted }), { after: 0 })] : []),
      ] : [p('', { after: 0 })], { w, fill: it ? (o.fill || C.soft) : undefined, mt: 130, mb: 130, ml: 170, mr: 120,
        borders: it ? { ...NOB, left: line(18, o.accent || C.brand) } : NOB }));
      if (k < cols - 1) cells.push(cell(p('', { after: 0 }), { w: gap, mt: 0, mb: 0, ml: 0, mr: 0 }));
    });
    rows.push(row(cells));
  }
  return table(widths, rows);
}

// flag cards: level → colour
const LEVEL = { HIGH: [C.brand, C.brandSoft], REVIEW: [C.warn, C.warnSoft], LOW: [C.ok, C.okSoft] };
function flags(items, cols = items.length) {
  const w = Math.floor(CW / cols);
  const cells = items.map(([lvl, title, text]) => {
    const [fg, bg] = LEVEL[lvl];
    return cell([
      p([r(' ' + lvl + ' ', { size: 13, bold: true, color: 'FFFFFF', shade: fg, sp: 20 })], { after: 80 }),
      p(r(title, { size: 20, bold: true, color: C.ink }), { after: 50 }),
      p(r(text, { size: 17, color: C.text }), { after: 0 }),
    ], { w, fill: bg, mt: 150, mb: 150, ml: 180, mr: 160,
      borders: { top: line(18, fg), bottom: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' }, left: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' }, right: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' } } });
  });
  return table(Array(cols).fill(w), [row(cells)]);
}

// labelled findings list
function findings(items, width = CW, kw = 2100) {
  return table([kw, width - kw], items.map(([k, v], i) => row([
    cell(p(r(k, { size: 18, bold: true, color: C.brand }), { after: 0 }), { w: kw, ml: 0, borders: { ...NOB, top: i ? line(4) : line(10, C.ink) } }),
    cell(p(r(v, { size: 19, color: C.text }), { after: 0 }), { w: width - kw, borders: { ...NOB, top: i ? line(4) : line(10, C.ink) } }),
  ])));
}

// status pill text run
const PILL = { Favourable: [C.ok, C.okSoft], Review: [C.warn, C.warnSoft], 'Not applicable': [C.muted, C.soft2], Proposed: [C.warn, C.warnSoft], Granted: [C.ok, C.okSoft],
  Pending: [C.brand, C.brandSoft], Immediate: [C.ok, C.okSoft] };
const pill = t => { const [fg, bg] = PILL[t] || [C.navy, C.navySoft]; return r(' ' + t + ' ', { size: 15, bold: true, color: fg, shade: bg }); };

// data table: header navy, zebra rows; cells may be strings or {runs:[...]} or {pill:'..'}
function dataTable(headers, rows, widths, o = {}) {
  const head = row(headers.map((h, i) => cell(p(label(h, 'FFFFFF'), { after: 0 }), { w: widths[i], fill: C.navy, mt: 90, mb: 90 })), { header: true });
  const body = rows.map((rw, ri) => row(rw.map((v, i) => {
    let kids;
    if (v && v.pill) kids = [p(pill(v.pill), { after: 0 })];
    else if (v && v.runs) kids = [p(v.runs, { after: 0 })];
    else kids = [p(r(String(v ?? ''), { size: 18, bold: i === 0 && !o.plainFirst, color: i === 0 ? C.ink : C.text, italics: o.italicPlaceholders && /^\[/.test(String(v)) }), { after: 0 })];
    return cell(kids, { w: widths[i], fill: ri % 2 ? C.soft : undefined, mt: 100, mb: 100, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } });
  })));
  return table(widths, [head, ...body]);
}

// two things side by side (image + content)
function split(left, right, lw, gap = 240) {
  const rw = CW - lw - gap;
  return table([lw, gap, rw], [row([
    cell(left, { w: lw, ml: 0, mr: 0, mt: 0, mb: 0 }),
    cell(p('', { after: 0 }), { w: gap, ml: 0, mr: 0, mt: 0, mb: 0 }),
    cell(right, { w: rw, ml: 0, mr: 0, mt: 0, mb: 0 }),
  ], { cantSplit: true })]);
}

const bullet = t => p(r(t, { size: 19 }), { numbering: { reference: 'dots', level: 0 }, after: 60 });
const note = t => p(r(t, { size: 16, italics: true, color: C.muted }), { after: 160 });

/* ---------- running header / footer ---------- */
function watermark() {
  return new ImageRun({ type: 'png', data: fs.readFileSync(A('watermark.png')), transformation: { width: 560, height: 560 },
    floating: { horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, align: HorizontalPositionAlign.CENTER },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, align: VerticalPositionAlign.CENTER },
      behindDocument: true, allowOverlap: true, wrap: { type: TextWrappingType.NONE } } });
}
function header(chapter) {
  return new Header({ children: [
    new Paragraph({ children: [watermark()], spacing: { after: 0 } }),
    table([CW / 2, CW / 2], [row([
      cell(p(label('Land Parcel Feasibility Report', C.navy), { after: 0 }), { w: CW / 2, ml: 0, mt: 0, mb: 80, borders: { ...NOB, bottom: line(4) } }),
      cell(p(label(chapter || 'Strictly private & confidential', C.brand), { after: 0, align: AlignmentType.RIGHT }), { w: CW / 2, mr: 0, mt: 0, mb: 80, borders: { ...NOB, bottom: line(4) } }),
    ])]),
  ] });
}
function footer() {
  const left = UNBRANDED
    ? p([r('Location ', { font: SERIF, size: 16, color: C.ink }), r('Intelligence', { font: SERIF, size: 16, italics: true, color: C.brand }), r('   ·   Strictly private & confidential', { size: 14, color: C.dim })], { after: 0 })
    : p([img('logo.png', 58, 21), r('   Location Intelligence   ·   Strictly private & confidential', { size: 14, color: C.dim })], { after: 0 });
  return new Footer({ children: [table([CW - 2200, 2200], [row([
    cell(left, { w: CW - 2200, ml: 0, mt: 100, mb: 0, va: VerticalAlign.CENTER, borders: { ...NOB, top: line(4) } }),
    cell(p(new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], font: SANS, size: 15, color: C.muted }), { after: 0, align: AlignmentType.RIGHT }),
      { w: 2200, mr: 0, mt: 100, mb: 0, va: VerticalAlign.CENTER, borders: { ...NOB, top: line(4) } }),
  ])])] });
}
const pageProps = { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 1250, right: MX, bottom: 1150, left: MX, header: 520, footer: 480 } } };
const chapter = (label_, children) => ({ properties: { ...pageProps, type: SectionType.NEXT_PAGE }, headers: { default: header(label_) }, footers: { default: footer() }, children });

/* ======================================================================== COVER */
const cover = [];
cover.push(table([CW / 2, CW / 2], [row([
  cell(UNBRANDED ? p([r('Location ', { font: SERIF, size: 26, color: C.ink }), r('Intelligence', { font: SERIF, size: 26, italics: true, color: C.brand })], { after: 0 })
    : p([img('logo.png', 120, 43), r('    Location Intelligence', { font: SERIF, size: 22, color: C.ink })], { after: 0 }), { w: CW / 2, ml: 0, mt: 0, va: VerticalAlign.CENTER }),
  cell(p(label('Sample report  ·  October 2026', C.dim), { align: AlignmentType.RIGHT, after: 0 }), { w: CW / 2, mr: 0, mt: 0, va: VerticalAlign.CENTER }),
])]));
cover.push(sp(1100));
cover.push(p([r('—  ', { color: C.gold, size: 16 }), label('Land parcel feasibility report', C.gold)], { after: 140 }));
cover.push(p(r('Gopalpur, Sector 99A', { font: SERIF, size: 76, color: C.ink }), { after: 0, line: 300 }));
cover.push(p(r('Gurugram, Haryana', { font: SERIF, size: 76, italics: true, color: C.brand }), { after: 200, line: 300 }));
cover.push(p(r('Survey / Khata 46//24/2   ·   3,713 m² (0.92 acres)   ·   Vacant land with Group Housing potential', { size: 20, color: C.muted }), { after: 320 }));
cover.push(picture('cover_hero.png', PX(CW), { after: 0 }));
cover.push(tiles([
  ['Measured area', '3,713 m²', '0.92 acres'], ['Planned use', 'Residential', '100% · GMUC-2031'],
  ['Master plan', 'GMUC-2031', 'DTCP Haryana'], ['DIGIPIN', '3C7-T25-PCC3', 'Gurugram · Harsaru'],
], 4, { vsize: 24 }));
// the platform writes the "Report configuration" block into the space below
cover.push(sp(200));

/* ======================================================================== CONTENTS */
const TOC = [
  ['—', 'Executive Summary', [['', ['Snapshot of the property + boundary map', 'Summary of key findings', 'Location details', 'Master plan; zoning / land-use', 'Red flag summary']]]],
  ['01', 'Property Overview', [['Ownership', ['Survey number / khata', 'Owner details']], ['Vaastu', ['Plot orientation', 'Plot shape', 'Vaastu rating']]]],
  ['02', 'Infrastructure & Connectivity', [['Existing infrastructure', ['Highways and access roads', 'Airports, metro, RRTS, railway network and ports', 'Social infrastructure']],
    ['Upcoming infrastructure', ['Upcoming projects with map view', 'Potential travel time and distance reduction']], ['Satellite imagery', ['Direction of city growth over 10 years']]]],
  ['03', 'Regulatory & Approvals', [['Boundary and zoning', ['Regulatory restrictions', 'Government approval requirements']], ['Buildability / development potential', ['Applicable government schemes and bylaws', 'Permissible FSI and density norms']]]],
  ['04', 'Property Records, Ownership & Litigation', [['Title check & ownership history', ['Encumbrance verification', 'Legal & title review', 'Title chain history', 'CERSAI records check']],
    ['Borrower, group & promoter due diligence', ['Borrower profile reports', 'Group company(s) litigation', 'Promoter litigation – individual & company']], ['Reputation & compliance screening', ['Adverse news findings', 'UN sanction list screening']]]],
  ['05', 'Market & Catchment Intelligence', [['Market and transaction data', ['Launched projects & units', 'Absorption & inventory overhang', 'Pricing trends in micro-market', 'Historic price trends in established micro-markets', 'Developer land banks in catchment']],
    ['Demographics and economic activity', ['Built environment trends', 'Commercial activity trends', 'Catchment demographics', 'Population growth data', 'Consumption trends and purchasing power']]]],
  ['06', 'Site Attributes & Considerations', [['Physical characteristics', ['Seismic zone / terrain map', 'Groundwater and soil analysis', 'Flood exposure', 'Contour profiling (slope & direction)']],
    ['Structures on parcel / encroachments', ['Structures within the boundary', 'Built-up area']]]],
];
function contentsTable() {
  const w = [900, 2700, 2900, CW - 900 - 2700 - 2900];
  const rows = [];
  TOC.forEach(([num, title, subs]) => {
    subs.forEach(([sub, det], si) => {
      const first = si === 0, last = si === subs.length - 1;
      const top = first ? line(10, C.ink) : line(2, C.line);
      const cells = [];
      if (first) {
        cells.push(cell(p(r(num, { font: SERIF, size: 30, color: C.brand }), { after: 0 }), { w: w[0], rowSpan: subs.length, ml: 0, mt: 110, borders: { ...NOB, top: line(10, C.ink) } }));
        cells.push(cell(p(r(title, { font: SERIF, size: 21, color: C.ink }), { after: 0, line: 250 }), { w: w[1], rowSpan: subs.length, mt: 110, borders: { ...NOB, top: line(10, C.ink) } }));
      }
      cells.push(cell(p(r(sub, { size: 17, bold: true, color: C.navy }), { after: 0 }), { w: w[2], mt: first ? 110 : 70, mb: last ? 110 : 50, borders: { ...NOB, top } }));
      cells.push(cell(det.map((t, i) => p([r('•  ', { size: 15, color: C.gold }), r(t, { size: 16, color: C.text })], { after: i === det.length - 1 ? 0 : 20 })),
        { w: w[3], mt: first ? 110 : 70, mb: last ? 110 : 50, borders: { ...NOB, top } }));
      rows.push(row(cells));
    });
  });
  rows.push(row(w.map(x => cell(p('', { after: 0 }), { w: x, mt: 0, mb: 0, borders: { ...NOB, top: line(10, C.ink) } }))));
  return table(w, rows);
}
const contents = [
  p(label('Contents', C.gold), { after: 40 }),
  p(r('What’s in this report', { font: SERIF, size: 44, color: C.ink }), { after: 120 }),
  p(r('Every report includes the cover, contents, executive summary and methodology. The numbered sections are chosen on the platform.', { size: 18, color: C.muted }), { after: 220 }),
  contentsTable(),
];

/* ======================================================================== EXECUTIVE SUMMARY */
const es = [
  ...opener('ES', 'Executive summary', null, 'At a glance'),
  split([
    p(pictureFit('image1.png', 300, 205), { after: 40 }),
    caption('Supplied parcel boundary map'),
  ], [
    tiles([['Property type', 'Vacant land', 'Group Housing potential'], ['Master plan', 'GMUC-2031', 'DTCP Haryana'],
      ['Planned use', 'Residential (100%)'], ['Measured area', '3,713 m²', '0.92 acres'],
      ['State / city', 'Gurugram, Haryana'], ['District / tehsil', 'Gurugram · Harsaru']], 2, { width: CW - 4740, vsize: 21 }),
  ], 4500),
  sp(80),
  tiles([['DIGIPIN', '3C7-T25-PCC3'], ['Survey / khata', '46//24/2', 'khata not listed'], ['Circle / market rate', '₹45,000 / ₹65,000', 'per m²*'], ['Indicative plot value', '₹24.13 Cr*', null, C.brand]], 4, { vsize: 21 }),
  note('*Indicative estimates, not a formal valuation (PropEquity cited in source).'),
  h2('Red flags'),
  flags([['HIGH', 'Structures on parcel', '3 structures cover about 5.8% of the land; 1 crosses the boundary.'],
    ['HIGH', 'Seismic risk', 'BIS Seismic Zone IV (high damage risk zone), per IS 1893:2016.'],
    ['REVIEW', 'Environmental clearance overlap', 'Proposed EC SIA/HR/INFRA2/558167/2026 overlaps the parcel; confirm project ownership.']]),
  h2('Key findings'),
  findings([['About the property', '3,713 m² at Survey/Khata 46//24/2, Gopalpur; owner named as M/s HASTA Infrastructure Pvt. Ltd.'],
    ['Strengths', 'Road frontage, stated NH-248BB proximity, 400 kV substation 4.5 km away, and 274,956 people within 5 km.'],
    ['Weaknesses', 'Mapped structures, Zone IV seismic exposure and the proposed EC overlap require checks.']]),
];

/* ======================================================================== 01 PROPERTY OVERVIEW */
const s1 = [
  ...opener('01', 'Property Overview', 'Who owns the parcel, its survey and khata record, and a Vaastu reading of the plot’s orientation and shape.'),
  h2('Ownership'),
  picture('image2.jpg', PX(CW) - 40, { maxH: 330 }),
  caption('Ownership and neighbouring survey map'),
  dataTable(['Record field', 'Survey 133', 'Survey 144'], [
    ['Khata', '31', '31'], ['Area', '7 kanal 6 marla · 3,692.8 m²', '7 kanal 6 marla · 3,692.8 m²'],
    ['Owner', 'M/s HASTA Infrastructure Pvt. Ltd.', 'M/s HASTA Infrastructure Pvt. Ltd.']], [2200, (CW - 2200) / 2, (CW - 2200) / 2]),
  h2('Ownership & title chain'),
  dataTable(['Date', 'Transfer', 'Record'], [
    [{ runs: [r('15 Jun 1998', { size: 18, bold: true, color: C.brand })] }, { runs: [r('State Govt. · original allotment  →  ', { size: 18 }), r('Late Ram Singh · khatedar', { size: 18, bold: true, color: C.ink })] }, 'Survey 144 · 7 kanal 6 marla'],
    [{ runs: [r('02 Nov 2010', { size: 18, bold: true, color: C.brand })] }, { runs: [r('Late Ram Singh · legal heirs  →  ', { size: 18 }), r('Ram Singh & Sons HUF', { size: 18, bold: true, color: C.ink })] }, 'Survey 144 · 7 kanal 6 marla'],
    [{ runs: [r('20 Apr 2018', { size: 18, bold: true, color: C.brand })] }, { runs: [r('Ram Singh & Sons HUF  →  ', { size: 18 }), r('M/s HASTA Infrastructure Pvt. Ltd.', { size: 18, bold: true, color: C.ink })] }, 'Survey 144 · 7 kanal 6 marla'],
    [{ pill: 'Pending' }, { runs: [r('Mutation confirmation  →  ', { size: 18 }), r('To be verified', { size: 18, bold: true, color: C.ink })] }, 'Survey 144'],
  ], [1700, CW - 1700 - 2900, 2900], { plainFirst: true }),

  h2('Vastu analysis', { pageBreak: true }),
  p(r('Directional assessment of the plot per Vastu Shastra principles, based on the supplied boundary survey and site orientation. Indicative only — not a substitute for a site consultation.', { size: 18, color: C.muted, italics: true }), { after: 160 }),
  split([p(pictureFit('image5.jpeg', 200, 285), { after: 0 })], [
    tiles([['Overall compliance', '7 of 8', 'parameters favourable', C.ok], ['Point of review', 'North-East corner', 'partly affected by a structure', C.warn]], 1, { width: CW - 3240, vsize: 24, accent: C.gold }),
    sp(60),
    findings([['Recommendation', 'Confirm removal or relocation of the NE structure before layout planning; place the main mass toward the South-West, with entrances and open areas facing North / North-East.']], CW - 3240, 1700),
  ], 3000),
  sp(160),
  dataTable(['Parameter', 'Vastu guideline', 'Observed on parcel', 'Assessment'], [
    ['Plot shape', 'Square / rectangular, regular geometry', 'Rectangular, regular geometry', { pill: 'Favourable' }],
    ['Road facing', 'North or East facing preferred', 'Faces North · 60 m wide access road', { pill: 'Favourable' }],
    ['Main entry (gate)', 'North-East (Ishanya) ideal', 'NE corner open, accessible from road', { pill: 'Favourable' }],
    ['Slope of land', 'Fall towards North / East; high in SW', 'Level parcel; slight fall to NE per contour', { pill: 'Favourable' }],
    ['North-East corner', 'Should stay open, unobstructed, lowest point', 'Partly affected — existing structure crosses boundary near NE', { pill: 'Review' }],
    ['South-West zone', 'Suited for heavier mass / main structure', 'No existing structures in SW', { pill: 'Favourable' }],
    ['Water body / low point', 'Ideal in North or North-East', 'None on record within parcel', { pill: 'Not applicable' }],
    ['Corner cuts', 'Avoid cuts or missing corners, esp. SW', 'None identified in supplied boundary survey', { pill: 'Favourable' }],
  ], [2000, 2950, 3350, CW - 2000 - 2950 - 3350]),
];

/* ======================================================================== 02 INFRASTRUCTURE */
const s2 = [
  ...opener('02', 'Infrastructure & Connectivity', 'Roads, airports, metro, rail and social infrastructure today, what’s coming next, and how the city is growing.'),
  h2('Existing infrastructure'),
  dataTable(['Project / landmark', 'Distance', 'Avg. travel time'], [
    ['Access road', 'Adjacent · 60 m wide', { pill: 'Immediate' }], ['Metro station', 'About 18 km · Delhi Metro', 'About 35 min'],
    ['Airport', 'About 25.9 km via Dwarka Expressway', 'About 31 min'], ['Highway', 'NH-248BB · about 9.8 km by road', 'About 15 min'],
    ['Railway station', 'Basai Dhankot · about 3.9 km', 'About 10 min'], ['Central business district', 'Cyber City, Gurugram · about 18 km', 'About 40 min'],
  ], [2900, CW - 2900 - 2200, 2200]),
  h2('Social infrastructure'),
  tiles([['Schools', '3', 'within 1 km · ~5 min'], ['Hospitals', '5', 'within 1 km · ~5 min'], ['Shopping centres', '3', 'within 1 km · ~5 min'],
    ['Police stations', '1', '2.8 km · ~8 min'], ['IT parks', '2', '4.5 km · ~15 min']], 5, { vsize: 30, accent: C.navy }),
  h2('Infrastructure map'),
  picture('image9.jpeg', 560, { align: AlignmentType.CENTER }),

  h2('Upcoming infrastructure · projects', { pageBreak: true }),
  dataTable(['Project', 'Proposed cost', 'Govt. timeline', 'Expected'], [
    ['Dwarka Expressway · GMDA master road link to Wazirpur Chowk', '₹450 Cr*', 'May 2027', { pill: 'Q2 2028' }],
    ['NH-248BB widening', '₹280 Cr*', 'Dec 2026', { pill: 'Q1 2027' }],
    ['Daulatabad 400 kV substation augmentation', '₹120 Cr*', 'Nov 2026', { pill: 'Q1 2027' }],
  ], [CW - 1700 - 1700 - 1800, 1700, 1700, 1800]),
  h2('Travel time savings from new infrastructure'),
  picture('chart_travel.png', 600, { align: AlignmentType.CENTER, after: 40 }),
  note('*Indicative project costs and projected travel times from source draft.'),
  h2('Upcoming infrastructure map'),
  picture('image12.png', 520, { align: AlignmentType.CENTER }),

  h2('Satellite imagery', { pageBreak: true }),
  p(r('Track the direction of city growth and land-use shifts over ten years.', { size: 18, color: C.muted }), { after: 160 }),
  p(pictureFit('image14.png', PX(CW), 330), { after: 40, align: AlignmentType.CENTER }),
  p([label('2015', C.brand), r('   Satellite view', { size: 16, color: C.muted })], { after: 200, align: AlignmentType.CENTER }),
  p(pictureFit('image15.u.png', PX(CW), 330), { after: 40, align: AlignmentType.CENTER }),
  p([label('2025', C.brand), r('   Satellite view', { size: 16, color: C.muted })], { after: 0, align: AlignmentType.CENTER }),
];

/* ======================================================================== 03 REGULATORY */
const s3 = [
  ...opener('03', 'Regulatory & Approvals', 'Zoning and regulatory restrictions, the approvals required, applicable schemes, and how much can be built.'),
  h2('Boundary & zoning · environmental clearances within 5 km'),
  dataTable(['Project', 'Status', 'Distance'], [
    ['Group Housing Colony project · Gopalpur', { pill: 'Proposed' }, 'On parcel'],
    ['EC extension · Residential Group Housing, Sector 99A, Gopalpur', { pill: 'Granted' }, '177 m SW'],
  ], [CW - 1800 - 1800, 1800, 1800]),
  h2('Legal / title checks'),
  flags([['LOW', 'Litigation', 'No dispute, complaint or litigation identified in the records reviewed.'],
    ['REVIEW', 'Encumbrance / charge status', 'A manual index search at the Harsaru sub-registrar is needed to confirm charge status.']]),
  h2('Regulatory approvals'),
  dataTable(['Authority', 'Clearance', 'Action required'], [
    ['DTCP Haryana', 'Residential CLU', 'Confirm CLU; recorded use is agricultural, planned use Residential.'],
    ['AAI · NOCAS', 'Height NOC', 'Apply via NOCAS; draft top elevation is 345 m AMSL.'],
    ['HSPCB', 'Environmental clearance', 'Verify proposed EC SIA/HR/INFRA2/558167/2026.'],
    ['Harsaru sub-registrar', 'Encumbrance certificate', 'Manual index search required.'],
    ['Harsaru tehsil', 'Jamabandi / mutation', 'Confirm mutation; draft cites 2023–2024 jamabandi.'],
  ], [2400, 2400, CW - 4800]),
  h2('Airport height limits'),
  tiles([['Buildable headroom', '≈130 m', 'above ground · about 43 floors'], ['Ground / top level', '215 / 345 m', 'AMSL'],
    ['Aerodrome', 'IGI Airport', 'Indira Gandhi International'], ['Limit', 'Conical surface', 'NOC required via NOCAS']], 4, { vsize: 22, accent: C.navy }),
  h2('Environmental restrictions'),
  dataTable(['Constraint', 'Distance / finding'], [
    ['High-tension line', '71 m'], ['Storm-water / water-body buffer', 'Nearest edge 1.2 km · 30 m buffer cited'],
    ['Military area / wetland', '6.4 km / 1.3 km'], ['Sultanpur National Park / ESZ', '5.6 km / 5.3 km'],
  ], [4200, CW - 4200]),

  h2('Buildability & development potential', { pageBreak: true }),
  picture('chart_far.png', 600, { align: AlignmentType.CENTER, after: 120 }),
  tiles([['FAR range', '1.5 – 2.25', 'by scheme'], ['Buildable floor area', '5,569 – 8,354 m²', 'on 3,713 m² digitised area'],
    ['Group Housing FAR', '1.5 – 1.75', 'density 300–400 PPA · up to 3.0 with TDR'], ['Affordable Group Housing FAR', '2.25', 'density 750–900 PPA · up to 3.0 with TDR']], 2, { vsize: 26 }),
  h2('Government schemes applicable in the area'),
  tiles([['Haryana Building Code', '2017', 'as amended to 05.08.2024 \u00B7 FAR and density norms'], ['Affordable Group Housing', '2013 policy', 'subject to licence category'], ['TOD Policy', 'Transit-oriented', 'development near transit'], ['TDR Scheme', 'Transferable', 'development rights']], 4, { vsize: 20, accent: C.navy }),
];

/* ======================================================================== 04 RECORDS (placeholder) */
const ph = (a, b, c) => [a, `[Placeholder: ${b}]`, `[Placeholder: ${c}]`];
const W3 = [3000, CW - 3000 - 2600, 2600];
const s4 = [
  ...opener('04', 'Property Records, Ownership & Litigation', 'Encumbrances, title chain and CERSAI checks, plus litigation and reputation screening of the borrower, group and promoters.'),
  table([CW], [row([cell([p([r(' IN PREPARATION ', { size: 13, bold: true, color: C.gold, shade: C.warnSoft }), r('   Placeholder section. Content for these checks will be added in a later version of the report.', { size: 18, color: C.muted, italics: true })], { after: 0 })],
    { w: CW, fill: C.soft, mt: 140, mb: 140, ml: 200, borders: { ...NOB, left: line(18, C.gold) } })])]),
  h2('Title check & ownership history'),
  dataTable(['Check', 'Findings', 'Source / status'], [
    ph('Encumbrance verification', 'encumbrances, charges and mortgages on the parcel', 'Sub-Registrar EC'),
    ph('Legal & title review', 'summary of title opinion and key observations', 'legal counsel'),
    ph('Title chain history', 'chain of title transfers over 30 years', 'revenue records / sale deeds'),
    ph('CERSAI records check', 'security interests registered against the asset', 'CERSAI search')], W3, { italicPlaceholders: true }),
  h2('Borrower, group & promoter due diligence'),
  dataTable(['Check', 'Findings', 'Source / status'], [
    ph('Borrower profile reports', 'borrower background, financials and credit profile', 'MCA / credit bureau'),
    ph('Group company(s) litigation', 'pending and past litigation across group entities', 'court records search'),
    ph('Promoter litigation – individual & company', 'cases involving promoters and their companies', 'court records search')], W3, { italicPlaceholders: true }),
  h2('Reputation & compliance screening'),
  dataTable(['Check', 'Findings', 'Source / status'], [
    ph('Adverse news findings', 'adverse media screening results', 'media database'),
    ph('UN sanction list screening', 'screening of entities and promoters against sanction lists', 'UN / OFAC lists')], W3, { italicPlaceholders: true }),
];

/* ======================================================================== 05 MARKET */
const s5 = [
  ...opener('05', 'Market & Catchment Intelligence', 'Launches, absorption, pricing and developer land banks, plus who lives, works and spends within reach of the site.'),
  h2('Market & transaction data'),
  tiles([['Projects within 3 km', '6', 'launched / under construction'], ['Units launched in 2026', '≈1,850', 'indicative'],
    ['Sales / absorption 2026', '≈72%', 'indicative'], ['Inventory overhang', '7 months'],
    ['Selling-price trend', '+6% QoQ', 'avg. of last 3 quarters'], ['Current price / sq ft', '₹8,200–9,500', 'indicative'],
    ['Nearest micro-market', 'Sector 99', 'Dwarka Expressway, Gurugram'], ['Micro-market price', '₹8,800 / sq ft', 'average (indicative)']], 4, { vsize: 22 }),
  note('Connectivity improvement: Dwarka Expressway provides direct access to Delhi and the airport.'),
  h2('Real estate developer land banks within 10 km'),
  split([p(pictureFit('f_landbanks.jpg', 320, 230), { after: 0 })], [sp(300), barList([['Prestige', 100, '100 acres', 'A1232B'], ['Signature Global', 78, '78 acres'], ['Eldeco', 54, '54 acres'], ['Godrej', 10, '10 acres']], { width: CW - 5040, lw: 1700, vw: 1100, max: 100 }), note('Developer land holdings within 10 km of the site (acres).')], 4800),

  h2('Demographics & economic activity', { pageBreak: true }),
  tiles([['Population within 5 km', '274,956'], ['Population growth · 5 yrs', '+16%', null, C.ok], ['Household growth · 5 yrs', '+14%', null, C.ok],
    ['Affluence index', '38.2%', 'households over ₹10 lakh a year']], 4, { vsize: 24, accent: C.navy }),
  table([CW / 2, CW / 2], [row([
    cell([h2('Built environment \u00B7 5-year growth'), barList([['Built-up area', 18, '+18%'], ['Residential property', 22, '+22%'], ['Commercial property', 15, '+15%'], ['Office cluster', 12, '+12%']], { width: CW / 2 - 200, lw: 1900, vw: 750, max: 30 }), note('Built-up area within 5 km stands at 43.0% today.')], { w: CW / 2, ml: 0, mr: 200 }),
    cell([h2('Commercial & social activity \u00B7 5-year growth'), barList([['Retail activity', 20, '+20%'], ['Bank / ATM density', 14, '+14%'], ['Medical facilities', 25, '+25%'], ['Education facilities', 18, '+18%'], ['Hotel / banquet halls', 10, '+10%']], { width: CW / 2 - 200, lw: 1900, vw: 750, max: 30 })], { w: CW / 2, ml: 200, mr: 0 }),
  ])]),
  h2('Population growth indicators'),
  barList([['Population', 16, '+16%'], ['Households', 14, '+14%'], ['Night-time radiance (2018\u20132024)', 68, '+68%', 'A1232B']], { lw: 3200, vw: 1000, max: 80 }),
  note('Night-time radiance (satellite-measured light at night) is a proxy for economic activity.'),
  h2('Catchment demographics'),
  p(label('Gender split (indicative)', C.muted), { after: 80 }),
  ...splitBar(54, 46, 'Male', 'Female'),
  sp(160),
  kpis([['Aged 25\u201345', '\u224862%', 'of catchment population (indicative)'], ['Affluent households', '38.2%', 'over \u20B910 lakh a year']], { size: 34 }),
];

/* ======================================================================== 06 SITE */
const s6 = [
  ...opener('06', 'Site Attributes & Considerations', 'The ground itself: seismic zone and terrain, groundwater and soil, flood exposure, slope, and structures on the parcel.'),
  h2('Site physical characteristics'),
  table([CW / 2, CW / 2], [row([
    cell([p(pictureFit('f_terrain.jpg', PX(CW / 2) - 16, 220), { after: 40 }), caption('Terrain map · source image')], { w: CW / 2, ml: 0, mr: 120 }),
    cell([p(pictureFit('f_elevation.jpg', PX(CW / 2) - 16, 220), { after: 40 }), caption('Elevation profile and slope distribution · source charts')], { w: CW / 2, ml: 120, mr: 0 }),
  ])]),
  tiles([['Seismic zone', 'Zone IV', 'high damage risk (BIS IS 1893:2016)', C.brand], ['Flood exposure', 'No mapped exposure', 'nearest footprint 28.2 km', C.ok],
    ['Slope / aspect', '0.2° NE-facing', 'indicative'], ['Elevation', '215.0 m AMSL'],
    ['Groundwater & soil', 'Loam topsoil, pH 7.7', 'groundwater stress not assessed'], ['Terrain', 'Flat', 'minimal slope variance in source draft']], 3, { vsize: 22 }),

  h2('Structures on parcel / encroachments', { pageBreak: true }),
  p(img('f_structures.jpg', 672, Math.round(672 / 2.4)), { after: 40 }),
  caption('Parcel boundary context from supplied source · structure footprints are not annotated in this image'),
  sp(120),
  kpis([['Structures intersecting parcel', '3'], ['Inside / crossing boundary', '2 \u00B7 1', '2 fully inside, 1 crossing', C.brand], ['Built-up area inside parcel', '213.7 m\u00B2', 'of 3,713 m\u00B2']], { size: 36 }),
  sp(200),
  p([r('5.76%', { font: SERIF, size: 44, color: C.brand }), r('   of the parcel is built up (213.7 m\u00B2 of 3,713 m\u00B2)', { size: 18, color: C.muted })], { after: 100 }),
  nbar(CW, 0.0576, 'A1232B', 'F3E3E5', 220),
];

/* ======================================================================== METHODOLOGY */
const sm = [
  ...opener('A', 'Methodology', 'How this report was put together, and the sources behind each section.', 'Appendix'),
  h2('Data sources'),
  dataTable(['Domain', 'Source'], [
    ['Master plan & zoning', 'DTCP Haryana · GMUC-2031'], ['Market & transaction data', 'PropEquity (indicative)'], ['Digital connectivity', 'Ookla (indicative)'],
    ['Satellite & terrain imagery', 'Supplied source imagery'], ['Seismic classification', 'BIS IS 1893:2016']], [3800, CW - 3800]),
  h2('Confidentiality'),
  p(r(`This document is strictly private and confidential. It has been prepared solely for the addressee’s internal evaluation and must not be reproduced, distributed, or disclosed, in whole or in part, to any third party without the prior written consent${UNBRANDED ? '' : ' of HDFC Capital'}.`, { size: 19 }), { after: 200, line: 300 }),
  h2('Important notes'),
  bullet('Figures marked indicative or with an asterisk are estimates from the sources listed and are not a formal valuation.'),
  bullet('Areas derived from mapped boundaries are approximate and are not a legal survey.'),
  bullet('District / state GDP growth figures were not available in the source data.'),
  bullet('All figures in this sample report are dummy data for demonstration.'),
];

/* ======================================================================== v2 COMPONENTS */
const BLEED = PAGE_W;                       // full page width
const ON_NAVY = 'C9D3E3';

// full-bleed navy hero band for each section: ghost number, kicker, title, intro
let hero = function (num, title, intro, kicker) {
  const lw = BLEED - 3000;
  const band = new Table({ width: { size: BLEED, type: WidthType.DXA }, columnWidths: [lw, 3000], indent: { size: -MX, type: WidthType.DXA },
    borders: TBL_NOB, rows: [
      row([
        cell([
          p([r('—  ', { color: C.gold, size: 16 }), label(kicker || 'Section ' + num, C.gold)], { after: 80 }),
          p(r(title, { font: SERIF, size: 50, color: 'FFFFFF' }), { after: 100, line: 250 }),
          ...(intro ? [p(r(intro, { size: 19, color: ON_NAVY }), { after: 0, line: 280 })] : []),
        ], { w: lw, fill: C.ink, ml: MX, mr: 200, mt: 380, mb: 380, va: VerticalAlign.CENTER }),
        cell(p(r(num, { font: SERIF, size: 150, color: '2A4370' }), { after: 0, align: AlignmentType.RIGHT }),
          { w: 3000, fill: C.ink, ml: 0, mr: MX, mt: 120, mb: 120, va: VerticalAlign.CENTER }),
      ]),
      row([cell(p('', { after: 0 }), { w: lw, fill: C.brand, mt: 0, mb: 0 }), cell(p('', { after: 0 }), { w: 3000, fill: C.gold, mt: 0, mb: 0 })], { h: 70 }),
    ] });
  return [band, sp(200)];
}

// KPI strip: big numbers with small labels, separated by hairlines
function kpis(items, o = {}) {
  const n = items.length, w = Math.floor((o.width || CW) / n);
  return table(Array(n).fill(w), [row(items.map(([lab, val, sub, color], i) => cell([
    p(r(val, { font: SERIF, size: o.size || 40, color: color || C.ink }), { after: 30, line: 240 }),
    p(label(lab, C.muted), { after: sub ? 20 : 0 }),
    ...(sub ? [p(r(sub, { size: 15, color: C.dim }), { after: 0 })] : []),
  ], { w, ml: i ? 220 : 0, mr: 120, mt: 60, mb: 60, borders: { ...NOB, left: i ? line(4, C.line) : NB } })))]);
}

// panel: soft box with title row and content
function panel(title, children, o = {}) {
  const w = o.width || CW;
  return table([w], [
    row([cell(p([r('●  ', { color: o.dot || C.brand, size: 14 }), label(title, C.ink)], { after: 0 }), { w, fill: o.headFill || C.soft2, mt: 110, mb: 90, ml: 200 })], { cantSplit: true }),
    row([cell(children, { w, fill: o.fill || 'FFFFFF', mt: 160, mb: 160, ml: 200, mr: 200, borders: { ...NOB, bottom: line(4, C.line), left: line(4, C.line), right: line(4, C.line) } })], { cantSplit: o.cantSplit ?? true }),
  ]);
}

// icon-mark checklist rows (✓ / ! / –)
const MARK = { ok: ['✓', C.ok, C.okSoft], review: ['!', C.warn, C.warnSoft], na: ['–', C.muted, C.soft2] };
function checklist(items) {
  const w = [560, 2300, CW - 560 - 2300];
  return table(w, items.map(([kind, name, guide, seen], i) => row([
    cell(p(r(` ${MARK[kind][0]} `, { size: 20, bold: true, color: MARK[kind][1], shade: MARK[kind][2] }), { after: 0, align: AlignmentType.CENTER }), { w: w[0], ml: 0, mr: 0, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell([p(r(name, { size: 19, bold: true, color: C.ink }), { after: 10 })], { w: w[1], va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell([p(r(seen, { size: 18, color: C.text }), { after: 10 }), p(r('Guideline: ' + guide, { size: 15, color: C.dim, italics: true }), { after: 0 })], { w: w[2], va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
  ])));
}

// numbered process steps (approvals)
function steps(items) {
  const w = [700, 2600, CW - 3300];
  return table(w, items.map(([who, what, how], i) => row([
    cell(p(r(String(i + 1).padStart(2, '0'), { font: SERIF, size: 30, color: C.brand }), { after: 0 }), { w: w[0], ml: 0, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell([p(r(what, { size: 19, bold: true, color: C.ink }), { after: 10 }), p(label(who, C.dim), { after: 0 })], { w: w[1], va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell(p(r(how, { size: 18, color: C.text }), { after: 0 }), { w: w[2], va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
  ])));
}

// small inline icon-number tiles (social infra)
function counters(items) {
  const n = items.length, gap = 110, w = Math.floor((CW - gap * (n - 1)) / n);
  const widths = []; items.forEach((_, i) => { widths.push(w); if (i < n - 1) widths.push(gap); });
  const cells = [];
  items.forEach(([lab, val, sub], i) => {
    cells.push(cell([p(r(val, { font: SERIF, size: 46, color: C.brand }), { after: 0, align: AlignmentType.CENTER, line: 240 }),
      p(r(lab, { size: 18, bold: true, color: C.ink }), { after: 10, align: AlignmentType.CENTER }),
      p(r(sub, { size: 15, color: C.muted }), { after: 0, align: AlignmentType.CENTER })], { w, fill: C.soft, mt: 160, mb: 160, borders: { ...NOB, top: line(14, C.navy) } }));
    if (i < n - 1) cells.push(cell(p('', { after: 0 }), { w: gap, mt: 0, mb: 0, ml: 0, mr: 0 }));
  });
  return table(widths, [row(cells)]);
}

// three-column cards (key findings)
function cards(items) {
  const gap = 140, n = items.length, w = Math.floor((CW - gap * (n - 1)) / n);
  const widths = []; items.forEach((_, i) => { widths.push(w); if (i < n - 1) widths.push(gap); });
  const cells = [];
  items.forEach(([t, body, color], i) => {
    cells.push(cell([p(label(t, color || C.brand), { after: 60 }), p(r(body, { size: 18, color: C.text }), { after: 0, line: 270 })],
      { w, fill: 'FFFFFF', mt: 170, mb: 170, ml: 200, mr: 180, borders: { top: line(18, color || C.brand), bottom: line(4), left: line(4), right: line(4) } }));
    if (i < n - 1) cells.push(cell(p('', { after: 0 }), { w: gap, mt: 0, mb: 0, ml: 0, mr: 0 }));
  });
  return table(widths, [row(cells)]);
}

// red-flag list with large level labels
function flagList(items) {
  const w = [1500, CW - 1500];
  return table(w, items.map(([lvl, title, text]) => {
    const [fg, bg] = LEVEL[lvl];
    return row([
      cell(p(r(lvl, { size: 17, bold: true, color: 'FFFFFF', sp: 30 }), { after: 0, align: AlignmentType.CENTER }), { w: w[0], fill: fg, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' } } }),
      cell([p(r(title, { size: 20, bold: true, color: C.ink }), { after: 20 }), p(r(text, { size: 17, color: C.text }), { after: 0 })],
        { w: w[1], fill: bg, ml: 240, mt: 120, mb: 120, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' } } }),
    ]);
  }));
}
const SAT = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets', 'sat_stats.json'), 'utf8'));
const graphic = (file, wPx, o = {}) => picture(file, wPx, { align: AlignmentType.CENTER, after: o.after ?? 120, maxH: o.maxH });

/* ======================================================================== v4 COMPONENTS: numbered headings + native visuals */
let SEC = null, SUB = 0;
const _hero = hero;
hero = (num, ...rest) => { SEC = /^\d+$/.test(num) ? String(+num) : null; SUB = 0; return _hero(num, ...rest); };
// numbered sub-heading: "2.1  EXISTING INFRASTRUCTURE" with a hairline under it
h2 = (t, o = {}) => {
  const n = SEC ? `${SEC}.${++SUB}` : null;
  return p([...(n ? [r(n + '   ', { font: SERIF, size: 22, color: C.brand })] : []), r(t.toUpperCase(), { size: 18, bold: true, color: C.ink, sp: 28 })],
    { before: o.pageBreak ? 0 : 300, after: 140, keepNext: true, pageBreak: o.pageBreak, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 6 } } });
};
function tiny() { return new Paragraph({ children: [new TextRun({ text: '', size: 2 })], spacing: { before: 0, after: 0, line: 20, lineRule: 'exact' } }); }
// a native, vector bar (two shaded cells) — sharp in print and editable in Word
function nbar(width, frac, color, track = C.soft2, h = 150) {
  const f = Math.max(40, Math.round(width * Math.min(1, frac))), rest = width - f;
  const cells = [cell(tiny(), { w: f, fill: color, mt: 0, mb: 0, ml: 0, mr: 0 })];
  if (rest > 20) cells.push(cell(tiny(), { w: rest, fill: track, mt: 0, mb: 0, ml: 0, mr: 0 }));
  return new Table({ width: { size: width, type: WidthType.DXA }, columnWidths: cells.length > 1 ? [f, rest] : [f], borders: TBL_NOB,
    rows: [new TableRow({ children: cells, height: { value: h, rule: HeightRule.EXACT } })] });
}
// label | bar | value rows
function barList(items, o = {}) {
  const W = o.width || CW, lw = o.lw || 2600, vw = o.vw || 1300, bw = W - lw - vw;
  const max = o.max || Math.max(...items.map(i => i[1]));
  return table([lw, bw, vw], items.map(([lab, v, txt, color]) => row([
    cell(p(r(lab, { size: 18, color: C.text }), { after: 0 }), { w: lw, ml: 0, mt: 70, mb: 70, va: VerticalAlign.CENTER }),
    cell(nbar(bw - 120, v / max, color || o.color || '2F5D9E'), { w: bw, ml: 0, mr: 120, mt: 70, mb: 70, va: VerticalAlign.CENTER }),
    cell(p(r(txt ?? String(v), { size: 19, bold: true, color: C.ink }), { after: 0 }), { w: vw, ml: 0, mt: 70, mb: 70, va: VerticalAlign.CENTER }),
  ])));
}
// before → after travel-time cards
function travelCards(items) {
  const gap = 160, n = items.length, w = Math.floor((CW - gap * (n - 1)) / n);
  const widths = []; items.forEach((_, i) => { widths.push(w); if (i < n - 1) widths.push(gap); });
  const cells = [];
  items.forEach(([dest, a, b], i) => {
    const save = a - b, pct = Math.round(save / a * 100);
    cells.push(cell([
      p(label(dest, C.muted), { after: 120 }),
      p([r(String(b), { font: SERIF, size: 56, color: C.brand }), r(' min', { size: 20, color: C.brand })], { after: 0, line: 240 }),
      p([r('after upcoming projects', { size: 15, color: C.dim })], { after: 140 }),
      nbar(w - 400, b / 45, 'A1232B', C.soft2, 110), sp(60), nbar(w - 400, a / 45, 'B8C0CC', C.soft2, 110),
      p([r(`Today ${a} min`, { size: 15, color: C.muted })], { before: 60, after: 140 }),
      p([r(` −${save} min `, { size: 17, bold: true, color: 'FFFFFF', shade: C.ok }), r(`   ${pct}% faster`, { size: 17, bold: true, color: C.ok })], { after: 0 }),
    ], { w, fill: 'FFFFFF', mt: 220, mb: 220, ml: 200, mr: 200, borders: { top: line(18, C.brand), bottom: line(4), left: line(4), right: line(4) } }));
    if (i < n - 1) cells.push(cell(p('', { after: 0 }), { w: gap, mt: 0, mb: 0, ml: 0, mr: 0 }));
  });
  return table(widths, [row(cells)]);
}
// upcoming projects as cards with the expected delay called out
function projectCards(items) {
  const w = [CW - 1700 - 1700 - 1700 - 1500, 1700, 1700, 1700, 1500];
  const head = row(['Project', 'Cost', 'Govt. timeline', 'Expected', 'Expected delay'].map((h, i) => cell(p(label(h, C.muted), { after: 0 }), { w: w[i], mt: 60, mb: 80, ml: i ? 140 : 0, borders: { ...NOB, bottom: line(10, C.ink) } })), { header: true });
  const body = items.map(([name, cost, gov, est, delay, months]) => row([
    cell(p(r(name, { size: 19, bold: true, color: C.ink }), { after: 0 }), { w: w[0], ml: 0, mt: 150, mb: 150, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell(p(r(cost, { font: SERIF, size: 24, color: C.ink }), { after: 0 }), { w: w[1], mt: 150, mb: 150, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell(p(r(gov, { size: 18, color: C.text }), { after: 0 }), { w: w[2], mt: 150, mb: 150, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell(p(r(est, { size: 18, bold: true, color: C.ink }), { after: 0 }), { w: w[3], mt: 150, mb: 150, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell(p(r(` ${delay} `, { size: 17, bold: true, color: months >= 6 ? C.brand : C.warn, shade: months >= 6 ? C.brandSoft : C.warnSoft }), { after: 0 }), { w: w[4], mt: 150, mb: 150, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
  ]));
  return table(w, [head, ...body]);
}
// two-part split bar with labels (e.g. male / female)
function splitBar(a, b, la, lb, width = CW) {
  const fa = Math.round(width * a / (a + b));
  return [
    table([fa, width - fa], [row([cell(p(r(`${la}  ${a}%`, { size: 18, bold: true, color: 'FFFFFF' }), { after: 0 }), { w: fa, fill: '2F5D9E', mt: 120, mb: 120, ml: 200 }),
      cell(p(r(`${lb}  ${b}%`, { size: 18, bold: true, color: 'FFFFFF' }), { after: 0, align: AlignmentType.RIGHT }), { w: width - fa, fill: 'A1232B', mt: 120, mb: 120, mr: 200 })])]),
  ];
}

/* ======================================================================== COVER (editorial, white with full-bleed map band) */
const coverBand = new Table({ width: { size: PAGE_W, type: WidthType.DXA }, columnWidths: [PAGE_W], indent: { size: -MX, type: WidthType.DXA }, borders: TBL_NOB,
  rows: [row([cell(p(img('cover_band.jpg', Math.round(PAGE_W / 15), Math.round(PAGE_W / 15 / 2.45)), { after: 0 }), { w: PAGE_W, ml: 0, mr: 0, mt: 0, mb: 0 })]),
    row([cell(p('', { after: 0 }), { w: PAGE_W, fill: C.brand, mt: 0, mb: 0 })], { h: 60 })] });
const cover2 = [
  table([CW / 2, CW / 2], [row([
    cell(UNBRANDED ? p([r('Location ', { font: SERIF, size: 26, color: C.ink }), r('Intelligence', { font: SERIF, size: 26, italics: true, color: C.brand })], { after: 0 })
      : p([img('logo.png', 120, 43), r('    Location Intelligence', { font: SERIF, size: 22, color: C.ink })], { after: 0 }), { w: CW / 2, ml: 0, mt: 0, mb: 120, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell(p(label('Sample report  ·  October 2026', C.dim), { align: AlignmentType.RIGHT, after: 0 }), { w: CW / 2, mr: 0, mt: 0, mb: 120, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
  ])]),
  sp(1500),
  p([r('—  ', { color: C.gold, size: 16 }), label('Land parcel feasibility report', C.gold)], { after: 180 }),
  p(r('Gopalpur, Sector 99A', { font: SERIF, size: 84, color: C.ink }), { after: 0, line: 250 }),
  p(r('Gurugram, Haryana', { font: SERIF, size: 84, italics: true, color: C.brand }), { after: 240, line: 250 }),
  p(r('Survey / Khata 46//24/2   ·   Vacant land with Group Housing potential', { size: 21, color: C.muted }), { after: 520 }),
  coverBand,
  sp(360),
  table(Array(4).fill(CW / 4), [row([['3,713 m²', 'Measured area', '0.92 acres'], ['Residential', 'Planned use', '100% · GMUC-2031'], ['GMUC-2031', 'Master plan', 'DTCP Haryana'], ['3C7-T25-PCC3', 'DIGIPIN', 'Gurugram · Harsaru']].map(([v, l, sub], i) => cell([
    p(r(v, { font: SERIF, size: 30, color: C.ink }), { after: 30 }), p(label(l, C.muted), { after: 20 }), p(r(sub, { size: 15, color: C.dim }), { after: 0 }),
  ], { w: CW / 4, ml: i ? 220 : 0, mt: 40, mb: 40, borders: { ...NOB, left: i ? line(4, C.line) : NB } })))]),
];

/* ======================================================================== CONTENTS (unchanged structure, refreshed header) */
const contentsV2 = [
  p([r('—  ', { color: C.gold, size: 16 }), label('Contents', C.gold)], { after: 60 }),
  p(r('What’s in this report', { font: SERIF, size: 44, color: C.ink }), { after: 60 }),
  p(r('Every report includes the cover, contents, executive summary and methodology. The numbered sections are chosen on the platform.', { size: 17, color: C.muted }), { after: 140 }),
  contentsTable(),
];

/* ======================================================================== EXECUTIVE SUMMARY (dashboard) */
/* ======================================================================== v6 COMPONENT REFINEMENTS */
// data table: light header (ink caps over a firm rule), hairline rows, no fills
function dataTable(headers, rows, widths, o = {}) {
  const head = row(headers.map((h, i) => cell(p(label(h, C.ink), { after: 0 }), { w: widths[i], ml: i ? 140 : 0, mt: 60, mb: 90, borders: { ...NOB, bottom: line(12, C.ink) } })), { header: true });
  const body = rows.map(rw => row(rw.map((v, i) => {
    let kids;
    if (v && v.pill) kids = [p(pill(v.pill), { after: 0 })];
    else if (v && v.runs) kids = [p(v.runs, { after: 0 })];
    else kids = [p(r(String(v ?? ''), { size: 18, bold: i === 0 && !o.plainFirst, color: i === 0 ? C.ink : (o.italicPlaceholders && /^\[/.test(String(v)) ? C.dim : C.text), italics: o.italicPlaceholders && /^\[/.test(String(v)) }), { after: 0, line: 260 })];
    return cell(kids, { w: widths[i], ml: i ? 140 : 0, mt: 110, mb: 110, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } });
  })));
  return table(widths, [head, ...body]);
}
PILL.Flag = [C.brand, C.brandSoft]; PILL.Verified = [C.ok, C.okSoft]; PILL['In preparation'] = [C.muted, C.soft2];

// section opener: navy band, refined proportions, thin brand rule with a short gold lead
const heroBand6 = function (num, title, intro, kicker) {
  const lw = BLEED - 2800;
  const band = new Table({ width: { size: BLEED, type: WidthType.DXA }, columnWidths: [lw, 2800], indent: { size: -MX, type: WidthType.DXA },
    borders: TBL_NOB, rows: [
      row([
        cell([
          p([label(kicker || 'Section ' + num, C.gold)], { after: 100 }),
          p(r(title, { font: SERIF, size: 48, color: 'FFFFFF' }), { after: 120, line: 250 }),
          ...(intro ? [p(r(intro, { size: 19, color: ON_NAVY }), { after: 0, line: 290 })] : []),
        ], { w: lw, fill: C.ink, ml: MX, mr: 300, mt: 420, mb: 420, va: VerticalAlign.CENTER }),
        cell(p(r(num, { font: SERIF, size: 120, color: '24406E' }), { after: 0, align: AlignmentType.RIGHT }),
          { w: 2800, fill: C.ink, ml: 0, mr: MX, mt: 120, mb: 120, va: VerticalAlign.CENTER }),
      ]),
      row([cell(p('', { after: 0 }), { w: lw, fill: C.brand, mt: 0, mb: 0 }), cell(p('', { after: 0 }), { w: 2800, fill: C.gold, mt: 0, mb: 0 })], { h: 40 }),
    ] });
  return [band, sp(240)];
};
hero = (num, ...rest) => { SEC = /^\d+$/.test(num) ? String(+num) : null; SUB = 0; return heroBand6(num, ...rest); };

// lead paragraph: one plain-language sentence that frames a section
const lead = (t, o = {}) => p(r(t, { font: SERIF, size: o.size || 22, color: C.ink }), { after: o.after ?? 160, line: 300 });
const body = (t, o = {}) => p(r(t, { size: o.size || 19, color: o.color || C.text }), { after: o.after ?? 120, line: 290 });
const fitW = (file, w) => img(file, w, Math.round(w * sizeOf(file).h / sizeOf(file).w));

// takeaway: the one-line message a reader should get from the figure that follows
const takeaway = t => p(r(t, { font: SERIF, size: 21, color: C.ink }), { after: 140, line: 290, keepNext: true });
// source images: thin frame, caption with a SOURCE tag
function figure(file, w, cap) {
  return [table([w * 15], [row([cell(p(fitW(file, w - 2), { after: 0, align: AlignmentType.CENTER }), { w: w * 15, ml: 0, mr: 0, mt: 0, mb: 0,
    borders: { top: line(4), bottom: line(4), left: line(4), right: line(4) } })])]),
    p([r('SOURCE  ', { size: 13, bold: true, color: C.dim, sp: 20 }), r(cap, { size: 15, color: C.muted })], { after: 160, before: 60 })];
}

// status table for the executive summary: area · finding · status pill
function statusTable(items) {
  const w = [2500, CW - 2500 - 1700, 1700];
  return dataTable(['Area', 'What the records show', 'Status'], items.map(([a, f, s]) => [a, f, { pill: s }]), w);
}

/* ======================================================================== EXECUTIVE SUMMARY */
const card = (f, w, after = 140) => p(fitW(f, w), { after, align: AlignmentType.CENTER });
const es2 = [
  ...hero('ES', 'Executive summary', 'The parcel at a glance: the key facts, what the records confirm and what needs attention before acquisition.', 'At a glance'),
  split([
    card('v8_es_parcel.jpg', 330, 0),
  ], [
    kpis([['Measured area', '3,713 m²', '0.92 acres · 3,692.8 m² per revenue record']], { width: CW - 5340, size: 44 }), sp(160),
    kpis([['Planned use', 'Residential', 'Group Housing · GMUC-2031']], { width: CW - 5340, size: 30 }), sp(160),
    kpis([['Circle rate', '₹45,000 / m²', 'government guideline rate, Harsaru']], { width: CW - 5340, size: 30 }),
  ], 5100),
  sp(160),
  tiles([['Master plan', 'GMUC-2031', 'DTCP Haryana'], ['Survey / khata', '46//24/2', 'khata not listed'], ['District / tehsil', 'Gurugram', 'Harsaru'], ['DIGIPIN', '3C7-T25-PCC3']], 4, { vsize: 21, accent: C.navy }),
  h2('Status and red flags'),
  statusTable([
    ['Ownership & title', 'Registered to M/s HASTA Infrastructure Pvt. Ltd.; mutation not yet confirmed', 'Review'],
    ['Zoning & land use', 'Residential under GMUC-2031; recorded use is agricultural, CLU to be confirmed', 'Review'],
    ['Structures on parcel', '3 structures cover about 5.8% of the land; 1 crosses the boundary', 'Flag'],
    ['Seismic zone', 'BIS Zone IV, high damage risk (IS 1893:2016)', 'Flag'],
    ['Environmental', 'Proposed EC SIA/HR/INFRA2/558167/2026 overlaps the parcel; high-tension line 71 m away', 'Flag'],
    ['Connectivity', 'IGI Airport 31 min; NH-248BB 9.8 km; three road and power projects under way', 'Favourable'],
    ['Flood exposure', 'No mapped exposure; nearest flood footprint 28.2 km', 'Favourable'],
    ['Records & litigation', 'Encumbrance, CERSAI and litigation checks are being compiled', 'In preparation'],
  ]),
];

/* ======================================================================== 01 PROPERTY OVERVIEW */
const s1v = [
  ...hero('01', 'Property Overview', 'Who owns the parcel, its survey and khata record, and a Vastu reading of the plot’s orientation and shape.'),
  kpis([['Registered owner', 'HASTA Infra', 'M/s HASTA Infrastructure Pvt. Ltd.'], ['Record area', '3,692.8 m²', '7 kanal 6 marla per survey'], ['Khata', '31', 'Surveys 133 & 144'], ['Mutation', 'Pending', 'to be verified', C.brand]], { size: 34 }),
  h2('Ownership'),
  takeaway('Registered to M/s HASTA Infrastructure Pvt. Ltd. across two surveys, 133 and 144.'),
  split([card('v8_ownership.jpg', 370, 0)], [
    tiles([['Owner', 'M/s HASTA Infrastructure Pvt. Ltd.', 'Surveys 133 and 144'], ['Khata', '31', 'both surveys'], ['Area per survey', '7 kanal 6 marla', '3,692.8 m² each']], 1, { width: CW - 5940, vsize: 22, accent: C.navy }),
  ], 5700),
  h2('Ownership & title chain'),
  takeaway('Three owners in 28 years. The 2018 sale has not yet been recorded as a mutation.'),
  card('v8_title_chain.png', 672),

  h2('Vastu analysis', { pageBreak: true }),
  takeaway('7 of 8 Vastu parameters are favourable; only the north-east corner needs review.'),
  body('Directional assessment per Vastu Shastra principles, based on the supplied boundary survey and site orientation. Indicative only; not a substitute for a site consultation.', { color: C.muted, size: 17, after: 200 }),
  split([card('v8_vastu.jpg', 210, 0)], [
    kpis([['Parameters favourable', '7 of 8', 'standard Vastu Shastra guidelines', C.ok], ['Point of review', 'NE corner', 'partly affected by a structure', C.warn]], { width: CW - 3240, size: 40 }),
    sp(180),
    table([CW - 3240], [row([cell([p(label('Recommendation', C.brand), { after: 60 }),
      p(r('Confirm removal or relocation of the NE structure before layout planning; place the main mass toward the South-West, with entrances and open areas facing North / North-East.', { size: 19 }), { after: 0, line: 290 })],
      { w: CW - 3240, fill: C.brandSoft, ml: 220, mt: 180, mb: 180, borders: { ...NOB, left: line(18, C.brand) } })])]),
  ], 3000),
  sp(200),
  checklist([
    ['ok', 'Plot shape', 'Square / rectangular, regular geometry', 'Rectangular, regular geometry'],
    ['ok', 'Road facing', 'North or East facing preferred', 'Faces North · 60 m wide access road'],
    ['ok', 'Main entry (gate)', 'North-East (Ishanya) ideal', 'NE corner open, accessible from road'],
    ['ok', 'Slope of land', 'Fall towards North / East; high in SW', 'Level parcel; slight fall to NE per contour'],
    ['review', 'North-East corner', 'Should stay open, unobstructed, lowest point', 'Partly affected; existing structure crosses boundary near NE'],
    ['ok', 'South-West zone', 'Suited for heavier mass / main structure', 'No existing structures in SW'],
    ['na', 'Water body / low point', 'Ideal in North or North-East', 'None on record within parcel'],
    ['ok', 'Corner cuts', 'Avoid cuts or missing corners, esp. SW', 'None identified in supplied boundary survey'],
  ]),
];

/* ======================================================================== 02 INFRASTRUCTURE */
const pairCol = (n, file, title, text, w) => cell([
  p(fitW(file, PX(w) - 8), { after: 80 }),
  p([r(n + '  ', { font: SERIF, size: 26, color: C.brand }), r(title, { size: 18, bold: true, color: C.ink })], { after: 30, line: 260 }),
  p(r(text, { size: 16, color: C.muted }), { after: 0, line: 250 }),
], { w, ml: 0, mr: 0, mt: 0, mb: 0 });

const s2v = [
  ...hero('02', 'Infrastructure & Connectivity', 'Roads, airports, metro, rail and social infrastructure today, what’s coming next, and how the area has grown.'),
  kpis([['Airport (IGI)', '31 min', '25.9 km via Dwarka Expressway'], ['Metro', '18 km', 'about 35 min'], ['Highway', '9.8 km', 'NH-248BB · 15 min'], ['Upcoming projects', '3', '₹850 Cr in pipeline']], { size: 36 }),
  h2('Existing infrastructure \u00B7 travel time from the site'),
  takeaway('Rail and the highway are within 15 minutes; the airport, metro and Cyber City are 31 to 40 minutes away.'),
  card('v10_travel.png', 672),
  h2('Social infrastructure'),
  takeaway('Three schools, five hospitals and three shopping centres lie within 1 km.'),
  counters([['Schools', '3', 'within 1 km'], ['Hospitals', '5', 'within 1 km'], ['Shopping', '3', 'within 1 km'], ['Police', '1', '2.8 km'], ['IT parks', '2', '4.5 km']]),

  h2('Infrastructure map', { pageBreak: true }),
  takeaway('The site in its setting: highways, metro, rail and everyday amenities around the plot.'),
  card('v8_infra.jpg', 672),
  h2('Upcoming infrastructure projects'),
  takeaway('Three road and power projects are due for completion between November 2026 and May 2027.'),
  card('v9_projects.png', 672),

  h2('Travel time savings from new infrastructure', { pageBreak: true }),
  takeaway('Once the projects are complete, trips to the airport, Cyber City and Aerocity get 7 to 12 minutes shorter.'),
  card('v8_savings.png', 672),
  h2('Upcoming infrastructure map'),
  takeaway('Where the new road, rail and power projects run in relation to the site.'),
  card('v8_upcoming.jpg', 672),

  h2('Satellite imagery · ten years of growth', { pageBreak: true }),
  lead(`Built-up land in this area rose from ${SAT.built2015}% to ${SAT.built2025}% between 2015 and 2025: about ${SAT.converted}% of the land that was open in 2015 has since been built on.`, { size: 21, after: 100 }),
  body('The numbered boxes mark three places where farmland has given way to housing. Each is shown below as it looked in 2015 and in 2025.', { color: C.muted, size: 18, after: 160 }),
  card('v8_satellite.jpg', 672, 0),
];

/* ======================================================================== 03 REGULATORY */
const s3v = [
  ...hero('03', 'Regulatory & Approvals', 'Zoning and regulatory restrictions, the approvals required, applicable schemes, and how much can be built.'),
  kpis([['FAR range', '1.5–2.25', 'up to 3.0 with TDR'], ['Buildable area', '8,354 m²', 'upper bound on 3,713 m²'], ['Height headroom', '≈130 m', 'about 43 floors'], ['Approvals needed', '5', 'see checklist below', C.brand]], { size: 36 }),
  h2('Environmental clearances within 5 km'),
  takeaway('One clearance is proposed on the parcel itself; another was granted 177 m away.'),
  dataTable(['Project', 'Status', 'Distance'], [
    ['Group Housing Colony project · Gopalpur', { pill: 'Proposed' }, 'On parcel'],
    ['EC extension · Residential Group Housing, Sector 99A, Gopalpur', { pill: 'Granted' }, '177 m SW'],
  ], [CW - 1800 - 1800, 1800, 1800]),
  h2('Legal / title checks'),
  takeaway('No litigation found. Encumbrance status still needs a manual search.'),
  flags([['LOW', 'Litigation', 'No dispute, complaint or litigation identified in the records reviewed.'],
    ['REVIEW', 'Encumbrance / charge status', 'A manual index search at the Harsaru sub-registrar is needed to confirm charge status.']]),
  h2('Approvals checklist'),
  takeaway('Five approvals are needed before construction can start.'),
  steps([['DTCP Haryana', 'Residential CLU', 'Confirm CLU; recorded use is agricultural, planned use Residential.'],
    ['AAI · NOCAS', 'Height NOC', 'Apply via NOCAS; draft top elevation is 345 m AMSL.'],
    ['HSPCB', 'Environmental clearance', 'Verify proposed EC SIA/HR/INFRA2/558167/2026.'],
    ['Harsaru sub-registrar', 'Encumbrance certificate', 'Manual index search required.'],
    ['Harsaru tehsil', 'Jamabandi / mutation', 'Confirm mutation; draft cites 2023–2024 jamabandi.']]),

  h2('Airport height limits', { pageBreak: true }),
  takeaway('The airport caps buildings at 345 m above sea level. The site sits at 215 m, so a building can rise about 130 m, roughly 43 floors.'),
  card('v10_height.png', 672),
  h2('Environmental restrictions'),
  takeaway('One item needs review: a high-tension line 71 m away. Water bodies are over 1 km away and protected areas over 5 km.'),
  card('v9_constraints.png', 672),
  h2('Buildability & development potential', { pageBreak: true }),
  takeaway('The plot can carry 1.5 to 2.25 times its area in floor space today (up to 8,354 m\u00B2), or 3 times with TDR (11,139 m\u00B2).'),
  card('v9_buildable.png', 672),
  h2('Government schemes applicable in the area'),
  takeaway('Four schemes shape what can be built here.'),
  tiles([['Haryana Building Code', '2017 code', 'as amended to 05.08.2024 · FAR and density norms for Group Housing'],
    ['Affordable Group Housing', '2013 policy', 'higher FAR of 2.25; subject to licence category'],
    ['TOD Policy', 'Transit-oriented', 'extra FAR near qualifying transit corridors'],
    ['TDR Scheme', 'Transferable rights', 'purchased TDR lifts FAR to 3.0']], 2, { vsize: 22, accent: C.navy }),
];

/* ======================================================================== 04 RECORDS (in preparation) */
const W3v = [3000, CW - 3000 - 2600, 2600];
function checkTable(rows) {
  const w = [620, CW - 620 - 2500 - 1500, 2500, 1500];
  const head = row(['#', 'Check', 'Source', 'Status'].map((x, i) => cell(p(label(x, C.ink), { after: 0 }), { w: w[i], ml: i ? 140 : 0, mt: 60, mb: 90, borders: { ...NOB, bottom: line(12, C.ink) } })), { header: true });
  const body = rows.map(([n, what, desc, src]) => row([
    cell(p(r(n, { font: SERIF, size: 22, color: C.dim }), { after: 0 }), { w: w[0], ml: 0, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell([p(r(what, { size: 19, bold: true, color: C.ink }), { after: 20 }), p(r(desc, { size: 16, color: C.muted }), { after: 0 })], { w: w[1], ml: 140, mt: 70, mb: 70, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell(p(r(src, { size: 17, color: C.text }), { after: 0 }), { w: w[2], ml: 140, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    cell(p(pill('In preparation'), { after: 0 }), { w: w[3], ml: 140, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
  ]));
  return table(w, [head, ...body]);
}
// executive card: count, question, checks list
function areaCards(items) {
  const gap = 140, n = items.length, w = Math.floor((CW - gap * (n - 1)) / n);
  const widths = []; items.forEach((_, i) => { widths.push(w); if (i < n - 1) widths.push(gap); });
  const cells = [];
  items.forEach(([area, count, q, checks], i) => {
    cells.push(cell([
      p(label(area, C.navy), { after: 100 }),
      p([r(count, { font: SERIF, size: 38, color: C.ink }), r('  checks', { size: 17, color: C.muted })], { after: 80, line: 240 }),
      p(r(q, { font: SERIF, size: 19, color: C.ink }), { after: 0, line: 270 }),
    ], { w, fill: 'FFFFFF', mt: 150, mb: 160, ml: 200, mr: 180, borders: { top: line(18, C.navy), bottom: line(4), left: line(4), right: line(4) } }));
    if (i < n - 1) cells.push(cell(p('', { after: 0 }), { w: gap, mt: 0, mb: 0, ml: 0, mr: 0 }));
  });
  return table(widths, [row(cells)]);
}
// single check register with group rows
function register(groups) {
  const w = [CW - 3000 - 1500, 3000, 1500];
  const hd = row(['Check', 'Source', 'Status'].map((x, i) => cell(p(label(x, C.ink), { after: 0 }), { w: w[i], ml: i ? 140 : 0, mt: 60, mb: 90, borders: { ...NOB, bottom: line(12, C.ink) } })), { header: true });
  const rows = [hd];
  groups.forEach(([g, items]) => {
    rows.push(row([cell(p(label(g, C.navy), { after: 0 }), { w: CW, span: 3, ml: 0, mt: 110, mb: 30, borders: NOB })]));
    items.forEach(([chk, src]) => rows.push(row([
      cell(p(r(chk, { size: 18, color: C.ink }), { after: 0 }), { w: w[0], ml: 0, mt: 55, mb: 55, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
      cell(p(r(src, { size: 17, color: C.muted }), { after: 0 }), { w: w[1], ml: 140, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
      cell(p(pill('In preparation'), { after: 0 }), { w: w[2], ml: 140, va: VerticalAlign.CENTER, borders: { ...NOB, bottom: line(4) } }),
    ])));
  });
  return table(w, rows);
}
// how results will read
function statusKey(items) {
  const n = items.length, w = Math.floor(CW / n);
  return table(Array(n).fill(w), [row(items.map(([s, t], i) => cell([p(pill(s), { after: 60 }), p(r(t, { size: 16, color: C.muted }), { after: 0, line: 250 })],
    { w, ml: i ? 200 : 0, mr: 120, mt: 40, mb: 40, borders: { ...NOB, left: i ? line(4) : NB } })))]);
}
const s4v = [
  ...hero('04', 'Property Records, Ownership & Litigation', 'Encumbrances, title chain and CERSAI checks, plus litigation and reputation screening of the borrower, group and promoters.'),
  h2('What this section will answer'),
  takeaway('Nine checks answer three questions an investor needs settled before committing. All are in preparation; results follow in the next version.'),
  areaCards([
    ['Title & ownership', '4', 'Is the title clean, unencumbered and correctly recorded?', ['Encumbrance verification', 'Legal & title review', 'Title chain, 30 years', 'CERSAI records']],
    ['Borrower, group & promoters', '3', 'Do the parties behind the deal carry legal or credit risk?', ['Borrower profile', 'Group company litigation', 'Promoter litigation']],
    ['Reputation & compliance', '2', 'Is there adverse news or any sanctions exposure?', ['Adverse news screening', 'UN and OFAC sanctions']],
  ]),
  h2('Check register'),
  register([
    ['Title & ownership', [['Encumbrance verification', 'Sub-Registrar encumbrance certificate'], ['Legal & title review', 'Legal counsel'], ['Title chain history, 30 years', 'Revenue records and sale deeds'], ['CERSAI records check', 'CERSAI search']]],
    ['Borrower, group & promoters', [['Borrower profile', 'MCA and credit bureau'], ['Group company litigation', 'Court records search'], ['Promoter litigation', 'Court records search']]],
    ['Reputation & compliance', [['Adverse news screening', 'Media database'], ['Sanctions screening', 'UN and OFAC lists']]],
  ]),
  p([r('WHEN COMPLETE  ', { size: 14, bold: true, color: C.dim, sp: 20 }), pill('Favourable'), r('  nothing adverse     ', { size: 16, color: C.muted }), pill('Review'), r('  needs a closer look     ', { size: 16, color: C.muted }), pill('Flag'), r('  material issue', { size: 16, color: C.muted })], { before: 160, after: 0 }),
];



/* ======================================================================== 05 MARKET */
const s5v = [
  ...hero('05', 'Market & Catchment Intelligence', 'Launches, absorption, pricing and developer land banks, plus who lives, works and spends within reach of the site.'),
  kpis([['Sales / absorption 2026', '≈72%', 'indicative'], ['Price / sq ft', '₹8.2–9.5k', 'current, indicative'], ['Inventory overhang', '7 mo', 'months of supply'], ['Price trend', '+6% QoQ', 'last 3 quarters', C.ok]], { size: 36 }),
  h2('Market & transaction data'),
  takeaway('Six projects within 3 km; about 1,850 units launched in 2026.'),
  tiles([['Projects within 3 km', '6', 'launched / under construction'], ['Units launched in 2026', '≈1,850', 'indicative'],
    ['Nearest micro-market', 'Sector 99', 'Dwarka Expressway, Gurugram'], ['Micro-market price', '₹8,800 / sq ft', 'average (indicative)']], 4, { vsize: 22, accent: C.navy }),
  note('Dwarka Expressway gives the micro-market direct access to Delhi and the airport.'),
  h2('Real estate developer land banks within 10 km'),
  takeaway('Prestige holds the largest land bank nearby, at 100 acres.'),
  split([card('v8_landbanks_map.jpg', 329, 0)], [card('v8_landbanks.png', 329, 0)], 4953, 200),

  h2('Demographics & economic activity', { pageBreak: true }),
  kpis([['Population within 5 km', '274,956'], ['Population growth', '+16%', '5 years', C.ok], ['Household growth', '+14%', '5 years', C.ok], ['Affluence index', '38.2%', 'households over ₹10 lakh a year']], { size: 36 }),
  h2('Five-year growth · built environment and commercial & social activity'),
  takeaway('Medical facilities (+25%) and residential property (+22%) grew fastest over five years.'),
  card('v8_growth.png', 672, 60),
  h2('Population growth indicators'),
  split([card('v8_pop.png', 329, 0)], [sp(240),
    lead('Night-time light has grown four times faster than population.', { size: 24, after: 120 }),
    body('Night-time radiance (satellite-measured light at night, 2018–2024) is a proxy for economic activity. Population and household growth are five-year figures.', { color: C.muted, size: 17, after: 0 })], 5000),
  h2('Catchment demographics'),
  takeaway('Most residents are of working age, and more than a third of households earn over \u20B910 lakh a year.'),
  card('v8_waffles.png', 672, 0),
];

/* ======================================================================== 06 SITE */
const s6v = [
  ...hero('06', 'Site Attributes & Considerations', 'The ground itself: seismic zone and terrain, groundwater and soil, flood exposure, slope, and structures on the parcel.'),
  kpis([['Seismic zone', 'Zone IV', 'high damage risk', C.brand], ['Flood exposure', 'None', 'mapped · nearest 28.2 km', C.ok], ['Elevation', '215 m', 'AMSL · flat terrain'], ['Built-up on parcel', '5.76%', '213.7 m² · 3 structures']], { size: 36 }),
  h2('Seismic zone'),
  split([card('v8_seismic.png', 329, 0)], [sp(160),
    lead('High damage risk zone.', { size: 22, after: 80 }),
    body('BIS Seismic Zone IV under IS 1893:2016. Structural design should follow the Zone IV provisions of the code.', { color: C.muted, size: 18, after: 0 })], 4953, 200),
  h2('Terrain, slope & soil'),
  takeaway('The parcel is almost flat, with about a 2 m fall from west to east.'),
  split([card('v8_terrain_map.jpg', 330, 0)], [
    tiles([['Slope / aspect', '0.2° NE-facing', 'indicative'], ['Groundwater & soil', 'Loam topsoil, pH 7.7', 'groundwater stress not assessed'], ['Terrain', 'Flat', 'minimal slope variance']], 1, { width: CW - 5340, vsize: 20, accent: C.navy }),
  ], 5100),
  sp(60),
  card('v8_terrain.png', 672, 0),

  h2('Structures on parcel / encroachments', { pageBreak: true }),
  takeaway('Three structures cover 5.76% of the parcel; one crosses the boundary.'),
  card('v8_structures.jpg', 672),
  sp(160),
  kpis([['Structures intersecting parcel', '3'], ['Inside / crossing boundary', '2 · 1', '2 fully inside, 1 crossing', C.brand], ['Built-up area inside parcel', '213.7 m²', 'of 3,713 m²']], { size: 36 }),
  sp(200),
  card('v8_built.png', 672, 0),
  h2('Site summary'),
  statusTable([
    ['Seismic zone', 'BIS Zone IV, high damage risk; design to IS 1893:2016 Zone IV provisions', 'Flag'],
    ['Structures', '3 structures on the parcel, 1 crossing the boundary; removal or regularisation to be confirmed', 'Flag'],
    ['Flood exposure', 'No mapped exposure; nearest flood footprint 28.2 km', 'Favourable'],
    ['Terrain & slope', 'Flat; about 2 m fall west to east, 62% of the area under 2\u00B0', 'Favourable'],
    ['Soil & groundwater', 'Loam topsoil, pH 7.7; groundwater stress not assessed', 'Review'],
  ]),
];

/* ======================================================================== METHODOLOGY */
const smv = [
  ...hero('A', 'Methodology', 'How this report was put together, and the sources behind each section.', 'Appendix'),
  h2('Data sources'),
  dataTable(['Domain', 'Source'], [
    ['Master plan & zoning', 'DTCP Haryana · GMUC-2031'], ['Revenue & ownership records', 'Jamabandi, Harsaru tehsil (supplied extracts)'], ['Market & transaction data', 'PropEquity (indicative)'],
    ['Digital connectivity', 'Ookla (indicative)'], ['Satellite & terrain imagery', 'Supplied source imagery, 2015 and 2025'], ['Seismic classification', 'BIS IS 1893:2016']], [3800, CW - 3800]),
  h2('How the satellite comparison works'),
  body('The 2015 and 2025 images are aligned to the same ground frame using fixed landmarks. Each pixel is classed as built-up or open from its colour and texture, and the two years are compared. Results are indicative and are not a land survey.'),
  h2('Confidentiality'),
  body(`This document is strictly private and confidential. It has been prepared solely for the addressee’s internal evaluation and must not be reproduced, distributed, or disclosed, in whole or in part, to any third party without the prior written consent${UNBRANDED ? '' : ' of HDFC Capital'}.`, { after: 200 }),
  h2('Important notes'),
  bullet('Figures marked indicative or with an asterisk are estimates from the sources listed and are not a formal valuation.'),
  bullet('Areas derived from mapped boundaries are approximate and are not a legal survey.'),
  bullet('District / state GDP growth figures were not available in the source data.'),
  bullet('All figures in this sample report are dummy data for demonstration.'),
];

const doc2 = new Document({
  creator: UNBRANDED ? 'Location Intelligence' : 'HDFC Capital · Location Intelligence', title: 'Land Parcel Feasibility Report · Gopalpur, Sector 99A',
  styles: { default: { document: { run: { font: SANS, size: 19, color: C.text } } } },
  numbering: { config: [{ reference: 'dots', levels: [{ level: 0, format: LevelFormat.BULLET, text: '▪', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 260 } }, run: { color: C.brand } } }] }] },
  sections: [
    { properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 700, right: MX, bottom: 700, left: MX, header: 300, footer: 300 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [] })] }) }, footers: { default: new Footer({ children: [new Paragraph({ children: [] })] }) }, children: cover2 },
    chapter('Contents', contentsV2),
    chapter('Executive summary', es2),
    chapter('01 · Property overview', s1v),
    chapter('02 · Infrastructure & connectivity', s2v),
    chapter('03 · Regulatory & approvals', s3v),
    chapter('04 · Records, ownership & litigation', s4v),
    chapter('05 · Market & catchment', s5v),
    chapter('06 · Site attributes', s6v),
    chapter('Methodology', smv),
  ],
});
Packer.toBuffer(doc2).then(b => { fs.writeFileSync(OUT, b); console.log('wrote', OUT, b.length); });
