// filters.js - Region and Year Range Filters for Georgian Polyphony Player

// Class to handle all filtering logic
class MusicFilters {
    constructor() {
        this.filterContainer = null;
        this.yearRangeSlider = null;
        this.regionSelector = null;
        this.minYearSpan = null;
        this.maxYearSpan = null;
        this.applyButton = null;
        this.clearButton = null;
        
        // Filter state
        this.selectedRegions = [];
        this.yearRange = {
            min: 1900,
            max: 2025,
            current: {
                min: 1900,
                max: 2025
            }
        };
        
        // For storing available regions dynamically
        this.availableRegions = [];
        
        // For storing min/max years in the collection
        this.databaseYearRange = {
            min: 1900,
            max: 2025
        };
        
        // Flag to indicate if filters are active
        this.filtersActive = false;
    }
    
    // Initialize filter component
    initialize() {
        // Create filters container
        this.createFilterContainer();
        
        // Extract regions and years from the track database
        this.analyzeTrackDatabase();
        
        // Create filter components
        this.createRegionFilter();
        this.createYearRangeFilter();
        this.createFilterButtons();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Return the container element for insertion into the DOM
        return this.filterContainer;
    }
    
    // Create the main filter container
    createFilterContainer() {
        this.filterContainer = document.createElement('div');
        this.filterContainer.className = 'filters-container';
        this.filterContainer.innerHTML = `
            <div class="filters-header">
                <h3>Filter Tracks</h3>
                <button id="toggle-filters-btn" class="toggle-filters-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
                    </svg>
                    Filter
                </button>
            </div>
            <div class="filters-content" style="display: none;">
                <div class="filter-section region-filter">
                    <label for="region-select">Region:</label>
                    <div class="region-select-wrapper">
                        <select id="region-select" multiple>
                            <!-- Regions will be added dynamically -->
                        </select>
                    </div>
                </div>
                <div class="filter-section year-filter">
                    <label>Year Range:</label>
                    <div class="year-slider-container">
                        <div class="year-slider-track">
                            <input type="range" id="year-min-slider" min="1900" max="2025" value="1900">
                            <input type="range" id="year-max-slider" min="1900" max="2025" value="2025">
                        </div>
                        <div class="year-display">
                            <span id="min-year">1900</span>
                            <span class="year-separator">-</span>
                            <span id="max-year">2025</span>
                        </div>
                    </div>
                </div>
                <div class="filter-buttons">
                    <button id="apply-filters-btn" class="apply-filters-btn">Apply Filters</button>
                    <button id="clear-filters-btn" class="clear-filters-btn">Clear Filters</button>
                </div>
            </div>
        `;
    }
    
    // Analyze track database to find all regions and year ranges
    analyzeTrackDatabase() {
        // Make sure trackLoader is initialized
        if (!trackLoader || !trackLoader.isInitialized || !trackLoader.tracks) {
            console.error('Track loader not initialized or no tracks available');
            return;
        }
        
        const tracks = trackLoader.tracks;
        const regions = new Set();
        let minYear = 3000;
        let maxYear = 1000;
        
        // Extract regions and years
        tracks.forEach(track => {
            // Add region if available
            if (track.region && track.region.trim() !== '') {
                regions.add(track.region.trim());
            }
            
            // Update min/max years
            if (track.year && track.year.trim() !== '') {
                // Extract year - handle formats like "1907", "unknown", "1930s", etc.
                const yearMatch = track.year.match(/\b(19\d\d|20\d\d)\b/);
                if (yearMatch) {
                    const year = parseInt(yearMatch[0]);
                    if (!isNaN(year)) {
                        minYear = Math.min(minYear, year);
                        maxYear = Math.max(maxYear, year);
                    }
                }
            }
        });
        
        // Update available regions (sorted alphabetically)
        this.availableRegions = Array.from(regions).sort();
        
        // Update database year range with some padding
        // Use reasonable values if we couldn't extract good ones
        if (minYear === 3000 || maxYear === 1000) {
            minYear = 1900;
            maxYear = 2025;
        } else {
            // Add a bit of padding
            minYear = Math.max(1900, minYear - 5);
            maxYear = Math.min(2025, maxYear + 5);
        }
        
        this.databaseYearRange = {
            min: minYear,
            max: maxYear
        };
        
        this.yearRange = {
            min: minYear,
            max: maxYear,
            current: {
                min: minYear,
                max: maxYear
            }
        };
        
        console.log(`Detected ${this.availableRegions.length} regions and year range: ${minYear}-${maxYear}`);
    }
    
