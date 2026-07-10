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

## SEO

`index.html` includes canonical URL, robots, keywords, Open Graph + Twitter cards
(`og.png` is the 1200×630 share image), and JSON-LD structured data (WebSite +
Organization + MobileApplication). `robots.txt` and `sitemap.xml` are served at
the site root, plus a `site.webmanifest` and `icon.png`.

**To actually appear in Google search, you must tell Google the site exists:**

1. Open [Google Search Console](https://search.google.com/search-console) and add
   a property for `https://tafcast.github.io/` (URL-prefix).
2. Verify ownership — easiest is the **HTML tag** method: it gives a
   `<meta name="google-site-verification" content="…">` tag; send it to me (or
   paste it into `<head>`), commit, push.
3. In Search Console: **Sitemaps** → submit `sitemap.xml`; then **URL Inspection**
   → enter the URL → **Request indexing**.

Indexing can take a few hours to a few days. "tafcast" is a low-competition brand
term, so once indexed the site should rank at/near the top for it.

## To do

- Add the real **Google Play** URL (the button at `href="#"` in the hero is still a placeholder).
- Submit the site to Google Search Console (see SEO section) — needs your Google account.
