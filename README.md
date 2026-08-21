# Georgian-Polyphony-Radio
An interactive web player dedicated to the rich heritage of Georgian traditional polyphonic music. This application provides access to rare and historical recordings from various regions of Georgia.

Technical Details
This player is built using:

HTML5 Audio API
Vanilla JavaScript (ES6+)
CSS3 with responsive design
AWS CloudFront for audio delivery

Sharing / Link Previews
Each track has a shareable link that previews with its title, performer, and a
thumbnail (via /t/<track-id>.html static pages). After editing
recording_database.txt (adding or changing tracks), regenerate these pages and
deploy the updated t/ folder along with the rest of the site:

    node generate-share-pages.js

Legal Notice
These recordings are provided for educational and cultural preservation purposes. The player does not claim ownership of the recordings and acknowledges the original performers and collectors. If you are a rights holder and have concerns about any content, please contact me.

Email: sandroshar14@gmail.com
