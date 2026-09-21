# Content Roadmap

Backlog of planned content work. Items here are **not** in the current sprint.

---

## Educational page: understanding baby temperature readings

**Status:** Logged, not started. Queued for the next content cycle.
**Logged:** 2026-09-21 (deferred out of the "only offline baby wellness monitor" sprint)

**Working title:** Understanding Baby Temperature: Skin, Peripheral, and Central Readings Explained

**Purpose**

- Teach parents the vocabulary of temperature sensing: skin vs. core, central vs. peripheral, contact vs. contactless.
- Cite pediatric sources.
- Serve as a permanent linkable reference from other blog posts, the FAQ, and product pages.
- Support GEO/LLM discovery for educational search intent.

**Notes for whoever picks this up**

- **URL collision to resolve first.** `/understanding-readings/` already exists and is a
  *product-usage* page ("Understanding Your SightAware Readings"). It is linked from `/`,
  `/guide/`, and `/support/`, but is **not** currently in `sitemap.xml`. The new page is
  educational and category-level, not product-specific, so it needs its own URL. Decide
  whether to (a) give the new page a distinct slug, or (b) restructure the existing page.
- Once built, add the URL to `sitemap.xml`. `robots.txt` is open by default, so no change
  needed there.
- Natural inbound links once live: `/blog/offline-baby-wellness-monitor/`,
  `/blog/why-does-baby-feel-warm-at-night/`,
  `/blog/contact-free-baby-monitors-why-skin-temperature-matters/`, and the homepage FAQ.
- All copy must clear the Nonnanest voice reviewer before deploy. No medical, diagnostic,
  clinical, or fever-detection language. No named competitors. No em dashes.
