# WorkFlow — Accounting Edition PWA

A step-by-step workflow checklist manager for accounting and finance tasks.
Installable as a PWA — works fully offline.

## File Structure

```
workflow-pwa/
├── index.html       ← Main app HTML
├── style.css        ← All styles
├── app.js           ← App logic + localStorage
├── sw.js            ← Service worker (offline support)
├── manifest.json    ← PWA manifest
└── icons/
    ├── icon-192.svg ← App icon (small)
    └── icon-512.svg ← App icon (large)
```

## Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `workflow-pwa`)
2. Upload all files keeping the folder structure
3. Go to **Settings → Pages → Source: main branch / root**
4. Your app will be live at `https://yourusername.github.io/workflow-pwa/`
5. Open it on your phone → browser will prompt "Add to Home Screen"

## Data Storage

All data is saved in **localStorage** — stays on your device,
no account or internet needed after first load.

## PWA Features

- ✅ Installable on Android and iOS home screen
- ✅ Works fully offline after first visit
- ✅ Persistent data via localStorage
- ✅ Mobile-first responsive layout
- ✅ Install banner on Android Chrome
