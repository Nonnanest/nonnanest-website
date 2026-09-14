/**
 * Nonnanest checkout-completion pixel for Shopify.
 *
 * Sends:
 * - GA4 `purchase`, using the website's GA client/session IDs carried into
 *   checkout as order attributes.
 * - OpenAI Ads `order_created`, preserving the existing integration.
 *
 * Meta Purchase is intentionally NOT sent here. Shopify's official
 * Facebook & Instagram app is connected with Web + Server tracking and owns
 * that event. Sending it again here would risk duplicate purchases.
 *
 * Install in Shopify: Settings -> Customer events -> Add custom pixel.
 * Name: Nonnanest - GA4 and OpenAI purchase
 */
analytics.subscribe("checkout_completed", (event) => {
  try {
    const checkout = (event.data && event.data.checkout) || {};
    const orderId = String(
      (checkout.order && checkout.order.id) || checkout.token || ""
    );
    if (!orderId) return;

    const seenKey = "nn_purchase_" + orderId;
    try {
      if (window.localStorage.getItem(seenKey)) return;
      window.localStorage.setItem(seenKey, "1");
    } catch (e) { /* Shopify's event is already once-per-completion. */ }

    const total = checkout.totalPrice || {};
    const subtotal = checkout.subtotalPrice || {};
    const tax = checkout.totalTax || {};
    const shipping = checkout.shippingLine && checkout.shippingLine.price;
    const value = Number.parseFloat(total.amount || "0") || 0;
    const currency = total.currencyCode || "USD";
    const attributes = checkout.attributes || [];
    const attr = (key) => {
      const found = attributes.find((a) => a && a.key === key);
      return found ? String(found.value || "") : "";
    };

    const items = (checkout.lineItems || []).map((line) => {
      const variant = line.variant || {};
      const product = variant.product || {};
      const unitPrice = variant.price && variant.price.amount != null
        ? Number.parseFloat(variant.price.amount)
        : undefined;
      const item = {
        item_id: String(product.id || variant.id || variant.sku || "sightaware"),
        item_name: product.title || line.title || "SightAware Baby Monitor",
        quantity: Number(line.quantity || 1)
      };
      if (variant.sku) item.item_variant = String(variant.sku);
      if (Number.isFinite(unitPrice)) item.price = unitPrice;
      return item;
    });

    /* ---------------- GA4 purchase ---------------------------------- */
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    const gaClientId = attr("nn_ga_client_id");
    const gaSessionId = attr("nn_ga_session_id");
    const gaConfig = { send_page_view: false };
    if (gaClientId) gaConfig.client_id = gaClientId;

    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-VXRF2PKBGP";
    document.head.appendChild(gaScript);
    gtag("js", new Date());
    gtag("config", "G-VXRF2PKBGP", gaConfig);

    const purchase = {
      transaction_id: orderId,
      value: value,
      currency: currency,
      items: items
    };
    if (gaSessionId) purchase.session_id = Number(gaSessionId) || gaSessionId;
    if (subtotal.amount != null) purchase.subtotal = Number.parseFloat(subtotal.amount) || 0;
    if (tax.amount != null) purchase.tax = Number.parseFloat(tax.amount) || 0;
    if (shipping && shipping.amount != null) {
      purchase.shipping = Number.parseFloat(shipping.amount) || 0;
    }
    gtag("event", "purchase", purchase);

    /* ---------------- OpenAI Ads order_created ---------------------- */
    !function (w, d, s, u) {
      if (w.oaiq) return;
      var q = function () { q.q.push(arguments); };
      q.q = [];
      w.oaiq = q;
      var js = d.createElement(s);
      js.async = 1;
      js.src = u;
      var first = d.getElementsByTagName(s)[0];
      first.parentNode.insertBefore(js, first);
    }(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");

    oaiq("init", { pixelId: "3BtUqwjBRU491xrkqEJtib", debug: false });
    oaiq(
      "measure",
      "order_created",
      {
        type: "contents",
        amount: Math.round(value * 100),
        currency: currency,
        contents: (checkout.lineItems || []).map((line) => ({
          id: (line.variant && line.variant.sku) || "sightaware",
          name: (line.variant && line.variant.product && line.variant.product.title) ||
                line.title || "SightAware Baby Monitor",
          content_type: "product",
          quantity: line.quantity || 1
        }))
      },
      { event_id: orderId }
    );
  } catch (error) {
    console.error("[Nonnanest purchase pixel] failed", error);
  }
});
