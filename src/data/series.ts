/*
  Single source of truth for series metadata (redesign-plan.md §10). Post
  membership itself lives in each post's own `series: {slug, order}`
  frontmatter, not here — this registry only supplies the human-readable
  title/description/meta-line wording per slug, for /series, /series/[slug],
  and PostLayout's meta line + aside.
*/
export interface SeriesEntry {
  slug: string;
  title: string;
  /** Completes "Nth in the {metaLabel}" in the post meta line. */
  metaLabel: string;
  description: string;
  /**
   * Same convention as posts' `pinned` field: floats an entry to the top of
   * /series, ahead of everything unpinned. Among pinned entries, order
   * follows their position in this array (truss before how-to-use-ai below)
   * — reorder the array itself if that relative order needs to change.
   */
  pinned?: boolean;
}

export const seriesRegistry: SeriesEntry[] = [
  {
    slug: 'truss',
    title: 'Truss',
    metaLabel: 'Truss series',
    description: "Building a live, zoomable ER diagram for your Laravel app's database schema.",
    pinned: true,
  },
  {
    slug: 'how-to-use-ai',
    title: 'How to use AI',
    metaLabel: 'how to use AI series',
    description: 'Practitioner discipline for working with AI: review, trust, safety, and context.',
    pinned: true,
  },
  {
    slug: 'event-sourcing',
    title: 'Event sourcing',
    metaLabel: 'event sourcing thread',
    description: 'A Laravel event-sourcing generator, then an AI skill that designs domains in conversation instead.',
  },
  {
    slug: 'claude-md',
    title: 'CLAUDE.md memory model',
    metaLabel: 'CLAUDE.md memory model series',
    description: 'What actually belongs in CLAUDE.md, and a four-tier model for the rest.',
  },
  {
    slug: 'claude-goal-loop',
    title: 'Claude Code automation',
    metaLabel: 'Claude Code automation thread',
    description: 'Comparing /goal, /loop, and routines for unattended Claude Code work.',
  },
  {
    slug: 'ci',
    title: 'CI tooling',
    metaLabel: 'CI tooling thread',
    description: 'Tooling that keeps a Laravel pipeline honest: catching config drift before deploy, and deploying safely to shared hosting.',
  },
];

export function getSeriesEntry(slug: string): SeriesEntry | undefined {
  return seriesRegistry.find((entry) => entry.slug === slug);
}

/*
  Series position markers ("Truss 3/3") need a total per series, computed
  once against the full post set a page already has in hand rather than
  re-querying the collection per row. Callers build this once per page and
  pass the per-post marker down to whichever list component renders it.
*/
export function buildSeriesTotals(posts: { data: { series?: { slug: string } } }[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const post of posts) {
    if (post.data.series) {
      totals.set(post.data.series.slug, (totals.get(post.data.series.slug) ?? 0) + 1);
    }
  }
  return totals;
}

export function getSeriesMarker(
  post: { data: { series?: { slug: string; order: number } } },
  seriesTotals: Map<string, number>,
): string | undefined {
  if (!post.data.series) return undefined;
  const entry = getSeriesEntry(post.data.series.slug);
  const total = seriesTotals.get(post.data.series.slug) ?? post.data.series.order;
  return `${entry?.title ?? post.data.series.slug} ${post.data.series.order}/${total}`;
}
