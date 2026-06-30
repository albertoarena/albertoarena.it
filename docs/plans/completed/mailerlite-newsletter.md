# MailerLite Newsletter Integration

**Status: completed — live**

## Overview

Add a newsletter subscribe form to the blog using MailerLite's JS embed.
No backend required. RSS-to-email automation handles sending on new posts.

## Security note

The MailerLite `formId` is a public identifier — it appears in page HTML and
is safe to commit. The API key (only needed for the PHP approach) must never
go in source code.

---

## Step 0 — MailerLite account setup (manual, one-time)

1. Create account at mailerlite.com
2. **Create a group** (Subscribers → Groups → Add group): e.g. "Blog"
3. **Build an embedded form** (Forms → Embedded forms):
   - Fields: email only (keep it minimal)
   - After saving, copy the **form ID** from the embed snippet
     (`data-form-id="..."`, a long hex string)
4. **Set up RSS campaign** (Campaigns → New campaign → RSS):
   - RSS URL: `https://albertoarena.it/rss.xml`
   - Trigger: "When new items appear"
   - Subscriber group: the one created above
   - This auto-sends an email on every new post — no manual work per post

---

## Step 1 — Config

**File:** `src/utils/config.ts`

Add a `mailerlite` key inside `siteConfig`:

```ts
mailerlite: {
  formId: 'PASTE_FORM_ID_HERE',
},
```

The form ID is public (visible in page source) — safe to commit.

---

## Step 2 — NewsletterSignup component

**New file:** `src/components/NewsletterSignup.astro`

Renders MailerLite's embed div + their Universal JS script.
Styled to match the blog's existing design tokens (dark/light mode aware).

```astro
---
import { siteConfig } from '@/utils/config';
const { formId } = siteConfig.mailerlite;
---

<div class="my-10 py-8 px-6 border border-white-cloud dark:border-dark-cloud rounded-lg">
  <p class="text-sm font-semibold text-dark dark:text-white mb-1">
    Get new posts by email
  </p>
  <p class="text-sm text-gray mb-4">
    No spam. Unsubscribe any time.
  </p>

  <!-- MailerLite embed -->
  <div data-form-id={formId} class="ml-embedded"></div>
</div>

<script src="https://assets.mailerlite.com/js/universal.js" is:inline></script>
<script is:inline>
  ml('account', 'PASTE_ACCOUNT_ID_HERE');
</script>
```

> **Note:** MailerLite's embed needs two values: the `formId` (in the div) and
> the `account` ID (in the `ml()` call). Both are visible in the snippet
> MailerLite generates — neither is secret.

---

## Step 3 — Homepage placement

**File:** `src/pages/index.astro`

Insert `<NewsletterSignup />` between the hero section and the post list:

```
[hero bio block]       ← existing <section class="mb-12 ...">
[NewsletterSignup]     ← insert here
[post list]            ← existing <div class="space-y-8 ...">
[Pagination]
```

---

## Step 4 — Post page placement

**File:** `src/layouts/PostLayout.astro`

Insert `<NewsletterSignup />` after the author bio block, before Disqus:

```
[tags footer]          ← existing <footer class="mt-12 ...">
[author bio]           ← existing <div class="mt-12 ...">
[NewsletterSignup]     ← insert here
[DisqusComments]       ← existing component
```

---

## Files changed

| File | Change |
|---|---|
| `src/utils/config.ts` | Add `mailerlite.formId` |
| `src/components/NewsletterSignup.astro` | New component |
| `src/pages/index.astro` | Import + place component |
| `src/layouts/PostLayout.astro` | Import + place component |

---

## Out of scope

- PHP API approach (possible future option if custom form UX is needed)
- Paid MailerLite features (A/B testing, automations beyond RSS)
- Tracking click-throughs back into the blog analytics
