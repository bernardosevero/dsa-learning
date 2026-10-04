import { useId } from "react";

import { Label } from "@/ui/primitives/label";
import { Switch } from "@/ui/primitives/switch";
import { cn } from "@/ui/primitives/cn";

export interface SwitchRowProps {
  label: string;
  hint: string;
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
  /** Shows the switch but doesn't let it change, e.g. while the saved value is still loading. */
  isDisabled?: boolean;
  /** Extra classes for the row, e.g. a divider when another row follows. */
  className?: string;
}

/** A card row: a bold label with a hint under it, and its switch on the right. */
export function SwitchRow({
  label,
  hint,
  isChecked,
  onCheckedChange,
  isDisabled = false,
  className,
}: SwitchRowProps) {
  const switchId = useId();
  const hintId = useId();

  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor={switchId} className="font-semibold">
          {label}
        </Label>
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      </div>
      <Switch
        id={switchId}
        checked={isChecked}
        onCheckedChange={onCheckedChange}
        disabled={isDisabled}
        aria-describedby={hintId}
      />
    </div>
  );
}
