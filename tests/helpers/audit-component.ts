import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// See docs/plans/accessibility-tdd-component-checks.md for why this exists
// and what was verified before writing it: axe-core runs fine against
// jsdom for structural rules (missing alt, ARIA, form labels) but reports
// color-contrast as "incomplete" rather than pass/fail — jsdom has no
// layout engine, so it can never replace tests/accessibility.test.ts's
// real-browser crawl for contrast. This is for catching the *other* class
// of bug — the kind PostLayout.astro and TrussPromo.astro actually shipped
// with (skipped heading levels) — while a component is still being built,
// without needing a full astro build + page crawl in the loop.

const AXE_SOURCE = readFileSync(join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'), 'utf-8');

// best-practice is required for heading-order (it's not in the strict
// wcag2a/wcag2aa/wcag21aa rule sets — same reason WAVE calls a skipped
// heading level an "alert", not an "error"). region and document-title
// only make sense for a full page (they expect a <main> landmark and a
// <title>, respectively) and reliably false-positive on any isolated
// component fragment regardless of the component's own correctness —
// both confirmed by hitting them while building this helper. Add to this
// list only when a new page-only rule is confirmed to misfire the same
// way; don't disable rules speculatively.
const PAGE_ONLY_RULES = ['region', 'document-title'];

export interface AuditComponentOptions {
  props?: Record<string, unknown>;
  slots?: Record<string, string>;
}

export async function auditComponent(Component: AstroComponentFactory, options: AuditComponentOptions = {}) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Component, {
    props: options.props,
    slots: options.slots,
  });

  const dom = new JSDOM(`<!DOCTYPE html><html lang="en"><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    runScripts: 'dangerously',
  });
  dom.window.eval(AXE_SOURCE);

  const rules = Object.fromEntries(PAGE_ONLY_RULES.map((id) => [id, { enabled: false }]));
  const axe = (dom.window as unknown as { axe: { run: (node: unknown, opts: unknown) => Promise<{ violations: unknown[] }> } }).axe;
  const results = await axe.run(dom.window.document, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
    rules,
  });

  dom.window.close();
  return results;
}