    // Create region filter dropdown
    createRegionFilter() {
        this.regionSelector = this.filterContainer.querySelector('#region-select');
        
        // Clear any existing options
        this.regionSelector.innerHTML = '';
        
        // Add regions as options
        this.availableRegions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            this.regionSelector.appendChild(option);
        });
    }
    
    // Create year range slider
    createYearRangeFilter() {
        // Get slider elements
        const minSlider = this.filterContainer.querySelector('#year-min-slider');
        const maxSlider = this.filterContainer.querySelector('#year-max-slider');
        this.minYearSpan = this.filterContainer.querySelector('#min-year');
        this.maxYearSpan = this.filterContainer.querySelector('#max-year');
        
        // Update slider ranges and values based on database
        minSlider.min = maxSlider.min = this.databaseYearRange.min;
        minSlider.max = maxSlider.max = this.databaseYearRange.max;
        minSlider.value = this.databaseYearRange.min;
        maxSlider.value = this.databaseYearRange.max;
        
        // Update display values
        this.minYearSpan.textContent = this.databaseYearRange.min;
        this.maxYearSpan.textContent = this.databaseYearRange.max;
        
        // Store references
        this.yearMinSlider = minSlider;
        this.yearMaxSlider = maxSlider;
    }
    
    // Create apply and clear filter buttons
    createFilterButtons() {
        this.applyButton = this.filterContainer.querySelector('#apply-filters-btn');
        this.clearButton = this.filterContainer.querySelector('#clear-filters-btn'); 
    }
    
    // Set up event listeners for all filter components
    setupEventListeners() {
        // Toggle filters display
        const toggleBtn = this.filterContainer.querySelector('#toggle-filters-btn');
        const filtersContent = this.filterContainer.querySelector('.filters-content');
        
        toggleBtn.addEventListener('click', () => {
            const isVisible = filtersContent.style.display !== 'none';
            filtersContent.style.display = isVisible ? 'none' : 'block';
            
            // Update button text
            toggleBtn.innerHTML = isVisible 
                ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                     <path fill="none" d="M0 0h24v24H0z"/>
                     <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
                   </svg> Filter` 
                : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                     <path fill="none" d="M0 0h24v24H0z"/>
                     <path d="M7 11v2h10v-2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                   </svg> Close`;
        });
        
        // Year range sliders
        this.yearMinSlider.addEventListener('input', () => {
            // Ensure min doesn't exceed max
            if (parseInt(this.yearMinSlider.value) > parseInt(this.yearMaxSlider.value)) {
                this.yearMinSlider.value = this.yearMaxSlider.value;
            }
            
            // Update display
            this.minYearSpan.textContent = this.yearMinSlider.value;
        });
        
        this.yearMaxSlider.addEventListener('input', () => {
            // Ensure max doesn't go below min
            if (parseInt(this.yearMaxSlider.value) < parseInt(this.yearMinSlider.value)) {
                this.yearMaxSlider.value = this.yearMinSlider.value;
            }
            
            // Update display
            this.maxYearSpan.textContent = this.yearMaxSlider.value;
        });
        
        // Apply filters button
        this.applyButton.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Clear filters button
        this.clearButton.addEventListener('click', () => {
            this.clearFilters();
        });
    }
    
    // Apply selected filters
    applyFilters() {
        // Get selected regions
        this.selectedRegions = Array.from(this.regionSelector.selectedOptions).map(option => option.value);
        
        // Get selected year range
        this.yearRange.current.min = parseInt(this.yearMinSlider.value);
        this.yearRange.current.max = parseInt(this.yearMaxSlider.value);
        
        // Set filter active flag
        this.filtersActive = this.selectedRegions.length > 0 || 
                            this.yearRange.current.min > this.databaseYearRange.min ||
                            this.yearRange.current.max < this.databaseYearRange.max;
        
        // Filter the tracks
        this.filterTracks();
        
        // Update UI to indicate active filters
        this.updateFilterUI();
    }
    
    // Clear all filters
    clearFilters() {
        // Reset selected regions
        for (let i = 0; i < this.regionSelector.options.length; i++) {
            this.regionSelector.options[i].selected = false;
        }
        this.selectedRegions = [];
        
        // Reset year range
        this.yearMinSlider.value = this.databaseYearRange.min;
        this.yearMaxSlider.value = this.databaseYearRange.max;
        this.minYearSpan.textContent = this.databaseYearRange.min;
        this.maxYearSpan.textContent = this.databaseYearRange.max;
        
        this.yearRange.current.min = this.databaseYearRange.min;
        this.yearRange.current.max = this.databaseYearRange.max;
        
        // Set filter active flag
        this.filtersActive = false;
        
        // Apply the reset filters (shows all tracks)
        this.filterTracks();
        
        // Update UI to indicate no active filters
        this.updateFilterUI();
    }
    
    // Update UI to indicate active filters
    updateFilterUI() {
        const toggleBtn = this.filterContainer.querySelector('#toggle-filters-btn');
        
        if (this.filtersActive) {
            toggleBtn.classList.add('filters-active');
            // Show active filter count
            let activeFilterCount = 0;
            if (this.selectedRegions.length > 0) activeFilterCount++;
            if (this.yearRange.current.min > this.databaseYearRange.min || 
                this.yearRange.current.max < this.databaseYearRange.max) activeFilterCount++;
            
            toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
                </svg>
                Filter <span class="filter-badge">${activeFilterCount}</span>
            `;
        } else {
            toggleBtn.classList.remove('filters-active');
            toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
                </svg>
                Filter
            `;
        }
    }
    
    // Filter tracks based on selected criteria
    filterTracks() {
        // Make sure trackLoader is initialized
        if (!trackLoader || !trackLoader.isInitialized || !trackLoader.tracks) {
            console.error('Track loader not initialized or no tracks available');
            return;
        }
        
        // Original full track list
        const allTracks = trackLoader.tracks;
        
        // If no filters are active, use a filtered shuffled playlist
        if (!this.filtersActive) {
            tracks = trackLoader.getFilteredShuffledPlaylist();
            console.log('No filters active, using standard shuffled playlist');
            
            // Update UI and load first track
            this.updatePlayerAfterFiltering();
            return;
        }
        
        // Otherwise, apply the selected filters
        console.log(`Filtering tracks by ${this.selectedRegions.length} regions and year range: ${this.yearRange.current.min}-${this.yearRange.current.max}`);
        
        // Filter tracks by region and year
        const filteredTracks = allTracks.filter(track => {
            // Check region filter if regions are selected
            const passesRegionFilter = this.selectedRegions.length === 0 || 
                                      (track.region && this.selectedRegions.includes(track.region.trim()));
            
            // Check year filter if a specific range is selected
            let passesYearFilter = true;
            if (track.year && track.year.trim() !== '') {
                // Extract year - handle formats like "1907", "unknown", "1930s", etc.
                const yearMatch = track.year.match(/\b(19\d\d|20\d\d)\b/);
                if (yearMatch) {
                    const year = parseInt(yearMatch[0]);
                    if (!isNaN(year)) {
                        passesYearFilter = year >= this.yearRange.current.min && year <= this.yearRange.current.max;
                    }
                } else if (track.year.toLowerCase().includes('unknown')) {
                    // For unknown years, we include them in all searches to be inclusive
                    passesYearFilter = true;
                } else {
                    // If we can't parse the year but it's not "unknown", assume it doesn't match
                    passesYearFilter = false;
                }
            }
            
            return passesRegionFilter && passesYearFilter;
        });
        
        // Shuffle the filtered tracks
        const shuffledFilteredTracks = this.shuffleArray(filteredTracks);
        
        // Update the main tracks array
        if (shuffledFilteredTracks.length > 0) {
            tracks = shuffledFilteredTracks;
            console.log(`Found ${tracks.length} tracks matching the selected filters`);
        } else {
            // If no tracks match, show a message and keep the current tracks
            console.log('No tracks match the selected filters');
            
            // Show an error message to the user
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('No tracks match the selected filters. Try different criteria.');
            } else {
                alert('No tracks match the selected filters. Try different criteria.');
            }
            
            // Don't update the tracks or player
            return;
        }
        
        // Update UI and load first track
        this.updatePlayerAfterFiltering();
    }
    
    // Update player after filtering
    updatePlayerAfterFiltering() {
        // Reset history
        if (typeof playHistory !== 'undefined') {
            playHistory = [];
        }
        
        // Load the first track of the filtered playlist
        if (typeof loadTrack === 'function' && tracks.length > 0) {
            loadTrack(0);
        }
        
        // Update navigation buttons if the function exists
        if (typeof updateNavigationButtons === 'function') {
            updateNavigationButtons();
        }
    }
    
    // Shuffle helper function using Fisher-Yates algorithm
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Function to initialize and add filters to the page
function initializeFilters() {
    // Wait for the DOM and track loader to be ready
    const waitForElements = setInterval(() => {
        if (document.querySelector('.container') && 
            typeof trackLoader !== 'undefined' && 
            trackLoader.isInitialized) {
            
            clearInterval(waitForElements);
            
            // Create and add filters
            const musicFilters = new MusicFilters();
            const filterElement = musicFilters.initialize();
            
            // Add filters before the player container
            const container = document.querySelector('.container');
            const playerContainer = document.querySelector('.player-container');
            
            container.insertBefore(filterElement, playerContainer);
            
            // Add CSS for filters
            addFilterStyles();
            
            console.log('Filters initialized and added to the page');
        }
    }, 500);
    
    // Set a timeout to stop checking after 10 seconds
    setTimeout(() => {
        clearInterval(waitForElements);
        console.warn('Timeout waiting for DOM elements or track loader');
    }, 10000);
}

