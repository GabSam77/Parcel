"""v3 figures: charts rebuilt to the dataviz mark specs, consistent map/satellite treatment, new cover art.
Every chart is rendered at its final printed width so type sizes are true (9-10 pt)."""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Patch
from matplotlib.lines import Line2D
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageEnhance

HERE = os.path.dirname(__file__)
A = lambda f: os.path.join(HERE, "assets", f)

# tokens: text inks + validated series palette (blue / crimson / gold) + de-emphasis gray
INK, TEXT, MUTED, DIM = "#0E2240", "#2B3445", "#5B6676", "#8A93A3"
GRID, BASE, TRACK = "#E6E9EE", "#C9CED8", "#EEF1F5"
S1, S2, S3, DE = "#2F5D9E", "#A1232B", "#B48A3C", "#B8C0CC"
FULL, HALF, DPI = 7.0, 3.4, 250

plt.rcParams.update({"font.family": "Carlito", "font.size": 9.5, "text.color": TEXT,
                     "axes.edgecolor": BASE, "axes.labelcolor": MUTED, "xtick.color": MUTED, "ytick.color": TEXT})
SANS = "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf"


def save(fig, name):
    fig.savefig(A(name), dpi=DPI, facecolor="white")
    plt.close(fig)


def frame_axes(ax, xgrid=True):
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(BASE); ax.spines["bottom"].set_linewidth(.8)
    ax.tick_params(length=0, labelsize=8.5)
    if xgrid:
        ax.xaxis.grid(True, color=GRID, lw=.7); ax.set_axisbelow(True)


def rbarh(ax, y, w, h, color, left=0, r=None):
    """horizontal bar with a rounded data end and square baseline (dataviz spec)"""
    if w <= 0:
        return
    xr = ax.get_xlim(); yr = ax.get_ylim()
    bb = ax.get_window_extent()
    fig = ax.figure
    ppx = (xr[1] - xr[0]) / (bb.width / fig.dpi)    # data units per inch (x)
    ppy = (yr[1] - yr[0]) / (bb.height / fig.dpi)   # data units per inch (y)
    rad = min(3 / 96 * ppx, w / 2)                  # ~3-4 px rounded data end at print size
    ax.add_patch(FancyBboxPatch((left, y - h / 2), w, h, boxstyle=f"round,pad=0,rounding_size={rad}",
                                mutation_aspect=ppy / ppx, color=color, lw=0, zorder=3))
    ax.add_patch(plt.Rectangle((left, y - h / 2), min(rad, w), h, color=color, lw=0, zorder=3))


def legend(ax, items, y=1.04, x=0):
    hs = [Line2D([0], [0], marker=m, color="none", markerfacecolor=c, markeredgecolor="white", markersize=8) if m else Patch(color=c) for c, l, m in items]
    ax.legend(hs, [l for _, l, _ in items], loc="lower left", bbox_to_anchor=(x, y), ncol=len(items), frameon=False,
              fontsize=8.5, handlelength=1.2, columnspacing=1.6, borderaxespad=0)


# ====================================================================== CHARTS
def travel_dumbbell():
    rows = [("IGI Airport", 31, 22), ("Cyber City, Gurugram", 40, 28), ("Aerocity", 15, 8)]
    fig = plt.figure(figsize=(FULL, 2.0)); ax = fig.add_axes([.24, .2, .64, .62])
    ax.set_xlim(0, 45); ax.set_ylim(-.6, len(rows) - .4)
    for i, (n, a, b) in enumerate(rows[::-1]):
        ax.plot([b, a], [i, i], color=BASE, lw=2, solid_capstyle="round", zorder=2)
        ax.scatter([a], [i], s=64, color=DE, edgecolor="white", linewidth=2, zorder=4)
        ax.scatter([b], [i], s=64, color=S2, edgecolor="white", linewidth=2, zorder=5)
        ax.text(a + 1, i, f"{a}", va="center", fontsize=8.5, color=MUTED)
        ax.text(b - 1, i, f"{b}", va="center", ha="right", fontsize=8.5, color=INK, fontweight="bold")
        fig.text(.9, ax.transData.transform((0, i))[1] / fig.bbox.height, f"−{a - b} min", va="center", fontsize=9.5, color=INK, fontweight="bold")
    ax.set_yticks(range(len(rows))); ax.set_yticklabels([r[0] for r in rows[::-1]], fontsize=9.5)
    ax.set_xticks([0, 10, 20, 30, 40]); ax.set_xlabel("Travel time (minutes)", fontsize=8.5)
    frame_axes(ax)
    fig.text(.9, .86, "Saving", fontsize=8, color=DIM)
    legend(ax, [(DE, "Today", "o"), (S2, "After upcoming projects", "o")], y=1.06)
    save(fig, "c_travel.png")


