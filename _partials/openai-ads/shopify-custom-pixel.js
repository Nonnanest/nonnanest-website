/**
 * Nonnanest — Shopify Web Pixel: OpenAI Ads `order_created` only.
 *
 * INSTALL
 *   Shopify admin -> Settings -> Customer events -> (the Nonnanest custom pixel)
 *   Permission: Analytics. Paste, Save, Connect.
 *
 * WHAT OWNS WHAT — do not add any of these back here:
 *   GA4 (page_view / view_item / add_to_cart / begin_checkout / purchase)
 *       -> the Google & YouTube sales channel, connected to property 418635238.
 *          Installed Sept 2026 and verified firing on the storefront.
 *   Meta Purchase
 *       -> the Facebook & Instagram sales channel (Web + Server).
 *   OpenAI order_created
 *       -> this file.
 * Adding GA4 back here double-counts every purchase against the channel.
 *
 * ⚠️ KNOWN LIMITATION — this pixel is UNVERIFIED and probably does not fire.
 * Shopify runs custom pixels in a sandbox that shims the DOM. A <script> tag
 * appended via document.createElement/appendChild never actually loads: GA4's
 * gtag.js was proven not to fetch at all from here (no network request, and the
 * sandbox CSP is only `frame-ancestors`, so it is the DOM shim, not CSP). The
 * OpenAI SDK below is injected exactly the same way, so expect the same result.
 * It cannot be tested without placing a real order.
 *
 * THE REAL FIX, when OpenAI Ads becomes a live channel: send the order from a
 * Shopify `orders/paid` webhook through OpenAI's server-side Conversions API,
 * reading `oppref` out of the order's note_attributes and reusing the Shopify
 * order id as `event_id`. That also solves the attribution gap described in
 * README.md — the sandbox cannot read the `__oppref` cookie set on
 * nonnanest.com. That webhook needs somewhere to run; this site is static.
 *
 * If OpenAI Ads is not running, disconnect this pixel rather than leaving a
 * non-functioning pixel connected.
 */

const OPENAI_PIXEL_ID = "3BtUqwjBRU491xrkqEJtib";

analytics.subscribe("checkout_completed", function (event) {
  try {
    var checkout = (event.data && event.data.checkout) || {};
    var orderId = String((checkout.order && checkout.order.id) || checkout.token || "");
    if (!orderId) { return; }

    // Shopify fires checkout_completed once per completion and does not re-fire
    // on a thank-you-page refresh. Belt-and-braces only — never block the event
    // if storage is unavailable in the sandbox.
    var seenKey = "nn_purchase_" + orderId;
    try {
      if (window.localStorage.getItem(seenKey)) { return; }
      window.localStorage.setItem(seenKey, "1");
    } catch (e) { /* no storage in the sandbox — rely on Shopify's own dedupe */ }

    var total = checkout.totalPrice || {};
    var amount = parseFloat(total.amount);
    if (!isFinite(amount)) { amount = 0; }
    var currency = total.currencyCode || "USD";

    (function (w, d, s, u) {
      if (w.oaiq) { return; }
      var q = function () { q.q.push(arguments); };
      q.q = [];
      w.oaiq = q;
      var js = d.createElement(s);
      js.async = 1;
      js.src = u;
      var first = d.getElementsByTagName(s)[0];
      first.parentNode.insertBefore(js, first);
    })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");

    oaiq("init", { pixelId: OPENAI_PIXEL_ID, debug: false });
    oaiq(
      "measure",
      "order_created",
      {
        type: "contents",
        amount: Math.round(amount * 100),
        currency: currency,
        contents: (checkout.lineItems || []).map(function (line) {
          var variant = line.variant || {};
          var product = variant.product || {};
          return {
            id: variant.sku || String(product.id || "sightaware"),
            name: product.title || line.title || "SightAware Baby Monitor",
            content_type: "product",
            quantity: line.quantity || 1
          };
        })
      },
      { event_id: orderId }
    );
  } catch (error) {
    console.error("[Nonnanest pixel] checkout_completed failed", error);
  }
});
