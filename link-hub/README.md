# link-hub

A small, reusable GitHub Pages link hub (products / collections / blogs).

## Build

```bash
node link-hub/scripts/build.js
```

Output is generated into the repo root:
- `docs/index.html`
- `docs/products/index.html`
- `docs/collections/index.html`
- `docs/blogs/index.html`

## Edit data

Update:
- `link-hub/data/site.json`

Then rebuild.

## Publish (GitHub Pages)

In your GitHub repo settings:
- Pages → Build and deployment → Source: **Deploy from a branch**
- Branch: `main` (or default) / Folder: **/docs**
