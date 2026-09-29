import { CircleCheckIcon } from "lucide-react";

import type { Problem } from "@/domain/types";
import { track } from "@/ui/analytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/primitives/alert-dialog";
import { t } from "@/ui/shared/strings";

export interface MarkMasteredDialogProps {
  /** The problem to confirm, or null when the dialog is closed. */
  problem: Problem | null;
  onConfirm: (problem: Problem) => void;
  onClose: () => void;
}

/** Asks before marking a problem as already mastered, since it leaves the rotation. */
export function MarkMasteredDialog({ problem, onConfirm, onClose }: MarkMasteredDialogProps) {
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    }
  }

  function handleConfirm() {
    if (problem !== null) {
      onConfirm(problem);
      track("marked_mastered", { pattern: problem.pattern });
    }
  }

  return (
    <AlertDialog open={problem !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="gap-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-status-mastered-muted text-status-mastered">
            <CircleCheckIcon aria-hidden />
          </span>
          <AlertDialogTitle>
            {problem !== null && t.problems.confirmTitle(problem.title)}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2">
              <p>{t.problems.confirmLeaves}</p>
              <p>{t.problems.confirmUndo}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.problems.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="mastered" onClick={handleConfirm}>
            {t.problems.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
