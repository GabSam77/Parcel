"""
Builds Plotform.html: ONE self-contained file you can double-click (no server).
CSS, JS, pdf.js, pdf-lib and the report PDF are all embedded.
Only the map (Leaflet + tiles) and Google Fonts still load from the internet.
Run after changing anything:  python3 tools/build_standalone.py
"""
import base64, os, re
ROOT = os.path.join(os.path.dirname(__file__), "..")
r = lambda p: open(os.path.join(ROOT, p), encoding="utf-8").read()
safe = lambda t: t.replace("</script", "<\\/script")

html = r("index.html")
html = html.replace('<link rel="stylesheet" href="css/styles.css">', "<style>\n" + r("css/styles.css") + "\n</style>")
for name in ["config", "data", "city", "geocode", "sitemap", "location", "home", "builder", "report", "app"]:
    tag = f'<script src="js/{name}.js"></script>'
    assert tag in html, tag
    html = html.replace(tag, "<script>\n" + safe(r(f"js/{name}.js")) + "\n</script>")

pdf_b64 = base64.b64encode(open(os.path.join(ROOT, "assets/report.pdf"), "rb").read()).decode()
embedded = (
    "<script>\n" + safe(r("assets/vendor/pdf-lib.min.js")) + "\n</script>\n"
    '<script type="text/plain" id="pdfjs-src">' + safe(r("assets/vendor/pdf.min.mjs")) + "</script>\n"
    '<script type="text/plain" id="pdfjs-worker-src">' + safe(r("assets/vendor/pdf.worker.min.mjs")) + "</script>\n"
    "<script>PF.inlinePdf = '" + pdf_b64 + "';</script>\n"
)
html = html.replace("</body>", embedded + "</body>")
# embed the brand logo if it has been added (assets/brand/hdfc-capital-logo.png or .svg)
for ext, mime in (("png", "image/png"), ("svg", "image/svg+xml")):
    lp = os.path.join(ROOT, "assets/brand/hdfc-capital-logo." + ext)
    if os.path.exists(lp):
        uri = "data:%s;base64,%s" % (mime, base64.b64encode(open(lp, "rb").read()).decode())
        html = html.replace('src="assets/brand/hdfc-capital-logo.png"', 'src="%s"' % uri)
        break
out = os.path.join(ROOT, "Plotform.html")
open(out, "w", encoding="utf-8").write(html)
print("wrote", os.path.abspath(out), f"{os.path.getsize(out)/1e6:.1f} MB")
