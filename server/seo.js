const db = require('./db');
const crypto = require('crypto');

/**
 * Dynamic SEO Engine for Mofidul Portfolio & CMS
 * Handles dynamic XML sitemaps, RSS 2.0 feed, JSON feed, and robots.txt.
 */

let cachedSitemap = null;
let sitemapEtag = null;
let cachedRss = null;
let rssEtag = null;

function invalidateSeoCache() {
  cachedSitemap = null;
  sitemapEtag = null;
  cachedRss = null;
  rssEtag = null;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

function formatRfc822Date(dateStr) {
  if (!dateStr) return new Date().toUTCString();
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toUTCString();
    return d.toUTCString();
  } catch (e) {
    return new Date().toUTCString();
  }
}

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'mofidul.com';
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  return `${proto}://${host}`;
}

/**
 * Generates an up-to-date XML Sitemap containing the homepage, sections,
 * and all dynamically published project case studies from SQLite.
 */
function getSitemapXml(baseUrl = 'https://mofidul.com') {
  if (cachedSitemap) {
    return { xml: cachedSitemap, etag: sitemapEtag };
  }

  const settings = db.prepare('SELECT updated_at FROM site_settings WHERE id = 1').get() || {};
  const siteMod = formatDate(settings.updated_at);

  const projects = db.prepare(`
    SELECT id, slug, updated_at, created_at 
    FROM projects 
    WHERE is_active = 1 AND (status = 'published' OR status IS NULL OR status = '')
    ORDER BY sort_order ASC, id ASC
  `).all();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // Primary Landing Page
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${siteMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // Core Section Permalinks
  const sections = [
    { path: '/#work', prio: '0.9', freq: 'daily' },
    { path: '/#services', prio: '0.8', freq: 'weekly' },
    { path: '/#about', prio: '0.8', freq: 'monthly' },
    { path: '/#contact', prio: '0.9', freq: 'monthly' }
  ];

  for (const s of sections) {
    xml += `  <url>\n    <loc>${baseUrl}${s.path}</loc>\n    <lastmod>${siteMod}</lastmod>\n    <changefreq>${s.freq}</changefreq>\n    <priority>${s.prio}</priority>\n  </url>\n`;
  }

  // Dynamic Case Studies
  for (const p of projects) {
    const slug = p.slug || p.id;
    const mod = formatDate(p.updated_at || p.created_at);
    xml += `  <url>\n    <loc>${baseUrl}/work/${escapeXml(slug)}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  }

  xml += '</urlset>\n';

  cachedSitemap = xml;
  sitemapEtag = `"${crypto.createHash('md5').update(xml).digest('hex')}"`;

  return { xml: cachedSitemap, etag: sitemapEtag };
}

/**
 * Generates standard RSS 2.0 feed for published works
 */
function getRssXml(baseUrl = 'https://mofidul.com') {
  if (cachedRss) {
    return { xml: cachedRss, etag: rssEtag };
  }

  const projects = db.prepare(`
    SELECT id, title, slug, short_desc, cover_image, category, client, year, updated_at, created_at 
    FROM projects 
    WHERE is_active = 1 AND (status = 'published' OR status IS NULL OR status = '')
    ORDER BY sort_order ASC, id ASC
  `).all();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n';
  xml += '  <channel>\n';
  xml += '    <title>Mofidul — Selected Works &amp; Case Studies</title>\n';
  xml += `    <link>${baseUrl}/</link>\n`;
  xml += '    <description>Creative Direction, digital craft, and AI-driven design systems by Mofidul.</description>\n';
  xml += '    <language>en-us</language>\n';
  xml += `    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />\n`;
  xml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;

  for (const p of projects) {
    const slug = p.slug || p.id;
    const itemUrl = `${baseUrl}/work/${escapeXml(slug)}`;
    const pubDate = formatRfc822Date(p.created_at || p.updated_at);
    const coverUrl = p.cover_image ? (p.cover_image.startsWith('http') ? p.cover_image : `${baseUrl}${p.cover_image}`) : '';

    xml += '    <item>\n';
    xml += `      <title>${escapeXml(p.title)}</title>\n`;
    xml += `      <link>${itemUrl}</link>\n`;
    xml += `      <guid isPermaLink="true">${itemUrl}</guid>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    xml += `      <description>${escapeXml(p.short_desc || p.title)}</description>\n`;
    xml += `      <category>${escapeXml(p.category || 'Creative Direction')}</category>\n`;
    if (coverUrl) {
      xml += `      <media:content url="${escapeXml(coverUrl)}" medium="image" />\n`;
    }
    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>\n';

  cachedRss = xml;
  rssEtag = `"${crypto.createHash('md5').update(xml).digest('hex')}"`;

  return { xml: cachedRss, etag: rssEtag };
}

/**
 * Generates JSON Feed 1.1 for modern feed readers
 */
function getJsonFeed(baseUrl = 'https://mofidul.com') {
  const projects = db.prepare(`
    SELECT id, title, slug, short_desc, full_desc, cover_image, category, client, year, updated_at, created_at 
    FROM projects 
    WHERE is_active = 1 AND (status = 'published' OR status IS NULL OR status = '')
    ORDER BY sort_order ASC, id ASC
  `).all();

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Mofidul — Selected Works',
    home_page_url: `${baseUrl}/`,
    feed_url: `${baseUrl}/feed.json`,
    description: 'Selected Works, brand identities, and digital experiences by Mofidul.',
    items: projects.map(p => {
      const slug = p.slug || p.id;
      const url = `${baseUrl}/work/${slug}`;
      const coverUrl = p.cover_image ? (p.cover_image.startsWith('http') ? p.cover_image : `${baseUrl}${p.cover_image}`) : undefined;
      return {
        id: url,
        url: url,
        title: p.title,
        content_text: p.full_desc || p.short_desc || p.title,
        summary: p.short_desc || p.title,
        image: coverUrl,
        date_published: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
        date_modified: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
        tags: [p.category].filter(Boolean)
      };
    })
  };
}

/**
 * Generates dynamic robots.txt pointing to the correct sitemap
 */
function getRobotsTxt(baseUrl = 'https://mofidul.com') {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
}

module.exports = {
  getSitemapXml,
  getRssXml,
  getJsonFeed,
  getRobotsTxt,
  invalidateSeoCache,
  getBaseUrl
};
