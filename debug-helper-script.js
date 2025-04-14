// Debug Helper for Georgian Polyphony Player
// This script helps with debugging audio loading issues and URL encoding problems

class DebugHelper {
    constructor() {
        this.isDebugMode = false;
        this.debugPanel = null;
        this.logHistory = [];
        this.maxLogHistory = 50;
    }
    
    initialize() {
        // Check for debug mode in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.isDebugMode = urlParams.has('debug');
        
        if (this.isDebugMode) {
            console.log('Debug mode is active');
            this.setupDebugPanel();
            this.setupAudioErrorListener();
            this.monkeyPatchConsole();
            document.body.classList.add('debug-mode');
        }
    }
    
    setupDebugPanel() {
        // Create debug panel
        this.debugPanel = document.createElement('div');
        this.debugPanel.className = 'debug-panel';
        this.debugPanel.innerHTML = '<h3>Debug Panel</h3><div class="debug-log"></div>';
        document.body.appendChild(this.debugPanel);
        
        // Add controls
        const controls = document.createElement('div');
        controls.className = 'debug-controls';
        controls.innerHTML = `
            <button id="debug-clear">Clear Log</button>
            <button id="debug-test-audio">Test Audio</button>
            <button id="debug-show-urls">Show URLs</button>
        `;
        this.debugPanel.insertBefore(controls, this.debugPanel.firstChild);
        
        // Add event listeners
        document.getElementById('debug-clear').addEventListener('click', () => this.clearLog());
        document.getElementById('debug-test-audio').addEventListener('click', () => this.testAudio());
        document.getElementById('debug-show-urls').addEventListener('click', () => this.showAllUrls());
    }
    
    setupAudioErrorListener() {
        // Monitor audio element for errors
        const audioPlayer = document.getElementById('audio-player');
        if (audioPlayer) {
            audioPlayer.addEventListener('error', (e) => {
                const error = audioPlayer.error;
                this.log('Audio Error', {
                    code: error ? error.code : 'unknown',
                    message: error ? error.message : 'No error message',
                    src: audioPlayer.src
                });
                
                // Try to diagnose the error
                this.diagnoseAudioError(audioPlayer);
            });
        }
    }
    
    monkeyPatchConsole() {
        // Store original console methods
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };
        
        // Override console.log
        console.log = (...args) => {
            originalConsole.log(...args);
            this.log('LOG', ...args);
        };
        
        // Override console.warn
        console.warn = (...args) => {
            originalConsole.warn(...args);
            this.log('WARN', ...args);
        };
        
