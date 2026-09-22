#!/usr/bin/env python3
"""
Nonnanest FAQ schema sync.

Generates each page's FAQPage JSON-LD from the FAQ that page actually
shows, and stamps it between PARTIAL markers. The visible FAQ is the
source of truth: it is the copy that went through voice review, and
Google expects FAQ markup to mirror what the reader sees.

Usage:
    python3 _partials/sync_faq_schema.py            # stamp
    python3 _partials/sync_faq_schema.py --check    # verify only, no writes

Idempotent - safe to run repeatedly.
Bootstraps automatically: if a page has no PARTIAL markers, this finds
the existing FAQPage <script> block and wraps it, then replaces content.

--check writes nothing and exits non-zero if any page's schema has
drifted from its visible FAQ. That is the mode worth wiring into a
pre-commit hook or CI, because the failure it catches is silent: an
edit to a visible answer leaves the markup behind, and nothing on the
rendered page looks wrong.

Adding a page: append it to FAQ_PAGES. The page needs a visible FAQ in
one of the two shapes below and an existing FAQPage block to bootstrap
from (or the markers already in place).
"""
import html
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Pages carrying a visible FAQ whose schema should be generated from it.
FAQ_PAGES = [
    "index.html",
    "shop/index.html",
]

START = "<!-- PARTIAL:faq-schema-start -->"
END = "<!-- PARTIAL:faq-schema-end -->"

# The two FAQ shapes in this codebase. Homepage uses a click-to-open
# accordion; the shop page uses plain headings. Tried in order.
ACCORDION = re.compile(
    r'<div class="faq-item[^"]*">\s*'
    r'<div class="faq-question"[^>]*>(.*?)</div>\s*'
    r'<div class="faq-answer">(.*?)</div>\s*</div>',
    re.DOTALL,
)
HEADINGS = re.compile(
    r'<div class="faq-item[^"]*">\s*<h3>(.*?)</h3>\s*<p>(.*?)</p>\s*</div>',
    re.DOTALL,
)

marked = re.compile(re.escape(START) + r".*?" + re.escape(END), re.DOTALL)
ld_block = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.DOTALL)

# A link ending in an arrow is a "read more" CTA, not part of the answer.
# It stays on the page and is dropped from the markup, because schema
# answers should read as prose rather than navigation.
trailing_cta = re.compile(
    r"<a\b[^>]*>[^<]*→\s*</a>(?:\s|</[a-z]+>)*$", re.IGNORECASE
)


def text_of(fragment: str) -> str:
    """Visible text of an HTML fragment, as a reader would read it."""
    fragment = re.sub(r"<svg\b.*?</svg>", "", fragment, flags=re.DOTALL | re.IGNORECASE)
    fragment = trailing_cta.sub("", fragment.strip())
    # Tags become a space so block boundaries do not glue words together,
    # then the space an inline tag leaves before punctuation is taken back
    # out - <strong>only</strong>. should read "only." and not "only .".
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    text = re.sub(r"\s+", " ", html.unescape(fragment)).strip()
    return re.sub(r"\s+([.,;:!?%])", r"\1", text)


def read_faq(page_html: str) -> list[tuple[str, str]]:
    """Every (question, answer) pair the page visibly shows, in order."""
    for pattern in (ACCORDION, HEADINGS):
        pairs = [(text_of(q), text_of(a)) for q, a in pattern.findall(page_html)]
        if pairs:
            return pairs
    return []


def existing_id(page_html: str) -> str | None:
    """The @id on the page's current FAQPage block, if it set one."""
    for body in ld_block.findall(page_html):
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            continue
        if data.get("@type") == "FAQPage":
            return data.get("@id")
    return None


def build_schema(pairs: list[tuple[str, str]], faq_id: str | None) -> str:
    """FAQPage JSON-LD, formatted to match the hand-written blocks."""
    head = ['{', '  "@context": "https://schema.org",', '  "@type": "FAQPage",']
    if faq_id:
        head.append(f'  "@id": {json.dumps(faq_id, ensure_ascii=False)},')
    head.append('  "mainEntity": [')

    questions = []
    for question, answer in pairs:
        questions.append(
            "    {\n"
            '      "@type": "Question",\n'
            f'      "name": {json.dumps(question, ensure_ascii=False)},\n'
            '      "acceptedAnswer": { "@type": "Answer", "text": '
            f"{json.dumps(answer, ensure_ascii=False)} }}\n"
            "    }"
        )
    return "\n".join(head) + "\n" + ",\n".join(questions) + "\n  ]\n}"


def wrap_existing(page_html: str) -> str | None:
    """Put markers around the page's current FAQPage block (first run)."""
    for match in ld_block.finditer(page_html):
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue
        if data.get("@type") != "FAQPage":
            continue
        opening = '<script type="application/ld+json">'
        wrapped = f"{START}\n{opening}\n{{schema}}\n</script>\n{END}"
        return page_html[: match.start()] + wrapped + page_html[match.end():]
    return None


def sync_page(rel: str, check_only: bool, report: list) -> bool:
    """Stamp one page. Returns True if it is in sync (or was fixed)."""
    path = REPO / rel
    if not path.exists():
        report.append(f"  skip (missing): {rel}")
        return True

    page_html = path.read_text()
    pairs = read_faq(page_html)
    if not pairs:
        report.append(f"  ✗ {rel}: no visible FAQ found")
        return False

    schema = build_schema(pairs, existing_id(page_html))

    if marked.search(page_html):
        block = f"{START}\n" + '<script type="application/ld+json">\n' + schema + "\n</script>\n" + END
        updated = marked.sub(lambda _: block, page_html, count=1)
    else:
        template = wrap_existing(page_html)
        if template is None:
            report.append(f"  ✗ {rel}: no FAQPage block to bootstrap from")
            return False
        updated = template.replace("{schema}", schema)

    if updated == page_html:
        report.append(f"  = {rel} ({len(pairs)} Q&A, unchanged)")
        return True

    if check_only:
        report.append(f"  ✗ {rel}: schema has drifted from the visible FAQ")
        return False

    path.write_text(updated)
    report.append(f"  ✓ {rel} ({len(pairs)} Q&A)")
    return True


def main() -> int:
    check_only = "--check" in sys.argv
    mode = "Checking" if check_only else "Syncing"
    print(f"{mode} FAQ schema across {len(FAQ_PAGES)} pages...")

    report: list[str] = []
    ok = all([sync_page(page, check_only, report) for page in FAQ_PAGES])
    print("\n".join(report))

    if not ok:
        print(
            "\n✗ FAQ schema is out of sync with the visible FAQ."
            "\n  Run: python3 _partials/sync_faq_schema.py"
        )
        return 1
    print("\n✓ Every FAQ page's schema matches what the page shows.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
