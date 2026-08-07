"use client";

import {
  getPinnedFestivalIds,
  toggleFestivalPin,
} from "@/lib/pinned-festivals";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function emit(): void {
  for (const listener of listeners) listener();
}

function getSnapshot(): string {
  return JSON.stringify(getPinnedFestivalIds());
}

function getServerSnapshot(): string {
  return "[]";
}

export function usePinnedFestivals() {
  const serialized = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const pinnedIds = JSON.parse(serialized) as string[];

  const togglePin = useCallback((id: string) => {
    toggleFestivalPin(id);
    emit();
  }, []);

  const isPinned = useCallback(
    (id: string) => pinnedIds.includes(id),
    [pinnedIds],
  );

  return { pinnedIds, isPinned, togglePin };
}

/** Hydration-safe pin state that avoids SSR/client mismatch flashes. */
export function usePinnedFestivalsReady() {
  const pins = usePinnedFestivals();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return { ...pins, ready };
}
