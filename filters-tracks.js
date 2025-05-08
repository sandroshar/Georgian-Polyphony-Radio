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
    
    // Function to populate year range slider
    function populateYearRangeSlider(minYear, maxYear) {
        // Clear previous content
        yearRangeContainer.innerHTML = '';
        
        // Create year range slider elements
        const yearSliderLabel = document.createElement('h3');
        yearSliderLabel.textContent = 'Filter by Year Range';
        
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'year-slider-container';
        
        // Create the slider element
        const rangeSlider = document.createElement('div');
        rangeSlider.className = 'year-range-slider';
        rangeSlider.setAttribute('data-min', minYear);
        rangeSlider.setAttribute('data-max', maxYear);
        
        // Create the connect element for the colored range
        const connectElement = document.createElement('div');
        connectElement.className = 'year-slider-connect';
        
        // Create the min and max handles
        const minHandle = document.createElement('div');
        minHandle.className = 'year-slider-handle min-handle';
        minHandle.setAttribute('role', 'slider');
        
        const maxHandle = document.createElement('div');
        maxHandle.className = 'year-slider-handle max-handle';
        maxHandle.setAttribute('role', 'slider');
        
        // Create tooltips container
        const tooltipsContainer = document.createElement('div');
        tooltipsContainer.className = 'year-slider-tooltips';
        
        const minTooltip = document.createElement('span');
        minTooltip.className = 'year-slider-tooltip min-tooltip';
        minTooltip.textContent = activeFilters.yearRange.min;
        
        const maxTooltip = document.createElement('span');
        maxTooltip.className = 'year-slider-tooltip max-tooltip';
        maxTooltip.textContent = activeFilters.yearRange.max;
        
        // Add elements to the DOM
        rangeSlider.appendChild(connectElement);
        rangeSlider.appendChild(minHandle);
        rangeSlider.appendChild(maxHandle);
        tooltipsContainer.appendChild(minTooltip);
        tooltipsContainer.appendChild(maxTooltip);
        
        sliderContainer.appendChild(rangeSlider);
        sliderContainer.appendChild(tooltipsContainer);
        
        yearRangeContainer.appendChild(yearSliderLabel);
        yearRangeContainer.appendChild(sliderContainer);
        
        // Initialize slider state
        updateSliderPositions();
        
        // Set up event listeners for drag functionality
        setupHandleDrag(minHandle, 'min', minTooltip);
        setupHandleDrag(maxHandle, 'max', maxTooltip);
    }
    
    // Update slider positions based on current values
    function updateSliderPositions() {
        const rangeSlider = document.querySelector('.year-range-slider');
        const minHandle = document.querySelector('.min-handle');
        const maxHandle = document.querySelector('.max-handle');
        const connectElement = document.querySelector('.year-slider-connect');
        
        if (!rangeSlider || !minHandle || !maxHandle || !connectElement) return;
        
        const sliderWidth = rangeSlider.offsetWidth;
        const minYear = parseInt(rangeSlider.getAttribute('data-min')) || 1900;
        const maxYear = parseInt(rangeSlider.getAttribute('data-max')) || 2025;
        const range = maxYear - minYear;
        
        // Calculate positions as percentages
        const minPos = ((activeFilters.yearRange.min - minYear) / range) * 100;
        const maxPos = ((activeFilters.yearRange.max - minYear) / range) * 100;
        
        // Update handles positions
        minHandle.style.left = `${minPos}%`;
        maxHandle.style.left = `${maxPos}%`;
        
        // Update connect element
        connectElement.style.left = `${minPos}%`;
        connectElement.style.width = `${maxPos - minPos}%`;
        
        // Update tooltips
        const minTooltip = document.querySelector('.min-tooltip');
        const maxTooltip = document.querySelector('.max-tooltip');
        
        if (minTooltip) minTooltip.textContent = activeFilters.yearRange.min;
        if (maxTooltip) maxTooltip.textContent = activeFilters.yearRange.max;
    }
    
    // Setup drag for a specific handle
    function setupHandleDrag(handle, type, tooltip) {
        let isDragging = false;
        
        handle.addEventListener('mousedown', startDrag);
        handle.addEventListener('touchstart', startDrag, { passive: false });
        
        function startDrag(e) {
            e.preventDefault && e.preventDefault();
            isDragging = true;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            e.preventDefault && e.preventDefault();
            
            const rangeSlider = document.querySelector('.year-range-slider');
            const rect = rangeSlider.getBoundingClientRect();
            const sliderWidth = rect.width;
            
            // Get the position relative to the slider
            let clientX;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
            } else {
                clientX = e.clientX;
            }
            
            let position = clientX - rect.left;
            position = Math.max(0, Math.min(position, sliderWidth));
            
            // Convert position to percentage
            const percentage = position / sliderWidth;
            
            // Calculate year value based on percentage
            const minYear = parseInt(rangeSlider.getAttribute('data-min')) || 1900;
            const maxYear = parseInt(rangeSlider.getAttribute('data-max')) || 2025;
            const range = maxYear - minYear;
            const year = Math.round(minYear + percentage * range);
            
            // Update the appropriate range value based on handle type
            if (type === 'min') {
                // Ensure min doesn't exceed max
                activeFilters.yearRange.min = Math.min(year, activeFilters.yearRange.max);
            } else {
                // Ensure max doesn't go below min
                activeFilters.yearRange.max = Math.max(year, activeFilters.yearRange.min);
            }
            
            // Update the slider visually
            updateSliderPositions();
        }
        
        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        }
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
        
        // Update the global tracks array
        tracks = filteredTracks;
        
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
        showFilterFeedback(filteredTracks.length);
    }
    
    // Reset all filters
    function resetFilters() {
        // Clear active filters
        activeFilters.regions = [];
        activeFilters.yearRange = { min: 1900, max: 2025 };
        
        // Reset UI
        const filterOptions = document.querySelectorAll('.filter-option');
        filterOptions.forEach(option => option.classList.remove('active'));
        
        // Update the slider UI
        updateSliderPositions();
        
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
