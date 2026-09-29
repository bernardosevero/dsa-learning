/** Every user-visible string, so a translation only has to replace this object. */
export const en = {
  appName: "dsa-learning",
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
  },
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
    resetDone: "Progress reset. Every problem is new again.",
    credit: "Problem metadata from neetcode-gh/leetcode (MIT)",
    privacy: "Privacy",
    shareAnonymousUsage: "Share usage data",
    shareAnonymousUsageHint:
      "Helps us learn which parts of the app are used. No notes or insights are sent.",
    privacyAndCredits: "Privacy & credits",
  },
  privacy: {
    yourData: "Your data",
    browserStorage:
      "Your attempts, notes, insights and settings stay in this browser. There is no account or server copy of your practice log.",
    exportAndReset:
      "You can export a backup, import it elsewhere, or reset your progress from Settings.",
    analytics: "Usage analytics",
    analyticsIntro: "When enabled, the app sends pageviews and these events to PostHog US cloud:",
    events: [
      "Pages viewed in the app, including the problem page address.",
      "App opened.",
      "Attempt logged: rating, help used, whether it was a review, days overdue, time in minutes, and topic.",
      "Problem marked already mastered: topic.",
      "Data exported.",
      "Data imported: number of entries added.",
    ],
    analyticsDetails:
      "PostHog receives the page address without query strings, browser and device details, and the IP address used for the network request. Its SDK uses memory instead of analytics cookies or browser storage; PostHog's cookieless mode can still process the IP to measure visits.",
    neverCollected:
      "Your notes, key insights, problem solutions and exported file contents are never sent. Automatic click tracking and session recording are off.",
    optOutBefore: "Sharing is on by default. Turn it off at any time in",
    settingsLink: "Settings",
    optOutAfter: ".",
    credits: "Credits",
    metadataBefore: "Problem titles, topics, difficulties, slugs and video IDs use metadata from",
    metadataSource: "neetcode-gh/leetcode",
    metadataAfter: " under its MIT license.",
    ownSummaries:
      "The one-line summaries are our own words. Full problem statements live on NeetCode and LeetCode.",
    notAffiliated: "This app is not affiliated with or endorsed by NeetCode or LeetCode.",
    mitTitle: "MIT license notice",
    mitNotice: `MIT License

Copyright (c) 2022 neetcode-gh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
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
