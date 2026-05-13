Translate a blog post to Italian.

The post slug is: $ARGUMENTS

## Steps

1. Find the English source file at `src/content/posts/$ARGUMENTS/index.md` and read it.

2. Translate the entire Markdown body to Italian. Keep:
   - Code blocks, inline code, filenames, package names, and URLs **unchanged**
   - Markdown formatting (headings, bold, links, lists) **unchanged**
   - Technical terms in their original English form when there is no natural Italian equivalent
   - All frontmatter field names **unchanged**

3. Build the Italian frontmatter:
   - Copy `date`, `template`, `category`, `tags`, `cover`, `socialImage` verbatim from the English file
   - Set `lang: it`
   - Set `translationOf: $ARGUMENTS`
   - Translate `title` and `description` to Italian
   - Do NOT include `slug` — Italian posts are routed via `translationOf`, not slug

4. Write the result to `src/content/posts/$ARGUMENTS/index.it.md`.

5. Report what was written and flag any sentences where the Italian translation felt uncertain or where a technical term may need review.

Do not commit the file. The user will review and edit it before committing.
