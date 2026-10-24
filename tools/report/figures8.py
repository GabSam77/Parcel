"""v8 — one figure system for the whole report.

Every chart and every image sits in the same white card: hairline border, small rounded corners,
a caps label top-left (what is measured, in which unit), an optional legend top-right, and a
source line at the foot. Charts follow the dataviz mark specs: bars <= 24 px with a 4 px rounded
data end and square baseline, 2 px lines, >= 8 px markers with a 2 px surface ring, hairline solid
grids, values and labels in text ink (never in the series colour). Drawn at print size, 300 dpi."""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyBboxPatch, Polygon
import matplotlib.dates as mdates
from datetime import date
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda f: os.path.join(HERE, "assets", f)

# tokens
INK, TEXT, MUTED, DIM = "#0E2240", "#2B3445", "#5B6676", "#8A93A3"
BORDER, GRID, SURF = "#DDE1E7", "#ECEEF2", "#FFFFFF"
S1, S2, S3, DE = "#2F5D9E", "#A1232B", "#B48A3C", "#B8C0CC"
S1L, S1W, S2L, S3L = "#C7D5EA", "#EEF3FA", "#EAC6C9", "#EADBBE"
FULL, HALF, DPI = 7.0, 3.43, 300
PX = 1 / 96                       # one print pixel in inches
PAD = .17                         # card padding (in)
HEAD, FOOT = .34, .26             # header / footer bands (in)

plt.rcParams.update({"font.family": "Carlito", "font.size": 9, "text.color": TEXT,
                     "axes.edgecolor": BORDER, "xtick.color": MUTED, "ytick.color": TEXT, "axes.linewidth": .6})
SANS = "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf"


# ======================================================================== card scaffolding (matplotlib)
class Card:
    def __init__(self, w, h, label, source=None, legend=None):
        self.w, self.h = w, h
        self.fig = plt.figure(figsize=(w, h), dpi=DPI)
        bg = self.fig.add_axes([0, 0, 1, 1]); bg.set_xlim(0, w); bg.set_ylim(0, h); bg.axis("off")
        bg.add_patch(FancyBboxPatch((.01, .01), w - .02, h - .02, boxstyle="round,pad=0,rounding_size=.07",
                                    facecolor=SURF, edgecolor=BORDER, lw=.8))
        self.bg = bg
        bg.text(PAD, h - PAD - .02, label.upper(), fontsize=7.6, fontweight="bold", color=MUTED, va="top")
        if source:
            bg.plot([PAD, w - PAD], [FOOT + .02, FOOT + .02], color=GRID, lw=.6)
            bg.text(PAD, FOOT / 2 + .01, source, fontsize=7, color=DIM, va="center")
        if legend:
            self.legend(legend)

    def legend(self, items):
        """items: (kind, colour, text); drawn right-aligned in the header row"""
        x = self.w - PAD; y = self.h - PAD - .075
        for kind, c, t in reversed(items):
            tw = len(t) * .052 + .02
            self.bg.text(x, y, t, fontsize=7.6, color=TEXT, va="center", ha="right")
            x -= tw + .06
            if kind == "bar":
                self.bg.add_patch(Rectangle((x - .14, y - .045), .14, .09, color=c, lw=0))
            elif kind == "light":
                self.bg.add_patch(Rectangle((x - .14, y - .045), .14, .09, color=c, lw=0))
            elif kind == "dot":
                self.bg.plot(x - .06, y, "o", ms=6, color=c, mec="white", mew=1.2)
            elif kind == "line":
                self.bg.plot([x - .16, x], [y, y], color=c, lw=2, solid_capstyle="round")
            elif kind == "tick":
                self.bg.plot([x - .06, x - .06], [y - .07, y + .07], color=c, lw=1.6)
            x -= .26

    def axes(self, l=0, r=0, t=0, b=0, top=None, bottom=None, left=None, right=None):
        """content axes inside the card; margins in inches beyond padding/header/footer"""
        x0 = PAD + l; x1 = self.w - PAD - r
        y0 = (FOOT + .1 if bottom is None else bottom) + b
        y1 = self.h - (PAD + HEAD if top is None else top) - t
        if left is not None: x0 = left
        if right is not None: x1 = right
        return self.fig.add_axes([x0 / self.w, y0 / self.h, (x1 - x0) / self.w, (y1 - y0) / self.h])

    def save(self, name):
        self.fig.savefig(A(name), dpi=DPI, facecolor="white")
        plt.close(self.fig)
        Image.open(A(name)).convert("RGB").save(A(name))


