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
}

export const seriesRegistry: SeriesEntry[] = [
  {
    slug: 'truss',
    title: 'Truss',
    metaLabel: 'Truss series',
    description: "Building a live, zoomable ER diagram for your Laravel app's database schema.",
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
    slug: 'how-to-use-ai',
    title: 'How to use AI',
    metaLabel: 'how to use AI series',
    description: 'Practitioner discipline for working with AI: review, trust, safety, and context.',
  },
];

export function getSeriesEntry(slug: string): SeriesEntry | undefined {
  return seriesRegistry.find((entry) => entry.slug === slug);
}
