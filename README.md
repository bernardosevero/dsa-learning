# dta-learning

A small web app that helps developers pass coding interviews using **spaced repetition**. It always tells you what to practice next: a problem you're about to forget, or the next new one from the NeetCode 150. It then schedules the next re-solve from how hard the problem felt:

| You rated it | Re-solve in |
|---|---|
| Hard | 2 days |
| Medium | 7 days |
| Easy | 30 days |

**Status:** planning. There's no code yet.

## Docs

- [`docs/research.md`](docs/research.md): how learning works (spacing, retrieval, interleaving, metacognition) and how DSA interview skill is built, with sources. Each finding ends with what it means for the product.
- [`docs/mvp-plan.md`](docs/mvp-plan.md): MVP scope, exercise data, the log form, scheduling and recommendation rules, data model, screens (input for Claude Design), tech stack, build plan, acceptance criteria and **open decisions**.
- [`docs/review-load-sim.py`](docs/review-load-sim.py): a small simulation of the daily review load (`python3 docs/review-load-sim.py`).

## Next steps

1. Settle the open decisions in [`mvp-plan.md` § 16](docs/mvp-plan.md#16-decisions-needed-from-you).
2. Build milestones M0–M4 (setup → data → domain logic + tests → storage → working UI).
3. Use it daily for 2–3 weeks, then do the design pass with Claude Design using [§ 9](docs/mvp-plan.md#9-screens-and-flows-input-for-the-claude-design-phase).
