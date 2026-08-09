/*
  Build-time cover generation (redesign-plan.md §8). Run manually with
  `npm run covers:generate`, same convention as pdf:cheatsheet — not wired
  into `npm run build`/CI, so a rendering failure here can never break a
  deploy. Only touches posts with neither `cover` nor `socialImage` set;
  everything else keeps its existing (hand-made or previously generated)
  cover untouched.

  One systematic template for every post rather than bespoke per-category
  motifs: the plan's "aggregate/event/projector tree for event sourcing, a
  different motif for AI" example doesn't apply to any post that actually
  needs a generated cover right now (all of them predate the redesign,
  categories like Javascript/Titanium/CSS/PHP), so hand-designing motifs
  nothing currently uses isn't worth it. The one recurring visual element
  (a left accent bar) is category-agnostic and matches the callout/Truss
  card treatment already used sitewide for "this block matters."
*/
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const postsDir = join(root, 'src/content/posts');
const publicDir = join(root, 'public');

const TOKENS = {
  surface: '#f4f7f9',
  ink: '#13171d',
  ink2: '#3b4552',
  muted: '#6c7783',
  accent: '#0b5fd0',
};

const sansBold = readFileSync(join(root, 'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff'));
const monoRegular = readFileSync(join(root, 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff'));
const monoSemibold = readFileSync(join(root, 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff'));

function findFrontmatterBlock(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  return { yaml: match[1], blockEnd: match[0].length };
}

function buildCoverElement({ title, category, author }) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '1200px',
        height: '630px',
        backgroundColor: TOKENS.surface,
        borderLeft: `10px solid ${TOKENS.accent}`,
        padding: '64px 76px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: 'IBM Plex Mono',
              fontWeight: 400,
              fontSize: '24px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: TOKENS.accent,
            },
            children: category ? `${category} · albertoarena.it` : 'albertoarena.it',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: 'IBM Plex Sans',
              fontWeight: 700,
              fontSize: '60px',
              lineHeight: 1.2,
              letterSpacing: '-1.5px',
              color: TOKENS.ink,
              maxWidth: '920px',
            },
            children: title,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: 'IBM Plex Mono',
              fontWeight: 600,
              fontSize: '22px',
              color: TOKENS.ink2,
            },
            children: author,
          },
        },
      ],
    },
  };
}

async function renderCover({ title, category, author }) {
  const svg = await satori(buildCoverElement({ title, category, author }), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'IBM Plex Sans', data: sansBold, weight: 700, style: 'normal' },
      { name: 'IBM Plex Mono', data: monoRegular, weight: 400, style: 'normal' },
      { name: 'IBM Plex Mono', data: monoSemibold, weight: 600, style: 'normal' },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}

function slugFromDirAndFrontmatter(dirName, fm) {
  if (fm.slug) return String(fm.slug).replace(/^\/posts\//, '');
  return dirName;
}

async function main() {
  const entries = readdirSync(postsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
  let generated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const mdPath = join(postsDir, entry.name, 'index.md');
    if (!existsSync(mdPath)) continue;

    const raw = readFileSync(mdPath, 'utf-8');
    const block = findFrontmatterBlock(raw);
    if (!block) continue;

    const fm = parseYaml(block.yaml);
    if (fm.cover || fm.socialImage || fm.draft) {
      skipped++;
      continue;
    }

    const slug = slugFromDirAndFrontmatter(entry.name, fm);
    console.log(`Generating cover for ${slug}...`);

    const png = await renderCover({
      title: fm.title,
      category: fm.category,
      author: 'Alberto Arena',
    });

    const outDir = join(publicDir, 'images', 'posts', slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'cover.png'), png);

    const newField = `socialImage: "/images/posts/${slug}/cover.png"\n`;
    const updated = raw.slice(0, block.blockEnd - 4) + newField + raw.slice(block.blockEnd - 4);
    writeFileSync(mdPath, updated);
    generated++;
  }

  console.log(`\nGenerated ${generated} cover(s), skipped ${skipped} post(s) that already had one.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
