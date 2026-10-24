"""v10: travel chart with distance lines on a km axis (top) and time as its own column; 3.4 height explained as a sum."""
import numpy as np
from matplotlib.patches import Rectangle, FancyBboxPatch, Polygon
from figures8 import (Card, clean, hbar, dot, A, DPI, FULL, PAD, FOOT, INK, TEXT, MUTED, DIM, BORDER, GRID,
                      S1, S2, S3, DE, S1L, S1W, S2L)


# ------------------------------------------------------------------ 2.1 distance on the lines (km axis on top), time as a column
def travel():
    rows = [("Access road", 0.2, "adjacent"), ("Railway station", 3.9, "10 min"), ("Highway NH-248BB", 9.8, "15 min"),
            ("IGI Airport", 25.9, "31 min"), ("Metro station", 18, "35 min"), ("Cyber City CBD", 18, "40 min")]
    c = Card(FULL, 2.75, "Distance and drive time from the site", source="Source: supplied draft · road distance; peak-hour drive times")
    ax = c.axes(left=2.75, right=FULL - PAD - .55, t=.32, b=.0)
    n = len(rows); ax.set_xlim(0, 30); ax.set_ylim(-.55, n - .45)
    ax.xaxis.tick_top(); ax.set_xticks([0, 5, 10, 15, 20, 25, 30])
    ax.set_xticklabels(["0", "5", "10", "15", "20", "25", "30 km"]); clean(ax, grid="x")
    ax.tick_params(axis="x", labeltop=True, labelbottom=False, pad=3)
    ax.set_yticks([])
    top = ax.transData.transform((0, n - .45))[1] / DPI
    c.bg.text(PAD, top + .1, "DESTINATION", fontsize=7.4, fontweight="bold", color=MUTED, va="bottom")
    c.bg.text(2.05, top + .1, "DRIVE TIME", fontsize=7.4, fontweight="bold", color=MUTED, va="bottom")
    c.bg.text(2.75, top + .3, "ROAD DISTANCE", fontsize=7.4, fontweight="bold", color=MUTED, va="bottom")
    for i, (lab, km, t) in enumerate(rows):
        y = n - 1 - i
        yy = ax.transData.transform((0, y))[1] / DPI
        if i:
            c.bg.plot([PAD, FULL - PAD], [yy + .17, yy + .17], color=GRID, lw=.6)
        c.bg.text(PAD, yy, lab, fontsize=9, color=INK, va="center")
        c.bg.text(2.05, yy, t, fontsize=9.5, fontweight="bold", color=INK, va="center")
        ax.plot([0, km], [y, y], color=S1L, lw=2.2, solid_capstyle="butt", zorder=2)
        dot(ax, km, y, S1)
        if km >= 1: ax.text(km + .55, y, f"{km:g} km", va="center", fontsize=8.6, color=TEXT)
    c.save("v10_travel.png")


# ------------------------------------------------------------------ 3.4 height: limit minus ground = buildable height
def height():
    c = Card(FULL, 3.0, "How the maximum building height is worked out", source="Source: AAI NOCAS conical surface for IGI Airport · floors at about 3 m each")
    ax = c.axes(left=.95, right=2.55, t=.12, b=.08)
    ax.set_xlim(0, 1); ax.set_ylim(150, 390); ax.axis("off")
    # ground
    ax.add_patch(Rectangle((0, 150), 1, 65, facecolor="#E9E2D6", hatch="////", edgecolor="#D6CBB8", lw=0))
    # buildable
    ax.add_patch(Rectangle((.15, 215), .7, 130, color=S1, lw=0))
    for f in range(1, 43):
        ax.plot([.15, .85], [215 + f * 130 / 43] * 2, color="#5378B0", lw=.45)
    # not permitted
    ax.add_patch(Rectangle((0, 345), 1, 45, color="#F6E2E4", lw=0))
    ax.plot([0, 1], [345, 345], color=S2, lw=1.8)
    ax.plot([0, 1], [215, 215], color="#8C7B5E", lw=1.2)
    for v in (215, 345):
        c.bg.text(.9, ax.transData.transform((0, v))[1] / DPI, f"{v} m", ha="right", va="center", fontsize=8, fontweight="bold", color=INK)
    c.bg.text(.9, ax.transData.transform((0, 380))[1] / DPI, "above\nsea level", ha="right", va="center", fontsize=7, color=MUTED)
    ax.text(.5, 368, "Not permitted", ha="center", va="center", fontsize=8.5, fontweight="bold", color=S2)
    ax.text(.5, 280, "≈130 m", ha="center", va="center", fontsize=13, fontweight="bold", color="white")
    ax.text(.5, 182, "Ground", ha="center", va="center", fontsize=8.5, fontweight="bold", color="#6B5B40")
    # the sum on the right
    x0 = 2.85
    rows = [("Airport height limit", "345 m", "above sea level, set by the IGI Airport conical surface", S2),
            ("Ground level at the site", "− 215 m", "above sea level", "#8C7B5E"),
            ("Maximum building height", "= 130 m", "about 43 floors at roughly 3 m per floor", S1)]
    ytop = c.h - PAD - .65
    for i, (lab, val, sub, col) in enumerate(rows):
        y = ytop - i * .62
        if i == 2:
            c.bg.plot([x0, FULL - PAD - .1], [y + .33, y + .33], color=INK, lw=1)
        c.bg.add_patch(Rectangle((x0, y - .16), .05, .36, color=col, lw=0))
        c.bg.text(x0 + .17, y + .1, lab, fontsize=9, color=MUTED, va="center")
        c.bg.text(x0 + .17, y - .09, sub, fontsize=7.6, color=DIM, va="center")
        c.bg.text(FULL - PAD - .1, y + .02, val, fontsize=16 if i == 2 else 13, fontweight="bold", color=INK, va="center", ha="right")
    c.bg.text(x0, ytop - 1.78, "A height NOC from AAI (via NOCAS) is required before construction.", fontsize=8.2, color=TEXT, va="center")
    c.save("v10_height.png")


if __name__ == "__main__":
    travel(); height(); print("v10 ok")
