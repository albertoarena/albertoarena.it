import { getCollection, type CollectionEntry } from 'astro:content';

export type SupportedLang = 'en' | 'it';

export async function getEnglishPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts');
  return posts.filter((p) => (p.data.lang ?? 'en') === 'en' && !p.data.draft);
}

export async function getItalianPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts');
  return posts.filter((p) => p.data.lang === 'it' && !p.data.draft);
}

export async function findItalianTranslation(englishSlug: string): Promise<CollectionEntry<'posts'> | null> {
  const posts = await getCollection('posts');
  return posts.find((p) => p.data.lang === 'it' && p.data.translationOf === englishSlug) ?? null;
}
