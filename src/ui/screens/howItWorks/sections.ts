/** The section ids in page order, shared with the sections so the links can't drift from them. */
export const SECTION_IDS = {
  today: "how-today",
  solving: "how-solving",
  intervals: "how-intervals",
  mastery: "how-mastery",
  spoilers: "how-spoilers",
  research: "how-research",
  account: "how-account",
} as const;

export type SectionKey = keyof typeof SECTION_IDS;

export const SECTION_ORDER: readonly SectionKey[] = [
  "today",
  "solving",
  "intervals",
  "mastery",
  "spoilers",
  "research",
  "account",
];

/** Two-digit place of a section in the page, e.g. "01". */
export function toSectionNumber(key: SectionKey): string {
  return String(SECTION_ORDER.indexOf(key) + 1).padStart(2, "0");
}
