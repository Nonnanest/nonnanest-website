#!/usr/bin/env python3
"""
Nonnanest SEO sync.

Stamps structured data and the blog post footer into every page, between
PARTIAL markers, from what each page already says about itself:

  - Organization JSON-LD on every indexable page, from organization.json
  - Article JSON-LD on every blog post and /learn/ hub, built from the
    page's <title>, meta description, canonical and og:image
  - BreadcrumbList JSON-LD on every indexable page except the homepage
  - The BlogPostFooter (post-footer.html) at the end of every blog post,
    with a per-post "Related reading" block from CLUSTERS below

Usage:
    python3 _partials/sync_seo.py            # stamp
    python3 _partials/sync_seo.py --check    # verify only, no writes

Idempotent - safe to run repeatedly.

The head tags are the source of truth. Edit a post's <title> or meta
description, re-run, and its Article headline and breadcrumb follow.
--check exits non-zero when any page's stamped blocks have drifted from
its head tags, the same silent failure sync_faq_schema.py guards against.

Dates, author and image are read back from the page's current Article
block, so they survive re-runs. To mark a post as updated, change its
dateModified inside the block and re-run.
"""
from __future__ import annotations  # keeps this runnable on macOS system python 3.9

import html
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE = "https://www.nonnanest.com"
ORGANIZATION = json.loads((REPO / "_partials" / "organization.json").read_text())
POST_FOOTER = (REPO / "_partials" / "post-footer.html").read_text()
POST_FOOTER_CSS = '<link rel="stylesheet" href="/css/post-footer.css">'
DEFAULT_IMAGE = f"{SITE}/images/nonnanest-og.jpg"

AUTHOR = {"@type": "Person", "name": "Nathan Overbey", "url": f"{SITE}/story/"}
PUBLISHER = {
    "@type": "Organization",
    "@id": ORGANIZATION["@id"],
    "name": ORGANIZATION["name"],
    "logo": {"@type": "ImageObject", "url": ORGANIZATION["logo"]},
}

# Topic clusters. Each hub links to its posts, and each post's footer
# links back to its hub plus up to three siblings, in this order. A post
# in no cluster gets a single link to the blog index.
CLUSTERS = {
    "learn/skin-temperature": [
        "why-does-baby-feel-warm-at-night",
        "contact-free-baby-monitors-why-skin-temperature-matters",
    ],
    "learn/non-wearable-monitors": [
        "non-wearable-baby-monitor-guide",
        "wearable-vs-contactless-baby-monitors",
        "why-wearables-arent-always-the-best-choice",
        "contact-free-baby-monitors-why-skin-temperature-matters",
    ],
    "learn/baby-monitor-privacy": [
        "do-baby-monitors-need-wifi",
        "wifi-vs-fhss-baby-monitor-connectivity",
        "offline-baby-wellness-monitor",
        "baby-monitors-no-subscription",
        "what-happens-when-baby-monitor-company-shuts-down",
    ],
}

# A post can sit in more than one cluster's hub list, but its footer
# links to one hub. Listed here when that hub isn't the first match.
HOME_HUB = {
    "contact-free-baby-monitors-why-skin-temperature-matters": "learn/skin-temperature",
}

# Short breadcrumb labels for pages whose <title> is written for the
# search result, so the trail reads Home > Shop, not Home > Order ...
SECTION_NAMES = {
    "blog": "Blog",
    "press": "Press",
    "learn": "Learn",
    "shop": "Shop",
    "awards": "Awards",
}

SCHEMA_START = "<!-- PARTIAL:seo-schema-start -->"
SCHEMA_END = "<!-- PARTIAL:seo-schema-end -->"
FOOTER_START = "<!-- PARTIAL:post-footer-start -->"
FOOTER_END = "<!-- PARTIAL:post-footer-end -->"

marked_schema = re.compile(re.escape(SCHEMA_START) + r".*?" + re.escape(SCHEMA_END) + r"\n?", re.DOTALL)
marked_footer = re.compile(re.escape(FOOTER_START) + r".*?" + re.escape(FOOTER_END), re.DOTALL)
ld_block = re.compile(r'[ \t]*<script type="application/ld\+json">(.*?)</script>\n?', re.DOTALL)
# Every post ends its article body, then closes <article>.
article_body_end = re.compile(r"\n</div>\s*\n</article>")

