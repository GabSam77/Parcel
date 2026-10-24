"""v5 charts: one visual language across the report.
Each figure is drawn at its printed size (7.0 in full width / 3.4 in half) so 8.5-10 pt type stays true."""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyBboxPatch
import matplotlib.dates as mdates
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda f: os.path.join(HERE, "assets", f)
INK, TEXT, MUTED, DIM = "#0E2240", "#2B3445", "#5B6676", "#8A93A3"
GRID, BASE, TRACK = "#E6E9EE", "#C9CED8", "#EEF1F5"
S1, S2, S3, DE, OK = "#2F5D9E", "#A1232B", "#B48A3C", "#B8C0CC", "#18794E"
S1L, S2L = "#C9D6EA", "#EBC9CC"
FULL, HALF, DPI = 7.0, 3.4, 250
plt.rcParams.update({"font.family": "Carlito", "font.size": 9.5, "text.color": TEXT, "hatch.linewidth": .8,
                     "axes.edgecolor": BASE, "axes.labelcolor": MUTED, "xtick.color": MUTED, "ytick.color": TEXT})


def save(fig, name):
    fig.savefig(A(name), dpi=DPI, transparent=True)
    plt.close(fig)


def bare(ax):
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks([]); ax.set_yticks([])


def rbar(ax, x0, y, w, h, color, **kw):
    ax.add_patch(Rectangle((x0, y - h / 2), w, h, color=color, lw=0, **kw))


# ---------------------------------------------------------------- 2.5 travel time savings
def travel_savings():
    rows = [("IGI Airport", 31, 22), ("Cyber City, Gurugram", 40, 28), ("Aerocity", 15, 8)]
    fig = plt.figure(figsize=(FULL, 2.35))
    ax = fig.add_axes([.0, .14, 1, .74]); bare(ax)
    X0, X1 = 2.05, 5.75          # bar region in axis units (inches)
    sc = (X1 - X0) / 45          # inches per minute
    ax.set_xlim(0, FULL); ax.set_ylim(-.55, len(rows) - .45)
    for m in range(0, 46, 10):
        x = X0 + m * sc
        ax.plot([x, x], [-.45, len(rows) - .55], color=GRID, lw=.7, zorder=0)
        ax.text(x, -.62, f"{m}", ha="center", va="top", fontsize=8, color=DIM)
    ax.text(X0 + 45 * sc, -.62, "  min", ha="left", va="top", fontsize=8, color=DIM)
    for i, (dest, t0, t1) in enumerate(rows):
        y = len(rows) - 1 - i
        ax.text(0, y + .1, dest, fontsize=10, fontweight="bold", color=INK, va="center")
        ax.text(0, y - .2, f"today {t0} min", fontsize=8.5, color=MUTED, va="center")
        rbar(ax, X0, y, t1 * sc, .36, S2, zorder=3)
        ax.add_patch(Rectangle((X0 + t1 * sc, y - .18), (t0 - t1) * sc, .36, facecolor="white", edgecolor=OK, hatch="////", lw=.9, zorder=3))
        ax.text(X0 + t1 * sc - .06, y, f"{t1}", ha="right", va="center", color="white", fontsize=9.5, fontweight="bold", zorder=4)
        ax.plot([X0 + t0 * sc] * 2, [y - .27, y + .27], color=INK, lw=1.4, zorder=4)
        ax.text(X0 + t0 * sc + .07, y, f"{t0}", va="center", fontsize=8.5, color=MUTED)
        # saving column
        ax.text(6.18, y + .02, f"−{t0 - t1}", ha="right", va="center", fontsize=17, color=OK, fontfamily="Lora")
        ax.text(6.22, y + .07, "min", ha="left", va="center", fontsize=8.5, color=OK)
        ax.text(6.22, y - .17, f"{round((t0 - t1) / t0 * 100)}% faster", ha="left", va="center", fontsize=8.5, color=MUTED)
    # legend
    ly = 1.0
    def key(x, kind, label):
        lax = fig.add_axes([x / FULL, .9, .02, .06]); bare(lax); lax.set_xlim(0, 1); lax.set_ylim(0, 1)
        if kind == "after":
            lax.add_patch(Rectangle((0, .15), 1, .7, color=S2, lw=0))
        elif kind == "saved":
            lax.add_patch(Rectangle((0, .15), 1, .7, facecolor="white", edgecolor=OK, hatch="////", lw=.9))
        else:
            lax.plot([.5, .5], [0, 1], color=INK, lw=1.4)
        fig.text((x + .2) / FULL, .93, label, va="center", fontsize=8.5, color=TEXT)
    key(X0, "after", "After upcoming projects"); key(X0 + 1.75, "saved", "Time saved"); key(X0 + 2.85, "today", "Today")
    fig.text(6.18 / FULL, .93, "Saving", ha="right", va="center", fontsize=8, color=DIM)
    save(fig, "v5_travel.png")


