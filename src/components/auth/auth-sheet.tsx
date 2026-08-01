"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AuthForm } from "@/components/auth/auth-form";

type AuthSheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openAuth: () => void;
};

const AuthSheetContext = createContext<AuthSheetContextValue | null>(null);

export function useAuthSheet() {
  const ctx = useContext(AuthSheetContext);
  if (!ctx) {
    throw new Error("useAuthSheet must be used within an AuthSheetProvider");
  }
  return ctx;
}

export function AuthSheetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openAuth = useCallback(() => setOpen(true), []);

  return (
    <AuthSheetContext.Provider value={{ open, setOpen, openAuth }}>
      {children}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="p-0">
          {/* Visible headings live in AuthForm; this keeps the dialog accessible. */}
          <SheetTitle className="sr-only">Tiraji</SheetTitle>
          <div className="h-full overflow-y-auto p-6">
            <AuthForm onSuccess={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Suspense fallback={null}>
        <AuthParamListener onOpen={openAuth} />
      </Suspense>
    </AuthSheetContext.Provider>
  );
}

// Opens the sheet (or shows an error toast) in response to a `?auth=` param —
// used by protected-page redirects and the OAuth callback, then strips it.
function AuthParamListener({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (!auth) return;

    if (auth === "error") toast.error(t("error"));
    else onOpen();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router, t, onOpen]);

  return null;
}
