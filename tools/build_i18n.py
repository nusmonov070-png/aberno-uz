"""Rus va ingliz tilidagi sahifalarni o'zbekcha sahifalardan yasaydi.

Ishlatish (loyiha papkasida):  python3 tools/build_i18n.py

- Manba: ildizdagi *.html (o'zbekcha). Natija: ru/*.html va en/*.html — ularni qo'lda tahrirlamang.
- Tarjimalar: i18n/ru.json va i18n/en.json — kalit o'zbekcha matn (bo'sh joylari bitta probelga
  qisqartirilgan), qiymat tarjima. Ichki <b>, <a> kabi teglar tarjimada ham saqlanishi kerak.
- Tarjimasi topilmagan matnlar i18n/missing-ru.json va i18n/missing-en.json ga yoziladi.
- O'zbekcha sahifalardagi til tugmalari (UZ / RU / EN) va hreflang havolalari ham shu skript bilan yangilanadi.
"""
import glob
import json
import os
import re
import sys

BASE_URL = "https://nusmonov070-png.github.io/aberno-uz/"
LANGS = ["ru", "en"]
LANG_NAMES = {"uz": "UZ", "ru": "RU", "en": "EN"}

# Ichki tarkibi bilan birga bitta butun matn sifatida tarjima qilinadigan teglar
BLOCK_TAGS = ["title", "h1", "h2", "h3", "h4", "p", "li", "figcaption", "label", "option", "button", "dt", "dd", "th", "td"]
# Blok ichida ruxsat etilgan "matn ichidagi" teglar
INLINE_TAGS = {"b", "strong", "a", "small", "br", "i", "em", "span", "sup"}
TRANSLATED_ATTRS = ["alt", "placeholder", "title", "aria-label"]
ASSET_PREFIXES = ("css/", "js/", "images/", "docs/", "google-apps-script/")

norm = lambda s: re.sub(r"\s+", " ", s).strip()

# Tarjima qilinmaydigan so'zlar: brendlar, ijtimoiy tarmoqlar, qisqartmalar
KEEP_WORDS = {
    "Aberno", "ABERNO", "Group", "GROUP", "Butters", "Margaritto", "Smaylo", "Bulut", "Universal", "Pastry", "Longer",
    "Premium", "Gold", "Telegram", "Instagram", "WhatsApp", "HoReCa", "ISO", "HACCP", "PDF", "UZ", "RU", "EN",
    "V", "Z", "g", "kg", "aberno", "uz", "Website",
}


def needs_translation(text):
    """Faqat brend nomlari, raqamlar, telefon, email kabi matnlar tarjima qilinmaydi."""
    t = re.sub(r"<[^>]+>", " ", text)
    t = re.sub(r"&\w+;|&#\d+;", " ", t)
    t = re.sub(r"https?://\S+|\S+@\S+|@\w+", " ", t)
    words = re.findall(r"[A-Za-zʻʼ'’]+", t)
    # Faqat brend nomlari va qisqartmalardan iborat matn tarjima qilinmaydi
    return any(w not in KEEP_WORDS for w in words)


def protect(html, pattern, store):
    def keep(m):
        store.append(m.group(0))
        return f"\x00{len(store) - 1}\x00"
    return re.sub(pattern, keep, html, flags=re.S | re.I)


def restore(html, store):
    while "\x00" in html:
        html = re.sub(r"\x00(\d+)\x00", lambda m: store[int(m.group(1))], html)
    return html


def translate(html, d, missing):
    store = []
    # 1) script, style, svg va izohlar — tegilmaydi
    html = protect(html, r"<script\b.*?</script>|<style\b.*?</style>|<svg\b.*?</svg>|<!--.*?-->", store)

    # 2) Blok teglar: ichki matni butunligicha
    def block(m):
        tag, attrs, inner = m.group(1), m.group(2) or "", m.group(3)
        inner_tags = {t.lower() for t in re.findall(r"</?\s*([a-zA-Z0-9]+)", inner)}
        if not inner_tags <= INLINE_TAGS or "\x00" in inner:
            return m.group(0)
        key = norm(inner)
        if not needs_translation(key):
            store.append(m.group(0))
        elif key in d:
            store.append(f"<{tag}{attrs}>{d[key]}</{tag}>")
        else:
            missing[key] = ""
            store.append(m.group(0))
        return f"\x00{len(store) - 1}\x00"

    for tag in BLOCK_TAGS:
        html = re.sub(rf"<({tag})(\s[^>]*)?>(.*?)</\1>", block, html, flags=re.S)

    # 3) Atributlar (tarjima qilingan bloklar ichida ham — shuning uchun avval restore emas, keyin alohida)
    def attr(m):
        name, q, val = m.group(1), m.group(2), m.group(3)
        key = norm(val)
        if not needs_translation(key):
            return m.group(0)
        if key in d:
            return f'{name}={q}{d[key]}{q}'
        missing[key] = ""
        return m.group(0)

    attr_re = r'\b(' + "|".join(TRANSLATED_ATTRS) + r')=(["\'])(.*?)\2'

    # 4) Qolgan oddiy matn bo'laklari (masalan, <span>, <a>, <div> ichidagi)
    def text(m):
        raw = m.group(1)
        key = norm(raw)
        if not needs_translation(key):
            return m.group(0)
        lead = raw[: len(raw) - len(raw.lstrip())]
        trail = raw[len(raw.rstrip()):]
        if key in d:
            return ">" + lead + d[key] + trail + "<"
        missing[key] = ""
        return m.group(0)

    html = re.sub(r">([^<>\x00]+)<", text, html)
    html = restore(html, store)
    html = re.sub(attr_re, attr, html)

    # meta description
    def meta(m):
        key = norm(m.group(1))
        if key in d:
            return f'<meta name="description" content="{d[key]}">'
        missing[key] = ""
        return m.group(0)
    html = re.sub(r'<meta name="description" content="([^"]*)">', meta, html)
    return html