# ---------------------------------------------------------------- 2.4 project timeline (gantt)
def projects_gantt():
    today = date(2026, 10, 15)
    rows = [("Dwarka Expressway link", "GMDA master road to Wazirpur Chowk · ₹450 Cr", date(2027, 5, 31), date(2028, 5, 31), "+12 mo"),
            ("NH-248BB widening", "₹280 Cr", date(2026, 12, 31), date(2027, 2, 28), "+2 mo"),
            ("Daulatabad 400 kV substation", "Augmentation · ₹120 Cr", date(2026, 11, 30), date(2027, 2, 28), "+3 mo")]
    fig = plt.figure(figsize=(FULL, 2.3))
    ax = fig.add_axes([.33, .2, .64, .66])
    d = mdates.date2num
    x0, x1 = d(date(2026, 10, 1)), d(date(2028, 9, 30))
    ax.set_xlim(x0, x1); ax.set_ylim(-.6, len(rows) - .4)
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(BASE)
    ax.set_yticks([])
    qs = [date(y, m, 1) for y in (2026, 2027, 2028) for m in (1, 4, 7, 10) if date(2026, 10, 1) <= date(y, m, 1) <= date(2028, 9, 30)]
    ax.set_xticks([d(q) for q in qs])
    ax.set_xticklabels([f"Q{(q.month - 1) // 3 + 1}" + (f"\n{q.year}" if q.month == 1 or q == qs[0] else "") for q in qs], fontsize=8)
    ax.tick_params(length=0)
    ax.xaxis.grid(True, color=GRID, lw=.7); ax.set_axisbelow(True)
    for i, (n, sub, g, e, lab) in enumerate(rows):
        y = len(rows) - 1 - i
        ax.barh(y, d(g) - d(today), left=d(today), height=.38, color=S1, lw=0, zorder=3)
        ax.barh(y, d(e) - d(g), left=d(g), height=.38, facecolor=S2L, edgecolor=S2, hatch="////", lw=.8, zorder=3)
        ax.plot(d(g), y, marker="|", ms=13, mew=1.5, color=INK, zorder=4)
        ax.text(d(e) + 12, y, lab, va="center", fontsize=9, fontweight="bold", color=S2)
        fig.text(.006, (.2 + .66 * (y + .6) / len(rows)) + .03, n, fontsize=9.5, fontweight="bold", color=INK, va="center")
        fig.text(.006, (.2 + .66 * (y + .6) / len(rows)) - .045, sub, fontsize=8, color=MUTED, va="center")
    ax.axvline(d(today), color=INK, lw=1, ls=(0, (2, 2)), zorder=5)
    ax.text(d(today) + 6, len(rows) - .48, "Today", fontsize=8, color=INK, va="bottom")
    # legend
    lx = .33
    fig.patches.append(Rectangle((lx, .925), .022, .04, transform=fig.transFigure, color=S1, lw=0))
    fig.text(lx + .03, .945, "Official timeline", va="center", fontsize=8.5)
    fig.patches.append(Rectangle((lx + .17, .925), .022, .04, transform=fig.transFigure, facecolor=S2L, edgecolor=S2, hatch="////", lw=.8))
    fig.text(lx + .2, .945, "Expected delay", va="center", fontsize=8.5)
    save(fig, "v5_projects.png")


