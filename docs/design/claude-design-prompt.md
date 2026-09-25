# Claude Design prompt

Paste everything below the line into Claude Design. Save the results in this folder:
- `tokens.css`: the theme as shadcn/ui CSS variables
- `screens/`: exported screens or links

---

Design the visual identity and the screens for a small web app. I'll build it with **React, Tailwind v4 and shadcn/ui**, so express the identity as shadcn theme tokens and compose screens from shadcn-style components (Card, Button, Badge, RadioGroup, Dialog, Switch, Input, Textarea, Tabs, Separator).

## The product

A spaced-repetition trainer for coding interviews. The working name is "dta-learning"; feel free to suggest a better one. It tells a developer **which coding problem to re-solve today** from the NeetCode 150 list, a curated set of 150 interview problems in 18 topics such as Arrays & Hashing, Two Pointers, Sliding Window, Trees and Graphs. After each attempt the user logs how hard it felt, and the app schedules the next re-solve: **Hard → 2 days, Medium → 7 days, Easy → 30 days**. Easy twice in a row (the second time on the 30-day review) means **Mastered**, and the problem leaves the rotation.

The user solves problems on NeetCode, **in another browser tab**. This app is the coach beside it: what to do next, a timer, and a 30-second log.

## Who uses it and how

- **Who:** developers preparing for interviews at top tech companies, doing 1–3 hours a day.
- **Layout:** most sessions are on a desktop, with **the app in a narrow window next to NeetCode**. Design for about **400–640px wide** first. It also has to be readable on a phone for "what's due today?".
- **Mood:** calm, focused, honest. It's a training log, not a game: no streaks, confetti or XP. Think of a well-made notebook or a runner's training log. Progress should feel earned and quiet.
- **Themes:** both light and dark are required; many developers work in dark mode.

## Part 1: Visual identity (do this first)

1. **Color:**
   - A primary color and a neutral palette.
   - Three **rating colors** for Hard / Medium / Easy. They must be distinguishable for color-blind users, so pair each with a label or icon.
   - Status colors for **new / scheduled / due / mastered**.
   - Everything in both light and dark themes.
2. **Type:** a UI font and a monospace font for times and dates, available on Google Fonts. Include a type scale.
3. **Shape:** radius, spacing density (compact), borders vs shadows.
4. **Deliver the theme as shadcn/ui CSS variables:**
   - `--background`, `--foreground`, `--card`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--border`, `--ring`, `--radius`
   - custom ones: `--rating-hard`, `--rating-medium`, `--rating-easy`, `--status-due`, `--status-mastered`
   - for `:root` and `.dark`

## Part 2: Screens

**Hard rule, the spoiler rule:** when a problem is a **review**, the screen must **never show its topic (pattern), earlier notes, solution or video before the attempt is logged**. Recognizing the pattern is the skill being trained. New problems do show their topic.

### S1. Today (the main screen): a list, not a single card

- **Counters:** Due 4 · New left 120 · Mastered 3.
- **"Due reviews · 4 · ~1h 50m":**
  - The list is sorted most at risk first. The **first row is the focus**: marked ★, full strength, visually the obvious next action.
  - **The other due rows are dimmed** but still clickable.
  - Each row shows the title, the LeetCode difficulty (Easy/Medium/Hard) and "3 days overdue" or "due today", plus a Start button.
  - No topic on review rows.
- **"New · Sliding Window (2/6)":** only the next new problem, showing its topic and difficulty, and Start.
- **What it doesn't have:** no Skip button, no upcoming (not-yet-due) reviews, no daily goal.
- **States to design:**
  - a normal day (4 due + new)
  - a big backlog (20+ overdue: it must not feel punishing)
  - only new, with nothing due
  - "All caught up · next review Oct 8"
  - everything mastered
  - first run (empty, with a short explanation of how it works)

### S2. Solving

- **Content:** the problem title and a one-line summary, a primary "Open on NeetCode" button (opens a new tab) and a secondary "LeetCode" link.
- **Timer:** a large elapsed timer (mm:ss) against a time box (15/30/45 minutes by difficulty), with a calm "over the time box" state. It's guidance, not an alarm.
- **On reviews:** the topic is hidden, and there's a small tip: "Don't use NeetCode's list arrows, they reveal the pattern."
- **Actions:** "I'm done", "I looked at the solution", and Cancel.

### S3. Log attempt (must take under 30 seconds)

- **Rating** (the main element): three large choices, **Hard / Medium / Easy**, each with its anchor text:
  - **Hard:** needed the solution or a big hint, couldn't finish, or went way over the time box.
  - **Medium:** solved it alone, but it was a struggle: slow to find the approach, several bugs, or over the time box.
  - **Easy:** saw the approach quickly and wrote a working solution within the time box.
- **Other fields:**
  - time in minutes, prefilled
  - help used: None / Hint / Looked at the solution
  - "Key insight: what's the trick? How would I recognize it next time?" (1–2 lines)
  - notes, optional
- **Keyboard hints:** 1/2/3 for the rating, Ctrl+Enter to save.
- **After saving, a confirmation state:**
  - "Next re-solve: Oct 8", or a quiet **"Mastered"** moment
  - the topic, **revealed now**
  - the previous attempt's time and key insight, for comparison ("You took 38 min last time, 22 today")
  - links to the solution and video
  - "Back to Today"

### S4. Problems (browse all 150)

- **Layout:** grouped by the 18 topics, each with a progress indicator.
- **Rows:** title, difficulty, a status badge (new / scheduled / due / mastered), the last rating and the next due date.
- **Filter:** All / Due / New / Mastered.
- **Row actions:** Start, and **"Mark as already mastered"** with a confirmation dialog. It's for problems solved before using the app.

### S5. Problem detail

- **Header:** title, difficulty, summary, status and the next due date.
- **Spoilers:** the topic, earlier insights, solution and video sit behind a "Reveal (spoilers)" control while the problem is due.
- **History:** each attempt shows the date, rating, time, help, insight and notes, plus "Marked as already mastered" entries. Each entry can be deleted, with a confirmation.
- **Actions:** Start, and Mark as already mastered.

### S6. Settings & data

- Time boxes (Easy / Medium / Hard minutes), and a "Show the pattern on reviews" switch.
- **Data:**
  - Export (a JSON download), and Import (merges; show "Imported: 12 new entries" or an error).
  - A danger zone: "Reset progress", where you type `reset` to confirm.
- A "Share anonymous usage data" switch, and links to Privacy and credits.

### Navigation

Today · Problems · Settings. Compact: a top bar on narrow widths, and a bottom bar on phones if it helps.

## Constraints

- **Accessibility:** WCAG AA contrast in both themes, visible focus rings, and color never the only signal.
- **Branding:** no NeetCode or LeetCode logos or branding. Mention them as text only.
- **Data:** use realistic data from the NeetCode 150, e.g. Contains Duplicate, Valid Anagram, Longest Substring Without Repeating Characters, Course Schedule, Merge k Sorted Lists, Permutation in String.

## Deliverables, in priority order

1. The identity and the tokens (Part 1)
2. S1 Today, with all its states
3. S3 Log attempt, with the confirmation state
4. S2 Solving
5. S4, S5, S6
6. The phone versions of S1 and S3
