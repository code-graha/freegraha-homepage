# freegraha.in

Homepage for **freegraha.in**, the domain where projects designed and built by [WebGraha](https://webgraha.com) get a free `yourproject.freegraha.in` subdomain. Static site, served from GitHub Pages (`CNAME`).

## Adding or editing a project

1. Edit [`data/projects.json`](data/projects.json):

   ```json
   {
       "subdomain": "acme",
       "name": "Acme Bakery",
       "description": "One or two sentences about the project.",
       "tags": ["Website", "Food"],
       "icon": "https://acme.freegraha.in/apple-touch-icon.png",
       "launched": "2026-12-01"
   }
   ```

   `subdomain`, `name` and `description` are required; `tags`, `icon`, `launched` and `url` are optional.

2. Run the build (Node 18+, no dependencies):

   ```sh
   node scripts/build.mjs
   ```

3. Commit and push.

The build writes the project cards into `index.html` as real HTML, so search engines and AI crawlers can read them. It also updates the project `ItemList` structured data, the "Last updated" date, `sitemap.xml` and `llms.txt`. **Always run it after changing projects.**

## Editing the FAQ

The FAQ appears twice in `index.html`: once as visible HTML (`#faq`) and once as `FAQPage` JSON-LD in `<head>`. Keep the questions and answers identical in both places. Google ignores FAQ markup that doesn't match the page.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page; generated blocks are marked `<!-- BUILD:... -->` |
| `data/projects.json` | Single source of truth for listed projects |
| `scripts/build.mjs` | Regenerates project HTML, JSON-LD, sitemap and llms.txt |
| `robots.txt` | Allows search engines and AI crawlers; points to the sitemap |
| `sitemap.xml` | Generated |
| `llms.txt` | Generated plain-text summary for AI assistants ([llmstxt.org](https://llmstxt.org)) |
| `site.webmanifest`, `assets/icon-*.png` | App icons |
| `assets/og/og-home.png` | 1200×630 social share image |
| `404.html` | Not-found page (`noindex`) |

## Local preview

Paths are root-relative, so serve the folder instead of opening the file directly:

```sh
python -m http.server 8000
# then open http://localhost:8000
```
