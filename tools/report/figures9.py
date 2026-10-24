"""v9: travel times (distance above), projects without cost, and redesigned 3.4 / 3.5 / 3.6 figures."""
import numpy as np
import matplotlib.dates as mdates
from datetime import date
from matplotlib.patches import Rectangle, FancyBboxPatch, Polygon
from figures8 import (Card, clean, hbar, dot, A, DPI, FULL, HALF, PAD, FOOT, INK, TEXT, MUTED, DIM, BORDER, GRID,
                      S1, S2, S3, DE, S1L, S1W, S2L, S3L)

OKC = "#18794E"


# ------------------------------------------------------------------ 2.1 travel times: distance above each marker
def travel_times():
    rows = [("Access road", 0, "adjacent"), ("Railway station", 10, "3.9 km"), ("Highway NH-248BB", 15, "9.8 km"),
            ("IGI Airport", 31, "25.9 km"), ("Metro station", 35, "18 km"), ("Cyber City CBD", 40, "18 km")]
    c = Card(FULL, 2.85, "Travel time from the site, minutes · distance shown above each point",
             source="Source: supplied draft · peak-hour drive times")
    ax = c.axes(l=1.25, r=.2, t=.2)
    n = len(rows); ax.set_xlim(0, 45); ax.set_ylim(-.6, n - .35)
    for a, b, col, t in [(0, 15, S1W, "Under 15 min"), (15, 30, "#F7F9FC", "15–30 min"), (30, 45, S1W, "30–45 min")]:
        ax.add_patch(Rectangle((a, -.6), b - a, n + .25, color=col, lw=0, zorder=0))
        ax.text((a + b) / 2, n - .3, t, ha="center", va="bottom", fontsize=7.6, color=MUTED, clip_on=False)
    for i, (lab, t, km) in enumerate(rows):
        y = n - 1 - i
        x = max(t, .45)
        if t:
            ax.plot([0, t], [y, y], color=S1L, lw=2, solid_capstyle="butt", zorder=2)
        dot(ax, x, y, S1)
        if t: ax.text(x, y + .3, km, ha="center", va="bottom", fontsize=7.6, color=MUTED, zorder=6)
        ax.text(x + 1.1, y, "adjacent" if not t else f"{t} min", va="center", fontsize=9, fontweight="bold", color=INK)
    ax.set_yticks(range(n)); ax.set_yticklabels([r[0] for r in rows][::-1], fontsize=9)
    ax.set_xticks([0, 10, 20, 30, 40]); ax.set_xticklabels(["0", "10", "20", "30", "40 min"]); clean(ax, grid=None)
    c.save("v9_travel_times.png")


# ------------------------------------------------------------------ 2.4 projects: completion date only, no cost
def projects():
    today = date(2026, 10, 15)
    rows = [("Dwarka Expressway link", "GMDA master road to Wazirpur Chowk", date(2027, 5, 31)),
            ("NH-248BB widening", "Highway widening", date(2026, 12, 31)),
            ("Daulatabad 400 kV substation", "Power augmentation", date(2026, 11, 30))]
    c = Card(FULL, 2.2, "Upcoming projects · official completion date", source="Source: GMDA, NHAI and HVPNL timelines as cited in the supplied draft")
    d = mdates.date2num
    ax = c.axes(left=2.2, right=FULL - PAD - .05, t=.22)
    ax.set_xlim(d(date(2026, 10, 1)), d(date(2027, 9, 30))); ax.set_ylim(-.6, len(rows) - .4)
    months = [date(2026, 10, 1), date(2026, 12, 1), date(2027, 2, 1), date(2027, 4, 1), date(2027, 6, 1), date(2027, 8, 1)]
    ax.set_xticks([d(m) for m in months])
    ax.set_xticklabels(["Oct 2026", "Dec", "Feb 2027", "Apr", "Jun", "Aug"])
    clean(ax, grid="x"); ax.set_yticks([])
    for i, (n, sub, due) in enumerate(rows):
        y = len(rows) - 1 - i
        hbar(ax, y, d(today), d(due) - d(today), 18, S1)
        mo = round((d(due) - d(today)) / 30.4)
        ax.text(d(due) + 6, y + .1, due.strftime("%b %Y"), va="center", fontsize=9, fontweight="bold", color=INK)
        ax.text(d(due) + 6, y - .2, f"in {mo} month{'s' if mo != 1 else ''}", va="center", fontsize=7.8, color=MUTED)
        yy = ax.transData.transform((0, y))[1] / DPI
        c.bg.text(PAD, yy + .07, n, fontsize=9, fontweight="bold", color=INK, va="center")
        c.bg.text(PAD, yy - .1, sub, fontsize=7.8, color=MUTED, va="center")
    ax.axvline(d(today), color=INK, lw=1, zorder=4)
    ax.text(d(today), len(rows) - .42, " Today", fontsize=7.6, color=INK, va="bottom")
    c.save("v9_projects.png")


