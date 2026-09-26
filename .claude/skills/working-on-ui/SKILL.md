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
- **State changes** go through the `AppData` actions, whose reducers live in `src/ui/appDataReducers.ts`. Components never edit the save file directly.

## Components and layout

- Build screens from shadcn/ui components (`src/ui/components/ui/`). Color them only with theme tokens (`bg-primary`, `text-muted-foreground`, `--rating-hard`...), never raw colors, so a design change is a token change.
- Compact layout, max width about 640px, because the app sits next to a NeetCode tab. Check it at 375px (phone) too.
- Every user-visible string comes from `src/ui/strings.ts`. User-written text (insights, notes) renders as plain React text.

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
- a unique, descriptive `<title>` per route (e.g. "Today · dta-learning")
- one `<h1>`, headings in order, and landmarks (`<header>`, `<nav>`, `<main>`)

**Public pages** (landing, how it works, FAQ, guides) come with the second release, and exist so search engines and answer engines (ChatGPT, Claude, Perplexity, Google AI answers) can read and cite them:
- served as **prerendered HTML**, readable without JavaScript, because most AI crawlers don't run it
- a unique `<title>` and meta description, a canonical URL, Open Graph and Twitter tags, `lang="en"`
- JSON-LD structured data: `SoftwareApplication` (landing), `FAQPage` (FAQ), `Article` (guides)
- `robots.txt` allowing search and AI crawlers, `sitemap.xml`, and `llms.txt` kept up to date
- content written as direct questions and answers ("How often should I re-solve a problem? …"), in our own words
- Lighthouse scores of at least 90 for Performance, Accessibility and SEO
