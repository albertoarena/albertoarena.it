import { describe, expect, it } from 'vitest';
import TrussPromo from '../../src/components/TrussPromo.astro';
import { auditComponent } from '../helpers/audit-component';

// Same component-level loop as rail.test.ts (docs/plans/completed/accessibility-tdd-component-checks.md).
// Worth having specifically here: audit-component.ts's own history notes TrussPromo.astro as one of the
// two components that previously shipped a skipped heading level, which is exactly what this loop catches.
describe('TrussPromo.astro accessibility', () => {
  it('has no structural accessibility violations', async () => {
    const results = await auditComponent(TrussPromo);
    expect(results.violations).toEqual([]);
  });
});
