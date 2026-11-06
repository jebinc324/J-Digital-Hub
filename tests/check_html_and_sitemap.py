#!/usr/bin/env python3
"""Offline static HTML, local-link, metadata and sitemap checks."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1] / "public"
pages = sorted(root.rglob("*.html"))

class Scan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.canonical, self.og, self.h1 = [], [], set(), 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "h1":
            self.h1 += 1
        if tag in ("a", "link", "script", "img", "iframe"):
            attr = "href" if tag in ("a", "link") else "src"
            if attrs.get(attr):
                self.refs.append(attrs[attr])
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical.append(attrs.get("href"))
        if tag == "meta" and attrs.get("property", "").startswith("og:"):
            self.og.add(attrs["property"])
    handle_startendtag = handle_starttag

canonical_urls = set()
missing = []
for page in pages:
    data = page.read_text(encoding="utf-8")
    parser = Scan()
    parser.feed(data)
    assert parser.h1 == 1, f"{page}: expected exactly one h1, got {parser.h1}"
    assert len(parser.canonical) == 1, f"{page}: expected a single canonical"
    assert "og:title" in parser.og, f"{page}: missing Open Graph title"
    canonical_urls.add(parser.canonical[0])
    assert 'name="description"' in data, f"{page}: missing description"
    for ref in parser.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc or ref.startswith("#") or ref.startswith("//"):
            continue
        raw = unquote(parsed.path)
        if not raw:
            continue
        target = (root / raw.lstrip("/")) if raw.startswith("/") else (page.parent / raw)
        if raw.endswith("/") or target.is_dir():
            target = target / "index.html"
        if not target.exists() or not target.resolve().is_relative_to(root.resolve()):
            missing.append((str(page.relative_to(root)), ref))
assert not missing, f"Invalid local references: {missing}"
site = ET.parse(root / "sitemap.xml").getroot()
urls = {x.text for x in site.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
assert urls == canonical_urls, f"Sitemap/canonical drift: missing={canonical_urls-urls}, extra={urls-canonical_urls}"
retro = (root / "games/retro-arcade/index.html").read_text(encoding="utf-8")
for name in ("rgbPicker", "playerName", "roomCodeInput"):
    import re
    match = re.search(r'<input\b[^>]*id="' + name + r'"[^>]*>', retro)
    assert match and 'aria-label="' in match.group(), f"Missing accessible label: {name}"
assert "user-scalable=no" not in retro
print(f"HTML verified: {len(pages)} pages, canonicals, local links, OG and controls")
