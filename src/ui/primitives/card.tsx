import * as React from "react";

import { cn } from "@/ui/primitives/cn";

// shadcn/ui Card, restyled to design.md: 1px border, no shadow, padding set where it's used.
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("flex flex-col rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    />
  );
}

export { Card };
