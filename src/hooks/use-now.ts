"use client";

import { useSyncExternalStore } from "react";

// One shared 1s ticker for every countdown on the page
const listeners = new Set<() => void>();
let now = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Current time in ms, ticking every second; null during SSR/prerender. */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now || Date.now(),
    () => null,
  );
}
