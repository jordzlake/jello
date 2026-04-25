// Image cache — stores base64 data URLs in localStorage for offline persistence.
// IMPORTANT: bannerUrl / bgUrl in the store always holds the ORIGINAL URL (permanent).
// The cache is a display-layer optimisation only — if it fails, the original URL is shown.

const PREFIX = 'jello_imgcache_';
const MAX_ENTRIES = 30;

function cacheKey(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return PREFIX + Math.abs(h).toString(36);
}

export function getCached(url: string): string | null {
  if (typeof window === 'undefined' || !url) return null;
  try { return localStorage.getItem(cacheKey(url)); } catch { return null; }
}

function evict(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    if (keys.length >= MAX_ENTRIES) {
      keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => localStorage.removeItem(k));
    }
  } catch {}
}

async function toDataUrl(url: string): Promise<string> {
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

/**
 * Fetches and caches an image. Returns the data URL if successful, or the
 * original URL as fallback. Always call this AFTER saving the original URL
 * to the store — the cache is supplementary, not the source of truth.
 */
export async function cacheImage(url: string): Promise<void> {
  if (!url || typeof window === 'undefined') return;
  if (getCached(url)) return; // already cached
  try {
    const dataUrl = await toDataUrl(url);
    evict();
    try {
      localStorage.setItem(cacheKey(url), dataUrl);
    } catch {
      // localStorage full — clear all image cache entries and try once more
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
        }
        localStorage.setItem(cacheKey(url), dataUrl);
      } catch {} // give up silently — original URL will be used
    }
  } catch {} // network error — original URL will be used
}

/**
 * Synchronously resolves a URL to its cached data URL if available.
 * Falls back to the original URL — never returns empty for a valid URL.
 */
export function resolveUrl(url: string | null | undefined): string {
  if (!url) return '';
  return getCached(url) ?? url;
}
