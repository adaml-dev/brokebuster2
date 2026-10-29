"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

// Module-level store so confirmAction() can be called from hooks and plain functions, like toast()
let pending: PendingConfirm | null = null;
const listeners = new Set<(p: PendingConfirm | null) => void>();

function setPending(next: PendingConfirm | null) {
  pending = next;
  listeners.forEach((listener) => listener(pending));
}

/** Non-native replacement for window.confirm(); resolves to true when the user confirms. */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  // A new request cancels one still open
  pending?.resolve(false);
  return new Promise((resolve) => setPending({ ...options, resolve }));
}

/** Renders the dialog for confirmAction(); mount once in the app layout. */
export function ConfirmDialogHost() {
  const [current, setCurrent] = React.useState<PendingConfirm | null>(pending);

  React.useEffect(() => {
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  const close = (confirmed: boolean) => {
    current?.resolve(confirmed);
    setPending(null);
  };

  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && close(false)}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-md">
        <DialogHeader>
          <DialogTitle>{current?.title}</DialogTitle>
          {current?.description && (
            <DialogDescription className="whitespace-pre-line">{current.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {current?.cancelLabel ?? "Anuluj"}
          </Button>
          <Button variant={current?.destructive ? "destructive" : "default"} onClick={() => close(true)} autoFocus>
            {current?.confirmLabel ?? "Potwierdź"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
