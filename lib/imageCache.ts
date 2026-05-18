const PREFIX = 'jello_img_';

function cacheKey(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return PREFIX + Math.abs(h).toString(36);
}

export function getCached(url: string): string | null {
  if (typeof window === 'undefined' || !url) return null;
  try { return localStorage.getItem(cacheKey(url)); } catch { return null; }
}

function store(key: string, data: string): void {
  try {
    localStorage.setItem(key, data);
  } catch {
    // quota exceeded — clear all cached images and retry
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
      }
      localStorage.setItem(key, data);
    } catch {}
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert any image URL to a base64 data URL.
 * Tries: 1) localStorage cache, 2) direct fetch (CORS), 3) server proxy.
 * Always writes result to localStorage AND returns it.
 */
export async function cacheImage(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url;

  // 1. Already in localStorage?
  const cached = getCached(url);
  if (cached?.startsWith('data:')) return cached;

  const key = cacheKey(url);

  // 2. Direct fetch with CORS (works for Unsplash CDN which allows *)
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (res.ok) {
      const blob = await res.blob();
      const b64 = await blobToBase64(blob);
      if (b64.startsWith('data:')) {
        store(key, b64);
        return b64;
      }
    }
  } catch { /* CORS failed, try proxy */ }

  // 3. Server-side proxy (no CORS restrictions)
  try {
    const res = await fetch(`/api/imgcache?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    if (res.ok && json.dataUrl?.startsWith('data:')) {
      store(key, json.dataUrl);
      return json.dataUrl;
    }
    console.error('[imageCache] proxy error:', json.error, 'status:', res.status);
  } catch (e) {
    console.error('[imageCache] proxy fetch threw:', e);
  }

  console.warn('[imageCache] Failed to convert to base64:', url);
  return url;
}

export function resolveUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return getCached(url) ?? url;
}
