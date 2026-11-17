# SEO foundation: titles, structured data, topic hubs, post footer

Covers change sets 1 through 7 of the Nov 2026 SEO execution brief, in one PR. Most of the 5,000-line diff is generated JSON-LD. The hand-written parts are `_partials/sync_seo.py`, `_partials/organization.json`, `_partials/post-footer.html`, `css/post-footer.css`, and the four `learn/` pages.

## Stack (brief's questions)

1. **Generator:** none. The site is plain HTML on GitHub Pages behind Cloudflare. Shared chrome is stamped in by the Python scripts in `_partials/`.
2. **Schema component:** there wasn't one. `_partials/sync_seo.py` fills that role, in the same marker-stamping style as `sync.py` and `sync_faq_schema.py`.
3. **publishedAt / author:** every post already had `datePublished` and `dateModified` in its Article JSON-LD, so nothing needed backfilling from git. Authors were `Organization` on 15 posts. Those are now Nathan Overbey (Person, links to /story/). The guest post keeps Emily Boesner, RN.
4. **Canonical host:** `www.nonnanest.com`. Checked live: `http://nonnanest.com/` and `https://nonnanest.com/blog/` both 301 to www.
5. **Branch:** `seo-foundation`.

## Change set 1: titles and meta descriptions
Five posts got the brief's exact `<title>` and meta description, plus matching og:/twitter: tags. Body copy is untouched.
- `blog/why-does-baby-feel-warm-at-night/index.html`
- `blog/do-baby-monitors-need-wifi/index.html`
- `blog/wifi-vs-fhss-baby-monitor-connectivity/index.html`
- `blog/non-wearable-baby-monitor-guide/index.html`
- `blog/contact-free-baby-monitors-why-skin-temperature-matters/index.html` (this post has no og:/twitter: tags, so only the title and description changed; the slug stays as-is). After voice review, the description reads "SightAware reads your baby's skin temperature without a wearable. Here's what contactless skin temperature awareness means for sleep and your peace of mind at night." The brief's version said contactless monitors in general can read skin temperature, and no other monitor does.

## Change set 2: structured data
`python3 _partials/sync_seo.py` stamps everything between `<!-- PARTIAL:seo-schema-* -->` markers. The values come from each page's own head tags. `--check` catches drift, and the pre-commit hook now runs it alongside the FAQ and canonical audits.
- **Organization** on every indexable page (44), from `_partials/organization.json`. It replaces four hand-copied Organization blocks (two on the homepage, one each on /awards/ and /press/). Two places where I departed from the brief:
  - `sameAs` uses the real handles (`instagram.com/nonnanest.baby`, `facebook.com/NonnanestBaby`, `youtube.com/@nonnanest`). The brief's `instagram.com/nonnanest` isn't ours, and I found no LinkedIn page linked anywhere on the site, so I left it out.
  - `award` reads "2026 NAPPA Award Winner, Wellness + Awareness", the product category on NAPPA's listing (Best for Baby is NAPPA's top-level section). The Product blocks on / and /shop/ match.
- **Article** on all 18 posts and the 3 hubs. headline/description/image/URL are built from title/meta/og:image/canonical. The publisher points at the Organization `@id`. Hand-added fields like `about` are kept. This also fixes 15 posts whose Article `@id` used the non-www host or had no trailing slash.
- **BreadcrumbList** on every indexable page except the homepage: Home > Blog > Post, Home > Learn > Hub, Home > Press > Release, Home > Page. The buyer's guide keeps its own.
- **Product:** /shop/ and the homepage already had a fuller Product block than the brief's (shipping details, awards, $329, InStock), so I kept it and only added `sku`/`model` `ABM720`. I did not add `aggregateRating` or `review`.
- **FAQPage:** `sync_faq_schema.py` already generates FAQ JSON-LD from a page's visible FAQ. It now also bootstraps on a page that has no FAQ block yet. To add a FAQ to a post, write `<div class="faq-item"><h3>Q</h3><p>A</p></div>` items in the body, add the page to `FAQ_PAGES`, and run the script. No post has a real Q&A section today. The "Questions to ask" sections in two posts are checklists for the reader, not Q&A.

