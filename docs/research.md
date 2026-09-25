# Research: how people learn DSA, and how learning works

> **Why this doc exists:** the product's rules should rest on evidence. Each section ends with a **→ For the product** line. Numbers in brackets point to the [references](#references) at the end.
>
> **DSA** = data structures & algorithms (the "DTA" in the repo name).

## TL;DR: 10 findings that shape the product

| # | Finding | What it means for the app |
|---|---------|---------------------------|
| 1 | We forget fast. Thinking skills fade faster than physical skills [1][2] | A solved problem isn't "done". It has to come back. |
| 2 | Spacing practice out beats cramming. It's one of only two techniques rated "high utility" in a major review of 10 study methods [3][4] | Core mechanic: schedule re-solves in the future (the 2/7/30 rule). |
| 3 | What matters most is that there's a real gap between repetitions. The exact shape of the schedule matters much less [5][6] | Simple fixed intervals are a solid MVP. A fancy algorithm can wait. |
| 4 | Testing yourself (retrieval) beats re-reading [8][3] | A review means **re-solving from a blank editor**, not re-watching the video. |
| 5 | Mixing problem types (interleaving) feels worse during practice but gives much better results [10][11] | Reviews come from mixed topics, and **the pattern is hidden during reviews**. |
| 6 | A new concept is learned best in a block. Telling concepts apart is learned by mixing them [12][13] | New problems follow NeetCode's list topic by topic. Reviews are mixed. |
| 7 | Try first, then study the solution. Beginners get the most from worked examples [14][15] | Per-problem routine: time-boxed attempt, then hint, then solution, then re-implement from scratch. |
| 8 | Explaining a solution in your own words improves learning [16] | The log form asks for the **key insight** in one sentence. |
| 9 | Experts sort problems by their deep structure (the pattern). Novices sort by surface details [17][18] | The "type of problem" is the real unit of learning, so we track it. |
| 10 | People misjudge their own learning: struggle feels like failing, and fluency feels like mastery [11][20][21][22] | Tie the Easy/Medium/Hard rating to things you can observe, and also record objective data (time, help used). |

---

## Part A: How learning works

### A1. Forgetting is fast, and skills fade too

- Ebbinghaus's forgetting curve (1885) was replicated in 2015. Memory drops steeply in the first hours and days, then levels off [1].
- A meta-analysis of skill retention (53 articles, 189 data points) found large losses when a skill isn't used. The effect goes from about zero right after training (d = −0.01) to a large loss after a year (d = −1.4). **Cognitive tasks decayed more than physical ones** (δ −1.15 vs −0.75) [2].

**→ For the product:** solving a problem once only buys you the ability to solve it for a short while. Being interview-ready means re-solving.

### A2. Spacing (distributed practice)

- Dunlosky et al. reviewed 10 popular study techniques. Only **practice testing** and **distributed practice** got a "high utility" rating. Re-reading, highlighting and summarizing were rated "low" [3].
- **The best gap depends on how long you need to remember.** In a study with more than 1,350 people, the best gap was about 20–40% of the retention interval when the test was 1 week away, and about 5–10% when the test was 1 year away [4].
- **Absolute spacing matters more than the schedule's shape.** Long gaps between repeated retrievals improved long-term retention by about 200% compared with no gaps. Expanding, equal and contracting schedules showed no reliable difference [5]. An earlier study found that equal spacing even beat expanding spacing at a 2-day test. The key factor was delaying the first retrieval [6].
- **Caveat for complex skills:** a meta-analysis of 63 studies found an overall spacing benefit of d = 0.46, but the benefit gets smaller as tasks get more complex [7]. Coding problems are complex. Expect a real but modest effect, and make every repetition effortful (a full re-solve, not a skim).

**→ For the product:**
- Fixed intervals per rating (Hard 2 / Medium 7 / Easy 30 days) fit the evidence for an MVP.
- Later, the interview date should shape the intervals. If the interview is 3 weeks away, a 30-day review lands after it, so intervals should shrink as the date gets closer.

### A3. Retrieval practice (the "testing effect")

- Students who took recall tests remembered much more after 2 days and after 1 week than students who re-studied the same material. On a test 5 minutes later, re-studying looked better [8]. That's the trap: re-studying *feels* more productive.
- Caveat: researchers disagree about whether the testing effect shrinks for complex material (van Gog & Sweller 2015; the reply by Karpicke & Aue 2015) [9]. For coding, the "retrieval" is the whole act of solving, so a review should be a genuine re-solve.