def fix_paths(html):
    """ru/ va en/ papkalari bir daraja ichkarida — fayl yo'llarini moslash."""
    def href(m):
        attr, q, val = m.group(1), m.group(2), m.group(3)
        if val.startswith(ASSET_PREFIXES):
            val = "../" + val
        return f"{attr}={q}{val}{q}"
    html = re.sub(r'\b(href|src)=(["\'])([^"\']*)\2', href, html)
    html = re.sub(r"url\((['\"]?)(images/)", r"url(\1../\2", html)
    return html


def lang_switch(page, current):
    links = []
    for lang in ["uz"] + LANGS:
        if current == "uz":
            url = page if lang == "uz" else f"{lang}/{page}"
        else:
            url = f"../{page}" if lang == "uz" else (page if lang == current else f"../{lang}/{page}")
        cls = ' class="active" aria-current="true"' if lang == current else ""
        links.append(f'<a href="{url}" hreflang="{lang}"{cls}>{LANG_NAMES[lang]}</a>')
    return '<nav class="lang-switch" aria-label="Til / Язык / Language">' + "".join(links) + "</nav>"


def hreflang_links(page):
    tail = "" if page == "index.html" else page  # canonical bilan bir xil manzil
    tags = [f'<link rel="alternate" hreflang="uz" href="{BASE_URL}{tail}">']
    tags += [f'<link rel="alternate" hreflang="{l}" href="{BASE_URL}{l}/{tail}">' for l in LANGS]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="{BASE_URL}{tail}">')
    return "\n  ".join(tags)


def with_switch_and_alternates(html, page, lang):
    sw = lang_switch(page, lang)
    if '<nav class="lang-switch"' in html:
        html = re.sub(r'<nav class="lang-switch".*?</nav>', sw, html, flags=re.S)
    else:
        # topbar'dagi telefonlar qatoridan keyin
        html = re.sub(r'(<div class="topbar">\s*<div class="container">.*?)(\s*</div>\s*</div>)',
                      lambda m: m.group(1) + "\n      " + sw + m.group(2), html, count=1, flags=re.S)
    html = re.sub(r'\n  <link rel="alternate" hreflang="[^"]*" href="[^"]*">', "", html)
    html = re.sub(r'(<link rel="stylesheet" href="(?:\.\./)?css/style\.css(?:\?v=\w+)?">)',
                  lambda m: hreflang_links(page) + "\n  " + m.group(1), html, count=1)
    return html


def cache_bust(html, root):
    """css/js havolalariga fayl mazmunidan olingan ?v=... qo'shadi — yangilanishdan keyin brauzer eski faylni ishlatmasin."""
    import hashlib
    def ver(m):
        prefix, path = m.group(1), m.group(2)
        try:
            h = hashlib.md5(open(os.path.join(root, path), "rb").read()).hexdigest()[:8]
        except FileNotFoundError:
            return m.group(0)
        return f'{m.group(0).split("=")[0]}="{prefix}{path}?v={h}"'
    return re.sub(r'\b(?:href|src)="((?:\.\./)?)((?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=\w+)?"', ver, html)


OG_IMAGE = {"salfetka.html": "bulut.jpg", "horeca.html": "bulut.jpg", "retseptlar.html": "retseptlar.jpg",
            "ishlab-chiqarish.html": "ishlab-chiqarish.jpg", "about.html": "ishlab-chiqarish.jpg",
            "karyera.html": "ishlab-chiqarish.jpg"}
