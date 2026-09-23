# OpenAI Ads Pixel — Nonnanest

Pixel ID: `3BtUqwjBRU491xrkqEJtib`

## Platform

| Layer | Platform |
|---|---|
| Website | Static HTML, hand-authored, hosted on **GitHub Pages** at `www.nonnanest.com` (see `CNAME`). No build step, no client-side router — every page is a real document request. |
| Store / checkout | **Shopify** (`cdu13a-bk.myshopify.com`), embedded via the **Shopify Buy Button** SDK on `/shop/` with `buttonDestination: "checkout"`. Clicking *Order Now · $329* creates a Shopify checkout and sends the customer to a **Shopify-hosted checkout on a different domain**. |

The split domain is the reason `order_created` is not in this repo.

## Where each call lives

| Event | Location | Trigger |
|---|---|---|
| base Pixel + `init` | [`js/oaiq.js`](../../js/oaiq.js), included at the top of `<head>` on all 38 pages | once per page, guarded by `window.__nnOaiqInstalled` and the SDK's own `if (w.oaiq) return` |
| `page_viewed` | `js/oaiq.js` | `DOMContentLoaded`, guarded per pathname |
| `contents_viewed` | [`shop/index.html`](../../shop/index.html) | `/shop/` finishing load |
| `checkout_started` | `shop/index.html`, via the Buy Button's `openCheckout` event | the SDK beginning the checkout hand-off |
| `lead_created` | [`how-to-choose-a-baby-monitor/index.html`](../../how-to-choose-a-baby-monitor/index.html) | HubSpot `hs-form-event:on-submission:success` for the $30-off form (`3039c3b6-…`); the same handler fires Meta `Lead` and GA4 `generate_lead` with a shared `event_id` |
| `order_created` | [`shopify-custom-pixel.js`](./shopify-custom-pixel.js) — **installed in Shopify admin, not here** | Shopify `checkout_completed` — but see the sandbox limitation below |

`page_viewed` is fired on `DOMContentLoaded` rather than inline: the loader sits
above `<title>` in `<head>`, so `document.title` is still empty at parse time.

### Re-stamping the head block

`js/oaiq.js` is included via a marked block that
[`_partials/sync_analytics.py`](../sync_analytics.py) stamps into every
`*.html` in the repo:

```bash
python3 _partials/sync_analytics.py
```

Idempotent, and it walks the repo rather than a hand-maintained list, so new
pages pick the Pixel up automatically. Edit `HEAD_BLOCK` in that script to
change the snippet site-wide.

## Who owns which Shopify-side event

| Event | Owner |
|---|---|
| GA4 `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase` | **Google & YouTube sales channel**, connected to GA4 property `418635238`. Installed Sept 2026; verified firing on the storefront with a single `G-VXRF2PKBGP` collect hit and no duplication. |
| Meta `Purchase` | Facebook & Instagram sales channel (Web + Server). |
| OpenAI `order_created` | `shopify-custom-pixel.js`. |

Never add GA4 back into the custom pixel while the channel is installed — every
purchase would count twice.

### Why GA4 is not in the custom pixel

It was, briefly, and it could not work. Shopify runs custom pixels in a sandbox
that **shims the DOM**: a `<script>` appended with
`document.createElement` / `appendChild` never actually loads. `gtag.js` was
proven not to fetch at all from inside the sandbox — no network request was made,
and the sandbox's CSP is only `frame-ancestors`, so the block is the DOM shim,
not CSP. The console warning `In a sandboxed environment, addEventListener may
not behave as expected` is the same shim announcing itself.

The Measurement Protocol is the usual workaround, and it was rejected here: it
would put a write-capable API secret in client-side code, and its events do not
carry proper traffic-source attribution — which is the entire thing this setup
exists to measure.

### The gtag shim bug, recorded so it is not reintroduced

An earlier version of the pixel used
`const gtag = (...args) => window.dataLayer.push(args)`. That pushes a plain
Array; `gtag.js` only processes `arguments` objects and silently ignores Arrays,
so every GA4 command including `purchase` was discarded. Confirmed by A/B test on
a live page. If GA4 is ever hand-rolled again anywhere, use
`function gtag(){ dataLayer.push(arguments); }`.

### ⚠️ `order_created` is unverified

The OpenAI SDK is injected by the same `createElement`/`appendChild` route that
failed for `gtag.js`, so expect it to fail the same way. It cannot be tested
without a real order. **If OpenAI Ads is not a live channel, disconnect the
custom pixel** rather than leaving a non-functioning one connected. The durable
fix is the server-side Conversions API webhook described below.

## Attribution: how `oppref` travels

1. **Landing.** `js/oaiq.js` never rewrites `window.location`, so the `oppref`
   query parameter on the landing URL is left exactly as OpenAI set it.
2. **Across the site.** The Pixel SDK stores it in the first-party `__oppref`
   cookie on `nonnanest.com`, which carries it page to page. `js/oaiq.js` also
   mirrors the landing value into `localStorage` (`nn_oppref`) as a fallback,
   and only writes when `oppref` is actually present on the URL, so an ordinary
   internal page view cannot clobber a stored token.
3. **Into checkout.** `shop/index.html` wraps `client.checkout.create` and
   attaches `oppref` as a checkout **custom attribute**. It lands on the
   Shopify order as a note attribute, which is what bridges the domain gap —
   Shopify's checkout domain cannot read a `nonnanest.com` cookie.

### Known limitation — read before trusting browser-side `order_created`

Shopify custom pixels run in a **sandboxed iframe on a Shopify origin**. The
`__oppref` cookie set on `nonnanest.com` is not readable from there, and the
SDK loaded inside the sandbox cannot re-derive it. The custom pixel reads the
`oppref` order attribute for logging, but there is no documented Pixel
parameter to pass it back to OpenAI.

**Recommended:** send the confirmed order through the **server-side Conversions
API** from a Shopify `orders/paid` webhook, reading `oppref` out of the order's
`note_attributes` and using the **same `event_id` (the Shopify order id)** as
the browser pixel. OpenAI then deduplicates the two deliveries and the
server-side one carries the attribution token.

That webhook is not built yet — it needs the OpenAI Conversions API endpoint,
auth token, and payload spec, plus somewhere to run it (this site is static
hosting with no server).

## Privacy

The site has no cookie-consent banner or consent-management platform today
(nothing matching OneTrust / CookieYes / Osano / Termly / a `gdpr` gate exists
in the repo), and the Pixel is installed the same unconditional way as the
existing GA4 and Meta pixels. If a consent tool is added later, gate
`js/oaiq.js` behind it alongside those two.

## Debug flags

Both are already `false` and should stay that way in production:

- `js/oaiq.js` → `var OPENAI_DEBUG = false;`
- `shopify-custom-pixel.js` → `oaiq("init", { …, debug: false })`
