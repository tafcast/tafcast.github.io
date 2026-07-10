# TAFCast — landing page

Static marketing/landing page for the TAFCast Android app, hosted on GitHub Pages.

**Live:** https://supermarketpropaganda.github.io/tafcast/

## What's here

- `index.html` — the entire site: a single, self-contained page (all CSS and JS inline, no build step, no external dependencies).
- `.nojekyll` — tells GitHub Pages to serve files as-is (skip Jekyll processing).

## Editing

Open `index.html` and edit directly. To preview locally:

```sh
python3 -m http.server 8123 --directory .
# then open http://localhost:8123/
```

## To do

- Replace the placeholder `href="#"` on the **Download APK** and **Google Play** buttons with the real links.
