<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Georgian Polyphony Player</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Georgian Polyphony Player</h1>
            <p class="subtitle">Legendary historical recordings of Georgian traditional music</p>
        </header>

        <div class="search-container">
            <input type="text" id="search-input" placeholder="Search by track name or performer...">
            <button id="search-btn" class="search-btn">Search</button>
            <button id="clear-search-btn" class="clear-btn">Clear</button>
        </div>
        
        <!-- The filter dropdown will be added dynamically here by JavaScript -->

        <div class="player-container">
            <div id="loading-indicator" class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading track...</p>
            </div>
            
            <div id="track-info" class="track-info">
                <h2 id="track-title">Loading...</h2>
                <p id="track-ensemble">Please wait</p>
                <div class="track-metadata">
                    <span id="track-year"></span>
                    <span id="track-region"></span>
                </div>
                <p id="current-track-description" class="track-description"></p>
            </div>

            <!-- Progress slider -->
            <div class="progress-container">
                <span id="current-time">0:00</span>
                <input type="range" min="0" max="100" value="0" id="progress-slider" class="progress-slider">
                <span id="duration">0:00</span>
            </div>

            <div class="controls">
                <button id="prev-btn" class="nav-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82l5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.57.4-.57 1.24 0 1.64z" fill="currentColor"/>
                    </svg>
                </button>
                <button id="play-pause-btn" class="play-btn" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                </button>
                <button id="skip-btn" class="nav-btn" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z" fill="currentColor"/>
                    </svg>
                </button>
                <button id="mute-btn" class="mute-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/>
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/>
                    </svg>
                </button>
                <div class="volume-slider">
                    <input type="range" min="0" max="100" value="50" id="volume-control">
                </div>
            </div>
        </div>

        <footer>
            <p>Special thanks to Alazani.ge</p>
            <p class="contact">Contact: <a href="mailto:sandroshar14@gmail.com">sandroshar14@gmail.com</a></p>
        </footer>
    </div>

    <audio id="audio-player"></audio>
    
    <!-- Include the improved track loader first -->
    <script src="track-loader.js"></script>
    
    <!-- Then include the debug helper if needed -->
    <script src="debug-helper.js"></script>
    
    <!-- Then include the main script -->
    <script src="script.js"></script>
    
    <!-- Finally include the sharing functionality -->
    <script src="share-tracks.js"></script>
</body>
</html><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Georgian Polyphony Player</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Georgian Polyphony Player</h1>
            <p class="subtitle">Legendary historical recordings of Georgian traditional music</p>
        </header>

        <div class="search-container">
            <input type="text" id="search-input" placeholder="Search by track name or performer...">
            <button id="search-btn" class="search-btn">Search</button>
            <button id="clear-search-btn" class="clear-btn">Clear</button>
        </div>
        
        <!-- The filter dropdown will be added dynamically here by JavaScript -->

        <div class="player-container">
            <div id="loading-indicator" class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading track...</p>
            </div>
            
            <div id="track-info" class="track-info">
                <h2 id="track-title">Loading...</h2>
                <p id="track-ensemble">Please wait</p>
                <div class="track-metadata">
                    <span id="track-year"></span>
                    <span id="track-region"></span>
                </div>
                <p id="current-track-description" class="track-description"></p>
            </div>

            <!-- Progress slider -->
            <div class="progress-container">
                <span id="current-time">0:00</span>
                <input type="range" min="0" max="100" value="0" id="progress-slider" class="progress-slider">
                <span id="duration">0:00</span>
            </div>

            <div class="controls">
                <button id="prev-btn" class="nav-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82l5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.57.4-.57 1.24 0 1.64z" fill="currentColor"/>
                    </svg>
                </button>
                <button id="play-pause-btn" class="play-btn" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                </button>
                <button id="skip-btn" class="nav-btn" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z" fill="currentColor"/>
                    </svg>
                </button>
                <button id="mute-btn" class="mute-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="none" d="M0 0h24v24H0z"/>
                        <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/>
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/>
                    </svg>
                </button>
                <div class="volume-slider">
                    <input type="range" min="0" max="100" value="50" id="volume-control">
                </div>
            </div>
        </div>

        <footer>
            <p>Special thanks to Alazani.ge</p>
            <p class="contact">Contact: <a href="mailto:sandroshar14@gmail.com">sandroshar14@gmail.com</a></p>
        </footer>
    </div>

    <audio id="audio-player"></audio>
    
    <!-- Include the improved track loader first -->
    <script src="track-loader.js"></script>
    
    <!-- Then include the debug helper if needed -->
    <script src="debug-helper.js"></script>
    
    <!-- Then include the main script -->
    <script src="script.js"></script>
    
    <!-- Finally include the sharing functionality -->
    <script src="share-tracks.js"></script>
</body>
</html>
