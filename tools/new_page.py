"""Yangi sahifa yaratish: salfetka.html dagi header/footer'ni olib, title, description va body'ni almashtiradi.
Ishlatish: python3 tools/new_page.py <fayl.html> <title> <description> <body_fayl> [qo'shimcha script ...]"""
import re, sys

out, title, desc, body_file, *scripts = sys.argv[1:]
s = open("salfetka.html", encoding="utf-8").read()
s = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", s)
s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">', s)
a = s.index('  <section class="page-hero"')
b = s.index("  <footer")
s = s[:a] + open(body_file, encoding="utf-8").read() + s[b:]
if scripts:
    tags = "".join(f'\n  <script src="{src}"></script>' for src in scripts)
    s = s.replace('<script src="js/main.js"></script>', '<script src="js/main.js"></script>' + tags)
open(out, "w", encoding="utf-8").write(s)
print("yaratildi:", out)
