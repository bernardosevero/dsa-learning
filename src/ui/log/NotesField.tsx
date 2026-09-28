import { useState } from "react";

import { t } from "@/ui/strings";

export interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Free notes, behind "+ Add notes" so the form stays short. */
export function NotesField({ value, onChange }: NotesFieldProps) {
  const [isOpen, setIsOpen] = useState(value !== "");
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-11 self-start rounded-sm text-sm text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {t.log.addNotes}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="log-notes" className="text-sm font-semibold">
        {t.log.notes}
      </label>
      <textarea
        id="log-notes"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border bg-card p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  );
}
