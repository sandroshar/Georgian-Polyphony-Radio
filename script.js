// Georgian Polyphony Player - Main Script
// Updated with improved track loader and error handling

// DOM Elements
const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const skipBtn = document.getElementById('skip-btn');
const muteBtn = document.getElementById('mute-btn');
const volumeControl = document.getElementById('volume-control');
const progressSlider = document.getElementById('progress-slider');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const trackTitle = document.getElementById('track-title');
const trackEnsemble = document.getElementById('track-ensemble');
const trackYear = document.getElementById('track-year');
const trackRegion = document.getElementById('track-region');
const loadingIndicator = document.getElementById('loading-indicator');
const trackInfo = document.getElementById('track-info');
const currentTrackDesc = document.getElementById('current-track-description');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');

// Playlist and current track
let tracks = [];
let originalTracks = []; // Keep the original playlist for when search is cleared
let playHistory = []; // Keep track of played tracks for previous button
let currentTrackIndex = 0;
let isPlaying = false;
let isLoading = true;
let searchResults = null;
let isSearchActive = false;
let isDraggingProgress = false;
let consecutiveErrors = 0; // Count consecutive errors to prevent infinite loops
const MAX_CONSECUTIVE_ERRORS = 5; // Maximum number of consecutive errors to try before stopping
let isHandlingSharedTrack = false; // Flag for track sharing functionality

// Create search results container
function createSearchResultsContainer() {
    const container = document.createElement('div');
    container.className = 'search-results';
    document.querySelector('.container').appendChild(container);
    return container;
}

// Format time in seconds to MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Update progress slider and time displays
function updateProgress() {
    if (!isDraggingProgress && audioPlayer.duration) {
        // Update progress slider
        progressSlider.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        
        // Update time displays
        currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
        durationDisplay.textContent = formatTime(audioPlayer.duration);
    }
}

// Set audio position based on slider
function setProgress() {
    if (audioPlayer.duration) {
        audioPlayer.currentTime = (progressSlider.value / 100) * audioPlayer.duration;
        currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    }
}

// Play/Pause functionality
function togglePlay() {
    if (audioPlayer.paused) {
        audioPlayer.play()
            .then(() => {
                isPlaying = true;
                updatePlayPauseIcon();
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                isPlaying = false;
                updatePlayPauseIcon();
                showErrorMessage('Unable to play this track. You may need to interact with the page first.');
            });
    } else {
        audioPlayer.pause();
        isPlaying = false;
        updatePlayPauseIcon();
    }
}

// Update play/pause button icon
function updatePlayPauseIcon() {
    if (isPlaying) {
        playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
            </svg>
        `;
    } else {
        playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
        `;
    }
}

// Toggle mute
function toggleMute() {
    audioPlayer.muted = !audioPlayer.muted;
    updateMuteIcon();
}

// Update mute button icon
function updateMuteIcon() {
    if (audioPlayer.muted) {
        muteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/>
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63z" fill="currentColor"/>
                <path d="M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" fill="currentColor"/>
                <path d="M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>
            </svg>
        `;
    } else {
        muteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/>
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/>
                <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
            </svg>
        `;
    }
}

// Display error message below the player
function showErrorMessage(message, duration = 5000) {
    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.audio-error');
    existingErrors.forEach(el => el.remove());
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'audio-error';
    errorElement.textContent = message;
    
    // Add to player container
    const playerContainer = document.querySelector('.player-container');
    playerContainer.appendChild(errorElement);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, duration);
}