def clean(ax, grid="x", ticks=True):
    for s in ax.spines.values():
        s.set_visible(False)
    ax.tick_params(length=0, labelsize=8, pad=4)
    if grid == "x":
        ax.xaxis.grid(True, color=GRID, lw=.7); ax.set_axisbelow(True)
    elif grid == "y":
        ax.yaxis.grid(True, color=GRID, lw=.7); ax.set_axisbelow(True)


def hbar(ax, y, x0, w, hpx, color, rounded=True, z=3):
    """horizontal bar: thickness in print px (<= 24), 4 px rounded data end, square baseline"""
    if w <= 0:
        return
    fig = ax.figure; bb = ax.get_window_extent()
    xr, yr = ax.get_xlim(), ax.get_ylim()
    upx = (xr[1] - xr[0]) / (bb.width / fig.dpi) * PX      # x data units per print px
    upy = (yr[1] - yr[0]) / (bb.height / fig.dpi) * PX
    h = hpx * upy
    if not rounded:
        ax.add_patch(Rectangle((x0, y - h / 2), w, h, color=color, lw=0, zorder=z)); return
    rad = min(4 * upx, w / 2)
    ax.add_patch(FancyBboxPatch((x0, y - h / 2), w, h, boxstyle=f"round,pad=0,rounding_size={rad}",
                                mutation_aspect=upy / upx, color=color, lw=0, zorder=z))
    ax.add_patch(Rectangle((x0, y - h / 2), min(rad * 1.2, w), h, color=color, lw=0, zorder=z))


def dot(ax, x, y, c, ms=8.5, z=5):
    ax.plot(x, y, "o", ms=ms, color=c, mec="white", mew=1.6, zorder=z)


# ======================================================================== 1.2 title chain
def title_chain():
    ev = [(1998.45, "15 Jun 1998", "Late Ram Singh", "Khatedar · State Govt. allotment"),
          (2010.84, "02 Nov 2010", "Ram Singh & Sons HUF", "Legal heirs · inheritance"),
          (2018.30, "20 Apr 2018", "M/s HASTA Infrastructure", "Pvt. Ltd. · purchase")]
    now = 2026.8
    c = Card(FULL, 1.9, "Ownership timeline, 1998 to today", source="Source: jamabandi and sale records in the supplied draft")
    ax = c.axes(b=.0); ax.axis("off"); ax.set_xlim(1994.2, 2028.6); ax.set_ylim(0, 1)
    Y = .36
    ax.plot([1996, ev[-1][0]], [Y, Y], color=INK, lw=2, solid_capstyle="round", zorder=1)
    ax.plot([ev[-1][0], now], [Y, Y], color=S2, lw=2, ls=(0, (2.5, 2)), zorder=1)
    for yr in range(2000, 2027, 5):
        ax.text(yr, Y - .16, str(yr), ha="center", fontsize=7.5, color=DIM)
        ax.plot([yr, yr], [Y - .06, Y - .025], color=DE, lw=.7)
    spans = [(ev[0][0], ev[1][0]), (ev[1][0], ev[2][0]), (ev[2][0], now)]
    for a, b in spans:
        ax.text((a + b) / 2, Y + .07, f"held {round(b - a)} yrs", ha="center", fontsize=7.5, color=MUTED)
    for x, d, who, sub in ev:
        dot(ax, x, Y, INK, ms=10)
        ax.text(x, Y + .58, d, ha="center", fontsize=8.5, color=MUTED)
        ax.text(x, Y + .43, who, ha="center", fontsize=9.5, fontweight="bold", color=INK)
        ax.text(x, Y + .3, sub, ha="center", fontsize=7.5, color=MUTED)
    ax.plot(now, Y, "o", ms=11, mfc="white", mec=S2, mew=2, zorder=5)
    ax.text(now, Y + .58, "Pending", ha="center", fontsize=8.5, color=MUTED)
    ax.text(now, Y + .43, "Mutation", ha="center", fontsize=9.5, fontweight="bold", color=INK)
    ax.text(now, Y + .3, "to be verified", ha="center", fontsize=7.5, color=MUTED)
    c.save("v8_title_chain.png")


