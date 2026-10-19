// Small localStorage-backed stores for useSyncExternalStore (cart ids, coupon code)

function createLocalStore<T>(key: string, fallback: T, parse: (raw: unknown) => T) {
  const listeners = new Set<() => void>();
  let value: T | undefined;

  const read = (): T => {
    if (value === undefined) {
      try {
        const raw = localStorage.getItem(key);
        value = raw == null ? fallback : parse(JSON.parse(raw));
      } catch {
        value = fallback;
      }
    }
    return value;
  };

  const emit = () => listeners.forEach((l) => l());

  const store = {
    subscribe(listener: () => void) {
      listeners.add(listener);
      // Keep tabs in sync
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          value = undefined;
          emit();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot: read,
    getServerSnapshot: () => fallback,
    set(next: T) {
      value = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable: keep the in-memory value */
      }
      emit();
    },
    update(fn: (prev: T) => T) {
      store.set(fn(read()));
    },
  };
  return store;
}

const EMPTY: string[] = [];

export const cartStore = createLocalStore<string[]>("nobodies-cart", EMPTY, (raw) =>
  Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : EMPTY,
);

export const couponStore = createLocalStore<string>("nobodies-coupon", "", (raw) =>
  typeof raw === "string" ? raw : "",
);
