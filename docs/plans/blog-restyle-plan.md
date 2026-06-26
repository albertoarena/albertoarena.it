# albertoarena.it — Restyle Plan

**Status:** approved. Implementation pending build instructions sign-off.
**Branch:** `restyle/blog-2025`
**Goal:** rethink layout/structure while staying minimalist. Light mode first, dark parity verified.
**Locked direction:** Option B · Geist Sans + JetBrains Mono · self-hosted via Fontsource variable fonts · Playwright smoke tests in scope.

---

## 0. Starting point (what's there today)

Astro 5 + Tailwind v4 (CSS-first `@theme`), HSL tokens (deliberately overriding v4 OKLCH for Disqus), system font stack, mono for metadata, class-based dark mode with flash prevention, view transitions, Shiki `github-dark` for code, `reading-time`, category + tag pages. Engineering is clean. The design sits in safe-default territory — which is the whole opportunity.

Three concrete weak points the plan addresses:
1. **Redundant identity** — sidebar shows photo/name/role/nav, then the homepage opens with a second mini-bio. The hero asserts nothing.
2. **System fonts** — the single biggest "template" signal. No real typographic voice.
3. **No reading measure** — posts use `prose max-w-none`, so body text runs the full column width (too wide).

---

## 1. Design tokens

### Typography

**Text face: Geist Sans** (variable, self-hosted via `@fontsource-variable/geist-sans`).
Geist is a contemporary engineering-flavoured grotesque (made by Vercel's type team) with excellent screen rendering and a neutral-but-not-anonymous voice. It reads as "built by someone who cares about tooling" without shouting — which matches a DX/event-sourcing blog. Pairs naturally with JetBrains Mono.

**⚠ Preview gate:** typography changes go into the dev server first. Both fonts must be approved on screen before committing type tokens.

**Mono face: JetBrains Mono** (variable, `@fontsource-variable/jetbrains-mono`) for: code blocks (replacing Shiki's fallback mono), inline code, and the metadata line (date / category / reading time — already `font-mono`). For a software engineer's blog, code is first-class content; a real mono face signals that.

**Delivery:** Fontsource variable packages, imported in `BaseLayout`, bundled and served from your domain. `font-display: swap`. No Google CDN, no GDPR/consent friction, no external render dependency.

**Type scale** (proposed, replaces ad-hoc sizes):

| Role | Size / line-height / weight |
|---|---|
| Post H1 | `text-4xl` / 1.1 / 700 |
| Post H2 | `text-2xl` / 1.25 / 650 |
| Card title (H2) | `text-xl` / 1.3 / 600 |
| Body | `text-[1.0625rem]` / 1.7 / 400 |
| Metadata (mono) | `text-sm` / 1.4 / 450, tracking +0.01em |

`@theme` change:
```css
--font-sans: 'Geist Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;
```
System stack stays as the fallback chain — zero FOIT risk.

### Color

Keep existing HSL token discipline. One deliberate adjustment:

- **Warmer body ink.** Body text on a pure-white background at `--color-dark` (hsl 220 17% 17%) is slightly harsh. Proposed body ink: hsl(220, 15%, 22%) light / unchanged dark. Subtle; improves long-read comfort.

**Link hover:** keep blue→orange. Orange (`--color-secondary`) is intentional brand; the hover behaviour stays. Orange may be further demoted to accent roles (active nav underline, tag hover) where it was previously used generically, but the prose link hover is unchanged.

No palette overhaul — minimalist brief. Blue stays the identity color.

### Spacing / rhythm

- **Reading measure:** post body capped at ~68ch (drop `max-w-none`, use `prose` + `max-w-[68ch]` on the article body only — header/footer stay full column width).
- Card list spacing `space-y-10` → `space-y-8` once cards have a clearer divider.

---

## 2. Structure — Option B (chosen)

```
┌──────────────────────────────────────────────┐
│  Alberto Arena        Articles Projects About ☀│  ← slim sticky top bar
├──────────────────────────────────────────────┤
│                                                │
│        Senior software engineer.               │  ← hero is a thesis,
│        I build developer tooling for           │     centered, generous
│        Laravel and event sourcing.             │     whitespace
│        ──────────────────────────              │
│                                                │
│        Jun 18 / Laravel / 3 min                │
│        Filament event sourcing…                │  ← single reading
│                                                │     column, ideal
│        Jun 4 / OSS / 3 min                     │     measure
│        traffic-badge…                          │
└──────────────────────────────────────────────┘
```

**What changes:**
- Sidebar retired from all layouts.
- Nav → slim sticky top bar: name/logo left, links + theme toggle right.
- Mobile: hamburger menu (icon button → overlay or slide-in drawer).
- Content centered at reading measure.
- Photo demoted to About page + post-footer author card (already exists).

**Rationale:** reads as a publication, not a personal-homepage template; best reading measure by default; more whitespace suits a senior/minimal aesthetic; genuine structural rethink rather than a surface polish.

---

## 3. The hero

**⚠ Preview gate:** hero copy goes into the dev server first for approval before committing.

Draft copy:

> **Senior software engineer.** I build and maintain developer tooling for Laravel and event sourcing — including the Laravel Event Sourcing Generator (10k+ downloads).
>
> *Currently open to remote / freelance EU work.*

- One paragraph, one real link, no avatar repetition.
- "Currently open" sub-line included.

---

## 4. Per-component changes

| Component | Change |
|---|---|
| `global.css` `@theme` | new `--font-sans`/`--font-mono`; warmer body ink token |
| `BaseLayout.astro` | import Fontsource variable font packages |
| `Author.astro` | retired from list/post layouts (Option B); retained on About page |
| `index.astro` | single-source hero with "currently" sub-line; tighten section spacing |
| `PostCard.astro` | no-cover case is the primary design (cover optional); keep left-border hover |
| `PostLayout.astro` | body wrapped at 68ch reading measure; H1/H2 type scale; mono metadata |
| `Header.astro` | replace with slim sticky top bar; hamburger + drawer for mobile |
| `Sidebar/*` | retired from list/post layouts |
| `prose` tokens | re-point to new body ink; verify dark parity |

---

## 5. Dark mode parity (verified, not assumed)

Every token change gets a paired dark value. Specific checks: new body ink contrast ratio ≥ 7:1 light / ≥ 7:1 dark (AAA body), link + hover legible on `--color-dark-paper`, JetBrains Mono in Shiki `github-dark` blocks, tag/category chips on dark. Existing `@variant dark` overrides for `.prose` updated in lockstep.

---

## 6. Quality floor (non-negotiables)

Responsive to mobile · visible keyboard focus (`focus-visible` rings stay) · `prefers-reduced-motion` respected (`animate-fade-in`/`stagger` gated) · no layout shift from fonts (`swap` + system fallback) · Lighthouse perf not regressed (variable fonts subset, self-hosted).

---

## 7. Verification

- `astro build` must pass clean.
- `astro check` for TypeScript.
- **Manual QA checklist** (in build instructions): homepage light/dark desktop/mobile · one post · category page · tag page · 404.
- **Playwright screenshot smoke test** (in scope): light + dark homepage + one post — regression coverage for layout regressions.

---

## 8. Preview gates (two checkpoints before full commit)

1. **Typography preview** — install fonts, wire into `@theme`, run dev server. Approve Geist Sans + JetBrains Mono on screen before proceeding.
2. **Hero copy preview** — render draft hero in dev server. Approve or edit copy before locking.

No commits on these items until you've seen them live on the dev server.
