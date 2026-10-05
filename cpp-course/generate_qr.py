#!/usr/bin/env python3
"""
Generate QR codes for the C++ course.

Reads course.json, then writes one PNG per lecture (plus a course-home QR and
one per project) into ./qr/, each pointing at the GitHub Pages URL.

Usage:
    python generate_qr.py                      # uses baseUrl from course.json
    python generate_qr.py https://you.github.io/cpp-course   # override baseUrl

After running, open qr/index.html to print all codes on one sheet.
"""
import json, sys, os
import qrcode
from qrcode.constants import ERROR_CORRECT_M

ROOT = os.path.dirname(os.path.abspath(__file__))
NAVY = (15, 42, 67)        # #0F2A43
WHITE = (255, 255, 255)

def make(url, out):
    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_M,
                       box_size=12, border=3)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=NAVY, back_color=WHITE).convert("RGB")
    img.save(out)
    return url

def main():
    with open(os.path.join(ROOT, "course.json"), encoding="utf-8") as f:
        course = json.load(f)

    base = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else course["baseUrl"].rstrip("/")
    qrdir = os.path.join(ROOT, "qr")
    os.makedirs(qrdir, exist_ok=True)

    entries = []  # (label, filename, url)

    # course home
    url = make(base + "/", os.path.join(qrdir, "home.png"))
    entries.append(("Course Home", "home.png", url))

    # lectures
    for l in course["lectures"]:
        u = f"{base}/{l['id']}/"
        make(u, os.path.join(qrdir, f"{l['id']}.png"))
        entries.append((f"L{l['number']:02d} · {l['title']}", f"{l['id']}.png", u))

    # projects
    for p in course["projects"]:
        u = f"{base}/projects/{p['id']}.html"
        make(u, os.path.join(qrdir, f"{p['id']}.png"))
        entries.append((p["title"], f"{p['id']}.png", u))

    # printable sheet
    cards = "\n".join(
        f'''<div class="qr">
          <img src="{fn}" alt="QR for {lbl}">
          <div class="lbl">{lbl}</div>
          <div class="url">{u}</div>
        </div>''' for (lbl, fn, u) in entries)

    html = f"""<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Course QR Codes</title>
<style>
  body{{font-family:'Inter',system-ui,sans-serif;background:#F4F7FA;color:#1B2A38;margin:0;padding:28px}}
  h1{{font-family:Georgia,serif;color:#0F2A43;margin:0 0 4px}}
  p.sub{{color:#5B6B7A;margin:0 0 24px}}
  .grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}}
  .qr{{background:#fff;border:1px solid #E6ECF2;border-radius:14px;padding:16px;text-align:center;
       box-shadow:0 4px 12px rgba(17,32,46,.06)}}
  .qr img{{width:100%;max-width:190px;height:auto;image-rendering:pixelated}}
  .lbl{{font-weight:700;font-size:14px;margin-top:8px;color:#174A7C}}
  .url{{font-size:10.5px;color:#8A97A3;word-break:break-all;margin-top:3px}}
  @media print{{body{{background:#fff}}.qr{{box-shadow:none;break-inside:avoid}}}}
</style></head><body>
<h1>Programming with C++ — QR Codes</h1>
<p class="sub">Scan to open each lecture. Base URL: {base}</p>
<div class="grid">
{cards}
</div></body></html>"""
    with open(os.path.join(qrdir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Generated {len(entries)} QR codes in qr/ (base: {base})")
    print("Open qr/index.html to view/print them all.")
    if "USERNAME" in base:
        print("\n⚠  Base URL still contains USERNAME — edit course.json (baseUrl)")
        print("   or run:  python generate_qr.py https://YOURNAME.github.io/cpp-course")

if __name__ == "__main__":
    main()