# ---------------------------------------------------------------- 5.2 land banks (half width)
def land_banks():
    rows = [("Prestige", 100), ("Signature Global", 78), ("Eldeco", 54), ("Godrej", 10)]
    fig, ax = plt.subplots(figsize=(HALF, 1.75)); fig.subplots_adjust(left=.32, right=.82, top=.97, bottom=.05)
    y = np.arange(len(rows))[::-1]
    ax.barh(y, [v for _, v in rows], height=.56, color=S1, lw=0)
    for yy, (_, v) in zip(y, rows):
        ax.text(v + 2.5, yy, f"{v} acres", va="center", fontsize=9, fontweight="bold", color=INK)
    ax.set_yticks(y); ax.set_yticklabels([n for n, _ in rows], fontsize=9.5)
    ax.set_xlim(0, 112); ax.set_xticks([])
    for s in ["top", "right", "bottom"]:
        ax.spines[s].set_visible(False)
    ax.spines["left"].set_color(BASE); ax.tick_params(length=0)
    save(fig, "v5_landbanks.png")


# ---------------------------------------------------------------- 5.4/5.5 five-year growth (two panels, one scale)
def growth_panels():
    groups = [("Built environment", S1, [("Residential property", 22), ("Built-up area", 18), ("Commercial property", 15), ("Office cluster", 12)]),
              ("Commercial & social activity", S3, [("Medical facilities", 25), ("Retail activity", 20), ("Education facilities", 18), ("Bank / ATM density", 14), ("Hotels / banquet halls", 10)])]
    fig = plt.figure(figsize=(FULL, 2.15))
    for k, (title, col, rows) in enumerate(groups):
        ax = fig.add_axes([.165 + k * .5, .1, .3, .74])
        n = len(rows); y = np.arange(n)[::-1]
        ax.set_xlim(0, 30); ax.set_ylim(-.6, 4.6)
        for s in ["top", "right", "left"]:
            ax.spines[s].set_visible(False)
        ax.spines["bottom"].set_color(BASE)
        ax.set_xticks([0, 10, 20, 30]); ax.set_xticklabels(["0", "+10%", "+20%", "+30%"], fontsize=7.5)
        ax.xaxis.grid(True, color=GRID, lw=.7); ax.set_axisbelow(True); ax.tick_params(length=0)
        yy = y + (4.6 - (n - .4)) if n < 5 else y      # top-align the shorter panel
        yy = np.arange(n)[::-1] + (5 - n)
        for v, (lab, val) in zip(yy, rows):
            ax.plot([0, val], [v, v], color=col, lw=1.6, alpha=.35, solid_capstyle="butt")
            ax.plot(val, v, "o", ms=7.5, color=col, mec="white", mew=1.2, zorder=4)
            ax.text(val + 1.1, v, f"+{val}%", va="center", fontsize=9, fontweight="bold", color=INK)
        ax.set_yticks(yy); ax.set_yticklabels([l for l, _ in rows], fontsize=9)
        fig.text(.005 + k * .5, .93, title.upper(), fontsize=8, fontweight="bold", color=col, va="center")
    save(fig, "v5_growth.png")


