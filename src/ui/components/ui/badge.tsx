import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/ui/lib/utils";

// shadcn/ui Badge, sized to the design's pills, with variants for our rating and status tokens.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border-border text-muted-foreground",
        muted: "bg-muted text-muted-foreground",
        hard: "bg-rating-hard-muted text-rating-hard",
        medium: "bg-rating-medium-muted text-rating-medium",
        easy: "bg-rating-easy-muted text-rating-easy",
        due: "bg-status-due-muted text-status-due",
        mastered: "bg-status-mastered-muted text-status-mastered",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
