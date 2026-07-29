import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  lede,
  accent,
}: {
  title: string;
  lede?: string;
  accent?: "buy" | "swap" | "give";
}) {
  const bar =
    accent === "swap"
      ? "bg-swap"
      : accent === "give"
        ? "bg-give"
        : "bg-buy";

  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-4">
          <span
            className={cn("w-1.5 shrink-0 self-stretch rounded-full", bar)}
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {lede && (
              <p className="mt-1.5 max-w-xl text-muted-foreground">{lede}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
