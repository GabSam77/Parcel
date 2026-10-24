# Shrinks large images inside a PDF (keeps layout/text). Usage: python3 tools/compress_pdf.py in.pdf out.pdf
import pikepdf, io, sys
from pikepdf import PdfImage, Name
from PIL import Image
src, dst, MAXPX, Q = sys.argv[1], sys.argv[2], 1700, 80
pdf = pikepdf.open(src)
seen=set(); n=0
for page in pdf.pages:
    for name, raw in page.images.items():
        if raw.objgen in seen: continue
        seen.add(raw.objgen)
        if len(raw.read_raw_bytes()) < 150_000: continue
        try:
            im = PdfImage(raw).as_pil_image()
        except Exception as e:
            print('skip', e); continue
        if im.mode not in ('RGB','L'): im = im.convert('RGB')
        s = MAXPX / max(im.size)
        if s < 1: im = im.resize((round(im.width*s), round(im.height*s)), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=Q, optimize=True)
        raw.write(buf.getvalue(), filter=Name.DCTDecode)
        raw.Width, raw.Height = im.width, im.height
        raw.ColorSpace = Name.DeviceRGB if im.mode=='RGB' else Name.DeviceGray
        raw.BitsPerComponent = 8
        for k in ('/DecodeParms','/Decode'):
            if k in raw: del raw[k]
        if '/SMask' in raw:
            sm = raw.SMask
            smi = PdfImage(sm).as_pil_image().convert('L').resize((im.width, im.height), Image.LANCZOS)
            sm.write(smi.tobytes(), filter=Name.FlateDecode) if False else sm.write(__import__('zlib').compress(smi.tobytes()), filter=Name.FlateDecode)
            sm.Width, sm.Height = im.width, im.height
            if '/DecodeParms' in sm: del sm['/DecodeParms']
        n += 1
pdf.save(dst, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
print('recompressed', n)
