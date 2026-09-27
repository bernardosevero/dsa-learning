import { t } from "@/ui/strings";

export interface CountersProps {
  counts: { due: number; newLeft: number; mastered: number };
}

/** The Due · New left · Mastered strip at the top of Today. */
export function Counters({ counts }: CountersProps) {
  const items = [
    { label: t.today.counters.due, value: counts.due },
    { label: t.today.counters.newLeft, value: counts.newLeft },
    { label: t.today.counters.mastered, value: counts.mastered },
  ];
  return (
    <dl className="grid grid-cols-3 rounded-xl border bg-card">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col-reverse px-4 py-3 not-first:border-l">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="font-mono text-2xl">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
