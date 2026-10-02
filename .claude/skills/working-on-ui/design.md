# Design spec: "training log"

The approved design from #27, written as build instructions. The tokens are already in `src/index.css`; this file says how screens use them.

- **Pictures of every screen:** the "Screens" section of the [Claude Design prompt page](https://app.notion.com/p/3e674cb445b8813da03ad89e55a65729) in Notion. Look at the ones your issue names before you build.
- **Source canvas (owner only):** https://claude.ai/artifact/E9ir3wQhKG8DsJBNyhYNW9

**Issue vs design:** the issue decides behaviour, data and tests; its quoted wording wins too. This file decides layout, styling and any wording the issue leaves open. If they truly conflict, ask in the PR.

**Round 2** (from dogfooding) adds the desktop sheet, Progress by topic, the timer restart and narrow Problems rows; they're built in #75–#78, and their pictures are in the Notion page's "Round 2" part of "Screens". Once those four are merged, the code is the reference: delete this file in the last of them.

## Look

Warm paper, dark ink, one green for the next action. Calm and honest: no red for overdue, no confetti, no streaks.

- **Fonts:** `font-serif` (Newsreader) for screen titles and problem names in focus; `font-sans` (IBM Plex Sans) for everything else; `font-mono` (IBM Plex Mono) for **every** time, date, count and estimate (`12:48`, `Sun, Oct 4`, `~1h 50m`, `3 days overdue`, `2/6`).
- **Practice layout:** one column, `px-5`. Designed at 480px wide; check 375px and a full desktop window. Public pages share these theme tokens and shadcn primitives but have their own consistent responsive layout and public navigation, without practice bottom navigation.
  - **Narrow window (below 720px wide):** the column fills the window, as before.
  - **Wider windows: the app is a sheet.** The column becomes a sheet centred on a darker "desk": the page background is `--desk` (light `#E9E5DB`, dark `#0E0F0D`; add it to `src/index.css` next to `--background`), and the sheet is `bg-background border rounded-2xl` with `my-8`. The top bar sits inside the sheet with a `border-b`. The sheet is `720px` wide, with the same content and order as the narrow column.
  - **Today from 1100px:** its sheet widens to `1040px` and becomes two columns (`grid-cols-[minmax(0,1fr)_300px] gap-x-10`): heading row across both; Due reviews and New on the left; an `<aside>` on the right with the **counters** on top (stacked: one row each for Due · New left · Mastered, label left in `text-sm text-muted-foreground`, number right in `font-mono text-xl`, rows split by `border-t`) and **Progress by topic** under them. Below 1100px the counters strip goes back above Due reviews and Progress by topic sits under New.
  - **Every practice screen has the same sheet width** (640px column, 720px sheet, 1040px from 1100px), so moving between practice screens never resizes or shifts it. Existing practice width tests remain required. From 1100px, Problems uses the full width; Problem detail, Settings, Solving and Log keep their content to a centred `656px` column (`PageSheet`'s `isReadable`), the width it has in the 720px sheet.
- **Surfaces:** page `bg-background`, cards `bg-card border rounded-xl` (12px). 1px borders, no shadows (menus and dialogs are the only exception).
- **Spacing:** compact. Sections `gap-7`, inside a card `gap-3`/`gap-4`, card padding `p-4`/`p-5`.
- **Buttons:** primary `bg-primary text-primary-foreground`, outline `border bg-card`, ghost. Touch targets at least 44px tall (`min-h-11`).
- **Focus:** the default shadcn ring (`ring` = primary green).
- **Dark mode:** the `.dark` tokens cover it; no separate layouts.

## Shared pieces

Build these once as small components and reuse them.

| Piece | How it looks | Classes / notes |
|---|---|---|
| **Section label** | `DUE REVIEWS · 4` … `~1h 50m` on the right | `text-xs font-semibold uppercase tracking-widest text-muted-foreground`; the right side is `font-mono text-sm` |
| **Rating chip** (how it felt) | pill with a dot glyph and the word | `rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rating-hard-muted text-rating-hard` (same for medium, easy). Glyph: 3 dots, filled = ●●● Hard, ●●○ Medium, ●○○ Easy. Never color alone |
| **LeetCode difficulty** | plain text `Medium` | `text-muted-foreground`. **Never** a chip, so it can't be confused with a rating |
| **Status badge** | New · Scheduled · Due · Mastered | New: outline + `text-muted-foreground`, hollow circle icon. Scheduled: `bg-muted text-muted-foreground`, calendar icon. Due: `bg-status-due-muted text-status-due`, filled dot. Mastered: `bg-status-mastered-muted text-status-mastered`, check-circle icon |
| **Focus card** (★) | the one obvious next action | `rounded-xl border-[1.5px] border-primary bg-card p-5`. Label `★ FOCUS · MOST AT RISK` in `text-primary` section-label style. Title `font-serif text-2xl font-semibold`. Meta `Hard · 1 day overdue` (the overdue part in mono). Primary **Start** button on the right |
| **Dimmed row** | the other due reviews | no card: rows split by `border-b`, `pl-5`. Title and meta both `text-muted-foreground` (this is the "dimmed"; don't use opacity, it fails contrast). Outline **Start** in muted text |
| **Topic bar** | one row of "Progress by topic" | grid `minmax(0,1fr) 72px 36px` in the sidebar, `minmax(0,1fr) 160px 44px` when it sits under the content (`96px` bar below 480px): topic name; a 6px bar on `bg-muted`, mastered share first in `bg-status-mastered`, then the other started ones in `bg-primary`; `9/9` in mono. Visually hidden text gives the numbers ("3 mastered, 6 started, of 9") so the colours aren't the only signal. The same bar as the S4 topic headers |
| **Topic progress** | `2/6` with segments | one small bar per problem in the topic (`h-1.5 w-3.5 rounded-sm`), done = `bg-primary`, rest = `bg-border`; count in mono |
| **Counters strip** | Due · New left · Mastered | one card split in 3 columns by `border-l`; number `font-mono text-2xl`, label `text-xs text-muted-foreground` under it. A `<dl>` |
| **External link** | `Open on NeetCode ↗` | arrow-up-right icon after the text; visually hidden "(opens in a new tab)" |
| **Note box** | gentle info | `rounded-xl bg-muted p-4 text-sm`, clock or info icon. Used for the backlog note and the review tip |
| **Spoiler panel** | hidden content, explained | `rounded-xl border border-dashed bg-muted p-5`, eye-off icon, heading "Hidden until you log this review", one line on what's hidden, outline button "Reveal (spoilers)" with an eye icon |

Icons: lucide-react style outline icons, 16–18px. No emoji.

## Screens

Top bar on every main practice screen: wordmark `dsa-learning` (`font-serif text-xl font-semibold`, links to Today) on the left, nav `Today · Problems · Settings` on the right; the current one is `font-semibold text-foreground` with a 2px `border-primary` underline, others `text-muted-foreground`. A `border-b` separates the top bar from the content. On phones only (below 440px, e.g. `max-[440px]:`), the practice nav moves to a bottom bar with icon + label (calendar, list, sliders); the narrow window beside NeetCode (440–720px) keeps the top nav.

Page heading row: `h1` `font-serif text-3xl` on the left, today's date in mono on the right (Today only).

### S1 Today (#12) · pictures: S1 Today (all 7)

Order: heading row → counters strip → Due reviews → New → Progress by topic → "Browse all 150 problems" link. From 1100px, Progress by topic moves to a sidebar beside the rest (see "Look"). Picture: **Desktop · the app as a sheet, progress by topic beside it**.

- **Progress by topic** (owner-approved addition, round 2): section label `PROGRESS BY TOPIC` with a small legend under it (a mastered swatch + "mastered", a primary swatch + "started"). One card listing topic bars (shared pieces) for every topic with at least one started or mastered problem, plus the next new problem's topic, in NeetCode order; the next new problem's topic is `font-semibold`, and topics with nothing started are `text-muted-foreground`. Under the card, the link "All 18 topics in Problems". Hidden on first run (nothing started yet).

- **Due reviews:** section label with count and `~estimate`. First review = focus card; the rest = dimmed rows.
- **New:** section label `NEW · <PATTERN>` with topic progress on the right. The row is a small card: title `font-semibold`, `Sliding Window · Medium` under it, outline Start with `border-primary text-primary` (not the grey outline of the dimmed rows).
- **Only new (nothing due):** keep the Due label with `· 0` and a dashed-border box: check icon + "No reviews due today. A good day for something new." The New problem then becomes the focus card with the label `★ UP NEXT`.
- **Big backlog (many due):** a note box above the list: "Welcome back. Overdue reviews carry no penalty: each one's schedule restarts from the day you do it. Start with the focus, and the order takes care of the rest." Show the focus + 5 dimmed rows, then a dashed full-width button "Show the other N due reviews ⌄" that expands the rest. No red anywhere.
- **All caught up:** centered card: check-circle icon, `font-serif` "All caught up", "Every problem is started, and nothing is due today.", and a muted box `NEXT REVIEW` / `Thu, Oct 8 · in 11 days` (mono).
- **Everything mastered:** same card with the mastered (plum) icon, "All 150 mastered", "Nothing is scheduled any more. You can still practice any problem from Problems; rating it Medium or Hard puts it back in the rotation.", outline button "Open Problems".
- **First run:** instead of the counters, an intro: `h1` "Re-solve problems right before you forget them." + one line, then a numbered 3-step card (Solve it on NeetCode · Log it in 30 seconds · Re-solve it from scratch later, with the three rating chips `Hard · 2 days`, `Medium · 7 days`, `Easy · 30 days`). Then the first problem as a focus card labelled `★ YOUR FIRST PROBLEM`, and two links: mark already-solved problems in Problems, import data in Settings.

### S2 Solving (#13) · pictures: S2 Solving review, S2 Solving new

- **Top bar replaced** by `‹ Today` on the left and a badge on the right: reviews `Review · pattern hidden` (due-badge colors), new problems `New problem` (outline).
- **Header:** meta line (`Hard · last solved Sep 24` on reviews; `Sliding Window · Medium` on new), title `font-serif text-4xl`, summary `text-base`.
- **Links:** full-width primary "Open on NeetCode ↗" and a text link "LeetCode ↗" beside it.
- **Timer card:** elapsed `font-mono text-6xl`, `of 45:00` in mono on the right, a 6px progress bar (`bg-primary`), caption "Time box for a Hard problem. It's guidance, not a deadline."
- **Restart** (round 2, picture: **S2 Solving · restart the timer**): at the right of the caption row, a ghost button with a rotate-ccw icon and "Restart" (`text-muted-foreground text-sm`, 40px tall). It asks inline, inside the timer card: a `bg-muted rounded-lg` row "Restart from 00:00? The 12:48 so far is dropped." with an outline "Keep" and a dark "Restart" (`bg-foreground text-background`). Restart sets the timer's start to now; Keep closes the question. Focus moves to the question when it opens and back to "Restart" when it closes.
- **Over the time box:** the card border and the overflow part of the bar turn `--rating-medium` (ochre), and a clock-icon line in that color: "4 min past the time box. Keep going, or log it as it is." Calm, never red.
- **Review tip:** note box with eye-off icon.
- **Actions, stacked:** "I'm done" (`bg-foreground text-background`, full width), "I looked at the solution" (outline, full width), then a centered muted link "Cancel, don't log anything".

### S3 Log attempt (#14) · pictures: S3 Log attempt, S3 Logged, S3 Mastered

- **Top:** `‹ Back to the timer` and the review badge. Section label `LOG ATTEMPT`, title `font-serif text-3xl`.
- **Rating:** legend "How did it feel?"; three stacked radio cards (Hard, Medium, Easy). Each: native radio, dot glyph + word in the rating color, the interval (`+2 days`, mono, muted) and a `kbd` hint (`1`/`2`/`3`) on the right, the anchor text under it. Selected card: `border-2` in the rating color and `bg-rating-*-muted`.
- **Row of two:** Time (number input, mono, `min` suffix, caption "From the timer") and Help used (a 3-part segmented radio group: None · Hint · Solution; selected = `bg-accent text-primary font-semibold`).
- **Key insight:** label, hint line "What's the trick? How would you recognize it next time? You'll see this after your next attempt.", textarea 2 rows.
- **Notes:** collapsed behind a "+ Add notes" text button.
- **Save:** full-width primary button with `Ctrl+Enter` in small mono inside it.
- **Logged:** rating chip `Logged · Medium` above the title. Card `NEXT RE-SOLVE` / `Sun, Oct 4` (mono, large) / `in 7 days`. Card `NOW REVEALED` (eye icon): the pattern in `font-serif`, a 2-column comparison (Last time · date / Today: time in mono, rating chip with help, the time difference in `text-primary`), both insights as quotes (`font-serif`, left border; today's border in primary), then the "Solution on NeetCode ↗" and "Video explanation ↗" links. Buttons: primary "Back to Today" and outline "Undo".
- **Mastered:** centered card with the plum double-ring check icon, label `MASTERED`, title, "Easy again, 30 days after an Easy. It leaves the rotation. Rate it Medium or Hard on any later practice and it comes back.", `4 of 150 mastered` in mono. Then the NOW REVEALED card (pattern, times, links). Quiet: no animation.

### S4 Problems (#15) · pictures: S4 Problems, S4 Mark as already mastered

- Heading row with `16 started · 3 mastered · 150 total` in mono.
- **Filter:** segmented control (All · Due · New · Mastered, each with its count in mono) in a `bg-muted` track; selected segment `bg-card`.
- **Topic groups:** one card per topic. Header button (chevron, topic name `font-semibold`, "2 due" in `text-primary` when any are due, a 96px progress bar where mastered = `bg-status-mastered` then started = `bg-primary`, count `9/9` in mono). Expanded topics show a small column header (Problem · Last rating · Next · Status) and rows.
- **Row:** grid `minmax(0,1fr) 90px 70px 104px 44px`: title (link to detail) with the difficulty under it; last rating as colored text; next date in mono; status badge; a `⋯` menu button. Due rows get `bg-accent` and a bolder title. The next new problem says `Medium · up next`.
- **Narrow rows** (round 2, picture: **S4 Problems · narrow rows**): below 560px the grid can't fit, so each row becomes two lines. Line 1: the title (link) and the status badge on the right. Line 2 in `text-sm text-muted-foreground`: `Medium · felt Hard · next Sep 29` (the rating word in its rating color and `font-semibold`, the date in mono; `due today` for due rows; `marked as already mastered` or `up next` where they apply). The `⋯` menu stays on the right, and the column header row is hidden.
- **Row menu:** Start now · Open details · Mark as already mastered…
- **Confirm dialog:** plum check-circle icon, `font-serif` title "Mark <title> as already mastered?", two short paragraphs (it leaves the rotation; deleting the mark from history brings it back), Cancel (outline) and "Mark as mastered" (`bg-status-mastered text-white`).
- Grouping by topic shows the pattern of due problems: accepted in #15.

### S5 Problem detail (#16) · picture: S5 Problem detail

- `‹ All problems` link, then status badge + `Medium · 3 days overdue`, title `font-serif text-3xl`, summary.
- **Actions row:** primary Start, outline "NeetCode ↗", text "LeetCode ↗", and a muted "Mark as mastered" link pushed right.
- **Spoiler panel** while due (see shared pieces): "Pattern, 2 earlier insights, solution and video. Recognizing the pattern yourself is what this review trains."
- **History:** section label `HISTORY · 2 ATTEMPTS` with `41 → 24 min` in mono on the right. One card, entries split by borders: date (mono), rating chip, time (mono), help text, a `First try` tag on the first attempt; the insight line under it (italic muted "Insight hidden until you log this review." while due). A trash icon button (`aria-label="Delete the Sep 17 attempt"`) on the right of each. Mastered marks show a `Marked as already mastered` plum badge instead of the rating.

### S6 Settings & data (#17) · picture: S6 Settings

- `h1` "Settings & data". Sections with section labels, each a card with rows split by borders.
- **Practice:** Time boxes (three labelled number inputs in a row with `min`), then "Show the pattern on reviews" with its explanation and a switch.
- **Your data:** one line that everything lives in this browser; Export row ("Last export: <date>" in mono, outline "Download JSON" with download icon); Import row (outline "Choose file" with upload icon) and its result: success = `bg-accent text-primary` with a check, error = `bg-rating-hard-muted text-destructive` with an alert icon and "Your data is unchanged."
- **Privacy** (later release): the usage-data switch and the Privacy / Credits links.
- **Footer:** the MIT credit line from #17 in `text-xs text-muted-foreground`, centered.
- **Danger zone:** label in `text-destructive`, card with `border-destructive`: "Reset progress", explanation, input labelled "Type `reset` to confirm", and the button disabled (`bg-muted`) until it matches, then `bg-destructive`.
