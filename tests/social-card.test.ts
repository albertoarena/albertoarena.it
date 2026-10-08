import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { siteConfig } from '../src/utils/config';

// Regression coverage for the homepage-social-card fix (2026-10-07,
// .impeccable/critique/2026-10-07T16-13-40Z__...): the og:image/twitter:image
// fallback used to be siteConfig.author.photo, a 240x240 avatar, force-cropped
// by every platform's own crop heuristic into an unusable card. A size-only
// budget (image-budget.test.ts) would not have caught that: the avatar was
// well under any byte budget, it was simply the wrong shape. These assertions
// check shape and wiring, not just weight.

const SOCIAL_IMAGE_PATH = join('public', 'social-default.jpg');
const BUDGET_BYTES = 300_000;

describe('default social card (public/social-default.jpg)', () => {
  it('is exactly 1200x630, the documented og:image/twitter:image size', async () => {
    const { width, height } = await sharp(SOCIAL_IMAGE_PATH).metadata();
    expect({ width, height }).toEqual({ width: 1200, height: 630 });
  });

  it(`is under the ${BUDGET_BYTES.toLocaleString()} byte budget`, () => {
    const bytes = statSync(SOCIAL_IMAGE_PATH).size;
    expect(bytes).toBeLessThan(BUDGET_BYTES);
  });
});

describe('siteConfig social-image wiring', () => {
  it('keeps defaultSocialImage (1200x630 og:image fallback) distinct from author.photo (240x240 avatar)', () => {
    expect(siteConfig.defaultSocialImage).toBeDefined();
    expect(siteConfig.defaultSocialImage).not.toBe(siteConfig.author.photo);
  });
});

describe('BaseLayout/PostLayout do not fall back to the avatar for social/article images', () => {
  it('BaseLayout.astro does not default its image prop to siteConfig.author.photo', () => {
    const source = readFileSync(join('src', 'layouts', 'BaseLayout.astro'), 'utf-8');
    expect(source).not.toMatch(/image\s*=\s*siteConfig\.author\.photo/);
  });

  it('PostLayout.astro does not fall back to siteConfig.author.photo for the BlogPosting JSON-LD image', () => {
    const source = readFileSync(join('src', 'layouts', 'PostLayout.astro'), 'utf-8');
    expect(source).not.toMatch(/socialImage\s*\?\?\s*siteConfig\.author\.photo/);
  });
});
