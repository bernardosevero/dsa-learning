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
  documentTitle: (page: string) => `${page} · dta-learning`,
} as const;

export const t = en;