**→ For the product:** a review = re-solve from a blank editor. Before the attempt, **don't show** the notes, the key insight or the pattern. Re-watching the solution video is re-studying, not retrieval.

### A4. Interleaving (mixing problem types)

- In a classic math study, students who practiced mixed problem types scored **63%** on a test one week later, vs **20%** for blocked practice. During practice, though, blocked looked far better (89% vs 60%) [10].
- In a study on learning painters' styles, mixed practice beat blocked practice. Yet most learners still rated blocked practice as more effective, even after their own test showed the opposite [11].
- Why it works: mixing forces you to *choose the strategy*, and blocked practice skips that step. In an interview nobody says "this is a sliding-window problem". Recognizing that is the job.

**→ For the product:** reviews drawn from every topic are interleaved by default. Hide the category label during reviews. After the MVP, add a "which pattern is this?" guess before solving.

### A5. Blocks for learning new things, mixing for telling them apart

- Research on category learning: mixing helps most when categories look similar (you need to tell them apart). Blocking helps when items in one category look different from each other (you need to see what they share) [12].
- The Tech Interview Handbook recommends studying one concept and then practicing questions on that topic right away [13].

**→ For the product:** new problems follow NeetCode's list topic by topic (blocked). Reviews are mixed (interleaved). Together they form a hybrid schedule.

### A6. Try first, then learn from the solution

