import { useMemo, useState } from "react";

import {
  countByStatus,
  filterTopics,
  groupByTopic,
  type ProblemFilter,
  type TopicGroup,
} from "@/domain/problemList";
import type { Problem } from "@/domain/types";
import { useAppData } from "@/ui/app/AppData";
import { ToggleGroup, ToggleGroupItem } from "@/ui/primitives/toggle-group";
import { MarkMasteredDialog } from "@/ui/shared/MarkMasteredDialog";
import { t } from "@/ui/shared/strings";

import { TopicSection } from "./TopicSection";

const FILTERS = ["all", "due", "new", "mastered"] as const satisfies readonly ProblemFilter[];

function findFilter(value: string): ProblemFilter | undefined {
  return FILTERS.find((filter) => filter === value);
}

function hasWorkToDo(topic: TopicGroup): boolean {
  return topic.due > 0 || topic.rows.some((row) => row.isUpNext);
}

// Under All, only the topics with work in them start open; a narrower filter opens every match.
function openTopicsFor(topics: readonly TopicGroup[], filter: ProblemFilter): ReadonlySet<string> {
  const visibleTopics = filterTopics(topics, filter);
  const openTopics = filter === "all" ? visibleTopics.filter(hasWorkToDo) : visibleTopics;
  return new Set(openTopics.map((topic) => topic.pattern));
}

function toggledIn(patterns: ReadonlySet<string>, pattern: string): ReadonlySet<string> {
  const toggled = new Set(patterns);
  if (toggled.has(pattern)) {
    toggled.delete(pattern);
  } else {
    toggled.add(pattern);
  }
  return toggled;
}

/** S4: all 150 problems by topic, with a filter and "Mark as already mastered". */
export function ProblemsPage() {
  const { problems, states, todayDate, markMastered } = useAppData();
  const [filter, setFilter] = useState<ProblemFilter>("all");
  const [problemToMark, setProblemToMark] = useState<Problem | null>(null);

  const topics = useMemo(
    () => groupByTopic(problems, states, todayDate),
    [problems, states, todayDate],
  );
  // Taken when the page opens or the filter changes, so a topic doesn't close under the user
  // when marking a problem moves "up next" elsewhere.
  const [openTopics, setOpenTopics] = useState(() => openTopicsFor(topics, "all"));
  const counts = countByStatus(topics);
  const filterCounts: Record<ProblemFilter, number> = {
    all: problems.length,
    due: counts.due,
    new: counts.new,
    mastered: counts.mastered,
  };
  const visibleTopics = filterTopics(topics, filter);

  // A single ToggleGroup reports "" when the chosen item is pressed again; the filter stays.
  function handleFilterChange(value: string) {
    const nextFilter = findFilter(value);
    if (nextFilter !== undefined) {
      setFilter(nextFilter);
      setOpenTopics(openTopicsFor(topics, nextFilter));
    }
  }

  function handleToggle(pattern: string) {
    setOpenTopics((current) => toggledIn(current, pattern));
  }

  function handleConfirmMastered(problem: Problem) {
    markMastered(problem.id);
    setProblemToMark(null);
  }

  function handleCloseDialog() {
    setProblemToMark(null);
  }

  return (
    <>
      <title>{t.documentTitle(t.pages.problems)}</title>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="font-serif text-3xl">{t.pages.problems}</h1>
        <span className="font-mono text-sm text-muted-foreground">
          {t.problems.summary(counts.scheduled + counts.due, counts.mastered, problems.length)}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        <ToggleGroup
          type="single"
          variant="segmented"
          value={filter}
          onValueChange={handleFilterChange}
          aria-label={t.problems.filterLabel}
          className="w-full"
        >
          {FILTERS.map((option) => (
            <ToggleGroupItem key={option} value={option} className="gap-1.5">
              {t.problems.filters[option]}{" "}
              <span className="font-mono text-xs">{filterCounts[option]}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {visibleTopics.length === 0 && filter !== "all" && (
          <p className="py-8 text-center text-muted-foreground">{t.problems.empty[filter]}</p>
        )}
        {visibleTopics.map((topic) => (
          <TopicSection
            key={topic.pattern}
            topic={topic}
            isExpanded={openTopics.has(topic.pattern)}
            todayDate={todayDate}
            onToggle={handleToggle}
            onMarkMastered={setProblemToMark}
          />
        ))}
      </div>
      <MarkMasteredDialog
        problem={problemToMark}
        onConfirm={handleConfirmMastered}
        onClose={handleCloseDialog}
      />
    </>
  );
}
