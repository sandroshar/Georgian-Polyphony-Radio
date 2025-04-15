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
                        const pathParts = track.filepath.split('/');
                        const collectionFolder = pathParts[0];
                        
                        // Check if it's the problematic Anania Erkomaishvili collection
                        if (track.collection_id === 'col_17') {
                            // Special handling for Anania Erkomaishvili collection
                            // Use the full filepath instead of just the collection folder + filename
                            track.audioUrl = `${this.cloudFrontDomain}/audio/${encodeURIComponent(track.filepath)}`;
                        } else {
                            // For other collections: use folder + '/' + filename
                            // Otherwise, use full filepath as is
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
    }
    
    // Get a balanced playlist with proper representation of all collections
    // Never plays more than one track from the same collection in succession
    getShuffledPlaylist() {
        if (!this.isInitialized) {
            console.error('Track loader not initialized. Call initialize() first.');
            return [];
        }
        
        // Get all collections
        const collectionIds = Object.keys(this.collectionTracks);
        
        // Shuffle the collection order
        const shuffledCollections = this.shuffleArray([...collectionIds]);
        
        // Shuffle the tracks within each collection
        const shuffledCollectionTracks = {};
        shuffledCollections.forEach(collectionId => {
            shuffledCollectionTracks[collectionId] = this.shuffleArray([...this.collectionTracks[collectionId]]);
        });
        
        // Create a new array with strictly alternating tracks from each collection
        const playlist = [];
        
        // Keep track of position in each collection
        const positions = {};
        shuffledCollections.forEach(collectionId => {
            positions[collectionId] = 0;
        });
        
        // Collections still having tracks to contribute
        let remainingCollections = [...shuffledCollections];
        
        // Strictly alternate between collections
        // This ensures we never play two tracks from the same collection in a row
        let lastCollectionId = null;
        
        while (remainingCollections.length > 0) {
            // Reshuffle remaining collections for better mixing
            // Skip this if we're down to just one collection
            if (remainingCollections.length > 1) {
                const collectionsToShuffle = remainingCollections.filter(id => id !== lastCollectionId);
                const shuffledRemaining = this.shuffleArray(collectionsToShuffle);
                
                // If we have a last collection, put it last in our rotation
                // to avoid playing it twice in a row
                if (lastCollectionId && remainingCollections.includes(lastCollectionId)) {
                    remainingCollections = [...shuffledRemaining, lastCollectionId];
                } else {
                    remainingCollections = shuffledRemaining;
                }
            }
            
            // Get the next collection
            const collectionId = remainingCollections[0];
            
            // Add one track from this collection to the playlist
            const track = shuffledCollectionTracks[collectionId][positions[collectionId]];
            playlist.push(track);
            
            // Update position for this collection
            positions[collectionId]++;
            
            // Check if we've exhausted this collection
            if (positions[collectionId] >= shuffledCollectionTracks[collectionId].length) {
                // Remove this collection from the rotation
                remainingCollections = remainingCollections.filter(id => id !== collectionId);
            }
            
            // Remember this collection to avoid playing it again immediately
            lastCollectionId = collectionId;
        }
        
        return playlist;
    }
    
    // Get a shuffled playlist that avoids collections with too many errors
    getFilteredShuffledPlaylist() {
        if (!this.isInitialized) {
            console.error('Track loader not initialized. Call initialize() first.');
            return [];
        }
        
        // Get all collections
        const collectionIds = Object.keys(this.collectionTracks);
        
        // Filter out collections with too many errors
        // If a collection has more than 30% error rate, reduce its representation
        const filteredCollections = collectionIds.filter(collectionId => {
            const errorCount = this.errorCount[collectionId] || 0;
            const totalTracks = this.collectionTracks[collectionId].length;
            const errorRate = errorCount / totalTracks;
            
            // If error rate is above 80%, skip the collection entirely
            if (errorRate > 0.8) {
                console.warn(`Skipping collection ${collectionId} due to high error rate (${errorCount}/${totalTracks})`);
                return false;
            }
            
            return true;
        });
        
        // If we've filtered out all collections, return the default shuffled playlist
        if (filteredCollections.length === 0) {
            console.warn('All collections have high error rates. Using default playlist.');
            return this.getShuffledPlaylist();
        }
        
        // Shuffle the collection order
        const shuffledCollections = this.shuffleArray([...filteredCollections]);
        
        // Shuffle the tracks within each collection
        const shuffledCollectionTracks = {};
        shuffledCollections.forEach(collectionId => {
            shuffledCollectionTracks[collectionId] = this.shuffleArray([...this.collectionTracks[collectionId]]);
        });
        
        // Create a new array with strictly alternating tracks from each collection
        const playlist = [];
        
        // Keep track of position in each collection
        const positions = {};
        shuffledCollections.forEach(collectionId => {
            positions[collectionId] = 0;
        });
        
        // Collections still having tracks to contribute
        let remainingCollections = [...shuffledCollections];
        
        // Strictly alternate between collections
        // This ensures we never play two tracks from the same collection in a row
        let lastCollectionId = null;
        
        while (remainingCollections.length > 0) {
            // Reshuffle remaining collections for better mixing
            // Skip this if we're down to just one collection
            if (remainingCollections.length > 1) {
                const collectionsToShuffle = remainingCollections.filter(id => id !== lastCollectionId);
                const shuffledRemaining = this.shuffleArray(collectionsToShuffle);
                
                // If we have a last collection, put it last in our rotation
                // to avoid playing it twice in a row
                if (lastCollectionId && remainingCollections.includes(lastCollectionId)) {
                    remainingCollections = [...shuffledRemaining, lastCollectionId];
                } else {
                    remainingCollections = shuffledRemaining;
                }
            }
            
            // Get the next collection
            const collectionId = remainingCollections[0];
            
            // Add one track from this collection to the playlist
            const track = shuffledCollectionTracks[collectionId][positions[collectionId]];
            playlist.push(track);
            
            // Update position for this collection
            positions[collectionId]++;
            
            // Check if we've exhausted this collection
            if (positions[collectionId] >= shuffledCollectionTracks[collectionId].length) {
                // Remove this collection from the rotation
                remainingCollections = remainingCollections.filter(id => id !== collectionId);
            }
            
            // Remember this collection to avoid playing it again immediately
            lastCollectionId = collectionId;
        }
        
        return playlist;
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
    
    // Search tracks by title, performers, or collection
    searchTracks(query) {
        if (!query || query.trim() === '') {
            return [];
        }
        
        const normalizedQuery = query.toLowerCase().trim();
        
        return this.tracks.filter(track => {
            const title = (track.title || '').toLowerCase();
            const performers = (track.performers || '').toLowerCase();
            const collection = (track.collection_name || '').toLowerCase();
            const region = (track.region || '').toLowerCase();
            
            return title.includes(normalizedQuery) || 
                   performers.includes(normalizedQuery) ||
                   collection.includes(normalizedQuery) ||
                   region.includes(normalizedQuery);
        });
    }
}

// Export the loader
const trackLoader = new TrackLoader();
