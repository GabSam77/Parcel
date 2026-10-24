"""Charts for the redesigned report, in the website palette (navy / crimson / gold)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import os

OUT = os.path.join(os.path.dirname(__file__), "assets")
INK, NAVY, BRAND, BRAND_SOFT, GOLD = "#0E2240", "#0E2A55", "#A1232B", "#F2D9DB", "#B48A3C"
GREY, MUTED, LINE, OK = "#C9CED8", "#5B6676", "#E3E6EB", "#18794E"

for f in ["Carlito"]:
    try:
        fm.findfont(f, fallback_to_default=False)
        plt.rcParams["font.family"] = f
    except Exception:
        pass
plt.rcParams.update({"font.size": 10, "axes.edgecolor": LINE, "axes.labelcolor": MUTED,
                     "xtick.color": MUTED, "ytick.color": INK, "svg.fonttype": "none"})
DPI = 220


def clean(ax, grid=True):
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(LINE)
    ax.tick_params(axis="y", length=0, labelsize=10.5)
    ax.tick_params(axis="x", length=0, labelsize=9)
    if grid:
        ax.xaxis.grid(True, color=LINE, lw=.8)
        ax.set_axisbelow(True)


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), dpi=DPI, bbox_inches="tight", pad_inches=.08, facecolor="white")
    plt.close(fig)


def growth(name, labels, values, w=6.6):
    fig, ax = plt.subplots(figsize=(w, .42 * len(labels) + .35))
    y = range(len(labels))[::-1]
    mx = max(values)
    ax.barh(list(y), [mx * 1.18] * len(values), color="#F4F5F7", height=.62)
    bars = ax.barh(list(y), values, color=[BRAND if v == mx else NAVY for v in values], height=.62)
    for b, v in zip(bars, values):
        ax.text(b.get_width() + mx * .015, b.get_y() + b.get_height() / 2, f"+{v}%", va="center",
                fontsize=10, fontweight="bold", color=BRAND if v == mx else NAVY)
    ax.set_yticks(list(y)); ax.set_yticklabels(labels)
    ax.set_xlim(0, mx * 1.18); ax.set_xticks([])
    clean(ax, grid=False); ax.spines["bottom"].set_visible(False)
    save(fig, name)


def travel_time():
    dest = ["IGI Airport", "Cyber City, Gurugram", "Aerocity"]
    now, after = [31, 40, 15], [22, 28, 8]
    fig, ax = plt.subplots(figsize=(6.6, 2.5))
    y = [2, 1, 0]
    ax.barh([v + .18 for v in y], now, height=.34, color=GREY, label="Today")
    ax.barh([v - .18 for v in y], after, height=.34, color=BRAND, label="After upcoming projects")
    for yy, a, b in zip(y, now, after):
        ax.text(a + .6, yy + .18, f"{a} min", va="center", fontsize=9, color=MUTED)
        ax.text(b + .6, yy - .18, f"{b} min", va="center", fontsize=9, color=BRAND, fontweight="bold")
        ax.text(55, yy, f"−{a - b} min", va="center", ha="right", fontsize=10.5, color=OK, fontweight="bold")
    ax.set_yticks(y); ax.set_yticklabels(dest)
    ax.set_xlim(0, 55); ax.set_xticks([0, 10, 20, 30, 40]); ax.set_xlabel("Travel time (minutes)", fontsize=9)
    clean(ax)
    ax.legend(loc="upper center", bbox_to_anchor=(.42, -.22), ncol=2, frameon=False, fontsize=9)
    save(fig, "chart_travel.png")


def far():
    fig, ax = plt.subplots(figsize=(6.6, 1.9))
    rows = [("Group Housing", 1.5, 1.75), ("Affordable Group\nHousing", 2.25, 2.25)]
    for i, (lab, lo, hi) in enumerate(rows):
        y = 1 - i
        ax.barh(y, 3.0, color=BRAND_SOFT, height=.5, hatch="///", edgecolor="#E6B9BD", lw=0)
        ax.barh(y, hi, color=BRAND, height=.5)
        if lo != hi:
            ax.barh(y, lo, color="#7E1A22", height=.5)
        ax.text(hi / 2, y, f"FAR {lo:g}–{hi:g}" if lo != hi else f"FAR up to {hi:g}", ha="center", va="center",
                color="white", fontweight="bold", fontsize=10)
        ax.text(3.04, y, "up to 3.0\nwith TDR", va="center", fontsize=8.5, color=MUTED)
    ax.set_yticks([1, 0]); ax.set_yticklabels([r[0] for r in rows])
    ax.set_xlim(0, 3.35); ax.set_xticks([0, .5, 1, 1.5, 2, 2.5, 3])
    ax.set_xlabel("Floor area ratio (FAR)", fontsize=9)
    clean(ax)
    save(fig, "chart_far.png")


def landbanks():
    growth_like = [("Prestige", 100), ("Signature Global", 78), ("Eldeco", 54), ("Godrej", 10)]
    fig, ax = plt.subplots(figsize=(3.9, 2.2))
    y = list(range(len(growth_like)))[::-1]
    mx = 100
    ax.barh(y, [mx * 1.18] * 4, color="#F4F5F7", height=.6)
    bars = ax.barh(y, [v for _, v in growth_like], color=[BRAND] + [NAVY] * 3, height=.6)
    for b, (_, v) in zip(bars, growth_like):
        ax.text(b.get_width() + 1.5, b.get_y() + b.get_height() / 2, f"{v} acres", va="center", fontsize=10,
                fontweight="bold", color=INK)
    ax.set_yticks(y); ax.set_yticklabels([n for n, _ in growth_like])
    ax.set_xlim(0, mx * 1.18); ax.set_xticks([])
    clean(ax, grid=False); ax.spines["bottom"].set_visible(False)
    save(fig, "chart_landbanks.png")


def donut():
    fig, ax = plt.subplots(figsize=(2.2, 2.2))
    v = 5.76
    ax.pie([v, 100 - v], colors=[BRAND, "#F3E3E5"], startangle=90, counterclock=False,
           wedgeprops=dict(width=.26, edgecolor="white", linewidth=2))
    ax.text(0, .08, f"{v}%", ha="center", va="center", fontsize=20, fontweight="bold", color=INK)
    ax.text(0, -.25, "built-up", ha="center", va="center", fontsize=10, color=MUTED)
    ax.set_aspect("equal")
    save(fig, "chart_donut.png")


if __name__ == "__main__":
    travel_time(); far(); landbanks(); donut()
    growth("chart_built.png", ["Built-up area", "Residential", "Commercial", "Office cluster"], [18, 22, 15, 12], w=3.7)
    growth("chart_social.png", ["Retail", "Bank / ATM", "Medical", "Education", "Hotels / banquets"], [20, 14, 25, 18, 10], w=3.7)
    growth("chart_pop.png", ["Population", "Households", "Night-time radiance (2018–2024)"], [16, 14, 68])
    print("charts ok")
