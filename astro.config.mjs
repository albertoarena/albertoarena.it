import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://albertoarena.it',
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.startsWith('/category/')) return false;
        if (path.startsWith('/categories')) return false;
        if (path.startsWith('/tag/')) return false;
        if (path.startsWith('/tags')) return false;
        if (/^\/page\/\d+\/$/.test(path)) return false;
        return true;
      }
    }),
    mdx()
  ],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]
    ],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: true
    }
  }
});
