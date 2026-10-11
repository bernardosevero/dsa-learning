/** Every user-visible string, so a translation only has to replace this object. */
export const en = {
  appName: "dsa-learning",
  meta: {
    title: "dsa-learning: re-solve interview problems right before you forget them",
    description:
      "A spaced-repetition trainer for the NeetCode 150. It tells you which problem to re-solve today and schedules the next one from how hard it felt.",
    imageAlt:
      "dsa-learning: Re-solve interview problems right before you forget them. Hard: again in 2 days. Medium: 7 days. Easy: 30 days.",
    publicPages: {
      landing: {
        title: "Spaced repetition for NeetCode 150 | dsa-learning",
        description:
          "Keep solved NeetCode 150 problems in your routine: see your due reviews and the next new problem, then re-solve each one 2, 7 or 30 days later, from how hard it felt.",
      },
      howItWorks: {
        title: "How spaced-repetition practice works | dsa-learning",
        description:
          "How dsa-learning picks what to practice, when a problem returns (Hard 2, Medium 7, Easy 30 days), when it counts as mastered, and the research behind it.",
      },
      privacy: {
        title: "Privacy and credits | dsa-learning",
        description:
          "What dsa-learning stores in your browser and in an optional account, which usage analytics it sends and how to turn them off, and the credits for its problem data.",
      },
    },
    applicationDescription:
      "A free spaced-repetition trainer for the NeetCode 150: it shows your due reviews and the next new problem, and schedules each re-solve from how hard it felt.",
  },
  footer: {
    label: "About the creator",
    credit: "© Bernardo Severo - 2026 | Made with ❤️ in 🇧🇷",
    accessibleCredit: "© Bernardo Severo - 2026. Made with love in Brazil.",
    github: "GitHub",
    linkedin: "LinkedIn",
  },
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
    privacy: "Privacy & credits",
    notFound: "Page not found",
  },
  separator: " · ",
  shell: {
    loading: "Loading…",
    openApp: "Open app",
    howItWorks: "How it works",
    publicNav: "Site",
  },
  publicLinks: {
    label: "Pages",
  },
  notFound: {
    title: "Page not found",
    body: "There's nothing at this address. It may have moved, or the link may be mistyped.",
    home: "Go to the app",
  },
  account: {
    signIn: "Sign in",
    signInWithGitHub: "Sign in with GitHub",
    openAccount: "Account settings",
    title: "Account",
    purpose:
      "An account syncs your progress across your devices. It's optional: the app works fully without one.",
    signedInAs: "Signed in as",
    signOut: "Sign out",
    deleteAccount: "Delete account",
    deleteTitle: "Delete your account?",
    deleteDetail: "Your account and its cloud copy are deleted. This device keeps its progress.",
    cancel: "Cancel",
    confirmDelete: "Delete account",
    failed: "Something went wrong. Your local progress is unchanged; try again.",
    sync: {
      syncing: "Syncing…",
      synced: "Synced",
      offline: "Offline — will sync when you're back",
      error: "Sync paused — export your data and contact me",
    },
  },
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
    progress: {
      title: "Progress by topic",
      legendMastered: "mastered",
      legendStarted: "started",
      // Read by screen readers, since the bar's colours carry the split.
      topicSummary: (mastered: number, started: number, total: number) =>
        `${mastered} mastered, ${started} started, of ${total}`,
      allTopics: (count: number) => `All ${count} topics in Problems`,
    },
    intro: {
      title: "Re-solve problems right before you forget them.",
      summary:
        "Solve a problem once, log how hard it felt, and the app brings it back just before it fades.",
      loading: "Loading your progress…",
      steps: ["Solve it on NeetCode", "Log it in 30 seconds", "Re-solve it from scratch later"],
      interval: (days: number) => `${days} days`,
      markSolved: "Already solved some? Mark them in Problems",
      importData: "Have an export? Import it in Settings",
    },
  },
  problems: {
    summary: (started: number, mastered: number, total: number) =>
      `${started} started · ${mastered} mastered · ${total} total`,
    filterLabel: "Filter",
    filters: { all: "All", due: "Due", new: "New", mastered: "Mastered" },
    topicDue: (count: number) => `${count} due`,
    topicMastered: (count: number) => `${count} mastered`,
    topicProgress: (done: number, total: number) => `${done} of ${total} started or mastered`,
    columns: { problem: "Problem", lastRating: "Last rating", next: "Next", status: "Status" },
    actionsColumn: "Actions",
    statuses: { new: "New", scheduled: "Scheduled", due: "Due", mastered: "Mastered" },
    upNext: "up next",
    dueToday: "today",
    // The narrow rows' detail line: "Medium · felt Hard · next Sep 29".
    detail: {
      felt: "felt",
      next: "next",
      dueToday: "due today",
      markedMastered: "marked as already mastered",
    },
    noValue: "—",
    actionsFor: (title: string) => `Actions for ${title}`,
    startNow: "Start now",
    openDetails: "Open details",
    markMastered: "Mark as already mastered…",
    confirmTitle: (title: string) => `Mark ${title} as mastered?`,
    confirmLeaves:
      "It leaves the rotation and won't appear on Today again. Use this for problems you could already solve before using the app.",
    confirmUndo:
      "Changed your mind later? Delete the mark from the problem's history and its schedule comes back exactly as it was.",
    cancel: "Cancel",
    confirm: "Mark as mastered",
    empty: {
      due: "Nothing is due today.",
      new: "Every problem is started.",
      mastered: "Nothing is mastered yet.",
    },
  },
  problemDetail: {
    backToProblems: "All problems",
    dueToday: "due today",
    nextDue: (date: string) => `next ${date}`,
    neetCode: "NeetCode",
    leetCode: "LeetCode",
    markMastered: "Mark as already mastered",
    spoilerTitle: "Hidden until you log this review",
    earlierInsights: (count: number) =>
      count === 1 ? "1 earlier insight" : `${count} earlier insights`,
    hiddenWithPattern: (insights: string) =>
      `Pattern, ${insights}, solution and video. Recognizing the pattern yourself is what this review trains.`,
    hiddenWithoutPattern: (insights: string) => `${insights}, solution and video.`,
    reveal: "Reveal (spoilers)",
    hide: "Hide spoilers",
    solutionAndVideo: "Solution & video",
    solutionLink: "Solution on NeetCode",
    videoLink: "Video explanation",
    history: (attemptCount: number) =>
      attemptCount === 1 ? "History · 1 attempt" : `History · ${attemptCount} attempts`,
    timeTrend: (firstMinutes: number, latestMinutes: number) =>
      `${firstMinutes} → ${latestMinutes} min`,
    noHistory: "No attempts yet. Start it to log the first one.",
    minutes: (minutes: number) => `${minutes} min`,
    helps: { none: "No help", hint: "Hint", solution: "Looked at the solution" },
    firstTry: "First try",
    insightHidden: "Insight hidden until you log this review.",
    markedMastered: "Marked as already mastered",
    deleteAttempt: (date: string) => `Delete the ${date} attempt`,
    deleteMark: (date: string) => `Delete the ${date} mastered mark`,
    deleteTitle: (label: string) => `${label}?`,
    deleteDetail: "The schedule is recalculated from the entries left.",
    deleteNote:
      "Deleting an entry asks first, then recalculates the schedule from the entries left.",
    cancel: "Cancel",
    confirmDelete: "Delete",
  },
  settings: {
    practice: "Practice",
    timeBoxes: "Time boxes",
    timeBoxesHint:
      "Guidance only: the timer shows elapsed time against it. By LeetCode difficulty.",
    minutesSuffix: "min",
    timeBoxInvalid: (min: number, max: number) => `Enter whole minutes, from ${min} to ${max}.`,
    showPattern: "Show the pattern on reviews",
    showPatternHint: "Off by default: recognizing the pattern yourself is part of the practice.",
    yourData: "Your data",
    dataIntro:
      "Your practice log lives in this browser. Export a backup now and then, or to move to another device.",
    export: "Export",
    exportHint: "Every attempt, mark and setting, as one JSON file.",
    downloadJson: "Download JSON",
    import: "Import",
    importHint: "Merges with what's here. Nothing is overwritten.",
    chooseFile: "Choose file",
    imported: (count: number) =>
      count === 1 ? "Imported: 1 new entry" : `Imported: ${count} new entries`,
    importFailed: (fileName: string) => `Couldn't import ${fileName}.`,
    dataUnchanged: "Your data is unchanged.",
    dangerZone: "Danger zone",
    reset: "Reset progress",
    resetHint:
      "Deletes every attempt and mark in this browser. Export first if you might want them back.",
    resetConfirmBefore: "Type",
    resetWord: "reset",
    resetConfirmAfter: "to confirm",
    resetHintSignedIn:
      "This resets your progress on every device. Importing an older export won't bring it back.",
    resetDone: "Progress reset. Every problem is new again.",
    credit: "Problem metadata from neetcode-gh/leetcode (MIT)",
    privacy: "Privacy",
    shareAnonymousUsage: "Share usage data",
    shareAnonymousUsageHint:
      "Helps us learn which parts of the app are used. No notes or insights are sent.",
    privacyAndCredits: "Privacy & credits",
  },
  privacy: {
    eyebrow: "Privacy & credits",
    title: "Your practice log lives in your browser.",
    intro:
      "Here is everything dsa-learning stores, where it goes, and the one switch that controls usage analytics.",
    whereTitle: "Where your data lives",
    locations: {
      browser: { title: "This browser", badge: "Always" },
      account: { title: "Your account", badge: "If you sign in" },
      analytics: {
        title: "Usage analytics",
        badge: "Your choice",
        body: "Pageviews and a few events, sent to PostHog US cloud, so we learn which parts of the app are used and can improve them. No analytics cookies, no persistent visitor ID.",
        turnOff: "Turn it off",
      },
    },
    switchTitle: "Share anonymous usage",
    switchKeepsSent: "It doesn't delete events already sent.",
    switchState: { on: "On", off: "Off" },
    sentTitle: "What sharing sends",
    sentIntro:
      "Sharing is on by default. With it on, the app sends pageviews and these events to PostHog US cloud.",
    neverSentTitle: "Never sent",
    neverSent: ["Your notes", "Key insights", "Problem solutions", "Exported file contents"],
    browserStorage:
      "Your attempts, notes, insights and settings stay in this browser. Without an account there is no server copy of your practice log.",
    exportAndReset:
      "You can export a backup, import it elsewhere, or reset your progress from Settings.",
    accountStorage:
      "Signing in with GitHub is optional. If you sign in, your account stores your email address, your GitHub name and avatar, and a copy of your practice log and settings, in Supabase, hosted in East US (North Virginia), so your devices can sync.",
    accountDelete:
      "Delete account in Settings removes your account and that copy. Your progress in this browser stays.",
    events: [
      { name: "Page viewed", detail: "Pages in the app, including the problem page address." },
      { name: "App opened", detail: "That the app was opened." },
      {
        name: "Attempt logged",
        detail:
          "Rating, help used, whether it was a review, days overdue, time in minutes, and topic.",
      },
      { name: "Marked already mastered", detail: "The problem's topic." },
      { name: "Data exported", detail: "That an export happened." },
      { name: "Data imported", detail: "The number of entries added." },
      {
        name: "Start practicing clicked",
        detail: "On the public pages: which page, and where on it the button sits.",
      },
    ],
    analyticsDetails:
      "PostHog receives page addresses without query strings or fragments, browser and device details, and the IP address of each network request. Its cookieless mode uses the IP address, browser details and site hostname to make a visitor hash that changes daily.",
    analyticsStorage:
      "PostHog does not put analytics cookies or a persistent visitor ID in this browser. The app still stores your practice log and settings here.",
    publicPages:
      "The same choice covers the public pages: the home page, How it works and this page. With sharing on, they send pageviews, and a click on Start practicing sends which page it was on and where on that page the button sits.",
    funnel:
      "Within the same visit, a logged attempt also says whether it is the first attempt in this browser's log and whether the visit came through a Start practicing click. Nothing links these events to an account, and nothing follows you across devices.",
    neverCollected:
      "Your notes, key insights, problem solutions and exported file contents are never sent. Automatic click tracking and session recording are off.",
    switchApplies:
      "The switch below is one setting in this browser, the same one as in Settings. Turning it off stops these optional analytics on every page, public and practice.",
    optOutBefore: "Sharing is on by default. Turn it off at any time below or in",
    settingsLink: "Settings",
    optOutAfter:
      ". Turning sharing off stops future analytics events; it does not delete events already sent.",
    credits: "Credits",
    metadataBefore: "Problem titles, topics, difficulties, slugs and video IDs use metadata from",
    metadataSource: "neetcode-gh/leetcode",
    metadataAfter: " under its MIT license.",
    ownSummaries:
      "The one-line summaries are our own words. Full problem statements live on NeetCode and LeetCode.",
    notAffiliated: "This app is not affiliated with or endorsed by NeetCode or LeetCode.",
    mitTitle: "MIT license notice",
  },
  startPracticing: "Start practicing",
  intervals: {
    caption: "How your rating sets the next re-solve",
    columns: { rating: "How it felt", next: "Next re-solve" },
    days: (days: number) => `+${days} calendar days`,
  },
  landing: {
    eyebrow: "A practice log for coding interviews",
    titleLead: "Solved problems come back.",
    title: "Spaced repetition for the NeetCode 150.",
    summary: (hard: number, medium: number, easy: number) =>
      `See your due reviews and the next new problem. Solve it, say how it felt, and dsa-learning brings it back for a re-solve: Hard in ${hard} days, Medium in ${medium}, Easy in ${easy}.`,
    howItWorks: "How it works",
    promises: ["Free", "No account needed", "Progress stays in your browser"],
    previewCaption: "The Today screen, with example practice data",
    previewAlt:
      "The Today screen with example data: three due reviews, the most at-risk one, Contains Duplicate, shown as the focus with a Start button, and Top K Frequent Elements as the next new problem.",
    stepsEyebrow: "The practice loop",
    stepsTitle: "Three steps, every day you practice.",
    steps: {
      due: {
        title: "See what is due",
        body: "Today lists your due reviews, most at risk first, plus the next new problem.",
      },
      solve: {
        title: "Solve and log",
        body: "Solve it on NeetCode or LeetCode from a blank editor. On reviews, the pattern stays hidden. Then rate how it felt and write one key insight.",
      },
      resolve: {
        title: "Return for a re-solve",
        body: (hard: number, medium: number, easy: number) =>
          `Hard comes back in ${hard} calendar days, Medium in ${medium} and Easy in ${easy}. Easy twice, on time, and it's mastered.`,
      },
    },
    intervalsEyebrow: "When a problem comes back",
    intervalsTitle: "Your rating sets the next date. Nothing else does.",
    felt: { hard: "Felt Hard", medium: "Felt Medium", easy: "Felt Easy" },
    days: "days",
    timeline: {
      title: "Example: one problem, from first solve to mastered",
      firstSolve: "First solve",
      review: "Review",
      reviewOnTime: "Review, on time",
      backIn: (days: number) => `Back in ${days} days`,
      easyAfterEasy: "Easy after Easy",
      mastered: {
        date: "From then on",
        label: "Leaves the rotation",
        note: "A later Medium or Hard brings it back",
      },
    },
    intervalsFixed:
      "The intervals are fixed: a Medium stays at 7 days however often you repeat it. Your time and any help you used are recorded for you to look back on, but they don't change the schedule.",
    intervalsMore: "How mastery works, in full",
    research: {
      eyebrow: "Why re-solve",
      title: "Two well-studied ideas, applied to interview prep.",
      body: "The studies are about learning in general. The exact rules here are our own choices, and the app hasn't been tested in a study of its own.",
      more: "Read the research notes",
      findings: [
        {
          name: "Spacing",
          summary:
            "A review spread out from the first study session improved recall later, and the best gap grew with how long the material had to last.",
          source: "Cepeda et al., 2008",
        },
        {
          name: "Retrieval",
          summary:
            "Recalling a passage beat rereading it a week later, even though rereading won on a test five minutes after.",
          source: "Roediger & Karpicke, 2006",
        },
      ],
    },
    closing: {
      title: "Start with problem one.",
      body: "150 problems, in NeetCode order. Your first review is two to thirty days away.",
    },
    faqEyebrow: "Questions",
    faqTitle: "Before you start",
    faqs: {
      dsaForJobs: {
        question: "Are data structures and algorithms still important for landing your next job?",
        answers: [
          "For many software engineering roles, yes. Coding interviews at a lot of tech companies still ask you to solve a data structures and algorithms problem live, often in 45 minutes or less, and explain your approach as you go.",
          "They're rarely the only round: system design, behavioral and project discussions usually matter too. But a coding round is often the first filter, so recognizing patterns quickly is worth keeping sharp.",
        ],
      },
      whyResolve: {
        question: "Why re-solve problems I've already solved?",
        answer: (hard: number, medium: number, easy: number) =>
          `Because solving a problem once doesn't mean you can solve it again weeks later. Recalling an approach from a blank editor, spaced out over days, holds up better than rereading a solution. dsa-learning brings each problem back ${hard}, ${medium} or ${easy} days later, depending on how hard it felt.`,
      },
      neetCode150: {
        question: "What is the NeetCode 150?",
        answer:
          "A list of 150 LeetCode problems grouped by topic, from Arrays & Hashing to Bit Manipulation. dsa-learning follows that list and its topic order for new problems. It's an independent tool, not affiliated with NeetCode.",
      },
      perDay: {
        question: "How many problems should I do a day?",
        answer:
          "As many as you have time for. Today shows your due reviews first, then one new problem, with a time estimate. There's no daily cap and no streak to protect: you decide how much to do.",
      },
      platform: {
        question: "Is this a coding platform?",
        answer:
          "No. dsa-learning tracks your practice. You read the full problem statement and solve it on NeetCode or LeetCode, which may ask for an account of their own.",
      },
      account: {
        question: "Do I need an account?",
        answer:
          "No. Signing in with GitHub is optional and only syncs your progress across devices.",
      },
      storage: {
        question: "Where is my progress saved?",
        answerBefore:
          "In this browser: it works without an account, and you can export it as a JSON file and import it again. The",
        privacyLink: "Privacy page",
        answerAfter: " says exactly what is stored, and where.",
      },
    },
    notAffiliated:
      "An independent tool following the NeetCode 150 list; not affiliated with NeetCode or LeetCode.",
    privacyAndCredits: "Privacy & credits",
    mitNotice: "MIT license notice",
  },
  howItWorks: {
    title: "How spaced-repetition practice works",
    intro:
      "Solve, rate, and re-solve problems from the NeetCode 150. Your rating sets the next review date.",
    eyebrow: "How it works",
    introMore: "Seven questions, answered directly.",
    contents: {
      label: "On this page",
      today: "What to practice today",
      solving: "Where you solve",
      intervals: "When a problem returns",
      mastery: "When it's mastered",
      spoilers: "Why answers are hidden",
      research: "The research",
      account: "Accounts and backups",
    },
    riskExample: {
      caption: "Risk, with example numbers",
      columns: { review: "Review", interval: "Interval", overdue: "Overdue", risk: "Risk" },
      days: (days: number) => `${days} days`,
      percent: (percent: number) => `${percent}%`,
      focus: "Focus",
      problems: {
        containsDuplicate: "Contains Duplicate",
        validParentheses: "Valid Parentheses",
        climbingStairs: "Climbing Stairs",
      },
      footnote:
        "Climbing Stairs is the oldest, but two days late on a two-day interval is the bigger slip.",
    },
    masteryStates: {
      label: "How a problem moves between new, active and mastered",
      new: { name: "New", body: "Never attempted" },
      active: { name: "Active", body: "Comes back on its schedule" },
      mastered: { name: "Mastered", body: "Out of the rotation" },
      anyAttempt: "any attempt",
      easyOnTime: "Easy, on time, after Easy",
      caption:
        "A later Medium or Hard sends a mastered problem back to Active. Already mastered, from Problems, skips straight to the end.",
    },
    spoilerExample: {
      whileReviewing: "While you review",
      afterLogging: "After you log it",
      pattern: "Pattern",
      insight: "Your key insight",
      solution: "Solution and video",
      hidden: "Hidden",
      exampleProblem: "Contains Duplicate",
      examplePattern: "Arrays & Hashing",
      exampleInsight: "Your one-sentence takeaway",
      open: "Open",
    },
    limitsTitle: "What this doesn't prove",
    closing: "Ready for the first problem?",
    today: {
      question: "What should I practice today?",
      reviews:
        "Due reviews come first, sorted by risk: how far past its due date each review is, measured against its interval, rather than simply the oldest date. The first one is your focus.",
      newProblem: "After the reviews comes the next new problem, in NeetCode order.",
      noLimits:
        "There is no daily cap, no skip action and no list of upcoming reviews. You choose how much to do.",
    },
    solving: {
      question: "Where do I solve the problem?",
      before: "You read the full statement and solve the problem on",
      neetCode: "NeetCode",
      between: "(linked first) or",
      leetCode: "LeetCode",
      after:
        ". dsa-learning records your attempts and schedules your reviews. NeetCode and LeetCode may ask you to create an account of their own.",
    },
    intervals: {
      question: "When does a problem return?",
      calendarDays:
        "Each interval counts calendar days in your time zone, starting from the day you actually did the attempt. A Medium stays at 7 days however often you repeat it.",
      timeAndHelp:
        "Your time and any help you used are recorded for you to look back on. They don't change the interval.",
      overdue:
        "An overdue review stays due until you do it. Re-solving a problem before its due date restarts its interval from that day.",
    },
    mastery: {
      question: "When is a problem mastered?",
      rule: "An Easy on a review done on or after its due date, following an Easy, marks the problem mastered. An Easy before the due date doesn't count: the 30-day interval simply restarts.",
      manual:
        "You can also mark any problem Already mastered from Problems. Rating a mastered problem Medium or Hard later brings it back into rotation.",
      label:
        "“Mastered” is the app's scheduling label: the problem leaves the review rotation. It is not a guarantee of how you will do in an interview.",
    },
    spoilers: {
      question: "Why are earlier answers hidden?",
      retrieval:
        "Re-solving from a blank editor is retrieval practice: recalling the approach yourself is the exercise.",
      hidden:
        "So while a problem is being reviewed, its pattern, your earlier key insights and the solution and video links stay hidden until you log the attempt.",
      exceptions:
        "If you turn on “Show the pattern on reviews” in Settings, the pattern stays visible. On a problem's own page, a Reveal (spoilers) button shows the rest when you choose to.",
    },
    research: {
      question: "What is the research behind it?",
      intro:
        "Two well-studied ideas shape the app: spacing and retrieval practice. The studies below are about learning in general; the exact rules in this app are our own choices.",
      spacing: {
        title: "Spacing",
        body: "In a study of more than 1,350 people learning facts, a review spread out from the first study session improved recall on a later test, and the best gap grew longer the longer the material had to be remembered.",
        source: "Cepeda et al. (2008)",
      },
      retrieval: {
        title: "Retrieval practice",
        body: "Students who practiced recalling a passage remembered more of it two days and a week later than students who reread it, even though rereading did better on a test five minutes later.",
        source: "Roediger & Karpicke (2006)",
      },
      broader: {
        title: "Broader evidence on study techniques",
        body: "A review of ten common study techniques rated practice testing and spreading practice over time as the two with high utility, and rereading and highlighting as low.",
        source: "Dunlosky et al. (2013)",
      },
      limits:
        "The fixed 2, 7 and 30-day intervals are product defaults, not a scientifically established optimum for coding interviews. Re-solving a complex coding problem is also different from recalling a fact or a passage, which is what most of this research measured. This app has not been tested in a study of its own.",
    },
    account: {
      question: "Can I use it without an account, and keep a backup?",
      local: "Yes. dsa-learning works without an account: your progress is saved in this browser.",
      backupBefore: "Export it as a JSON file in",
      settingsLink: "Settings",
      backupAfter:
        " to keep a backup or move to another browser, then import it there. Clearing this browser's site data deletes the progress stored here, so export first.",
      optionalAccount:
        "Signing in with GitHub is optional: an account syncs your progress across your devices, and the app works fully without one.",
      privacyBefore: "The",
      privacyLink: "Privacy page",
      privacyAfter: " says exactly what is stored, and where.",
    },
    backToHome: "Back to the home page",
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
    restart: "Restart",
    restartQuestion: "Restart from 00:00?",
    restartDrops: (elapsed: string) => `The ${elapsed} so far is dropped.`,
    keep: "Keep",
    confirmRestart: "Restart",
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
  log: {
    backToTimer: "‹ Back to the timer",
    label: "Log attempt",
    ratingLegend: "How did it feel?",
    intervalDays: (days: number) => `+${days} days`,
    anchors: {
      hard: "I needed the solution or a big hint, couldn't finish, or went way over the time box.",
      medium:
        "I solved it on my own, but it was a struggle: slow to find the approach, several bugs, or over the time box.",
      easy: "I saw the approach quickly and wrote a working solution within the time box.",
    },
    time: "Time",
    minutesSuffix: "min",
    fromTimer: "From the timer",
    helpLegend: "Help used",
    helps: { none: "None", hint: "Hint", solution: "Solution" },
    keyInsight: "Key insight",
    keyInsightPlaceholder: "What's the trick? How would I recognize it next time?",
    keyInsightHint: "You'll see this after your next attempt.",
    notes: "Notes",
    addNotes: "+ Add notes",
    save: "Save",
    saveShortcut: "Ctrl+Enter",
    ratingRequired: "Choose how it felt.",
    timeInvalid: (min: number, max: number) => `Enter the time in minutes, from ${min} to ${max}.`,
    logged: (rating: string) => `Logged · ${rating}`,
    nextResolve: (date: string) => `Next re-solve: ${date}`,
    mastered: "Mastered!",
    masteredDetail:
      "Easy again, 30 days after an Easy. It leaves the rotation. Rate it Medium or Hard on any later practice and it comes back.",
    masteredCount: (count: number, total: number) => `${count} of ${total} mastered`,
    nowRevealed: "Now revealed",
    lastTime: (date: string) => `Last time · ${date}`,
    todayColumn: "Today",
    minutes: (minutes: number) => `${minutes} min`,
    sameTime: "same time",
    faster: (minutes: number) => `${minutes} min faster`,
    slower: (minutes: number) => `${minutes} min slower`,
    solutionLink: "Solution on NeetCode",
    videoLink: "Video explanation",
    backToToday: "Back to Today",
    undo: "Undo",
  },
  opensInNewTab: "(opens in a new tab)",
  documentTitle: (page: string) => `${page} · dsa-learning`,
} as const;

export const t = en;
