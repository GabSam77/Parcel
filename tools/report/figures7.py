"""v7 figures: travel times, title chain, height envelope, buildable area. Same visual system as v5/v6."""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyBboxPatch, Polygon
from figures5 import A, save, bare, FULL, HALF, INK, TEXT, MUTED, DIM, GRID, BASE, TRACK, S1, S2, S3, S1L, S2L, OK

SER = "Lora"


# ---------------------------------------------------------------- 2.1 travel times: ranked, with time bands
def travel_times():
    rows = [("Access road", 0, "adjacent"), ("Railway station", 10, "3.9 km"), ("Highway NH-248BB", 15, "9.8 km"),
            ("IGI Airport", 31, "25.9 km"), ("Metro station", 35, "18 km"), ("Cyber City CBD", 40, "18 km")]
    fig = plt.figure(figsize=(FULL, 2.55))
    ax = fig.add_axes([.25, .13, .7, .74])
    n = len(rows); ax.set_xlim(0, 52); ax.set_ylim(-.6, n - .4)
    bands = [(0, 15, "#EEF3FA", "Within 15 min"), (15, 30, "#F6F8FB", "15–30 min"), (30, 45, "#EEF3FA", "30–45 min")]
    for a, b, c, t in bands:
        ax.add_patch(Rectangle((a, -.6), b - a, n + .2, color=c, lw=0, zorder=0))
        ax.text((a + b) / 2, n - .38, t, ha="center", va="bottom", fontsize=8, color=MUTED)
    for i, (lab, t, km) in enumerate(rows):
        y = n - 1 - i
        c = S1
        if t > 0:
            ax.plot([0, t], [y, y], color=c, lw=1.6, alpha=.35, solid_capstyle="butt", zorder=2)
        ax.plot(t if t else .35, y, "o", ms=8, color=c, mec="white", mew=1.3, zorder=4)
        ax.text((t if t else .35) + 1, y, ("adjacent" if not t else f"{t} min") , va="center", fontsize=9.5, fontweight="bold", color=INK)
        if t:
            ax.text(t + 6.4, y, f"·  {km}", va="center", fontsize=8.5, color=MUTED)
    ax.set_yticks(range(n)); ax.set_yticklabels([r[0] for r in rows][::-1], fontsize=9.5)
    for s in ["top", "right", "left", "bottom"]:
        ax.spines[s].set_visible(False)
    ax.set_xticks([0, 10, 20, 30, 40]); ax.set_xticklabels(["0", "10", "20", "30", "40 min"], fontsize=8, color=DIM)
    ax.tick_params(length=0)
    save(fig, "v7_travel_times.png")


# ---------------------------------------------------------------- 1.2 title chain: proportional timeline
def title_chain():
    ev = [(1998.45, "15 Jun 1998", "Late Ram Singh", "khatedar", "State Govt. allotment"),
          (2010.84, "02 Nov 2010", "Ram Singh & Sons HUF", "legal heirs", "Inheritance"),
          (2018.30, "20 Apr 2018", "M/s HASTA Infrastructure", "Pvt. Ltd.", "Sale")]
    now = 2026.8
    fig = plt.figure(figsize=(FULL, 1.95)); ax = fig.add_axes([.03, .05, .94, .9]); bare(ax)
    ax.set_xlim(1995.5, 2028.6); ax.set_ylim(0, 1)
    Y = .46
    ax.plot([1996, ev[-1][0]], [Y, Y], color=INK, lw=2.2, zorder=1, solid_capstyle="round")
    ax.plot([ev[-1][0], now], [Y, Y], color=S2, lw=2.2, ls=(0, (3, 2)), zorder=1)
    for yr in range(2000, 2027, 5):
        ax.plot([yr, yr], [Y - .04, Y - .015], color=DIM, lw=.8); ax.text(yr, Y - .1, str(yr), ha="center", fontsize=7.5, color=DIM)
    for x, d, who, sub, how in ev:
        ax.plot(x, Y, "o", ms=11, color=INK, mec="white", mew=2, zorder=3)
        ax.text(x, Y + .37, d, ha="center", fontsize=9, fontweight="bold", color=S2)
        ax.text(x, Y + .25, who, ha="center", fontsize=9.5, fontweight="bold", color=INK)
        ax.text(x, Y + .14, f"{sub} · {how}", ha="center", fontsize=8, color=MUTED)
    ax.plot(now, Y, "o", ms=12, mfc="white", mec=S2, mew=2.2, zorder=3)
    ax.text(now, Y + .37, "Pending", ha="center", fontsize=9, fontweight="bold", color=S2)
    ax.text(now, Y + .25, "Mutation", ha="center", fontsize=9.5, fontweight="bold", color=INK)
    ax.text(now, Y + .14, "to be verified", ha="center", fontsize=8, color=MUTED)
    # held-for spans
    spans = [(ev[0][0], ev[1][0]), (ev[1][0], ev[2][0]), (ev[2][0], now)]
    for (a, b) in spans:
        ax.annotate("", xy=(a + .3, Y - .27), xytext=(b - .3, Y - .27), arrowprops=dict(arrowstyle="<->", color=BASE, lw=.8))
        ax.text((a + b) / 2, Y - .37, f"{round(b - a)} yrs", ha="center", va="top", fontsize=8, color=MUTED)
    save(fig, "v7_title_chain.png")