# ======================================================================== 2.1 travel times
def travel_times():
    rows = [("Access road", 0, "adjacent"), ("Railway station", 10, "3.9 km"), ("Highway NH-248BB", 15, "9.8 km"),
            ("IGI Airport", 31, "25.9 km"), ("Metro station", 35, "18 km"), ("Cyber City CBD", 40, "18 km")]
    c = Card(FULL, 2.6, "Travel time from the site, minutes", source="Source: supplied draft · peak-hour drive times")
    ax = c.axes(l=1.25, r=.75, t=.18)
    n = len(rows); ax.set_xlim(0, 45); ax.set_ylim(-.6, n - .4)
    for a, b, col, t in [(0, 15, S1W, "Under 15 min"), (15, 30, "#F7F9FC", "15–30 min"), (30, 45, S1W, "30–45 min")]:
        ax.add_patch(Rectangle((a, -.6), b - a, n + .2, color=col, lw=0, zorder=0))
        ax.text((a + b) / 2, n - .32, t, ha="center", va="bottom", fontsize=7.6, color=MUTED, clip_on=False)
    for i, (lab, t, km) in enumerate(rows):
        y = n - 1 - i
        if t:
            ax.plot([0, t], [y, y], color=S1L, lw=2, solid_capstyle="butt", zorder=2)
        dot(ax, max(t, .45), y, S1)
        ax.text(max(t, .45) + 1.1, y, "adjacent" if not t else f"{t} min", va="center", fontsize=9, fontweight="bold", color=INK)
        if t:
            ax.text(46, y, km, va="center", ha="left", fontsize=8.5, color=MUTED, clip_on=False)
    ax.text(46, n - .32, "Distance", va="bottom", fontsize=7.6, color=MUTED, clip_on=False)
    ax.set_yticks(range(n)); ax.set_yticklabels([r[0] for r in rows][::-1], fontsize=9)
    ax.set_xticks([0, 10, 20, 30, 40]); clean(ax, grid=None)
    c.save("v8_travel_times.png")


# ======================================================================== 2.4 projects: official completion only
def projects():
    today = date(2026, 10, 15)
    rows = [("Dwarka Expressway link", "GMDA master road to Wazirpur Chowk", "₹450 Cr", date(2027, 5, 31)),
            ("NH-248BB widening", "Highway widening", "₹280 Cr", date(2026, 12, 31)),
            ("Daulatabad 400 kV substation", "Power augmentation", "₹120 Cr", date(2026, 11, 30))]
    c = Card(FULL, 2.25, "Upcoming projects · official completion date", source="Source: GMDA, NHAI and HVPNL timelines as cited in the supplied draft · costs indicative")
    d = mdates.date2num
    ax = c.axes(left=2.2, right=FULL - PAD - .05, t=.22)
    x0, x1 = d(date(2026, 10, 1)), d(date(2027, 9, 30))
    ax.set_xlim(x0, x1); ax.set_ylim(-.6, len(rows) - .4)
    months = [date(2026, m, 1) for m in (10, 12)] + [date(2027, m, 1) for m in (2, 4, 6, 8)]
    ax.set_xticks([d(m) for m in months]); ax.set_xticklabels([m.strftime("%b %Y" if m.month in (10,) or m == months[2] else "%b") for m in months])
    ax.set_xticklabels([("Oct 2026" if i == 0 else m.strftime("%b") + (" 2027" if m.month == 2 else "")) for i, m in enumerate(months)])
    clean(ax, grid="x")
    for i, (n, sub, cost, due) in enumerate(rows):
        y = len(rows) - 1 - i
        hbar(ax, y, d(today), d(due) - d(today), 18, S1)
        mo = round((d(due) - d(today)) / 30.4)
        ax.text(d(due) + 6, y + .1, due.strftime("%b %Y"), va="center", fontsize=9, fontweight="bold", color=INK)
        ax.text(d(due) + 6, y - .2, f"in {mo} month{'s' if mo != 1 else ''} · {cost}", va="center", fontsize=7.8, color=MUTED)
        c.bg.text(PAD, 0, "")
        yy = ax.transData.transform((0, y))[1] / DPI
        c.bg.text(PAD, yy + .07, n, fontsize=9, fontweight="bold", color=INK, va="center")
        c.bg.text(PAD, yy - .1, sub, fontsize=7.8, color=MUTED, va="center")
    ax.axvline(d(today), color=INK, lw=1, zorder=4)
    ax.text(d(today), len(rows) - .42, " Today", fontsize=7.6, color=INK, va="bottom")
    ax.set_yticks([])
    c.save("v8_projects.png")


