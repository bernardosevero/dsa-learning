"""Back-of-envelope simulation of daily review load for the 2/7/30 rule.

Question: if a learner works through the NeetCode 150 and re-solves every
problem that is due, how many re-solves per day does the schedule ask for?

Two policies are compared:
  pure        Hard +2d, Medium +7d, Easy +30d after every attempt, forever.
  mastered    Same, plus: rated Easy on a due review whose previous rating was
              also Easy (i.e. still easy after the 30-day gap) -> Mastered,
              no more reviews.

The rating probabilities below are ASSUMPTIONS (plausible, not measured).
Change them and re-run; the structural result (the pure rule never lets the
load go down) does not depend on them.

Run: python3 docs/review-load-sim.py
"""

import random
import statistics as st

INTERVAL = {"hard": 2, "medium": 7, "easy": 30}

# P(rating) on a first attempt, and on a review given the previous rating.
FIRST = {"hard": 0.50, "medium": 0.35, "easy": 0.15}
AFTER = {
    "hard": {"hard": 0.40, "medium": 0.45, "easy": 0.15},
    "medium": {"hard": 0.15, "medium": 0.50, "easy": 0.35},
    "easy": {"hard": 0.05, "medium": 0.25, "easy": 0.70},
}

TOTAL_PROBLEMS = 150
DAYS = 200
RUNS = 200


def draw(dist, rng):
    r, acc = rng.random(), 0.0
    for rating, p in dist.items():
        acc += p
        if r < acc:
            return rating
    return rating


def simulate(policy, new_per_day, seed):
    rng = random.Random(seed)
    due, last = {}, {}
    introduced = mastered = 0
    reviews_per_day = []
    for day in range(DAYS):
        todays = [p for p, d in due.items() if d <= day]
        for p in todays:
            prev = last[p]
            rating = draw(AFTER[prev], rng)
            last[p] = rating
            if policy == "mastered" and prev == "easy" and rating == "easy":
                del due[p]
                mastered += 1
            else:
                due[p] = day + INTERVAL[rating]
        reviews_per_day.append(len(todays))
        for _ in range(new_per_day):
            if introduced < TOTAL_PROBLEMS:
                p = introduced
                introduced += 1
                last[p] = draw(FIRST, rng)
                due[p] = day + INTERVAL[last[p]]
    return reviews_per_day, mastered


def week_avg(runs, week):
    a, b = (week - 1) * 7, week * 7
    return st.mean(st.mean(r[0][a:b]) for r in runs)


if __name__ == "__main__":
    weeks = [4, 8, 12, 16, 24]
    print("avg re-solves/day in week " + " ".join(f"{w:>5}" for w in weeks) + "   mastered by day 200")
    for new_per_day in (1, 2, 3):
        for policy in ("pure", "mastered"):
            runs = [simulate(policy, new_per_day, s) for s in range(RUNS)]
            cells = " ".join(f"{week_avg(runs, w):5.1f}" for w in weeks)
            done = st.mean(r[1] for r in runs)
            print(f"{new_per_day} new/day, {policy:8s}      {cells}   {done:6.1f}")
