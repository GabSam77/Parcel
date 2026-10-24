"""v6 figures: restyled regulatory charts, own elevation/slope chart, cleaned source images, exec-summary parcel view."""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from figures5 import A, save, bare, FULL, HALF, INK, TEXT, MUTED, DIM, GRID, BASE, TRACK, S1, S2, S3, S2L
import figures as F


def axis_style(ax, grid="x"):
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(BASE); ax.tick_params(length=0, labelsize=8)
    if grid == "x":
        ax.xaxis.grid(True, color=GRID, lw=.7)
    else:
        ax.yaxis.grid(True, color=GRID, lw=.7)
    ax.set_axisbelow(True)


# ---------------------------------------------------------------- 3.4 environmental constraints (lollipop, 1 km band)
def constraints():
    items = [("High-tension line", .071), ("Storm-water / water-body edge", 1.2), ("Wetland", 1.3),
             ("Sultanpur ESZ", 5.3), ("Sultanpur National Park", 5.6), ("Military area", 6.4)]
    fig = plt.figure(figsize=(FULL, 1.95)); ax = fig.add_axes([.3, .15, .64, .74])
    n = len(items); ax.set_xlim(0, 7.2); ax.set_ylim(-.6, n - .3)
    ax.add_patch(Rectangle((0, -.6), 1, n + .3, color="#F7E9EA", lw=0, zorder=0))
    ax.text(.5, n - .42, "within 1 km", ha="center", va="center", fontsize=7.5, color=S2)
    for i, (lab, km) in enumerate(items[::-1]):
        c = S2 if km < 1 else S1
        ax.plot([0, km], [i, i], color=c, lw=1.6, alpha=.35, solid_capstyle="butt", zorder=2)
        ax.plot(km, i, "o", ms=7.5, color=c, mec="white", mew=1.2, zorder=4)
        ax.text(km + .14, i, f"{km * 1000:.0f} m" if km < 1 else f"{km:g} km", va="center", fontsize=9, color=INK, fontweight="bold")
    ax.set_yticks(range(n)); ax.set_yticklabels([r[0] for r in items[::-1]], fontsize=9)
    ax.set_xticks(range(0, 8)); ax.set_xticklabels([f"{k} km" if k else "0" for k in range(8)])
    axis_style(ax)
    fig.text(.0, .95, "DISTANCE FROM THE PARCEL BOUNDARY", fontsize=7.5, fontweight="bold", color=MUTED)
    save(fig, "v6_constraints.png")


# ---------------------------------------------------------------- 3.5 FAR (bullet: permitted range against the 3.0 TDR ceiling)
def far():
    rows = [("Group Housing", 1.5, 1.75, "300–400 PPA"), ("Affordable Group Housing", 2.25, 2.25, "750–900 PPA")]
    fig = plt.figure(figsize=(FULL, 1.6)); ax = fig.add_axes([.3, .22, .6, .62])
    ax.set_xlim(0, 3.25); ax.set_ylim(-.55, 1.55)
    for i, (n, lo, hi, dens) in enumerate(rows[::-1]):
        ax.barh(i, 3.0, height=.42, color=TRACK, lw=0, zorder=1)
        ax.barh(i, hi, height=.42, color=S1, lw=0, zorder=2)
        if lo != hi:
            ax.barh(i, hi - lo, left=lo, height=.42, color="#6F8FC0", lw=0, zorder=3)
        ax.text(hi + .06, i + .02, f"{lo:g}–{hi:g}" if lo != hi else f"{hi:g}", va="center", fontsize=10, fontweight="bold", color=INK)
        ax.text(hi + .06, i - .27, dens, va="center", fontsize=7.5, color=MUTED)
    ax.plot([3, 3], [-.4, 1.4], color=S3, lw=1.4, zorder=4)
    ax.text(3.04, 1.38, "3.0 max\nwith TDR", fontsize=7.5, color=S3, va="top")
    ax.set_yticks([0, 1]); ax.set_yticklabels([r[0] for r in rows[::-1]], fontsize=9)
    ax.set_xticks([0, .5, 1, 1.5, 2, 2.5, 3]); axis_style(ax)
    fig.text(.0, .93, "PERMISSIBLE FLOOR AREA RATIO (FAR)", fontsize=7.5, fontweight="bold", color=MUTED)
    save(fig, "v6_far.png")


