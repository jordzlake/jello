// Fetches images via a server-side proxy (/api/imgcache) to avoid CORS,
// then stores the base64 data URL in localStorage for permanent persistence.
// ALL image saves go through here — bgUrl and bannerUrl in the store are always base64.

const PREFIX = 'jello_img_';
const MAX_ENTRIES = 20;

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

function tryStore(key: string, data: string): void {
  try {
    localStorage.setItem(key, data);
  } catch {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
      }
      localStorage.setItem(key, data);
    } catch {}
  }
}

/**
 * Fetches an image via the server-side proxy, converts to base64,
 * stores in localStorage, and returns the data URL.
 * The returned value is what gets saved to the store — never a raw URL.
 */
export async function cacheImage(url: string): Promise<string> {
  if (!url) return url;
  // Already base64 — return immediately
  if (url.startsWith('data:')) return url;
  // Check localStorage first
  const cached = getCached(url);
  if (cached) return cached;

  try {
    // Fetch via server proxy to avoid CORS
    const res = await fetch(`/api/imgcache?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`proxy ${res.status}`);
    const { dataUrl } = await res.json();
    if (!dataUrl || !dataUrl.startsWith('data:')) throw new Error('bad response');
    evict();
    tryStore(cacheKey(url), dataUrl);
    return dataUrl;
  } catch {
    // Proxy failed — return original URL as last resort
    return url;
  }
}

export function resolveUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return getCached(url) ?? url;
}
