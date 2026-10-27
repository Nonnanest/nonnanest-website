/*
 * Klaviyo "Viewed Product" event for the shop page.
 *
 * Feeds the browse-reminder flow in Klaviyo. Klaviyo only records the event
 * for visitors it can already identify (they clicked through from one of our
 * emails, or signed up on the site), so anonymous browsing stays anonymous.
 * The event is queued on _learnq, which klaviyo.js drains once it loads.
 *
 * Stamped onto every page by _partials/sync_analytics.py; it only acts on
 * /shop/.
 */
(function () {
  'use strict';
  if (location.pathname.indexOf('/shop/') !== 0) return;

  var item = {
    ProductName: 'SightAware™ by Nonnanest',
    ProductID: '10929901338817',
    SKU: 'NN-MON-001',
    URL: 'https://www.nonnanest.com/shop/',
    ImageURL: 'https://cdn.shopify.com/s/files/1/0857/3337/6193/files/Nonnanest_Handheld_NAPPA_Award.png',
    Price: 329
  };

  window._learnq = window._learnq || [];
  window._learnq.push(['track', 'Viewed Product', item]);
  window._learnq.push(['trackViewedItem', {
    Title: item.ProductName,
    ItemId: item.ProductID,
    Url: item.URL,
    ImageUrl: item.ImageURL,
    Metadata: { Price: item.Price }
  }]);
})();
