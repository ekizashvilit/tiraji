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
        <span
          className={cn("mb-3 block h-1 w-12 rounded-full", bar)}
          aria-hidden
        />
        <h1 className="caps text-2xl font-bold sm:text-3xl">
          {title.toUpperCase()}
        </h1>
        {lede && (
          <p className="mt-2 max-w-xl text-muted-foreground">{lede}</p>
        )}
      </div>
    </div>
  );
}