title_re = re.compile(r"<title>(.*?)</title>", re.DOTALL)
desc_re = re.compile(r'<meta name="description" content="([^"]*)"')
canonical_re = re.compile(r'rel="canonical"\s+href="([^"]+)"')
og_image_re = re.compile(r'property="og:image" content="([^"]+)"')
noindex_re = re.compile(r'name="robots"\s+content="[^"]*noindex')
brand_suffix = re.compile(r"\s*(?:—|&mdash;|\||-)\s*(?:SightAware(?:™)? by )?Nonnanest\s*$")

ARTICLE_KEYS = {
    "@context", "@type", "headline", "description", "image", "datePublished",
    "dateModified", "author", "publisher", "mainEntityOfPage",
}


def rel_dir(path: Path) -> str:
    """'blog/some-post' for blog/some-post/index.html, '' for the homepage."""
    rel = path.relative_to(REPO).parent.as_posix()
    return "" if rel == "." else rel


def kind_of(rel: str) -> str:
    parts = rel.split("/") if rel else []
    if not parts:
        return "home"
    if len(parts) == 2 and parts[0] == "blog":
        return "post"
    if len(parts) == 2 and parts[0] == "learn":
        return "hub"
    return "page"


def page_title(page_html: str) -> str:
    match = title_re.search(page_html)
    if not match:
        return ""
    return brand_suffix.sub("", html.unescape(match.group(1)).strip())


def first(pattern: re.Pattern, page_html: str) -> str:
    match = pattern.search(page_html)
    return html.unescape(match.group(1)) if match else ""


def pages() -> list[Path]:
    found = []
    for path in sorted(REPO.rglob("index.html")):
        if {".git", "Brand", "_partials", "node_modules"} & set(path.parts):
            continue
        if noindex_re.search(path.read_text()):
            continue
        found.append(path)
    return found


def ld_blocks(page_html: str):
    """(match, parsed json) for every JSON-LD block on the page."""
    for match in ld_block.finditer(page_html):
        try:
            yield match, json.loads(match.group(1))
        except json.JSONDecodeError:
            yield match, None


def first_commit_date(path: Path) -> str:
    try:
        out = subprocess.run(
            ["git", "log", "--diff-filter=A", "--follow", "--format=%as", "--", str(path)],
            cwd=REPO, capture_output=True, text=True, check=False,
        ).stdout.split()
    except OSError:
        out = []
    return out[-1] if out else date.today().isoformat()


def build_article(path: Path, page_html: str, previous: dict | None) -> dict:
    previous = previous or {}
    author = previous.get("author")
    if not isinstance(author, dict) or author.get("@type") != "Person" or author.get("name") in ("Nathan", "Nathan Overbey"):
        author = AUTHOR
    image = previous.get("image") or first(og_image_re, page_html) or DEFAULT_IMAGE
    published = previous.get("datePublished") or first_commit_date(path)

    article = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": page_title(page_html),
        "description": first(desc_re, page_html),
        "image": image,
        "datePublished": published,
        "dateModified": previous.get("dateModified") or published,
        "author": author,
        "publisher": PUBLISHER,
        "mainEntityOfPage": {"@type": "WebPage", "@id": first(canonical_re, page_html)},
    }
    # Keep anything a post added by hand, like "about" on the offline post.
    for key, value in previous.items():
        if key not in ARTICLE_KEYS:
            article[key] = value
    return article


def build_breadcrumb(rel: str, page_html: str) -> dict:
    parts = rel.split("/")
    trail = [("Home", f"{SITE}/")]
    for i, segment in enumerate(parts[:-1]):
        trail.append((SECTION_NAMES.get(segment, segment.replace("-", " ").title()), f"{SITE}/{'/'.join(parts[: i + 1])}/"))
    leaf = SECTION_NAMES.get(rel) or page_title(page_html)
    trail.append((leaf, first(canonical_re, page_html) or f"{SITE}/{rel}/"))
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": n, "name": name, "item": url}
            for n, (name, url) in enumerate(trail, start=1)
        ],
    }


def render(blocks: list[dict]) -> str:
    scripts = [
        '<script type="application/ld+json">\n' + json.dumps(b, indent=2, ensure_ascii=False) + "\n</script>"
        for b in blocks
    ]
    return SCHEMA_START + "\n" + "\n".join(scripts) + "\n" + SCHEMA_END + "\n"


