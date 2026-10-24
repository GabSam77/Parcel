"""Ten-year growth, made legible: an overview of the area with three numbered focus windows, and for each
window the same ground in 2015 and 2025 side by side. Windows are where the most open land became built up."""
import os, json, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import satchange as S
from satchange2 import new_mask, match_colour
HERE = os.path.dirname(os.path.abspath(__file__)); A = lambda f: os.path.join(HERE, 'assets', f)
CRIM = (161, 35, 43); NAVY = (14, 34, 64); WHITE = (255, 255, 255)
WW, WH = 300, 225            # focus window size in the aligned frame (4:3)

def font(sz, bold=True): return ImageFont.truetype(S.SANSB if bold else S.SANS, sz)
def grade(im, c=1.12, s=.9, b=1.04):
    p = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    return ImageEnhance.Brightness(ImageEnhance.Color(ImageEnhance.Contrast(p).enhance(c)).enhance(s)).enhance(b)
def badge(d, x, y, n, r=30):
    d.ellipse([x - r - 5, y - r - 5, x + r + 5, y + r + 5], fill=WHITE); d.ellipse([x - r, y - r, x + r, y + r], fill=CRIM)
    f = font(int(r * 1.25)); w = d.textlength(str(n), font=f); d.text((x - w / 2, y - r * .78), str(n), font=f, fill=WHITE)
def chip(d, x, y, text, fill, sz=40):
    f = font(sz); w = d.textlength(text, font=f); d.rectangle([x, y, x + w + sz * .9, y + sz * 1.55], fill=fill); d.text((x + sz * .45, y + sz * .2), text, font=f, fill=WHITE)

def sharpen(im, amt=.6):
    return cv2.addWeighted(im, 1 + amt, cv2.GaussianBlur(im, (0, 0), 2.5), -amt, 0)

def run():
    a, b = S.load()
    new, stats = new_mask(a, b)
    H, W = new.shape
    dens = cv2.boxFilter(new.astype(np.float32), -1, (WW, WH))
    dens[:WH // 2 + 5] = 0; dens[700 - WH // 2:] = 0; dens[:, :WW // 2 + 5] = 0; dens[:, -WW // 2 - 5:] = 0
    wins = []
    for _ in range(3):
        y, x = np.unravel_index(np.argmax(dens), dens.shape); v = float(dens[y, x])
        dens[max(0, y - int(WH * 1.3)):y + int(WH * 1.3), max(0, x - int(WW * 1.3)):x + int(WW * 1.3)] = 0
        wins.append((int(x), int(max(y, WH // 2 + 22)), v))
    # editorial pick: the three clearest open-to-built changes found by the density scan above
    wins = [(700, 365, 0), (900, 126, 0), (1060, 585, 0)]
    # colour-match 2015 to 2025 so differences are land use, not camera
    b_s = sharpen(b, .5)
    a_m = match_colour(cv2.GaussianBlur(a, (0, 0), .7), b)
    # ---- overview: the whole 2025 frame, windows marked
    k = 2.0
    OVH = 700
    ov = grade(cv2.resize(b_s[:OVH], (int(W * k), int(OVH * k)), interpolation=cv2.INTER_LANCZOS4), s=.8)
    ov = ImageEnhance.Brightness(ov).enhance(.92)
    d = ImageDraw.Draw(ov)
    for i, (x, y, _) in enumerate(wins):
        bx = [(x - WW / 2) * k, (y - WH / 2) * k, (x + WW / 2) * k, (y + WH / 2) * k]
        d.rectangle([bx[0] - 4, bx[1] - 4, bx[2] + 4, bx[3] + 4], outline=WHITE, width=4)
        d.rectangle(bx, outline=CRIM, width=6)
        badge(d, bx[0] + 4, max(bx[1], 44), i + 1, 34)
    nx, ny = ov.width - 70, 30
    d.polygon([(nx, ny), (nx - 24, ny + 68), (nx, ny + 54), (nx + 24, ny + 68)], fill=WHITE); d.text((nx - 13, ny + 72), 'N', font=font(38), fill=WHITE)
    chip(d, 0, 0, '2025 · overview', NAVY)
    ov.save(A('f_sat_overview.jpg'), quality=88)
    # ---- pairs: one image per window, 2015 above 2025
    T = 760; TH = int(T * WH / WW)
    for i, (x, y, _) in enumerate(wins):
        x0, y0 = x - WW // 2, y - WH // 2
        out = Image.new('RGB', (T, 2 * TH + 22), WHITE)
        for j, (img, yr, col) in enumerate([(a_m, '2015', NAVY), (b_s, '2025', CRIM)]):
            c = cv2.resize(img[y0:y0 + WH, x0:x0 + WW], (T, TH), interpolation=cv2.INTER_CUBIC)
            p = grade(c, c=1.15, s=.95, b=1.05); dd = ImageDraw.Draw(p)
            chip(dd, 0, 0, yr, col, 38)
            out.paste(p, (0, j * (TH + 22)))
        od = ImageDraw.Draw(out); badge(od, T - 52, 52, i + 1, 30)
        out.save(A(f'f_sat_pair{i + 1}.jpg'), quality=90)
    json.dump(stats, open(A('sat_stats.json'), 'w'))
    print(stats, wins)

if __name__ == '__main__':
    run()
