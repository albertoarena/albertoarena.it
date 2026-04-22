# Plan: Fix Custom 404 Page

**Date:** 2026-04-22  
**Status:** Draft

---

## Problem

Visiting a non-existent URL (e.g. `albertoarena.it/pages/dummy`) shows Apache's raw error page instead of the site's custom 404 page:

> "Not Found — The requested URL was not found on this server.  
> Additionally, a 404 Not Found error was encountered while trying to use an ErrorDocument to handle the request."

The double-error message means Apache has an `ErrorDocument` directive pointing to a path that doesn't exist on the server.

---

## Root cause

1. `src/pages/404.astro` exists and Astro builds it to `dist/404.html` correctly.
2. `public/` has **no `.htaccess` file** — it only contains `favicon.svg`, `images/`, `media/`, `photo.jpg`.
3. The deploy workflow runs `cp public/.htaccess dist/.htaccess || true`, which silently no-ops.
4. Without an `ErrorDocument` directive, Apache either uses its own default error page or a stale directive left on the server from a previous deploy — both produce the broken output seen in the screenshot.

---

## Fix

### Step 1 — Create `public/.htaccess`

Create a new file at `public/.htaccess`. Astro copies everything in `public/` verbatim into `dist/`, so this file will be deployed automatically with no workflow changes needed.

```apache
# Custom error pages
ErrorDocument 404 /404.html

# Optional: redirect HTTP to HTTPS (if not already handled by the host)
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

The only required line is `ErrorDocument 404 /404.html`.

### Step 2 — Remove the manual copy step from the workflow (optional cleanup)

**File:** `.github/workflows/deploy.yml`

The current step:
```yaml
- name: Copy server files
  run: |
    cp public/.htaccess dist/.htaccess || true
```

This step was added to work around the missing file. Once `.htaccess` lives in `public/`, Astro copies it automatically and this step becomes redundant. It can be removed to keep the workflow clean — or left as a harmless no-op.

---

## Why `dist/404.html` is already correct

Astro's static build generates `404.html` from `src/pages/404.astro` without any configuration. The page uses the site `Layout` component, so it renders with the full header, sidebar, and theme — consistent with the rest of the site.

No changes are needed to `404.astro` itself.

---

## File change summary

| File | Change type | Summary |
|------|-------------|---------|
| `public/.htaccess` | Create | Add `ErrorDocument 404 /404.html` directive |
| `.github/workflows/deploy.yml` | Edit (optional) | Remove now-redundant manual `.htaccess` copy step |

---

## Testing checklist

- [ ] Build locally (`npm run build`) — confirm `dist/.htaccess` exists and contains `ErrorDocument 404 /404.html`
- [ ] Visit a non-existent URL after deploy — confirms the styled 404 page is shown, not Apache's error page
- [ ] Visit `/404` directly — renders correctly
- [ ] Existing valid routes unaffected
