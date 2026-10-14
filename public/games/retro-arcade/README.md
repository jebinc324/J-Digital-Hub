# J Retro Arcade Web v0.2.1 — Input + Resize Fix

This is a **new standalone web project**. It does not modify the existing Android `J-Retro-Arcade` app.

## v0.2.1 fixes

- Shooting: reliable pointer/touch drag, mouse drag, keyboard left/right, auto-fire retained.
- Engineer Match: tap-two-tiles + swipe-to-swap, guaranteed playable starting board, automatic reshuffle if no move remains.
- Tap Bird: reliable pointer/touch/Space/Up input, safer gate generation, resize-safe bird and pipe positions.
- Gear Factory: RPM gauge now shows **CURRENT RPM** from the currently selected input/output gear teeth; target RPM is shown separately.
- Resize/fullscreen: zero-size transient frames are ignored, ResizeObserver + viewport/fullscreen/orientation resize handling added, high-DPI backing canvas safely capped to avoid black canvases on large displays.
- Crane Stack: fixed an undeclared runtime variable discovered during the all-game sweep.
- One-time v0.2.1 migration refills lives for Shooting, Engineer Match, Gear Factory and Tap Bird without resetting wallet or stage progress.

## Verification

The 12 game engines were run through a construction/update/draw/resize smoke test. All 12 passed. The canvas resize path was also tested with normal, temporary 0×0, and large 1400×2100 frame sizes.

## Run locally

Open `index.html` in a modern browser. For the most consistent behavior, host the folder with a simple local server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Put it online

Upload the contents of this folder to GitHub Pages, Cloudflare Pages, Netlify, Vercel, or another static host.

## Optional real online rooms

Solo play works without a backend. `firebase-multiplayer.js` contains the room-code layer. To enable it, configure Firebase Anonymous Authentication + Realtime Database in `firebase-config.js` and host over HTTPS.

The Android app remains completely separate and untouched.
