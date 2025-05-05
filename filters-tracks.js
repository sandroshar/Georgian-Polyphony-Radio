// Enhanced filter-tracks.js - Complete solution for Georgian Polyphony Player
// Adds both region filtering and year range filtering

(function() {
    // Global state for filters
    const activeFilters = {
        regions: [],
        collections: [],
        yearRange: { min: 1900, max: 2025 } // Default year range
    };
    
    // Track the actual min/max years in the dataset
    let dataYearRange = { min: 1900, max: 2025 };
    
    // DOM elements
    let filterBtn;
    let filterPanel;
    let regionFiltersContainer;
    let collectionFiltersContainer;
    let yearRangeContainer;
    let yearSliderMin;
    let yearSliderMax;
    let yearMinDisplay;
    let yearMaxDisplay;
    let applyFiltersBtn;
    let resetFiltersBtn;
    
    // Flag to prevent duplicate initialization
    let isInitialized = false;
    
    // Initialize when the document is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM loaded, waiting for elements to be available...");
        setTimeout(setupFilterModule, 500);
    });
    
    // Setup the filter module
    function setupFilterModule() {
        console.log("Setting up filter module...");
        
        // First, check if we need to enhance the HTML structure
        ensureFilterHTML();
        
        // Get DOM elements
        filterBtn = document.getElementById('filter-btn');
        filterPanel = document.getElementById('filter-panel');
        regionFiltersContainer = document.getElementById('region-filters');
        collectionFiltersContainer = document.getElementById('collection-filters');
        yearRangeContainer = document.getElementById('year-range-container');
        yearSliderMin = document.getElementById('year-slider-min');
        yearSliderMax = document.getElementById('year-slider-max');
        yearMinDisplay = document.getElementById('year-min-display');
        yearMaxDisplay = document.getElementById('year-max-display');
        applyFiltersBtn = document.getElementById('apply-filters-btn');
        resetFiltersBtn = document.getElementById('reset-filters-btn');
        
        if (!filterBtn || !filterPanel) {
            console.log("Filter elements not found, will try again in 500ms...");
            setTimeout(setupFilterModule, 500);
            return;
        }
        
        console.log("Filter elements found, waiting for track loader...");
        waitForTrackLoader();
    }
    
    // Ensure the filter panel HTML structure is complete
    function ensureFilterHTML() {
        // First check if the filter panel exists
        const existingPanel = document.getElementById('filter-panel');
        
        if (existingPanel) {
            // Check if year range container exists
            if (!document.getElementById('year-range-container')) {
                // Add the year range container to the existing panel
                const yearRangeHTML = `
                    <h3>Filter by Year</h3>
                    <div id="year-range-container" class="year-range-container">
                        <div class="year-slider-controls">
                            <div class="year-display">
                                <span id="year-min-display">1900</span>
                            </div>
                            <div class="year-slider">
                                <input type="range" id="year-slider-min" min="1900" max="2025" value="1900" class="year-slider-input">
                            </div>
                            <div class="year-display">
                                <span id="year-max-display">2025</span>
                            </div>
                            <div class="year-slider">
                                <input type="range" id="year-slider-max" min="1900" max="2025" value="2025" class="year-slider-input">
                            </div>
                        </div>
                    </div>
                `;
                
                // Insert before the filter actions
                const filterActions = existingPanel.querySelector('.filter-actions');
                if (filterActions) {
                    filterActions.insertAdjacentHTML('beforebegin', yearRangeHTML);
                } else {
                    existingPanel.insertAdjacentHTML('beforeend', yearRangeHTML);
                    // Also add filter actions if missing
                    existingPanel.insertAdjacentHTML('beforeend', `
                        <div class="filter-actions">
                            <button id="apply-filters-btn" class="btn">Apply Filters</button>
                            <button id="reset-filters-btn" class="btn">Reset</button>
                        </div>
                    `);
                }
            }
        }
    }
    
    // Wait for the track loader to be initialized
    function waitForTrackLoader() {
        if (typeof trackLoader !== 'undefined' && 
            typeof tracks !== 'undefined' && 
            Array.isArray(tracks) &&
            typeof currentTrackIndex !== 'undefined' && 
            typeof loadTrack === 'function') {
            
            console.log("Track loader is ready, initializing filter functionality");
            initFilterFunctionality();
        } else {
            console.log("Waiting for track loader...");
            setTimeout(waitForTrackLoader, 500);
        }
    }
    
    // Initialize filter functionality
    function initFilterFunctionality() {
        if (isInitialized) {
            console.log("Filter functionality already initialized");
            return;
        }
        
        isInitialized = true;
        
        // Ensure filter panel starts hidden but prepared for transitions
        filterPanel.style.maxHeight = '0';
        filterPanel.style.overflow = 'hidden';
        filterPanel.style.display = 'none';
        filterPanel.classList.remove('active');
        
        // Initialize year sliders
        initYearSliders();
        
        // Set up event listeners
        filterBtn.addEventListener('click', toggleFilterPanel);
        applyFiltersBtn.addEventListener('click', applyFilters);
        resetFiltersBtn.addEventListener('click', resetFilters);
        
        // Initially populate the filter options
        populateFilterOptions();
        
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
        
        console.log("Filter functionality initialized successfully");
    }
    
    // Initialize year sliders
    function initYearSliders() {
        if (!yearSliderMin || !yearSliderMax) return;
        
        // Determine the actual year range in the data
        calculateYearRange();
        
        // Update slider min/max attributes
        yearSliderMin.min = dataYearRange.min;
        yearSliderMin.max = dataYearRange.max;
        yearSliderMax.min = dataYearRange.min;
        yearSliderMax.max = dataYearRange.max;
        
        // Set initial values
        yearSliderMin.value = dataYearRange.min;
        yearSliderMax.value = dataYearRange.max;
        
        // Update display values
        yearMinDisplay.textContent = dataYearRange.min;
        yearMaxDisplay.textContent = dataYearRange.max;
        
        // Set active filter values
        activeFilters.yearRange.min = dataYearRange.min;
        activeFilters.yearRange.max = dataYearRange.max;
        
        // Add event listeners for sliders
        yearSliderMin.addEventListener('input', function() {
            // Ensure min never exceeds max
            if (parseInt(this.value) > parseInt(yearSliderMax.value)) {
                this.value = yearSliderMax.value;
            }
            yearMinDisplay.textContent = this.value;
            activeFilters.yearRange.min = parseInt(this.value);
        });
        
        yearSliderMax.addEventListener('input', function() {
            // Ensure max never falls below min
            if (parseInt(this.value) < parseInt(yearSliderMin.value)) {
                this.value = yearSliderMin.value;
            }
            yearMaxDisplay.textContent = this.value;
            activeFilters.yearRange.max = parseInt(this.value);
        });
    }
    
    // Calculate the year range from the actual data
    function calculateYearRange() {
        if (!trackLoader || !trackLoader.isInitialized || !trackLoader.tracks) {
            return;
        }
        
        let minYear = 3000; // Start with a high year
        let maxYear = 1000; // Start with a low year
        
        // Check all tracks for valid years
        trackLoader.tracks.forEach(track => {
            if (track.year && track.year !== 'unknown') {
                // Try to extract a valid year
                const yearNum = extractYear(track.year);
                if (yearNum) {
                    minYear = Math.min(minYear, yearNum);
                    maxYear = Math.max(maxYear, yearNum);
                }
            }
        });
        
        // Set reasonable defaults if no valid years found
        if (minYear === 3000) minYear = 1900;
        if (maxYear === 1000) maxYear = new Date().getFullYear();
        
        // Round down min year to nearest decade
        minYear = Math.floor(minYear / 10) * 10;
        // Round up max year to nearest decade
        maxYear = Math.ceil(maxYear / 10) * 10;
        
        dataYearRange.min = minYear;
        dataYearRange.max = maxYear;
        
        console.log(`Year range in data: ${minYear} - ${maxYear}`);
    }
    
    // Extract a valid year from a string
    function extractYear(yearString) {
        // Handle year ranges like "1913-1914"
        if (yearString.includes('-')) {
            const years = yearString.split('-');
            return parseInt(years[0]);
        }
        
        // Try to extract a 4-digit year from the string
        const yearMatch = yearString.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            return parseInt(yearMatch[0]);
        }
        
        // If it's just a number, check if it's reasonable
        const yearNum = parseInt(yearString);
        if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear()) {
            return yearNum;
        }
        
        return null;
    }
    
    // Toggle filter panel visibility
    function toggleFilterPanel() {
        console.log("Toggle filter panel called");
        
        if (filterPanel.classList.contains('active')) {
            // Hide panel
            filterPanel.classList.remove('active');
            filterBtn.classList.remove('active');
            
            // First set max-height to 0 for the transition
            filterPanel.style.maxHeight = '0';
            
            // Then hide after transition
            setTimeout(() => {
                filterPanel.style.display = 'none';
            }, 300);
        } else {
            // Show panel
            filterPanel.style.display = 'block';
            
            // Force a reflow to make sure display change takes effect
            void filterPanel.offsetWidth;
            
            // Then add active class and set max-height
            filterPanel.classList.add('active');
            filterBtn.classList.add('active');
            filterPanel.style.maxHeight = '800px'; // Set a safe large value
            
            // Repopulate filter options when showing
            populateFilterOptions();
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
        
        // Extract unique regions (filtering out empty and unknown)
        const regions = [...new Set(allTracks
            .map(track => track.region)
            .filter(region => region && region.trim() !== '' && region.toLowerCase() !== 'unknown')
        )].sort();
        
        // Extract unique collections (filtering out empty and unknown)
        const collections = [...new Set(allTracks
            .map(track => track.collection_name)
            .filter(collection => collection && collection.trim() !== '' && collection.toLowerCase() !== 'unknown')
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
        if (!container) return;
        
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
        
        // Apply year range filter
        filteredTracks = filteredTracks.filter(track => {
            if (!track.year || track.year === 'unknown') {
                // For tracks with unknown year, include only if filtering by "unknown"
                // Default to including them
                return true;
            }
            
            const year = extractYear(track.year);
            if (!year) return true; // Include if can't parse year
            
            return year >= activeFilters.yearRange.min && year <= activeFilters.yearRange.max;
        });
        
        if (filteredTracks.length === 0) {
            alert('No tracks match the selected filters. Please adjust your filter criteria.');
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
        // Clear active region and collection filters
        activeFilters.regions = [];
        activeFilters.collections = [];
        
        // Reset year range to data min/max
        activeFilters.yearRange.min = dataYearRange.min;
        activeFilters.yearRange.max = dataYearRange.max;
        
        // Reset UI - region and collection options
        const filterOptions = document.querySelectorAll('.filter-option');
        filterOptions.forEach(option => option.classList.remove('active'));
        
        // Reset year sliders
        if (yearSliderMin && yearSliderMax) {
            yearSliderMin.value = dataYearRange.min;
            yearSliderMax.value = dataYearRange.max;
            yearMinDisplay.textContent = dataYearRange.min;
            yearMaxDisplay.textContent = dataYearRange.max;
        }
        
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
        const existingMessages = document.querySelectorAll('.share-success, .filter-feedback');
        existingMessages.forEach(el => el.remove());
        
        // Create feedback element
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'filter-feedback';
        
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
        const hasActiveFilters = 
            activeFilters.regions.length > 0 || 
            activeFilters.collections.length > 0 ||
            (activeFilters.yearRange.min > dataYearRange.min || 
             activeFilters.yearRange.max < dataYearRange.max);
        
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
        
        if (activeFilters.yearRange.min > dataYearRange.min || 
            activeFilters.yearRange.max < dataYearRange.max) {
            parts.push(`Years: ${activeFilters.yearRange.min} - ${activeFilters.yearRange.max}`);
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
                max-height: 800px;
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
            
            /* Year range slider styling */
            .year-range-container {
                margin-bottom: 20px;
            }
            
            .year-slider-controls {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .year-slider {
                flex: 1;
                margin: 0 15px;
            }
            
            .year-slider-input {
                width: 100%;
                -webkit-appearance: none;
                appearance: none;
                height: 5px;
                background: var(--progress-bg, rgba(255, 255, 255, 0.2));
                border-radius: 5px;
                outline: none;
            }
            
            .year-slider-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: var(--accent-color, #e6c200);
                cursor: pointer;
            }
            
            .year-slider-input::-moz-range-thumb {
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: var(--accent-color, #e6c200);
                cursor: pointer;
                border: none;
            }
            
            .year-display {
                font-size: 0.9rem;
                padding: 5px 10px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                text-align: center;
                min-width: 60px;
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
            
            /* Filter feedback styling */
            .filter-feedback {
                background-color: rgba(46, 204, 113, 0.2);
                color: var(--success-color, #2ecc71);
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
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(10px); }
                10% { opacity: 1; transform: translateY(0); }
                80% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
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
                
                .year-slider-controls {
                    flex-direction: column;
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