def projects_timeline():
    q = lambda y, m: y + (m - 1) / 12
    now = q(2026, 10)
    rows = [("Dwarka Expressway \u00B7 GMDA link to Wazirpur Chowk", "\u20B9450 Cr", q(2027, 5), q(2028, 5), "May 2027", "Q2 2028"),
            ("NH-248BB widening", "\u20B9280 Cr", q(2026, 12), q(2027, 2), "Dec 2026", "Q1 2027"),
            ("Daulatabad 400 kV substation augmentation", "\u20B9120 Cr", q(2026, 11), q(2027, 2), "Nov 2026", "Q1 2027")]
    fig = plt.figure(figsize=(FULL, 2.7)); ax = fig.add_axes([.02, .14, .66, .7])
    n = len(rows); ax.set_xlim(now - .05, q(2028, 8)); ax.set_ylim(-.6, n - .2)
    for i, (name, cost, gov, est, gl, el) in enumerate(rows[::-1]):
        y = i
        ax.text(now, y + .26, name, fontsize=9.5, fontweight="bold", color=INK, va="bottom")
        ax.plot([now, est], [y, y], color=TRACK, lw=7, solid_capstyle="round", zorder=1)
        ax.plot([gov, est], [y, y], color=S2, lw=2, zorder=2)
        ax.scatter([gov], [y], s=60, color=S1, edgecolor="white", linewidth=2, zorder=4)
        ax.scatter([est], [y], s=60, color=S2, edgecolor="white", linewidth=2, zorder=4)
        ty = ax.transData.transform((0, y + .12))[1] / fig.bbox.height
        fig.text(.72, ty, cost, fontsize=10, fontweight="bold", color=INK, va="center")
        fig.text(.72, ty - .085, f"Govt {gl}  \u00B7  HCAL {el}", fontsize=8.5, color=MUTED, va="center")
    ax.axvline(now, color=S3, lw=1.2, zorder=0)
    ax.text(now + .02, n - .28, "Today", fontsize=8, color=MUTED, va="bottom")
    ticks = [q(2027, 1), q(2027, 7), q(2028, 1), q(2028, 7)]
    ax.set_xticks(ticks); ax.set_xticklabels(["Jan 2027", "Jul 2027", "Jan 2028", "Jul 2028"])
    ax.set_yticks([])
    frame_axes(ax)
    fig.text(.72, .9, "Cost \u00B7 completion", fontsize=8, color=DIM)
    legend(ax, [(S1, "Government timeline", "o"), (S2, "HCAL estimate", "o")], y=1.06)
    save(fig, "c_projects.png")


def hbars(name, rows, width=FULL, xmax=None, unit="%", sign="+", label_w=.26, height=None):
    n = len(rows)
    h = height or (.32 * n + .45)
    fig = plt.figure(figsize=(width, h)); ax = fig.add_axes([label_w, .08, .9 - label_w, .84])
    xmax = xmax or max(v for _, v in rows) * 1.18
    ax.set_xlim(0, xmax); ax.set_ylim(-.6, n - .4)
    fig.canvas.draw()
    for i, (lab, v) in enumerate(rows[::-1]):
        rbarh(ax, i, v, .42, S1)
        ax.text(v + xmax * .015, i, f"{sign}{v:g}{unit}" if unit == "%" else f"{v:g} {unit}", va="center", fontsize=9, color=INK, fontweight="bold")
    ax.set_yticks(range(n)); ax.set_yticklabels([r[0] for r in rows[::-1]], fontsize=9)
    ax.set_xticks([]); frame_axes(ax, xgrid=False)
    save(fig, name)


