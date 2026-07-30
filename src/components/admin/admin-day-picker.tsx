"use client";

import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";

// A native date input that filters the admin listings to a single day,
// preserving the other filters and resetting to page 1.
export function AdminDayPicker({ label }: { label: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const value = params.get("day") ?? "";

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const sp = new URLSearchParams(params.toString());
    if (e.target.value) sp.set("day", e.target.value);
    else sp.delete("day");
    sp.delete("page");
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      aria-label={label}
      className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:border-primary"
    />
  );
}
