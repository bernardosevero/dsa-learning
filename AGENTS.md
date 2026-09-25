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

## Standards

- **Types:** model states as discriminated unions and let the compiler check exhaustiveness. Use `unknown` plus a zod parse for untrusted data.
- **Tests:** every domain function has unit tests named after the behaviour they pin down (for example "Easy then Easy on the due review → mastered"). UI tests use Testing Library on jsdom and assert what the user sees.
- **UI text:** every user-visible string lives in `src/ui/strings.ts` (English for now, ready for translation). User-written text (insights, notes) renders as plain React text.
- **Components:** build screens from shadcn/ui components, and color them with the theme tokens (`bg-primary`, `text-muted-foreground`), so a design change is a token change.
- **Layout:** compact, max width about 640px, because the app sits beside a NeetCode tab. Readable on a phone.
- **Comments:** explain *why*, in one line, where the code can't say it itself.
- **Commits:** gitmoji plus conventional type and scope, e.g. `✨ feat(domain): add deriveState`, `✅ test(domain): ...`, `🐛 fix(ui): ...`, `📝 docs(readme): ...`.
