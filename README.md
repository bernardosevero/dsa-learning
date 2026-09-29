# dsa-learning

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

No environment variables are needed locally. Analytics runs only in production builds, so local development sends no events. The build warns that `VITE_SITE_URL` isn't defined; it only matters on the deployed site (see [Deploy](#deploy)). `.env.example` lists the optional build variables. `VITE_POSTHOG_KEY` is the public project key; `VITE_POSTHOG_HOST` is `https://us.i.posthog.com` for the US cloud project.

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

The app is live at **https://dsa-learning.bernardosevero.dev**.

It's a static site on Cloudflare Workers, served from `dist/` as static assets. `wrangler.jsonc` holds that setup: it names the Worker, attaches the address above as a Custom Domain (Cloudflare creates its DNS record and HTTPS certificate) and sends every path that isn't a file (`/problems`, `/settings`) to `index.html`, so reloading a screen keeps it. Nothing runs on the server.

Workers Builds, connected to this repository in the Cloudflare dashboard (Workers & Pages → `dsa-learning` → Settings → Build), deploys on every push:

| Setting | Value |
|---|---|
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy`, for pushes to `main` |
| Preview command | `npx wrangler preview`, for every other branch; each one gets its own Preview URL |
| Build variables | `PNPM_VERSION=10.33.0`, the pnpm version pinned in `package.json`; `VITE_SITE_URL=https://dsa-learning.bernardosevero.dev`, the canonical URL with no trailing slash; `VITE_POSTHOG_KEY`, the public project key; and `VITE_POSTHOG_HOST=https://us.i.posthog.com` |

The build reads the Node version from `.nvmrc`. `VITE_SITE_URL` turns the link-preview tags in `index.html` (`og:url`, `og:image`) into the absolute URLs that Slack or WhatsApp need. Vite reads it when the site is built, so it's a build variable (not a runtime one), and changing it takes a new build.

Create a PostHog project in the US cloud and enable **Cookieless server hash mode** under Project settings → Web analytics. Set `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` under Workers & Pages → `dsa-learning` → Settings → Build → Variables and secrets. These are build variables, not Worker runtime variables. Without a key, analytics is disabled; without the PostHog project setting, cookieless events are dropped. When enabled, the app sends a pageview on the initial route and each in-app navigation, plus the named product events. The Settings switch controls usage sharing for each browser; the `/privacy` page describes the data and opt-out.

PostHog uses in-memory persistence and writes no analytics cookie or persistent browser identifier. `ip: false` is included in the SDK config but is deprecated and has no effect in the installed SDK. A direct browser request still exposes its IP to PostHog, and cookieless server hashing can process it. The owner should review the project's IP handling and applicable privacy requirements before enabling analytics; these settings alone do not establish legal compliance.

The Worker's first address, `https://dsa-learning.bernardoseverosilveira.workers.dev`, still serves the same app. `wrangler.jsonc` keeps it on (`workers_dev: true`) so a log stored there can still be exported; the branch Preview URLs live on `workers.dev` too (`preview_urls: true`). It doesn't redirect, and link previews point to the canonical address.

When analytics is enabled, the app sends the limited usage events described on `/privacy` to PostHog.

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
