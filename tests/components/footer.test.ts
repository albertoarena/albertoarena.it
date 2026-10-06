import { describe, expect, it } from 'vitest';
import Footer from '../../src/components/Footer.astro';
import { auditComponent } from '../helpers/audit-component';

// Same component-level loop as rail.test.ts (docs/plans/completed/accessibility-tdd-component-checks.md),
// added alongside the ledger-identity footer rewrite (GitHub/X/LinkedIn links, double-rule border) —
// no prior coverage existed for this component.
describe('Footer.astro accessibility', () => {
  it('has no structural accessibility violations', async () => {
    const results = await auditComponent(Footer);
    expect(results.violations).toEqual([]);
  });
});