# ------------------------------------------------------------------ 3.4 height: a measured elevation drawing
def height():
    c = Card(FULL, 3.4, "Permissible height on this site, metres above ground",
             source="Source: AAI NOCAS conical surface for IGI Airport · reference heights approximate",
             legend=[("bar", S1, "Maximum on this site"), ("bar", DE, "For scale")])
    ax = c.axes(left=.62, right=FULL - PAD - .05, t=.12, b=.22)
    ax.set_xlim(0, 10); ax.set_ylim(0, 150)
    # scale on the left: metres above ground, with AMSL alongside
    for m in (0, 50, 100, 130):
        ax.plot([0, 10], [m, m], color=GRID if m not in (0, 130) else BORDER, lw=.7, zorder=0)
        c.bg.text(.58, ax.transData.transform((0, m))[1] / DPI, f"{m} m", ha="right", va="center", fontsize=7.6, color=MUTED)
    ax.set_xticks([]); ax.set_yticks([]); [s.set_visible(False) for s in ax.spines.values()]
    # limit band
    ax.add_patch(Rectangle((0, 130), 10, 20, color="#F7E6E8", lw=0, zorder=0))
    ax.plot([0, 10], [130, 130], color=S2, lw=1.6, zorder=3)
    ax.text(9.95, 139, "No-build zone above the airport height limit · 345 m above sea level", ha="right", va="center", fontsize=8.2, color=S2, fontweight="bold")
    # tower: floors as separated bands (2 px surface gap)
    tx, tw, fl = .55, 1.25, 130 / 43
    for f in range(43):
        ax.add_patch(Rectangle((tx, f * fl + .35), tw, fl - .7, color=S1, lw=0, zorder=2))
    ax.annotate("", xy=(tx + tw + .22, 130), xytext=(tx + tw + .22, 0), arrowprops=dict(arrowstyle="<->", color=INK, lw=1))
    ax.text(tx + tw + .38, 80, "≈130 m", fontsize=14, fontweight="bold", color=INK, va="center")
    ax.text(tx + tw + .38, 66, "about 43 floors", fontsize=8.5, color=MUTED, va="center")
    ax.text(tx + tw + .38, 54, "ground 215 m above sea level", fontsize=7.6, color=DIM, va="center")
    # references
    def ref(x, h, w, label, minar=False):
        if minar:
            ax.add_patch(Polygon([(x, 0), (x + w, 0), (x + w * .66, h), (x + w * .34, h)], color=DE, lw=0, zorder=2))
        else:
            ax.add_patch(Rectangle((x, 0), w, h, color=DE, lw=0, zorder=2))
        ax.text(x + w / 2, h + 3, f"{h:g} m", ha="center", va="bottom", fontsize=8.5, fontweight="bold", color=INK)
        ax.text(x + w / 2, -5, label, ha="center", va="top", fontsize=8, color=MUTED, clip_on=False)
    ref(4.6, 72.5, .62, "Qutub Minar", minar=True)
    ref(6.3, 45, .95, "15-floor block")
    ref(8.1, 7, .95, "Two-storey house")
    ax.text(tx + tw / 2, -5, "This site", ha="center", va="top", fontsize=8.5, fontweight="bold", color=INK, clip_on=False)
    c.save("v9_height.png")


