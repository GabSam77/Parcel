"""Then-and-now satellite figure: the same ground in 2015 and 2025, colour-matched, with numbered
outlines around land that was open in 2015 and is built up in 2025 (tinted on the 2025 view)."""
import os, json, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import satchange as S
HERE = os.path.dirname(os.path.abspath(__file__)); A = lambda f: os.path.join(HERE, 'assets', f)
CRIM = (161, 35, 43); NAVY = (14, 34, 64)
CY0, CY1 = 130, 800          # crop rows (in the aligned frame); full width
OUTW = 2400                  # output pixel width

def new_mask(a, b):
    sa, wa = S.score(cv2.GaussianBlur(a, (0, 0), 1.6)); sb, wb = S.score(b); ma, mb = S.mask(sa), S.mask(sb)
    water = wa | wb; ma[water] = 0; mb[water] = 0
    hsv = cv2.cvtColor(b, cv2.COLOR_BGR2HSV); satb = cv2.GaussianBlur(hsv[..., 1].astype(np.float32), (0, 0), 4)
    fb = b.astype(np.float32) + 1; warmb = cv2.GaussianBlur((fb[..., 2] - fb[..., 0]) / fb.sum(2), (0, 0), 4)
    grey = (satb < np.percentile(satb, 55)) & (warmb < np.percentile(warmb, 60))
    new = ((mb > 0) & (ma == 0) & grey).astype(np.uint8)
    new = cv2.morphologyEx(new, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    land = ~water
    pa = ma[land].mean(); pn = new[land].mean()
    return new, dict(built2015=round(float(pa) * 100), built2025=round(float(pa + pn) * 100), converted=round(float(pn / (1 - pa)) * 100))

def match_colour(src, ref):
    s = cv2.cvtColor(src, cv2.COLOR_BGR2LAB).astype(np.float32); r = cv2.cvtColor(ref, cv2.COLOR_BGR2LAB).astype(np.float32)
    for c in range(3):
        s[..., c] = (s[..., c] - s[..., c].mean()) / (s[..., c].std() + 1e-6) * r[..., c].std() + r[..., c].mean()
    return cv2.cvtColor(s.clip(0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)

def grade(im):
    p = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    from PIL import ImageEnhance
    p = ImageEnhance.Contrast(p).enhance(1.12); p = ImageEnhance.Color(p).enhance(.88); p = ImageEnhance.Brightness(p).enhance(1.04)
    return p

def font(sz, bold=True): return ImageFont.truetype(S.SANSB if bold else S.SANS, sz)

def badge(d, x, y, n, r=34):
    d.ellipse([x - r - 5, y - r - 5, x + r + 5, y + r + 5], fill=(255, 255, 255))
    d.ellipse([x - r, y - r, x + r, y + r], fill=CRIM)
    f = font(42); w = d.textlength(str(n), font=f); d.text((x - w / 2, y - 26), str(n), font=f, fill=(255, 255, 255))

def chip(d, x, y, text, fill):
    f = font(46); w = d.textlength(text, font=f)
    d.rectangle([x, y, x + w + 40, y + 72], fill=fill); d.text((x + 20, y + 10), text, font=f, fill=(255, 255, 255))

def run():
    a, b = S.load()
    new, stats = new_mask(a, b)
    a, b, new = a[CY0:CY1], b[CY0:CY1], new[CY0:CY1]
    H, W = new.shape; k = OUTW / W
    # zones: merge nearby development into clusters, keep the three largest
    cl = cv2.morphologyEx(new, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
    n, lab, st, cen = cv2.connectedComponentsWithStats(cl)
    order = list(np.argsort(-st[1:, cv2.CC_STAT_AREA]) + 1)[:3]
    zones = []
    for z in order:
        m = (lab == z).astype(np.float32)
        m = cv2.GaussianBlur(m, (0, 0), 14) > .35            # smooth outline
        cs, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = max(cs, key=cv2.contourArea)
        c = cv2.approxPolyDP(c, 2.5, True).reshape(-1, 2) * k
        zones.append((c, cen[z] * k, st[z]))
    zones.sort(key=lambda z: z[1][0])                        # number left to right
    # photos
    b_up = cv2.resize(b, (OUTW, int(H * k)), interpolation=cv2.INTER_LANCZOS4)
    b_up = cv2.addWeighted(b_up, 1.5, cv2.GaussianBlur(b_up, (0, 0), 3), -.5, 0)     # unsharp
    a_up = cv2.resize(cv2.GaussianBlur(a, (0, 0), .8), (OUTW, int(H * k)), interpolation=cv2.INTER_LANCZOS4)
    a_up = match_colour(a_up, b_up)
    p15, p25 = grade(a_up), grade(b_up)
    # tint new development on 2025
    nm = cv2.resize(new * 255, (OUTW, int(H * k)), interpolation=cv2.INTER_LINEAR)
    nm = Image.fromarray(cv2.GaussianBlur(nm, (0, 0), 2)).point(lambda v: int(v * .5))
    p25 = Image.composite(Image.new('RGB', p25.size, CRIM), p25, nm)
    for img, yr, col in [(p15, '2015', NAVY), (p25, '2025', CRIM)]:
        d = ImageDraw.Draw(img)
        for i, (c, ce, _) in enumerate(zones):
            pts = [tuple(map(float, q)) for q in c]
            d.line(pts + [pts[0]], fill=(255, 255, 255), width=11, joint='curve')
            d.line(pts + [pts[0]], fill=CRIM, width=6, joint='curve')
            top = c[np.argmin(c[:, 1])]
            bx, by = float(top[0]), max(46.0, float(top[1]))
            badge(d, bx, by, i + 1)
        chip(d, 0, 0, yr, col)
        # north arrow
        nx, ny = img.width - 70, 30
        d.polygon([(nx, ny), (nx - 24, ny + 68), (nx, ny + 54), (nx + 24, ny + 68)], fill=(255, 255, 255)); d.text((nx - 13, ny + 72), 'N', font=font(38), fill=(255, 255, 255))
    p15.save(A('f_then.jpg'), quality=90); p25.save(A('f_now.jpg'), quality=90)
    json.dump(stats, open(A('sat_stats.json'), 'w')); print(stats, [z[2][4] for z in zones], [tuple(z[1].round()) for z in zones])

if __name__ == '__main__':
    run()
