import { describe, expect, it } from 'vitest';
import NewsletterSignup from '../../src/components/NewsletterSignup.astro';
import { auditComponent } from '../helpers/audit-component';

// Same component-level loop as footer.test.ts / truss-promo.test.ts — added
// alongside the 2026-10-07 rewrite replacing the MailerLite embed widget
// with an owned form. The honeypot field in particular is worth a
// structural check here: it's aria-hidden with a focusable-looking input,
// exactly the shape axe's aria-hidden-focus rule exists to catch.
describe('NewsletterSignup.astro accessibility', () => {
  it('has no structural accessibility violations', async () => {
    const results = await auditComponent(NewsletterSignup);
    expect(results.violations).toEqual([]);
  });
});
