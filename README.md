# Georgian-Polyphony-Radio
An interactive web player dedicated to the rich heritage of Georgian traditional polyphonic music. This application provides access to rare and historical recordings from various regions of Georgia.

Technical Details
This player is built using:

HTML5 Audio API
Vanilla JavaScript (ES6+)
CSS3 with responsive design
AWS CloudFront for audio delivery

Sharing / Link Previews / SEO
Each track has its own real, standalone page at /t/<track-id>.html - the same
app as index.html, just started on that one track, with that track's
title/performer/description baked into the page so it previews correctly
when shared AND is indexable by Google as its own search result (unlike a
page that just redirects elsewhere). After editing recording_database.txt
(adding or changing tracks) or changing index.html's design, regenerate
these pages plus sitemap.xml/robots.txt, and deploy the output along with
the rest of the site:

    node generate-share-pages.js

To extend the short list of Georgian-script song-title spellings used in
each page's structured data (JSON-LD `alternateName`, for Georgian-script
search matching - never shown on the page itself), edit GEORGIAN_TERMS in
generate-share-pages.js. Keep it to terms you're confident are spelled
correctly; it intentionally excludes performer names.

Legal Notice
These recordings are provided for educational and cultural preservation purposes. The player does not claim ownership of the recordings and acknowledges the original performers and collectors. If you are a rights holder and have concerns about any content, please contact me.

Email: sandroshar14@gmail.com
