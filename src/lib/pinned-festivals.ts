const STORAGE_KEY = "drizzle.pinnedFestivalIds";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/** Most recently pinned first. */
export function getPinnedFestivalIds(): string[] {
  return readIds();
}

export function isFestivalPinned(id: string): boolean {
  return readIds().includes(id);
}

export function pinFestival(id: string): string[] {
  const next = [id, ...readIds().filter((x) => x !== id)];
  writeIds(next);
  return next;
}

export function unpinFestival(id: string): string[] {
  const next = readIds().filter((x) => x !== id);
  writeIds(next);
  return next;
}

export function toggleFestivalPin(id: string): string[] {
  return isFestivalPinned(id) ? unpinFestival(id) : pinFestival(id);
}