        // Override console.error
        console.error = (...args) => {
            originalConsole.error(...args);
            this.log('ERROR', ...args);
        };
    }
    
    log(type, ...args) {
        if (!this.isDebugMode || !this.debugPanel) return;
        
        // Format the log entry
        const timestamp = new Date().toISOString().substr(11, 8);
        const formattedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return String(arg);
        }).join(' ');
        
        // Create log entry HTML
        const logEntry = document.createElement('div');
        logEntry.className = `debug-log-entry debug-${type.toLowerCase()}`;
        logEntry.innerHTML = `<span class="debug-timestamp">${timestamp}</span> <span class="debug-type">[${type}]</span> <span class="debug-content">${formattedArgs}</span>`;
        
        // Add to debug panel
        const logContainer = this.debugPanel.querySelector('.debug-log');
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Store in history
        this.logHistory.push({ type, timestamp, content: formattedArgs });
        
        // Limit history size
        if (this.logHistory.length > this.maxLogHistory) {
            this.logHistory.shift();
        }
    }
    
    clearLog() {
        if (!this.debugPanel) return;
        
        const logContainer = this.debugPanel.querySelector('.debug-log');
        logContainer.innerHTML = '';
        this.logHistory = [];
    }
    
    testAudio() {
        this.log('INFO', 'Testing audio playback...');
        
        // Create a test audio element
        const testAudio = new Audio();
        
        // Try a known-good audio sample from a CDN
        const testUrl = 'https://cdn.jsdelivr.net/gh/anars/blank-audio/250-milliseconds-of-silence.mp3';
        
        testAudio.src = testUrl;
        testAudio.volume = 0.1; // Low volume for safety
        
        // Set up event listeners
        testAudio.addEventListener('canplaythrough', () => {
            this.log('SUCCESS', 'Test audio loaded successfully');
            testAudio.play()
                .then(() => {
                    this.log('SUCCESS', 'Test audio played successfully');
                })
                .catch(error => {
                    this.log('ERROR', 'Failed to play test audio:', error.message);
                });
        });
        
        testAudio.addEventListener('error', (e) => {
            const error = testAudio.error;
            this.log('ERROR', 'Test audio failed to load:', {
                code: error ? error.code : 'unknown',
                message: error ? error.message : 'No error message'
            });
        });
        
        // Start loading
        testAudio.load();
    }
    
    diagnoseAudioError(audioPlayer) {
        if (!audioPlayer) return;
        
        const src = audioPlayer.src;
        this.log('DIAGNOSE', 'Diagnosing audio error for:', src);
        
        // Check for common issues
        if (!src) {
            this.log('DIAGNOSE', 'No source URL set');
            return;
        }
        
        // Check if URL is malformed
        try {
            new URL(src);
        } catch (e) {
            this.log('DIAGNOSE', 'Malformed URL:', e.message);
            return;
        }
        
        // Check for special characters in URL
        const specialChars = /[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/g;
        const foundSpecialChars = src.match(specialChars);
        if (foundSpecialChars) {
            this.log('DIAGNOSE', 'URL contains unencoded special characters:', foundSpecialChars.join(''));
        }
        
        // Try to fetch the resource with fetch API
        this.log('DIAGNOSE', 'Attempting to fetch the audio file with fetch API...');
        fetch(src, { method: 'HEAD' })
            .then(response => {
                if (!response.ok) {
                    this.log('DIAGNOSE', `Resource not available: ${response.status} ${response.statusText}`);
                } else {
                    this.log('DIAGNOSE', 'Resource is available with fetch, might be a MIME type or CORS issue');
                    // Check response headers
                    const contentType = response.headers.get('content-type');
                    this.log('DIAGNOSE', `Content-Type: ${contentType || 'Not provided'}`);
                    const contentLength = response.headers.get('content-length');
                    this.log('DIAGNOSE', `Content-Length: ${contentLength || 'Not provided'}`);
                }
            })
            .catch(error => {
                this.log('DIAGNOSE', 'Fetch error:', error.message);
            });
        
        // Check if it could be a CORS issue
        if (new URL(src).origin !== window.location.origin) {
            this.log('DIAGNOSE', 'Cross-origin request - might be a CORS issue if server does not allow it');
        }
        
        // Check file extension for unsupported types
        const extension = src.split('.').pop().toLowerCase();
        const supportedTypes = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
        if (!supportedTypes.includes(extension)) {
            this.log('DIAGNOSE', `File extension "${extension}" might not be supported by all browsers`);
        }
    }
    
    showAllUrls() {
        if (!trackLoader || !trackLoader.tracks) {
            this.log('ERROR', 'Track loader not available');
            return;
        }
        
        this.log('INFO', 'Showing all track URLs...');
        
        // Group by collection for cleaner display
        const urlsByCollection = {};
        
        trackLoader.tracks.forEach(track => {
            if (!urlsByCollection[track.collection_id]) {
                urlsByCollection[track.collection_id] = [];
            }
            
            urlsByCollection[track.collection_id].push({
                title: track.title,
                url: track.audioUrl
            });
        });
        
        // Log a sample of URLs from each collection
        Object.keys(urlsByCollection).forEach(collectionId => {
            const urls = urlsByCollection[collectionId];
            this.log('URLS', `${collectionId} (${urls.length} tracks):`);
            
            // Show first 3 URLs from this collection
            urls.slice(0, 3).forEach(item => {
                this.log('URL', `- ${item.title}: ${item.url}`);
            });
        });
        
        this.log('INFO', 'Use browser network inspector to check if these URLs are accessible');
    }
}

// Initialize the debug helper
const debugHelper = new DebugHelper();
document.addEventListener('DOMContentLoaded', () => {
    debugHelper.initialize();
});
