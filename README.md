# 🔁 dsa-learning

A spaced-repetition trainer for coding interviews. It tells you which problem to practice next (a review you're about to forget, or a new one from the NeetCode 150) and schedules each re-solve from how hard it felt.

## 🧠 How it works

1. **Next up:** one recommended problem. Due reviews come first (the most overdue first), then the next new problem in NeetCode's topic order.
2. **Solve** it on NeetCode. On reviews, the problem's pattern stays hidden.
3. **Log** the attempt: how it felt, time taken, help used and a one-sentence key insight.
4. **Re-solve** it later, based on how it felt:

| Felt | Re-solve in |
|---|---|
| Hard | 2 days |
| Medium | 7 days |
| Easy | 30 days |

Proposed: Easy twice in a row (the second time after the 30-day gap) marks a problem as mastered, so the daily load shrinks over time.

## 🗺️ Pages

- **Today** (`/`): the reviews due today, most at risk first. The top one is the focus ★ and the rest are dimmed. Below them is the next new problem in NeetCode order, with a time estimate, the Due / New left / Mastered counters and progress by topic. On the first visit it explains the loop instead.
- **Solving** (`/solve/:id`): links out to NeetCode and LeetCode, with a timer against the time box for the problem's difficulty. On reviews the pattern stays hidden.
- **Log attempt** (`/log/:id`): how it felt (Hard, Medium or Easy), the time, the help used and a key insight. After saving, it shows the next re-solve date, reveals what was hidden and compares this attempt with the last one. You can undo the log.
- **Problems** (`/problems`): all 150 problems by topic, filtered by All, Due, New or Mastered. From here you can start any problem or mark it as already mastered.
- **Problem** (`/problems/:id`): one problem's links, pattern, solution, video and full history. During a due review the spoilers stay hidden until you log it. Deleting an entry recalculates the schedule.
- **Settings** (`/settings`): time boxes, a switch to show the pattern on reviews, JSON export and import, the usage-sharing switch and reset progress.
- **Privacy & credits** (`/privacy`): what stays in your browser, what the analytics sends and where the problem data comes from.

## 🧰 Tech stack

- **Vite + React + TypeScript** → the app
- **Tailwind + shadcn/ui** → styling
- **React Router** → routing
- **zod** → validating data from files and storage
- **localStorage** → storage: data stays in the browser, with JSON export/import, and there is no backend
- **Vitest + Testing Library, Playwright** → tests
- **Cloudflare Workers** → hosting
- **PostHog** → analytics
- **NeetCode's [MIT-licensed problem list](https://github.com/neetcode-gh/leetcode/blob/main/.problemSiteData.json)** → problem data

## 💻 Running locally

You need Node 24 (see `.nvmrc`) and pnpm 10. With Corepack, `corepack enable` installs the pnpm version pinned in `package.json`.

```sh
pnpm install
pnpm dev
```

The app runs at http://localhost:5173. The dev server renders every page in the browser; to see the HTML the build prerenders (the public pages, the 404 page and the routing rules), build and preview it:

```sh
pnpm build
pnpm preview
```

`pnpm preview` serves `build/client/` with Wrangler's local copy of Cloudflare's static hosting at http://localhost:8787, the way production serves it: the public pages (`/`, `/how-it-works`, `/privacy`) get their prerendered HTML, practice addresses (`/today`, `/problems`, …) get the app shell, and anything else gets `404.html` with a 404 status. It runs offline and needs no Cloudflare account.

No environment variables are needed locally. Without the Supabase variables below the app runs local-only, with login hidden. Two build variables shape the public pages' head tags, `robots.txt` and `sitemap.xml` (see `.env.example`):

- `VITE_SITE_URL`: the canonical origin for canonical, Open Graph and sitemap URLs. Defaults to `https://dsa-learning.bernardosevero.dev`.
- `VITE_PUBLIC_INDEXING_ENABLED`: only the exact value `true` lets search engines index the public pages and fills the sitemap. Anything else, including unset, keeps every page `noindex` with an empty sitemap. Production stays unset until the launch checklist is done. Practice pages are always `noindex`.

### Accounts and the database (optional)

Login (GitHub) and the `saves` table live in Supabase. You only need this to work on them.

- **Database tests:** with Docker running, `pnpm supabase start` starts a local Supabase stack, and `pnpm supabase test db` runs the pgTAP tests in `supabase/tests/`, which prove each user can only reach their own row. CI runs them on pull requests that touch `supabase/`. `pnpm supabase stop` stops the stack. The local stack has no GitHub login.
- **Sync end-to-end tests:** with the stack running, `pnpm test:e2e:sync` builds the app against it (into `build-sync/`) and runs the Playwright tests in `e2e/sync/`: two browsers signed into one account, syncing for real. The tests sign in with a password test user instead of GitHub. CI runs them on pull requests that touch `supabase/`, `src/storage/`, `src/ui/app/`, `src/routes/` or `e2e/sync/`.
- **Trying sign-in:** create a `.env.local` that points `pnpm dev` at the hosted project. Sign-in returns to `/today`, so the project's Redirect URLs (Supabase dashboard, Authentication → URL Configuration) must allow `http://localhost:5173/today`:

  ```sh
  VITE_SUPABASE_URL=https://fdxfqeqlnvaijlihdplo.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=<the project's publishable key>
  ```

  Signed in locally, the app reads and writes your real account.

| Command | What it does |
|---|---|
| `pnpm dev` | Starts the dev server with hot reload |
| `pnpm test` | Runs the tests once (`pnpm test:watch` re-runs them on every change) |
| `pnpm test:e2e` | Builds the app, serves it with `pnpm preview` and runs the Playwright tests in `e2e/` against it in Chromium |
| `pnpm test:e2e:sync` | Runs the sync tests in `e2e/sync/` against the local Supabase stack (start it first) |
| `pnpm build:release` | Builds the production-shaped site the release checks audit into `build-release/`: the canonical address, public indexing on and no analytics key. A local test artifact, never deployed |
| `pnpm test:e2e:release` | Builds `build-release/`, serves it with Wrangler and runs the release tests in `e2e/release/`: indexable public pages, the full sitemap, practice pages still `noindex`, no analytics or account requests |
| `pnpm test:lighthouse` | Builds `build-release/` and runs Lighthouse CI (mobile, five runs per page) on `/`, `/how-it-works` and `/privacy`. Fails unless each page's median Performance, Accessibility and SEO scores are at least 90, each page loads at most 12 scripts totalling 185 KB, and no image is larger than its layout needs. The score varies from machine to machine; the budgets don't, so they catch a regression the score alone can miss. Reports go to `.lighthouseci/` |
| `pnpm lint` | Runs ESLint, including the rule that keeps `src/domain` pure |
| `pnpm typecheck` | Generates React Router's route types (into `.react-router/`), then type-checks the project with TypeScript |
| `pnpm format` | Formats the code with Prettier |
| `pnpm build` | Type-checks, builds the static site into `build/client/` (prerendering the public pages), then writes its `404.html`, `_redirects`, `_headers`, `robots.txt` and `sitemap.xml` with `scripts/static-output.ts` |
| `pnpm preview` | Serves the built `build/client/` locally with Wrangler, at http://localhost:8787 |
| `pnpm supabase start` / `stop` | Starts or stops the local Supabase stack (needs Docker) |
| `pnpm supabase test db` | Runs the pgTAP tests against the local stack |

CI runs `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` on every pull request, so run the same four before opening one. A separate CI job runs `pnpm test:e2e`, and the Public pages workflow runs `pnpm test:e2e:release` and `pnpm test:lighthouse`, keeping the Lighthouse reports as a workflow artifact even when they fail.

The end-to-end tests need a Chromium that matches the installed Playwright version. Install it once with `pnpm exec playwright install chromium`. If your machine already has a different Chromium build (some sandboxes preinstall one), point the tests at it instead with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome pnpm test:e2e`. Lighthouse CI uses the same browser through `CHROME_PATH`: `CHROME_PATH="$(node -e 'console.log(require("@playwright/test").chromium.executablePath())')" pnpm test:lighthouse`, as CI does.

## 🛠️ Scripts

One-off Node scripts in `scripts/`. The ones marked 🌐 need network access.

| Command | What it does |
|---|---|
| `pnpm tsx scripts/metrics.ts <export.json>` | Prints the success metrics (on-time reviews, re-solve speed, rating progress, load and habit) from a file exported in the app |
| `pnpm tsx scripts/build-problems.ts` 🌐 | Rebuilds `src/data/problems.json` from neetcode-gh/leetcode and the slug snapshot, keeping existing summaries. The file is committed, so the app itself needs no network |
| `pnpm tsx scripts/snapshot-nc-links.ts` 🌐 | Re-snapshots NeetCode's practice slugs from neetcode.io into `scripts/data/nc-links.json`. Run it only when a slug is missing |
| `pnpm tsx scripts/smoke-production.ts` 🌐 | Checks that production is wired to Supabase without signing in: the build's variables, GitHub sign-in, and the `saves` table and `delete_my_account()` closed to anyone signed out. CI runs it daily |
| `pnpm tsx scripts/render-link-previews.ts` 🌐 | Redraws the favicon, the Apple touch icon and the link-preview image in `public/`. Run it after changing their design in the script. It needs a Chromium, like the end-to-end tests |
| `pnpm tsx scripts/renderTodayPreview.ts --url http://localhost:4173/today` 🌐 | Redraws `public/today-preview.webp`, the landing page's picture of Today, and its 480- and 720-pixel-wide copies, from synthetic practice data on a fixed date. Serve a local build first (`pnpm build && pnpm preview --port 4173`); it refuses any non-local address and uses a fresh browser context, so it never touches anyone's progress. It needs a Chromium, like the end-to-end tests |

## 🚀 Deploy

Live at **https://dsa-learning.bernardosevero.dev**.

- Static site on Cloudflare Workers, served from `build/client/`. Nothing runs on a server: React Router prerenders the public pages at build time, and the practice screens render in the browser.
- Merging to `main` deploys to production. Every other branch gets its own Preview URL.
- `wrangler.jsonc` attaches the custom domain. The build's `_redirects` serves the app shell (`__spa-fallback.html`) at each known practice address, with no catch-all, and every other address with no file gets `404.html` with a 404 status. Its `_headers` keeps every `*.workers.dev` host (Preview URLs and the old address) and the app shell's own address `noindex`.

## 🔬 Research basis

| Principle | How the app uses it | Sources |
|---|---|---|
| Forgetting and skill decay | Solved problems come back | [Murre & Dros 2015](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0120644), [Arthur et al. 1998](https://www.tandfonline.com/doi/abs/10.1207/s15327043hup1101_3) |
| Spacing | Re-solves are scheduled days apart. Fixed intervals are enough to start | [Cepeda et al. 2008](https://pubmed.ncbi.nlm.nih.gov/19076480/), [Dunlosky et al. 2013](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266), [Karpicke & Bauernschmidt 2011](https://pubmed.ncbi.nlm.nih.gov/21574747/) |
| Retrieval practice | A review is a re-solve from a blank editor, not a re-read | [Roediger & Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/) |
| Interleaving | Reviews mix topics, and the pattern is hidden | [Rohrer & Taylor 2007](http://uweb.cas.usf.edu/~drohrer/pdfs/Rohrer&Taylor2007IS.pdf), [Kornell & Bjork 2008](https://journals.sagepub.com/doi/abs/10.1111/j.1467-9280.2008.02127.x) |
| Blocked first, then mixed | New problems go topic by topic | [Carvalho & Goldstone 2014](https://link.springer.com/article/10.3758/s13421-013-0371-0) |
| Try first, then study the solution | A time-boxed attempt comes before the solution video | [Sinha & Kapur 2021](https://journals.sagepub.com/doi/10.3102/00346543211019105), [Kalyuga 2007](https://link.springer.com/article/10.1007/s10648-007-9054-3) |
| Self-explanation | The "key insight" field | [Bisra et al. 2018](https://link.springer.com/article/10.1007/s10648-018-9434-x) |
| Experts see the deep structure | Every problem is tagged with its pattern | [Chi et al. 1981](https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog0502_2), [Gick & Holyoak 1983](https://www.sciencedirect.com/science/article/abs/pii/0010028583900026) |
| We misjudge our own learning | Ratings have clear definitions, and time and help used are logged too | [Kornell 2009](https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.1537), [Koriat & Bjork 2005](https://pubmed.ncbi.nlm.nih.gov/15755238/), [Kirk-Johnson et al. 2019](https://pubmed.ncbi.nlm.nih.gov/31470194/) |
| Scheduling algorithms | 2/7/30 is a 3-box Leitner system. FSRS is the upgrade path | [SM-2](https://www.super-memory.com/english/ol/sm2.htm), [FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS), [Settles & Meeder 2016](https://aclanthology.org/P16-1174/) |
| Interview practice | The NeetCode 150 curriculum. UMPIRE's *Match* step is pattern recognition | [UMPIRE (CodePath)](https://guides.codepath.org/compsci/UMPIRE-Interview-Strategy), [Tech Interview Handbook](https://www.techinterviewhandbook.org/) |

Caveat: spacing helps less on complex tasks ([Donovan & Radosevich 1999](https://www.researchgate.net/publication/232561426_A_Meta-Analytic_Review_of_the_Distribution_of_Practice_Effect_Now_You_See_It_Now_You_Don't)), so every review has to be a full, effortful re-solve. The Research page has the full notes and references.

## 📄 License

The code is released under the [MIT License](LICENSE). The problem data has its own sources and terms, listed in [`public/NOTICE.md`](public/NOTICE.md).
