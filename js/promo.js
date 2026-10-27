/*
 * Date-gated sale banner (Black Friday 2026: $60 off with BLACKFRIDAY60).
 *
 * Shows a bar along the bottom of every page between START and END, then
 * disappears on its own, so nothing has to be deployed over the holiday.
 * The bottom edge is used because the site nav is fixed to the top.
 * While it's showing, window.nnPromo.active is true and offer.js skips the
 * $30 side tab so visitors aren't shown two different offers.
 *
 * Preview it outside the window with ?nnpromo=preview (or =sat for the
 * Saturday wording).
 *
 * Stamped onto every page by _partials/sync_analytics.py, ahead of offer.js.
 */
(function () {
  'use strict';

  var CODE = 'BLACKFRIDAY60';
  var START = Date.parse('2026-11-27T05:00:00Z');     // Fri Nov 27, 12:00 a.m. ET
  var LAST_DAY = Date.parse('2026-11-28T05:00:00Z');  // Sat Nov 28, 12:00 a.m. ET
  var END = Date.parse('2026-11-29T04:59:59Z');       // Sat Nov 28, 11:59 p.m. ET

  // People who already own one, or are mid-task, don't need the sale.
  var SKIP = ['/quickstart/', '/gift/', '/returns/', '/support/', '/feedback/'];
  var HIDDEN = 'nn_promo_bf26_hidden';  // sessionStorage: closed this visit

  var promo = window.nnPromo = { active: false };

  var preview = /[?&]nnpromo=(preview|sat)\b/.exec(location.search);
  var now = Date.now();
  if (preview) now = preview[1] === 'sat' ? LAST_DAY + 1 : START + 1;
  if (now < START || now > END) return;

  var path = location.pathname;
  for (var i = 0; i < SKIP.length; i++) if (path.indexOf(SKIP[i]) === 0) return;
  promo.active = true;

  try { if (sessionStorage.getItem(HIDDEN)) return; } catch (e) { /* private mode */ }

  var lastDay = now >= LAST_DAY;
  var onShop = path.indexOf('/shop/') === 0;

  var css = '' +
    '.nn-promo{position:fixed;left:0;right:0;bottom:0;z-index:9997;background:#2E5D57;color:#fff;' +
      'font-family:Outfit,system-ui,sans-serif;font-size:15px;line-height:1.4;' +
      'box-shadow:0 -4px 16px rgba(0,0,0,.12);padding:12px 48px 12px 16px;' +
      'padding-bottom:calc(12px + env(safe-area-inset-bottom))}' +
    '.nn-promo-in{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;' +
      'justify-content:center;gap:8px 16px;text-align:center}' +
    '.nn-promo strong{font-weight:500}' +
    '.nn-promo-code{font:inherit;font-weight:500;letter-spacing:1px;color:#2E5D57;background:#fff;' +
      'border:0;border-radius:6px;padding:4px 10px;cursor:pointer}' +
    '.nn-promo-shop{color:#fff;font-weight:500;text-decoration:underline;text-underline-offset:3px}' +
    '.nn-promo-x{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;' +
      'border:0;background:none;color:#fff;font-size:22px;line-height:1;cursor:pointer;opacity:.8}' +
    '.nn-promo-x:hover,.nn-promo-x:focus{opacity:1}' +
    '@media (max-width:600px){.nn-promo{font-size:14px}}';

  function mount() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'nn-promo';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Black Friday offer');
    bar.innerHTML = '<div class="nn-promo-in">' +
      '<span><strong>' + (lastDay ? 'Last day:' : 'Black Friday:') + '</strong> $60 off SightAware&trade;, ' +
        (lastDay ? 'ends tonight at 11:59 p.m. ET.' : 'through Saturday.') + '</span>' +
      '<button type="button" class="nn-promo-code" title="Copy code">' + CODE + '</button>' +
      (onShop ? '' : '<a class="nn-promo-shop" href="/shop/">Shop now</a>') +
      '</div>' +
      '<button type="button" class="nn-promo-x" aria-label="Hide the Black Friday banner">&times;</button>';
    document.body.appendChild(bar);

    // Keep the bar from covering the footer.
    function pad() { document.body.style.paddingBottom = bar.offsetHeight + 'px'; }
    pad();
    window.addEventListener('resize', pad);

    var codeBtn = bar.querySelector('.nn-promo-code');
    codeBtn.addEventListener('click', function () {
      var done = function () {
        codeBtn.textContent = 'Copied';
        setTimeout(function () { codeBtn.textContent = CODE; }, 1500);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(CODE).then(done, function () {});
      if (typeof gtag === 'function') gtag('event', 'promo_code_copied', { promo: 'bf26' });
    });

    bar.querySelector('.nn-promo-x').addEventListener('click', function () {
      bar.remove();
      document.body.style.paddingBottom = '';
      window.removeEventListener('resize', pad);
      try { sessionStorage.setItem(HIDDEN, '1'); } catch (e) { /* private mode */ }
    });
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
