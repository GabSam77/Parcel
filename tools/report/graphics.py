"""v2 graphics for the report: cover art and infographic panels (website palette)."""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "assets")
INK, NAVY, BRAND, DEEP, GOLD = "#0E2240", "#0E2A55", "#A1232B", "#711528", "#B48A3C"
GREY, MUTED, LINE, OK, WARN, SOFT = "#C9CED8", "#5B6676", "#E3E6EB", "#18794E", "#B26A00", "#F5F6F8"
plt.rcParams.update({"font.family": "Carlito", "font.size": 10, "svg.fonttype": "none"})
DPI = 220


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), dpi=DPI, bbox_inches="tight", pad_inches=.06, facecolor="white")
    plt.close(fig)


# ------------------------------------------------------------------ cover art (A4 @ 150 dpi)
def cover():
    W, H = 1240, 1754
    bg = Image.new("RGB", (W, H), INK)
    sat = Image.open(os.path.join(OUT, "image1.png")).convert("RGB")
    ph = int(H * .56)
    s = max(W / sat.width, ph / sat.height)
    sat = sat.resize((int(sat.width * s) + 1, int(sat.height * s) + 1), Image.LANCZOS)
    sat = sat.crop(((sat.width - W) // 2, (sat.height - ph) // 2, (sat.width - W) // 2 + W, (sat.height - ph) // 2 + ph))
    # cool, slightly desaturated photo so text reads cleanly
    tint = Image.new("RGB", sat.size, (14, 34, 64))
    sat = Image.blend(sat, tint, .38)
    bg.paste(sat, (0, 0))
    # gradients: dark at the very top (logo row) and fading into navy at the bottom of the photo
    grad = Image.new("L", (1, H))
    for y in range(H):
        if y < 220:
            a = int(170 * (1 - y / 220))
        elif y < ph - 380:
            a = 0
        elif y < ph:
            a = int(255 * ((y - (ph - 380)) / 380) ** 1.4)
        else:
            a = 255
        grad.putpixel((0, y), a)
    bg = Image.composite(Image.new("RGB", (W, H), INK), bg, grad.resize((W, H)))
    d = ImageDraw.Draw(bg, "RGBA")
    # parcel marker: pulsing crimson rings at the plot location
    cx, cy = int(W * .58), int(ph * .46)
    for r_, a in [(150, 90), (100, 150), (58, 210)]:
        d.ellipse([cx - r_, cy - r_, cx + r_, cy + r_], outline=(220, 70, 78, a), width=5)
    d.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=(161, 35, 43, 255), outline=(255, 255, 255, 255), width=6)
    # subtle grid lines over the lower navy area (map graticule feel)
    for x in range(0, W, 62):
        d.line([(x, ph), (x, H)], fill=(255, 255, 255, 8), width=1)
    for y in range(ph, H, 62):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 8), width=1)
    # crimson + gold accent bar along the left edge
    d.rectangle([0, 0, 14, H], fill=BRAND)
    d.rectangle([14, 0, 18, H], fill=GOLD)
    bg.save(os.path.join(OUT, "cover_bg.png"), optimize=True)


# ------------------------------------------------------------------ section band art (thin full-bleed strip)
def band():
    W, H = 2480, 360
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im, "RGBA")
    for x in range(-H, W, 46):
        d.line([(x, H), (x + H, 0)], fill=(255, 255, 255, 7), width=2)
    d.rectangle([0, H - 10, W, H], fill=BRAND)
    im.save(os.path.join(OUT, "band.png"))


# ------------------------------------------------------------------ ownership & title chain timeline
def title_chain():
    ev = [("15 Jun 1998", "Late Ram Singh", "khatedar", "State Govt. allotment"),
          ("02 Nov 2010", "Ram Singh & Sons HUF", "", "Legal heirs"),
          ("20 Apr 2018", "M/s HASTA Infrastructure", "Pvt. Ltd.", "Sale"),
          ("Pending", "Mutation confirmation", "to be verified", "")]
    fig, ax = plt.subplots(figsize=(7.2, 1.85))
    xs = [0, 1, 2, 3]
    ax.plot([-.3, 2], [0, 0], color=NAVY, lw=2.4, solid_capstyle="round")
    ax.plot([2, 3.3], [0, 0], color=BRAND, lw=2.4, ls=(0, (2, 2)))
    for x, (date, who, sub, how) in zip(xs, ev):
        last = date == "Pending"
        ax.scatter([x], [0], s=230, color="white" if last else NAVY, edgecolor=BRAND if last else "white", linewidth=2.5, zorder=4)
        ax.text(x, .34, date, ha="center", fontsize=10.5, fontweight="bold", color=BRAND)
        ax.text(x, -.32, who, ha="center", fontsize=9.6, fontweight="bold", color=INK)
        if sub:
            ax.text(x, -.52, sub, ha="center", fontsize=8.8, color=MUTED)
        if how:
            ax.text(x + .5, .1, how, ha="center", fontsize=8, color=MUTED, style="italic")
    ax.set_xlim(-.45, 3.45); ax.set_ylim(-.7, .55); ax.axis("off")
    save(fig, "g_title_chain.png")


