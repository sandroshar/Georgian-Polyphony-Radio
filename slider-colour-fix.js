// slider-color-fix.js - Force the slider elements to use the gold accent color
// This file fixes the blue slider color issue by applying high-specificity CSS rules

(function() {
  // Check if our fix is already applied
  if (document.querySelector('style[data-slider-color-fix="true"]')) {
    return;
  }
  
  const style = document.createElement('style');
  style.setAttribute('data-slider-color-fix', 'true');
  style.textContent = `
    /* Target slider handles with high specificity */
    .filter-panel .slider-handle,
    .range-slider .slider-handle,
    .year-slider-container .slider-handle,
    div.slider-handle {
      background-color: var(--accent-color) !important;
      border-color: var(--bg-color) !important;
    }
    
    /* Target slider fill with high specificity */
    .filter-panel .slider-fill,
    .range-slider .slider-fill,
    .year-slider-container .slider-fill,
    div.slider-fill {
      background-color: var(--accent-color) !important;
    }
    
    /* Target any other potential blue elements in the range slider */
    .noUi-connect,
    [class*="noUi-"],
    [class*="slider-"] {
      background-color: var(--accent-color) !important;
    }
  `;
  
  document.head.appendChild(style);
  console.log("Slider color fix applied");
  
  // Add event listener to apply fix after DOM changes
  document.addEventListener('DOMContentLoaded', () => {
    console.log("Checking for sliders after DOM load");
    
    // Apply fix after a short delay to ensure sliders are rendered
    setTimeout(() => {
      const sliders = document.querySelectorAll('.slider-handle, .slider-fill, [class*="noUi-"]');
      if (sliders.length > 0) {
        console.log(`Found ${sliders.length} slider elements, applying color fix`);
        sliders.forEach(element => {
          element.style.backgroundColor = 'var(--accent-color)';
        });
      }
    }, 1000);
  });
  
  // Also apply fix when filter panel is opened
  const filterBtn = document.getElementById('filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      setTimeout(() => {
        const sliders = document.querySelectorAll('.slider-handle, .slider-fill, [class*="noUi-"]');
        if (sliders.length > 0) {
          console.log(`Found ${sliders.length} slider elements after filter panel open, applying color fix`);
          sliders.forEach(element => {
            element.style.backgroundColor = 'var(--accent-color)';
          });
        }
      }, 300);
    });
  }
})();