# ---------------------------------------------------------------- 3.4 height envelope with a familiar reference
def height_envelope():
    fig = plt.figure(figsize=(FULL, 2.45)); ax = fig.add_axes([.02, .03, .96, .93]); bare(ax)
    ax.set_xlim(0, 10); ax.set_ylim(-36, 150)
    ax.add_patch(Rectangle((0, -36), 10, 36, color="#E9ECF1", lw=0))
    ax.plot([0, 10], [0, 0], color=BASE, lw=1)
    ax.text(.15, -31, "Ground level · 215 m above sea level", ha="left", fontsize=8.5, color=MUTED, va="center")
    # limit
    ax.plot([.1, 9.9], [130, 130], color=S2, lw=1.6, ls=(0, (5, 3)))
    ax.text(9.9, 134, "Height limit · 345 m above sea level (airport conical surface)", ha="right", fontsize=9, fontweight="bold", color=S2)
    # tower
    tx, tw = 1.6, 1.25
    ax.add_patch(Rectangle((tx, 0), tw, 130, color=S1, lw=0))
    for f in range(1, 43):
        ax.plot([tx + .08, tx + tw - .08], [f * 130 / 43] * 2, color="#5C80B8", lw=.5)
    ax.annotate("", xy=(tx - .25, 130), xytext=(tx - .25, 0), arrowprops=dict(arrowstyle="<->", color=S3, lw=1.1))
    ax.text(tx - .4, 72, "≈130 m", ha="right", fontsize=13, fontfamily=SER, color=INK, va="center")
    ax.text(tx - .4, 58, "about 43 floors", ha="right", fontsize=8.5, color=MUTED, va="center")
    ax.text(tx + tw / 2, -9, "Maximum on\nthis site", ha="center", va="top", fontsize=8, color=INK, fontweight="bold")
    # references
    def ref(x, h, w, label, sub, col="#AEB8C8", tip=None):
        if tip == "minar":
            ax.add_patch(Polygon([(x, 0), (x + w, 0), (x + w * .66, h), (x + w * .34, h)], color=col, lw=0))
        else:
            ax.add_patch(Rectangle((x, 0), w, h, color=col, lw=0))
        ax.text(x + w / 2, h + 4, f"{h:g} m", ha="center", fontsize=9, fontweight="bold", color=INK)
        ax.text(x + w / 2, -9, label, ha="center", va="top", fontsize=8, color=MUTED)
    ref(4.3, 72.5, .7, "Qutub Minar", "", tip="minar")
    ref(6.0, 45, 1.0, "15-floor\napartment block", "")
    ref(7.7, 7, .9, "Two-storey\nhouse", "")
    save(fig, "v7_height.png")


# ---------------------------------------------------------------- 3.5 buildable floor area
def buildable():
    plot = 3713
    rows = [("Group Housing", 1.5, 1.75), ("Affordable Group Housing", 2.25, 2.25), ("Either scheme with TDR", 3.0, 3.0)]
    dens = {"Group Housing": " · 300–400 PPA", "Affordable Group Housing": " · 750–900 PPA", "Either scheme with TDR": ""}
    fig = plt.figure(figsize=(FULL, 1.75)); ax = fig.add_axes([.27, .17, .63, .7])
    ax.set_xlim(0, 12500); ax.set_ylim(-.6, len(rows) - .35)
    for i, (n, lo, hi) in enumerate(rows):
        y = len(rows) - 1 - i
        col = S3 if "TDR" in n else S1
        ax.barh(y, lo * plot, height=.48, color=col, lw=0, zorder=2)
        if hi != lo:
            ax.barh(y, (hi - lo) * plot, left=lo * plot, height=.48, color="#7E9CCB", lw=0, zorder=2)
        txt = f"{lo * plot:,.0f}–{hi * plot:,.0f} m²" if hi != lo else f"{hi * plot:,.0f} m²"
        ax.text(hi * plot + 150, y + .06, txt, va="center", fontsize=10, fontweight="bold", color=INK)
        ax.text(hi * plot + 150, y - .24, "FAR " + (f"{lo:g}–{hi:g}" if hi != lo else f"{hi:.1f}" if hi == 3 else f"{hi:g}") + dens[n], va="center", fontsize=8, color=MUTED)
    ax.axvline(plot, color=S2, lw=1.1, ls=(0, (3, 2)), zorder=3)
    ax.text(plot, len(rows) - .4, "  Plot area 3,713 m²", fontsize=8, color=S2, va="bottom")
    ax.set_yticks(range(len(rows))); ax.set_yticklabels([r[0] for r in rows][::-1], fontsize=9.5)
    ax.set_xticks([0, 4000, 8000, 12000]); ax.set_xticklabels(["0", "4,000", "8,000", "12,000 m²"], fontsize=8, color=DIM)
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(BASE); ax.tick_params(length=0)
    ax.xaxis.grid(True, color=GRID, lw=.7); ax.set_axisbelow(True)
    save(fig, "v7_buildable.png")


if __name__ == "__main__":
    travel_times(); title_chain(); height_envelope(); buildable()
    print("v7 ok")
