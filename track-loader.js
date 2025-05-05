// Improved Track Loader for Georgian Polyphony Player
// This module parses the comprehensive text database with track IDs
// and ensures balanced representation across collections

class TrackLoader {
    constructor() {
        this.tracks = [];
        this.collectionTracks = {};
        this.isInitialized = false;
        this.cloudFrontDomain = "https://d3mbcwzrk18stt.cloudfront.net";
        this.errorCount = {}; // Track errors by collection
    }

    // Initialize by loading the database
    async initialize() {
        try {
            // Load the database text file
            await this.loadDatabaseFromText();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize the track loader:', error);
            return false;
        }
    }

    // Load the database from the text file
    async loadDatabaseFromText() {
        try {
            // Fetch the database file
            const response = await fetch('recording_database.txt');
            const text = await response.text();
            
            // Parse the database
            this.tracks = this.parseTextDatabase(text);
            
            // Organize tracks by collection for easy access
            this.organizeTracksByCollection();
            
            console.log(`Loaded ${this.tracks.length} tracks from the recording database`);
            // Log collection statistics
            Object.keys(this.collectionTracks).forEach(collectionId => {
                console.log(`Collection ${collectionId}: ${this.collectionTracks[collectionId].length} tracks`);
            });
        } catch (error) {
            console.error('Error loading track database:', error);
            throw error;
        }
    }

    // Parse the text database format
    parseTextDatabase(text) {
        // Split into lines
        const lines = text.split('\n');
        
        // Tracks array to populate
        const tracks = [];
        
        let currentCollection = null;
        let inTable = false;
        
        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Check if it's a collection name line
            if (line.startsWith('# ') && line.includes('Collection')) {
                const collectionMatch = line.match(/# (.*?) Collection(\s+with Track IDs)?/);
                if (collectionMatch) {
                    currentCollection = collectionMatch[1];
                    inTable = false;
                    continue;
                }
            }
            
            // Check if it's a table header row
            if (line.startsWith('| Track ID | Collection Name |')) {
                inTable = true;
                continue;
            }
            
            // Check if it's a separator row
            if (line.startsWith('|----')) {
                continue;
            }
            
            // It's a data row in a table
            if (inTable && line.startsWith('|')) {
                // Split by pipe character and remove whitespace
                const parts = line.split('|').map(part => part.trim()).filter(part => part);
                
                // Ensure we have all needed fields (at least 7 columns in the format)
                if (parts.length >= 7) {
                    const track = {
                        id: parts[0],
                        collection_name: parts[1],
                        title: this.formatTitle(parts[2]),
                        filename: parts[3],
                        filepath: parts[4],
                        performers: parts[5],
                        year: parts[6],
                        region: parts.length > 7 ? this.formatRegion(parts[7]) : ''
                    };
                    
                    // Extract collection ID from track_id (e.g., col_0_track_1 -> col_0)
                    const collectionIdMatch = track.id.match(/^(col_\d+)_/);
                    if (collectionIdMatch) {
                        track.collection_id = collectionIdMatch[1];
                        
                        // Fix collection names for specific collections
                        if (track.collection_id === 'col_10') {
                            track.collection_name = 'Yvette Grimaud Collection';
                        } else if (track.collection_id === 'col_11') {
                            track.collection_name = 'Lanchkhuti 1931 Collection';
                        } else if (track.collection_id === 'col_12') {
                            track.collection_name = 'Berdzenishvili Collection';
                        }
                    } else {
                        track.collection_id = 'unknown';
                    }
                    
                    // Create proper audio URL with CloudFront domain and URL encoding
                    if (track.filepath && track.filename) {
                        // MODIFIED SECTION - Handle the problematic Anania Erkomaishvili collection
                        if (track.collection_id === 'col_17') {
                            // Special handling for Anania Erkomaishvili collection
                            // Log original values for debugging
                            console.log('Anania track detected:', track.title);
                            console.log('Original filepath:', track.filepath);
                            
                            // For Anania collection, try a simpler direct approach - we'll
                            // assume the files are directly in a folder named Anania_Erkomaishvili
                            // with no special characters
                            let cleanFilename = track.filename;
                            
                            // First, try to remove any parenthetical expressions like (1)
                            cleanFilename = cleanFilename.replace(/\s*\(\d+\)\s*/g, '');
                            
                            // Try to handle "copy" in filenames
                            cleanFilename = cleanFilename.replace(/\s+copy\.mp3$/i, '.mp3');
                            
                            // Debugging
                            console.log('Cleaned filename:', cleanFilename);
                            
                            // Build the URL with simpler structure
                            track.audioUrl = `${this.cloudFrontDomain}/audio/Anania_Erkomaishvili/${encodeURIComponent(cleanFilename)}`;
                            console.log('New audio URL:', track.audioUrl);
                            
                            // Create alternative URLs for backup attempts
                            track.alternativeUrls = [
                                // Original approach
                                `${this.cloudFrontDomain}/audio/${encodeURIComponent('Anania Erkomaishvili')}/${encodeURIComponent(track.filename)}`,
                                // Try with underscore
                                `${this.cloudFrontDomain}/audio/Anania_Erkomaishvili/${encodeURIComponent(track.filename)}`,
                                // Try with just filename
                                `${this.cloudFrontDomain}/audio/${encodeURIComponent(track.filename)}`,
                                // Try with direct filepath
                                `${this.cloudFrontDomain}/audio/${encodeURIComponent(track.filepath)}`
                            ];
                        } else {
                            // For other collections: standard handling
                            const pathParts = track.filepath.split('/');
                            const collectionFolder = pathParts[0];
                            
                            const audioPath = pathParts.length > 1 ? 
                                `${encodeURIComponent(collectionFolder)}/${encodeURIComponent(track.filename)}` : 
                                encodeURIComponent(track.filepath);
                                
                            track.audioUrl = `${this.cloudFrontDomain}/audio/${audioPath}`;
                        }
                    } else {
                        // Skip tracks with missing filepath or filename
                        console.warn(`Skipping track with missing filepath or filename: ${track.id} - ${track.title}`);
                        continue;
                    }
                    
                    tracks.push(track);
                }
            }
            
            // Process Grimaud collection data (for any special format lines outside the table)
            else if (line.startsWith('გრიმო,')) {
                const parts = line.split(',');
                if (parts.length >= 6) {
                    const track = {
                        collection_name: 'Yvette Grimaud Collection',
                        title: this.formatTitle(parts[1]),
                        filename: parts[2],
                        performers: parts[3],
                        year: parts[4],
                        region: this.formatRegion(parts[5]),
                        collection_id: 'col_10',
                        audioUrl: `${this.cloudFrontDomain}/audio/${encodeURIComponent('გრიმო')}/${encodeURIComponent(parts[2])}`
                    };
                    tracks.push(track);
                }
            }
        }
        
        return tracks;
    }
    
