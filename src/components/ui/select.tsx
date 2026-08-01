import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// A styled native <select> — keeps the platform picker (great on mobile and for
// older users) while matching our Input's look, with a custom chevron so the
// arrow never crowds the right edge.
function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-10 text-[0.95rem] font-medium outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export { Select };
