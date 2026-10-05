---
name: working-on-ui
description: Rules for any change under src/ui/ (screens, components, hooks, strings, styling) and for public pages. Covers React patterns, shadcn/ui components, layout, accessibility, the spoiler rule on screens, and SEO/AEO.
---

# Working on UI

These rules apply on top of AGENTS.md. Before opening the PR, go through every section below and confirm the change follows it.

## React

- **Derived data is computed, never stored.** The Today list, problem states and counters are computed during render (with `useMemo` when it's expensive) from the save file. Copying them into `useState` and syncing with `useEffect` is the bug to avoid.
- **`useEffect` is only for real side effects:** saving to storage, window events (`focus`, `visibilitychange`), the timer tick.
- **Naming:** props that take callbacks are `onSomething`; the component's own handlers are `handleSomething`. Each component has a named `SomethingProps` type next to it.
- **Size:** when a component passes about 100 lines, stop and raise it in the PR before splitting. Whether and how to split is a design decision.
- **Practice state changes** go through the `AppData` actions, whose reducers live in `src/ui/app/appDataReducers.ts`. Components never edit the save file directly. Public pages stay outside `AppData`; their privacy control uses a lightweight bridge over the existing analytics preference without replaying entries, starting auth/sync, or writing an empty practice save.

## Where files go

AGENTS.md "Architecture" has the full layout. In short:

- Framework entry/config/adaptor files compose routes and public/practice layouts above `ui/app`, following AGENTS.md's narrow filename/default-export exceptions. Ordinary screen implementations keep named exports; dependencies below `app` are unchanged.
- `src/ui/app/`: the practice shell and state (`App`, `AppLayout`, `AppData`, `appDataReducers`). The framework route configuration owns routes after migration.
- `src/ui/screens/<screen>/`: a new screen gets its own folder, named after its page component without `Page` (`ProblemDetailPage` → `problemDetail/`). Everything only that screen uses lives there, flat, with tests in `__tests__/`.
- `src/ui/shared/`: pieces used by two or more screens, plus `format.ts` and `strings.ts`. When your screen needs a piece from another screen's folder, `git mv` it here in the same PR; lint rejects imports between screens.
- `src/ui/primitives/`: shadcn/ui components only, under shadcn's kebab-case names, and `cn.ts`.

## Components and layout

- **Match the approved design.** Read `design.md` (next to this file) and look at the screen pictures it links before building a screen. It says how each screen and shared piece looks.
- **Always use a shadcn/ui component when one exists for the job** (button, badge, card, input, textarea, label, radio group, toggle group, switch, dialog, dropdown menu, …). Never hand-roll the element or copy its classes onto a `<span>`/`<div>`/`<input>`.
  - If it isn't in `src/ui/primitives/` yet, add it: `pnpm dlx shadcn@latest add <name>` (`components.json` points the CLI there), or, when the registry is blocked, copy its source from ui.shadcn.com into that folder and import `cn` from `@/ui/primitives/cn`. Its Radix primitive comes from the installed `radix-ui` package.
  - Adapt it to design.md once, in that file (tokens, no shadow, 44px targets); screens pass only layout classes.
  - Our own shared pieces (`RatingChip`, `ProblemKindBadge`, `SectionLabel`, `Overline`…) are thin wrappers over these components, never a second copy of their styles.
- Color only with theme tokens (`bg-primary`, `text-muted-foreground`, `--rating-hard`...), never raw colors, so a design change is a token change.
- Practice screens keep the compact layout described in `design.md`, because the app sits next to a NeetCode tab. Check it at 375px (phone) too. Public pages use their own consistent responsive layout and navigation, with the same theme tokens, shadcn primitives and English strings, and no practice bottom navigation.
- **A change to a shared piece is a change to every screen that uses it.** Before touching anything in `src/ui/shared/` or `src/ui/app/` (`PageSheet`, `FocusFrame`, `AppLayout`, `PublicLayout`, `src/routes.ts`, a shared component or a theme token), find every screen that renders it (`grep` the name), then open each of those screens in the built app at 390px, 700px, 900px and 1440px. A layout that's right on the screen you changed can still be wrong on the next one.
  - **The frame stays the same within practice screens.** The sheet's width and position never change when the user moves between practice screens; content adapts inside it. A practice screen that needs more room uses the room the sheet already has, and never a wider sheet of its own. `e2e/pageWidth.spec.ts` checks practice screens; a new practice screen goes into its `SCREENS` list in the same PR. Verify public layouts separately at the same responsive widths.
- Every user-visible string comes from `src/ui/shared/strings.ts`. User-written text (insights, notes) renders as plain React text.

## Accessibility

- Semantic elements: actions are `<button>`, navigation is `<a>`/`<Link>`, every input has a `<label>`.
- Everything is reachable and usable by keyboard, with a visible focus ring. Shortcuts (1/2/3 and Ctrl+Enter on the Log form) never replace a clickable control.
- Color is never the only signal: ratings and statuses also carry text or an icon.
- `jsx-a11y` lint catches much of this; the rest is on you.

## Spoiler rule on screens

Any screen that shows a problem under review (not `new`) keeps its **pattern, earlier key insights, and solution/video links** hidden until the attempt is logged. The pattern shows if `settings.showPatternOnReviews` is on. On Problem detail, hidden items sit behind an explicit "Reveal (spoilers)" control. Add a test for each screen that shows a review.

## SEO and AEO

**App screens** (Today, Solving, Log, Problems, Problem detail, Settings) show personal data from the browser, so they are **not indexed**:
- `<meta name="robots" content="noindex">`
- a unique, descriptive `<title>` per route (e.g. "Today · dsa-learning")
- one `<h1>`, headings in order, and landmarks (`<header>`, `<nav>`, `<main>`)

**Public pages** follow AGENTS.md's Public-page release contract: landing `/`, how it works `/how-it-works`, and privacy `/privacy`, independently of login/sync. Today moves to `/today`; other practice paths stay unchanged. React Router framework mode prerenders public HTML at build time for static Cloudflare Workers hosting; practice stays client-rendered.

Before release, verify response HTML without JavaScript for visible content, unique title/description, canonical, OG/Twitter tags and `lang="en"`. Check head updates after client navigation. Production public pages can be indexed when launch indexing is enabled; practice, previews, legacy Workers origins and 404s stay noindex.

Write useful factual content in our own words, with contextual FAQ answers where they help. Keep landing `SoftwareApplication` JSON-LD consistent with visible facts; ratings/reviews must never be invented, and Google software rich-result eligibility is not required. Neither `FAQPage` markup nor universal question-and-answer prose is mandatory. This release has no standalone FAQ route or topic guides.

Check the required `robots.txt` and `sitemap.xml`, allowing public crawling by search and AI search/training crawlers. `llms.txt` is optional and explicitly unproven, outside the launch gate. Mobile Lighthouse Performance, Accessibility and SEO category medians must each be at least 90 for all three public pages; existing practice regression and accessibility checks remain required.

Technical checks establish launch readiness, not rankings, traffic, rich results or AI citations. Record observed SEO/AEO outcomes, fixed-prompt results and case-study notes privately in Notion, outside the repository.
