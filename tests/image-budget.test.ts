import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// docs/plans/post-cover-weight.md Phase 2, item 1: a per-file size budget,
// not a Lighthouse assertion. lighthouserc.json only ever tests two fixed
// URLs, so a resource-summary assertion there would silently miss every
// cover on every post that isn't in that list — it would not have caught
// the 273 KB cover that started this plan. This checks every cover.<ext>
// under public/images/posts/, independent of which pages Lighthouse runs
// against, on every PR via `npm run test`.
//
// Only cover.<ext> (the social-card master, the file og:image/twitter:image
// point at) is budgeted here. The generated in-page WebP derivatives
// (cover-700/900/1400.webp) are a separate, already-small concern by
// construction — see the Phase 2 result section in the plan doc.

const BUDGET_BYTES = 300_000;
const POSTS_IMAGES_DIR = join('public', 'images', 'posts');
const COVER_FILENAME = /^cover\.(jpg|jpeg|png)$/i;

function findCovers(): { path: string; bytes: number }[] {
  const postDirs = readdirSync(POSTS_IMAGES_DIR, { withFileTypes: true }).filter((e) => e.isDirectory());
  const covers: { path: string; bytes: number }[] = [];
  for (const dir of postDirs) {
    const dirPath = join(POSTS_IMAGES_DIR, dir.name);
    for (const file of readdirSync(dirPath)) {
      if (!COVER_FILENAME.test(file)) continue;
      const filePath = join(dirPath, file);
      covers.push({ path: filePath, bytes: statSync(filePath).size });
    }
  }
  return covers;
}

describe('post cover image size budget', () => {
  it('finds at least one cover to check', () => {
    expect(findCovers().length).toBeGreaterThan(0);
  });

  it(`every cover.<ext> is under ${BUDGET_BYTES.toLocaleString()} bytes`, () => {
    const overBudget = findCovers()
      .filter((cover) => cover.bytes > BUDGET_BYTES)
      .map((cover) => `${cover.path}: ${cover.bytes.toLocaleString()} bytes`);

    expect(overBudget, overBudget.join('\n')).toEqual([]);
  });
});
