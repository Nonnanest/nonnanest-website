# `_partials/` — Nonnanest Site Chrome

This folder is the source of truth for the nav and footer that appear on
every page of nonnanest.com. Because this is a static site with no build
tool, we keep the site cohesive by:

1. Storing the canonical nav and footer HTML in this folder
2. Wrapping each page's nav/footer with `<!-- PARTIAL:nav-* -->` and
   `<!-- PARTIAL:footer-* -->` markers
3. Running `python3 _partials/sync.py` from the repo root to stamp the
   canonical content into every page between the markers

## Files

- `nav.html` — canonical nav (desktop + mobile drawer)
- `footer.html` — canonical footer (4-column grid, social row, wellness disclaimer)
- `sync.py` — stamping script (idempotent, safe to run repeatedly)
- `sync_faq_schema.py` — regenerates FAQ JSON-LD from each page's visible FAQ
- The `.css` that makes it all work lives at `/css/site-chrome.css`

## Editing the nav or footer

1. Edit `_partials/nav.html` or `_partials/footer.html`
2. Run `python3 _partials/sync.py` from the repo root
3. Commit both the partial file and every page the sync touched

## Adding a new page to the sync

Edit the `PAGES` list at the top of `sync.py`. The new page will get the
canonical nav/footer stamped on the next run.

## The markers

`<!-- PARTIAL:nav-start -->` and `<!-- PARTIAL:nav-end -->` — sync
replaces everything between these on the same page. Same pattern for
`PARTIAL:footer-start` / `PARTIAL:footer-end`.

If a page doesn't have markers yet, the first sync run wraps the
existing `<nav>` / `<footer>` block with markers and replaces the content
in one pass. After that, every future sync just updates content between
the markers.

## Approved footer disclaimer text (locked)

> Nonnanest is a wellness device, not a medical device, and is not
> intended to diagnose, treat, cure, or prevent any disease or
> condition. Temperature readings are for informational purposes only
> to help parents monitor general wellness and comfort. For any health
> concerns, always consult a pediatrician or qualified healthcare
> provider.

Do not paraphrase. Do not edit inline in pages. Edit here only.

## Social handles (locked)

- Instagram: `nonnanest.baby`
- Facebook: `nonnanest`
- YouTube: `@nonnanest`

## FAQ schema

The `FAQPage` JSON-LD on the homepage and shop page is **generated**, not
hand-maintained. The visible FAQ is the source of truth, because that is
the copy that goes through voice review, and Google expects FAQ markup to
mirror what the reader actually sees.

After editing any visible FAQ question or answer:

```
python3 _partials/sync_faq_schema.py
```

Then commit the page. To verify without writing anything:

```
python3 _partials/sync_faq_schema.py --check
```

`--check` exits non-zero when a page's schema has drifted from its visible
FAQ. Worth running before a deploy: this drift is silent, because the
rendered page looks completely normal while the markup describes older
copy. That is exactly how the homepage schema ended up missing a whole
question and carrying three stale answers.

Do not edit the JSON-LD between the `<!-- PARTIAL:faq-schema-* -->` markers
by hand — the next sync overwrites it. Edit the visible FAQ and re-run.

A trailing "read more" link whose text ends in `→` is treated as
navigation and left out of the schema answer. Everything else in the
answer is carried through verbatim.

Adding a page: append it to `FAQ_PAGES` in the script. It needs a visible
FAQ in one of the two supported shapes (the homepage accordion, or the
shop page's `<h3>` + `<p>` items) and an existing `FAQPage` block to
bootstrap from.

## Analytics

The OpenAI Ads Pixel head block is stamped separately by
`_partials/sync_analytics.py` (all `*.html` in the repo, not just the `PAGES`
list above). See `_partials/openai-ads/README.md`.
