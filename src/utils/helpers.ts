import readingTime from 'reading-time';

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
