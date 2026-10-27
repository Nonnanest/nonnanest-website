/*
 * Nonnanest $30-off offer.
 *
 * One script, two jobs:
 *   1. The "$30 off" side tab and pop-up, on every page except the ones
 *      listed in NO_TAB (the guide pages carry the form inline instead).
 *   2. Any element marked data-nn-offer="guide" gets the same form inline.
 *
 * A sign-up goes to Klaviyo (Email List, which starts the welcome flow) with
 * signup_source set to "site" or "guide"; the flow uses that to pick which
 * version of email 1 to send. Klaviyo is the record of sign-ups; leads are
 * counted there (by signup_source) and in GA4 `generate_lead`. Every
 * sign-up fires Meta `Lead`, GA4 `generate_lead` and OpenAI `lead_created`
 * with one shared event id so each platform can deduplicate.
 *
 * Stamped onto every page by _partials/sync_analytics.py.
 */
(function () {
  'use strict';

  var KLAVIYO_COMPANY = 'WZWyAb';
  var KLAVIYO_LIST = 'TUKPBA';

  // Pages that show no side tab: the guide pages have the form inline, and
  // the rest are for people who already own one or are mid-task.
  var NO_TAB = ['/guide-offer/', '/how-to-choose-a-baby-monitor/', '/quickstart/', '/gift/',
    '/returns/', '/support/', '/feedback/', '/privacy-policy/', '/terms/'];

  var SIGNED_UP = 'nn_offer_signed_up';   // localStorage: never show the tab again
  var DISMISSED = 'nn_offer_tab_hidden';  // sessionStorage: tab closed this visit

  // signup is the signup_source the welcome flow branches on: guide sign-ups
  // get email 1A, everything else 1B.
  var SOURCES = {
    site:       { formName: 'site_30_off_tab', content: 'Site $30 tab', signup: 'site' },
    guide:      { formName: 'guide_30_off', content: 'Baby monitor guide $30 offer', signup: 'guide' },
    newsletter: { formName: 'home_newsletter', content: 'Homepage newsletter', signup: 'site' }
  };

  var offer = window.nnOfferForm = { ready: false, leads: 0 };

  function store(kind) {
    try { return window[kind]; } catch (e) { return null; }
  }
  function getFlag(kind, key) {
    var s = store(kind);
    try { return s ? s.getItem(key) : null; } catch (e) { return null; }
  }
  function setFlag(kind, key) {
    var s = store(kind);
    try { if (s) s.setItem(key, '1'); } catch (e) { /* private mode */ }
  }

  var css = '' +
    '.nn-offer-form{display:grid;gap:12px;font-family:Outfit,system-ui,sans-serif;text-align:left}' +
    '.nn-offer-form label{display:grid;gap:5px;font-size:14px;font-weight:500;color:#2C2520}' +
    '.nn-offer-form label small{font-weight:300;color:#6B6560}' +
    '.nn-offer-form input[type=email],.nn-offer-form input[type=date]{width:100%;box-sizing:border-box;' +
      'font:inherit;font-size:16px;font-weight:400;padding:12px 14px;border:1px solid #D4CCC2;border-radius:10px;' +
      'background:#fff;color:#2C2520;min-height:48px}' +
    '.nn-offer-form input:focus{outline:2px solid #2E5D57;outline-offset:1px;border-color:#2E5D57}' +
    '.nn-offer-form .nn-consent{display:flex;gap:10px;align-items:flex-start;font-size:13px;font-weight:300;' +
      'line-height:1.5;color:#5C4F43}' +
    '.nn-offer-form .nn-consent input{margin:3px 0 0;width:18px;height:18px;flex:none;accent-color:#2E5D57}' +
    '.nn-offer-form .nn-consent a{color:#2E5D57}' +
    '.nn-offer-form button{font:inherit;font-size:16px;font-weight:500;color:#fff;background:#2E5D57;border:0;' +
      'border-radius:10px;padding:14px 18px;cursor:pointer;min-height:50px}' +
    '.nn-offer-form button:hover{background:#244a45}' +
    '.nn-offer-form button[disabled]{opacity:.6;cursor:default}' +
    '.nn-offer-error{margin:0;font-size:14px;color:#C45B4A}' +
    '.nn-offer-done{font-family:Outfit,system-ui,sans-serif;text-align:center;padding:8px 0}' +
    '.nn-offer-done h3{font-family:Fraunces,Georgia,serif;font-weight:400;font-size:24px;margin:0 0 8px;color:#2C2520}' +
    '.nn-offer-done p{margin:0 0 6px;font-size:15px;font-weight:300;line-height:1.55;color:#5C4F43}' +
    '.nn-tab{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:9998;display:flex;flex-direction:column;' +
      'align-items:center;font-family:Outfit,system-ui,sans-serif}' +
    '.nn-tab-open{writing-mode:vertical-rl;transform:rotate(180deg);background:#2E5D57;color:#fff;border:0;' +
      'padding:16px 11px;font:inherit;font-size:15px;font-weight:500;letter-spacing:.06em;' +
      'cursor:pointer;box-shadow:0 2px 10px rgba(44,37,32,.18);border-radius:10px 0 0 10px}' +
    '.nn-tab-open:hover{background:#244a45}' +
    '.nn-tab-x{margin-top:6px;width:24px;height:24px;border-radius:50%;border:0;background:#fff;color:#2C2520;' +
      'font-size:15px;line-height:1;cursor:pointer;box-shadow:0 1px 6px rgba(44,37,32,.2);margin-left:-4px}' +
    '.nn-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:rgba(44,37,32,.45)}' +
    '.nn-modal[hidden]{display:none}' +
    '.nn-dialog{position:relative;width:100%;max-width:420px;max-height:calc(100vh - 32px);overflow:auto;' +
      'box-sizing:border-box;background:#FAF8F5;border-radius:18px;padding:28px 24px 22px;' +
      'box-shadow:0 12px 40px rgba(44,37,32,.25)}' +
    '.nn-dialog-x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;background:transparent;' +
      'font-size:24px;line-height:1;color:#5C4F43;cursor:pointer;border-radius:50%}' +
    '.nn-dialog-x:hover{background:#EDE7DF}' +
    '.nn-eyebrow{margin:0 0 6px;font-family:Outfit,system-ui,sans-serif;font-size:12px;letter-spacing:.14em;' +
      'text-transform:uppercase;font-weight:500;color:#2E5D57}' +
    '.nn-dialog h2{font-family:Fraunces,Georgia,serif;font-weight:400;font-size:28px;line-height:1.15;' +
      'margin:0 0 8px;color:#2C2520}' +
    '.nn-dialog .nn-lede{font-family:Outfit,system-ui,sans-serif;font-size:15px;font-weight:300;line-height:1.55;' +
      'color:#5C4F43;margin:0 0 18px}' +
    '.nn-fine{margin:14px 0 0;font-family:Outfit,system-ui,sans-serif;font-size:11.5px;line-height:1.5;color:#6B6560}';

  function injectCss() {
    if (document.getElementById('nn-offer-css')) return;
    var s = document.createElement('style');
    s.id = 'nn-offer-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  var uid = 0;
  function formHtml() {
    var n = ++uid;
    return '' +
      '<form class="nn-offer-form" novalidate>' +
        '<label for="nn-email-' + n + '">Email' +
          '<input id="nn-email-' + n + '" name="email" type="email" autocomplete="email" required ' +
          'placeholder="you@example.com"></label>' +
        '<label for="nn-date-' + n + '"><span>Due date or baby&rsquo;s birthday <small>(optional)</small></span>' +
          '<input id="nn-date-' + n + '" name="baby_date" type="date"></label>' +
        '<label class="nn-consent"><input name="consent" type="checkbox" required>' +
          '<span>Yes, email me the code and the occasional note from Nonnanest. Unsubscribe anytime. ' +
          '<a href="/privacy-policy/">Privacy Policy</a></span></label>' +
        '<p class="nn-offer-error" role="alert" hidden></p>' +
        '<button type="submit">Send my $30 code</button>' +
      '</form>';
  }

  var DONE_HTML = '' +
    '<div class="nn-offer-done" role="status">' +
      '<h3>Check your inbox.</h3>' +
      '<p>Your $30 code is on its way. It&rsquo;s good for 60 days on SightAware&trade;.</p>' +
      '<p>Don&rsquo;t see it in a few minutes? Check your promotions or spam folder.</p>' +
    '</div>';

  function toKlaviyo(email, babyDate, source) {
    var props = { signup_source: SOURCES[source].signup, signup_page: location.pathname };
    if (babyDate) props.baby_due_or_birth_date = babyDate;
    return fetch('https://a.klaviyo.com/client/subscriptions?company_id=' + KLAVIYO_COMPANY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.api+json', revision: '2024-10-15' },
      body: JSON.stringify({ data: {
        type: 'subscription',
        attributes: {
          custom_source: SOURCES[source].content,
          profile: { data: { type: 'profile', attributes: {
            // No subscriptions field: this endpoint rejects it, and a
            // subscription here already records email marketing consent.
            email: email,
            properties: props
          } } }
        },
        relationships: { list: { data: { type: 'list', id: KLAVIYO_LIST } } }
      } })
    }).then(function (r) {
      if (!r.ok) throw new Error('klaviyo ' + r.status);
    });
  }

  function trackLead(source) {
    var meta = SOURCES[source];
    // The ad landing page keeps the GA4 form name it has always reported.
    var formName = location.pathname.indexOf('/guide-offer/') === 0 ? 'guide_30_off_lp' : meta.formName;
    var eventId = formName + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { content_name: meta.content }, { eventID: eventId });
    }
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', { form_id: 'nn_offer_' + source, form_name: formName,
        page_path: location.pathname });
    }
    if (typeof oaiq === 'function') {
      oaiq('measure', 'lead_created', { type: 'customer_action', event_id: eventId });
    }
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function mountForm(host, source) {
    host.innerHTML = formHtml();
    var form = host.querySelector('form');
    var err = form.querySelector('.nn-offer-error');
    var btn = form.querySelector('button');
    var sent = false;

    function fail(msg, field) {
      err.textContent = msg;
      err.hidden = false;
      if (field) field.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sent) return;
      var email = form.email.value.trim();
      var babyDate = form.baby_date.value;
      err.hidden = true;
      if (!EMAIL_RE.test(email)) return fail('Please enter a valid email address.', form.email);
      if (!form.consent.checked) return fail('Please tick the box so we can email you the code.', form.consent);

      btn.disabled = true;
      btn.textContent = 'Sending…';
      toKlaviyo(email, babyDate, source).then(function () {
        sent = true;
        offer.leads++;
        setFlag('localStorage', SIGNED_UP);
        trackLead(source);
        if (window.klaviyo && typeof window.klaviyo.identify === 'function') {
          try { window.klaviyo.identify({ email: email }); } catch (x) { /* optional */ }
        }
        host.innerHTML = DONE_HTML;
        var tab = document.querySelector('.nn-tab');
        if (tab) tab.remove();
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'Send my $30 code';
        fail('Something went wrong on our end. Please try again, or email hello@nonnanest.com.');
      });
    });
  }

  function buildTab() {
    var path = location.pathname;
    for (var i = 0; i < NO_TAB.length; i++) if (path.indexOf(NO_TAB[i]) === 0) return;
    if (getFlag('localStorage', SIGNED_UP) || getFlag('sessionStorage', DISMISSED)) return;

    var tab = document.createElement('div');
    tab.className = 'nn-tab';
    tab.innerHTML = '<button type="button" class="nn-tab-open" aria-haspopup="dialog">$30 OFF</button>' +
      '<button type="button" class="nn-tab-x" aria-label="Hide the $30 off tab">&times;</button>';

    var modal = document.createElement('div');
    modal.className = 'nn-modal';
    modal.hidden = true;
    modal.innerHTML = '' +
      '<div class="nn-dialog" role="dialog" aria-modal="true" aria-labelledby="nn-offer-title">' +
        '<button type="button" class="nn-dialog-x" aria-label="Close">&times;</button>' +
        '<p class="nn-eyebrow">2026 NAPPA Award Winner</p>' +
        '<h2 id="nn-offer-title">$30 off SightAware&trade;</h2>' +
        '<p class="nn-lede">Get $30 off your first order, plus a few short notes on choosing a monitor ' +
          'and how SightAware works.</p>' +
        '<div class="nn-offer-slot"></div>' +
        '<p class="nn-fine">One code per customer. Valid for 60 days on SightAware.</p>' +
      '</div>';

    document.body.appendChild(tab);
    document.body.appendChild(modal);
    mountForm(modal.querySelector('.nn-offer-slot'), 'site');

    var opener = tab.querySelector('.nn-tab-open');
    function open() {
      modal.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      var first = modal.querySelector('input');
      (first || modal.querySelector('.nn-dialog-x')).focus();
      if (typeof gtag === 'function') gtag('event', 'offer_tab_open', { page_path: location.pathname });
    }
    function close() {
      modal.hidden = true;
      document.documentElement.style.overflow = '';
      if (document.body.contains(opener)) opener.focus();
    }
    opener.addEventListener('click', open);
    tab.querySelector('.nn-tab-x').addEventListener('click', function () {
      setFlag('sessionStorage', DISMISSED);
      tab.remove();
    });
    modal.querySelector('.nn-dialog-x').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  function init() {
    injectCss();
    var inline = document.querySelectorAll('[data-nn-offer]');
    for (var i = 0; i < inline.length; i++) {
      var src = inline[i].getAttribute('data-nn-offer');
      mountForm(inline[i], SOURCES[src] ? src : 'guide');
    }
    buildTab();
    offer.ready = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