# ---------------------------------------------------------------- 5.6 population indicators: slope / index chart
def pop_slope():
    rows = [("Night-time radiance", 168, S2, "2018–24"), ("Population", 116, S1, "5 yrs"), ("Households", 114, S1, "5 yrs")]
    fig, ax = plt.subplots(figsize=(HALF, 2.15)); fig.subplots_adjust(left=.13, right=.58, top=.9, bottom=.13)
    ax.set_xlim(-.08, 1.08); ax.set_ylim(92, 178)
    for s in ["top", "right", "bottom"]:
        ax.spines[s].set_visible(False)
    ax.spines["left"].set_color(BASE)
    ax.set_yticks([100, 125, 150, 175]); ax.tick_params(length=0, labelsize=7.5)
    ax.yaxis.grid(True, color=GRID, lw=.7); ax.set_axisbelow(True)
    ax.set_xticks([0, 1]); ax.set_xticklabels(["Start", "Latest"], fontsize=8.5)
    offs = {"Population": 3.2, "Households": -3.2}
    for lab, v, c, per in rows:
        ax.plot([0, 1], [100, v], color=c, lw=2, solid_capstyle="round")
        ax.plot([1], [v], "o", ms=6, color=c, mec="white", mew=1.1, zorder=4)
        ty = v + offs.get(lab, 0)
        ax.text(1.09, ty, f"+{v - 100}%", va="center", fontsize=10.5, fontweight="bold", color=c, transform=ax.transData, clip_on=False)
        ax.text(1.42, ty, f"{lab}", va="center", fontsize=8.5, color=TEXT, clip_on=False)
    ax.plot([0], [100], "o", ms=6, color=INK, mec="white", mew=1.1, zorder=5)
    ax.text(-.02, 178, "Index, start = 100", fontsize=7.5, color=DIM, va="bottom", transform=ax.transData)
    save(fig, "v5_pop.png")


# ---------------------------------------------------------------- 5.7 catchment: waffles
def waffles():
    items = [(54, S1, "54 in 100", "residents are male\n(46 in 100 female)"),
             (62, S2, "≈62 in 100", "residents are\naged 25–45"),
             (38, S3, "38 in 100", "households earn over\n₹10 lakh a year")]
    fig = plt.figure(figsize=(FULL, 1.95))
    for k, (n, col, big, sub) in enumerate(items):
        ax = fig.add_axes([.005 + k * .337, .06, .14, .88]); bare(ax); ax.set_aspect("equal")
        ax.set_xlim(-.1, 10); ax.set_ylim(-.1, 10)
        for i in range(100):
            r, c = divmod(i, 10)
            ax.add_patch(FancyBboxPatch((c + .09, 9 - r + .09), .82, .82, boxstyle="round,pad=0,rounding_size=.14",
                                        color=col if i < n else TRACK, lw=0))
        fig.text(.165 + k * .337, .62, big, fontsize=16, fontfamily="Lora", color=col, va="center")
        fig.text(.165 + k * .337, .42, sub, fontsize=8.5, color=MUTED, va="top", linespacing=1.3)
    save(fig, "v5_waffles.png")


# ---------------------------------------------------------------- 6.3 built-up share: proportional squares
def built_squares():
    parcel, built = 3713, 213.7
    fig = plt.figure(figsize=(FULL, 1.75))
    ax = fig.add_axes([0, 0, 1, 1]); bare(ax); ax.set_xlim(0, FULL); ax.set_ylim(0, 1.75)
    S = 1.45; s = S * (built / parcel) ** .5
    ax.add_patch(Rectangle((.05, .15), S, S, facecolor=TRACK, edgecolor=BASE, lw=.8))
    ax.add_patch(Rectangle((.05 + S - s, .15 + S - s), s, s, facecolor=S2, lw=0))
    ax.text(1.95, .98, "5.76%", fontsize=26, fontfamily="Lora", color=S2, va="center")
    ax.text(1.97, .62, "of the parcel is built up — 213.7 m² of 3,713 m²", fontsize=9.5, color=TEXT, va="center")
    ax.text(1.97, .4, "Squares drawn to scale by area. Footprints from supplied boundary; not a survey.", fontsize=8, color=MUTED, va="center")
    save(fig, "v5_built.png")


if __name__ == "__main__":
    travel_savings(); projects_gantt(); land_banks(); growth_panels(); pop_slope(); waffles(); built_squares()
    print("v5 charts ok")
