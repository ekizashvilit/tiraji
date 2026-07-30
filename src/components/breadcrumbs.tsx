import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

// A simple breadcrumb trail. The last item is the current page (not a link);
// earlier items link when given an href.
export function Breadcrumbs({
  items,
  className,
  emphasizeLast = false,
}: {
  items: Crumb[];
  className?: string;
  // Render the current (last) crumb as a prominent heading — used where the
  // breadcrumb replaces a separate page title.
  emphasizeLast?: boolean;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {item.href && !last ? (
              <Link
                href={item.href}
                className="whitespace-nowrap transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate text-foreground",
                  emphasizeLast && last && "font-semibold",
                )}
              >
                {item.label}
              </span>
            )}
            {!last && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
          </span>
        );
      })}
    </nav>
  );
}
