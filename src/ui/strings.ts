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
    newSection: "New",
    start: "Start",
    dueToday: "due today",
    daysOverdue: (days: number) => (days === 1 ? "1 day overdue" : `${days} days overdue`),
    caughtUp: "All caught up · next review",
    everythingMastered: "Everything mastered",
    browseAll: (count: number) => `Browse all ${count} problems`,
  },
  documentTitle: (page: string) => `${page} · dta-learning`,
} as const;

export const t = en;
