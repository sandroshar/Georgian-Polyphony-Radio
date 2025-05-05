// share-tracks.js - Fixed version
// Add sharing functionality to the Georgian Polyphony Player

(function() {
    // Wait for window globals to be available
    let checkForAppReady = setInterval(() => {
        // Check if key variables and functions exist
        if (typeof tracks !== 'undefined' && 
            typeof currentTrackIndex !== 'undefined' && 
            typeof loadTrack === 'function' &&
            typeof trackLoader !== 'undefined') {
            
            clearInterval(checkForAppReady);
            console.log("App is ready, initializing share functionality");
            
            // Initialize share functionality
            initShareFunctionality();
        }
    }, 500);
    
    // Set a timeout to stop checking after 10 seconds to prevent infinite loop
    setTimeout(() => {
        clearInterval(checkForAppReady);
        console.log("Timeout waiting for app to be ready. Share functionality may not work correctly.");
    }, 10000);
    
    function initShareFunctionality() {
        // Create share button
        createShareButton();
        
        // Check URL for track ID
        checkUrlForTrackId();
        
        // Patch loadTrack to update URL
        patchLoadTrack();
    }
    
    // Create share button
    function createShareButton() {
        // Check if button already exists
        if (document.getElementById('share-btn')) return;
        
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
        if (!controlsContainer) {
            console.error("Controls container not found");
            return;
        }
        
        // Insert between mute button and volume slider
        const muteBtn = document.getElementById('mute-btn');
        if (!muteBtn) {
            console.error("Mute button not found");
            controlsContainer.appendChild(shareBtn); // Append at the end if mute button not found
        } else {
            controlsContainer.insertBefore(shareBtn, muteBtn.nextSibling);
        }
        
        // Add click event listener
        shareBtn.addEventListener('click', copyShareLink);
        console.log("Share button created and added to the player");
    }
    
    // Copy link to clipboard
    function copyShareLink(event) {
        // Prevent default button behavior
        if (event) event.preventDefault();
        
        console.log("Share button clicked");
        
        // Check if tracks and currentTrackIndex are defined
        if (typeof tracks === 'undefined' || currentTrackIndex === undefined) {
            console.error('Tracks not initialized or no current track index');
            return;
        }
        
        const currentTrack = tracks[currentTrackIndex];
        
        if (!currentTrack || !currentTrack.id) {
            console.error('No valid track to share');
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Cannot share this track.');
            } else {
                alert('Cannot share this track.');
            }
            return;
        }
        
        console.log("Sharing track:", currentTrack.title, "ID:", currentTrack.id);
        
        // Create the shareable URL with the track ID
        const url = new URL(window.location.href);
        // Clear any existing parameters
        url.search = '';
        // Add the track ID parameter
        url.searchParams.set('track', currentTrack.id);
        
        const shareUrl = url.toString();
        console.log("Share URL:", shareUrl);
        
        // Try to use clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    console.log("URL copied to clipboard");
                    showShareSuccess();
                })
                .catch(error => {
                    console.error('Error copying to clipboard:', error);
                    
                    // Fallback for clipboard API failure
                    fallbackCopyToClipboard(shareUrl);
                });
        } else {
            // Browser doesn't support Clipboard API
            console.log("Clipboard API not available, trying fallback");
            fallbackCopyToClipboard(shareUrl);
        }
        
        // Update URL regardless of clipboard success
        updateUrlWithTrackId(currentTrack.id);
    }
    
    // Fallback copy method
    function fallbackCopyToClipboard(text) {
        try {
            // Create temporary textarea
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            // Execute copy command
            const successful = document.execCommand('copy');
            
            // Remove temporary element
            document.body.removeChild(textArea);
            
            if (successful) {
                console.log("Fallback copy successful");
                showShareSuccess();
            } else {
                console.error("Fallback copy failed");
                if (typeof showErrorMessage === 'function') {
                    showErrorMessage('Could not copy link. Try manually copying from the address bar.');
                } else {
                    alert('Could not copy link. Try manually copying from the address bar.');
                }
            }
        } catch (err) {
            console.error('Fallback copy error:', err);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Could not copy link. Try manually copying from the address bar.');
            } else {
                alert('Could not copy link. Try manually copying from the address bar.');
            }
        }
    }
    
    // Update URL with track ID
    function updateUrlWithTrackId(trackId) {
        const url = new URL(window.location.href);
        url.searchParams.set('track', trackId);
        
        // Replace current URL without reloading the page
        try {
            window.history.replaceState({}, '', url.toString());
            console.log("URL updated with track ID:", trackId);
        } catch (e) {
            console.error("Error updating URL:", e);
        }
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
        if (playerContainer) {
            playerContainer.appendChild(successElement);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (successElement.parentNode) {
                    successElement.remove();
                }
            }, 3000);
        }
    }
    
    // Check for track ID in URL when page loads
    function checkUrlForTrackId() {
        const urlParams = new URLSearchParams(window.location.search);
        const trackId = urlParams.get('track');
        
        if (!trackId) {
            console.log("No track ID in URL");
            return;
        }
        
        console.log("Found track ID in URL:", trackId);
        
        // Make sure trackLoader is initialized
        if (!trackLoader || !trackLoader.isInitialized) {
            console.log("Waiting for track loader to initialize...");
            
            // Wait for tracks to load
            const checkInterval = setInterval(() => {
                if (trackLoader && trackLoader.isInitialized && 
                    typeof tracks !== 'undefined' && tracks.length > 0) {
                    clearInterval(checkInterval);
                    loadSharedTrack(trackId);
                }
            }, 500);
            
            // Set a timeout to stop checking after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
            }, 10000);
        } else {
            // Track loader is ready, load the track
            loadSharedTrack(trackId);
        }
    }
    
    // Load a shared track by ID
    function loadSharedTrack(trackId) {
        console.log("Attempting to load shared track:", trackId);
        
        // Make sure we have the getTrackIndex method
        if (!trackLoader.getTrackIndex) {
            console.error("trackLoader.getTrackIndex method not found!");
            // Try to add the method if not present
            trackLoader.getTrackIndex = function(trackId) {
                if (!this.isInitialized) {
                    console.error('Track loader not initialized. Call initialize() first.');
                    return -1;
                }
                
                const track = this.tracks.find(track => track.id === trackId);
                if (!track) return -1;
                
                return this.tracks.indexOf(track);
            };
        }
        
        // Find the track index
        const trackIndex = trackLoader.getTrackIndex(trackId);
        console.log("Track index:", trackIndex);
        
        if (trackIndex !== -1) {
            // Load the specific track
            if (typeof loadTrack === 'function') {
                loadTrack(trackIndex);
                isPlaying = true;
                if (typeof updatePlayPauseIcon === 'function') {
                    updatePlayPauseIcon();
                }
                console.log("Shared track loaded successfully");
            } else {
                console.error("loadTrack function not found");
            }
        } else {
            console.warn(`Track with ID ${trackId} not found.`);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('The shared track could not be found.');
            } else {
                alert('The shared track could not be found.');
            }
        }
    }
    
    // Patch loadTrack function to update URL
    function patchLoadTrack() {
        if (typeof loadTrack !== 'function') {
            console.error("loadTrack function not found, cannot patch");
            return;
        }
        
        console.log("Patching loadTrack function");
        
        // Store original function
        const originalLoadTrack = loadTrack;
        
        // Replace with patched version
        loadTrack = function(index) {
            // Call the original function
            const result = originalLoadTrack.call(this, index);
            
            // Update URL with track ID after a short delay
            // (to ensure track loading has started)
            setTimeout(() => {
                if (typeof tracks !== 'undefined' && tracks[index] && tracks[index].id) {
                    updateUrlWithTrackId(tracks[index].id);
                }
            }, 100);
            
            return result;
        };
    }
    
    // Add CSS styles if not present
    function addStyles() {
        // Check if styles already exist
        if (document.querySelector('style[data-share-styles="true"]')) {
            return;
        }
        
        const style = document.createElement('style');
        style.setAttribute('data-share-styles', 'true');
        style.textContent = `
            /* Share button styling */
            .share-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .share-btn:hover:not(:disabled) {
                background-color: var(--button-hover, #333333);
                color: var(--accent-color, #e6c200);
            }
            
            .share-btn:active {
                transform: scale(0.95);
            }
            
            /* Success message */
            .share-success {
                background-color: rgba(46, 204, 113, 0.2);
                color: #2ecc71;
                padding: 10px;
                border-radius: 5px;
                margin-top: 15px;
                font-size: 0.9rem;
                position: absolute;
                bottom: 20px;
                left: 30px;
                right: 30px;
                text-align: center;
                animation: fadeInOut 3s forwards;
                z-index: 100;
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(10px); }
                10% { opacity: 1; transform: translateY(0); }
                80% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
            
            /* Responsive adjustments */
            @media (max-width: 600px) {
                .share-btn {
                    width: 35px;
                    height: 35px;
                }
                
                .share-btn svg {
                    width: 18px;
                    height: 18px;
                }
            }
        `;
        document.head.appendChild(style);
        console.log("Share styles added");
    }
    
    // Add styles
    addStyles();
})();
