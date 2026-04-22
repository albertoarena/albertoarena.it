# Plan: Google Analytics Integration

**Date:** 2026-04-22  
**Status:** Completed

---

## Overview

Replace the current direct GA4 gtag integration with Google Tag Manager (GTM), update the cookie banner to be GDPR-compliant using Google Consent Mode v2, and wire up the GTM container ID through GitHub Actions secrets at build time.

---

## Current state

- `src/utils/config.ts` — hardcodes `googleAnalyticsId: 'G-PJGZWDSK4K'`
- `src/layouts/BaseLayout.astro` (lines 109–139) — loads GA4 directly via `gtag/js`, only after `cookieConsent === 'accepted'`
- `src/components/CookieConsent.astro` — minimal banner: accept/decline, no categories, no privacy policy link, no Consent Mode signals
- `.github/workflows/deploy.yml` — build step has no analytics-related env vars

---

## Step 1 — Add GTM container ID to site config

**File:** `src/utils/config.ts`

- Add a `gtmContainerId` field hardcoded alongside `googleAnalyticsId`
- GA4 will be managed inside GTM, not loaded directly

```ts
export const siteConfig = {
  // ...existing fields...
  gtmContainerId: 'GTM-XXXXXXX',
  googleAnalyticsId: 'G-PJGZWDSK4K', // managed via GTM, kept for reference
};
```

> GTM container IDs are **not sensitive** — they appear in plain HTML source on every page load, just like `googleAnalyticsId` already does. No env var or secret needed; hardcoding in `config.ts` is the right approach.

---

## Step 2 — Replace direct GA4 script with GTM + Consent Mode v2

**File:** `src/layouts/BaseLayout.astro`

### 2a. Consent Mode v2 defaults (in `<head>`, before GTM)

Add an inline script **before** the GTM snippet that:
1. Initialises `window.dataLayer`
2. Sets default consent to `denied` for all signals

This must run before GTM loads so GTM respects the defaults.

```html
<!-- Google Consent Mode v2 defaults -->
<script is:inline>
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
</script>
```

### 2b. GTM `<head>` snippet (in `<head>`, after consent defaults)

Replace the existing analytics `<script is:inline define:vars={{ gaId }}>` block (lines 109–139 in body) with a GTM head snippet. Define `gtmId` via `define:vars`.

```html
<!-- Google Tag Manager -->
<script is:inline define:vars={{ gtmId: siteConfig.gtmContainerId }}>
  if (gtmId) {
    (function(w,d,s,l,i){
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', gtmId);
  }
</script>
```

### 2c. GTM `<body>` noscript fallback

Add immediately after `<body>` opens (before `<a href="#main-content">`):

