"""Ten-year growth from the two supplied satellite images: co-register, classify built-up, map new development."""
import os, json, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); A = lambda f: os.path.join(HERE, 'assets', f)
SANS = "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf"; SANSB = "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf"
CRIM = (161, 35, 43); NAVY = (14, 34, 64); GREYB = (120, 132, 150)
Y0, Y1, X0, X1 = 195, 1044, 0, 1400

def load():
    a = cv2.imread(A('image14.png')); b = cv2.imread(A('sat2025_trim.png')); F = np.load(A('sat_F.npy'))
    h, w = a.shape[:2]
    bf = cv2.warpAffine(b, F, (w, h), flags=cv2.INTER_LANCZOS4)
    return a[Y0:Y1, X0:X1], bf[Y0:Y1, X0:X1]

def score(im):
    f = im.astype(np.float32) + 1; b, g, r = cv2.split(f); s = b + g + r
    green = (2 * g - r - b) / s; warm = (r - b) / s
    L = cv2.cvtColor(im, cv2.COLOR_BGR2LAB)[..., 0].astype(np.float32)
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    mu = cv2.GaussianBlur(gray, (0, 0), 3); tex = np.sqrt(np.maximum(cv2.GaussianBlur(gray * gray, (0, 0), 3) - mu * mu, 0))
    sat = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)[..., 1].astype(np.float32)
    z = lambda x: (x - np.median(x)) / (np.percentile(x, 84) - np.percentile(x, 16) + 1e-6)
    sc = z(L) * .6 + z(tex) - z(green) * 1.2 - z(sat) - z(warm) * .8
    water = (L < np.percentile(L, 4)) & (green < np.median(green))
    sc = cv2.GaussianBlur(sc, (0, 0), 4); sc[water] = -9
    return sc, water

def mask(sc):
    u = cv2.normalize(sc, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    t, _ = cv2.threshold(u, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    m = (u > t).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    return cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))

def font(sz, bold=False): return ImageFont.truetype(SANSB if bold else SANS, sz)

def chip(d, x, y, text, sz, fill=NAVY, fg=(255, 255, 255)):
    f = font(sz, True); w = d.textlength(text, font=f); pad = sz * .45
    d.rectangle([x, y, x + w + 2 * pad, y + sz * 1.45], fill=fill); d.text((x + pad, y + sz * .18), text, font=f, fill=fg)
    return w + 2 * pad

