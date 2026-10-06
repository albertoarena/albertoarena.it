import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeExternalLinks from 'rehype-external-links';
import { visit } from 'unist-util-visit';

/*
  Shiki's own `pre` already scrolls horizontally (@tailwindcss/typography's
  base styles put `overflow-x: auto` on `.prose pre`), but a scrollable
  region needs to be reachable by keyboard too — same reasoning as the
  `.doc-scroll` code blocks on the Spatie cheat sheet (tabindex="0" there is
  deliberate, not a stray attribute).
*/
function rehypeCodeBlockTabindex() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'pre') {
        node.properties.tabIndex = 0;
      }
    });
  };
}

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
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      rehypeCodeBlockTabindex
    ],
    shikiConfig: {
      theme: 'github-dark-default'
    }
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: true
    }
  }
});
