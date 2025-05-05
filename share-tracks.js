// share-tracks.js
// Add sharing functionality to the Georgian Polyphony Player

(function() {
    // Create share button
    function createShareButton() {
        // Create the button
        const shareBtn = document.createElement('button');
        shareBtn.id = 'share-btn';
        shareBtn.className = 'share-btn';
        shareBtn.title = 'Copy link to this track';
        shareBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill="currentColor"/>
            </svg>
        `;
        
        // Add the button to controls
        const controlsContainer = document.querySelector('.controls');
        // Insert between mute button and volume slider
        const muteBtn = document.getElementById('mute-btn');
        controlsContainer.insertBefore(shareBtn, muteBtn.nextSibling);
        
        // Add click event listener
        shareBtn.addEventListener('click', copyShareLink);
    }
    
    // Copy link to clipboard
    function copyShareLink() {
        if (!window.tracks || !window.currentTrackIndex !== undefined) {
            console.error('Tracks not initialized or no current track');
            return;
        }
        
        const currentTrack = window.tracks[window.currentTrackIndex];
        
        if (!currentTrack || !currentTrack.id) {
            if (typeof window.showErrorMessage === 'function') {
                window.showErrorMessage('Cannot share this track.');
            } else {
                alert('Cannot share this track.');
            }
            return;
        }
        
        // Create the shareable URL with the track ID
        const url = new URL(window.location.href);
        // Clear any existing parameters
        url.search = '';
        // Add the track ID parameter
        url.searchParams.set('track', currentTrack.id);
        
        // Copy to clipboard
        navigator.clipboard.writeText(url.toString())
            .then(() => {
                // Show success message
                showShareSuccess();
            })
            .catch(error => {
                console.error('Error copying to clipboard:', error);
                
                if (typeof window.showErrorMessage === 'function') {
                    window.showErrorMessage('Could not copy link. Try manually copying from the address bar.');
                } else {
                    alert('Could not copy link. Try manually copying from the address bar.');
                }
                
                // Update the URL anyway so they can copy manually
                updateUrlWithTrackId(currentTrack.id);
            });
    }
    
    // Update URL with track ID
    function updateUrlWithTrackId(trackId) {
        const url = new URL(window.location.href);
        url.searchParams.set('track', trackId);
        
        // Replace current URL without reloading the page
        window.history.replaceState({}, '', url.toString());
    }
    
    // Show success message
    function showShareSuccess() {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.share-success');
        existingMessages.forEach(el => el.remove());
        
        // Create success message
        const successElement = document.createElement('div');
        successElement.className = 'share-success';
        successElement.textContent = 'Link copied to clipboard!';
        
        // Add to player container
        const playerContainer = document.querySelector('.player-container');
        playerContainer.appendChild(successElement);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.remove();
            }
        }, 3000);
    }
    
    // Check for track ID in URL when page loads
    function checkUrlForTrackId() {
        const urlParams = new URLSearchParams(window.location.search);
        const trackId = urlParams.get('track');
        
        if (!trackId) return;
        
        // Wait for tracks to load
        const checkInterval = setInterval(() => {
            if (window.trackLoader && window.trackLoader.isInitialized && window.tracks && window.tracks.length > 0) {
                clearInterval(checkInterval);
                
                // Find the track
                const trackIndex = window.trackLoader.getTrackIndex(trackId);
                
                if (trackIndex !== -1) {
                    // Load the specific track
                    window.loadTrack(trackIndex);
                    window.isPlaying = true;
                    window.updatePlayPauseIcon();
                } else {
                    console.warn(`Track with ID ${trackId} not found.`);
                    if (typeof window.showErrorMessage === 'function') {
                        window.showErrorMessage('The shared track could not be found.');
                    }
                }
            }
        }, 500);
        
        // Set a timeout to stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }
    
    // Patch loadTrack function to update URL
    const originalLoadTrack = window.loadTrack;
    if (originalLoadTrack) {
        window.loadTrack = function(index) {
            // Call the original function
            const result = originalLoadTrack.call(this, index);
            
            // Update URL with track ID
            if (window.tracks && window.tracks[index] && window.tracks[index].id) {
                updateUrlWithTrackId(window.tracks[index].id);
            }
            
            return result;
        };
    }
    
    // Add share button once DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createShareButton();
            checkUrlForTrackId();
        });
    } else {
        createShareButton();
        checkUrlForTrackId();
    }
})();
