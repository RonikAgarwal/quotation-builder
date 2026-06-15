// Tiny, safe localStorage helpers. Used by cart and recent-selection hooks.
// All reads/writes are guarded so a private-mode browser or corrupt value
// never crashes the counter app.
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable/full: degrade silently, app still works in-memory.
  }
}
