"use client";

import * as React from "react";
import { AlertDialog } from "radix-ui";

import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  // Render the confirm action in the destructive (red) style, for irreversible
  // actions like deleting a listing or a user.
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

// Accessible, promise-based replacement for window.confirm:
//   const confirm = useConfirm();
//   if (!(await confirm({ ... }))) return;
// The dialog is focus-trapped, dismissible with Esc, and announced to screen
// readers (role="alertdialog") — unlike the native prompt it replaces.
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  // Kept across close so the exit animation still has a title/description to
  // render (Radix requires a Title while the content is mounted).
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolverRef = React.useRef<((result: boolean) => void) | null>(null);

  const settle = React.useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const confirm = React.useCallback<ConfirmFn>((next) => {
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog.Root
        open={open}
        onOpenChange={(next) => {
          // Esc, overlay click or Cancel all resolve as "not confirmed".
          if (!next) settle(false);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <AlertDialog.Title className="text-lg font-semibold text-foreground">
              {options?.title}
            </AlertDialog.Title>
            {options?.description && (
              <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
                {options.description}
              </AlertDialog.Description>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" size="sm">
                  {options?.cancelLabel}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant={options?.destructive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => settle(true)}
                >
                  {options?.confirmLabel}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}