# ======================================================================== 2.5 travel savings
def savings():
    rows = [("IGI Airport", 31, 22), ("Cyber City, Gurugram", 40, 28), ("Aerocity", 15, 8)]
    c = Card(FULL, 2.3, "Drive time, today vs after upcoming projects (min)", source="Source: projected travel times from the supplied draft · indicative",
             legend=[("bar", S2, "After projects"), ("light", S2L, "Time saved"), ("tick", INK, "Today")])
    ax = c.axes(left=1.75, right=5.85, t=.12)
    ax.set_xlim(0, 45); ax.set_ylim(-.55, len(rows) - .45)
    ax.set_xticks([0, 10, 20, 30, 40]); clean(ax, grid="x")
    for i, (n, t0, t1) in enumerate(rows):
        y = len(rows) - 1 - i
        hbar(ax, y, 0, t1, 20, S2, rounded=False)
        hbar(ax, y, t1 + .25, t0 - t1 - .25, 20, S2L)            # 2 px surface gap
        ax.plot([t0, t0], [y - .3, y + .3], color=INK, lw=1.4, zorder=5)
        ax.text(t1 - .6, y, f"{t1}", ha="right", va="center", fontsize=8.5, fontweight="bold", color="white", zorder=6)
        ax.text(t0 + .7, y, f"{t0}", va="center", fontsize=8.5, color=MUTED)
        yy = ax.transData.transform((0, y))[1] / DPI
        c.bg.text(PAD, yy + .07, n, fontsize=9, fontweight="bold", color=INK, va="center")
        c.bg.text(PAD, yy - .1, f"today {t0} min", fontsize=7.8, color=MUTED, va="center")
        c.bg.text(6.2, yy + .02, f"−{t0 - t1} min", fontsize=13, fontweight="bold", color=INK, va="center", ha="left")
        c.bg.text(6.2, yy - .17, f"{round((t0 - t1) / t0 * 100)}% faster", fontsize=7.8, color=MUTED, va="center")
    ax.set_yticks([])
    c.bg.text(6.2, ax.transData.transform((0, len(rows) - .45))[1] / DPI, "Saving", fontsize=7.6, color=MUTED, va="bottom")
    c.save("v8_savings.png")


# ======================================================================== 3.4 height envelope
def height():
    c = Card(FULL, 2.15, "Height above ground, metres", source="Source: AAI NOCAS conical surface for IGI Airport · reference heights approximate",
             legend=[("bar", S1, "Maximum on this site"), ("bar", DE, "For scale")])
    ax = c.axes(b=.18, t=.05); ax.axis("off")
    ax.set_xlim(0, 10); ax.set_ylim(-14, 145)
    ax.plot([0, 10], [0, 0], color=BORDER, lw=1)
    ax.plot([.0, 10], [130, 130], color=S2, lw=1.4, ls=(0, (4, 3)))
    ax.text(10, 133, "Height limit · 345 m above sea level (130 m above ground)", ha="right", va="bottom", fontsize=8.5, fontweight="bold", color=INK)
    tx, tw = 1.5, 1.15
    ax.add_patch(Rectangle((tx, 0), tw, 130, color=S1, lw=0))
    for f in range(1, 43):
        ax.plot([tx + .07, tx + tw - .07], [f * 130 / 43] * 2, color="#5276AE", lw=.45)
    ax.text(tx - .22, 84, "≈130 m", ha="right", fontsize=15, fontweight="bold", color=INK, va="center")
    ax.text(tx - .22, 56, "about 43 floors", ha="right", fontsize=8.5, color=MUTED, va="center")
    ax.text(tx + tw / 2, -6, "This site", ha="center", va="top", fontsize=8.5, fontweight="bold", color=INK)

    def ref(x, h, w, label, minar=False):
        if minar:
            ax.add_patch(Polygon([(x, 0), (x + w, 0), (x + w * .64, h), (x + w * .36, h)], color=DE, lw=0))
        else:
            ax.add_patch(Rectangle((x, 0), w, h, color=DE, lw=0))
        ax.text(x + w / 2, h + 3.5, f"{h:g} m", ha="center", fontsize=8.5, fontweight="bold", color=INK)
        ax.text(x + w / 2, -6, label, ha="center", va="top", fontsize=8, color=MUTED)
    ref(4.0, 72.5, .7, "Qutub Minar", minar=True)
    ref(5.8, 45, 1.0, "15-floor block")
    ref(7.6, 7, .9, "Two-storey house")
    c.save("v8_height.png")


# ======================================================================== 3.5 constraints
def constraints():
    items = [("High-tension line", .071), ("Storm-water / water-body edge", 1.2), ("Wetland", 1.3),
             ("Sultanpur ESZ", 5.3), ("Sultanpur National Park", 5.6), ("Military area", 6.4)]
    c = Card(FULL, 1.95, "Distance from the parcel boundary, km", source="Source: environmental layers in the supplied draft",
             legend=[("light", "#F3DADC", "Within 1 km")])
    ax = c.axes(l=1.85, r=.35, t=.1)
    n = len(items); ax.set_xlim(0, 7.2); ax.set_ylim(-.6, n - .4)
    ax.add_patch(Rectangle((0, -.6), 1, n + .2, color="#F7E6E8", lw=0, zorder=0))
    for i, (lab, km) in enumerate(items):
        y = n - 1 - i
        col = S2 if km < 1 else S1
        ax.plot([0, km], [y, y], color=S2L if km < 1 else S1L, lw=2, solid_capstyle="butt", zorder=2)
        dot(ax, km, y, col)
        ax.text(km + .14, y, f"{km * 1000:.0f} m" if km < 1 else f"{km:g} km", va="center", fontsize=9, fontweight="bold", color=INK)
    ax.set_yticks(range(n)); ax.set_yticklabels([r[0] for r in items][::-1], fontsize=9)
    ax.set_xticks(range(0, 8)); clean(ax, grid="x")
    c.save("v8_constraints.png")


