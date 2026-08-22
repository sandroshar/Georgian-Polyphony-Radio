// generate-share-pages.js
// Generates one real, standalone page per track at t/<track-id>.html. Each
// page is the SAME app (same HTML/CSS/JS) as index.html, just told to start
// on that one track, with that track's title/description/structured data
// baked into the <head> before any JS runs. This makes each song page:
//   - a good social link preview (crawlers that don't run JS see the right
//     title/description/image), and
//   - actually indexable by Google as its own search result (unlike a page
//     that instantly redirects elsewhere, which Google just folds into the
//     destination's listing).
// Also generates sitemap.xml + robots.txt so Google can discover all of them.
//
// Usage:
//   node generate-share-pages.js
//   BASE_URL="https://example.com/" node generate-share-pages.js
//
// Re-run this after editing recording_database.txt (adding/changing tracks)
// or after changing index.html's design, then commit/deploy the output.
//
// Output:
//   ./t/<track-id>.html
//   ./sitemap.xml
//   ./robots.txt

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'recording_database.txt');
const INDEX_PATH = path.join(__dirname, 'index.html');
const OUT_DIR = path.join(__dirname, 't');
const SITEMAP_PATH = path.join(__dirname, 'sitemap.xml');
const ROBOTS_PATH = path.join(__dirname, 'robots.txt');

// Defaults to the real production domain; override with the env var if
// generating pages for a staging URL instead.
const BASE_URL = (process.env.BASE_URL || 'https://georgianpolyphonyplayer.com/').trim();

const SITE_NAME = 'Georgian Polyphony Player';
const DEFAULT_DESC = 'Legendary historical recordings of Georgian traditional music';

// Assets index.html references with a plain relative path. These need to
// become root-relative so they still resolve correctly one directory down,
// from t/<id>.html.
const ROOT_RELATIVE_ASSETS = [
  'styles.css', 'track-loader.js', 'debug-helper.js', 'script.js',
  'filter-tracks.js', 'share-tracks.js', 'slider-color-fix.js',
  'album-art.jpg'
];

// Well-known, recurring Georgian folk-song/genre terms whose standard
// Georgian spelling I'm confident about. Intentionally short and title-only
// (never performer names, and never guessed for anything outside this
// list) - purely machine-readable (JSON-LD), never rendered on the page.
// Add more here if you can verify the correct spelling.
const GEORGIAN_TERMS = [
  [/chven\s+mshvidoba/i, 'ჩვენ მშვიდობა'],
  [/mravalzhamier/i, 'მრავალჟამიერ'],
  [/mravaljamier/i, 'მრავალჟამიერ'],
  [/vakhtanguri/i, 'ვახტანგური'],
  [/naduri/i, 'ნადური'],
  [/orovela/i, 'ოროველა'],
  [/chakrulo/i, 'ჩაკრულო'],
  [/alaverdi/i, 'ალავერდი'],
  [/gandagana?/i, 'განდაგანა'],
];

function sanitizeFilename(trackId) {
  return trackId.replace(/[^A-Za-z0-9_\-]/g, '_');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMarkdownTables(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const tracks = [];
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('| Track ID |')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (line.startsWith('|----')) continue;
    if (!line.startsWith('|')) continue;

    const parts = line.split('|').slice(1, -1).map(p => p.trim());
    if (parts.length < 7) continue;
    if (parts[0] === 'Track ID') continue;

    const [id, collection, title, _filename, _filepath, performers, year, region = ''] = parts;
    tracks.push({ id, collection, title, performers, year, region });
  }

  return tracks;
}

function joinNonEmpty(parts, sep) {
  return parts.filter(Boolean).join(sep);
}

function absoluteUrl(url) {
  return new URL(url, BASE_URL).toString();
}

function georgianAlternateNames(title) {
  const found = new Set();
  for (const [pattern, georgian] of GEORGIAN_TERMS) {
    if (pattern.test(title)) found.add(georgian);
  }
  return [...found];
}

// Replace a <meta property="X" content="..."> or <meta name="X" content="...">
// tag's content value. Warns (doesn't throw) if the tag isn't found, so a
// template edit that removes a tag degrades gracefully instead of crashing
// the whole generation run.
function replaceMetaContent(html, attr, value, newContent) {
  const re = new RegExp(`(<meta\\s+${attr}="${value}"\\s+content=")[^"]*("\\s*/?>)`, 'i');
  if (!re.test(html)) {
    console.warn(`Warning: could not find <meta ${attr}="${value}"> in index.html template`);
    return html;
  }
  return html.replace(re, `$1${escapeHtml(newContent)}$2`);
}

