// album-art.js - Handles album artwork generation and management for Georgian Polyphony Player

(function() {
    // Default album artwork properties
    const ARTWORK_SIZE = 512;
    const BACKGROUND_COLOR = '#000000';
    const TEXT_COLOR = '#e6c200';
    const FONT = 'bold 48px Arial';
    
    // Store the generated artwork URL
    let artworkUrl = null;
    
    // Function to generate album artwork on demand
    function generateAlbumArt() {
        // Create a canvas to generate the album art
        const canvas = document.createElement('canvas');
        canvas.width = ARTWORK_SIZE;
        canvas.height = ARTWORK_SIZE;
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Split text into lines
        const text = 'Georgian Polyphony Player';
        const words = text.split(' ');
        const lineHeight = 60;
        
        ctx.fillText(words[0], canvas.width/2, canvas.height/2 - lineHeight);
        ctx.fillText(words[1], canvas.width/2, canvas.height/2);
        ctx.fillText(words[2], canvas.width/2, canvas.height/2 + lineHeight);
        
        // Convert to data URL
        return canvas.toDataURL('image/jpeg');
    }
    
    // Function to create and store the album artwork as a blob
    function createAndStoreBlobArtwork() {
        // First generate the artwork
        const dataUrl = generateAlbumArt();
        
        // Convert to blob
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                // Create object URL
                artworkUrl = URL.createObjectURL(blob);
                
                // Update any existing album art elements with this URL
                updateArtworkElements();
                
                // Make the URL available globally
                window.albumArtworkUrl = artworkUrl;
                
                console.log('Album artwork created and stored successfully');
            })
            .catch(error => {
                console.error('Error creating album artwork blob:', error);
            });
    }
    
    // Function to update all album art elements in the document
    function updateArtworkElements() {
        if (!artworkUrl) return;
        
        // Update album art image if it exists
        const albumArtImg = document.getElementById('album-art');
        if (albumArtImg) {
            albumArtImg.src = artworkUrl;
        }
        
        // Create album art element if it doesn't exist
        if (!albumArtImg) {
            const img = document.createElement('img');
            img.id = 'album-art';
            img.src = artworkUrl;
            img.alt = 'Georgian Polyphony Player';
            img.style.display = 'none'; // Hidden from view
            document.body.appendChild(img);
        }
    }
    
    // Function to get artwork sizes for Media Session API
    function getArtworkSizes() {
        return [96, 128, 192, 256, 384, 512].map(size => {
            return {
                src: artworkUrl || generateAlbumArt(), // Fallback to generating new art if needed
                sizes: `${size}x${size}`,
                type: 'image/jpeg'
            };
        });
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        createAndStoreBlobArtwork();
    });
    
    // Export public API
    window.albumArt = {
        generate: generateAlbumArt,
        getUrl: () => artworkUrl,
        getArtworkSizes: getArtworkSizes,
        refresh: createAndStoreBlobArtwork
    };
})();
