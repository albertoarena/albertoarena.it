/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

// Only needed so tests can `import Component from '../src/components/X.astro'`
// (tests/helpers/audit-component.ts, and any future component test) —
// Astro's own Vite plugin is what knows how to transform .astro files.
// Existing tests don't need this (they assert against a built dist/ or
// import plain .ts modules) and are unaffected: no environment/alias
// changes beyond what astro.config.mjs already declares.
export default getViteConfig({
  test: {},
});
