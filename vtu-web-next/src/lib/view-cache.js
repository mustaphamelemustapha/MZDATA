const PREFIX = 'mzdata:view-cache:';

function now() {
  return Date.now();
}

export function readViewCache(key, maxAgeMs = 10 * 60 * 1000) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const ts = Number(parsed.ts || 0);
    if (!Number.isFinite(ts) || now() - ts > maxAgeMs) return null;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function writeViewCache(key, data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${PREFIX}${key}`,
      JSON.stringify({ ts: now(), data })
    );
  } catch {
    // Ignore cache write failures silently.
  }
}
