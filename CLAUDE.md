# CLAUDE.md

## Development Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
```

## Architecture

- **Framework**: Astro 5 static site generator with Tailwind CSS
- **Content**: Markdown files with YAML frontmatter in content collections
- **Styling**: Tailwind CSS with @tailwindcss/typography plugin
- **Site Config**: `/src/utils/config.ts`

## Content Structure

### Posts
Location: `/src/content/posts/[slug]/index.md`

Frontmatter fields:
- `title`, `date`, `template` (required)
- `draft`, `slug`, `category`, `tags`, `description`, `socialImage` (optional)

#### Checklist: adding a new post

`/public/llms.txt` is a hand-maintained index and does not update itself. Every
new post must also be added there:

- [ ] Skip this while `draft: true` — add the entry only once the post is published
- [ ] Add one line under `## Posts`, at the top of the list (newest first, matching `date`)
- [ ] Format: `- [Title](https://albertoarena.it/posts/<slug>/): <description>`
- [ ] Reuse the post's existing `description` frontmatter field verbatim — don't write new copy
- [ ] Only index the canonical English post — skip `it.md` translation companions

### Images

Always resize and compress images before committing. Large files slow page loads and break social card crawlers.

- **Social images** (`socialImage`): 1200×630 px, < 1 MB (JPEG quality 85)
- **Content/accessory images**: max 1200 px wide, < 200 KB (WebP preferred, or JPEG quality 80-85)

Quick resize with ImageMagick:
```bash
# Social image
magick input.jpg -resize 1200x630^ -gravity center -extent 1200x630 -quality 85 output.jpg

# Content image (preserve aspect ratio, cap width)
magick input.jpg -resize 1200x\> -quality 82 output.webp
```

### Third-party image attribution

Any third-party image used in a post (photos, book covers, logos, screenshots of external projects) must be referenced in `/src/content/pages/credits/index.md`. Add a row to the relevant table (Photography for Unsplash photos, Images & logos for everything else) with the post link, image description, and source/author.

### Pages
Location: `/src/content/pages/[slug]/index.md`

## Layout

Single-column, no sidebar. The shell is:

```
BaseLayout (html/head/scripts)
└── Layout.astro
    ├── Header (nav: Articles, Projects, About me + theme toggle)
    ├── <main class="max-w-3xl mx-auto px-6 py-12"> ← all page content goes here
    └── Footer
```

- **Homepage** (`/src/pages/index.astro`): hero bio section → post list → pagination
- **Post** (`/src/layouts/PostLayout.astro`): header meta → prose body → tags footer → author bio → Disqus comments

## Key Directories

- `/src/components/` - Astro components
- `/src/layouts/` - Page layouts (BaseLayout, PostLayout)
- `/src/pages/` - Page routes
- `/src/content/` - Content collections (posts, pages)
- `/src/styles/` - Global CSS
- `/src/utils/` - Utility functions and config
- `/public/` - Static assets

## Path Aliases

Use these import aliases (configured in tsconfig.json):
- `@/*` → `./src/*`

## Git Commit Conventions

### Format
- type: short subject line (max 50 chars)
- Detailed body paragraph explaining what and why (not how).

### Rules
- No Claude attribution - NEVER include "Generated with Claude Code" or "Co-Authored-By: Claude"
- Keep first line under 50 characters
- Use heredoc for multi-line commit messages
