// filter-tracks.js - Filtering functionality for Georgian Polyphony Player
// Adds region and collection filtering options with improved year range slider

(function() {
    // Global state for filters
    const activeFilters = {
        regions: [],
        yearRange: { min: 1900, max: 2025 }
    };
    
    // DOM elements
    const filterBtn = document.getElementById('filter-btn');
    const filterPanel = document.getElementById('filter-panel');
    const regionFiltersContainer = document.getElementById('region-filters');
    const yearRangeContainer = document.getElementById('year-range-container');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    
    // Flag to prevent duplicate initialization
    let isInitialized = false;
    
    // Wait for window globals to be available
    let checkForAppReady = setInterval(() => {
        // Check if key variables and functions exist
        if (typeof tracks !== 'undefined' && 
            typeof currentTrackIndex !== 'undefined' && 
            typeof loadTrack === 'function' &&
            typeof trackLoader !== 'undefined' && 
            filterBtn && filterPanel) {
            
            clearInterval(checkForAppReady);
            console.log("App is ready, initializing filter functionality");
            
            // Initialize filter functionality if not already initialized
            if (!isInitialized) {
                isInitialized = true;
                initFilterFunctionality();
            }
        }
    }, 500);
    
    // Set a timeout to stop checking after 10 seconds
    setTimeout(() => {
        clearInterval(checkForAppReady);
        console.log("Timeout waiting for app to be ready. Filter functionality may not work correctly.");
    }, 10000);
    
    // Initialize filter functionality
    function initFilterFunctionality() {
        // Set up event listeners
        filterBtn.addEventListener('click', toggleFilterPanel);
        applyFiltersBtn.addEventListener('click', applyFilters);
        resetFiltersBtn.addEventListener('click', resetFilters);
        
        // Initially populate the filter options
        populateFilterOptions();
    }
    
    // Toggle filter panel visibility
    function toggleFilterPanel() {
        filterPanel.classList.toggle('active');
        filterBtn.classList.toggle('active');
        
        // Re-populate filter options when opening panel
        if (filterPanel.classList.contains('active')) {
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
    
    // Function to populate year range slider - UNIFIED RANGE SLIDER
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
        
        const rangeSliderContainer = document.createElement('div');
        rangeSliderContainer.className = 'range-slider-container';
        
        const maxYearDisplay = document.createElement('span');
        maxYearDisplay.className = 'year-display max-year';
        maxYearDisplay.textContent = activeFilters.yearRange.max;
        
        // Create the slider element
        const rangeSlider = document.createElement('div');
        rangeSlider.className = 'range-slider';
        rangeSlider.id = 'year-range-slider';
        
        // Append elements to container
        rangeSliderContainer.appendChild(rangeSlider);
        
        sliderContainer.appendChild(minYearDisplay);
        sliderContainer.appendChild(rangeSliderContainer);
        sliderContainer.appendChild(maxYearDisplay);
        
        yearRangeContainer.appendChild(yearSliderLabel);
        yearRangeContainer.appendChild(sliderContainer);
        
        // Add custom CSS and script to create noUiSlider
        addSliderStyles();
        
        // Initialize the slider after a short delay to ensure DOM is ready
        setTimeout(() => {
            initializeRangeSlider(minYear, maxYear, rangeSlider, minYearDisplay, maxYearDisplay);
        }, 100);
    }
    
    // Function to initialize noUiSlider for the year range
    function initializeRangeSlider(minYear, maxYear, sliderElement, minDisplay, maxDisplay) {
        // Check if noUiSlider is available
        if (typeof noUiSlider === 'undefined') {
            // If not available, dynamically load it
            loadNoUiSlider(() => {
                createRangeSlider(minYear, maxYear, sliderElement, minDisplay, maxDisplay);
            });
        } else {
            // If already available, create the slider
            createRangeSlider(minYear, maxYear, sliderElement, minDisplay, maxDisplay);
        }
    }
    
    // Function to dynamically load noUiSlider
    function loadNoUiSlider(callback) {
        // Create script element for noUiSlider
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/nouislider@14.6.3/distribute/nouislider.min.js';
        script.onload = () => {
            // Create stylesheet for noUiSlider
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/nouislider@14.6.3/distribute/nouislider.min.css';
            link.onload = callback;
            document.head.appendChild(link);
        };
        document.head.appendChild(script);
    }
    
    // Function to create the range slider with noUiSlider
    function createRangeSlider(minYear, maxYear, sliderElement, minDisplay, maxDisplay) {
        // If the slider already has noUiSlider initialized, destroy it first
        if (sliderElement.noUiSlider) {
            sliderElement.noUiSlider.destroy();
        }
        
        // Create the noUiSlider
        noUiSlider.create(sliderElement, {
            start: [activeFilters.yearRange.min, activeFilters.yearRange.max],
            connect: true,
            step: 1,
            range: {
                'min': minYear,
                'max': maxYear
            },
            format: {
                to: value => Math.round(value),
                from: value => Math.round(value)
            }
        });
        
        // Update the displays when the slider values change
        sliderElement.noUiSlider.on('update', (values, handle) => {
            if (handle === 0) {
                minDisplay.textContent = values[0];
                activeFilters.yearRange.min = parseInt(values[0]);
            } else {
                maxDisplay.textContent = values[1];
                activeFilters.yearRange.max = parseInt(values[1]);
            }
        });
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
        
        // Shuffle the filtered tracks
        const shuffledFilteredTracks = shuffleArray([...filteredTracks]);
        
        // Update the global tracks array
        tracks = shuffledFilteredTracks;
        
        // Load the first track of the filtered list
        loadTrack(0);
        
        // Close filter panel
        filterPanel.classList.remove('active');
        filterBtn.classList.remove('active');
        
        // Update the filter button state
        updateFilterButtonState();
        
        // Update clear button state
        if (typeof updateClearButtonState === 'function') {
            updateClearButtonState();
        }
        
        // Show feedback to the user about how many tracks are in the filtered list
        showFilterFeedback(filteredTracks.length);
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
        
        // Repopulate the filter options to reset the slider UI
        populateFilterOptions();
        
        // If we're already in a filtered state, reset to the full playlist
        if (isFilterActive) {
            // Update the filtered state
            isFilterActive = false;
            
            // Reset filter button state
            filterBtn.classList.remove('has-filters');
            
            // Use the filtered shuffle method to get an optimal playlist
            tracks = trackLoader.getFilteredShuffledPlaylist();
            
            // Load the first track
            loadTrack(0);
            
            // Close filter panel
            filterPanel.classList.remove('active');
            filterBtn.classList.remove('active');
            
            // Show feedback
            showFilterFeedback(tracks.length, true);
        }
        
        // Update clear button state if it exists
        if (typeof updateClearButtonState === 'function') {
            updateClearButtonState();
        }
    }
    
    // Show feedback after applying filters
    function showFilterFeedback(trackCount, isReset = false) {
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
    
    // Function to show error message
    function showErrorMessage(message) {
        // Check if there's already an existing global showErrorMessage function
        if (typeof window.showErrorMessage === 'function') {
            window.showErrorMessage(message);
            return;
        }
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'audio-error';
        errorElement.textContent = message;
        
        // Add to player container
        const playerContainer = document.querySelector('.player-container');
        if (playerContainer) {
            playerContainer.appendChild(errorElement);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
                }
            }, 5000);
        }
    }
    
    // Update filter button state
    function updateFilterButtonState() {
        if (isFilterActive) {
            filterBtn.classList.add('has-filters');
        } else {
            filterBtn.classList.remove('has-filters');
        }
    }
    
    // Helper function to get current filters as text for description
    function getActiveFiltersDescription() {
        const parts = [];
        
        if (activeFilters.regions.length > 0) {
            parts.push(`Regions: ${activeFilters.regions.join(', ')}`);
        }
        
        if (activeFilters.yearRange.min > 1900 || activeFilters.yearRange.max < 2025) {
            parts.push(`Years: ${activeFilters.yearRange.min} - ${activeFilters.yearRange.max}`);
        }
        
        return parts.length > 0 ? 
            `Filtered by: ${parts.join(' | ')}` : 
            'Showing all tracks';
    }
    
    // Add keyboard shortcut - 'F' to toggle filter panel
    document.addEventListener('keydown', function(e) {
        // Only process if filter elements exist
        if (!filterBtn || !filterPanel) return;
        
        // Check for 'F' key
        if (e.key === 'f' || e.key === 'F') {
            // Don't trigger if user is typing in an input field
            if (document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                toggleFilterPanel();
            }
        }
    });
    
    // Add custom CSS specifically for the slider
    function addSliderStyles() {
        // Check if slider styles already exist
        if (document.querySelector('style[data-slider-styles="true"]')) {
            return;
        }
        
        const style = document.createElement('style');
        style.setAttribute('data-slider-styles', 'true');
        style.textContent = `
            /* Range Slider Container */
            .year-slider-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 15px 0;
                width: 100%;
            }
            
            .range-slider-container {
                flex-grow: 1;
                margin: 0 15px;
                height: 30px;
                display: flex;
                align-items: center;
            }
            
            .year-display {
                min-width: 50px;
                text-align: center;
                background-color: rgba(255, 255, 255, 0.1);
                color: var(--accent-color);
                padding: 3px 8px;
                border-radius: 10px;
                font-size: 0.9rem;
                font-weight: bold;
            }
            
            /* Custom noUiSlider Styling */
            .range-slider {
                height: 6px;
                width: 100%;
            }
            
            .noUi-target {
                background-color: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 3px;
                box-shadow: none;
                height: 6px;
            }
            
            .noUi-connect {
                background-color: var(--accent-color);
            }
            
            .noUi-handle {
                width: 18px !important;
                height: 18px !important;
                border-radius: 50%;
                background-color: var(--accent-color);
                box-shadow: none;
                border: 2px solid var(--bg-color);
                cursor: pointer;
                right: -9px !important;
                top: -7px !important;
            }
            
            .noUi-handle:before, .noUi-handle:after {
                display: none;
            }
            
            .noUi-handle:hover {
                transform: scale(1.1);
            }
            
            /* Responsive adjustments */
            @media (max-width: 600px) {
                .year-slider-container {
                    flex-direction: row;
                    align-items: center;
                }
                
                .range-slider-container {
                    margin: 0 10px;
                }
                
                .year-display {
                    min-width: 40px;
                    font-size: 0.8rem;
                    padding: 2px 5px;
                }
            }
        `;
        document.head.appendChild(style);
        console.log("Slider styles added");
    }
    
    // Add CSS styles if not present
    function addStyles() {
        // Check if styles already exist
        if (document.querySelector('style[data-filter-styles="true"]')) {
            return;
        }
        
        const style = document.createElement('style');
        style.setAttribute('data-filter-styles', 'true');
        style.textContent = `
            /* Filter panel animation */
            .filter-panel {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-out;
                margin-bottom: 0;
            }
            
            .filter-panel.active {
                max-height: 500px;
                margin-bottom: 30px;
            }
            
            /* Filter indicator */
            .filter-indicator {
                position: absolute;
                top: -8px;
                right: -8px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background-color: var(--accent-color);
                display: none;
            }
            
            .filter-btn.has-filters .filter-indicator {
                display: block;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .filter-indicator {
                animation: pulse 1.5s infinite;
            }
        `;
        document.head.appendChild(style);
        console.log("Filter styles added");
    }
    
    // Add styles
    addStyles();
    
    // Public API for the filter module
    window.trackFilters = {
        getActiveFilters: () => ({...activeFilters}),
        getActiveFiltersDescription: getActiveFiltersDescription,
        resetFilters: resetFilters
    };
})();
