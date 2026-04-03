// Fetches an image URL and caches it as a base64 data URL in localStorage.
// On subsequent calls the cached version is returned immediately without
// any network request — so images persist even if the CDN URL expires.

const PREFIX = 'jello_imgcache_';
const MAX_CACHE_ENTRIES = 40; // keep storage usage reasonable

function cacheKey(url: string): string {
  // Simple hash of the URL as a storage key
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return PREFIX + Math.abs(h).toString(36);
}

export function getCached(url: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(cacheKey(url));
  } catch { return null; }
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function evictOldest(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    if (keys.length >= MAX_CACHE_ENTRIES) {
      // Remove oldest half
      keys.slice(0, Math.floor(keys.length / 2)).forEach(k => localStorage.removeItem(k));
    }
  } catch {}
}

/**
 * Returns a cached data URL for the given image URL.
 * If not cached, fetches, caches, and returns the data URL.
 * Falls back to the original URL if fetch or storage fails.
 */
export async function cacheImage(url: string): Promise<string> {
  if (!url) return url;
  const cached = getCached(url);
  if (cached) return cached;
  try {
    const dataUrl = await fetchAsDataUrl(url);
    evictOldest();
    localStorage.setItem(cacheKey(url), dataUrl);
    return dataUrl;
  } catch {
    // Network failed or storage full — fall back to original URL
    return url;
  }
}

/**
 * Resolves a URL to its cached data URL if available, otherwise returns as-is.
 * Synchronous — use this for display (no loading flicker).
 */
export function resolveUrl(url: string | null | undefined): string {
  if (!url) return '';
  const cached = getCached(url);
  return cached ?? url;
}
