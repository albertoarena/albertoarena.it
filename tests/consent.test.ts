import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

/**
 * The privacy policy promises "no tracking scripts are loaded until you
 * explicitly accept" (src/content/pages/privacy-policy/index.md), but the
 * GTM container used to be created unconditionally in BaseLayout.astro's
 * head — Consent Mode suppressed the cookie, not the request, so Google
 * still saw every visitor's address and page before they touched the
 * banner. See the handover this fix came from for the full audit.
 *
 * These tests assert the absence of the script tag itself, not a consent
 * flag, because the flag was never the part that was wrong.
 *
 * jsdom does not execute `type="module"` scripts (CookieConsent.astro was
 * one before this fix), so it is `is:inline` specifically so a real click
 * against the built page can be exercised here instead of re-implementing
 * the logic by hand and testing that instead.
 */

const html = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
const privacyHtml = readFileSync(resolve(process.cwd(), 'dist/pages/privacy-policy/index.html'), 'utf8');

const GTM_HOST = 'https://www.googletagmanager.com';

/** jsdom has no layout engine and no matchMedia; only the latter is needed for scripts here to run at all. */
function stubMatchMedia(window: Window): void {
  window.matchMedia = ((): MediaQueryList =>
    ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia;
}

function mount(prior: string | null = null, page: string = html, url = 'https://albertoarena.it/'): Promise<Window> {
  return new Promise((resolveMount) => {
    const dom = new JSDOM(page, {
      url,
      runScripts: 'dangerously',
      beforeParse(window) {
        stubMatchMedia(window as unknown as Window);
        if (prior) window.localStorage.setItem('cookieConsent', prior);
      },
    });

    dom.window.addEventListener('load', () => resolveMount(dom.window as unknown as Window));
  });
}

function gtmScript(window: Window): HTMLScriptElement | null {
  return window.document.querySelector(`script[src^="${GTM_HOST}/gtm.js"]`);
}

function banner(window: Window): HTMLElement | null {
  return window.document.getElementById('cookie-consent');
}

describe('the built page itself', () => {
  it('ships no GTM script tag, so the promise holds before any script runs', () => {
    expect(html).not.toMatch(new RegExp(`<script[^>]+src=["']${GTM_HOST}/gtm\\.js`));
  });

  it('ships no GTM noscript iframe either, which is the other way a tag arrives uninvited', () => {
    expect(html).not.toContain('googletagmanager.com/ns.html');
  });

  it('holds on the privacy policy page too, not just the homepage', () => {
    expect(privacyHtml).not.toMatch(new RegExp(`<script[^>]+src=["']${GTM_HOST}/gtm\\.js`));
    expect(privacyHtml).not.toContain('googletagmanager.com/ns.html');
  });
});

describe('before anybody has chosen', () => {
  it('has fetched nothing from Google', async () => {
    const window = await mount();

    expect(gtmScript(window)).toBeNull();
  });

  it('asks', async () => {
    const window = await mount();

    expect(banner(window)).not.toBeNull();
  });
});

describe('accepting', () => {
  it('is the first moment anything is fetched from Google', async () => {
    const window = await mount();

    banner(window)!.querySelector<HTMLButtonElement>('#accept-cookies')!.click();

    expect(gtmScript(window)!.src).toContain('id=GTM-PDQBJBL3');
  });

  it('records the choice and removes the banner', async () => {
    const window = await mount();

    banner(window)!.querySelector<HTMLButtonElement>('#accept-cookies')!.click();

    expect(window.localStorage.getItem('cookieConsent')).toBe('accepted');
    expect(banner(window)).toBeNull();
  });

  it('queues consent commands as arguments objects, which is the only form gtag reads', async () => {
    // gtag.js treats an `[object Arguments]` entry in dataLayer as a command
    // and anything else as a Tag Manager style push, silently ignored. This
    // is what the local, rest-parameter `gtag` wrapper in CookieConsent.astro
    // used to get wrong; removing that wrapper in favour of the one correct
    // global `gtag` (BaseLayout.astro) is what this asserts stays true.
    const window = await mount();

    banner(window)!.querySelector<HTMLButtonElement>('#accept-cookies')!.click();

    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer ?? [];
    const consentEntries = dataLayer.filter(
      (entry) => Array.from(entry as ArrayLike<unknown>)[0] === 'consent',
    );

    expect(consentEntries.length).toBeGreaterThan(0);
    for (const entry of consentEntries) {
      expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
    }
  });
});

describe('declining', () => {
  it('fetches nothing from Google', async () => {
    const window = await mount();

    banner(window)!.querySelector<HTMLButtonElement>('#decline-cookies')!.click();

    expect(gtmScript(window)).toBeNull();
  });

  it('records the refusal and removes the banner', async () => {
    const window = await mount();

    banner(window)!.querySelector<HTMLButtonElement>('#decline-cookies')!.click();

    expect(window.localStorage.getItem('cookieConsent')).toBe('declined');
    expect(banner(window)).toBeNull();
  });
});

describe('withdrawing', () => {
  // Withdrawing has to be as easy as giving consent, and "clear your browser
  // cookies" was not that. The control lives on the privacy page, next to
  // the sentence that describes what it undoes.
  it('is offered on the privacy page as a control, not as an instruction', () => {
    expect(privacyHtml).toContain('data-consent-reset');
  });

  it('signals denial and clears the stored choice', async () => {
    const window = await mount('accepted', privacyHtml, 'https://albertoarena.it/pages/privacy-policy/');

    window.document.querySelector<HTMLButtonElement>('[data-consent-reset]')!.click();

    expect(window.localStorage.getItem('cookieConsent')).toBeNull();

    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer ?? [];
    const lastConsentEntry = [...dataLayer]
      .reverse()
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .find(([command]) => command === 'consent');

    expect(lastConsentEntry).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
  });
});

describe('coming back', () => {
  it('having accepted, loads without asking again', async () => {
    const window = await mount('accepted');

    expect(gtmScript(window)).not.toBeNull();
    expect(banner(window)).toBeNull();
  });

  it('having declined, still fetches nothing and still does not nag', async () => {
    const window = await mount('declined');

    expect(gtmScript(window)).toBeNull();
    expect(banner(window)).toBeNull();
  });
});
