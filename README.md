# TAFCast — landing page

Static marketing/landing page for the TAFCast Android app, hosted on GitHub Pages.

**Live:** https://tafcast.github.io/

## What's here

- `index.html` — the entire site: a single, self-contained page (all CSS and JS inline, no build step, no external dependencies).
- `.nojekyll` — tells GitHub Pages to serve files as-is (skip Jekyll processing).

## Editing

Open `index.html` and edit directly. To preview locally:

```sh
python3 -m http.server 8123 --directory .
# then open http://localhost:8123/
```

## Adding the APK download

The **Download APK** and **Get the app** buttons already point to `tafcast.apk`
(with a `download` attribute). To make the download live:

1. Copy the built APK into this folder, named exactly `tafcast.apk`.
2. Commit and push:
   ```sh
   git add tafcast.apk && git commit -m "Add APK" && git push
   ```
3. It will be downloadable at `https://tafcast.github.io/tafcast.apk`.

Keep the file under 100 MB (GitHub's per-file limit). To ship a new version,
overwrite `tafcast.apk` and push again.

## To do

- Add the real **Google Play** URL (the button at `href="#"` in the hero is still a placeholder).
