# ✦ JELLO — Task Board (PWA)

Beautiful task board with Board, Calendar, and Gantt views. Install as a phone app.

---

## 📱 Install on Your Phone

### iPhone / iPad (Safari)
1. Open your deployed URL in **Safari**
2. Tap the **Share** button → **"Add to Home Screen"** → **Add**

### Android (Chrome)
1. Open your deployed URL in **Chrome**
2. Tap **⋮** → **"Add to Home screen"** → **Add**
   *(or accept the install banner that appears automatically)*

---

## 🎨 Adding Your Icons

Place these files in the project before deploying:

### `public/` (root)
| File | Purpose |
|------|---------|
| `favicon.ico` | Your `.ico` file — browser tab icon |

### `public/icons/`
| File | Size | Used for |
|------|------|---------|
| `icon.svg` | Vector | Modern browsers — replace with your SVG |
| `icon-192.png` | 192×192 | Android home screen |
| `icon-512.png` | 512×512 | Android splash screen |
| `icon-maskable-192.png` | 192×192 | Android adaptive icon |
| `icon-maskable-512.png` | 512×512 | Android adaptive icon (large) |
| `apple-touch-icon.png` | 180×180 | iPhone / iPad home screen |

### Generate PNGs from your SVG

**Free online:** https://cloudconvert.com/svg-to-png

**Inkscape CLI:**
```bash
inkscape icon.svg -w 512 -h 512 -o icons/icon-512.png
inkscape icon.svg -w 192 -h 192 -o icons/icon-192.png
inkscape icon.svg -w 180 -h 180 -o icons/apple-touch-icon.png
cp icons/icon-512.png icons/icon-maskable-512.png
cp icons/icon-192.png icons/icon-maskable-192.png
```

**Tip:** Maskable icons need ~10% padding. Preview at https://maskable.app

---

## 🚀 Deploy to Vercel

```bash
npm install && npm run dev   # test locally
npm i -g vercel && vercel    # deploy
```

Or push to GitHub → import at vercel.com → auto-deploy.

---

## 💾 Storage

All data stored in **localStorage** — no backend, no accounts, fully on-device.
Use the Save/Load JSON buttons to backup or migrate your data.