# ------------------------------------------------------------------ 3.5 restrictions: log distance scale + status
def constraints():
    items = [("High-tension line", .071), ("Storm-water / water-body edge", 1.2), ("Wetland", 1.3),
             ("Sultanpur Eco-Sensitive Zone", 5.3), ("Sultanpur National Park", 5.6), ("Military area", 6.4)]
    c = Card(FULL, 2.75, "Distance from the parcel boundary (log scale)", source="Source: environmental layers in the supplied draft")
    ax = c.axes(left=2.05, right=5.55, t=.1)
    n = len(items); ax.set_xscale("log"); ax.set_xlim(.05, 10); ax.set_ylim(-.6, n - .4)
    ax.add_patch(Rectangle((.05, -.6), .95, n + .2, color="#F7E6E8", lw=0, zorder=0))
    ax.text(.22, n - .45, "within 1 km", ha="center", va="bottom", fontsize=7.4, color=S2, clip_on=False)
    ax.set_xticks([.1, .5, 1, 5, 10]); ax.set_xticklabels(["100 m", "500 m", "1 km", "5 km", "10 km"])
    ax.minorticks_off(); clean(ax, grid="x"); ax.set_yticks([])
    c.bg.text(5.75, ax.transData.transform((0, n - .4))[1] / DPI + .02, "DISTANCE", fontsize=7.4, fontweight="bold", color=MUTED, va="bottom")
    c.bg.text(6.35, ax.transData.transform((0, n - .4))[1] / DPI + .02, "STATUS", fontsize=7.4, fontweight="bold", color=MUTED, va="bottom")
    for i, (lab, km) in enumerate(items):
        y = n - 1 - i
        near = km < 1
        col = S2 if near else S1
        ax.plot([.05, km], [y, y], color=S2L if near else S1L, lw=2, solid_capstyle="butt", zorder=2)
        dot(ax, km, y, col)
        yy = ax.transData.transform((0, y))[1] / DPI
        c.bg.text(PAD, yy, lab, fontsize=9, color=INK, va="center")
        c.bg.text(5.75, yy, f"{km * 1000:.0f} m" if near else f"{km:g} km", fontsize=9, fontweight="bold", color=INK, va="center")
        pill_c, pill_t, pill_bg = (S2, "Review", "#F7E6E8") if near else (OKC, "Clear", "#E3F3EA")
        c.bg.add_patch(FancyBboxPatch((6.35, yy - .075), .46, .15, boxstyle="round,pad=0,rounding_size=.04", color=pill_bg, lw=0))
        c.bg.text(6.58, yy, pill_t, fontsize=7.6, fontweight="bold", color=pill_c, va="center", ha="center")
    c.save("v9_constraints.png")


# ------------------------------------------------------------------ 3.6 buildable: FAR as multiples of the plot
def buildable():
    plot = 3713
    rows = [("Group Housing", 1.5, 1.75, "300–400 PPA", S1), ("Affordable Group Housing", 2.25, 2.25, "750–900 PPA", S1),
            ("Either scheme with TDR", 3.0, 3.0, "with purchased TDR", S3)]
    c = Card(FULL, 3.05, "Buildable floor area · each square = the 3,713 m² plot",
             source="Source: Haryana Building Code 2017 (amended 05.08.2024) · floor area = FAR × plot area",
             legend=[("bar", S1, "Current schemes"), ("bar", S3, "With TDR"), ("light", S1L, "Upper end of range")])
    sq, gap = .56, .08
    x0 = 2.3
    top = c.h - PAD - .5
    for i, (n, lo, hi, dens, col) in enumerate(rows):
        yc = top - i * (sq + .18) - sq / 2
        c.bg.text(PAD, yc + .08, n, fontsize=9, fontweight="bold", color=INK, va="center")
        c.bg.text(PAD, yc - .1, (f"FAR {lo:g}–{hi:g}" if hi != lo else "FAR 3.0" if hi == 3 else f"FAR {hi:g}") + " · " + dens,
                  fontsize=7.6, color=MUTED, va="center")
        for k in range(3):
            x = x0 + k * (sq + gap)
            c.bg.add_patch(Rectangle((x, yc - sq / 2), sq, sq, facecolor="#F1F3F7", edgecolor="#E1E5EC", lw=.6))
            f_lo = min(max(lo - k, 0), 1); f_hi = min(max(hi - k, 0), 1)
            if f_hi > f_lo:
                c.bg.add_patch(Rectangle((x, yc - sq / 2), sq * f_hi, sq, color=S1L, lw=0))
            if f_lo > 0:
                c.bg.add_patch(Rectangle((x, yc - sq / 2), sq * f_lo, sq, color=col, lw=0))
        xv = x0 + 3 * (sq + gap) + .2
        txt = f"{lo * plot:,.0f}–{hi * plot:,.0f} m²" if hi != lo else f"{hi * plot:,.0f} m²"
        c.bg.text(xv, yc + .06, txt, fontsize=12, fontweight="bold", color=INK, va="center")
        c.bg.text(xv, yc - .13, f"{lo:g}" + (f"–{hi:g}" if hi != lo else "") + " × the plot area", fontsize=7.8, color=MUTED, va="center")
    c.save("v9_buildable.png")


if __name__ == "__main__":
    travel_times(); projects(); height(); constraints(); buildable()
    print("v9 ok")