// Load and play a track
function loadTrack(index) {
    if (tracks.length === 0) return;
    
    // Save current track to history if it's valid
    if (currentTrackIndex >= 0 && currentTrackIndex < tracks.length) {
        playHistory.push(currentTrackIndex);
        // Keep history manageable
        if (playHistory.length > 50) {
            playHistory.shift();
        }
    }
    
    // Reset consecutive errors counter
    consecutiveErrors = 0;
    
    currentTrackIndex = index;
    setLoading(true);
    
    const track = tracks[index];
    
    // Prepare audio source
    const audioSource = track.audioUrl;
    if (!audioSource) {
        console.error('Track has no audio URL:', track);
        showErrorMessage('This track is missing its audio source.');
        setLoading(false);
        return;
    }
    
    // Log the audio path to help with debugging
    console.log(`Attempting to load audio from: ${audioSource}`);
    
    // Clear any previous audio source
    audioPlayer.removeAttribute('src');
    audioPlayer.load();
    
    // Set new audio source
    audioPlayer.src = audioSource;
    
    // Update track information
    trackTitle.textContent = track.title || 'Unknown Title';
    trackEnsemble.textContent = track.performers || 'Unknown Performers';
    trackYear.textContent = track.year || '';
    trackRegion.textContent = track.region || 'Georgia';
    
    // Reset progress slider and time displays
    progressSlider.value = 0;
    currentTimeDisplay.textContent = '0:00';
    durationDisplay.textContent = '0:00';
    
    // Update track description if available
    if (currentTrackDesc) {
        if (track.collection_name) {
            currentTrackDesc.textContent = `From collection: ${track.collection_name}`;
            currentTrackDesc.style.display = 'block';
        } else {
            currentTrackDesc.style.display = 'none';
        }
    }
    
    // Enable/disable navigation buttons
    updateNavigationButtons();
    
    // Set up error handling
    audioPlayer.onerror = function(e) {
        console.error(`Error loading audio file: ${audioSource}`);
        console.error(`Audio error code: ${audioPlayer.error ? audioPlayer.error.code : 'unknown'}`);
        
        // Record this error in the track loader
        if (trackLoader && typeof trackLoader.recordTrackError === 'function') {
            trackLoader.recordTrackError(track);
        }
        
        setLoading(false);
        
        // Increment the consecutive errors counter
        consecutiveErrors++;
        
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            showErrorMessage('Multiple tracks failed to load. Please try again later or refresh the page.');
            isPlaying = false;
            updatePlayPauseIcon();
        } else {
            showErrorMessage('Could not load this track. Skipping to next track...');
            setTimeout(() => skipToNextTrack(), 1500);
        }
    };
    
    // Add event listener to detect when the track is ready to play
    audioPlayer.oncanplay = function() {
        setLoading(false);
        
        // Update duration display
        if (audioPlayer.duration) {
            durationDisplay.textContent = formatTime(audioPlayer.duration);
        }
        
        // Try to play automatically if we're in playing state
        if (isPlaying) {
            audioPlayer.play().catch(error => {
                console.error('Error auto-playing track:', error);
                // Don't change isPlaying state - let user try manual play
            });
        }
    };
    
    // Add a timeout in case the track doesn't load
    const loadTimeout = setTimeout(() => {
        // Only handle timeout if we're still loading
        if (isLoading) {
            console.warn('Track loading timed out');
            
            // Record this error in the track loader
            if (trackLoader && typeof trackLoader.recordTrackError === 'function') {
                trackLoader.recordTrackError(track);
            }
            
            setLoading(false);
            
            // Increment the consecutive errors counter
            consecutiveErrors++;
            
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                showErrorMessage('Multiple tracks failed to load. Please try again later or refresh the page.');
                isPlaying = false;
                updatePlayPauseIcon();
            } else {
                showErrorMessage('Track loading timed out. Skipping to next track...');
                setTimeout(() => skipToNextTrack(), 1500);
            }
        }
    }, 20000); // 20 second timeout
    
    // Clear timeout when loaded or on error
    audioPlayer.addEventListener('canplay', () => clearTimeout(loadTimeout), { once: true });
    audioPlayer.addEventListener('error', () => clearTimeout(loadTimeout), { once: true });
    
    // Start loading
    audioPlayer.load();
    
    // Update URL with track ID if not handling a shared track initially
    if (!isHandlingSharedTrack && track.id) {
        setTimeout(() => {
            updateUrlWithTrackId(track.id);
        }, 100);
    }
}

