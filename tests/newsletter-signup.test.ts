import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

/**
 * NewsletterSignup.astro replaced the MailerLite "universal.js" embed
 * widget with an owned form that POSTs straight to MailerLite's own
 * public form-submission endpoint (reverse-engineered from the widget's
 * injected form, verified live against the real account on 2026-10-07 —
 * no API key, CORS-open, same account/form IDs already public in
 * site config). This exercises the real `is:inline` submit handler
 * against the built page, same reasoning as consent.test.ts: a real
 * submit against the built HTML, not a reimplementation of the logic
 * tested in isolation.
 */

const html = readFileSync(resolve(process.cwd(), 'dist/subscribe/index.html'), 'utf8');

const SUBSCRIBE_URL = 'https://assets.mailerlite.com/jsonp/2474575/forms/191438151619708478/subscribe';

function stubMatchMedia(window: Window): void {
  window.matchMedia = ((): MediaQueryList =>
    ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia;
}

function mount(): Promise<Window> {
  return new Promise((resolveMount) => {
    const dom = new JSDOM(html, {
      url: 'https://albertoarena.it/subscribe/',
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      beforeParse(window) {
        stubMatchMedia(window as unknown as Window);
      },
    });

    dom.window.addEventListener('load', () => resolveMount(dom.window as unknown as Window));
  });
}

function form(window: Window): HTMLFormElement {
  return window.document.querySelector('.newsletter-form') as HTMLFormElement;
}

function status(window: Window): HTMLElement {
  return form(window).querySelector('.newsletter-status') as HTMLElement;
}

function submit(window: Window, email: string, honeypot = ''): void {
  const f = form(window);
  (f.querySelector('input[name="email"]') as HTMLInputElement).value = email;
  (f.querySelector('input[name="company"]') as HTMLInputElement).value = honeypot;
  f.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
}

describe('the built page itself', () => {
  it('ships no MailerLite widget script', () => {
    expect(html).not.toContain('assets.mailerlite.com/js/universal.js');
  });

  it('ships a plain form with an email field and a honeypot field, nothing else collecting data', () => {
    expect(html).toContain('class="newsletter-form');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="company"');
  });
});

describe('submitting a real-looking email', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to MailerLite\'s public subscribe endpoint with the email, no API key anywhere', async () => {
    const window = await mount();
    fetchMock.mockResolvedValue({ json: async () => ({ success: true }) });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    submit(window, 'reader@example.com');

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(SUBSCRIBE_URL);
    expect(init.method).toBe('POST');
    expect(String(init.body)).toContain('fields%5Bemail%5D=reader%40example.com');
    expect(String(init.body)).not.toMatch(/api[_-]?key/i);
  });

  it('shows a success message and clears the field once MailerLite confirms', async () => {
    const window = await mount();
    fetchMock.mockResolvedValue({ json: async () => ({ success: true }) });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    submit(window, 'reader@example.com');

    await vi.waitFor(() => expect(status(window).textContent).toMatch(/you're on the list/i));
    expect((form(window).querySelector('input[name="email"]') as HTMLInputElement).value).toBe('');
  });

  it('surfaces the field error MailerLite returns, without inventing its own wording', async () => {
    const window = await mount();
    fetchMock.mockResolvedValue({
      json: async () => ({ success: false, errors: { fields: { email: ['This email is invalid.'] } } }),
    });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    submit(window, 'reader@example.com');

    await vi.waitFor(() => expect(status(window).textContent).toContain('This email is invalid.'));
  });

  it('shows a network-error message if the request itself fails', async () => {
    const window = await mount();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    submit(window, 'reader@example.com');

    await vi.waitFor(() => expect(status(window).textContent).toMatch(/network error/i));
  });
});

describe('the honeypot field', () => {
  it('silently drops the submission without calling MailerLite at all', async () => {
    const window = await mount();
    const fetchMock = vi.fn();
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    submit(window, 'reader@example.com', 'a bot filled this in');

    // No success/error path to wait on, since the handler returns immediately —
    // give any wrongly-fired async work a tick to surface before asserting silence.
    await new Promise((r) => setTimeout(r, 20));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(status(window).textContent).toBe('');
  });

  it('is unreachable by keyboard and invisible to a real visitor', async () => {
    const window = await mount();
    const honeypot = form(window).querySelector('input[name="company"]') as HTMLInputElement;

    expect(honeypot.tabIndex).toBe(-1);
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('an empty submission', () => {
  it('does not call MailerLite for a blank email', async () => {
    const window = await mount();
    const fetchMock = vi.fn();
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    submit(window, '');

    await new Promise((r) => setTimeout(r, 20));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
