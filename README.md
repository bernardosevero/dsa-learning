# dta-learning

A spaced-repetition trainer for coding interviews. It tells you which problem to practice next (a review you're about to forget, or a new one from the NeetCode 150) and schedules each re-solve from how hard it felt.

**Status:** the app is scaffolded; the MVP is being built. Planning docs (Notion): [MVP plan](https://app.notion.com/p/3e674cb445b8812cbbd2d4de94bffd7a) · [Research](https://app.notion.com/p/3e674cb445b881078373c4e3c90c9bdb)

## How it works

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

## Stack (planned)

Vite + React + TypeScript, tested with Vitest. Local-first: data stays in the browser with JSON export/import, and the MVP has no backend. Problem data comes from NeetCode's [MIT-licensed problem list](https://github.com/neetcode-gh/leetcode/blob/main/.problemSiteData.json).

## Running locally

You need Node 24 (see `.nvmrc`) and pnpm 10. With Corepack, `corepack enable` installs the pnpm version pinned in `package.json`.

```sh
pnpm install
pnpm dev
```

The app runs at http://localhost:5173.

One environment variable feeds the link previews (what Slack, WhatsApp or iMessage show when someone pastes the app's URL):

| Variable | What it is |
|---|---|
| `VITE_SITE_URL` | The deployed site's URL, without a trailing slash (e.g. `https://dta-learning.pages.dev`). Vite writes it into the `og:url`, `og:image` and `twitter:image` tags in `index.html`, which must be absolute URLs. On Cloudflare Pages it's an environment variable (see [Deploy](#deploy)). Locally it's optional: without it the build warns that it isn't defined and leaves the placeholder in, which only matters on a deployed site. To set it locally, put `VITE_SITE_URL=http://localhost:5173` in `.env.local` |

| Command | What it does |
|---|---|
| `pnpm dev` | Starts the dev server with hot reload |
| `pnpm test` | Runs the tests once (`pnpm test:watch` re-runs them on every change) |
| `pnpm test:e2e` | Builds the app, serves it and runs the Playwright tests in `e2e/` against it in Chromium |
| `pnpm lint` | Runs ESLint, including the rule that keeps `src/domain` pure |
| `pnpm typecheck` | Type-checks the project with TypeScript |
| `pnpm format` | Formats the code with Prettier |
| `pnpm build` | Type-checks and builds the static site into `dist/` |
| `pnpm preview` | Serves the built `dist/` locally |

CI runs `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` on every pull request, so run the same four before opening one. A separate CI job runs `pnpm test:e2e`.

The end-to-end tests need a Chromium that matches the installed Playwright version. Install it once with `pnpm exec playwright install chromium`. If your machine already has a different Chromium build (some sandboxes preinstall one), point the tests at it instead with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome pnpm test:e2e`.

The problem list in `src/data/problems.json` is committed, so the app needs no network. To regenerate it (this needs network access):

| Command | What it does |
|---|---|
| `pnpm tsx scripts/snapshot-nc-links.ts` | Re-snapshots NeetCode's practice slugs from neetcode.io into `scripts/data/nc-links.json`. Run it only when a slug is missing |
| `pnpm tsx scripts/build-problems.ts` | Rebuilds `src/data/problems.json` from neetcode-gh/leetcode and the slug snapshot, keeping existing summaries |

To see the success metrics (on-time reviews, re-solve speed, rating progress, load and habit), export your data from the app and run `pnpm tsx scripts/metrics.ts <export.json>`. It prints a small table.

The favicon, the Apple touch icon and the link-preview image in `public/` are drawn by `pnpm tsx scripts/render-link-previews.ts`. Run it after changing their design in that script. It needs network access to download the fonts from Google Fonts, and a Chromium like the end-to-end tests (`PLAYWRIGHT_CHROMIUM_EXECUTABLE` works here too).

## Deploy

The app is a static site on Cloudflare Pages. Pages is connected to this repository in the Cloudflare dashboard (Workers & Pages → `dta-learning` → Settings) and deploys on every push: `main` to production, every other branch to a preview with its own URL.

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Environment variables | `PNPM_VERSION=10.33.0`, the pnpm version pinned in `package.json`, and `VITE_SITE_URL`, the production URL (see [Running locally](#running-locally)) |

The build reads the Node version from `.nvmrc`. `VITE_SITE_URL` is read when the site is built, so changing it takes a new deployment. The repository needs no Cloudflare config: with no `404.html` in `dist/`, Pages serves `index.html` for every path that isn't a file, so reloading `/problems` or `/settings` keeps the screen.

Everything a user logs stays in their browser, stored per address: the production URL, each preview URL and each machine start with an empty log. Move a log between them with Export and Import in Settings.

## Research basis

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
