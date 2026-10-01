"""images/ dagi JPG/PNG rasmlarni yengil WebP ga o'tkazadi va sahifalardagi havolalarni yangilaydi.

Ishlatish (loyiha papkasida):  python3 tools/optimize_images.py
Talab: Pillow (pip install pillow). So'ng: python3 tools/build_i18n.py (ru/ va en/ ni yangilash uchun).

- Rasm eni MAX_WIDTH dan katta bo'lsa kichraytiriladi; shaffof PNG lar shaffofligicha qoladi.
- images/og/ (ijtimoiy tarmoqlar uchun JPG) va images/icons/ ga tegilmaydi.
- Asl fayl faqat havolalar yangilangandan keyin o'chiriladi.
"""
import glob
import os
import re
import sys

from PIL import Image

QUALITY = 78
MAX_WIDTH = {"hero-products": 1400, "certificates": 1400, "partners/": 192, "logo-mark": 172}
DEFAULT_MAX = 1600
SKIP_DIRS = ("images/og/", "images/icons/")
TEXT_FILES = ["*.html", "js/*.js", "css/*.css"]


def max_width(path):
    for key, w in MAX_WIDTH.items():
        if key in path:
            return w
    return DEFAULT_MAX


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    sources = [p for p in glob.glob("images/**/*", recursive=True)
               if p.lower().endswith((".jpg", ".jpeg", ".png")) and not p.startswith(SKIP_DIRS)]
    if not sources:
        print("O'tkaziladigan rasm yo'q.")
        return 0

    renamed, before, after = {}, 0, 0
    for src in sorted(sources):
        dst = os.path.splitext(src)[0] + ".webp"
        im = Image.open(src)
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        im = im.convert("RGBA" if has_alpha else "RGB")
        mw = max_width(src)
        if im.width > mw:
            im = im.resize((mw, round(im.height * mw / im.width)), Image.LANCZOS)
        im.save(dst, "WEBP", quality=QUALITY if not has_alpha else 82, method=6)
        before += os.path.getsize(src)
        after += os.path.getsize(dst)
        renamed[src] = dst

    # Havolalarni yangilash (o'zbekcha sahifalar, JS, CSS)
    files = [f for pat in TEXT_FILES for f in glob.glob(pat)]
    for f in files:
        s = open(f, encoding="utf-8").read()
        new = s
        for src, dst in renamed.items():
            new = new.replace(src, dst)
        if new != s:
            open(f, "w", encoding="utf-8").write(new)

    # Hech qayerda qolmagan bo'lsa, aslini o'chirish
    texts = "".join(open(f, encoding="utf-8").read() for f in files)
    for src in renamed:
        if src not in texts:
            os.remove(src)
        else:
            print("Diqqat: hali ham ishlatilmoqda, o'chirilmadi:", src)

    print(f"{len(renamed)} ta rasm: {before / 1048576:.1f} MB -> {after / 1048576:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