OG_LOCALE = {"uz": "uz_UZ", "ru": "ru_RU", "en": "en_US"}


def seo_block(html, page, lang):
    """Google va ijtimoiy tarmoqlar uchun <head> teglari (har yig'ishda qayta yoziladi)."""
    pre = "" if lang == "uz" else "../"
    url = BASE_URL + ("" if lang == "uz" else lang + "/") + ("" if page == "index.html" else page)
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()
    m = re.search(r'<meta name="description" content="([^"]*)">', html)
    desc = m.group(1) if m else ""
    img = BASE_URL + "images/og/" + OG_IMAGE.get(page, "aberno.jpg")
    tags = [
        f'<link rel="canonical" href="{url}">',
        f'<link rel="icon" href="{pre}favicon.ico" sizes="any">',
        f'<link rel="icon" href="{pre}images/icons/icon.svg" type="image/svg+xml">',
        f'<link rel="apple-touch-icon" href="{pre}images/icons/apple-touch-icon.png">',
        f'<link rel="manifest" href="{pre}site.webmanifest">',
        '<meta name="theme-color" content="#173455">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Aberno Group">',
        f'<meta property="og:title" content="{title}">',
        f'<meta property="og:description" content="{desc}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{img}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:locale" content="{OG_LOCALE[lang]}">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    if page == "index.html":
        org = {
            "@context": "https://schema.org", "@type": "Organization", "name": "Aberno Group",
            "url": BASE_URL, "logo": BASE_URL + "images/icons/icon-512.png",
            "telephone": "+998953427070", "email": "abernoinfo@gmail.com",
            "address": {"@type": "PostalAddress", "streetAddress": "Uysozlar 72", "addressLocality": "Tashkent",
                        "addressRegion": "Yashnobod", "addressCountry": "UZ"},
            "sameAs": ["https://instagram.com/aberno.uz", "https://t.me/aberno_uz", "https://aberno.uz"],
            "brand": [{"@type": "Brand", "name": n} for n in ("Margaritto", "Smaylo", "Bulut")],
        }
        tags.append('<script type="application/ld+json">' + json.dumps(org, ensure_ascii=False) + "</script>")
    block = "<!--seo-->\n  " + "\n  ".join(tags) + "\n  <!--/seo-->"
    html = re.sub(r"\n?\s*<!--seo-->.*?<!--/seo-->", "", html, flags=re.S)
    html = re.sub(r'\n\s*<link rel="icon" href="[^"]*logo-mark[^"]*">', "", html)
    return html.replace("</head>", "  " + block + "\n</head>", 1)


def write_sitemap(pages):
    rows = []
    for page in pages:
        tail = "" if page == "index.html" else page
        alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{BASE_URL}{"" if l == "uz" else l + "/"}{tail}"/>'
                       for l in ["uz"] + LANGS)
        for l in ["uz"] + LANGS:
            loc = BASE_URL + ("" if l == "uz" else l + "/") + tail
            rows.append(f"  <url>\n    <loc>{loc}</loc>{alts}\n  </url>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    open("sitemap.xml", "w", encoding="utf-8").write(xml)
    open("robots.txt", "w", encoding="utf-8").write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}sitemap.xml\n")


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    pages = sorted(p for p in glob.glob("*.html") if p != "404.html")
    dicts = {l: json.load(open(f"i18n/{l}.json", encoding="utf-8")) for l in LANGS}
    report = {}

    for page in pages:
        src = open(page, encoding="utf-8").read()
        src = with_switch_and_alternates(src, page, "uz")
        src = seo_block(src, page, "uz")
        src = cache_bust(src, root)
        open(page, "w", encoding="utf-8").write(src)

    for lang in LANGS:
        os.makedirs(lang, exist_ok=True)
        missing = {}
        for page in pages:
            html = open(page, encoding="utf-8").read()
            html = translate(html, dicts[lang], missing)
            html = html.replace('<html lang="uz">', f'<html lang="{lang}">', 1)
            html = fix_paths(html)
            html = with_switch_and_alternates(html, page, lang)
            html = seo_block(html, page, lang)
            html = cache_bust(html, root)
            open(f"{lang}/{page}", "w", encoding="utf-8").write(html)
        path = f"i18n/missing-{lang}.json"
        if missing:
            json.dump(missing, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        elif os.path.exists(path):
            os.remove(path)
        report[lang] = len(missing)

    write_sitemap(pages)
    for lang, n in report.items():
        print(f"{lang}: {len(pages)} sahifa, tarjimasi yo'q matnlar: {n}" + (f" → i18n/missing-{lang}.json" if n else " ✅"))
    return 1 if any(report.values()) else 0


if __name__ == "__main__":
    sys.exit(main())
