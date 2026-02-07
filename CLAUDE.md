# CLAUDE.md

## Development Commands

```bash
yarn start        # Development server (cleans cache first)
yarn build        # Production build
yarn test         # Run Jest tests
yarn test:watch   # Watch mode for tests
yarn lint         # Check TypeScript and SCSS formatting
yarn format       # Auto-fix formatting
```

## Architecture

- **Framework**: Gatsby 5 static site generator with React 18 and TypeScript
- **Content**: Markdown files with YAML frontmatter
- **Styling**: SCSS modules
- **Site Config**: `/content/config.json`

## Content Structure

### Posts
Location: `/content/posts/YYYY-MM-DD--Post-Title/index.md`

Frontmatter fields:
- `title`, `date`, `template` (required)
- `draft`, `slug`, `category`, `tags`, `description`, `socialImage` (optional)

### Pages
Location: `/content/pages/`

## Key Directories

- `/src/components/` - React components
- `/src/templates/` - Page templates (post, page, category, tag, index)
- `/src/hooks/` - Custom React hooks
- `/internal/gatsby/` - Build configuration (node creation, page generation)

## Path Aliases

Use these import aliases:
- `@/components`
- `@/hooks`
- `@/utils`
- `@/types`
- `@/constants`

## Git Commit Conventions

### Format
- type: short subject line (max 50 chars)
- Detailed body paragraph explaining what and why (not how).

### Rules
- No Claude attribution - NEVER include "Generated with Claude Code" or "Co-Authored-By: Claude"
- Keep first line under 50 characters
- Use heredoc for multi-line commit messages
