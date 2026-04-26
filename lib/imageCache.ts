// All images are stored as base64 data URLs directly in localStorage.
// This means they persist permanently — no CDN, no expiry, fully offline.

const PREFIX = 'jello_img_';
const MAX_ENTRIES = 25; // base64 images are large (~500KB each), keep count low

function cacheKey(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return PREFIX + Math.abs(h).toString(36);
}

function getCached(url: string): string | null {
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
    // If over limit, remove oldest half
    if (keys.length >= MAX_ENTRIES) {
      keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => localStorage.removeItem(k));
    }
  } catch {}
}

async function fetchBase64(url: string): Promise<string> {
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

function tryStore(key: string, data: string): boolean {
  try {
    localStorage.setItem(key, data);
    return true;
  } catch {
    // Storage full — clear all cached images and try once more
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
      }
      localStorage.setItem(key, data);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Downloads an image, stores it as base64 in localStorage, and returns the
 * base64 data URL. This is what gets saved to the store — so the image is
 * fully self-contained and never needs a network request again.
 *
 * Falls back to the original URL only if fetch or storage both fail.
 */
export async function cacheImage(url: string): Promise<string> {
  if (!url) return url;
  // Already a data URL — already cached, return as-is
  if (url.startsWith('data:')) return url;
  // Check localStorage cache first
  const cached = getCached(url);
  if (cached) return cached;
  try {
    const base64 = await fetchBase64(url);
    evict();
    const stored = tryStore(cacheKey(url), base64);
    // Return base64 whether or not storage succeeded — caller gets the data URL
    return base64;
  } catch {
    // Network error — return original URL as last resort
    return url;
  }
}

/**
 * Synchronously resolves a URL. If it's already a data URL, returns it.
 * If a cached version exists, returns that. Otherwise returns the original URL.
 */
export function resolveUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return getCached(url) ?? url;
}