# ------------------------------------------------------------------ travel-time ladder
def travel_ladder():
    pts = [("Access road", 0, "adjacent"), ("Railway station", 10, "3.9 km"), ("Highway NH-248BB", 15, "9.8 km"),
           ("Airport (IGI)", 31, "25.9 km"), ("Metro station", 35, "18 km"), ("Cyber City CBD", 40, "18 km")]
    fig, ax = plt.subplots(figsize=(7.2, 1.9))
    ax.axhline(0, color=LINE, lw=6, solid_capstyle="round", zorder=1)
    ax.plot([0, 40], [0, 0], color=NAVY, lw=6, solid_capstyle="round", zorder=2, alpha=.15)
    for i, (n, m, d) in enumerate(pts):
        up = i % 2 == 0
        ax.scatter([m], [0], s=110, color=BRAND if m == 0 else NAVY, zorder=4, edgecolor="white", linewidth=2)
        y = .5 if up else -.5
        ax.plot([m, m], [0, y * .62], color=GREY, lw=1, zorder=1)
        sub = f"{m} min · {d}" if m else d
        if up:
            ax.text(m, y, sub, ha="center", va="bottom", fontsize=8.6, color=MUTED)
            ax.text(m, y + .2, n, ha="center", va="bottom", fontsize=9.6, fontweight="bold", color=INK)
        else:
            ax.text(m, y, n, ha="center", va="top", fontsize=9.6, fontweight="bold", color=INK)
            ax.text(m, y - .2, sub, ha="center", va="top", fontsize=8.6, color=MUTED)
    for t in range(0, 46, 10):
        ax.text(t, -.12, "", fontsize=7)
    ax.set_xlim(-4, 44); ax.set_ylim(-1.05, 1.05); ax.axis("off")
    save(fig, "g_travel_ladder.png")


# ------------------------------------------------------------------ upcoming projects timeline
def projects():
    import datetime as dt
    q = lambda y, m: y + (m - 1) / 12
    rows = [("Dwarka Expressway link to Wazirpur Chowk", "₹450 Cr", q(2027, 5), q(2028, 5)),
            ("NH-248BB widening", "₹280 Cr", q(2026, 12), q(2027, 2)),
            ("Daulatabad 400 kV substation", "₹120 Cr", q(2026, 11), q(2027, 2))]
    now = q(2026, 10)
    fig, ax = plt.subplots(figsize=(7.2, 1.9))
    for i, (n, cost, gov, est) in enumerate(rows):
        y = 2 - i
        ax.barh(y, gov - now, left=now, height=.36, color=NAVY)
        ax.barh(y, est - gov, left=gov, height=.36, color=BRAND, alpha=.85, hatch="////", edgecolor="white", lw=0)
        ax.text(now - .04, y, f"{n}  ", ha="right", va="center", fontsize=9.5, color=INK, fontweight="bold")
        ax.text(est + .03, y, cost, va="center", fontsize=9, color=MUTED)
    ax.axvline(now, color=GOLD, lw=1.5, ls="--")
    ax.text(now, 2.55, "Today", ha="center", fontsize=8.5, color=GOLD, fontweight="bold")
    ticks = [q(2027, 1), q(2027, 7), q(2028, 1), q(2028, 7)]
    ax.set_xticks(ticks); ax.set_xticklabels(["Jan 2027", "Jul 2027", "Jan 2028", "Jul 2028"], fontsize=8.5, color=MUTED)
    ax.set_xlim(now - .02, q(2028, 9)); ax.set_ylim(-.5, 2.8); ax.set_yticks([])
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(LINE); ax.tick_params(length=0)
    ax.xaxis.grid(True, color=LINE, lw=.8); ax.set_axisbelow(True)
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(color=NAVY, label="Government timeline"), Patch(facecolor=BRAND, hatch="////", edgecolor="white", label="HCAL estimate (delay)")],
              loc="upper center", bbox_to_anchor=(.5, -.18), ncol=2, frameon=False, fontsize=8.5)
    save(fig, "g_projects.png")


