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

### Pages
Location: `/src/content/pages/[slug]/index.md`

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
