# Fix: GTM Consent Restoration and SPA Page View Tracking

**Date:** 2026-04-29  
**Status:** Completed

---

## Problem

GTM Container Diagnostics reported two urgent issues:

1. **"Tag stopped sending data"** — GA4 tags inside GTM had not been detected in the last 48 hours.
2. **"Some pages are not tagged"** — 3 post pages showed as untagged in GTM's tag coverage report.

Additionally, some pages showed a warning triangle (tagged with `G-PJGZWDSK4K` directly rather than via GTM), suggesting duplicate tag detection.

---

## Root cause analysis

### Issue 1 — Consent always defaulted to `denied` on page load

The Consent Mode v2 default script in `BaseLayout.astro` unconditionally set `analytics_storage: 'denied'` on every page load:

```js
gtag('consent', 'default', {
  analytics_storage: 'denied',
  // ...
  wait_for_update: 500,
});
```

Because Astro's `is:inline` scripts are deduplicated across View Transitions (they only run once on first load), this was only a problem on the initial visit. However, the `wait_for_update: 500` timer meant GTM had only 500 ms for `CookieConsent.astro` to call `gtag('consent', 'update', ...)` with the restored value from `localStorage`. Any timing delay could cause GA4 tags to fire with consent still denied, resulting in no data being sent.

For users who had never visited the site before and hadn't yet interacted with the cookie banner, GA4 would never fire at all.

### Issue 2 — SPA navigations not tracked

Astro's View Transitions perform client-side navigation without a full page reload. The GTM container initialises once on first load and pushes a `gtm.js` page view event at that point. Subsequent SPA navigations via `astro:after-swap` did not push any event to `dataLayer`, so GTM had no signal to trigger GA4 page view tags on those pages.

This likely explains why some low-traffic pages appeared "Not tagged" — they had only ever been visited via SPA navigation from another page, never as a direct/hard-loaded entry point.

### Issue 3 — GTM re-initialisation on View Transitions

The GTM loader snippet did not guard against re-running. On any navigation where the inline script re-executed (e.g., if Astro re-evaluated it due to `define:vars` differences), it would push a new `gtm.start` event and attempt to load the GTM script again.

---

## Fix

**File:** `src/layouts/BaseLayout.astro`

### Change 1 — Restore prior consent before GTM loads

Read `localStorage` in the consent default script so that returning users who already accepted cookies have `analytics_storage: 'granted'` set immediately, before GTM initialises:

```js
var _priorConsent = localStorage.getItem('cookieConsent');
gtag('consent', 'default', {
  analytics_storage: _priorConsent === 'accepted' ? 'granted' : 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: _priorConsent ? 0 : 500,
});
```

`wait_for_update` is set to `0` when prior consent exists (no need to wait — it is already known) and `500` only for first-time visitors (gives `CookieConsent.astro` time to update after the banner interaction).

### Change 2 — Guard GTM initialisation to run only once

Added `window._gtmLoaded` flag to prevent duplicate GTM script injection on any future re-execution of the snippet:

```js
if (gtmId && !window._gtmLoaded) {
  window._gtmLoaded = true;
  // GTM snippet...
}
```

### Change 3 — Push `page_view` event on SPA navigations

Added an `astro:after-swap` listener inside the GTM script block. This fires on every client-side navigation (View Transitions) but not on the initial hard load, avoiding duplicate page views:

```js
document.addEventListener('astro:after-swap', function() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'page_view',
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
  });
});
```

GTM should have a trigger configured for the `page_view` custom event (or the built-in History Change trigger) to fire GA4 tags on these events.

---

## File change summary

| File | Change |
|------|--------|
| `src/layouts/BaseLayout.astro` | Restore consent from `localStorage` before GTM loads; guard GTM init with `_gtmLoaded`; push `page_view` on `astro:after-swap` |

---

## Notes on "Not tagged" pages

The 3 pages reported as untagged (`/posts/ai-hallucination-in-coding-agents/`, `/posts/finally-i-moved-to-gatsby/`, `/posts/my-react-calculator/`) use the same layout chain as all other pages and do have the GTM snippet in their HTML. GTM's tag coverage monitoring had simply not crawled or received traffic on them recently enough to mark them as tagged. No code change was required; they will resolve as they receive visits.