// Function to add CSS styles for filters
function addFilterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Filter Container Styles */
        .filters-container {
            background-color: var(--player-bg, #111111);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            color: var(--text-color, #ffffff);
        }
        
        .filters-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .filters-header h3 {
            margin: 0;
            font-size: 1.3rem;
            color: var(--accent-color, #e6c200);
        }
        
        .toggle-filters-btn {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 8px 12px;
            background-color: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 5px;
            color: var(--text-color, #ffffff);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .toggle-filters-btn:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        
        .filters-active {
            background-color: var(--accent-color, #e6c200) !important;
            color: #000 !important;
        }
        
        .filter-badge {
            display: inline-block;
            background-color: rgba(0, 0, 0, 0.3);
            color: inherit;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 12px;
            line-height: 18px;
            text-align: center;
            margin-left: 5px;
        }
        
        .filters-content {
            margin-top: 15px;
        }
        
        .filter-section {
            margin-bottom: 20px;
        }
        
        .filter-section label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: var(--accent-color, #e6c200);
        }
        
        /* Region Select Styles */
        .region-select-wrapper {
            position: relative;
        }
        
        #region-select {
            width: 100%;
            padding: 10px;
            background-color: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            color: var(--text-color, #ffffff);
            min-height: 100px;
            max-height: 150px;
            overflow-y: auto;
        }
        
        #region-select option {
            padding: 5px;
            background-color: var(--player-bg, #111111);
        }
        
        #region-select option:checked {
            background-color: var(--accent-color, #e6c200);
            color: #000;
        }
        
        /* Year Range Slider Styles */
        .year-slider-container {
            padding: 10px 5px;
        }
        
        .year-slider-track {
            position: relative;
            height: 30px;
            margin-bottom: 10px;
        }
        
        input[type="range"] {
            -webkit-appearance: none;
            position: absolute;
            width: 100%;
            height: 5px;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.2);
            outline: none;
            pointer-events: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--accent-color, #e6c200);
            cursor: pointer;
            pointer-events: auto;
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--accent-color, #e6c200);
            cursor: pointer;
            pointer-events: auto;
            border: none;
        }
        
        .year-display {
            display: flex;
            justify-content: center;
            gap: 10px;
            font-size: 0.9rem;
        }
        
        /* Filter Buttons */
        .filter-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .apply-filters-btn, .clear-filters-btn {
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: bold;
        }
        
        .apply-filters-btn {
            background-color: var(--accent-color, #e6c200);
            color: #000;
            flex: 2;
        }
        
        .clear-filters-btn {
            background-color: rgba(255, 255, 255, 0.1);
            color: var(--text-color, #ffffff);
            flex: 1;
        }
        
        .apply-filters-btn:hover {
            background-color: #f7d333;
        }
        
        .clear-filters-btn:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Responsive Styles */
        @media (max-width: 600px) {
            .filters-header h3 {
                font-size: 1.1rem;
            }
            
            .filter-buttons {
                flex-direction: column;
            }
            
            .toggle-filters-btn, .apply-filters-btn, .clear-filters-btn {
                padding: 8px 10px;
                font-size: 0.9rem;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize filters when page loads
document.addEventListener('DOMContentLoaded', initializeFilters);