// Helper function to update URL with track ID
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

// Update navigation button states
function updateNavigationButtons() {
    // Enable prev button only if we have history
    prevBtn.disabled = playHistory.length === 0;
    
    // Skip button should always be enabled if we have more than one track
    skipBtn.disabled = tracks.length <= 1;
}

// Set loading state
function setLoading(loading) {
    isLoading = loading;
    
    if (loadingIndicator) {
        loadingIndicator.style.display = loading ? 'block' : 'none';
    }
    
    if (trackInfo) {
        trackInfo.style.opacity = loading ? '0.5' : '1';
    }
    
    // Disable buttons during loading
    playPauseBtn.disabled = loading;
    skipBtn.disabled = loading || tracks.length <= 1;
    prevBtn.disabled = loading || playHistory.length === 0;
    progressSlider.disabled = loading;
}

// Skip to next track
function skipToNextTrack() {
    // If we're at the end of the playlist, loop back to the first track
    if (currentTrackIndex >= tracks.length - 1) {
        currentTrackIndex = 0;
    } else {
        currentTrackIndex++;
    }
    
    loadTrack(currentTrackIndex);
}

// Play previous track
function playPreviousTrack() {
    if (playHistory.length > 0) {
        const prevIndex = playHistory.pop();
        // Don't add to history when going back
        currentTrackIndex = prevIndex;
        
        // Access the track directly without pushing to history again
        if (tracks.length === 0) return;
        
        setLoading(true);
        
        const track = tracks[currentTrackIndex];
        const audioSource = track.audioUrl;
        
        if (!audioSource) {
            console.error('Previous track has no audio URL:', track);
            showErrorMessage('This track is missing its audio source.');
            setLoading(false);
            return;
        }
        
        // Clear any previous audio source
        audioPlayer.removeAttribute('src');
        audioPlayer.load();
        
        // Set new audio source
        audioPlayer.src = audioSource;
        
        // Update track information
        trackTitle.textContent = track.title || 'Unknown Title';
        trackEnsemble.textContent = track.performers || 'Unknown Performers';
        trackYear.textContent = track.year || '';
        trackRegion.textContent = track.region || 'Georgia';
        
        // Reset progress slider and time displays
        progressSlider.value = 0;
        currentTimeDisplay.textContent = '0:00';
        durationDisplay.textContent = '0:00';
        
        // Update track description
        if (currentTrackDesc && track.collection_name) {
            currentTrackDesc.textContent = `From collection: ${track.collection_name}`;
            currentTrackDesc.style.display = 'block';
        } else if (currentTrackDesc) {
            currentTrackDesc.style.display = 'none';
        }
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Set up error handling
        audioPlayer.onerror = function(e) {
            console.error(`Error loading previous track: ${audioSource}`);
            console.error(`Audio error code: ${audioPlayer.error ? audioPlayer.error.code : 'unknown'}`);
            
            // Record this error in the track loader
            if (trackLoader && typeof trackLoader.recordTrackError === 'function') {
                trackLoader.recordTrackError(track);
            }
            
            setLoading(false);
            showErrorMessage('Could not load the previous track.');
        };
        
        // Add event listener to detect when the track is ready to play
        audioPlayer.oncanplay = function() {
            setLoading(false);
            
            // Update duration display
            if (audioPlayer.duration) {
                durationDisplay.textContent = formatTime(audioPlayer.duration);
            }
            
            if (isPlaying) {
                audioPlayer.play().catch(error => {
                    console.error('Error auto-playing previous track:', error);
                });
            }
        };
        
        // Start loading
        audioPlayer.load();
        
        // Update URL with track ID
        if (track.id) {
            setTimeout(() => {
                updateUrlWithTrackId(track.id);
            }, 100);
        }
    }
}

