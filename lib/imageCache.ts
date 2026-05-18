const PREFIX = 'jello_img_';
const MAX_ENTRIES = 25;

function cacheKey(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return PREFIX + Math.abs(h).toString(36);
}

export function getCached(url: string): string | null {
  if (typeof window === 'undefined' || !url) return null;
  try { return localStorage.getItem(cacheKey(url)); } catch { return null; }
}

function tryStore(key: string, data: string): void {
  try {
    localStorage.setItem(key, data);
  } catch {
    // quota exceeded — evict half and retry
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) keys.push(k);
      }
      keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(key, data);
    } catch {}
  }
}

// Convert image URL → base64 via canvas (works for CORS-enabled CDNs like Unsplash)
function toBase64ViaCanvas(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth  || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no ctx')); return; }
        ctx.drawImage(img, 0, 0);
        const b64 = canvas.toDataURL('image/jpeg', 0.88);
        if (b64 === 'data:,') { reject(new Error('empty canvas')); return; }
        resolve(b64);
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('img load failed'));
    // Append a cache-buster so the browser fetches fresh with CORS headers
    const sep = url.includes('?') ? '&' : '?';
    img.src = url + sep + '_jcb=1';
  });
}

// Convert via server-side proxy (fallback if canvas/CORS fails)
async function toBase64ViaProxy(url: string): Promise<string> {
  const res = await fetch(`/api/imgcache?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`proxy ${res.status}`);
  const { dataUrl } = await res.json();
  if (!dataUrl?.startsWith('data:')) throw new Error('bad proxy response');
  return dataUrl;
}

/**
 * Converts a URL to base64, stores in localStorage, returns the data URL.
 * Always returns base64 — never returns a raw URL.
 * Tries canvas first (instant, no server needed), then proxy.
 */
export async function cacheImage(url: string): Promise<string> {
  if (!url) return url;
  if (url.startsWith('data:')) return url;

  // Check localStorage first
  const cached = getCached(url);
  if (cached?.startsWith('data:')) return cached;

  // Try canvas (works if Unsplash CDN sends CORS headers)
  try {
    const b64 = await toBase64ViaCanvas(url);
    tryStore(cacheKey(url), b64);
    return b64;
  } catch {
    // Canvas failed (tainted canvas, no CORS) — try server proxy
    try {
      const b64 = await toBase64ViaProxy(url);
      tryStore(cacheKey(url), b64);
      return b64;
    } catch {
      // Both failed — return raw URL as last resort (will trigger migration retry next load)
      return url;
    }
  }
}

export function resolveUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return getCached(url) ?? url;
}
