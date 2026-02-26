// generate-share-pages.js
// Generates one static HTML page per track with Open Graph + Twitter meta tags.
// These pages are used for link previews (WhatsApp/iMessage/Slack/etc.) because
// most crawlers do NOT execute your client-side JS.
//
// Usage:
//   node generate-share-pages.js
//   BASE_URL="https://example.com/" node generate-share-pages.js
//
// Output:
//   ./t/<track-id>.html   (small redirect pages)

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'recording_database.txt');
const OUT_DIR = path.join(__dirname, 't');

// IMPORTANT: Set this to your real deployed URL (must end with a slash).
// Examples:
//   https://yourdomain.com/
//   https://username.github.io/repo/
const BASE_URL = (process.env.BASE_URL || '').trim();

const SITE_NAME = 'Georgian Polyphony Player';
const DEFAULT_DESC = 'Legendary historical recordings of Georgian traditional music';

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

function makeAbsoluteOrRelative(url) {
  // If BASE_URL is set, make absolute URLs (best for social previews).
  if (BASE_URL) {
    return new URL(url, BASE_URL).toString();
  }
  // Otherwise keep relative (still works on many platforms).
  return url;
}

function buildPage(track) {
  const pageFile = sanitizeFilename(track.id) + '.html';
  const sharePath = 't/' + pageFile;
  const appPath = '?track=' + encodeURIComponent(track.id);

  const ogUrl = makeAbsoluteOrRelative(sharePath);
  const ogImage = makeAbsoluteOrRelative('album-art.jpg');

  const fullTitle = `${track.title} — ${track.performers}`;

  const desc = joinNonEmpty(
    [
      track.collection || '',
      track.region || '',
      track.year && track.year.toLowerCase() !== 'unknown' ? track.year : ''
    ],
    ' · '
  ) || DEFAULT_DESC;

  // Redirect target:
  // - If BASE_URL is set, redirect to the absolute app URL.
  // - Otherwise, redirect relative up one level (../?track=...)
  const redirectTarget = BASE_URL
    ? new URL(appPath, BASE_URL).toString()
    : '../' + appPath;

  return {
    pageFile,
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(fullTitle)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="music.song" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  <link rel="canonical" href="${escapeHtml(ogUrl)}" />

  <!-- Instant redirect for humans -->
  <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectTarget)}" />
  <script>window.location.replace(${JSON.stringify(redirectTarget)});</script>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(redirectTarget)}">${escapeHtml(SITE_NAME)}</a>…</p>
</body>
</html>
`
  };
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Missing recording_database.txt at:', DB_PATH);
    process.exit(1);
  }

  const dbText = fs.readFileSync(DB_PATH, 'utf8');
  const tracks = parseMarkdownTables(dbText);

  if (!tracks.length) {
    console.error('No tracks found. Is recording_database.txt in the expected markdown-table format?');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // De-duplicate by track ID
  const seen = new Set();
  let written = 0;

  for (const track of tracks) {
    if (!track.id || seen.has(track.id)) continue;
    seen.add(track.id);

    const page = buildPage(track);
    fs.writeFileSync(path.join(OUT_DIR, page.pageFile), page.html, 'utf8');
    written++;
  }

  console.log(`Generated ${written} share pages in ${OUT_DIR}`);
  if (!BASE_URL) {
    console.log('Tip: set BASE_URL to get absolute og:url/og:image values for best compatibility.');
  }
}

main();
