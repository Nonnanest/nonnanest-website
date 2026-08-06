#!/usr/bin/env python3
"""
Nonnanest partial sync.

Stamps the canonical nav.html and footer.html from _partials/ into every
tracked HTML page between PARTIAL markers. Also ensures every page links
css/site-chrome.css from its <head>.

Usage:
    python3 _partials/sync.py

Idempotent — safe to run repeatedly.
Bootstraps automatically: if a page has no PARTIAL markers, this looks
for an existing <nav>/<footer> and wraps it, then replaces content.
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
NAV_HTML = (REPO / "_partials" / "nav.html").read_text()
FOOTER_HTML = (REPO / "_partials" / "footer.html").read_text()
CSS_LINK = '<link rel="stylesheet" href="/css/site-chrome.css">'

# All pages that should carry global nav + footer.
# Add new pages here as the site grows.
PAGES = [
    "index.html",
    "blog/index.html",
    "shop/index.html",
    "press/index.html",
    "press/company-profile-preorders-open/index.html",
    "press/nappa-award-winner-2026/index.html",
    "press/patent-pending-april-2026/index.html",
    "support/index.html",
    "quickstart/index.html",
    "understanding-readings/index.html",
    "nursery-checklist/index.html",
    "feedback/index.html",
    "shipping/index.html",
    "returns/index.html",
    "privacy-policy/index.html",
    "terms/index.html",
    "guide/index.html",
    "story/index.html",
    "wellness/index.html",
    "privacy/index.html",
]

NAV_START = "<!-- PARTIAL:nav-start -->"
NAV_END = "<!-- PARTIAL:nav-end -->"
FOOTER_START = "<!-- PARTIAL:footer-start -->"
FOOTER_END = "<!-- PARTIAL:footer-end -->"

# Regexes for bootstrap (first sync only)
existing_nav = re.compile(
    r"<nav\b[^>]*>.*?</nav>\s*(?:<div\s+class=\"mobile-nav\"[^>]*>.*?</div>)?",
    re.DOTALL,
)
existing_footer = re.compile(r"<footer\b[^>]*>.*?</footer>", re.DOTALL)
marked_nav = re.compile(re.escape(NAV_START) + r".*?" + re.escape(NAV_END), re.DOTALL)
marked_footer = re.compile(re.escape(FOOTER_START) + r".*?" + re.escape(FOOTER_END), re.DOTALL)


def stamp_page(page_path: Path, report: list) -> None:
    if not page_path.exists():
        report.append(f"  skip (missing): {page_path.relative_to(REPO)}")
        return

    html = page_path.read_text()
    orig = html

    # 1. Ensure <link> to shared chrome CSS
    if 'href="/css/site-chrome.css"' not in html:
        html = re.sub(
            r"</head>",
            f'  {CSS_LINK}\n</head>',
            html,
            count=1,
        )

    # 2. Nav: wrap existing OR replace marked block
    canonical_nav = f"{NAV_START}\n{NAV_HTML.rstrip()}\n{NAV_END}"
    if marked_nav.search(html):
        html = marked_nav.sub(canonical_nav, html)
    elif existing_nav.search(html):
        html = existing_nav.sub(canonical_nav, html, count=1)
    else:
        # Insert after opening <body> tag
        html = re.sub(
            r"(<body[^>]*>)",
            r"\1\n" + canonical_nav,
            html,
            count=1,
        )

    # 3. Footer: same pattern
    canonical_footer = f"{FOOTER_START}\n{FOOTER_HTML.rstrip()}\n{FOOTER_END}"
    if marked_footer.search(html):
        html = marked_footer.sub(canonical_footer, html)
    elif existing_footer.search(html):
        html = existing_footer.sub(canonical_footer, html, count=1)
    else:
        # Insert before closing </body> tag
        html = re.sub(
            r"</body>",
            canonical_footer + "\n</body>",
            html,
            count=1,
        )

    if html != orig:
        page_path.write_text(html)
        report.append(f"  ✓ {page_path.relative_to(REPO)}")
    else:
        report.append(f"  = {page_path.relative_to(REPO)} (unchanged)")


def main() -> int:
    print(f"Syncing partials across {len(PAGES)} pages...")
    report = []
    for page in PAGES:
        stamp_page(REPO / page, report)
    print("\n".join(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