function buildPage(track, indexTemplate) {
  const pageFile = sanitizeFilename(track.id) + '.html';
  const sharePath = 't/' + pageFile;
  const ogUrl = absoluteUrl(sharePath);
  const ogImage = absoluteUrl('og-image.png');

  const fullTitle = `${track.title} — ${track.performers}`;
  const desc = joinNonEmpty(
    [
      track.collection || '',
      track.region || '',
      track.year && track.year.toLowerCase() !== 'unknown' ? track.year : ''
    ],
    ' · '
  ) || DEFAULT_DESC;

  let html = indexTemplate;

  // Title + meta tags
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
  html = replaceMetaContent(html, 'name', 'description', desc);
  html = replaceMetaContent(html, 'property', 'og:type', 'music.song');
  html = replaceMetaContent(html, 'property', 'og:title', fullTitle);
  html = replaceMetaContent(html, 'property', 'og:description', desc);
  html = replaceMetaContent(html, 'property', 'og:image', ogImage);
  html = replaceMetaContent(html, 'name', 'twitter:title', fullTitle);
  html = replaceMetaContent(html, 'name', 'twitter:description', desc);
  html = replaceMetaContent(html, 'name', 'twitter:image', ogImage);

  // og:url + canonical + structured data don't exist in index.html (it's
  // the generic homepage), so insert them fresh.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title,
    byArtist: { '@type': 'MusicGroup', name: track.performers },
    url: ogUrl,
  };
  if (track.collection) jsonLd.inAlbum = { '@type': 'MusicAlbum', name: track.collection };
  if (track.region) jsonLd.contentLocation = { '@type': 'Place', name: track.region };
  if (track.year && track.year.toLowerCase() !== 'unknown') jsonLd.dateCreated = track.year;
  const altNames = georgianAlternateNames(track.title);
  if (altNames.length) jsonLd.alternateName = altNames;

  const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`;
  const headInsertions = [
    `<meta property="og:url" content="${escapeHtml(ogUrl)}">`,
    `<link rel="canonical" href="${escapeHtml(ogUrl)}">`,
    jsonLdScript,
    '</head>'
  ].join('\n    ');
  html = html.replace('</head>', headInsertions);

  // Rewrite same-directory asset references to root-relative so they still
  // resolve correctly from one directory down (t/<id>.html).
  for (const asset of ROOT_RELATIVE_ASSETS) {
    html = html.split(`="${asset}"`).join(`="/${asset}"`);
  }

  // Pre-fill the player's placeholder content with this track's real
  // values (matches exactly what loadTrack() sets in script.js), so the
  // page has real content even before JS finishes fetching the database.
  html = html.replace(
    '<h2 id="track-title">Loading...</h2>',
    `<h2 id="track-title">${escapeHtml(track.title)}</h2>`
  );
  html = html.replace(
    '<p id="track-ensemble">Please wait</p>',
    `<p id="track-ensemble">${escapeHtml(track.performers)}</p>`
  );
  html = html.replace(
    '<span id="track-year"></span>',
    `<span id="track-year">${escapeHtml(track.year || '')}</span>`
  );
  html = html.replace(
    '<span id="track-region"></span>',
    `<span id="track-region">${escapeHtml(track.region || 'Georgia')}</span>`
  );
  html = html.replace(
    '<p id="current-track-description" class="track-description"></p>',
    track.collection
      ? `<p id="current-track-description" class="track-description">From collection: ${escapeHtml(track.collection)}</p>`
      : '<p id="current-track-description" class="track-description" style="display: none;"></p>'
  );

  // Tell the app which track to boot on (root-relative path already applied above).
  html = html.replace(
    '<script src="/track-loader.js"></script>',
    `<script>window.STARTUP_TRACK_ID = ${JSON.stringify(track.id)};</script>\n    <script src="/track-loader.js"></script>`
  );

  return { pageFile, html, ogUrl };
}

function buildSitemap(urls) {
  const body = urls.map(u => `  <url>\n    <loc>${escapeHtml(u)}</loc>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('sitemap.xml')}\n`;
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Missing recording_database.txt at:', DB_PATH);
    process.exit(1);
  }
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('Missing index.html at:', INDEX_PATH);
    process.exit(1);
  }

  const dbText = fs.readFileSync(DB_PATH, 'utf8');
  const tracks = parseMarkdownTables(dbText);

  if (!tracks.length) {
    console.error('No tracks found. Is recording_database.txt in the expected markdown-table format?');
    process.exit(1);
  }

  const indexTemplate = fs.readFileSync(INDEX_PATH, 'utf8');

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // De-duplicate by track ID
  const seen = new Set();
  let written = 0;
  const sitemapUrls = [absoluteUrl('')];

  for (const track of tracks) {
    if (!track.id || seen.has(track.id)) continue;
    seen.add(track.id);

    const page = buildPage(track, indexTemplate);
    fs.writeFileSync(path.join(OUT_DIR, page.pageFile), page.html, 'utf8');
    sitemapUrls.push(page.ogUrl);
    written++;
  }

  fs.writeFileSync(SITEMAP_PATH, buildSitemap(sitemapUrls), 'utf8');
  fs.writeFileSync(ROBOTS_PATH, buildRobotsTxt(), 'utf8');

  console.log(`Generated ${written} song pages in ${OUT_DIR}`);
  console.log(`Generated sitemap.xml (${sitemapUrls.length} URLs) and robots.txt`);
}

main();