## Change set 3: hub pages (scaffold)
- `learn/skin-temperature/`, `learn/non-wearable-monitors/`, `learn/baby-monitor-privacy/`. Each uses the brief's title, meta and H1, plus self-canonical, Article and BreadcrumbList, and is in the sitemap.
- `learn/index.html` is new and not in the brief. It exists so the Home > Learn > Hub breadcrumb has a real middle page.
- Intro and section copy is shown as dashed **"Draft copy needed"** boxes. Each post card reuses that post's existing approved title and meta description.
- All four pages have the canonical nav/footer (added to `sync.py` PAGES) and the same analytics as the blog posts (GA4, Meta Pixel, the analytics partial).

## Change set 4 + 5: BlogPostFooter with related reading
- `_partials/post-footer.html` is stamped at the end of every post, after the existing shop CTA. It contains the "does / does not do" box, the pediatrician note, Related reading, and the legal disclaimer.
- Related reading links to the post's hub, then up to three posts from the same cluster (the `CLUSTERS` map in `sync_seo.py`), then any hand-picked links from `EXTRA_RELATED`. The posts outside all three clusters also get a link to /blog/.
- 9 posts had their own "Related reading" section after the article. Their links are carried into `EXTRA_RELATED` and the old sections are removed, so each post has one list and no internal link is lost.
- **No repeated sections:** 8 posts already had their own "does and doesn't do" and pediatrician sections, and 3 had the full locked disclaimer. The footer leaves out any section a post already covers, so readers see each once. The disclaimer only counts if the body has the complete locked text, so posts that carry just its first sentence still get the full version in the footer.
- After voice review, the does/doesn't-do box reads: "SightAware&trade; by Nonnanest is a wellness awareness device. It reads your baby's skin temperature from up to 4 feet away, with no wearable, and alerts you when a reading passes the level you set. It is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease or condition."
- The legal disclaimer is the **locked footer wording** from `_partials/README.md` ("SightAware is a wellness device..."), not the brief's "Nonnanest is a wellness device..." version.
- Each post's old shortened disclaimer line in `.blog-footer` is removed, since the locked one now sits right above it. The old "Related reading" block on the warm-at-night post is also removed (its second link had the wrong anchor text).
- Styles are in `css/post-footer.css`: Fraunces/Outfit, Soft Teal accent, Cream box.

## Change set 6: alt text
- Added `alt=""` to the hidden Meta Pixel `<noscript>` image on 35 pages. It is a tracking pixel.
- Rewrote 22 content images (table below). The film thumbnail on /shop/ keeps `alt=""` because its button already has an aria-label. Every other image already had good alt text, or is the logo with alt "Nonnanest".

