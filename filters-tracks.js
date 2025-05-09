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
    
    // Create a unified range slider
    function populateYearRangeSlider(minYear, maxYear) {
        // Clear previous content
        yearRangeContainer.innerHTML = '';
        
        // Create label
        const yearSliderLabel = document.createElement('h3');
        yearSliderLabel.textContent = 'Filter by Year Range';
        yearRangeContainer.appendChild(yearSliderLabel);
        
        // Create slider container
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'year-slider-container';
        
        // Create min year display
        const minYearDisplay = document.createElement('span');
        minYearDisplay.className = 'year-display min-year';
        minYearDisplay.textContent = activeFilters.yearRange.min;
        sliderContainer.appendChild(minYearDisplay);
        
        // Create slider wrapper
        const sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'slider-wrapper';
        
        // Create the range slider with noUiSlider (create our own implementation)
        const rangeSlider = document.createElement('div');
        rangeSlider.className = 'range-slider';
        
        // Create the track
        const sliderTrack = document.createElement('div');
        sliderTrack.className = 'slider-track';
        
        // Create the selection/fill
        const sliderFill = document.createElement('div');
        sliderFill.className = 'slider-fill';
        
        // Create the min and max handles
        const minHandle = document.createElement('div');
        minHandle.className = 'slider-handle min-handle';
        minHandle.setAttribute('role', 'slider');
        minHandle.setAttribute('aria-valuemin', minYear);
        minHandle.setAttribute('aria-valuemax', maxYear);
        minHandle.setAttribute('aria-valuenow', activeFilters.yearRange.min);
        
        const maxHandle = document.createElement('div');
        maxHandle.className = 'slider-handle max-handle';
        maxHandle.setAttribute('role', 'slider');
        maxHandle.setAttribute('aria-valuemin', minYear);
        maxHandle.setAttribute('aria-valuemax', maxYear);
        maxHandle.setAttribute('aria-valuenow', activeFilters.yearRange.max);
        
        // Add elements to the range slider
        rangeSlider.appendChild(sliderTrack);
        rangeSlider.appendChild(sliderFill);
        rangeSlider.appendChild(minHandle);
        rangeSlider.appendChild(maxHandle);
        
        sliderWrapper.appendChild(rangeSlider);
        sliderContainer.appendChild(sliderWrapper);
        
        // Create max year display
        const maxYearDisplay = document.createElement('span');
        maxYearDisplay.className = 'year-display max-year';
        maxYearDisplay.textContent = activeFilters.yearRange.max;
        sliderContainer.appendChild(maxYearDisplay);
        
        yearRangeContainer.appendChild(sliderContainer);
        
        // Initialize slider functionality
        initRangeSlider(rangeSlider, minHandle, maxHandle, sliderFill, 
            minYearDisplay, maxYearDisplay, minYear, maxYear);
        
        // Add custom slider styles
        addRangeSliderStyles();
    }
    
    // Initialize the custom range slider
    function initRangeSlider(slider, minHandle, maxHandle, fill, minDisplay, maxDisplay, min, max) {
        const range = max - min;
        const sliderRect = slider.getBoundingClientRect();
        const sliderWidth = sliderRect.width;
        
        // Set initial positions
        updateSliderPositions();
        
        // Add event listeners for dragging
        let isDragging = false;
        let currentHandle = null;
        
        function updateSliderPositions() {
            const minValue = activeFilters.yearRange.min;
            const maxValue = activeFilters.yearRange.max;
            
            const minPercent = ((minValue - min) / range) * 100;
            const maxPercent = ((maxValue - min) / range) * 100;
            
            minHandle.style.left = `${minPercent}%`;
            maxHandle.style.left = `${maxPercent}%`;
            
            fill.style.left = `${minPercent}%`;
            fill.style.width = `${maxPercent - minPercent}%`;
            
            minHandle.setAttribute('aria-valuenow', minValue);
            maxHandle.setAttribute('aria-valuenow', maxValue);
            
            minDisplay.textContent = minValue;
            maxDisplay.textContent = maxValue;
        }
        
        function handleMouseDown(e) {
            e.preventDefault();
            isDragging = true;
            currentHandle = e.target;
            
            // Add mouse move and mouse up listeners to document
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // Add touch events for mobile
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
        }
        
        function handleMouseMove(e) {
            if (!isDragging) return;
            
            const sliderRect = slider.getBoundingClientRect();
            const newPosition = (e.clientX - sliderRect.left) / sliderRect.width;
            const newValue = Math.round(min + newPosition * range);
            
            updateHandleValue(newValue);
        }
        
        function handleTouchMove(e) {
            if (!isDragging || !e.touches[0]) return;
            
            const sliderRect = slider.getBoundingClientRect();
            const newPosition = (e.touches[0].clientX - sliderRect.left) / sliderRect.width;
            const newValue = Math.round(min + newPosition * range);
            
            updateHandleValue(newValue);
        }
        
        function updateHandleValue(newValue) {
            // Clamp value to min/max range
            let value = Math.max(min, Math.min(max, newValue));
            
            if (currentHandle === minHandle) {
                // Ensure min handle doesn't go beyond max handle
                value = Math.min(value, activeFilters.yearRange.max);
                activeFilters.yearRange.min = value;
            } else if (currentHandle === maxHandle) {
                // Ensure max handle doesn't go below min handle
                value = Math.max(value, activeFilters.yearRange.min);
                activeFilters.yearRange.max = value;
            }
            
            updateSliderPositions();
        }
        
        function handleClick(e) {
            // Handle click on track to jump to position
            if (e.target === slider || e.target === sliderTrack || e.target === fill) {
                const sliderRect = slider.getBoundingClientRect();
                const clickPosition = (e.clientX - sliderRect.left) / sliderRect.width;
                const clickValue = Math.round(min + clickPosition * range);
                
                // Determine which handle to move based on proximity
                const minDistance = Math.abs(clickValue - activeFilters.yearRange.min);
                const maxDistance = Math.abs(clickValue - activeFilters.yearRange.max);
                
                if (minDistance <= maxDistance) {
                    // Move min handle
                    activeFilters.yearRange.min = Math.min(clickValue, activeFilters.yearRange.max);
                } else {
                    // Move max handle
                    activeFilters.yearRange.max = Math.max(clickValue, activeFilters.yearRange.min);
                }
                
                updateSliderPositions();
            }
        }
        
        function handleMouseUp() {
            isDragging = false;
            currentHandle = null;
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        }
        
        function handleTouchEnd() {
            handleMouseUp();
        }
        
        // Add event listeners
        minHandle.addEventListener('mousedown', handleMouseDown);
        maxHandle.addEventListener('mousedown', handleMouseDown);
        minHandle.addEventListener('touchstart', handleMouseDown);
        maxHandle.addEventListener('touchstart', handleMouseDown);
        slider.addEventListener('click', handleClick);
        
        // Handle window resize
        window.addEventListener('resize', updateSliderPositions);
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
    
    // Add custom CSS for the range slider
    function addRangeSliderStyles() {
        // Check if styles already exist
        if (document.querySelector('style[data-range-slider-styles="true"]')) {
            return;
        }
        
        const style = document.createElement('style');
        style.setAttribute('data-range-slider-styles', 'true');
        style.textContent = `
            /* Year Range Slider styles */
            .year-slider-container {
                display: flex;
                align-items: center;
                margin: 15px 0;
                width: 100%;
            }
            
            .year-display {
                width: 60px;
                text-align: center;
                background-color: rgba(255, 255, 255, 0.1);
                color: var(--accent-color);
                padding: 5px;
                border-radius: 4px;
                font-size: 0.9rem;
                font-weight: bold;
            }
            
            .slider-wrapper {
                flex: 1;
                margin: 0 10px;
                height: 30px;
                display: flex;
                align-items: center;
            }
            
            .range-slider {
                width: 100%;
                height: 6px;
                position: relative;
                background: transparent;
            }
            
            .slider-track {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 6px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }
            
            .slider-fill {
                position: absolute;
                top: 0;
                height: 6px;
                background-color: var(--accent-color);
                border-radius: 3px;
            }
            
            .slider-handle {
                position: absolute;
                top: 50%;
                width: 16px;
                height: 16px;
                background-color: var(--accent-color);
                border-radius: 50%;
                border: 2px solid var(--bg-color);
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                transition: transform 0.1s ease;
            }
            
            .slider-handle:hover {
                transform: translate(-50%, -50%) scale(1.1);
            }
            
            .slider-handle:active {
                transform: translate(-50%, -50%) scale(1.1);
            }
            
            @media (max-width: 600px) {
                .year-slider-container {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .year-display {
                    width: auto;
                    padding: 2px 8px;
                }
                
                .slider-wrapper {
                    width: 100%;
                    margin: 5px 0;
                }
            }
        `;
        document.head.appendChild(style);
        console.log("Range slider styles added");
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
