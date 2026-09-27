/** Every user-visible string, so a translation only has to replace this object. */
export const en = {
  appName: "dta-learning",
  nav: {
    label: "Main",
    today: "Today",
    problems: "Problems",
    settings: "Settings",
  },
  pages: {
    today: "Today",
    solving: "Solving",
    logAttempt: "Log attempt",
    problems: "Problems",
    problemDetail: "Problem",
    settings: "Settings & data",
  },
  placeholder: "This screen is on its way.",
  separator: " · ",
  today: {
    counters: { due: "Due", newLeft: "New left", mastered: "Mastered" },
    dueReviews: "Due reviews",
    focus: "★ Focus · most at risk",
    upNext: "★ Up next",
    firstProblem: "★ Your first problem",
    newSection: "New",
    start: "Start",
    dueToday: "due today",
    daysOverdue: (days: number) => (days === 1 ? "1 day overdue" : `${days} days overdue`),
    nothingDue: "No reviews due today. A good day for something new.",
    backlogNote:
      "Welcome back. Overdue reviews carry no penalty: each one's schedule restarts from the day you do it. Start with the focus, and the order takes care of the rest.",
    showOthers: (count: number) =>
      count === 1 ? "Show the other due review" : `Show the other ${count} due reviews`,
    caughtUp: "All caught up",
    caughtUpDetail: "Every problem is started, and nothing is due today.",
    nextReview: "Next review",
    inDays: (days: number) => (days === 1 ? "in 1 day" : `in ${days} days`),
    everythingMastered: "Everything mastered",
    everythingMasteredDetail:
      "Nothing is scheduled any more. You can still practice any problem from Problems; rating it Medium or Hard puts it back in the rotation.",
    openProblems: "Open Problems",
    browseAll: (count: number) => `Browse all ${count} problems`,
    intro: {
      title: "Re-solve problems right before you forget them.",
      summary:
        "Solve a problem once, log how hard it felt, and the app brings it back just before it fades.",
      steps: ["Solve it on NeetCode", "Log it in 30 seconds", "Re-solve it from scratch later"],
      interval: (days: number) => `${days} days`,
      markSolved: "Already solved some? Mark them in Problems",
      importData: "Have an export? Import it in Settings",
    },
  },
  ratings: { hard: "Hard", medium: "Medium", easy: "Easy" },
  solving: {
    backToToday: "‹ Today",
    reviewBadge: "Review · pattern hidden",
    reviewBadgePatternShown: "Review",
    newBadge: "New problem",
    lastSolved: (date: string) => `last solved ${date}`,
    openOnNeetCode: "Open on NeetCode",
    leetCode: "LeetCode",
    timeBoxOf: (duration: string) => `of ${duration}`,
    timeBoxCaption: {
      Easy: "Time box for an Easy problem. It's guidance, not a deadline.",
      Medium: "Time box for a Medium problem. It's guidance, not a deadline.",
      Hard: "Time box for a Hard problem. It's guidance, not a deadline.",
    },
    overTimeBox: (minutes: number) =>
      `${minutes} min past the time box. Keep going, or log it as it is.`,
    reviewTip: "Don't use NeetCode's list or prev/next arrows. They reveal the pattern.",
    done: "I'm done",
    lookedAtSolution: "I looked at the solution",
    cancel: "Cancel",
    replaceTimer: (title: string) => `Replace the running timer for ${title}?`,
    replace: "Replace it",
    keepOther: (title: string) => `Keep it and go back to ${title}`,
    notFound: "This problem isn't in the list.",
  },
  opensInNewTab: "(opens in a new tab)",
  documentTitle: (page: string) => `${page} · dta-learning`,
} as const;

export const t = en;
