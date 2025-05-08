// Georgian Polyphony Player - Main Script
// Updated with fixed volume and filter button support

// DOM Elements
const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const skipBtn = document.getElementById('skip-btn');
const muteBtn = document.getElementById('mute-btn');
const filterBtn = document.getElementById('filter-btn');
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
const filterPanel = document.getElementById('filter-panel');
const regionFiltersContainer = document.getElementById('region-filters');
const yearRangeContainer = document.getElementById('year-range-container');
const applyFiltersBtn = document.getElementById('apply-filters-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// Playlist and current track
let tracks = [];
let originalTracks = []; // Keep the original playlist for when search is cleared
let playHistory = []; // Keep track of played tracks for previous button
let currentTrackIndex = 0;
let isPlaying = false;
let isLoading = true;
let searchResults = null;
let isSearchActive = false;
let isFilterActive = false;
let isDraggingProgress = false;
let consecutiveErrors = 0; // Count consecutive errors to prevent infinite loops
const MAX_CONSECUTIVE_ERRORS = 5; // Maximum number of consecutive errors to try before stopping
let isHandlingSharedTrack = false; // Flag for track sharing functionality
const FIXED_VOLUME = 0.7; // Fixed volume at 70%

// Filter state
const activeFilters = {
    regions: [],
    yearRange: { min: 1900, max: 2025 } // Default range
};

// Create search results container
function createSearchResultsContainer() {
    const container = document.createElement('div');
    container.className = 'search-results';
    document.querySelector('.container').appendChild(container);
    return container;
}

// Create clear button dropdown menu
function createClearDropdown() {
    // Check if dropdown already exists
    const existingDropdown = document.querySelector('.clear-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'clear-dropdown';
    
    const searchOption = document.createElement('div');
    searchOption.className = 'clear-option';
    searchOption.textContent = 'Clear Search';
    searchOption.addEventListener('click', () => {
        clearSearch();
        dropdown.remove();
    });
    
    const filterOption = document.createElement('div');
    filterOption.className = 'clear-option';
    filterOption.textContent = 'Clear Filters';
    filterOption.addEventListener('click', () => {
        resetFilters();
        dropdown.remove();
    });
    
    const allOption = document.createElement('div');
    allOption.className = 'clear-option';
    allOption.textContent = 'Clear All';
    allOption.addEventListener('click', () => {
        clearSearch();
        resetFilters();
        dropdown.remove();
    });
    
    dropdown.appendChild(searchOption);
    dropdown.appendChild(filterOption);
    dropdown.appendChild(allOption);
    
    // Position dropdown below clear button
    const clearBtnRect = clearSearchBtn.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.top = `${clearBtnRect.bottom + window.scrollY}px`;
    dropdown.style.left = `${clearBtnRect.left + window.scrollX}px`;
    
    document.body.appendChild(dropdown);
    
    // Close dropdown when clicking elsewhere
    function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== clearSearchBtn) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
        }
    }
    
    setTimeout(() => {
        document.addEventListener('click', closeDropdown);
    }, 100);
    
    return dropdown;
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
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63z" fill="currentColor"/>
                <path d="M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor"/>
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

