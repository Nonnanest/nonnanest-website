/**
 * Nonnanest shared analytics bridge.
 *
 * Site-wide responsibilities:
 * - OpenAI Ads base pixel, oppref persistence, and page_viewed.
 * - GA4 and Meta fallbacks for pages that do not yet contain their legacy
 *   inline base snippets. Existing base installs are detected and not repeated.
 * - Standard ecommerce helpers used by /shop/.
 * - First-party attribution values that can be carried into Shopify checkout.
 */
(function (w, d) {
  "use strict";

  if (w.__nnAnalyticsInstalled) { return; }
  w.__nnAnalyticsInstalled = true;

  var OPENAI_PIXEL_ID = "3BtUqwjBRU491xrkqEJtib";
  var GA_MEASUREMENT_ID = "G-VXRF2PKBGP";
  var META_PIXEL_ID = "1076529151218038";
  var OPENAI_DEBUG = false;
  var OPPREF_MIRROR_KEY = "nn_oppref";
  var SESSION_ATTR_KEY = "nn_session_attribution";

  function onReady(fn) {
    if (d.readyState === "loading") {
      d.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function cookie(name) {
    try {
      var m = d.cookie.match(new RegExp("(?:^|;\\s*)" + name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&") + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : "";
    } catch (e) { return ""; }
  }

  function safeStorage(storage, method, key, value) {
    try { return storage[method](key, value); } catch (e) { return null; }
  }

  function trim(value, max) {
    return String(value || "").slice(0, max || 255);
  }

  function eventId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  /* ---------------- OpenAI Ads -------------------------------------- */
  !function (win, doc, tag, src) {
    if (win.oaiq) return;
    var q = function () { q.q.push(arguments); };
    q.q = [];
    win.oaiq = q;
    var js = doc.createElement(tag);
    js.async = 1;
    js.src = src;
    var first = doc.getElementsByTagName(tag)[0];
    first.parentNode.insertBefore(js, first);
  }(w, d, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");

  w.oaiq("init", { pixelId: OPENAI_PIXEL_ID, debug: OPENAI_DEBUG });

  function opprefFromUrl() {
    try { return new URLSearchParams(w.location.search).get("oppref") || ""; }
    catch (e) { return ""; }
  }

  function opprefFromMirror() {
    return safeStorage(w.localStorage, "getItem", OPPREF_MIRROR_KEY) || "";
  }

  (function captureOppref() {
    var value = opprefFromUrl();
    if (value) { safeStorage(w.localStorage, "setItem", OPPREF_MIRROR_KEY, value); }
  })();

  function getOppref() {
    return opprefFromUrl() || cookie("__oppref") || opprefFromMirror();
  }

  var lastPageViewedPath = null;
  function pageViewed() {
    var path = w.location.pathname;
    if (lastPageViewedPath === path) { return; }
    lastPageViewedPath = path;
    w.oaiq("measure", "page_viewed", {
      type: "contents",
      contents: [{ id: path, name: d.title, content_type: "page" }]
    });
  }

  /* ---------------- GA4 + Meta base fallbacks ----------------------- */
  function ensureGa4() {
    if (typeof w.gtag === "function") { return; }
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    var js = d.createElement("script");
    js.async = true;
    js.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
    d.head.appendChild(js);
    w.gtag("js", new Date());
    w.gtag("config", GA_MEASUREMENT_ID);
  }

  function ensureMeta() {
    if (typeof w.fbq === "function") { return; }
    !function (f, b, e, v, n, t, s) {
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) { f._fbq = n; }
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(w, d, "script", "https://connect.facebook.net/en_US/fbevents.js");
    w.fbq("init", META_PIXEL_ID);
    w.fbq("track", "PageView");
  }

  /* Capture current-tab landing context without collecting PII. */
  function sessionAttribution() {
    var existing = safeStorage(w.sessionStorage, "getItem", SESSION_ATTR_KEY);
    if (existing) {
      try { return JSON.parse(existing); } catch (e) {}
    }

    var params;
    try { params = new URLSearchParams(w.location.search); }
    catch (e) { params = { get: function () { return ""; } }; }

    var value = {
      landing_path: trim(w.location.pathname + w.location.search, 255),
      referrer: trim(d.referrer, 255),
      utm_source: trim(params.get("utm_source"), 100),
      utm_medium: trim(params.get("utm_medium"), 100),
      utm_campaign: trim(params.get("utm_campaign"), 150)
    };
    safeStorage(w.sessionStorage, "setItem", SESSION_ATTR_KEY, JSON.stringify(value));
    return value;
  }

  function getGtagValue(field, timeoutMs) {
    return new Promise(function (resolve) {
      if (typeof w.gtag !== "function") { resolve(""); return; }
      var settled = false;
      var timer = w.setTimeout(function () {
        if (!settled) { settled = true; resolve(""); }
      }, timeoutMs || 700);
      try {
        w.gtag("get", GA_MEASUREMENT_ID, field, function (value) {
          if (settled) { return; }
          settled = true;
          w.clearTimeout(timer);
          resolve(trim(value, 120));
        });
      } catch (e) {
        w.clearTimeout(timer);
        resolve("");
      }
    });
  }

  function checkoutAttributes() {
    var session = sessionAttribution();
    return Promise.all([
      getGtagValue("client_id"),
      getGtagValue("session_id")
    ]).then(function (ids) {
      var values = {
        oppref: getOppref(),
        nn_ga_client_id: ids[0],
        nn_ga_session_id: ids[1],
        nn_fbp: cookie("_fbp"),
        nn_fbc: cookie("_fbc"),
        nn_landing_path: session.landing_path,
        nn_referrer: session.referrer,
        nn_utm_source: session.utm_source,
        nn_utm_medium: session.utm_medium,
        nn_utm_campaign: session.utm_campaign
      };
      return Object.keys(values).filter(function (key) {
        return values[key];
      }).map(function (key) {
        return { key: key, value: trim(values[key], 255) };
      });
    });
  }

  /* ---------------- Standard ecommerce events ---------------------- */
  function productValues(product, quantity, unitCents, currency) {
    var qty = Number(quantity) || 1;
    var cents = Number(unitCents != null ? unitCents : product.listPriceCents) || 0;
    var curr = currency || product.currency || "USD";
    var itemId = String(product.shopifyProductId || product.id);
    return {
      quantity: qty,
      unitCents: cents,
      value: (cents * qty) / 100,
      currency: curr,
      itemId: itemId,
      gaItem: {
        item_id: itemId,
        item_name: product.name,
        price: cents / 100,
        quantity: qty
      }
    };
  }

  function viewItem(product) {
    var v = productValues(product, 1);
    var id = eventId("view_item");
    if (typeof w.gtag === "function") {
      w.gtag("event", "view_item", {
        currency: v.currency,
        value: v.value,
        items: [v.gaItem],
        event_id: id
      });
    }
    if (typeof w.fbq === "function") {
      w.fbq("track", "ViewContent", {
        content_ids: [v.itemId],
        content_name: product.name,
        content_type: "product",
        value: v.value,
        currency: v.currency
      }, { eventID: id });
    }
  }

  function beginCheckout(product, quantity, unitCents, currency) {
    var v = productValues(product, quantity, unitCents, currency);
    var id = eventId("begin_checkout");
    if (typeof w.gtag === "function") {
      w.gtag("event", "begin_checkout", {
        currency: v.currency,
        value: v.value,
        items: [v.gaItem],
        event_id: id
      });
    }
    if (typeof w.fbq === "function") {
      w.fbq("track", "InitiateCheckout", {
        content_ids: [v.itemId],
        contents: [{ id: v.itemId, quantity: v.quantity }],
        content_type: "product",
        num_items: v.quantity,
        value: v.value,
        currency: v.currency
      }, { eventID: id });
    }
  }

  sessionAttribution();
  onReady(function () {
    ensureGa4();
    ensureMeta();
    pageViewed();
  });

  w.nnAnalytics = {
    openAiPixelId: OPENAI_PIXEL_ID,
    gaMeasurementId: GA_MEASUREMENT_ID,
    metaPixelId: META_PIXEL_ID,
    getOppref: getOppref,
    pageViewed: pageViewed,
    viewItem: viewItem,
    beginCheckout: beginCheckout,
    checkoutAttributes: checkoutAttributes
  };

})(window, document);