    // Format title with proper capitalization and remove numbers
    formatTitle(title) {
        if (!title) return '';
        
        // Remove any standalone numbers, numbers with parentheses, and numbers with periods
        let cleanTitle = title
            // Remove standalone numbers (e.g., "Song 123" becomes "Song")
            .replace(/\s+\d+\s+/g, ' ')
            // Remove numbers in parentheses (e.g., "Song (123)" becomes "Song")
            .replace(/\s*\(\d+\)\s*/g, ' ')
            // Remove numbers with periods (e.g., "Song 1.23" becomes "Song")
            .replace(/\s+\d+\.\d+\s+/g, ' ')
            // Remove numbers at the end of the title
            .replace(/\s+\d+$/, '')
            // Remove numbers at the beginning of the title
            .replace(/^\d+\s+/, '')
            // Trim any extra whitespace
            .trim();
        
        // Split title into words, and capitalize the first letter of each word
        return cleanTitle.split(' ')
            .map((word, index) => {
                if (word.length === 0) return '';
                
                // Special case for hyphenated words
                if (word.includes('-')) {
                    return word.split('-')
                        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                        .join('-');
                }
                
                // Special cases for articles, conjunctions, and prepositions that 
                // typically aren't capitalized in titles (except at the beginning)
                const lowerCaseWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 
                                        'on', 'at', 'to', 'from', 'by', 'in', 'of', 'with', 'da'];
                
                // Always capitalize first word in title or after a colon
                if (index === 0 || cleanTitle.split(' ')[index-1]?.endsWith(':')) {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                
                if (lowerCaseWords.includes(word.toLowerCase())) {
                    return word.toLowerCase();
                }
                
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }
    
    // Format region names (first letter capitalized, rest lowercase)
    formatRegion(region) {
        if (!region) return '';
        
        // Split by spaces, format each word, then rejoin
        return region.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Organize tracks by collection ID for easy access
    organizeTracksByCollection() {
        this.collectionTracks = {};
        
        this.tracks.forEach(track => {
            if (!this.collectionTracks[track.collection_id]) {
                this.collectionTracks[track.collection_id] = [];
            }
            
            this.collectionTracks[track.collection_id].push(track);
        });
    }

    // Get tracks from a specific collection
    getTracksFromCollection(collectionId) {
        return this.collectionTracks[collectionId] || [];
    }

    // Get all available tracks
    getAllTracks() {
        if (!this.isInitialized) {
            console.error('Track loader not initialized. Call initialize() first.');
            return [];
        }
        
        return this.tracks;
    }
    
    // Record an error for a track
    recordTrackError(track) {
        if (!track || !track.collection_id) return;
        
        // Initialize error count for this collection if not exists
        if (!this.errorCount[track.collection_id]) {
            this.errorCount[track.collection_id] = 0;
        }
        
        // Increment error count
        this.errorCount[track.collection_id]++;
        
        // Log for debugging
        console.warn(`Track error recorded for collection ${track.collection_id} (Total: ${this.errorCount[track.collection_id]})`);
        
        // For Anania collection, try alternative URLs if available
        if (track.collection_id === 'col_17' && track.alternativeUrls && track.alternativeUrls.length > 0) {
            console.log('Trying alternative URL for Anania track');
            const alternativeUrl = track.alternativeUrls.shift();
            console.log('Trying URL:', alternativeUrl);
            track.audioUrl = alternativeUrl;
            
            // We've changed the URL, so we'll return true to indicate the track should be retried
            return true;
        }
        
        return false;
    }
    
    // Get a track by its ID
    getTrackById(trackId) {
        if (!this.isInitialized) {
            console.error('Track loader not initialized. Call initialize() first.');
            return null;
        }
        
        return this.tracks.find(track => track.id === trackId);
    }
    
    // Other methods remain the same...
}

// Export the loader
const trackLoader = new TrackLoader();
