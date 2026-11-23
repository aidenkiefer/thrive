# 07 — Design System

Brand style audit of the live site and a plan to revamp into a modern, sleek, simple-but-powerful design suite for the Next.js rebuild.

**Sources:** CSS/HTML audit of [thrivevineyard.com](https://thrivevineyard.com/) (2026-06-20), Pro theme stack config, inline Cornerstone styles. See also [01-current-site-audit.md](./01-current-site-audit.md) for content context.

---

## Part 1 — Current brand subaudit

### Platform & theme

| Item | Value |
|---|---|
| Theme | Pro (Themeco) — **Integrity Light** stack |
| Builder | Cornerstone page builder (class prefixes `m55-`, `m1p-`) |
| Icons | Font Awesome Pro (solid, regular, brands) |
| Max content width | 1200px (`x-container.max`) |
| Base font size | 16px mobile → 17px tablet+ |

The site is a customized church template, not a purpose-built design system. Styles are scattered across theme defaults, Cornerstone inline CSS, plugin overrides (MEC, Sermon Manager), and one-off snippets.

---

### Logo & wordmark

| Asset | Location |
|---|---|
| Header wordmark | `wp-content/uploads/2024/03/titleheader.png` |
| Favicon | `wp-content/uploads/2024/03/cropped-thrive-favicon-*.png` (32–270px) |

Logo is a raster PNG wordmark — no SVG source in repo. Favicon uses a cropped mark version. **Action:** Obtain or recreate vector logo before v0.3.0 UI work.

---

### Tagline & voice

| Element | Live copy |
|---|---|
| Hero headline | "Thrive vineyard church" |
| Hero subheadline | **"Spirit Filled. Down to Earth."** |
| SEO tone | Warm, welcoming, spirit-filled; long-form prose blocks |
| Section CTAs | `>> Let's Go`, `>> Click Here and Hear`, etc. |

**Voice to preserve:** approachable, grounded, Holy Spirit–centered — not corporate or overly polished. **Voice to drop:** generic SEO filler paragraphs, chevron-prefixed link CTAs.

---

### Color palette (live)

Three overlapping “brand blues” compete on the live site:

| Token | Hex | Where used | Notes |
|---|---|---|---|
| **Navy (primary)** | `#183d59` | Header bar, section headings, hub icons, Mailchimp heading/button, newsletter | **De facto brand color** — most intentional |
| **Link gray** | `#515151` / `rgb(81,81,81)` | Theme default links, buttons, accents | Pro Integrity Light stack default — not on-brand |
| **Hover gray** | `#8d8d8d` / `rgb(141,141,141)` | Link/button hover | Theme default |
| **Legacy blue** | `#0054a6` | Custom CSS snippet labeled "Thrive primary brand color" | Conflicts with navy — likely outdated |
| **MEC calendar** | `#1c4e73` | Events plugin skin | Close to navy but separate token |
| **Legacy sage accent** | `#DFE1BD` / `rgb(223,225,189)` | Hero subheadline only | Replaced in the rebuild because it reads yellow-green |
| **Black** | `#000000` | Top bar, footer bands, off-canvas menu, hero text | Heavy — reads dated |
| **White** | `#ffffff` | Body background, cards, inverted buttons | |
| **Light gray** | `#f5f5f5` / `#f9f9f9` | Card sections, form backgrounds | |
| **Text black** | `#000000` | Body copy, headings | High contrast, no soft neutrals |
| **Theme red shadow** | `#a71000` | Button box-shadow (Pro default) | Accidental — not brand |

**Assessment:** Navy `#183d59` and sage `#DFE1BD` are the only distinctive Thrive colors. Everything else is theme/plugin defaults. No documented token system, no semantic naming, no dark-mode consideration.

---

### Typography (live)

| Role | Font | Weights | Style |
|---|---|---|---|
| Headings (h1–h6) | **Montserrat** | 700 | Normal letter-spacing |
| Body, forms, nav | **Raleway** | 400, 600, 700 | |
| Nav links | Raleway | 600 | Uppercase, `letter-spacing: 0.05em` |
| Labels/meta | Montserrat | 700 | |

Loaded via Google Fonts. Montserrat + Raleway is one of the most common pairings on the web — reads as generic template, not intentional brand typography.

**Scale (observed):**

| Element | Size |
|---|---|
| Hero headline | ~3.5em (~60px) |
| Section titles | ~3em / 3.75em |
| Body | 1em–1.15em (16–19px) |
| Small/meta | 0.7em–0.9em, often uppercase |
| Line height | 1.4–1.6 body; 1.0 headings |

---

### Layout & components (live)

| Pattern | Description |
|---|---|
| **Header** | Black 25px top bar → navy 80px nav with centered logo, uppercase links, mobile off-canvas (black) |
| **Hero** | Full-bleed stock photo + dark overlay (`rgba(54,58,57,0.35)`) + centered white type |
| **Carousel** | Announcement slider with prev/next arrows |
| **Hub cards** | 6 image tiles (Kids, Messages, Events, Groups, About, Giving) in grid — `>>` text links |
| **Content blocks** | Alternating white / light gray (`#f5f5f5`) / black sections |
| **Buttons** | Gray fill (`#515151`), white text, slight radius (0.25em), drop shadow; navy variant on some CTAs |
| **Forms** | Gravity Forms default styling; Mailchimp classic embed |
| **Footer** | Black background, white text, service times / location / contact grid |

**Spacing:** Inconsistent — Cornerstone uses em-based padding per section (25vh hero, 3em section gaps, 20px grid gaps). No shared spacing scale.

**Imagery:** Mix of stock photos (hero, hub cards) and real church photography (staff, events). Stock images weaken authenticity.

---

### What works (keep the spirit)

- Navy `#183d59` — distinctive, calm, trustworthy; worth keeping as primary anchor
- The legacy sage is distinct but reads too yellow-green for the rebuilt site
- "Spirit Filled. Down to Earth." — strong positioning line
- Real photography where used (staff, community) — lean into this
- Clear hub navigation concept (Kids, Messages, Events, etc.) — simplify presentation, keep structure

### What doesn't work (revamp targets)

- Three competing blues + gray button system — no cohesive palette
- Montserrat/Raleway — generic, overused
- Black-heavy sections — feels heavy and dated, not "down to earth"
- Stock hero photography — undermines authenticity
- `>>` chevron CTAs — amateur, not modern
- Dense SEO prose blocks on homepage — hurts scanability
- Plugin-injected styles (MEC cyan, Sermon Manager overrides) — visual fragmentation
- No design tokens in codebase (`tailwind.config.ts` is empty)

---

## Part 2 — Revamp direction

### Design principles

1. **Simple surfaces, strong type** — Let typography and photography carry the page; reduce decorative chrome.
2. **Warm, not corporate** — Grounded ministry feel: navy depth + dusty-rose warmth + real people photos.
3. **One action per view** — Each section has a clear primary CTA; no chevron links or competing buttons.
4. **Breathing room** — Generous whitespace; fewer full-width black bands.
5. **System over pages** — Tokens and components first; pages compose from the system.

**North star:** A site that feels as welcoming as the church itself — modern and confident without being sterile.

---

### Proposed color system

Evolve from live colors into a semantic token palette:

| Token | Proposed value | Role |
|---|---|---|
| `brand-900` | `#0f2838` | Deepest navy — footer, dark sections |
| `brand-800` | `#183d59` | **Primary** — nav, headings, primary buttons (keep live navy) |
| `brand-600` | `#245a7a` | Hover states, links on light bg |
| `brand-100` | `#e8eef2` | Subtle tinted backgrounds |
| `accent-400` | `#c9828a` | Dusty rose — approachable emphasis for tags, secondary CTAs, and dark-surface details |
| `accent-50` | `#fbf1f0` | Blush-tinted highlight backgrounds |
| `neutral-950` | `#1a1a1a` | Body text (replace pure `#000`) |
| `neutral-600` | `#5c5c5c` | Secondary text |
| `neutral-100` | `#f7f7f5` | Page background (warm off-white, not pure white) |
| `neutral-0` | `#ffffff` | Cards, elevated surfaces |
| `success` / `warning` / `error` | Standard accessible hues | Forms, alerts only |

**Rules:**
- Primary buttons: `brand-800` fill, white text — not gray
- Body text: `neutral-950` on `neutral-100` — never pure black on pure white
- Accent dusty rose: sparingly — highlights, tags, secondary buttons, and section dividers
- Drop the legacy `#0054a6` and theme gray `#515151` entirely

---

### Proposed typography

Move away from Montserrat/Raleway. Recommended pairing:

| Role | Font | Why |
|---|---|---|
| **Display** (h1–h2, hero) | **[Fraunces](https://fonts.google.com/specimen/Fraunces)** or **Instrument Serif** | Warm serif with personality — spiritual depth without church cliché |
| **UI / body** (nav, body, forms) | **[Inter](https://fonts.google.com/specimen/Inter)** or **Source Sans 3** | Excellent readability, modern, variable font |

Alternative if serif feels too traditional: **Sora** (display) + **Inter** (body) — geometric but friendly.

**Type scale (rem-based, 1.25 ratio):**

| Token | Size | Use |
|---|---|---|
| `text-xs` | 0.75rem | Labels, meta |
| `text-sm` | 0.875rem | Captions, nav |
| `text-base` | 1rem | Body |
| `text-lg` | 1.125rem | Lead paragraphs |
| `text-xl` | 1.25rem | h4 |
| `text-2xl` | 1.563rem | h3 |
| `text-3xl` | 1.953rem | h2 |
| `text-4xl` | 2.441rem | h1 mobile |
| `text-5xl` | 3.052rem | Hero desktop |

**Rules:**
- Headings: display font, `font-semibold` not ultra-bold
- Body: `leading-relaxed` (1.625), max-width `prose` (~65ch)
- Labels/nav: `text-sm font-medium tracking-wide` — no all-caps unless very short
- Sentence case everywhere except "EXPRESS(O)" branding

---

### Proposed spacing & layout

| Token | Value |
|---|---|
| `max-w-content` | 72rem (1152px) |
| `max-w-prose` | 42rem |
| Section padding | `py-16 md:py-24` |
| Component gap | 4 / 6 / 8 scale (Tailwind defaults) |
| Border radius | `rounded-lg` (8px) cards; `rounded-full` pills/tags; `rounded-md` buttons |
| Shadows | Subtle only: `shadow-sm` cards, `shadow-md` dropdowns — no heavy drop shadows |

**Grid:** 12-column mental model; homepage sections stack vertically with clear rhythm. Hub navigation becomes a clean 2×3 or 3×2 card grid with image + title + one-line description + button (not `>>` links).

---

### Core components (v0.3.0+)

Build in `src/components/ui/` — lean, composable, Tailwind-only (no heavy UI library required initially):

| Component | Notes |
|---|---|
| `Button` | primary / secondary / ghost / accent variants |
| `Card` | Image top, content, optional CTA — hub tiles, event cards |
| `Section` | Consistent vertical padding + optional `brand-800` or `neutral-100` bg |
| `Container` | Max-width wrapper |
| `Heading` | Display font, semantic levels |
| `Nav` | Sticky navy header, mobile drawer (navy not black) |
| `Footer` | `brand-900` bg, simplified columns |
| `Badge` | Dusty-rose accent for tags (event category, series) |
| `Input` | Clean forms — shared by admin later |

Reference: shadcn/ui patterns for accessibility (focus rings, aria) without importing the full library unless needed.

---

### Page-level revamp notes

| Page / section | Live | Revamp |
|---|---|---|
| Hero | Stock photo + overlay + long SEO text | Real congregation photo; headline + tagline + one CTA ("Plan Your Visit") |
| Announcements | Carousel | Refined banner strip or stacked alert cards — max 2–3 visible |
| Service times | Buried in footer | Prominent homepage band — two services + cafe note |
| Hub cards | `>>` links | Proper cards with button CTAs |
| Newsletter | Mailchimp classic embed | Styled inline form matching design system |
| Sermons/events | Plugin-default styling | Unified card/list components from design system |
| Footer | Black block | Navy (`brand-900`) with warm white text |

---

## Part 3 — Implementation plan

Tied to project milestones. Design system is a prerequisite for **v0.3.0** (homepage + public shell).

### Phase A — Tokens & foundations (before v0.3.0 UI)

1. Add color, font, and spacing tokens to `tailwind.config.ts`
2. Load fonts in `src/app/layout.tsx` via `next/font/google`
3. Set base styles in `globals.css` (body bg, text color, focus styles)
4. Obtain SVG logo + export favicon set

### Phase B — Core components (v0.3.0 sprint)

1. `Container`, `Section`, `Heading`, `Button`, `Card`
2. `GlobalNav` + `Footer` (replace layout TODOs)
3. Homepage sections composed from components + Supabase data

### Phase C — Polish (v0.3.0 → v0.4.0)

1. Page templates for sermons, events, groups using same components
2. MDX prose styling for static pages
3. Admin panel inherits tokens (shared Tailwind config): done 2026-11-22 (sidebar shell, dashboard, scoped form styles in `src/app/admin/admin.css`)
4. Accessibility pass: contrast ratios, focus states, reduced motion

### Phase D — Brand assets (parallel, human-driven)

- [x] Confirm navy `#183d59` with leadership (or approve refined palette above): full palette built on it, see "Brand palette"
- [ ] Choose display font (Fraunces vs alternatives) — quick stakeholder preview
- [ ] Commission or select authentic photography bank (hero, hub cards, about)
- [ ] Recreate logo as SVG

---

## Brand palette

Implemented in `tailwind.config.ts` (2026-11-22). Everything is built around the live navy **`#183d59` (`brand-800`)**; the older four-step tokens kept their values, so existing classes did not shift.

### Families

| Family | Role | Key steps |
|---|---|---|
| `brand` (navy) | Primary. Nav, footer, headings on dark, primary buttons, admin chrome | `50 #f3f7fa` · `100 #e8eef2` · `200 #cddbe6` · `300 #a3bdd0` · `400 #7097b3` · `500 #4a7697` · `600 #245a7a` · `700 #1d4a6a` · **`800 #183d59`** · `900 #0f2838` · `950 #0a1b27` |
| `accent` (dusty rose) | Warmth. Visit CTA, eyebrows, highlights, selection | `50 #fbf1f0` · `100 #f6e2e1` · `200 #edc6c7` · `300 #dea3a8` · **`400 #c9828a`** · `500 #b4656f` · `600 #984d58` · `700 #7c3d47` |
| `sky` | Cool tint for quiet info surfaces (sparingly) | `50 #f2f8fb` … `400 #5fa5c9` |
| `sand` | Warm tint for alternating bands (sparingly) | `50 #fcfaf6` … `300 #dccdb3` |
| `neutral` (warm grey) | Text, borders, page background | `0 #ffffff` · `100 #f7f7f5` (page) · `200 #ecebe7` · `300 #dad8d2` · `600 #5c5c5c` (secondary text) · `950 #1a1a1a` (body text) |
| `success` / `warning` / `danger` | Form and admin status only | `50` surface · `600` icon/border · `700` text |

Shadows: `shadow-soft` (resting cards) and `shadow-lift` (hover / raised panels), both tinted navy instead of black.

### Usage rules

- **Navy carries the brand; rose is the spice.** Roughly 60% neutral surfaces, 30% navy, 10% rose. One rose CTA per view.
- **Text contrast (WCAG AA):** body `neutral-950` on `neutral-100`; links `brand-800`/`brand-600`; rose *text* on light backgrounds uses `accent-600`+, never `accent-400`. On navy, use white, `white/70`+, or `accent-300`/`accent-400`.
- **Buttons are pills** (`rounded-full`). Primary = `brand-800`; accent = `accent-400` with `brand-950` text; secondary = navy outline; on dark = white outline.
- **Eyebrows** use the `.eyebrow` class (uppercase, tracked, short rule): `text-accent-600` on light, `text-accent-300` on navy.
- **Cards:** `rounded-2xl`, `shadow-soft`, `ring-1 ring-brand-900/5`; links lift to `shadow-lift`.
- **Status colors stay out of marketing UI.** No green/amber/red outside forms and admin.

### Logos

Source files are in `media-library/wordpress-assets/` (white only). Web-ready variants live in `public/images/brand/`:

| File | Use |
|---|---|
| `thrive-wordmark-white.webp` | Symbol + "THRIVE VINEYARD CHURCH" on navy: site header, footer, admin login panel |
| `thrive-wordmark-navy.webp` | Same lockup on light backgrounds (mobile admin login, print-style pages) |
| `thrive-mark.webp` | White symbol on navy: admin sidebar, low-opacity watermarks in heroes, CTA bands, footer |
| `thrive-mark-navy.webp` | Symbol on light backgrounds |
| `src/app/icon.png`, `src/app/apple-icon.png` | Favicon (navy disc, white lines) and iOS home-screen tile |

Rules: keep clear space of at least the symbol's radius around the lockup; never recolor beyond white/navy; never place the white files on light backgrounds; watermarks stay at 4–7% opacity and are always `aria-hidden`. A vector (SVG) master is still outstanding (Phase D).

---

## Related docs

| Doc | Relationship |
|---|---|
| [01-current-site-audit.md](./01-current-site-audit.md) | Content and page inventory |
| [03-information-architecture.md](./03-information-architecture.md) | Homepage section structure to style |
| [docs/plans/PROGRESS.md](./plans/PROGRESS.md) | v0.3.0 depends on this doc |