# ---------------------------------------------------------------- 6.2 elevation profile + slope distribution (redrawn from source values)
def terrain_charts():
    prof = [914, 913.9, 913.85, 913.7, 913.6, 913.58, 913.57, 913.53, 913.47, 913.45, 913.4, 913.25, 913.1, 912.95, 912.8,
            912.6, 912.45, 912.3, 912.22, 912.15, 912.1, 912.05, 912.02, 912.0, 912.0, 912.05, 912.08, 912.1, 912.2]
    rel = np.array(prof) - prof[0]
    fig = plt.figure(figsize=(FULL, 1.95))
    ax = fig.add_axes([.06, .2, .5, .62])
    x = np.linspace(0, 1, len(rel))
    ax.fill_between(x, rel, -2.3, color="#DCE5F2", lw=0)
    ax.plot(x, rel, color=S1, lw=1.8)
    ax.set_xlim(0, 1); ax.set_ylim(-2.3, .3)
    ax.set_xticks([0, 1]); ax.set_xticklabels(["West edge", "East edge"], fontsize=8)
    ax.set_yticks([0, -1, -2]); ax.set_yticklabels(["0 m", "−1 m", "−2 m"])
    axis_style(ax, "y")
    ax.annotate("≈2 m fall, west to east", xy=(.78, -2.0), xytext=(.45, -.55), fontsize=8.5, color=INK,
                arrowprops=dict(arrowstyle="-", color=DIM, lw=.7))
    fig.text(.0, .93, "ELEVATION PROFILE · RELATIVE TO WEST EDGE", fontsize=7.5, fontweight="bold", color=MUTED)
    bx = fig.add_axes([.68, .2, .3, .62])
    vals = [("0–2°", 62), ("2–5°", 38)]
    bx.barh([1, 0], [v for _, v in vals], height=.5, color=[S1, "#6F8FC0"], lw=0)
    for y, (_, v) in zip([1, 0], vals):
        bx.text(v + 2, y, f"{v}%", va="center", fontsize=10, fontweight="bold", color=INK)
    bx.set_yticks([1, 0]); bx.set_yticklabels([l for l, _ in vals], fontsize=9); bx.set_xlim(0, 80); bx.set_xticks([])
    for s in bx.spines.values():
        s.set_visible(False)
    bx.tick_params(length=0)
    fig.text(.62, .93, "SLOPE · SHARE OF PARCEL AREA", fontsize=7.5, fontweight="bold", color=MUTED)
    save(fig, "v6_terrain.png")


# ---------------------------------------------------------------- image clean-ups
def vastu_crop():
    im = Image.open(A("image5.jpeg")).convert("RGB").crop((86, 122, 546, 768))
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im.save(A("f_vastu.jpg"), quality=90)


def terrain_crop():
    im = Image.open(A("image25.u.png")).convert("RGB")
    im.crop((4, 4, im.width - 4, 292)).save(A("f_terrain6.jpg"), quality=90)


def es_parcel():
    """exec-summary view: natural colour, boundary recoloured crimson, coordinate chip"""
    src = Image.open(A("image27.u.jpeg")).convert("RGB")
    a = np.asarray(src).astype(int)
    yellow = (a[..., 0] > 170) & (a[..., 1] > 130) & (a[..., 2] < 110) & (a[..., 0] - a[..., 2] > 90)
    ys, xs = np.where(yellow)
    cx, cy = int(np.median(xs)), int(np.median(ys))
    h = src.height; w = int(h * 1.45)
    x0 = max(0, min(src.width - w, cx - w // 2)); y0 = max(0, min(src.height - h, cy - h // 2))
    box = (x0, y0, x0 + w, y0 + h)
    im = src.crop(box); ym = Image.fromarray((yellow * 255).astype("uint8")).crop(box)
    im = ImageEnhance.Color(im).enhance(.8); im = ImageEnhance.Brightness(im).enhance(.92)
    S = 1400 / im.width
    im = im.resize((1400, int(im.height * S)), Image.LANCZOS); ym = ym.resize(im.size).filter(ImageFilter.MaxFilter(9))
    im.paste(Image.new("RGB", im.size, (196, 46, 56)), (0, 0), ym)
    d = ImageDraw.Draw(im, "RGBA")
    F.chip(d, 24, 24, "Subject parcel", size=34)
    F.north(d, im.width - 70, im.height - 70, s=44)
    im.save(A("f_es_parcel.jpg"), quality=90)


if __name__ == "__main__":
    constraints(); far(); terrain_charts(); vastu_crop(); terrain_crop(); es_parcel()
    print("v6 figures ok")


def structures6():
    """structures page: full-width view, boundary recoloured crimson to match the rest of the report"""
    src = Image.open(A("image27.u.jpeg")).convert("RGB")
    a = np.asarray(src).astype(int)
    yellow = (a[..., 0] > 170) & (a[..., 1] > 130) & (a[..., 2] < 110) & (a[..., 0] - a[..., 2] > 90)
    h = src.height; w = min(src.width, int(h * 2.1))
    ys, xs = np.where(yellow); cx = int(np.median(xs)); x0 = max(0, min(src.width - w, cx - w // 2))
    box = (x0, 0, x0 + w, h)
    im = src.crop(box); ym = Image.fromarray((yellow * 255).astype("uint8")).crop(box)
    im = ImageEnhance.Color(im).enhance(.85)
    S = 2400 / im.width
    im = im.resize((2400, int(im.height * S)), Image.LANCZOS); ym = ym.resize(im.size).filter(ImageFilter.MaxFilter(11))
    im.paste(Image.new("RGB", im.size, (196, 46, 56)), (0, 0), ym)
    d = ImageDraw.Draw(im, "RGBA")
    F.chip(d, 30, 30, "Parcel boundary", size=44)
    F.north(d, im.width - 80, im.height - 80, s=52)
    im.save(A("f_structures6.jpg"), quality=90)