# ======================================================================== 3.6 buildable area
def buildable():
    plot = 3713
    rows = [("Group Housing", 1.5, 1.75, "FAR 1.5–1.75 · 300–400 PPA", S1),
            ("Affordable Group Housing", 2.25, 2.25, "FAR 2.25 · 750–900 PPA", S1),
            ("Either scheme with TDR", 3.0, 3.0, "FAR 3.0 · with purchased TDR", S3)]
    c = Card(FULL, 1.95, "Permissible floor area, m²", source="Source: Haryana Building Code 2017 (amended 05.08.2024) · floor area = FAR × 3,713 m² plot",
             legend=[("bar", S1, "Current schemes"), ("bar", S3, "With TDR"), ("line", S2, "Plot area")])
    ax = c.axes(l=1.95, r=1.05, t=.12)
    ax.set_xlim(0, 12000); ax.set_ylim(-.6, len(rows) - .4)
    ax.set_xticks([0, 3000, 6000, 9000, 12000]); ax.set_xticklabels(["0", "3K", "6K", "9K", "12K"])
    clean(ax, grid="x")
    for i, (n, lo, hi, sub, col) in enumerate(rows):
        y = len(rows) - 1 - i
        if hi != lo:
            hbar(ax, y, 0, lo * plot, 20, col, rounded=False)
            hbar(ax, y, lo * plot + 25, (hi - lo) * plot - 25, 20, "#7C9BCB")
        else:
            hbar(ax, y, 0, hi * plot, 20, col)
        txt = f"{lo * plot:,.0f}–{hi * plot:,.0f}" if hi != lo else f"{hi * plot:,.0f}"
        ax.text(hi * plot + 160, y, txt + " m²", va="center", fontsize=9.5, fontweight="bold", color=INK)
        yy = ax.transData.transform((0, y))[1] / DPI
        c.bg.text(PAD, yy + .07, n, fontsize=9, color=INK, va="center")
        c.bg.text(PAD, yy - .1, sub, fontsize=7.6, color=MUTED, va="center")
    ax.axvline(plot, color=S2, lw=1.4, zorder=6)
    ax.set_yticks([])
    c.save("v8_buildable.png")


# ======================================================================== 5.2 land banks (half)
def land_banks():
    rows = [("Prestige", 100), ("Signature Global", 78), ("Eldeco", 54), ("Godrej", 10)]
    c = Card(HALF, 2.45, "Land bank within 10 km, acres", source="Source: developer disclosures in the supplied draft")
    ax = c.axes(l=1.05, r=.55, t=.05)
    ax.set_xlim(0, 100); ax.set_ylim(-.6, len(rows) - .4)
    for i, (n, v) in enumerate(rows):
        y = len(rows) - 1 - i
        hbar(ax, y, 0, v, 20, S1)
        ax.text(v + 2.5, y, f"{v}", va="center", fontsize=9.5, fontweight="bold", color=INK)
    ax.set_yticks(range(len(rows))); ax.set_yticklabels([r[0] for r in rows][::-1], fontsize=9)
    ax.set_xticks([]); clean(ax, grid=None)
    c.save("v8_landbanks.png")


# ======================================================================== 5.4 growth (two panels)
def growth():
    groups = [("Built environment", S1, [("Residential property", 22), ("Built-up area", 18), ("Commercial property", 15), ("Office cluster", 12)]),
              ("Commercial & social activity", S3, [("Medical facilities", 25), ("Retail activity", 20), ("Education facilities", 18), ("Bank / ATM density", 14), ("Hotels / banquet halls", 10)])]
    c = Card(FULL, 2.3, "Five-year growth within 5 km, %", source="Source: supplied draft · 2021–2026",
             legend=[("dot", S1, "Built environment"), ("dot", S3, "Commercial & social")])
    for k, (title, col, rows) in enumerate(groups):
        ax = c.axes(left=1.55 + k * 3.42, right=3.25 + k * 3.42, t=.1)
        n = len(rows); ax.set_xlim(0, 30); ax.set_ylim(-.6, 4.6)
        ax.set_xticks([0, 10, 20, 30]); ax.set_xticklabels(["0", "+10", "+20", "+30%"])
        clean(ax, grid="x")
        ys = np.arange(n)[::-1] + (5 - n)
        for y, (lab, v) in zip(ys, rows):
            ax.plot([0, v], [y, y], color=S1L if col == S1 else S3L, lw=2, solid_capstyle="butt", zorder=2)
            dot(ax, v, y, col)
            ax.text(v + 1.2, y, f"+{v}%", va="center", fontsize=8.8, fontweight="bold", color=INK)
        ax.set_yticks(ys); ax.set_yticklabels([l for l, _ in rows], fontsize=8.6)
    c.save("v8_growth.png")