def run():
    a, b = load()
    sa, wa = score(cv2.GaussianBlur(a, (0, 0), 1.6)); sb, wb = score(b)
    ma, mb = mask(sa), mask(sb)
    water = (wa | wb)
    ma[water] = 0; mb[water] = 0
    hsv = cv2.cvtColor(b, cv2.COLOR_BGR2HSV); satb = cv2.GaussianBlur(hsv[..., 1].astype(np.float32), (0, 0), 4)
    fb = b.astype(np.float32) + 1; warmb = cv2.GaussianBlur((fb[..., 2] - fb[..., 0]) / fb.sum(2), (0, 0), 4)
    grey = (satb < np.percentile(satb, 55)) & (warmb < np.percentile(warmb, 60))   # concrete reads grey; fields read warm/saturated
    new = (mb > 0) & (ma == 0) & grey
    new = cv2.morphologyEx(new.astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 7), np.uint8)) > 0
    land = ~water
    pa = ma[land].mean(); pn = new[land].mean(); pb = pa + pn
    open15 = 1 - pa; conv = pn / open15
    stats = dict(built2015=round(pa * 100, 1), built2025=round(pb * 100, 1), pts=round((pb - pa) * 100, 1), converted=round(conv * 100))
    print(stats); json.dump(stats, open(A('sat_stats.json'), 'w'))

    # ---- change map: muted 2025 base, built-up 2015 in slate, new in crimson
    S = 2.0
    H, W = b.shape[:2]
    base = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    base = cv2.resize(base, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC).astype(np.float32)
    tex = (base - cv2.GaussianBlur(base, (0, 0), 6)) * .5           # keep street texture only
    up = lambda m: cv2.resize(m.astype(np.uint8), (base.shape[1], base.shape[0]), interpolation=cv2.INTER_NEAREST) > 0
    m15, mnew, wat = up(ma), up(new), up(water)
    rgb = np.zeros(base.shape + (3,), np.float32); rgb[:] = (238, 236, 230)      # open land
    rgb[m15] = (196, 201, 210)                                                  # built-up by 2015
    rgb[wat] = (176, 200, 224)
    rgb[mnew] = CRIM
    rgb += tex[..., None] * np.where(mnew[..., None], .25, 1)
    rgb = rgb.clip(0, 255)
    im = Image.fromarray(rgb.astype(np.uint8)); d = ImageDraw.Draw(im)
    # hotspots
    dens = cv2.boxFilter(new.astype(np.float32), -1, (210, 210))
    spots = []
    dd = dens.copy()
    for k in range(2):
        y, x = np.unravel_index(np.argmax(dd), dd.shape); spots.append((x, y))
        dd[max(0, y - 320):y + 320, max(0, x - 320):x + 320] = 0
    spots.sort()
    half = 120
    for i, (x, y) in enumerate(spots):
        x = int(np.clip(x, half + 4, W - half - 4)); y = int(np.clip(y, half + 30, H - half - 4)); spots[i] = (x, y)
        bx = [(x - half) * S, (y - half) * S, (x + half) * S, (y + half) * S]
        d.rectangle(bx, outline=NAVY, width=7)
        chip(d, bx[0], bx[1] - 64, 'AB'[i], 44)
    # legend
    lx, ly = 28, im.height - 300
    d.rectangle([lx, ly, lx + 640, ly + 272], fill=(255, 255, 255), outline=(218, 220, 224))
    rows = [((196, 201, 210), 'Built-up by 2015'), (CRIM, 'New built-up, 2015 → 2025'), ((238, 236, 230), 'Open / agricultural land'), ((176, 200, 224), 'Water')]
    for j, (c, t) in enumerate(rows):
        yy = ly + 22 + j * 60
        d.rectangle([lx + 22, yy + 6, lx + 64, yy + 44], fill=c, outline=(170, 176, 186)); d.text((lx + 84, yy), t, font=font(42), fill=(43, 52, 69))
    # north arrow
    nx, ny = im.width - 70, 36
    d.polygon([(nx, ny), (nx - 24, ny + 68), (nx, ny + 54), (nx + 24, ny + 68)], fill=NAVY); d.text((nx - 13, ny + 72), 'N', font=font(38, True), fill=NAVY)
    im.convert('RGB').save(A('f_satchange.jpg'), quality=88)

    # ---- detail pairs: A 2015 | A 2025   B 2015 | B 2025
    T = 520; gap = 18; ggap = 46
    out = Image.new('RGB', (4 * T + 2 * gap + ggap, T + 70), 'white'); od = ImageDraw.Draw(out)
    def crop(img, x, y, blur=False):
        c = img[y - half:y + half, x - half:x + half]
        c = cv2.resize(c, (T, T), interpolation=cv2.INTER_CUBIC)
        c = cv2.convertScaleAbs(c, alpha=1.12, beta=4)
        return Image.fromarray(cv2.cvtColor(c, cv2.COLOR_BGR2RGB))
    x0 = 0
    for i, (x, y) in enumerate(spots):
        for j, (img, yr) in enumerate([(a, '2015'), (b, '2025')]):
            px = x0 + j * (T + gap)
            out.paste(crop(img, x, y), (px, 0))
            chip(od, px + 14, 14, yr, 30, fill=NAVY if yr == '2015' else CRIM)
        chip(od, x0, T + 14, 'AB'[i], 30)
        od.text((x0 + 56, T + 16), 'Area %s  ·  same frame, 10 years apart' % 'AB'[i], font=font(30), fill=(91, 102, 118))
        x0 += 2 * T + gap + ggap
    out.save(A('f_satdetail.jpg'), quality=88)
    return stats

if __name__ == '__main__':
    run()