// Update volume
function handleVolumeChange() {
    audioPlayer.volume = volumeControl.value / 100;
    
    // Unmute if volume is adjusted while muted
    if (audioPlayer.muted && audioPlayer.volume > 0) {
        audioPlayer.muted = false;
        updateMuteIcon();
    }
}

// Search tracks
function searchTracks() {
    const query = searchInput.value.trim();
    
    if (!query) {
        clearSearch();
        return;
    }
    
    isSearchActive = true;
    const results = trackLoader.searchTracks(query);
    
    // Display search results
    displaySearchResults(results);
}

// Display search results
function displaySearchResults(results) {
    // Create search results container if it doesn't exist
    if (!searchResults) {
        searchResults = createSearchResultsContainer();
    }
    
    // Clear previous results
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No tracks found</div>';
        searchResults.classList.add('active');
        return;
    }
    
    // Add results to container
    results.forEach((track, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <div class="result-title">${track.title || 'Unknown Title'}</div>
            <div class="result-ensemble">${track.performers || 'Unknown Performers'} (${track.collection_name || 'Unknown Collection'})</div>
            <div class="result-meta">${track.region || ''} | ${track.year || 'Year Unknown'}</div>
        `;
        
        // Add click event to play the track
        resultItem.addEventListener('click', () => {
            // Update the playlist to show only search results
            tracks = results;
            loadTrack(index);
            isPlaying = true;
            updatePlayPauseIcon();
            
            // Hide search results
            searchResults.classList.remove('active');
        });
        
        searchResults.appendChild(resultItem);
    });
    
    // Show search results
    searchResults.classList.add('active');
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    
    // Hide search results
    if (searchResults) {
        searchResults.classList.remove('active');
    }
    
    // Only reshuffle if we're returning from a search
    if (isSearchActive) {
        // Restore original playlist with filtered tracks
        tracks = trackLoader.getFilteredShuffledPlaylist();
        isSearchActive = false;
        
        // Load the first track of the new filtered playlist
        loadTrack(0);
    }
    
    // Update navigation buttons
    updateNavigationButtons();
}

// Get a track by ID from the current playlist
function getTrackByIdFromCurrentPlaylist(trackId) {
    return tracks.findIndex(track => track.id === trackId);
}

// Initialize the application with the track loader
async function initializeApp() {
    setLoading(true);
    
    try {
        // Check for shared track ID in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedTrackId = urlParams.get('track');
        
        if (sharedTrackId) {
            console.log('Found shared track ID in URL:', sharedTrackId);
            isHandlingSharedTrack = true;
        }
        
        // Initialize the track loader
        const initialized = await trackLoader.initialize();
        
        if (!initialized) {
            showError('Failed to initialize the track loader');
            return;
        }
        
        // Get all tracks
        originalTracks = trackLoader.getAllTracks();
        
        // If we have a shared track ID, find the corresponding track
        if (isHandlingSharedTrack && sharedTrackId) {
            // Find the shared track
            const sharedTrack = trackLoader.getTrackById(sharedTrackId);
            
            if (sharedTrack) {
                // Create a playlist with the shared track first
                const collection = trackLoader.getTracksFromCollection(sharedTrack.collection_id);
                const otherTracks = trackLoader.getFilteredShuffledPlaylist()
                    .filter(track => track.id !== sharedTrackId);
                
                // Combine the shared track with other tracks
                tracks = [sharedTrack, ...otherTracks];
                
                console.log(`Loaded shared track '${sharedTrack.title}' and ${tracks.length - 1} other tracks`);
                
                // Load the shared track (index 0)
                loadTrack(0);
                
                // Try to auto-play the track
                isPlaying = true;
                updatePlayPauseIcon();
                audioPlayer.play().catch(error => {
                    console.error('Error auto-playing shared track:', error);
                    isPlaying = false;
                    updatePlayPauseIcon();
                });
                
                // Reset the shared track flag
                isHandlingSharedTrack = false;
                
                // Update navigation buttons
                updateNavigationButtons();
                return;
            } else {
                console.warn(`Shared track with ID ${sharedTrackId} not found`);
                showErrorMessage('The shared track could not be found.');
                // Continue with normal initialization
                isHandlingSharedTrack = false;
            }
        }
        
        // Normal initialization (when no shared track or shared track not found)
        // Use filtered collection-based shuffling to reduce errors
        tracks = trackLoader.getFilteredShuffledPlaylist();
        
        if (tracks.length === 0) {
            showError('No tracks available');
            return;
        }
        
        console.log(`Loaded ${tracks.length} tracks for playlist`);
        console.log('Tracks have been shuffled with collections prioritized');
        
        // Load the first track
        loadTrack(0);
        
        // Update navigation buttons
        updateNavigationButtons();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Error loading tracks. Please try again later.');
    }
}

// Show error message
function showError(message) {
    setLoading(false);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    const container = document.querySelector('.container');
    container.appendChild(errorElement);
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (searchResults && 
        !searchResults.contains(e.target) && 
        e.target !== searchInput &&
        e.target !== searchBtn) {
        searchResults.classList.remove('active');
    }
});

// Event Listeners
playPauseBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', playPreviousTrack);
skipBtn.addEventListener('click', skipToNextTrack);
muteBtn.addEventListener('click', toggleMute);
volumeControl.addEventListener('input', handleVolumeChange);

// FIXED PROGRESS BAR FUNCTIONALITY
// Single click on progress bar - jump to that position immediately
progressSlider.addEventListener('click', function(e) {
    setProgress();
});

// Handle progress changes when sliding
progressSlider.addEventListener('input', function() {
    isDraggingProgress = true;
    // Just update the time display while sliding
    if (audioPlayer.duration) {
        currentTimeDisplay.textContent = formatTime((progressSlider.value / 100) * audioPlayer.duration);
    }
});

// Only set the actual audio position when the sliding is done
progressSlider.addEventListener('change', function() {
    isDraggingProgress = false;
    setProgress();
});

// Audio player event listeners
audioPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('ended', skipToNextTrack);

// Search when Enter key is pressed in search input
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        searchTracks();
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set initial volume
    audioPlayer.volume = volumeControl.value / 100;
    
    // Initialize app with track loader
    initializeApp();
    
    // Set up click handler for iOS audio playback
    setupIOSAudioHandling();
});

// Special handling for iOS audio playback
function setupIOSAudioHandling() {
    // Check if likely iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        // Create notification for users
        const iosNotice = document.createElement('div');
        iosNotice.className = 'audio-info';
        iosNotice.textContent = 'Tap anywhere on the page to enable audio playback';
        iosNotice.style.backgroundColor = 'rgba(230, 194, 0, 0.2)';
        iosNotice.style.color = '#e6c200';
        iosNotice.style.padding = '10px';
        iosNotice.style.borderRadius = '5px';
        iosNotice.style.margin = '15px 0';
        iosNotice.style.textAlign = 'center';
        
        const playerContainer = document.querySelector('.player-container');
        playerContainer.parentNode.insertBefore(iosNotice, playerContainer);
        
        // Set up one-time click handler
        document.addEventListener('click', function() {
            // Create a silent audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Play a silent sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0; // Silent
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(0.001);
            
            // Remove the notice
            iosNotice.remove();
            
            // Try to play audio if it's in playing state
            if (isPlaying && audioPlayer.paused) {
                audioPlayer.play().catch(error => {
                    console.error('Error playing audio after user interaction:', error);
                });
            }
        }, { once: true });
    }
}

searchBtn.addEventListener('click', searchTracks);
clearSearchBtn.addEventListener('click', clearSearch);
