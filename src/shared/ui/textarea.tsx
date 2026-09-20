import * as React from "react";
import { cn } from "@/shared/utilities/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border border-input bg-white px-3 py-2 text-base shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
