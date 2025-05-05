// This is a revised version of the filter-tracks.js script
// The key changes include:
// 1. More robust initialization that waits for DOM elements
// 2. Fixed toggle mechanism for the filter panel
// 3. Improved filter application and reset functions

// filter-tracks.js - Fixed version of filtering functionality for Georgian Polyphony Player

(function() {
    // Global state for filters
    const activeFilters = {
        regions: [],
        collections: []
    };
    
    // Flag to prevent duplicate initialization
    let isInitialized = false;
    let filterBtn = null;
    let filterPanel = null;
    let regionFiltersContainer = null;
    let collectionFiltersContainer = null;
    let applyFiltersBtn = null;
    let resetFiltersBtn = null;
    
    // Initialize when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Set up initialization after a short delay to ensure other scripts have loaded
        setTimeout(initializeFilterElements, 500);
    });
    
    // Function to get DOM elements and initialize if ready
    function initializeFilterElements() {
        // Get DOM elements
        filterBtn = document.getElementById('filter-btn');
        filterPanel = document.getElementById('filter-panel');
        regionFiltersContainer = document.getElementById('region-filters');
        collectionFiltersContainer = document.getElementById('collection-filters');
        applyFiltersBtn = document.getElementById('apply-filters-btn');
        resetFiltersBtn = document.getElementById('reset-filters-btn');
        
        // Check if elements exist
        if (!filterBtn || !filterPanel) {
            console.log("Filter elements not found yet, retrying...");
            setTimeout(initializeFilterElements, 500);
            return;
        }
        
        console.log("Filter elements found, waiting for track loader...");
        waitForTrackLoader();
    }
    
    // Wait for track loader to be initialized
    function waitForTrackLoader() {
        if (typeof trackLoader !== 'undefined' && 
            typeof tracks !== 'undefined' && 
            typeof currentTrackIndex !== 'undefined' && 
            typeof loadTrack === 'function') {
            
            console.log("Track loader is ready, initializing filter functionality");
            
            // Initialize filter functionality if not already initialized
            if (!isInitialized) {
                isInitialized = true;
                initFilterFunctionality();
            }
        } else {
            console.log("Waiting for track loader...");
            setTimeout(waitForTrackLoader, 500);
        }
    }
    
    // Initialize filter functionality
    function initFilterFunctionality() {
        // Make sure the filter panel starts hidden with appropriate styles
        filterPanel.style.display = 'none';
        filterPanel.classList.remove('active');
        
        // Set up event listeners
        filterBtn.addEventListener('click', toggleFilterPanel);
        applyFiltersBtn.addEventListener('click', applyFilters);
        resetFiltersBtn.addEventListener('click', resetFilters);
        
        // Initially populate the filter options
        populateFilterOptions();
        
        // Log successful initialization
        console.log("Filter functionality initialized successfully");
        
        // Add keyboard shortcut - 'F' to toggle filter panel
        document.addEventListener('keydown', function(e) {
            // Check for 'F' key
            if (e.key === 'f' || e.key === 'F') {
                // Don't trigger if user is typing in an input field
                if (document.activeElement.tagName !== 'INPUT' && 
                    document.activeElement.tagName !== 'TEXTAREA') {
                    toggleFilterPanel();
                }
            }
        });
        
        // Add styles
        addStyles();
    }
    
    // Toggle filter panel visibility - Fixed version
    function toggleFilterPanel() {
        console.log("Toggle filter panel called, current state:", filterPanel.classList.contains('active'));
        
        if (filterPanel.classList.contains('active')) {
            // Hide panel
            filterPanel.classList.remove('active');
            filterBtn.classList.remove('active');
            // Use setTimeout to allow CSS transition to complete before hiding
            setTimeout(() => {
                filterPanel.style.display = 'none';
            }, 300); // Match this to the CSS transition time
        } else {
            // Show panel
            filterPanel.style.display = 'block';
            // Use setTimeout to ensure display:block takes effect before adding the active class
            setTimeout(() => {
                filterPanel.classList.add('active');
                filterBtn.classList.add('active');
                populateFilterOptions(); // Re-populate when showing
            }, 10);
        }
    }
    
    // Populate filter options with available regions and collections
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
        
        // Extract unique collections
        const collections = [...new Set(allTracks
            .map(track => track.collection_name)
            .filter(collection => collection && collection.trim() !== '')
        )].sort();
        
        console.log(`Found ${regions.length} regions and ${collections.length} collections`);
        
        // Populate region filters
        populateFilterSection(regionFiltersContainer, regions, 'region', activeFilters.regions);
        
        // Populate collection filters
        populateFilterSection(collectionFiltersContainer, collections, 'collection', activeFilters.collections);
        
        // Update the filter button indicator
        updateFilterIndicator();
    }
    
    // Helper function to populate a filter section
    function populateFilterSection(container, options, type, activeOptions) {
        // Clear previous options
        container.innerHTML = '';
        
        // Add filter options
        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'filter-option';
            if (activeOptions.includes(option)) {
                optionElement.classList.add('active');
            }
            optionElement.dataset.value = option;
            optionElement.dataset.type = type;
            optionElement.textContent = option;
            
            // Add click event listener
            optionElement.addEventListener('click', toggleFilterOption);
            
            container.appendChild(optionElement);
        });
    }
    
    // Toggle selection of a filter option
    function toggleFilterOption(event) {
        const option = event.target;
        const value = option.dataset.value;
        const type = option.dataset.type;
        
        option.classList.toggle('active');
        
        // Update active filters
        if (type === 'region') {
            if (option.classList.contains('active')) {
                if (!activeFilters.regions.includes(value)) {
                    activeFilters.regions.push(value);
                }
            } else {
                activeFilters.regions = activeFilters.regions.filter(region => region !== value);
            }
        } else if (type === 'collection') {
            if (option.classList.contains('active')) {
                if (!activeFilters.collections.includes(value)) {
                    activeFilters.collections.push(value);
                }
            } else {
                activeFilters.collections = activeFilters.collections.filter(collection => collection !== value);
            }
        }
        
        // Update the filter button indicator
        updateFilterIndicator();
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
        
        // Apply collection filter if any collections are selected
        if (activeFilters.collections.length > 0) {
            filteredTracks = filteredTracks.filter(track => 
                track.collection_name && activeFilters.collections.includes(track.collection_name)
            );
        }
        
        if (filteredTracks.length === 0) {
            alert('No tracks match the selected filters. Please select different filters.');
            return;
        }
        
        // Update the global tracks array
        tracks = filteredTracks;
        
        // Load the first track of the filtered list
        loadTrack(0);
        
        // Close filter panel
        toggleFilterPanel();
        
        // Show feedback to the user about how many tracks are in the filtered list
        showFilterFeedback(filteredTracks.length);
    }
    
    // Reset all filters
    function resetFilters() {
        // Clear active filters
        activeFilters.regions = [];
        activeFilters.collections = [];
        
        // Reset UI
        const filterOptions = document.querySelectorAll('.filter-option');
        filterOptions.forEach(option => option.classList.remove('active'));
        
        // Update the filter button indicator
        updateFilterIndicator();
        
        // If we're already in a filtered state, reset to the full playlist
        if (tracks.length !== trackLoader.getAllTracks().length) {
            // Use the filtered shuffle method to get an optimal playlist
            tracks = trackLoader.getFilteredShuffledPlaylist();
            
            // Load the first track
            loadTrack(0);
            
            // Close filter panel
            toggleFilterPanel();
            
            // Show feedback
            showFilterFeedback(tracks.length, true);
        }
    }
    
    // Show feedback after applying filters
    function showFilterFeedback(trackCount, isReset = false) {
        // Remove any existing feedback messages
        const existingMessages = document.querySelectorAll('.share-success');
        existingMessages.forEach(el => el.remove());
        
        // Create feedback element
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'share-success'; // Reuse the share success styling
        
        if (isReset) {
            feedbackElement.textContent = `Filters reset. Showing all ${trackCount} tracks.`;
        } else {
            feedbackElement.textContent = `Found ${trackCount} tracks matching your filters.`;
        }
        
        // Add to player container
        const playerContainer = document.querySelector('.player-container');
        if (playerContainer) {
            playerContainer.appendChild(feedbackElement);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (feedbackElement.parentNode) {
                    feedbackElement.remove();
                }
            }, 3000);
        }
    }
    
    // Update the filter button indicator based on active filters
    function updateFilterIndicator() {
        if (!filterBtn) return;
        
        // Check if any filters are active
        const hasActiveFilters = activeFilters.regions.length > 0 || activeFilters.collections.length > 0;
        
        // Update class on filter button
        if (hasActiveFilters) {
            if (!filterBtn.classList.contains('has-filters')) {
                filterBtn.classList.add('has-filters');
                
                // Add indicator if it doesn't exist
                if (!filterBtn.querySelector('.filter-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'filter-indicator';
                    filterBtn.appendChild(indicator);
                }
            }
        } else {
            filterBtn.classList.remove('has-filters');
            
            // Remove indicator if it exists
            const indicator = filterBtn.querySelector('.filter-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    }
    
    // Helper function to get current filters as text for description
    function getActiveFiltersDescription() {
        const parts = [];
        
        if (activeFilters.regions.length > 0) {
            parts.push(`Regions: ${activeFilters.regions.join(', ')}`);
        }
        
        if (activeFilters.collections.length > 0) {
            parts.push(`Collections: ${activeFilters.collections.join(', ')}`);
        }
        
        return parts.length > 0 ? 
            `Filtered by: ${parts.join(' | ')}` : 
            'Showing all tracks';
    }
    
    // Add CSS styles for filter functionality
    function addStyles() {
        // Check if styles already exist
        if (document.querySelector('style[data-filter-styles="true"]')) {
            return;
        }
        
        const style = document.createElement('style');
        style.setAttribute('data-filter-styles', 'true');
        style.textContent = `
            /* Filter panel styling */
            .filter-panel {
                display: none;
                background-color: var(--filter-panel-bg, #121212);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 30px;
                text-align: left;
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-out;
            }
            
            .filter-panel.active {
                max-height: 500px;
                display: block;
            }
            
            /* Filter options styling */
            .filter-options {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .filter-option {
                background-color: var(--filter-option-bg, rgba(255, 255, 255, 0.1));
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .filter-option:hover {
                background-color: rgba(255, 255, 255, 0.15);
            }
            
            .filter-option.active {
                background-color: var(--filter-option-active, rgba(230, 194, 0, 0.3));
                color: var(--accent-color, #e6c200);
            }
            
            /* Filter indicator styling */
            .filter-indicator {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: var(--accent-color, #e6c200);
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 0.7; }
            }
            
            /* Filter button styling */
            .filter-btn {
                position: relative;
            }
            
            .filter-btn.active {
                background-color: var(--accent-color, #e6c200);
                color: #000;
            }
            
            /* Media queries for responsiveness */
            @media (max-width: 600px) {
                .filter-options {
                    gap: 5px;
                }
                
                .filter-option {
                    padding: 6px 12px;
                    font-size: 0.8rem;
                }
            }
        `;
        
        document.head.appendChild(style);
        console.log("Filter styles added");
    }
    
    // Public API for the filter module
    window.trackFilters = {
        getActiveFilters: () => ({...activeFilters}),
        getActiveFiltersDescription: getActiveFiltersDescription,
        resetFilters: resetFilters,
        toggleFilterPanel: toggleFilterPanel  // Expose for debugging
    };
})();
