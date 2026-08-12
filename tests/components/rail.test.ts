import { describe, expect, it } from 'vitest';
import Rail from '../../src/components/Rail.astro';
import { auditComponent } from '../helpers/audit-component';

// Proves out the component-level TDD helper (docs/plans/accessibility-tdd-component-checks.md)
// against a component already fixed once for accessibility (the READ/BUILD/WORK
// nav labels, see docs/plans/completed/wcag-aa-accessibility-automation.md) — a
// known-good baseline before relying on this for a component that doesn't
// exist yet.
describe('Rail.astro accessibility', () => {
  it('has no structural accessibility violations', async () => {
    const results = await auditComponent(Rail, {
      props: {
        hreflangEn: 'https://albertoarena.it/',
        hreflangIt: 'https://albertoarena.it/it/',
      },
    });
    expect(results.violations).toEqual([]);
  });
});
