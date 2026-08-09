import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    template: z.literal('post'),
    draft: z.boolean().default(false),
    slug: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    socialImage: z.string().optional(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    pinned: z.boolean().default(false),
    lang: z.enum(['en', 'it']).default('en'),
    translationOf: z.string().optional(),
    /*
      Generalised series (redesign-plan.md §7, §10). `slug` groups posts,
      `order` sequences them. Truss's series is migrated here in Phase 3;
      src/data/trussSeries.ts stays authoritative for the home page's Truss
      block until Phase 5 retires it and builds /series.
    */
    series: z.object({
      slug: z.string(),
      order: z.number(),
    }).optional(),
    /*
      GitHub repo ("owner/name") to link "open a discussion" at, in place of
      Disqus. Only set this on posts genuinely about that package (Truss
      posts point at laravel-truss) — everything else falls back to
      siteConfig.discussionRepo (the blog's own repo).
    */
    discussion: z.string().optional(),
  })
});

const pagesCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    template: z.literal('page'),
    socialImage: z.string().optional(),
    lang: z.enum(['en', 'it']).default('en'),
    translationOf: z.string().optional()
  })
});

export const collections = {
  posts: postsCollection,
  pages: pagesCollection
};
