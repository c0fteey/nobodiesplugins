"use client";

import { useSyncExternalStore } from "react";
import { TriangleAlertIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for deletes and other irreversible actions (default true) */
  destructive?: boolean;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

// One dialog for the whole app, driven by confirmDialog(); a drop-in for window.confirm
let current: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...options, resolve };
    emit();
  });
}

function settle(ok: boolean) {
  current?.resolve(ok);
  current = null;
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Mounted once in <Providers>. */
export function ConfirmDialogHost({ confirmLabel, cancelLabel }: { confirmLabel: string; cancelLabel: string }) {
  const pending = useSyncExternalStore(subscribe, () => current, () => null);
  const destructive = pending?.destructive ?? true;

  return (
    <AlertDialog open={!!pending} onOpenChange={(open) => !open && settle(false)}>
      <AlertDialogContent className="border border-white/10 bg-[#1a1a1c]">
        <AlertDialogHeader>
          {destructive && (
            <AlertDialogMedia className="bg-destructive/15 text-destructive">
              <TriangleAlertIcon />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          {pending?.description && <AlertDialogDescription>{pending.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="border-white/5 bg-white/[0.02]">
          <AlertDialogCancel>{pending?.cancelLabel ?? cancelLabel}</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => settle(true)}
            className={destructive ? "bg-destructive text-white hover:bg-destructive/85" : "bg-brand text-white hover:bg-brand/85"}
            autoFocus
          >
            {pending?.confirmLabel ?? confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