- Worked examples (studying a solved problem) reduce mental load for beginners. The benefit fades, and can reverse, as expertise grows. At that point, solving problems works better (the *expertise reversal effect*) [14].
- *Productive failure*: across 53 studies (166 comparisons), trying a problem before instruction beat instruction-first for understanding and transfer (Hedges' g = 0.36). The exceptions were young children and domain-general skills [15].

**→ For the product:** routine per problem: attempt with a time box, then a hint if stuck, then the solution/video as a worked example, then **close it and re-implement from scratch**, then log. When you're brand new to a topic, it's fine to watch the explanation earlier.

### A7. Self-explanation

- A meta-analysis of 64 reports found that prompting learners to explain things in their own words gives a solid benefit (g = 0.55) [16]. Dunlosky rated self-explanation "moderate utility" [3].

**→ For the product:** a **key insight** field: 1–2 sentences on what the trick is and how you'd recognize the pattern next time. After your next attempt, the app shows your earlier insight so you can compare.

### A8. Expertise means seeing the deep structure

- Physics experts group problems by the underlying principle. Novices group them by surface features, such as "inclined-plane problems" vs "pulley problems" [17].
- People often fail to use a known solution on a problem that looks different on the surface. Transfer improves when they build a general schema from several similar examples [18].
- The "**M**atch" step of the UMPIRE interview method (Understand, Match, Plan, Implement, Review, Evaluate) is this skill in interview form: match the problem to known categories and patterns [19].

**→ For the product:** every problem records its pattern ("type of problem"). After the MVP: show other problems with the same pattern after you solve one (compare similar problems), and show stats by pattern to reveal weak spots.

### A9. Metacognition: we're bad judges of our own learning

- In a flashcard study, spacing beat massed study for 90% of participants, yet 72% believed massed study had worked better [20].
- Strategies that feel effortful are judged less effective, so people avoid them [21].
- *Foresight bias*: while the answer is in front of you (for example, a solution video), you overestimate how well you'll do later without it [22].

**→ For the product:**
- Anchor ratings to behavior ("needed help?", "within the time box?") instead of vague feelings.
- Record objective data (time, help used) next to the subjective rating.
- Tell the user that struggling during reviews is normal and useful ("desirable difficulty").
- "I watched the solution and understood it" must never count as Easy.

### A10. Deliberate practice (with a caveat)

- Deliberate practice (focused, effortful work on weak spots, with feedback) matters, but less than popular claims suggest. It explained 26% of performance differences in games, 21% in music, 18% in sports, 4% in education and under 1% in professions [23].

**→ For the product:** weak items (Hard) come back soonest, and the judge's test cases on NeetCode give immediate feedback. Don't promise that "X hours guarantees an offer".

---

## Part B: Spaced-repetition algorithms, and where 2/7/30 fits

| System | How it schedules | Notes |
|---|---|---|
| **Leitner boxes** (1970s) | A card moves up a box when you get it right and goes back to box 1 when you get it wrong. Each box has a fixed review frequency [24] | Works on paper. Fixed intervals per box. |
| **SM-2** (SuperMemo, 1987) | 1 day, then 6 days, then previous interval × ease factor (starts at 2.5, minimum 1.3). The ease changes with a 0–5 grade, and a failed recall resets the item [25] | Basis of classic Anki. |
| **FSRS** (2022→) | Models each item's Difficulty, Stability and Retrievability, and schedules to hit a target retention (e.g. 90%). Its parameters are fit to the user's own review history [26] | Optional in Anki since 23.10. More accurate than SM-2 in benchmarks. |
| **Duolingo HLR** (2016) | A regression model predicts each word's memory "half-life" from practice history [27] | Raised daily engagement by 12% in Duolingo's test. |
| **Existing LeetCode SRS tools** | The ones we looked at use fixed ladders (e.g. 1→3→7→14 days) or SM-2 [33] | See C5. |

**Your rule (Hard 2 / Medium 7 / Easy 30 days)** is basically a 3-box Leitner system where your latest rating picks the box.

What's good about it:
- Easy to explain and trust ("Hard means it's back in 2 days").
- Fits the evidence that absolute spacing matters more than the schedule's shape [5][6].
- Needs no parameters and no data.

**The one gap: there's no exit.** Problems never leave the rotation and intervals never grow, so the review load never goes down. Even if all 150 problems were rated Easy forever, that's 150 ÷ 30 = **5 re-solves per day, forever**. A realistic mix is worse.

The [simulation](review-load-sim.py) assumes 150 problems and 2 new problems per day. The rating odds are assumptions, listed in the script.

| Avg re-solves per day | Week 4 | Week 8 | Week 12 | Week 16 | Week 24 | Mastered by day 200 |
|---|---|---|---|---|---|---|
| Pure 2/7/30 | 5.0 | 8.4 | 9.9 | 8.6 | **8.4** (stays there) | 0 |
| 2/7/30 + "Mastered" exit¹ | 5.0 | 8.4 | 8.5 | 5.0 | **1.3** | ~144 / 150 |

¹ Rated Easy on a due review whose previous rating was also Easy. In other words, still easy after the 30-day gap.

**Why this matters more here than in flashcard apps:** an Anki card takes about 10 seconds, but re-solving a coding problem takes 10–30 minutes. **The review time budget is the main constraint on this product.**

**→ For the product:**
1. Keep 2/7/30 for the MVP and add a simple "Mastered" rule (see the [MVP plan](mvp-plan.md#72-proposed-addition-mastered-needs-your-ok)).
2. Store every attempt (date, rating, time, help used) in an append-only log. Moving to FSRS later is then just replaying that history.

---

## Part C: The DSA interview domain

### C1. What interviews evaluate

Top companies evaluate four things: **communication, problem solving, technical competency and testing** [28].

**→ For the product:** the MVP trains problem solving and technical competency. Communication and testing are out of scope for now (later: talk-aloud prompts, a mock-interview mode).

### C2. Curated problem lists

- **Blind 75** was created by Yangshun Tay, who also wrote the Tech Interview Handbook and Grind 75 [29]. **NeetCode 150** = the Blind 75 plus 75 more problems, organized into 18 topics on the NeetCode roadmap [30].
- NeetCode 150 breakdown, computed from NeetCode's MIT-licensed problem data [31]: **28 Easy / 101 Medium / 21 Hard**. 7 of the problems are LeetCode Premium (the source data lists free LintCode alternatives for them).

| # | Topic (NeetCode's order) | Problems | | # | Topic | Problems |
|---|---|---|---|---|---|---|
| 1 | Arrays & Hashing | 9 | | 10 | Backtracking | 9 |
| 2 | Two Pointers | 5 | | 11 | Graphs | 13 |
| 3 | Sliding Window | 6 | | 12 | Advanced Graphs | 6 |
| 4 | Stack | 7 | | 13 | 1-D Dynamic Programming | 12 |
| 5 | Binary Search | 7 | | 14 | 2-D Dynamic Programming | 11 |
| 6 | Linked List | 11 | | 15 | Greedy | 8 |
| 7 | Trees | 15 | | 16 | Intervals | 6 |
| 8 | Tries | 3 | | 17 | Math & Geometry | 8 |
| 9 | Heap / Priority Queue | 7 | | 18 | Bit Manipulation | 7 |

- Time needed: the Tech Interview Handbook suggests about **3 months at ~11 hours/week** for thorough preparation [13].

### C3. How to approach a problem: UMPIRE

**U**nderstand (clarify, work through examples) → **M**atch (which known pattern?) → **P**lan → **I**mplement → **R**eview (hunt for bugs) → **E**valuate (time and space complexity) [19]. The app's review loop trains *Match* in particular.

### C4. Common practice advice from the community (anecdotal, not research)

- Time-box the first attempt before looking for help. 20–30 minutes is the usual advice, but it varies with your level and the problem's difficulty [32].
- After reading a solution, close it and re-implement it without looking.
- Come back to old problems later instead of only grinding new ones.

This matches the research in Part A (productive failure, then worked example, then retrieval, then spacing).

### C5. Existing tools (the idea is validated, and the space is crowded)

LeetRepeat, LeetSRS, LeetRecur (Chrome extension), PatternBank (iOS), LeetFlash (iOS), plus open-source SM-2 and fixed-ladder trackers [33]. Going by their descriptions, most of them focus on **scheduling reviews of problems you've already solved**.

**→ Where we can stand out:**
- **A curriculum plus "what next"**: one clear next action (review or new problem) along NeetCode's topic order, not just a queue.
- **Training pattern recognition**: the pattern is hidden on reviews, and later there's a pattern-guess step.
- **Honest signals**: time and help used on top of an anchored rating, not a single "confidence" button.
- **An exit (Mastered)** that keeps the daily load realistic.

---

## Part D: Summary. The learning routine the app should encourage

**For each problem**
1. Open the problem on NeetCode. On a review, the pattern is hidden.
2. Use UMPIRE and attempt it within a time box.
3. Stuck: take one hint. Still stuck: watch the solution (a worked example). That's fine, just log it honestly.
4. Close the solution and **re-implement it from scratch**.
5. Log it: rating (anchored), time, help used, and the key insight in your own words.
6. When it's due, re-solve it from a blank editor, then compare with your earlier insight.
7. Easy twice in a row (the second time after the 30-day gap) means **Mastered**.

**For each day:** reviews first (they're what you're about to forget), then new problems in NeetCode's order.

---

## References

1. Murre, J. & Dros, J. (2015). Replication and analysis of Ebbinghaus' forgetting curve. *PLOS ONE*. https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0120644
2. Arthur, W. et al. (1998). Factors that influence skill decay and retention: a quantitative review. *Human Performance* 11(1). https://www.tandfonline.com/doi/abs/10.1207/s15327043hup1101_3
3. Dunlosky, J. et al. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest* 14(1). https://journals.sagepub.com/doi/abs/10.1177/1529100612453266 (plain-language summary: https://www.aft.org/ae/fall2013/dunlosky)
4. Cepeda, N. et al. (2008). Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychological Science*. https://pubmed.ncbi.nlm.nih.gov/19076480/
5. Karpicke, J. & Bauernschmidt, A. (2011). Spaced retrieval: absolute spacing enhances learning regardless of relative spacing. *JEP: LMC* 37. https://pubmed.ncbi.nlm.nih.gov/21574747/
6. Karpicke, J. & Roediger, H. (2007). Expanding retrieval practice promotes short-term retention, but equally spaced retrieval enhances long-term retention. *JEP: LMC* 33(4). https://eric.ed.gov/?id=EJ768633
7. Donovan, J. & Radosevich, D. (1999). A meta-analytic review of the distribution of practice effect. *Journal of Applied Psychology* 84. https://www.researchgate.net/publication/232561426_A_Meta-Analytic_Review_of_the_Distribution_of_Practice_Effect_Now_You_See_It_Now_You_Don't
8. Roediger, H. & Karpicke, J. (2006). Test-enhanced learning. *Psychological Science*. https://pubmed.ncbi.nlm.nih.gov/16507066/
9. van Gog, T. & Sweller, J. (2015), with replies, in *Educational Psychology Review* 27(2): https://link.springer.com/journal/10648/volumes-and-issues/27-2. Reply by Karpicke & Aue: https://link.springer.com/article/10.1007/s10648-015-9309-3
10. Rohrer, D. & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science* 35. http://uweb.cas.usf.edu/~drohrer/pdfs/Rohrer&Taylor2007IS.pdf
11. Kornell, N. & Bjork, R. (2008). Learning concepts and categories: is spacing the "enemy of induction"? *Psychological Science*. https://journals.sagepub.com/doi/abs/10.1111/j.1467-9280.2008.02127.x
12. Carvalho, P. & Goldstone, R. (2014). Putting category learning in order. *Memory & Cognition* 42(3). https://link.springer.com/article/10.3758/s13421-013-0371-0
13. Tech Interview Handbook: Coding interview study plan (https://www.techinterviewhandbook.org/coding-interview-study-plan/) and Coding interview prep (https://www.techinterviewhandbook.org/coding-interview-prep/)
14. Kalyuga, S. (2007). Expertise reversal effect and its implications for learner-tailored instruction. *Educational Psychology Review*. https://link.springer.com/article/10.1007/s10648-007-9054-3
15. Sinha, T. & Kapur, M. (2021). When problem solving followed by instruction works: evidence for productive failure. *Review of Educational Research*. https://journals.sagepub.com/doi/10.3102/00346543211019105
16. Bisra, K. et al. (2018). Inducing self-explanation: a meta-analysis. *Educational Psychology Review*. https://link.springer.com/article/10.1007/s10648-018-9434-x
17. Chi, M., Feltovich, P. & Glaser, R. (1981). Categorization and representation of physics problems by experts and novices. *Cognitive Science* 5. https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog0502_2
18. Gick, M. & Holyoak, K. (1983). Schema induction and analogical transfer. *Cognitive Psychology* 15. https://www.sciencedirect.com/science/article/abs/pii/0010028583900026
19. CodePath: UMPIRE interview strategy. https://guides.codepath.org/compsci/UMPIRE-Interview-Strategy
20. Kornell, N. (2009). Optimising learning using flashcards: spacing is more effective than cramming. *Applied Cognitive Psychology* 23. https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.1537
21. Kirk-Johnson, A., Galla, B. & Fraundorf, S. (2019). Perceiving effort as poor learning. *Cognitive Psychology* 115. https://pubmed.ncbi.nlm.nih.gov/31470194/
22. Koriat, A. & Bjork, R. (2005). Illusions of competence in monitoring one's knowledge during study. *JEP: LMC*. https://pubmed.ncbi.nlm.nih.gov/15755238/
23. Macnamara, B., Hambrick, D. & Oswald, F. (2014). Deliberate practice and performance in music, games, sports, education, and professions: a meta-analysis. *Psychological Science*. https://journals.sagepub.com/doi/abs/10.1177/0956797614535810
24. The Leitner system (University of York study guide). https://subjectguides.york.ac.uk/study-revision/leitner-system
25. SuperMemo 2 algorithm. https://www.super-memory.com/english/ol/sm2.htm
26. FSRS: ABC of FSRS. https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS, and the Anki FAQ: https://faqs.ankiweb.net/what-spaced-repetition-algorithm
27. Settles, B. & Meeder, B. (2016). A trainable spaced repetition model for language learning. *ACL*. https://aclanthology.org/P16-1174/
28. Tech Interview Handbook: How candidates are evaluated in coding interviews. https://www.techinterviewhandbook.org/coding-interview-rubrics/
29. Tech Interview Handbook (by Yangshun Tay, creator of Blind 75). https://www.techinterviewhandbook.org/
30. NeetCode roadmap: https://neetcode.io/roadmap. NeetCode 150 list: https://neetcode.io/practice/practice/neetcode150
31. `neetcode-gh/leetcode`, `.problemSiteData.json` (MIT license). https://github.com/neetcode-gh/leetcode/blob/main/.problemSiteData.json, license: https://github.com/neetcode-gh/leetcode/blob/main/LICENSE
32. Community advice on time-boxing (anecdotal): https://www.quora.com/When-practicing-on-Leetcode-how-many-minutes-should-I-attempt-on-each-question-before-I-look-at-the-solutions-of-others, https://leetcopilot.dev/blog/how-long-should-i-spend-on-one-leetcode-problem-before-giving-up
33. Existing tools: https://leetrepeat.com/, https://leetsrs.com/, LeetRecur: https://chromewebstore.google.com/detail/leetrecur-spaced-repetiti/lmidmepgdbipmebgdalghmbehpiobiie, PatternBank: https://apps.apple.com/app/patternbank/id6759760762, LeetFlash: https://apps.apple.com/mx/app/leetflash/id6744669023, SM-2 tracker: https://github.com/kunleihe/leetcode-review, CLI: https://github.com/brandon-gong/grind