# ======================================================================== 5.5 population index (half)
def pop():
    rows = [("Night-time radiance", 168, S2), ("Population", 116, S1), ("Households", 114, S3)]
    c = Card(HALF, 2.15, "Growth index, start = 100", source="Source: VIIRS 2018–24; population estimates")
    ax = c.axes(l=.28, r=1.5, t=.08, b=.12)
    ax.set_xlim(-.05, 1.05); ax.set_ylim(90, 182)
    ax.set_yticks([100, 125, 150, 175]); ax.set_xticks([0, 1]); ax.set_xticklabels(["Start", "Latest"])
    clean(ax, grid="y")
    offs = {"Population": 5, "Households": -5}
    for lab, v, col in rows:
        ax.plot([0, 1], [100, v], color=col, lw=2, solid_capstyle="round", zorder=3)
        dot(ax, 1, v, col, ms=8)
        ty = v + offs.get(lab, 0)
        ax.plot([1.08, 1.16], [ty, ty], color=col, lw=2, clip_on=False)
        ax.text(1.2, ty, f"+{v - 100}%", va="center", fontsize=9.5, fontweight="bold", color=INK, clip_on=False)
        ax.text(1.5, ty, lab.replace("Night-time radiance", "Night light"), va="center", fontsize=8, color=MUTED, clip_on=False)
    dot(ax, 0, 100, INK, ms=8)
    c.save("v8_pop.png")


# ======================================================================== 5.6 catchment waffles
def waffles():
    items = [(54, S1, "54", "residents are male", "46 of 100 are female"),
             (62, S2, "≈62", "residents are 25–45", "years of age"),
             (38, S3, "38", "households earn", "over ₹10 lakh a year")]
    c = Card(FULL, 1.85, "Catchment profile, out of every 100", source="Source: supplied draft · indicative")
    for k, (n, col, big, l1, l2) in enumerate(items):
        x0 = PAD + k * 2.25
        ax = c.fig.add_axes([x0 / FULL, .36 / 1.85, .9 / FULL, .9 / 1.85]); ax.axis("off"); ax.set_aspect("equal")
        ax.set_xlim(0, 10); ax.set_ylim(0, 10)
        for i in range(100):
            r, cc = divmod(i, 10)
            ax.add_patch(FancyBboxPatch((cc + .1, 9 - r + .1), .8, .8, boxstyle="round,pad=0,rounding_size=.15",
                                        color=col if i < n else "#ECEFF3", lw=0))
        c.bg.text(x0 + 1.05, 1.02, big, fontsize=22, fontweight="bold", color=INK, va="center")
        c.bg.text(x0 + 1.05, .72, l1, fontsize=8.4, color=TEXT, va="center")
        c.bg.text(x0 + 1.05, .55, l2, fontsize=7.8, color=MUTED, va="center")
    # wrap long lines by hand
    c.save("v8_waffles.png")


# ======================================================================== 6.1 seismic scale (half)
def seismic():
    zones = [("II", "Low", "#E7EBF2"), ("III", "Moderate", "#C9D1DE"), ("IV", "High", S2), ("V", "Very high", "#6E1218")]
    c = Card(HALF, 1.45, "BIS seismic zone (IS 1893:2016)", source="Source: Bureau of Indian Standards")
    g = .06; bw = (HALF - 2 * PAD - 3 * g) / 4; bh = .42; y0 = FOOT + .17
    for i, (z, t, col) in enumerate(zones):
        x = PAD + i * (bw + g)
        c.bg.add_patch(FancyBboxPatch((x, y0), bw, bh, boxstyle="round,pad=0,rounding_size=.04", color=col, lw=0))
        fg = "white" if i >= 2 else INK
        c.bg.text(x + bw / 2, y0 + bh * .64, f"Zone {z}", ha="center", va="center", fontsize=9, fontweight="bold", color=fg)
        c.bg.text(x + bw / 2, y0 + bh * .28, t, ha="center", va="center", fontsize=7.6, color=fg if i >= 2 else MUTED)
    x = PAD + 2 * (bw + g) + bw / 2
    c.bg.add_patch(Polygon([(x, y0 + bh + .03), (x - .06, y0 + bh + .12), (x + .06, y0 + bh + .12)], color=INK, lw=0))
    c.bg.text(x, y0 + bh + .15, "This site", ha="center", va="bottom", fontsize=8.5, fontweight="bold", color=INK)
    c.save("v8_seismic.png")


