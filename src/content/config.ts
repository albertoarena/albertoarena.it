import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
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
    cover: z.string().optional()
  })
});

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    template: z.literal('page'),
    socialImage: z.string().optional()
  })
});

export const collections = {
  posts: postsCollection,
  pages: pagesCollection
};
