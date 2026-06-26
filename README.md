# albertoarena.it

Personal blog and portfolio — live at **[albertoarena.it](https://albertoarena.it)**.

## Stack

- [Astro 5](https://astro.build) — static site generator with View Transitions and Content Layer
- [Tailwind CSS v4](https://tailwindcss.com) — utility-first CSS, configured entirely in CSS via `@theme`
- [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) — prose styling for Markdown content
- Markdown / MDX content collections

## Development

```bash
npm install       # Install dependencies
npm run dev       # Dev server at localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview the production build locally
```

## Project structure

```
src/
├── components/       # Astro components (Sidebar, PostCard, Feed, etc.)
├── content/
│   ├── config.ts     # Content Layer collection definitions
│   ├── posts/        # Blog posts — one directory per post
│   └── pages/        # Static pages (about, credits, privacy)
├── layouts/          # BaseLayout, PostLayout
├── pages/            # File-based routes
├── styles/
│   └── global.css    # Tailwind v4 entry point — @theme tokens, dark mode, prose
└── utils/            # Config, helpers, slug utilities
```

## Content

Posts live in `src/content/posts/[slug]/index.md`. Frontmatter fields:

| Field | Required | Description |
|---|---|---|
| `title` | yes | Post title |
| `date` | yes | Publication date |
| `template` | yes | Must be `"post"` |
| `draft` | no | Hides from listings when `true` |
| `category` | no | Single category label |
| `tags` | no | Array of tag strings |
| `description` | no | Used in post card and OG meta |
| `socialImage` | no | OG image path (1200×630 px, < 1 MB) |
| `lang` | no | `"en"` (default) or `"it"` |
| `translationOf` | no | English post slug — links Italian translations |

### Images

Resize before committing. Large files slow loads and break social card crawlers.

```bash
# Social image (1200×630, < 1 MB)
magick input.jpg -resize 1200x630^ -gravity center -extent 1200x630 -quality 85 output.jpg

# Content image (max 1200 px wide, < 200 KB)
magick input.jpg -resize 1200x\> -quality 82 output.webp
```

Third-party images must be credited in `src/content/pages/credits/index.md`.
