import readingTime from 'reading-time';
import type { CollectionEntry } from 'astro:content';

export function getReadingTime(content: string): string {
  const result = readingTime(content);
  return result.text;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function getUniqueCategories(posts: any[]): string[] {
  const categories = posts
    .map((post) => post.data.category)
    .filter((category): category is string => !!category);
  return [...new Set(categories)].sort();
}

export function getUniqueTags(posts: any[]): string[] {
  const tags = posts.flatMap((post) => post.data.tags || []);
  return [...new Set(tags)].sort();
}

export function getCategorySlug(category: string): string {
  return slugify(category);
}

export function getTagSlug(tag: string): string {
  return slugify(tag);
}

// Content Layer entry.id format: 'my-post/index.md' or 'my-post.md'
// Frontmatter slug field takes priority when set.
export function getPostSlug(post: CollectionEntry<'posts'>): string {
  if (post.data.slug) return post.data.slug.replace(/^\/posts\//, '');
  return post.id.replace(/\/index\.(md|mdx)$/, '').replace(/\.(md|mdx)$/, '');
}

export function getPageSlug(page: CollectionEntry<'pages'>): string {
  return page.id.replace(/\/index\.(md|mdx)$/, '').replace(/\.(md|mdx)$/, '');
}
