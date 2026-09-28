import { useEffect, useEffectEvent } from "react";

import type { Rating } from "@/domain/types";

const SHORTCUT_RATINGS: Record<string, Rating> = { "1": "hard", "2": "medium", "3": "easy" };

// Typing a digit into the time or a text box must not change the rating.
function isTextField(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement) {
    return true;
  }
  return target instanceof HTMLInputElement && target.type !== "radio";
}

/** 1/2/3 choose Hard/Medium/Easy outside text fields; Ctrl+Enter (or ⌘+Enter) saves anywhere. */
export function useLogShortcuts(onRating: (rating: Rating) => void, onSave: () => void): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const hasModifier = event.ctrlKey || event.metaKey;
    if (hasModifier && event.key === "Enter") {
      event.preventDefault();
      onSave();
      return;
    }
    const rating = SHORTCUT_RATINGS[event.key];
    if (rating === undefined || hasModifier || event.altKey || isTextField(event.target)) {
      return;
    }
    event.preventDefault();
    onRating(rating);
  });
  useEffect(() => {
    function listener(event: KeyboardEvent) {
      handleKeyDown(event);
    }
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
}
