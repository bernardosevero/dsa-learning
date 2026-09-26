# AGENTS.md

dta-learning is a spaced-repetition trainer for coding interviews: it tells the user which NeetCode 150 problem to re-solve today and schedules the next re-solve from how hard it felt. The README has the product overview and the research behind it.

## Picking up work

Work comes from GitHub issues, ordered on the [project board](https://github.com/users/bernardosevero/projects/3) by the `Order` field.

1. Take the lowest-`Order` open issue labelled `agent-ready` whose "Depends on" issues are closed. Issues labelled `human` belong to the owner.
2. Branch from `main` as `issue-<number>-<short-slug>`.
3. Build it. In `src/domain/`, work test-first: write the issue's required tests, watch them go red, then make them green. Elsewhere, deliver the tests with the code.
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`. All four pass.
5. Open a PR titled like the commit convention below, with `Closes #<number>`, and tick each acceptance criterion in the description. `main` only changes through PRs.

The issue is the spec: it carries the exact types, signatures and tests. When the issue and this file disagree, or the issue leaves a product decision open, stop and ask in the PR rather than choosing. The decisions are the owner's. Issues labelled `needs-grilling` get a design session with the owner before any code.

Every PR is reviewed by the owner. PRs titled `feat` or `refactor` also get an automatic Claude review; comment `@claude review` to request one on any PR.

## Architecture

```
src/data/      static problem list (problems.json), generated once by scripts/, then edited by hand
src/domain/    pure logic: types, dates, schedule, today, merge, metrics
src/storage/   persistence behind the Store interface (localStorage now, Supabase later)
src/ui/        React screens, the AppData provider, strings.ts
scripts/       one-off Node scripts, run with `pnpm tsx`
e2e/           Playwright tests of the main loop
```

Dependencies point inward: `ui` → `storage` → `domain`, and `ui` → `domain`. `src/domain/` is **pure**: plain TypeScript with no React, no storage and no browser APIs, so it is trivially testable and can move to a server. A lint rule enforces this.

### The log

The **log** is the single source of truth. Everything else is derived from it.

- The log is an append-only list of **entries**: `attempt` or `markedMastered` (`src/domain/types.ts`).
- A problem's state (`new` / `active` / `mastered`) is **derived** by replaying its entries (`deriveState`). It is never stored.
- Undo sets `deletedAt` on an entry; the entry stays in the log and the replay skips it. This keeps undo exact and makes merging safe.
- Merging two logs (import now, device sync later) is `mergeEntries`: a union by entry `id`, where a deletion on either side wins.
- Dates used for scheduling are `LocalDate` strings (`"YYYY-MM-DD"` in the user's time zone), handled only through `src/domain/dates.ts`. Timestamps are ISO strings.

## Product rules

These are settled decisions. Code that contradicts one is a bug.

- **Intervals:** Hard +2 days, Medium +7, Easy +30, fixed; a repeated Medium stays at 7. Only the rating drives the schedule; time and help are recorded for analysis.
- **Mastered:** Easy on a review that is on time or late, after an Easy, makes a problem mastered for good. Rating it Medium or Hard later brings it back. The user can also mark any problem **Already mastered**.
- **Today is a list:** due reviews sorted by risk, with the first one as the focus (★) and the rest dimmed, plus only the next new problem in NeetCode order. It shows due work and a time estimate; the user decides how much to do. It has no Skip, no daily cap and no upcoming reviews.
- **Spoiler rule:** while a problem is being reviewed, its pattern, earlier key insights, solution and video stay hidden until the attempt is logged (the pattern shows if `showPatternOnReviews` is on).
- **Content:** summaries are one line in our own words and never name the solution technique. Link out to NeetCode (primary) and LeetCode for the full statement. Keep the MIT notice for the neetcode-gh/leetcode metadata, and keep NeetCode's name to "the list we follow", with no logos. NeetCode slugs come from the committed snapshot in `scripts/data/`, never from a runtime fetch.

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| App | Vite + React + TypeScript (strict, `noUncheckedIndexedAccess`), a static single-page app on Cloudflare Pages | Six screens and local data: no server of ours runs code |
| Toolchain | pnpm, Node 24 LTS | Strict `node_modules`: a missing dependency fails immediately |
| Routing | React Router v7, library mode | Familiar and small; six routes don't need typed routing |
| State | One React context over pure reducer functions (`src/ui/appDataReducers.ts`) | Reducers are testable without React. Reach for Zustand only when re-renders measurably hurt |
| Styling | Tailwind v4 + shadcn/ui, themed through CSS variables | Accessible dialogs, radios and toggles; the design lives as theme tokens in `src/index.css` |
| Validation | zod, wherever data crosses a boundary (import file, localStorage, later Supabase rows) | One schema gives the runtime check and the type |
| Storage | localStorage behind the `Store` interface | The log is small; the interface lets Supabase replace it |
| Tests | Vitest + Testing Library; Playwright for the main loop (Today → Solve → Log → Today) | |
| Lint | ESLint + Prettier | The import rule keeps `src/domain` pure |

The scripts are in `package.json`.

Later phases:
- **Public release:** PostHog analytics (`posthog-js`, US cloud) for everyone, with an opt-out toggle in Settings and a `/privacy` page. EU consent comes before marketing in Europe.
- **Login:** Supabase Auth (Google + GitHub) and a Supabase `entries` table. Every Supabase table has Row Level Security (`user_id = auth.uid()`), because the client key is public. Anything involving payment is decided server-side.
- **Public pages (second release, with login):** landing, how it works, FAQ. The way they're prerendered is decided then.

## Working on UI

Before changing anything in `src/ui/`, load the `working-on-ui` skill. It holds the React, component, layout, accessibility and SEO rules.

## Code style

Lint and Prettier (100 columns) enforce what they can. These are the rules they can't check.

- **Names read like prose.** Use descriptive names everywhere. Single letters are only for `i` in index loops and `a`/`b` in comparators. Use an abbreviation only when a new reader understands it without context (`id`, `url`, `props`, `config`, `min`/`max`). Booleans start with `is`/`has`/`should`/`can`, functions start with a verb, and numbers with meaning are named constants (`INTERVAL_DAYS.easy`, not `30`).
- **Explicit over clever.**
  - A comparator chains at most 3 comparisons.
  - `reduce` only builds a simple single value (a sum, count, max, or a record keyed by id), with a callback of about 3 lines; anything more is a `for...of` loop.
  - Use `Boolean(value)`, not `!!value`.
  - Helpers are named functions at module level, not one-line arrows defined inside another function.
  - Every `as` cast (except `as const`) has a same-line comment saying why it's safe.
- **Small functions:** about 30 lines, at most 2 levels of nesting, early returns, one job each.
- **Inputs stay untouched:** parameters are `readonly`, and you copy before reordering (`toSorted`, `toReversed`). A local `let` and a loop inside a function are fine.
- **Expected failures are values:** return `{ ok: true, value } | { ok: false, error }`. Throw only for bugs.
- **Types:** model states as discriminated unions and let the compiler check exhaustiveness. Parse untrusted data with zod.
- **Files:**
  - Named exports only, one component per file, no barrel `index.ts` files.
  - Components are `PascalCase.tsx`; everything else is `camelCase.ts`.
  - Imports use `@/` across folders and relative paths inside one.
- **Docs and comments:** exported `domain` and `storage` functions get a one- or two-line JSDoc stating what they return and any product rule. Other comments explain *why*, in one line. `TODO`s name an issue: `// TODO(#14): ...`.
- **Tests:**
  - Names are sentences that pin down a behaviour ("marks a problem mastered after Easy on the due review").
  - Separate arrange / act / assert with blank lines.
  - Build data with builders like `anAttempt({ rating: "easy" })`.
  - The naming rules apply in tests too.
  - Use `@ts-expect-error` (with a description) to test invalid input.
- **Dependencies:** add only the ones the issue names. For anything else, explain in the PR why the platform or an existing dependency isn't enough, and wait for the owner's approval.
- **Commits:** gitmoji plus conventional type and scope, e.g. `✨ feat(domain): add deriveState`, `✅ test(domain): ...`, `🐛 fix(ui): ...`, `📝 docs(readme): ...`.