# ------------------------------------------------------------------ airport height gauge
def height():
    fig, ax = plt.subplots(figsize=(2.6, 3.3))
    ax.add_patch(Rectangle((0, 0), 3, 215, color="#E9ECF1"))           # ground (AMSL)
    ax.add_patch(Rectangle((0, 215), 3, 130, color="#F7E9EA"))          # permitted envelope
    ax.plot([0, 3], [345, 345], color=BRAND, lw=2, ls="--")
    ax.add_patch(Rectangle((1.0, 215), 1.0, 129, color=NAVY, lw=0))
    for y in range(230, 344, 15):
        ax.plot([1.0, 2.0], [y, y], color="white", lw=.8, alpha=.5)
    ax.text(3.1, 345, "345 m AMSL\nconical-surface limit", va="center", fontsize=8.5, color=BRAND, fontweight="bold")
    ax.text(3.1, 215, "215 m AMSL\nground level", va="center", fontsize=8.5, color=MUTED)
    ax.annotate("", xy=(.5, 345), xytext=(.5, 215), arrowprops=dict(arrowstyle="<->", color=GOLD, lw=1.4))
    ax.text(.42, 280, "≈130 m\n≈43 floors", ha="right", va="center", fontsize=9, color=INK, fontweight="bold")
    ax.set_xlim(-1.2, 6.2); ax.set_ylim(150, 380); ax.axis("off")
    save(fig, "g_height.png")


# ------------------------------------------------------------------ constraints distance chart
def constraints():
    items = [("High-tension line", .071), ("Storm-water / water-body edge", 1.2), ("Wetland", 1.3),
             ("Sultanpur ESZ", 5.3), ("Sultanpur National Park", 5.6), ("Military area", 6.4)]
    fig, ax = plt.subplots(figsize=(7.2, 2.1))
    y = list(range(len(items)))[::-1]
    for yy, (n, km) in zip(y, items):
        c = BRAND if km < 1 else (WARN if km < 2 else NAVY)
        ax.plot([0, km], [yy, yy], color=c, lw=2.2, alpha=.35)
        ax.scatter([km], [yy], s=70, color=c, zorder=3, edgecolor="white", linewidth=1.5)
        ax.text(km + .12, yy, f"{km * 1000:.0f} m" if km < 1 else f"{km:g} km", va="center", fontsize=9, color=c, fontweight="bold")
    ax.scatter([0], [y[0] + .9], marker="v", s=60, color=BRAND)
    ax.text(0, y[0] + 1.25, "Site", ha="center", fontsize=8.5, color=BRAND, fontweight="bold")
    ax.set_yticks(y); ax.set_yticklabels([n for n, _ in items], fontsize=9.5, color=INK)
    ax.set_xlim(-.1, 7.3); ax.set_ylim(-.6, y[0] + 1.6)
    ax.set_xlabel("Distance from the parcel (km)", fontsize=8.5, color=MUTED)
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(LINE); ax.tick_params(length=0, labelsize=8.5, colors=MUTED)
    ax.tick_params(axis="y", colors=INK)
    ax.xaxis.grid(True, color=LINE, lw=.8); ax.set_axisbelow(True)
    save(fig, "g_constraints.png")


# ------------------------------------------------------------------ seismic zone scale
def seismic():
    fig, ax = plt.subplots(figsize=(3.4, 1.05))
    zones = [("II", "Low"), ("III", "Moderate"), ("IV", "High"), ("V", "Very high")]
    cols = ["#DDE3EC", "#C2CCDB", BRAND, "#E8C9CC"]
    for i, (z, lab) in enumerate(zones):
        on = z == "IV"
        ax.add_patch(FancyBboxPatch((i * 1.05, 0), .95, .62, boxstyle="round,pad=0,rounding_size=.08", color=cols[i]))
        ax.text(i * 1.05 + .475, .38, f"Zone {z}", ha="center", fontsize=9.5, fontweight="bold", color="white" if on else INK)
        ax.text(i * 1.05 + .475, .14, lab, ha="center", fontsize=8, color="white" if on else MUTED)
    ax.scatter([2 * 1.05 + .475], [.8], marker="v", s=70, color=BRAND)
    ax.text(2 * 1.05 + .475, .92, "This site", ha="center", fontsize=8.5, color=BRAND, fontweight="bold")
    ax.set_xlim(-.05, 4.2); ax.set_ylim(-.05, 1.12); ax.axis("off")
    save(fig, "g_seismic.png")


if __name__ == "__main__":
    cover(); band(); title_chain(); travel_ladder(); projects(); height(); constraints(); seismic()
    print("graphics ok")