def stamp_schema(path: Path, page_html: str) -> str:
    rel = rel_dir(path)
    kind = kind_of(rel)

    marked = marked_schema.search(page_html)
    inside = marked.group(0) if marked else ""
    outside = page_html.replace(inside, "") if inside else page_html

    previous_article = None
    bootstrap_article = None  # unmarked Article block to replace on first run
    for match, data in ld_blocks(inside or outside):
        if isinstance(data, dict) and data.get("@type") == "Article":
            previous_article = data
            if not inside:
                bootstrap_article = match
            break

    blocks = [ORGANIZATION]
    if kind in ("post", "hub"):
        blocks.append(build_article(path, page_html, previous_article))
    if kind != "home" and "BreadcrumbList" not in outside:
        blocks.append(build_breadcrumb(rel, page_html))
    block = render(blocks)

    if marked:
        return page_html[: marked.start()] + block + page_html[marked.end():]
    if bootstrap_article is not None and kind in ("post", "hub"):
        return page_html[: bootstrap_article.start()] + block + page_html[bootstrap_article.end():]
    head_end = page_html.index("</head>")
    return page_html[:head_end] + block + page_html[head_end:]


def home_hub(slug: str) -> str | None:
    if slug in HOME_HUB:
        return HOME_HUB[slug]
    for hub, posts in CLUSTERS.items():
        if slug in posts:
            return hub
    return None


def related_reading(slug: str, titles: dict[str, str]) -> str:
    hub = home_hub(slug)
    if hub is None:
        links = [("/blog/", "More from the Nonnanest blog")]
    else:
        siblings = [s for s in CLUSTERS[hub] if s != slug][:3]
        links = [(f"/{hub}/", titles[hub])] + [(f"/blog/{s}/", titles[f"blog/{s}"]) for s in siblings]
    items = "\n".join(
        f'      <li><a href="{href}">{html.escape(text, quote=False)}</a></li>' for href, text in links
    )
    return (
        '  <div class="related-reading">\n'
        "    <h3>Related reading</h3>\n"
        "    <ul>\n" + items + "\n    </ul>\n"
        "  </div>\n"
    )


def stamp_footer(path: Path, page_html: str, titles: dict[str, str]) -> str:
    slug = path.parent.name
    footer = POST_FOOTER.replace("{{related}}", related_reading(slug, titles).rstrip("\n")).rstrip()
    block = f"{FOOTER_START}\n{footer}\n{FOOTER_END}"

    if marked_footer.search(page_html):
        page_html = marked_footer.sub(lambda _: block, page_html, count=1)
    else:
        ends = list(article_body_end.finditer(page_html))
        if len(ends) != 1:
            raise ValueError("cannot find the end of the article body")
        at = ends[0].start()
        page_html = page_html[:at] + "\n" + block + page_html[at:]

    if POST_FOOTER_CSS not in page_html:
        page_html = page_html.replace("</head>", f"  {POST_FOOTER_CSS}\n</head>", 1)
    return page_html


def main() -> int:
    check_only = "--check" in sys.argv
    targets = pages()
    titles = {rel_dir(p): page_title(p.read_text()) for p in targets}
    for hub in CLUSTERS:
        if hub not in titles:
            print(f"✗ hub page {hub}/index.html is missing")
            return 1

    print(f"{'Checking' if check_only else 'Syncing'} SEO blocks across {len(targets)} indexable pages...")
    report, ok = [], True
    for path in targets:
        rel = path.relative_to(REPO).as_posix()
        page_html = path.read_text()
        try:
            updated = stamp_schema(path, page_html)
            if kind_of(rel_dir(path)) == "post":
                updated = stamp_footer(path, updated, titles)
        except ValueError as err:
            report.append(f"  ✗ {rel}: {err}")
            ok = False
            continue

        if updated == page_html:
            report.append(f"  = {rel}")
        elif check_only:
            report.append(f"  ✗ {rel}: structured data or post footer has drifted")
            ok = False
        else:
            path.write_text(updated)
            report.append(f"  ✓ {rel}")
    print("\n".join(report))

    if not ok:
        print("\n✗ SEO blocks are out of sync.\n  Run: python3 _partials/sync_seo.py")
        return 1
    print("\n✓ Every page's SEO blocks match its head tags.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