// Handle volume - using fixed volume
function handleVolumeChange() {
    audioPlayer.volume = FIXED_VOLUME;
    
    if (audioPlayer.muted) {
        audioPlayer.muted = false;
        updateMuteIcon();
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

// Display success message
function showSuccessMessage(message, duration = 3000) {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.success-message');
    existingMessages.forEach(el => el.remove());
    
    // Create success message element
    const messageElement = document.createElement('div');
    messageElement.className = 'success-message';
    messageElement.textContent = message;
    
    // Add to player container
    const playerContainer = document.querySelector('.player-container');
    playerContainer.appendChild(messageElement);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
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
    
    // Set fixed volume
    audioPlayer.volume = FIXED_VOLUME;
    
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
        loadingIndicator.style.display = loading ? 'flex' : 'none';
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
        
        // Set fixed volume
        audioPlayer.volume = FIXED_VOLUME;
        
        // Update URL with track ID
        if (track.id) {
            setTimeout(() => {
                updateUrlWithTrackId(track.id);
            }, 100);
        }
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
    
    // Update clear button state
    updateClearButtonState();
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
        isSearchActive = false;
        
        // Apply any active filters if needed
        if (isFilterActive) {
            applyFilters();
        } else {
            // Restore original playlist with filtered tracks
            tracks = trackLoader.getFilteredShuffledPlaylist();
            
            // Load the first track of the new filtered playlist
            loadTrack(0);
        }
    }
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Update clear button state
    updateClearButtonState();
}

// Toggle filter panel
function toggleFilterPanel() {
    filterPanel.classList.toggle('active');
    filterBtn.classList.toggle('active');
    
    // Re-populate filter options when opening panel
    if (filterPanel.classList.contains('active')) {
        populateFilterOptions();
    }
}

// Populate filter options with available regions and year range
function populateFilterOptions() {
    // Only proceed if tracks are available
    if (!trackLoader || !trackLoader.isInitialized || !trackLoader.tracks) {
        console.error('Track loader not initialized or tracks not available');
        return;
    }
    
    // Get all available tracks
    const allTracks = trackLoader.getAllTracks();
    
    // Extract unique regions
    const regions = [...new Set(allTracks
        .map(track => track.region)
        .filter(region => region && region.trim() !== '')
    )].sort();
    
    // Extract year range
    const years = allTracks
        .map(track => parseInt(track.year))
        .filter(year => !isNaN(year));
    
    const minYear = Math.min(...years) || 1900;
    const maxYear = Math.max(...years) || 2025;
    
    // Populate region filters
    populateRegionFilters(regions);
    
    // Populate year range slider
    populateYearRangeSlider(minYear, maxYear);
}

// Populate region filters
function populateRegionFilters(regions) {
    // Clear previous options
    regionFiltersContainer.innerHTML = '';
    
    // Add filter options
    regions.forEach(region => {
        const optionElement = document.createElement('div');
        optionElement.className = 'filter-option';
        if (activeFilters.regions.includes(region)) {
            optionElement.classList.add('active');
        }
        optionElement.dataset.value = region;
        optionElement.textContent = region;
        
        // Add click event listener
        optionElement.addEventListener('click', toggleRegionFilter);
        
        regionFiltersContainer.appendChild(optionElement);
    });
}

// Create year range slider
function populateYearRangeSlider(minYear, maxYear) {
    // Clear previous content
    yearRangeContainer.innerHTML = '';
    
    // Create year range slider elements
    const yearSliderLabel = document.createElement('h3');
    yearSliderLabel.textContent = 'Filter by Year Range';
    
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'year-slider-container';
    
    const minYearDisplay = document.createElement('span');
    minYearDisplay.className = 'year-display min-year';
    minYearDisplay.textContent = activeFilters.yearRange.min;
    
    const maxYearDisplay = document.createElement('span');
    maxYearDisplay.className = 'year-display max-year';
    maxYearDisplay.textContent = activeFilters.yearRange.max;
    
    const rangeSlider = document.createElement('div');
    rangeSlider.className = 'year-range-slider';
    
    // Create min slider
    const minSlider = document.createElement('input');
    minSlider.type = 'range';
    minSlider.min = minYear;
    minSlider.max = maxYear;
    minSlider.value = activeFilters.yearRange.min;
    minSlider.className = 'year-slider min-slider';
    
    // Create max slider
    const maxSlider = document.createElement('input');
    maxSlider.type = 'range';
    maxSlider.min = minYear;
    maxSlider.max = maxYear;
    maxSlider.value = activeFilters.yearRange.max;
    maxSlider.className = 'year-slider max-slider';
    
    // Add event listeners
    minSlider.addEventListener('input', () => {
        // Ensure min value doesn't exceed max value
        if (parseInt(minSlider.value) > parseInt(maxSlider.value)) {
            minSlider.value = maxSlider.value;
        }
        
        activeFilters.yearRange.min = parseInt(minSlider.value);
        minYearDisplay.textContent = minSlider.value;
    });
    
    maxSlider.addEventListener('input', () => {
        // Ensure max value doesn't go below min value
        if (parseInt(maxSlider.value) < parseInt(minSlider.value)) {
            maxSlider.value = minSlider.value;
        }
        
        activeFilters.yearRange.max = parseInt(maxSlider.value);
        maxYearDisplay.textContent = maxSlider.value;
    });
    
    // Append elements
    rangeSlider.appendChild(minSlider);
    rangeSlider.appendChild(maxSlider);
    
    sliderContainer.appendChild(minYearDisplay);
    sliderContainer.appendChild(rangeSlider);
    sliderContainer.appendChild(maxYearDisplay);
    
    yearRangeContainer.appendChild(yearSliderLabel);
    yearRangeContainer.appendChild(sliderContainer);
}

// Toggle region filter
function toggleRegionFilter(event) {
    const option = event.target;
    const region = option.dataset.value;
    
    option.classList.toggle('active');
    
    if (option.classList.contains('active')) {
        if (!activeFilters.regions.includes(region)) {
            activeFilters.regions.push(region);
        }
    } else {
        activeFilters.regions = activeFilters.regions.filter(r => r !== region);
    }
}

// Apply selected filters
function applyFilters() {
    // Only proceed if tracks are available
    if (!trackLoader || !trackLoader.isInitialized || !trackLoader.tracks) {
        console.error('Track loader not initialized or tracks not available');
        return;
    }
    
    // Get all available tracks
    const allTracks = trackLoader.getAllTracks();
    
    // Filter tracks based on selected options
    let filteredTracks = allTracks;
    
    // Apply region filter if any regions are selected
    if (activeFilters.regions.length > 0) {
        filteredTracks = filteredTracks.filter(track => 
            track.region && activeFilters.regions.includes(track.region)
        );
    }
    
    // Apply year range filter
    filteredTracks = filteredTracks.filter(track => {
        const year = parseInt(track.year);
        if (isNaN(year)) return true; // Keep tracks with unknown year
        return year >= activeFilters.yearRange.min && year <= activeFilters.yearRange.max;
    });
    
    if (filteredTracks.length === 0) {
        showErrorMessage('No tracks match the selected filters. Please select different filters.');
        return;
    }
    
    // Update the filtered state
    isFilterActive = (activeFilters.regions.length > 0 || 
                    activeFilters.yearRange.min > 1900 || 
                    activeFilters.yearRange.max < 2025);
    
    // Shuffle the filtered tracks - THIS IS THE CHANGE
    const shuffledFilteredTracks = shuffleArray([...filteredTracks]);
    
    // Update the global tracks array with shuffled filtered tracks
    tracks = shuffledFilteredTracks;
    
    // Load the first track of the filtered list
    loadTrack(0);
    
    // Close filter panel
    filterPanel.classList.remove('active');
    filterBtn.classList.remove('active');
    
    // Update the filter button state
    updateFilterButtonState();
    
    // Update clear button state
    updateClearButtonState();
    
    // Show feedback to the user about how many tracks are in the filtered list
    showSuccessMessage(`Found ${filteredTracks.length} tracks matching your filters.`);
}

// Shuffle helper function using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Reset all filters
function resetFilters() {
    // Clear active filters
    activeFilters.regions = [];
    activeFilters.yearRange = { min: 1900, max: 2025 };
    
    // Reset UI
    const filterOptions = document.querySelectorAll('.filter-option');
    filterOptions.forEach(option => option.classList.remove('active'));
    
    // Update the filtered state
    isFilterActive = false;
    
    // Reset filter button state
    filterBtn.classList.remove('has-filters');
    
    // If we're already in a filtered state, reset to the full playlist
    if (isFilterActive) {
        // Use the filtered shuffle method to get an optimal playlist
        tracks = trackLoader.getFilteredShuffledPlaylist();
        
        // Load the first track
        loadTrack(0);
        
        // Close filter panel
        filterPanel.classList.remove('active');
        filterBtn.classList.remove('active');
        
        // Show feedback
        showSuccessMessage(`Filters reset. Showing all ${tracks.length} tracks.`);
    }
    
    // Update clear button state
    updateClearButtonState();
}

// Update filter button state
function updateFilterButtonState() {
    if (isFilterActive) {
        filterBtn.classList.add('has-filters');
    } else {
        filterBtn.classList.remove('has-filters');
    }
}

// Update clear button state
function updateClearButtonState() {
    if (isSearchActive && isFilterActive) {
        clearSearchBtn.textContent = 'Clear...';
    } else if (isSearchActive) {
        clearSearchBtn.textContent = 'Clear Search';
    } else if (isFilterActive) {
        clearSearchBtn.textContent = 'Clear Filters';
    } else {
        clearSearchBtn.textContent = 'Clear';
    }
}

// Handle clear button click
function handleClearButtonClick() {
    if (isSearchActive && isFilterActive) {
        createClearDropdown();
    } else if (isSearchActive) {
        clearSearch();
    } else if (isFilterActive) {
        resetFilters();
    }
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
filterBtn.addEventListener('click', toggleFilterPanel);
applyFiltersBtn.addEventListener('click', applyFilters);
resetFiltersBtn.addEventListener('click', resetFilters);

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

// Set up clear button to handle both search and filter clearing
clearSearchBtn.addEventListener('click', handleClearButtonClick);
searchBtn.addEventListener('click', searchTracks);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set fixed volume
    audioPlayer.volume = FIXED_VOLUME;
    
    // Initialize app with track loader
    initializeApp();
    
    // Set up click handler for iOS audio playback
    setupIOSAudioHandling();
    
    // Initial filter population
    setTimeout(() => {
        populateFilterOptions();
    }, 2000);
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
            
            // Make sure audio is at proper volume and not muted
            audioPlayer.volume = FIXED_VOLUME;
            audioPlayer.muted = false;
            updateMuteIcon();
            
            // Try to play audio if it's in playing state
            if (isPlaying && audioPlayer.paused) {
                audioPlayer.play().catch(error => {
                    console.error('Error playing audio after user interaction:', error);
                });
            }
        }, { once: true });
    }
}
