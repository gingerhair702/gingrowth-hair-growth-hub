#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const srcRoot = path.resolve(__dirname, '..');

const dataPath = path.join(srcRoot, 'data', 'site.json');
const templatesDir = path.join(srcRoot, 'templates');
const assetsDir = path.join(srcRoot, 'assets');

const outDocsDir = path.join(repoRoot, 'docs');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function escapeHtml(s) {
  return (s ?? '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fill(tpl, vars) {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    return vars[k] === undefined ? '' : String(vars[k]);
  });
}

function groupBy(items, key) {
  const map = new Map();
  for (const it of items) {
    const k = (it[key] || 'Other').toString();
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  return map;
}

function itemSearchText(item) {
  const parts = [];
  for (const k of Object.keys(item)) {
    const v = item[k];
    if (Array.isArray(v)) parts.push(v.join(' '));
    else if (v != null) parts.push(String(v));
  }
  return parts.join(' ').toLowerCase();
}

function renderSections(items, opts) {
  const { groupKey, linkKey, extraMeta } = opts;

  const grouped = groupBy(items, groupKey);
  const sections = [];

  for (const [group, groupItems] of grouped.entries()) {
    const cards = groupItems
      .slice()
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      .map((it) => {
        const title = escapeHtml(it.title || '');
        const url = it[linkKey] || '';
        const handle = escapeHtml(it.handle || '');
        const desc = escapeHtml(it.description || '');
        const badge = extraMeta ? extraMeta(it) : '';
        const search = escapeHtml(itemSearchText(it));

        const metaBits = [];
        if (handle) metaBits.push(`<span class="badge">${handle}</span>`);
        if (badge) metaBits.push(`<span class="badge">${escapeHtml(badge)}</span>`);

        return `
<div class="item" data-role="item" data-search="${search}">
  <div class="row">
    <p class="title"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${title} ↗</a></p>
    <div>${metaBits.join(' ')}</div>
  </div>
  ${desc ? `<p class="meta">${desc}</p>` : ''}
</div>`;
      })
      .join('\n');

    sections.push(`
<div class="section">
  <h3>${escapeHtml(group)}</h3>
  <div class="list">${cards}</div>
</div>`);
  }

  return sections.join('\n');
}

function main() {
  const data = readJson(dataPath);

  const baseTpl = fs.readFileSync(path.join(templatesDir, 'base.html'), 'utf8');
  const homeTpl = fs.readFileSync(path.join(templatesDir, 'home.html'), 'utf8');
  const listTpl = fs.readFileSync(path.join(templatesDir, 'list.html'), 'utf8');

  ensureDir(outDocsDir);

  // Copy assets
  ensureDir(path.join(outDocsDir, 'assets'));
  copyFile(path.join(assetsDir, 'styles.css'), path.join(outDocsDir, 'assets', 'styles.css'));
  copyFile(path.join(assetsDir, 'app.js'), path.join(outDocsDir, 'assets', 'app.js'));

  const common = {
    siteName: escapeHtml(data.siteName || 'Link Hub'),
    siteDescription: escapeHtml(data.description || ''),
    homepage: data.homepage || '#',
    updatedAt: escapeHtml(data.updatedAt || ''),
  };

  // Home
  const homeBody = fill(homeTpl, { assetBase: './' });
  const homeHtml = fill(baseTpl, {
    ...common,
    title: escapeHtml(`${data.siteName || 'Link Hub'}`),
    description: escapeHtml(data.description || ''),
    assetBase: './',
    body: homeBody,
  });
  writeFile(path.join(outDocsDir, 'index.html'), homeHtml);

  // Products
  const productsSections = renderSections(data.products || [], {
    groupKey: 'category',
    linkKey: 'url',
  });
  const productsBody = fill(listTpl, {
    pageTitle: 'Products',
    sections: productsSections,
    assetBase: '../',
  });
  const productsHtml = fill(baseTpl, {
    ...common,
    title: escapeHtml(`${data.siteName || 'Link Hub'} — Products`),
    description: escapeHtml('Product links.'),
    assetBase: '../',
    body: productsBody,
  });
  writeFile(path.join(outDocsDir, 'products', 'index.html'), productsHtml);

  // Collections
  const collectionsSections = renderSections(data.collections || [], {
    groupKey: 'category',
    linkKey: 'url',
  });
  const collectionsBody = fill(listTpl, {
    pageTitle: 'Collections',
    sections: collectionsSections,
    assetBase: '../',
  });
  const collectionsHtml = fill(baseTpl, {
    ...common,
    title: escapeHtml(`${data.siteName || 'Link Hub'} — Collections`),
    description: escapeHtml('Collection links.'),
    assetBase: '../',
    body: collectionsBody,
  });
  writeFile(path.join(outDocsDir, 'collections', 'index.html'), collectionsHtml);

  // Blogs
  const blogsSections = renderSections(data.blogs || [], {
    groupKey: 'category',
    linkKey: 'url',
    extraMeta: (it) => (Array.isArray(it.tags) ? it.tags.join(', ') : ''),
  });
  const blogsBody = fill(listTpl, {
    pageTitle: 'Blogs',
    sections: blogsSections,
    assetBase: '../',
  });
  const blogsHtml = fill(baseTpl, {
    ...common,
    title: escapeHtml(`${data.siteName || 'Link Hub'} — Blogs`),
    description: escapeHtml('Blog links.'),
    assetBase: '../',
    body: blogsBody,
  });
  writeFile(path.join(outDocsDir, 'blogs', 'index.html'), blogsHtml);

  const counts = {
    products: (data.products || []).length,
    collections: (data.collections || []).length,
    blogs: (data.blogs || []).length,
  };

  console.log(`[link-hub] Built docs/ at ${new Date().toISOString()}`);
  console.log(`[link-hub] Items: products=${counts.products}, collections=${counts.collections}, blogs=${counts.blogs}`);
}

main();