```html
<!-- Google Tag Manager (noscript) -->
{siteConfig.gtmContainerId && (
  <noscript>
    <iframe
      src={`https://www.googletagmanager.com/ns.html?id=${siteConfig.gtmContainerId}`}
      height="0" width="0"
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>
)}
```

### 2d. Remove the old analytics block

Delete the entire existing `<script is:inline define:vars={{ gaId }}>` block (lines 109–139) — GTM now owns analytics loading. The `acceptCookies`/`declineCookies` window functions move to `CookieConsent.astro` (step 3).

---

## Step 3 — Update CookieConsent to be GDPR-compliant

**File:** `src/components/CookieConsent.astro`

### What changes

| Area | Current | After |
|------|---------|-------|
| Cookie categories | None (accept all or nothing) | Necessary (always on) + Analytics (opt-in) |
| Consent signals | None | `gtag('consent', 'update', {...})` on accept/decline |
| Privacy policy link | Missing | Added |
| localStorage key | `cookieConsent: accepted/declined` | `cookieConsent: accepted/declined` (unchanged for backwards compat) |
| Banner text | One line | Purpose description + category list |

### Consent update logic

When the user **accepts analytics**:
```js
gtag('consent', 'update', { analytics_storage: 'granted' });
localStorage.setItem('cookieConsent', 'accepted');
```

When the user **declines**:
```js
gtag('consent', 'update', { analytics_storage: 'denied' });
localStorage.setItem('cookieConsent', 'declined');
```

On page load, if consent was previously **accepted**, fire the update immediately so GTM/GA4 resumes tracking:
```js
if (localStorage.getItem('cookieConsent') === 'accepted') {
  gtag('consent', 'update', { analytics_storage: 'granted' });
}
```

### Banner content

- Title: "We use cookies"
- Body: "We use analytics cookies to understand how you use this site and improve your experience. No advertising or profiling cookies are used."
- Link: "Privacy Policy" → `/pages/privacy-policy` (created in Step 5)
- Buttons: "Decline" | "Accept analytics"

---

## Step 4 — Update GitHub Actions (no secrets needed)

**File:** `.github/workflows/deploy.yml`

No secrets or env vars are needed for the GTM container ID — it's hardcoded in `config.ts` and baked into the static build output like any other config value. The workflow requires no changes for this purpose.

> The existing `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_PORT` secrets are unaffected and cover all sensitive deployment credentials.

---

## Step 5 — Create Privacy Policy page

**File:** `src/content/pages/privacy-policy/index.md`

Create a new page routed at `/pages/privacy-policy`, linked from the cookie banner.

### Frontmatter

```yaml
---
title: Privacy Policy
slug: privacy-policy
template: page
date: 2026-04-22
---
```

### Required content sections

1. **Data controller** — name and contact (Alberto Arena, site URL)
2. **What data is collected** — analytics data only (pages visited, referrer, browser/device type, approximate location from IP); no advertising or profiling
3. **How it is collected** — Google Analytics 4 via Google Tag Manager; cookies set only after explicit consent
4. **Legal basis** — consent (GDPR Art. 6(1)(a))
5. **Data retention** — GA4 default retention (14 months); user can reset via Google account
6. **Third parties** — Google LLC (GA4 data processor); link to Google's privacy policy
7. **Your rights** — access, rectification, erasure, withdrawal of consent at any time (clear cookies / use banner to decline)
8. **Cookies used** — table listing cookie names, purpose, expiry:

| Cookie | Purpose | Expiry |
|--------|---------|--------|
| `_ga` | Distinguishes unique users | 2 years |
| `_ga_XXXXXXXX` | Stores session state | 2 years |
| `cookieConsent` | Stores your consent choice (first-party) | Persistent |

9. **Contact** — how to reach the data controller with privacy requests

---

## File change summary

| File | Change type | Summary |
|------|-------------|---------|
| `src/utils/config.ts` | Edit | Add `gtmContainerId` hardcoded value |
| `src/layouts/BaseLayout.astro` | Edit | Add Consent Mode v2 defaults + GTM head snippet + GTM noscript; remove old GA4 block |
| `src/components/CookieConsent.astro` | Edit | GDPR-compliant banner with categories, consent signals, privacy policy link |
| `src/content/pages/privacy-policy/index.md` | Create | Privacy policy page linked from cookie banner |
| `.github/workflows/deploy.yml` | No change | GTM ID is not sensitive, no secrets needed |

---

## Testing checklist

- [ ] Build runs cleanly — GTM snippet appears in HTML with correct container ID
- [ ] Fresh visit: cookie banner appears, GTM loads, GA4 events show `analytics_storage: denied` in GTM preview
- [ ] Accept cookies: consent update fires, GA4 events flow through, banner disappears
- [ ] Decline cookies: consent remains denied, banner disappears, no GA4 hits
- [ ] Revisit page after accepting: consent update fires immediately on load, no banner shown
- [ ] View Transitions navigation: banner does not re-appear on subsequent pages
- [ ] Consent Mode v2 signals visible in GTM preview panel
- [ ] Privacy policy page renders at `/pages/privacy-policy`
- [ ] Cookie banner "Privacy Policy" link navigates correctly

---

## GTM container setup (out of scope for code changes)

Inside your GTM container, configure:
- **GA4 Configuration tag** — fires on All Pages, respects `analytics_storage` consent
- **Consent Initialisation trigger** — if using server-side GTM or advanced consent setup
- Enable **Consent Overview** in GTM for audit trail