# ======================================================================== 6.2 terrain
def terrain():
    prof = [914, 913.9, 913.85, 913.7, 913.6, 913.58, 913.57, 913.53, 913.47, 913.45, 913.4, 913.25, 913.1, 912.95, 912.8,
            912.6, 912.45, 912.3, 912.22, 912.15, 912.1, 912.05, 912.02, 912.0, 912.0, 912.05, 912.08, 912.1, 912.2]
    rel = np.array(prof) - prof[0]
    c = Card(FULL, 1.8, "Elevation profile, m relative to west edge", source="Source: redrawn from the supplied terrain analysis")
    c.bg.text(4.75, c.h - PAD - .02, "SLOPE, SHARE OF PARCEL AREA", fontsize=7.6, fontweight="bold", color=MUTED, va="top")
    ax = c.axes(left=.62, right=4.3, t=.1, b=.18)
    x = np.linspace(0, 1, len(rel))
    ax.fill_between(x, rel, -2.4, color=S1, alpha=.1, lw=0)
    ax.plot(x, rel, color=S1, lw=2, solid_capstyle="round")
    ax.set_xlim(0, 1); ax.set_ylim(-2.4, .3)
    ax.set_xticks([0, 1]); ax.set_xticklabels(["West edge", "East edge"])
    ax.set_yticks([0, -1, -2]); ax.set_yticklabels(["0", "−1", "−2"])
    clean(ax, grid="y")
    ax.text(.55, -.5, "≈2 m fall, west to east", fontsize=8.5, color=INK, fontweight="bold")
    bx = c.axes(left=5.4, right=FULL - PAD - .45, t=.15, b=.18)
    vals = [("0–2°", 62), ("2–5°", 38)]
    bx.set_xlim(0, 70); bx.set_ylim(-.6, 1.6)
    for y, (l, v) in zip([1, 0], vals):
        hbar(bx, y, 0, v, 22, S1 if y else "#7C9BCB")
        bx.text(v + 2, y, f"{v}%", va="center", fontsize=9.5, fontweight="bold", color=INK)
    bx.set_yticks([1, 0]); bx.set_yticklabels([l for l, _ in vals], fontsize=9); bx.set_xticks([])
    clean(bx, grid=None)
    c.save("v8_terrain.png")


# ======================================================================== 6.3 built-up squares
def built():
    parcel, b = 3713, 213.7
    c = Card(FULL, 1.75, "Built-up share of the parcel, drawn to scale by area", source="Source: footprints from the supplied boundary · not a survey",
             legend=[("bar", "#E9EDF3", "Parcel 3,713 m²"), ("bar", S2, "Built up 213.7 m²")])
    S = 1.05; s = S * (b / parcel) ** .5
    x0, y0 = PAD + .05, FOOT + .14
    c.bg.add_patch(Rectangle((x0, y0), S, S, facecolor="#E9EDF3", edgecolor=DE, lw=.6))
    c.bg.add_patch(Rectangle((x0 + S - s, y0 + S - s), s, s, facecolor=S2, lw=0))
    c.bg.text(x0 + S + .35, y0 + S * .62, "5.76%", fontsize=24, fontweight="bold", color=INK, va="center")
    c.bg.text(x0 + S + .37, y0 + S * .25, "of the parcel is built up: 3 structures, 213.7 m² of 3,713 m², one crossing the boundary",
              fontsize=8.8, color=TEXT, va="center")
    c.save("v8_built.png")


# ======================================================================== image cards (PIL)
K = 3                                   # pixels per print px (output 288 dpi)
def _font(pt, bold=False):
    return ImageFont.truetype(SANSB if bold else SANS, int(pt * 4 / 3 * K))


def image_card(src, out, width_px, label, source, img=None, aspect=None):
    """put any image in the standard card: label above, hairline border, rounded corners, source below"""
    W = width_px * K
    pad = int(PAD * 96 * K); head = int(.3 * 96 * K); foot = int(.26 * 96 * K)
    im = img if img is not None else Image.open(A(src)).convert("RGB")
    iw = W - 2 * pad
    if aspect:
        th = int(iw / aspect)
        s = max(iw / im.width, th / im.height)
        im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
        l = (im.width - iw) // 2; t = (im.height - th) // 2
        im = im.crop((l, t, l + iw, t + th))
    else:
        im = im.resize((iw, int(im.height * iw / im.width)), Image.LANCZOS)
    H = pad + head + im.height + foot + int(pad * .35)
    card = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(card)
    d.rounded_rectangle([1, 1, W - 2, H - 2], radius=int(7 * K), fill="white", outline=BORDER, width=max(2, K))
    d.text((pad, pad - int(2 * K)), label.upper(), font=_font(7.6, True), fill=MUTED)
    m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=int(4 * K), fill=255)
    card.paste(im, (pad, pad + head), m)
    ImageDraw.Draw(card).rounded_rectangle([pad, pad + head, pad + im.width - 1, pad + head + im.height - 1], radius=int(4 * K), outline="#E6E9EE", width=K)
    y = pad + head + im.height + int(foot * .28)
    d.text((pad, y), source, font=_font(7), fill=DIM)
    card.save(A(out), quality=90)
    return card.size