def far_ranges():
    rows = [("Group Housing", 1.5, 1.75), ("Affordable Group Housing", 2.25, 2.25)]
    fig = plt.figure(figsize=(FULL, 1.75)); ax = fig.add_axes([.24, .26, .66, .58])
    ax.set_xlim(0, 3.2); ax.set_ylim(-.6, 1.6)
    fig.canvas.draw()
    for i, (n, lo, hi) in enumerate(rows[::-1]):
        ax.plot([0, 3.0], [i, i], color=TRACK, lw=9, solid_capstyle="butt", zorder=1)
        rbarh(ax, i, hi, .34, S1)
        if lo != hi:
            ax.plot([lo, lo], [i - .17, i + .17], color="white", lw=1.6, zorder=4)
        ax.text(hi + .05, i, f"FAR {lo:g}–{hi:g}" if lo != hi else f"FAR {hi:g}", va="center", fontsize=9, fontweight="bold", color=INK)
    ax.plot([3.0, 3.0], [-.4, 1.4], color=S3, lw=1.2)
    ax.text(3.03, 1.42, "3.0 with TDR", fontsize=8, color=MUTED, va="bottom")
    ax.set_yticks([0, 1]); ax.set_yticklabels([r[0] for r in rows[::-1]], fontsize=9.5)
    ax.set_xticks([0, .5, 1, 1.5, 2, 2.5, 3]); ax.set_xlabel("Floor area ratio", fontsize=8.5)
    frame_axes(ax)
    save(fig, "c_far.png")


def constraints():
    items = [("High-tension line", .071), ("Storm-water / water-body edge", 1.2), ("Wetland", 1.3),
             ("Sultanpur ESZ", 5.3), ("Sultanpur National Park", 5.6), ("Military area", 6.4)]
    fig = plt.figure(figsize=(FULL, 2.2)); ax = fig.add_axes([.28, .2, .64, .7])
    n = len(items); ax.set_xlim(0, 7.4); ax.set_ylim(-.6, n - .4)
    for i, (lab, km) in enumerate(items[::-1]):
        c = S2 if km < 1 else S1
        ax.plot([0, km], [i, i], color=c, lw=2, solid_capstyle="round", zorder=2)
        ax.scatter([km], [i], s=60, color=c, edgecolor="white", linewidth=2, zorder=4)
        ax.text(km + .15, i, f"{km * 1000:.0f} m" if km < 1 else f"{km:g} km", va="center", fontsize=9, color=INK, fontweight="bold")
    ax.set_yticks(range(n)); ax.set_yticklabels([r[0] for r in items[::-1]], fontsize=9.5)
    ax.set_xticks(range(0, 8)); ax.set_xlabel("Distance from the parcel boundary (km)", fontsize=8.5)
    frame_axes(ax)
    legend(ax, [(S2, "Within 1 km", "o"), (S1, "Beyond 1 km", "o")], y=1.03)
    save(fig, "c_constraints.png")


def built_meter():
    fig = plt.figure(figsize=(HALF, .9)); ax = fig.add_axes([.02, .38, .96, .3])
    ax.set_xlim(0, 100); ax.set_ylim(-.5, .5); fig.canvas.draw()
    ax.plot([0, 100], [0, 0], color="#F3E3E5", lw=11, solid_capstyle="butt")
    rbarh(ax, 0, 5.76, .62, S2)
    for t in (0, 25, 50, 75, 100):
        ax.text(t, -.75, f"{t}%", ha="left" if t == 0 else "right" if t == 100 else "center", va="top", fontsize=7.5, color=DIM)
    ax.axis("off")
    fig.text(.02, .86, "Built-up share of the parcel", fontsize=8.5, color=MUTED)
    save(fig, "c_meter.png")


# ====================================================================== IMAGE TREATMENTS
def trim_dark(im, thr=40):
    a = np.asarray(im.convert("L"))
    rows = np.where(a.mean(1) > thr)[0]; cols = np.where(a.mean(0) > thr)[0]
    return im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))


def crop_aspect(im, ratio, cx=.5, cy=.5):
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio); x = int(min(max(cx * w - nw / 2, 0), w - nw)); return im.crop((x, 0, x + nw, h))
    nh = int(w / ratio); y = int(min(max(cy * h - nh / 2, 0), h - nh)); return im.crop((0, y, w, y + nh))


def north(d, x, y, s=26):
    d.polygon([(x, y - s), (x - s * .45, y + s * .55), (x, y + s * .25), (x + s * .45, y + s * .55)], fill=(255, 255, 255, 235), outline=(14, 34, 64, 255))
    d.polygon([(x, y - s), (x, y + s * .25), (x + s * .45, y + s * .55)], fill=(14, 34, 64, 255))
    f = ImageFont.truetype(SANSB, int(s * .7)); d.text((x, y - s - 4), "N", font=f, fill=(255, 255, 255, 255), anchor="ms", stroke_width=3, stroke_fill=(14, 34, 64, 255))


