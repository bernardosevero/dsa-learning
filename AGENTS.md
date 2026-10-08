# AGENTS.md

dsa-learning is a spaced-repetition trainer for coding interviews: it tells the user which NeetCode 150 problem to re-solve today and schedules the next re-solve from how hard it felt. The README has the product overview and the research behind it.

## Picking up work

Work comes from GitHub issues, ordered on the [project board](https://github.com/users/bernardosevero/projects/3) by the `Order` field.

1. Take the lowest-`Order` open issue labelled `agent-ready` whose "Depends on" issues are closed. Issues labelled `human` belong to the owner.
2. Branch from `main` as `issue-<number>-<short-slug>`.
3. Build it. In `src/domain/`, work test-first: write the issue's required tests, watch them go red, then make them green. Elsewhere, deliver the tests with the code. If the change affects how to set up, run, test or build the app (prerequisites, `package.json` scripts, environment variables, setup steps), update "Running locally" in the README in the same PR.
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`. All four pass.
5. Open a PR titled like the commit convention below, with `Closes #<number>`, and tick each acceptance criterion in the description. `main` only changes through PRs.
6. Leave the merge to the owner; don't merge your own PR. Whoever merges deletes the branch in the same step: `gh pr merge <number> --merge --delete-branch`. The remote holds only `main` and branches with an open PR.
7. A PR is ready to merge only when every check on its latest commit has passed. GitHub doesn't block merging a PR with a red check here, so nobody merges one with a failing or pending check, and that includes the Lighthouse gate in Public pages / `release-checks`. On your own PR, fix a red check, or say in the PR why it isn't the PR's failure; never hand over a red PR as ready.

The issue is the spec: it carries the exact types, signatures and tests. When the issue and this file disagree, or the issue leaves a product decision open, stop and ask in the PR rather than choosing. The decisions are the owner's. Issues labelled `needs-grilling` get a design session with the owner before any code.

Every PR except `docs` gets an automatic Claude review when it's opened or marked ready (the owner can comment `@claude review` for another). The reviewer never merges: it posts its findings, assigns the owner and adds the `needs-owner` label. The owner merges every PR.

## Architecture

```
src/data/             static problem list (problems.json), generated once by scripts/, then edited by hand
src/domain/           pure logic: types, dates, schedule, today, merge, metrics
src/storage/          persistence behind the Store interface (localStorage now, Supabase later)
src/routes/           route modules: one file per route in src/routes.ts, rendering a screen or layout from src/ui/
src/test/             shared test code: setup.ts and the builders in builders.ts
src/ui/app/           what exists once per app: PracticeApp, AppLayout, PublicLayout, AppData and its reducers
src/ui/screens/<s>/   one folder per screen, named after its page component: today/ holds TodayPage
src/ui/shared/        our pieces used by two or more screens, format.ts, strings.ts
src/ui/primitives/    shadcn/ui components, under shadcn's kebab-case names, and cn.ts
scripts/              one-off Node scripts, run with `pnpm tsx`
e2e/                  Playwright tests of the main loop
```

The approved public-page migration replaces `src/main.tsx` and the Vite HTML document with React Router framework entry/document ownership. `src/index.css` stays at the root. Framework files live at `src/root.tsx`, `src/routes.ts`, `src/entry.client.tsx` and `src/entry.server.tsx` (only if needed), `src/routes/*.tsx`, and `react-router.config.ts`; they compose routes and layouts above `ui/app`. `src/routes/` holds route modules only: each renders one screen or layout and may export route values such as `handle`. Components and logic stay in `src/ui/`. Screen implementations stay in their existing folders with named exports. Dependency direction below `app` is unchanged.

Dependencies point inward: `ui` → `storage` → `domain`, and `ui` → `domain`. `src/domain/` is **pure**: plain TypeScript with no React, no storage and no browser APIs, so it is trivially testable and can move to a server. A lint rule enforces this.

Inside `src/ui/` they point the same way: `app` → `screens` → `shared` → `primitives`. Screens take only `useAppData` from `app/`.

- **Screens don't import each other.** A piece lives in its screen's folder until a second screen needs it; the PR that adds the second user moves it to `shared/` with `git mv`. Lint enforces this, so the move is never a judgement call.
- **Screen folders** are camelCase and take the page component's name without `Page` (`problemDetail/` holds `ProblemDetailPage`). No S-numbers in paths; each page's JSDoc names its S-number.
- **Depth:** the deepest file is `src/ui/screens/<screen>/File.tsx`. The only subfolder below that is `__tests__/`.
- **Tests** sit in a `__tests__/` folder next to the code they test (`src/domain/__tests__/today.test.ts`).

### The log

The **log** is the single source of truth. Everything else is derived from it.

- The log is an append-only list of **entries**: `attempt` or `markedMastered` (`src/domain/types.ts`).
- A problem's state (`new` / `active` / `mastered`) is **derived** by replaying its entries (`deriveState`). It is never stored.
- Undo sets `deletedAt` on an entry; the entry stays in the log and the replay skips it. This keeps undo exact and makes merging safe.
- Reset progress is the one exception: it empties the log, so importing an export made before the reset brings everything back. The export is the backup.
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
| App | React + TypeScript (strict, `noUncheckedIndexedAccess`), built with Vite and React Router framework mode, hosted on Cloudflare Workers static assets | Public HTML is prerendered at build time; the practice subtree renders on the client, with no server runtime |
| Toolchain | pnpm, Node 24 LTS | Strict `node_modules`: a missing dependency fails immediately |
| Routing | React Router v7, framework mode | Build-time public prerendering and a client-rendered practice subtree |
| State | One React context over pure reducer functions (`src/ui/app/appDataReducers.ts`) | Reducers are testable without React. Reach for Zustand only when re-renders measurably hurt |
| Styling | Tailwind v4 + shadcn/ui, themed through CSS variables | Accessible dialogs, radios and toggles; the design lives as theme tokens in `src/index.css` |
| Validation | zod, wherever data crosses a boundary (import file, localStorage, later Supabase rows) | One schema gives the runtime check and the type |
| Storage | localStorage behind the `Store` interface | The log is small; the interface lets Supabase replace it |
| Tests | Vitest + Testing Library; Playwright for the main loop (Today → Solve → Log → Today) | |
| Lint | ESLint + Prettier | The import rule keeps `src/domain` pure |

The scripts are in `package.json`.

Later phases:
- **Before MVP sharing (M5):** PostHog analytics (`posthog-js`, US cloud) for everyone, with an opt-out toggle in Settings and a `/privacy` page. EU consent comes before marketing in Europe.
- **Login:** Supabase Auth (Google + GitHub) and a Supabase `entries` table. Every Supabase table has Row Level Security (`user_id = auth.uid()`), because the client key is public. Anything involving payment is decided server-side.
- **Public pages:** ship independently of login/sync, following the approved contract below.

### Public-page release contract

- Prerender `/`, `/how-it-works`, and `/privacy` at build time with React Router framework mode; serve static Cloudflare Workers assets. Today moves to `/today` when public routes activate; other practice paths stay unchanged. Contextual FAQ content can live on these pages; this release has no standalone FAQ route or topic guides.
- Public pages have their own consistent responsive layout and navigation, reusing theme tokens, shadcn primitives and English strings. The same-frame rule and existing width tests apply within practice screens; public pages have no practice bottom navigation.
- Public rendering stays outside `AppData`: it never replays practice entries, starts auth/sync, or writes an empty practice save to render content. A lightweight bridge over the existing analytics preference supplies the shared privacy control.
- Response HTML contains visible content, a unique title/description, canonical, OG/Twitter metadata and `lang="en"` without JavaScript. Production public pages can be indexed when the owner enables launch indexing; practice pages, previews, legacy Workers origins and 404s remain noindex.
- The landing has truthful `SoftwareApplication` JSON-LD matching visible facts, without invented ratings/reviews or a Google software rich-result eligibility requirement. Useful FAQ answers are allowed; `FAQPage` markup and universal question-and-answer prose are optional.
- `robots.txt` and `sitemap.xml` are launch requirements. Allow public crawling, including AI search and training crawlers. `llms.txt` is an optional, explicitly unproven learning experiment, not a launch gate.
- Mobile Lighthouse Performance, Accessibility and SEO category medians must each be at least 90 on all three public pages. Retain existing practice regression and accessibility requirements. These technical launch checks do not establish rankings, traffic, rich results or AI citations; those are observed SEO/AEO outcomes.
- Experiment notes/results, prompt observations and the case-study journal live privately in Notion, outside the repository.

## Working on UI

Before changing anything in `src/ui/`, load the `working-on-ui` skill. It holds the React, component, layout, accessibility and SEO rules.

Build every control and surface from shadcn/ui components in `src/ui/primitives/` (add the one you need if it's missing). Don't hand-roll a button, badge, card, input or radio, or copy their styles.

## Code style

Lint and Prettier (100 columns) enforce what they can. These are the rules they can't check.

- **Names read like prose.** Use descriptive names everywhere. Single letters are only for `i` in index loops, `a`/`b` in comparators and `t`, the strings module (`t.nav.today`). PascalCase is for what renders as JSX: components and React contexts. Use an abbreviation only when a new reader understands it without context (`id`, `url`, `props`, `config`, `min`/`max`). Booleans start with `is`/`has`/`should`/`can`, functions start with a verb, and numbers with meaning are named constants (`INTERVAL_DAYS.easy`, not `30`).
- **Explicit over clever.**
  - A comparator chains at most 3 comparisons.
  - `reduce` only builds a simple single value (a sum, count, max, or a record keyed by id), with a callback of about 3 lines; anything more is a `for...of` loop.
  - Use `Boolean(value)`, not `!!value`.
  - Helpers are named functions at module level, not one-line arrows defined inside another function.
  - Every `as` cast (except `as const`) has a same-line comment saying why it's safe.
- **Readable functions:** at most 2 levels of nesting, early returns, one job each. There is no line limit: code that reads top to bottom beats code split into pieces you have to jump between. Split when a piece has its own job or its own tests, not to hit a size.
- **Inputs stay untouched:** parameters are `readonly`, and you copy before reordering (`toSorted`, `toReversed`). A local `let` and a loop inside a function are fine.
- **Expected failures are values:** return `{ ok: true, value } | { ok: false, error }`. Throw only for bugs.
- **Types:** model states as discriminated unions and let the compiler check exhaustiveness. Their names are plain string literals (`state.status === "mastered"`), because the union type already catches typos and narrows; don't wrap them in constants or enums. Parse untrusted data with zod.
- **Files:**
  - Named exports only, one exported component per file (small components only it uses can live in the same file), no barrel `index.ts` files. React Router convention-required default exports are allowed only in the framework entry/config/adaptor files listed under Architecture; ordinary screens, domain and storage keep named exports.
  - Components are `PascalCase.tsx`; everything else is `camelCase.ts`. `src/ui/primitives/` keeps shadcn's kebab-case names so `shadcn add` works unchanged. Only the listed framework convention/adaptor files may use framework-required lowercase/dotted filenames. Lint checks file names.
  - Imports use `@/` across folders and relative paths inside one.
- **Docs and comments:** exported `domain` and `storage` functions get a one- or two-line JSDoc stating what they return and any product rule. Other comments explain *why*, in one line. `TODO`s name an issue: `// TODO(#14): ...`.
- **Tests:**
  - Names are sentences that pin down a behaviour ("marks a problem mastered after Easy on the due review").
  - Separate arrange / act / assert with blank lines.
  - Build data with the builders in `src/test/builders.ts`, like `anAttempt({ rating: "easy" })`. Add a missing one there, never a local copy in a test file.
  - The naming rules apply in tests too.
  - Use `@ts-expect-error` (with a description) to test invalid input.
- **Dependencies:** add only the ones the issue names. For anything else, explain in the PR why the platform or an existing dependency isn't enough, and wait for the owner's approval.
- **Commits:** gitmoji plus conventional type and scope, e.g. `✨ feat(domain): add deriveState`, `✅ test(domain): ...`, `🐛 fix(ui): ...`, `📝 docs(readme): ...`. Every commit ends with the trailer `Co-authored-by: Bernardo Severo <bernardoseverosilveira@gmail.com>`.
