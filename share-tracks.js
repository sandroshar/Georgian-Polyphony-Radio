// share-tracks.js - Fixed version with proper share button size
// Add sharing functionality to the Georgian Polyphony Player

(function() {
    // Global flag to track if we're handling a shared track URL
    let handlingSharedTrack = false;
    
    // Flag to prevent duplicate loading
    let isInitialized = false;
    
    // Wait for window globals to be available
    let checkForAppReady = setInterval(() => {
        // Check if key variables and functions exist
        if (typeof tracks !== 'undefined' && 
            typeof currentTrackIndex !== 'undefined' && 
            typeof loadTrack === 'function' &&
            typeof trackLoader !== 'undefined') {
            
            clearInterval(checkForAppReady);
            console.log("App is ready, initializing share functionality");
            
            // Initialize share functionality if not already initialized
            if (!isInitialized) {
                isInitialized = true;
                initShareFunctionality();
            }
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
        
        // Check URL for track ID - this needs to happen BEFORE the main script loads tracks
        const sharedTrackId = checkUrlForTrackId();
        if (sharedTrackId) {
            // Set the flag to indicate we're handling a shared track
            handlingSharedTrack = true;
        }
        
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
        shareBtn.className = 'nav-btn share-btn'; // Update to use nav-btn class instead of custom share-btn
        shareBtn.title = 'Copy link to this track';
        shareBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
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
        
        // Insert as the first button (leftmost position)
        const firstButton = controlsContainer.firstChild;
        controlsContainer.insertBefore(shareBtn, firstButton);
        console.log("Share button created and added to the left side of the player controls");
        
        // Add click event listener
        shareBtn.addEventListener('click', copyShareLink);
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
        
        // Create the shareable URL (uses a pre-rendered HTML page so link previews show track metadata)
        const url = new URL(window.location.href);
        const basePath = url.pathname.endsWith('/') ? url.pathname : url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
        const shareUrl = url.origin + basePath + 't/' + encodeURIComponent(currentTrack.id) + '.html';
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
            return null;
        }
        
        console.log("Found track ID in URL:", trackId);
        
        // Set up a listener for the window load event
        window.addEventListener('load', () => {
            console.log("Window loaded, now trying to load the shared track");
            // Make sure trackLoader is initialized before attempting to load track
            waitForTrackLoader(trackId);
        });
        
        // Also patch the initializeApp function in script.js to handle shared tracks
        patchInitializeApp(trackId);
        
        return trackId;
    }
    
    // Wait for track loader to initialize before loading a specific track
    function waitForTrackLoader(trackId) {
        console.log("Waiting for track loader to initialize...");
        
        // Check if track loader is already initialized
        if (trackLoader && trackLoader.isInitialized && 
            typeof tracks !== 'undefined' && tracks.length > 0) {
            loadSharedTrack(trackId);
            return;
        }
        
        // Set up a polling interval to check when track loader is ready
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
            console.error("Timeout waiting for track loader to initialize");
        }, 10000);
    }
    
    // Patch the initializeApp function to handle shared tracks
    function patchInitializeApp(trackId) {
        if (typeof window.initializeApp !== 'function') {
            console.log("initializeApp function not found, will try to intercept other initialization methods");
            return;
        }
        
        // Store the original function
        const originalInitializeApp = window.initializeApp;
        
        // Replace with patched version
        window.initializeApp = async function() {
            console.log("Patched initializeApp called");
            
            // Call the original function
            await originalInitializeApp.apply(this, arguments);
            
            // If we have a shared track, load it
            if (trackId && handlingSharedTrack) {
                console.log("Loading shared track from patched initializeApp");
                setTimeout(() => loadSharedTrack(trackId), 500); // Small delay to ensure everything is ready
            }
        };
        
        console.log("Successfully patched initializeApp function");
    }
    
    // Load a shared track by ID
    function loadSharedTrack(trackId) {
        console.log("Attempting to load shared track:", trackId);
        
        // Make sure we don't keep trying to load the shared track multiple times
        if (!handlingSharedTrack) {
            console.log("Already handled the shared track, skipping");
            return;
        }
        
        // Reset the flag
        handlingSharedTrack = false;
        
        // Add getTrackIndex method to trackLoader if not present
        if (!trackLoader.getTrackIndex) {
            console.log("Adding getTrackIndex method to trackLoader");
            trackLoader.getTrackIndex = function(trackId) {
                if (!this.isInitialized) {
                    console.error('Track loader not initialized. Call initialize() first.');
                    return -1;
                }
                
                // Find the track in the original tracks list
                const track = this.tracks.find(track => track.id === trackId);
                if (!track) {
                    console.error(`Track with ID ${trackId} not found in the original track list`);
                    return -1;
                }
                
                // Check if the track is in the current playlist
                const playlistIndex = tracks.findIndex(t => t.id === trackId);
                if (playlistIndex !== -1) {
                    console.log(`Track found in current playlist at index ${playlistIndex}`);
                    return playlistIndex;
                }
                
                // If not in current playlist, we need to add it
                console.log("Track not found in current playlist, will try to add it");
                
                // Add the track to the beginning of the playlist
                tracks.unshift(track);
                console.log("Added shared track to the beginning of the playlist");
                return 0; // The track is now at index 0
            };
        }
        
        // Find the track index
        const trackIndex = trackLoader.getTrackIndex(trackId);
        console.log("Track index:", trackIndex);
        
        if (trackIndex !== -1) {
            // Load the specific track
            if (typeof loadTrack === 'function') {
                console.log("Loading shared track at index:", trackIndex);
                loadTrack(trackIndex);
                
                // Auto-play the track
                if (typeof audioPlayer !== 'undefined' && typeof updatePlayPauseIcon === 'function') {
                    console.log("Attempting to auto-play the shared track");
                    audioPlayer.play()
                        .then(() => {
                            isPlaying = true;
                            updatePlayPauseIcon();
                            console.log("Auto-play successful");
                        })
                        .catch(error => {
                            console.error("Auto-play failed:", error);
                            // Just update the icon to show play state, the user can click play manually
                            isPlaying = false;
                            updatePlayPauseIcon();
                        });
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
            
            // Skip URL update if we're handling a shared track (to avoid overwriting the URL)
            if (!handlingSharedTrack) {
                // Update URL with track ID after a short delay
                // (to ensure track loading has started)
                setTimeout(() => {
                    if (typeof tracks !== 'undefined' && tracks[index] && tracks[index].id) {
                        updateUrlWithTrackId(tracks[index].id);
                    }
                }, 100);
            }
            
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
            /* Share success message */
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
                    margin-right: 10px;
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
