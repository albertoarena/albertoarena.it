# albertoarena.it — Restyle Plan (for review)

**Status:** proposal. Nothing is implemented. No commits until you approve.
**Goal:** rethink layout/structure while staying minimalist. Light mode first, dark parity verified.
**Locked direction:** compare two structures · one text face + JetBrains Mono · self-hosted via Fontsource variable fonts.

---

## 0. Starting point (what's there today)

Astro 5 + Tailwind v4 (CSS-first `@theme`), HSL tokens (deliberately overriding v4 OKLCH for Disqus), system font stack, mono for metadata, class-based dark mode with flash prevention, view transitions, Shiki `github-dark` for code, `reading-time`, category + tag pages. Engineering is clean. The design sits in safe-default territory — which is the whole opportunity.

Three concrete weak points the plan addresses:
1. **Redundant identity** — sidebar shows photo/name/role/nav, then the homepage opens with a second mini-bio. The hero asserts nothing.
2. **System fonts** — the single biggest "template" signal. No real typographic voice.
3. **No reading measure** — posts use `prose max-w-none`, so body text runs the full column width (too wide).

---

## 1. Design tokens (proposed)

### Typography

**Text face: Geist Sans** (variable, self-hosted via `@fontsource-variable/geist-sans`).
Rationale, not default-reaching: Geist is a contemporary engineering-flavoured grotesque (made by Vercel's type team) with excellent screen rendering and a neutral-but-not-anonymous voice. It reads as "built by someone who cares about tooling" without shouting — which matches a DX/event-sourcing blog. It is *not* Inter (the true default), and it pairs naturally with a geometric mono.

**Mono face: JetBrains Mono** (variable, `@fontsource-variable/jetbrains-mono`) for: code blocks (replacing Shiki's fallback mono), inline code, and the metadata line (date / category / reading time — already `font-mono`). For a software engineer's blog, code is first-class content; a real mono face signals that.

> Alternative if you want *more* character (say the word and I'll swap): **Newsreader** (display serif) for headings + Geist body. More editorial. Riskier to maintain. Default plan keeps the single-text-face appetite you chose.

**Delivery:** Fontsource variable packages, imported in `BaseLayout`, bundled and served from your domain. `font-display: swap`. No Google CDN, no GDPR/consent friction (consistent with your cookie care), no external render dependency.

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
(System stack stays as the fallback chain — zero FOIT risk.)

### Color

Keep your HSL token discipline. Two deliberate adjustments:

1. **Fix the jarring hover.** Today links go blue→orange on hover (hue flip). Proposed: hover stays in-family (blue, slightly darker/brighter) — `--color-primary` → a `--color-primary-hover`. Orange (`secondary`) is *retained but demoted* to a single accent role (active nav underline, tag hover) so it reads as intentional, not random.
2. **One warmer neutral.** Body text on a pure-white background at `--color-dark` (hsl 220 17% 17%) is slightly harsh. Proposed body ink: hsl(220, 15%, 22%) light / unchanged dark. Subtle; improves long-read comfort.

No palette overhaul — minimalist brief. The blue stays the identity color.

### Spacing / rhythm

- **Reading measure:** post body capped at ~68ch (drop `max-w-none`, set `prose` + `max-w-[68ch]` on the article body only — header/footer stay full column).
- Card list spacing `space-y-10` → `space-y-8` once cards get a clearer divider (below).

---

## 2. Structure — the two options to compare

You asked to see both. Here they are with tradeoffs; pick one (or a hybrid) at approval.

### Option A — Refined sidebar (evolve what exists)

```
┌──────────────────────────────────────────────┐
│  ┌────────┐                                   │
│  │ ▓▓▓▓▓▓ │   Senior software engineer.       │  ← hero moves
│  │ avatar │   I build developer tooling for   │     into content
│  │ name   │   Laravel & event sourcing.       │     column, sidebar
│  │ ·Art   │   ───────────────────────────     │     loses its
│  │ ·Proj  │   Jun 18 / Laravel / 3 min        │     duplicate bio
│  │ ·About │   Filament event sourcing…        │
│  │ links  │   Jun 4  / OSS / 3 min            │
│  │ ☀/☾    │   traffic-badge…                  │
│  └────────┘                                   │
└──────────────────────────────────────────────┘
```
- **Changes:** remove the duplicate bio from the sidebar (`Author.astro` bio line); the *real* positioning statement lives once, in the content hero. Sidebar becomes pure identity + nav + theme. Tighten widths, add a hairline between sidebar and content on desktop.
- **Pros:** least disruptive, keeps your established skeleton, persistent nav always visible, fast to ship.
- **Cons:** the left-rail-blog shape is itself common; less of a "rethink."

### Option B — Top-bar + centered single column (the bigger rethink)

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
- **Changes:** sidebar retired; nav → slim sticky top bar (name left, menu + theme right). Content centered at reading measure. Photo demoted to the About page + post-footer author card (already exists).
- **Pros:** reads as a *publication*, not a personal-homepage template; best reading measure by default; more whitespace = more "senior/minimal"; the structural rethink you asked for.
- **Cons:** loses always-visible avatar branding; more components to change (new Header, retire Sidebar wiring on list/post pages); mobile nav needs a small menu treatment.

**My recommendation:** **Option B**, *if* you're comfortable demoting the photo. It's the genuine structural rethink and it suits a senior engineer's blog better. Option A is the safe, fast choice. The plan will spec whichever you pick (or A's hero fix + B's measure, as a hybrid).

---

## 3. The hero (the "thesis")

Replace the redundant mini-bio with a single, opinionated positioning line — written once, no duplication:

> **Senior software engineer.** I build and maintain developer tooling for Laravel and event sourcing — including the Laravel Event Sourcing Generator (10k+ downloads).

- One short paragraph, real link, no avatar repetition.
- Optionally a one-line "currently" sub-note (open to remote/freelance EU work) — your call, it can read as either useful or job-seeky. Flagged, not assumed.

---

## 4. Per-component changes

| Component | Change |
|---|---|
| `global.css` `@theme` | new `--font-sans`/`--font-mono`; `--color-primary-hover`; warmer body ink token |
| `BaseLayout.astro` | import Fontsource variable fonts; set `theme-color` to match |
| `Author.astro` | remove duplicate bio line (both options); in Option B, retire from list/post |
| `index.astro` | single-source hero; tighten section spacing |
| `PostCard.astro` | consistent treatment whether or not a cover exists (most have none → make the no-cover case the primary design, cover optional); keep the nice left-border hover |
| `PostLayout.astro` | body wrapped at reading measure; H1/H2 scale; mono metadata refinement |
| `Header.astro` *(Option B)* | new slim sticky top bar + mobile menu |
| `Sidebar/*` *(Option B)* | retired from list/post layouts |
| `prose` tokens | re-point to new ink; verify dark parity |

---

## 5. Dark mode parity (verified, not assumed)

Every token change gets a paired dark value. Specific checks: new body ink contrast ratio ≥ 7:1 light / ≥ 7:1 dark (AAA body), link + hover legible on `--color-dark-paper`, JetBrains Mono in Shiki `github-dark` blocks, tag/category chips on dark. Your `@variant dark` overrides for `.prose` already exist — they'll be updated in lockstep.

---

## 6. Quality floor (non-negotiables carried through)

Responsive to mobile · visible keyboard focus (your `focus-visible` rings stay) · `prefers-reduced-motion` respected (your `animate-fade-in`/`stagger` gated) · no layout shift from fonts (`swap` + system fallback) · Lighthouse perf not regressed (variable fonts subset, self-hosted).

---

## 7. Verification approach (the "TDD where it applies" part)

Visual/styling work isn't unit-testable, but the refresh ships with checks rather than vibes:
- `astro build` must pass clean (catches broken imports/refs).
- `astro check` for TS.
- A short **manual QA checklist** in the instructions file: homepage (light/dark, desktop/mobile), one post, category page, tag page, 404 — each eyeballed against the plan.
- Optional: a Playwright screenshot smoke test (light+dark homepage + one post) if you want regression coverage. Flagged as optional — say if you want it scoped in.
- `envaudit` isn't relevant here (static site, no meaningful env surface) — noted so it's a conscious omission, not an oversight.

---

## 8. What I need from you to proceed

1. **Structure:** Option A, Option B, or hybrid? (my rec: B, if photo-demotion is fine)
2. **Hero "currently available" sub-line:** include or omit?
3. **Playwright screenshot smoke test:** in or out?
4. Anything above you want changed before I write the build instructions.

On your answers I'll produce `blog-refresh-instructions.md` for Claude Code — phased, build-verified, KISS — matching your usual workflow. Still no commits until you've seen that too.
