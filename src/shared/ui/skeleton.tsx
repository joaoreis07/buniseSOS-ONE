import * as React from "react";

import { cn } from "@/shared/utilities/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-slate-200/80", className)}
      {...props}
    />
  );
}

export { Skeleton };