def chip(d, x, y, text, size=24, fill=(14, 34, 64, 235), fg=(255, 255, 255, 255)):
    f = ImageFont.truetype(SANSB, size)
    bb = d.textbbox((0, 0), text, font=f); w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.rounded_rectangle([x, y, x + w + 2 * size * .7, y + h + size * .9], radius=6, fill=fill)
    d.text((x + size * .7, y + size * .45 - bb[1]), text, font=f, fill=fg)


def treat(src, out, width_px, ratio=None, cx=.5, cy=.5, trim=False, chip_text=None, show_north=False, grade=True, scale_text=None):
    im = Image.open(A(src)).convert("RGB")
    if trim:
        im = trim_dark(im)
    if ratio:
        im = crop_aspect(im, ratio, cx, cy)
    h = int(width_px * im.height / im.width)
    im = im.resize((width_px, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
    if grade:  # gentle, consistent grade: slightly lower saturation, lifted contrast
        im = ImageEnhance.Color(im).enhance(.88); im = ImageEnhance.Contrast(im).enhance(1.06)
    d = ImageDraw.Draw(im, "RGBA")
    u = width_px / 1600
    if chip_text:
        chip(d, int(30 * u), int(30 * u), chip_text, size=max(22, int(44 * u)))
    if show_north:
        north(d, width_px - int(70 * u), int(100 * u), s=max(22, int(46 * u)))
    if scale_text:
        f = ImageFont.truetype(SANSB, max(14, int(22 * u)))
        x0, y0 = int(30 * u), h - int(46 * u)
        d.rectangle([x0, y0, x0 + int(160 * u), y0 + int(8 * u)], fill=(255, 255, 255, 235), outline=(14, 34, 64, 255))
        d.rectangle([x0, y0, x0 + int(80 * u), y0 + int(8 * u)], fill=(14, 34, 64, 255))
        d.text((x0, y0 - int(8 * u)), scale_text, font=f, fill=(255, 255, 255, 255), anchor="ls", stroke_width=3, stroke_fill=(14, 34, 64, 255))
    # hairline frame
    d.rectangle([0, 0, width_px - 1, h - 1], outline=(201, 206, 216, 255), width=max(1, int(2 * u)))
    im.convert("RGB").save(A(out), quality=88)


def satellite_pair():
    # identical crops, identical grade, side-by-side ready; year chips and north arrows
    treat("image14.png", "f_sat2015.jpg", 1600, ratio=1.9, cx=.5, cy=.48, chip_text="2015", show_north=True)
    treat("image15.u.png", "f_sat2025.jpg", 1600, ratio=1.9, trim=True, chip_text="2025", show_north=True)


def maps():
    treat("image2.jpg", "f_ownership.jpg", 1400, ratio=1.55, show_north=False, grade=False)
    treat("image9.jpeg", "f_infra.jpg", 1600, grade=False)
    treat("image12.png", "f_upcoming.jpg", 1600, trim=True, grade=False)
    treat("image20.png", "f_landbanks.jpg", 1300, ratio=1.45, grade=False)
    treat("image25.u.png", "f_terrain.jpg", 1300, grade=False)
    treat("image26.u.png", "f_elevation.jpg", 1300, grade=False)
    treat("image27.u.jpeg", "f_structures.jpg", 1800, ratio=2.4, chip_text="Parcel boundary", show_north=True)
    treat("image1.png", "f_parcel.jpg", 1400, ratio=1.45, chip_text="Supplied boundary", show_north=True)


# ====================================================================== COVER ART (right-hand duotone strip)
def duotone(im, dark=(14, 34, 64), light=(232, 237, 245)):
    g = ImageOps.autocontrast(im.convert("L"), cutoff=1)
    return ImageOps.colorize(g, dark, light)


def cover_strip():
    W, H = 1000, 1780            # ~ 42% x 71% of an A4 page at 150 dpi
    src = Image.open(A("image1.png")).convert("RGB")
    s = max(W / src.width, H / src.height)
    big = src.resize((int(src.width * s) + 1, int(src.height * s) + 1), Image.LANCZOS)
    ox, oy = (big.width - W) // 2 + int(big.width * .06), (big.height - H) // 2
    ox = min(ox, big.width - W)
    big = big.crop((ox, oy, ox + W, oy + H))
    duo = duotone(big)
    # keep the supplied red boundary visible: lift reddish pixels from the source as crimson
    a = np.asarray(big).astype(int)
    red = (a[..., 0] > 150) & (a[..., 0] - a[..., 1] > 60) & (a[..., 0] - a[..., 2] > 60)
    mask = Image.fromarray((red * 255).astype("uint8")).filter(ImageFilter.MaxFilter(5))
    duo.paste(Image.new("RGB", duo.size, (226, 74, 84)), (0, 0), mask)
    d = ImageDraw.Draw(duo, "RGBA")
    # crimson location marker at the parcel (centre of the supplied boundary if found)
    ys, xs = np.where(red)
    cx, cy = (int(xs.mean()), int(ys.mean())) if len(xs) > 50 else (W // 2, int(H * .45))
    for r_, al in [(150, 140), (96, 190), (52, 240)]:
        d.ellipse([cx - r_, cy - r_, cx + r_, cy + r_], outline=(161, 35, 43, al), width=5)
    d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(161, 35, 43, 255), outline=(255, 255, 255, 255), width=5)
    f = ImageFont.truetype(SANSB, 30)
    chip(d, cx + 34, cy - 22, "28.4870° N   76.9620° E", size=26, fill=(255, 255, 255, 235), fg=(14, 34, 64, 255))
    north(d, W - 70, 120, s=36)
    # scale-like graticule ticks along the left edge
    for y in range(0, H, 89):
        d.line([(0, y), (18, y)], fill=(255, 255, 255, 160), width=2)
    duo.save(A("cover_strip.png"), quality=92)


if __name__ == "__main__":
    travel_dumbbell(); projects_timeline(); far_ranges(); constraints(); built_meter()
    hbars("c_built.png", [("Built-up area", 18), ("Residential property", 22), ("Commercial property", 15), ("Office cluster", 12)], width=HALF, xmax=30, label_w=.42)
    hbars("c_social.png", [("Retail activity", 20), ("Bank / ATM density", 14), ("Medical facilities", 25), ("Education facilities", 18), ("Hotel / banquet halls", 10)], width=HALF, xmax=30, label_w=.42)
    hbars("c_pop.png", [("Population", 16), ("Households", 14), ("Night-time radiance (2018–2024)", 68)], xmax=80, label_w=.3)
    hbars("c_landbanks.png", [("Prestige", 100), ("Signature Global", 78), ("Eldeco", 54), ("Godrej", 10)], width=HALF, xmax=125, unit="acres", sign="", label_w=.34)
    satellite_pair(); maps(); cover_strip()
    print("figures ok")


def cover_band():
    """full-bleed duotone band for the cover, parcel boundary in crimson"""
    src = Image.open(A("image27.u.jpeg")).convert("RGB")
    W = 2400; H = int(W / 2.45)
    s = max(W / src.width, H / src.height)
    big = src.resize((int(src.width * s) + 1, int(src.height * s) + 1), Image.LANCZOS)
    big = big.crop(((big.width - W) // 2, (big.height - H) // 2, (big.width - W) // 2 + W, (big.height - H) // 2 + H))
    a = np.asarray(big).astype(int)
    yellow = (a[..., 0] > 170) & (a[..., 1] > 130) & (a[..., 2] < 110) & (a[..., 0] - a[..., 2] > 90)
    duo = duotone(big.filter(ImageFilter.GaussianBlur(.6)), dark=(14, 34, 64), light=(226, 232, 242))
    mask = Image.fromarray((yellow * 255).astype("uint8")).filter(ImageFilter.MaxFilter(7))
    duo.paste(Image.new("RGB", duo.size, (196, 46, 56)), (0, 0), mask)
    d = ImageDraw.Draw(duo, "RGBA")
    ys, xs = np.where(yellow)
    if len(xs) > 200:
        cx, cy = int(np.median(xs)), int(np.median(ys))
        chip(d, int(xs.max()) + 40, cy + 170, "Subject parcel  ·  28.4870° N, 76.9620° E", size=34, fill=(255, 255, 255, 240), fg=(14, 34, 64, 255))
    north(d, W - 110, H - 110, s=52)
    duo.save(A("cover_band.jpg"), quality=90)


if __name__ == "__main__":
    cover_band(); print("band ok")