def satellite_card():
    """overview + three then-and-now pairs in one card"""
    ov = Image.open(A("f_sat_overview.jpg")).convert("RGB")
    pairs = [Image.open(A(f"f_sat_pair{i}.jpg")).convert("RGB") for i in (1, 2, 3)]
    W = 672 * K; pad = int(PAD * 96 * K); iw = W - 2 * pad; gap = int(10 * K)
    ov = ov.resize((iw, int(ov.height * iw / ov.width)), Image.LANCZOS)
    pw = (iw - 2 * gap) // 3
    pairs = [p.resize((pw, int(p.height * pw / p.width)), Image.LANCZOS) for p in pairs]
    titles = [("1", "Farmland to apartment blocks"), ("2", "Riverside land to housing complexes"), ("3", "Fields to a new residential grid")]
    head = int(.3 * 96 * K); cap = int(.34 * 96 * K); foot = int(.26 * 96 * K)
    H = pad + head + ov.height + gap * 2 + pairs[0].height + cap + foot
    card = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(card)
    d.rounded_rectangle([1, 1, W - 2, H - 2], radius=int(7 * K), fill="white", outline=BORDER, width=max(2, K))
    d.text((pad, pad - 2 * K), "2025 VIEW OF THE AREA  ·  THREE PLACES THAT CHANGED, 2015 VS 2025", font=_font(7.6, True), fill=MUTED)
    def paste_r(im, x, y):
        m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=4 * K, fill=255)
        card.paste(im, (x, y), m)
    y = pad + head; paste_r(ov, pad, y); y += ov.height + gap * 2
    for i, p in enumerate(pairs):
        x = pad + i * (pw + gap); paste_r(p, x, y)
        n, t = titles[i]
        cy = y + p.height + int(cap * .22)
        r = int(9 * K); d.ellipse([x, cy, x + 2 * r, cy + 2 * r], fill=S2)
        f = _font(8, True); tw = d.textlength(n, font=f); d.text((x + r - tw / 2, cy + r * .28), n, font=f, fill="white")
        d.text((x + 2 * r + 6 * K, cy + r * .2), t, font=_font(8.6, True), fill=INK)
    y += pairs[0].height + cap
    d.text((pad, y + int(foot * .2)), "Source: supplied 2015 and 2025 satellite imagery, aligned to the same ground frame and compared automatically · indicative",
           font=_font(7), fill=DIM)
    card.save(A("v8_satellite.jpg"), quality=90)


def image_cards():
    image_card("f_es_parcel.jpg", "v8_es_parcel.jpg", 330, "Subject parcel", "Source: supplied boundary on satellite base", aspect=1.4)
    image_card("f_ownership.jpg", "v8_ownership.jpg", 370, "Ownership and neighbouring surveys", "Source: supplied survey map", aspect=1.55)
    image_card("f_vastu.jpg", "v8_vastu.jpg", 210, "Site orientation", "Source: supplied Vastu survey", aspect=.78)
    image_card("f_infra.jpg", "v8_infra.jpg", 672, "Infrastructure around the site", "Source: supplied infrastructure map with key distances")
    image_card("f_upcoming.jpg", "v8_upcoming.jpg", 672, "Upcoming road, rail and power projects", "Source: supplied upcoming infrastructure map")
    image_card("f_landbanks.jpg", "v8_landbanks_map.jpg", 329, "Developer land parcels within 10 km", "Source: supplied land bank map", aspect=1.32)
    image_card("f_terrain6.jpg", "v8_terrain_map.jpg", 330, "Contours and surface flow paths", "Source: supplied terrain map", aspect=2.05)
    image_card("f_structures6.jpg", "v8_structures.jpg", 672, "Parcel boundary and structures", "Source: supplied satellite view · structure footprints not annotated", aspect=2.25)
    satellite_card()


if __name__ == "__main__":
    title_chain(); travel_times(); projects(); savings(); height(); constraints(); buildable()
    land_banks(); growth(); pop(); waffles(); seismic(); terrain(); built(); image_cards()
    print("v8 ok")
