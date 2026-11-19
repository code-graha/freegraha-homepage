// freegraha.in — build script (no dependencies).
//
//   node scripts/build.mjs
//
// Reads data/projects.json and regenerates everything that lists projects, so
// search engines and AI crawlers see real HTML instead of JS-rendered content:
//   - project cards in index.html            (<!-- BUILD:PROJECTS --> block)
//   - project count in index.html            (<!-- BUILD:COUNT --> block)
//   - ItemList JSON-LD in index.html         (<!-- BUILD:PROJECTS-LD --> block)
//   - "Last updated" date + dateModified     (<!-- BUILD:UPDATED --> block, JSON-LD, og:updated_time)
//   - sitemap.xml
//   - llms.txt
//
// Run it every time you add, edit or remove a project, then commit the result.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://freegraha.in/';
const DOMAIN = 'freegraha.in';

const today = new Date();
const isoDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
].join('-');
const humanDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const read = (p) => readFileSync(join(ROOT_DIR, p), 'utf8');
const write = (p, s) => writeFileSync(join(ROOT_DIR, p), s, 'utf8');

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// ---------- Load + validate projects ----------

const projects = JSON.parse(read('data/projects.json'));
const SUB_RE = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;
const seen = new Set();
for (const p of projects) {
    if (!p.subdomain || !SUB_RE.test(p.subdomain)) throw new Error(`Invalid subdomain: ${JSON.stringify(p.subdomain)}`);
    if (seen.has(p.subdomain)) throw new Error(`Duplicate subdomain: ${p.subdomain}`);
    if (!p.name) throw new Error(`Missing name for ${p.subdomain}`);
    if (!p.description) throw new Error(`Missing description for ${p.subdomain}`);
    seen.add(p.subdomain);
}
const urlOf = (p) => p.url || `https://${p.subdomain}.${DOMAIN}/`;
const hostOf = (p) => `${p.subdomain}.${DOMAIN}`;

// ---------- index.html ----------

function card(p) {
    const tags = (p.tags || []).slice(0, 3).map((t) => `<li class="tag">${esc(t)}</li>`).join('');
    const search = [p.name, p.subdomain, p.description, ...(p.tags || [])].join(' ').toLowerCase();
    const avatar = p.icon
        ? `<img src="${esc(p.icon)}" alt="${esc(p.name)} logo" width="42" height="42" loading="lazy" decoding="async">`
        : esc(p.name.charAt(0).toUpperCase());
    return `
                    <article class="project-card glass-panel" data-search="${esc(search)}">
                        <a class="project-link" href="${esc(urlOf(p))}" target="_blank" rel="noopener" aria-label="Visit ${esc(p.name)} at ${esc(hostOf(p))}"></a>
                        <div class="project-top">
                            <div class="project-avatar" aria-hidden="${p.icon ? 'false' : 'true'}">${avatar}</div>
                            <div>
                                <h3 class="project-name">${esc(p.name)}</h3>
                                <p class="project-url">${esc(hostOf(p))}</p>
                            </div>
                        </div>
                        <p class="project-desc">${esc(p.description)}</p>
                        <div class="project-foot">
                            <ul class="tags" aria-label="Tags">${tags}</ul>
                            <span class="visit" aria-hidden="true">Visit <i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                        </div>
                    </article>`;
}

const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE}#projects`,
    name: 'Projects hosted on freegraha.in',
    description: 'Websites and apps designed and built by WebGraha, each live on its own freegraha.in subdomain.',
    numberOfItems: projects.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
            '@type': 'WebSite',
            '@id': `${urlOf(p)}#website`,
            name: p.name,
            url: urlOf(p),
            description: p.description,
            ...(p.icon ? { image: p.icon } : {}),
            ...(p.tags?.length ? { keywords: p.tags.join(', ') } : {}),
            ...(p.launched ? { datePublished: p.launched } : {}),
            creator: { '@id': 'https://webgraha.com/#organization' },
            isPartOf: { '@id': `${SITE}#website` }
        }
    }))
};

const count = projects.length
    ? `<strong>${projects.length}</strong> project${projects.length === 1 ? '' : 's'} live`
    : '';

function replaceBlock(html, name, content) {
    const re = new RegExp(`(<!-- BUILD:${name} -->)[\\s\\S]*?(<!-- /BUILD:${name} -->)`);
    if (!re.test(html)) throw new Error(`Marker BUILD:${name} not found in index.html`);
    return html.replace(re, `$1${content}$2`);
}

let html = read('index.html');
html = replaceBlock(html, 'PROJECTS', projects.map(card).join('') + '\n                    ');
html = replaceBlock(html, 'COUNT', count);
html = replaceBlock(html, 'PROJECTS-LD',
    `\n    <script type="application/ld+json">\n${JSON.stringify(itemList, null, 4).replace(/^/gm, '    ')}\n    </script>\n    `);
html = replaceBlock(html, 'UPDATED', `<time datetime="${isoDate}">${humanDate}</time>`);
html = html.replace(/"dateModified": "[^"]*"/g, `"dateModified": "${isoDate}"`);
html = html.replace(/(<meta property="og:updated_time" content=")[^"]*(")/, `$1${isoDate}$2`);
write('index.html', html);

// ---------- sitemap.xml ----------

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>${SITE}</loc>
        <lastmod>${isoDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
        <image:image>
            <image:loc>${SITE}assets/og/og-home.jpg</image:loc>
        </image:image>
    </url>
</urlset>
`);

// ---------- llms.txt (https://llmstxt.org) ----------

const projectLines = projects.length
    ? projects.map((p) => `- [${p.name}](${urlOf(p)}): ${p.description}${p.tags?.length ? ` (${p.tags.join(', ')})` : ''}`).join('\n')
    : '- No projects are listed yet.';

write('llms.txt', `# freegraha.in

> freegraha.in is a domain run by WebGraha (https://webgraha.com), a boutique web design and development studio. Every website, web app or portfolio that WebGraha designs and builds can get a free subdomain on freegraha.in (for example mohitsingh.freegraha.in), set up and managed by WebGraha with HTTPS. It is not a public free-subdomain service: only WebGraha-built projects are eligible.

Key facts:

- Operator: WebGraha (https://webgraha.com)
- Who is eligible: only projects designed or built by WebGraha. Self-built sites and sites built by other agencies are not eligible.
- Cost: free; included with every WebGraha project. DNS setup and HTTPS are included.
- Format: <project-name>.freegraha.in
- How to get one: start a project with WebGraha at https://webgraha.com/contact
- Custom domains: WebGraha can move a project to its own domain at any time.
- Live projects: ${projects.length}
- Last updated: ${isoDate}

## Projects on freegraha.in

${projectLines}

## How it works

1. Work with WebGraha: start a website, web app, portfolio or landing page project.
2. WebGraha designs and builds it.
3. Pick a subdomain: WebGraha sets up yourproject.freegraha.in, including DNS and HTTPS.
4. Launch: the project goes live and is listed in the freegraha.in directory.

## Links

- [freegraha.in home](${SITE}): directory of live projects, eligibility and FAQ
- [WebGraha](https://webgraha.com/): the studio that runs freegraha.in
- [WebGraha services](https://webgraha.com/services): web design, app development, branding, SEO
- [Start a project](https://webgraha.com/contact): how to become a WebGraha client

## Optional

- [Sitemap](${SITE}sitemap.xml)
`);

console.log(`Built ${projects.length} project(s) · ${isoDate}`);