| Image location | File | Before | After |
|---|---|---|---|
| `shop/index.html:541` | Nonnanest_Handheld_v1.png | Monitor front view | SightAware 5-inch parent display showing a sleeping baby in a crib, with skin and room temperature readings |
| `shop/index.html:548` | Nonnanest_Baby_Camera_Feature.png | Camera features overview | SightAware camera on a nursery dresser, labeled with its HD night vision lens, contactless skin temperature sensor, and pan and tilt range |
| `shop/index.html:551` | Mounting_Options_Nonnanest.png | Mounting options — crib and wall | SightAware camera on the flexible crib mount and on the wall mount above a crib, both included |
| `shop/index.html:554` | 04_alert-setting.png | Skin temperature sensing closeup | A sleeping baby in a crib, with an on-screen skin temperature reading and an adjustable alert setting |
| `shop/index.html:768` | nappa-2026-winner.png | (empty) | 2026 NAPPA Award Winner seal |
| `press/index.html:902` | nonnanest-baby-monitor-camera-parent-unit.png | SightAware full system — camera and parent display | The SightAware camera and 5-inch parent display together, the full system |
| `press/index.html:942` | Nonnanest_in_the_box.png | SightAware complete contents — what's in the box | Everything in the SightAware box: camera, 5-inch parent display, crib mount, wall mount, power adapters, cables and user guide |
| `guide/index.html:1051` | house.png | House icon — room temp | Room temperature |
| `guide/index.html:1055` | baby_face.png | Baby face icon — skin temp | Baby's skin temperature |
| `guide/index.html:1064` | Zoom_icon.png | Zoom icon | Zoom |
| `guide/index.html:1070` | Sound_Signal.png | Volume icon | Volume |
| `guide/index.html:1073` | Handheld_signal.png | Signal bars | Camera signal strength |
| `guide/index.html:1076` | Handheld_battery.png | Battery icon | Battery level |
| `guide/index.html:1102` | Music_note.png | Music / Lullaby | Lullabies |
| `guide/index.html:1105` | clock.png | Clock / Time | Clock |
| `guide/index.html:1108` | temperature.png | Thermometer / Temperature | Skin temperature alert |
| `quickstart/index.html:1105` | Simple_Baby_Face_Icon.png | Baby skin temp icon | Baby's skin temperature |
| `quickstart/index.html:1109` | Simple_House_Icon.png | Room temp icon | Room temperature |
| `quickstart/index.html:1122` | Simple_Baby_Face_Icon.png | Baby icon | (empty, decorative) |
| `quickstart/index.html:1126` | Simple_House_Icon.png | House icon | (empty, decorative) |
| `quickstart/index.html:1130` | Signal_Connectivity_Monitor.png | Signal icon | (empty, decorative) |
| `quickstart/index.html:1134` | Battery_baby_monitor.png | Battery icon | (empty, decorative) |

## Change set 7: sitemap, robots, canonicals
- **Sitemap:** added the 4 learn pages, `/understanding-readings/`, and `/press/nappa-award-winner-2026/` (both were missing). Removed `/feedback/`, which is `noindex`.
- **lastmod** is now accurate. It used to be hand-kept and stale (the homepage said June). Each entry now uses the file's last commit on main, or today for pages whose visible content changes in this PR (all posts and the hubs).
- Every indexable page is now in the sitemap, and no noindex page is.
- **robots.txt:** already allows everything and points at the www sitemap. There are no admin or draft paths to block. No change.
- **Canonicals:** `sync.py --check` passes on every indexable page, including the new ones. There is exactly one canonical per page, and each points to itself.

## Validation done locally
- `sync.py --check`, `sync_faq_schema.py --check`, and `sync_seo.py --check` all pass. Every JSON-LD block on the site parses.
- In the browser: post footer, hub pages at desktop and 375px (no horizontal scroll), /shop/ and the homepage. No console errors. All 15 new internal links return 200.

## To do before merge (Nathan)
- [ ] Decide the disclaimer wording: the voice reviewer skill's approved long form starts "Nonnanest is a wellness device... Temperature readings...". The site's locked text, used here, starts "SightAware is... Skin temperature readings...". Update whichever source is wrong.
- [ ] Write hub copy to replace every "Draft copy needed" box. Run it, the post footer copy, and the learn index meta description ("Plain-language resource hubs for parents on...") through `/nonnanest-voice-reviewer`.
- [ ] Review the 22 alt text rewrites above.
- [ ] Confirm `ABM720` is the right SKU/model for the retail unit.

## After deploy
- [ ] Rich Results Test on one post and /shop/ (screenshots go here; this can only run against the live URLs).
- [ ] Request re-indexing for the five retitled posts, resubmit the sitemap, and watch Coverage for 7 days.

## NAPPA category
NAPPA's listing puts SightAware in the Wellness + Awareness category, inside its Best for Baby section. Structured data, the /awards/ card, three spots on /press/ and the NAPPA press release (title, headline, descriptions, body) now name Wellness + Awareness. The release's URL is unchanged.

## Found while working, not changed
- Four older posts' meta descriptions use em dashes or "contact-free" (wearables-arent-always, wellness-without-the-stress, 5-tips, calm-quiet-evolution). Their Article schema now carries that same text.
- The blog posts still have their own older hand-built nav with "Pre-order — $329". The canonical nav says "Order SightAware · $329".

🤖 Generated with [Claude Code](https://claude.com/claude-code)
