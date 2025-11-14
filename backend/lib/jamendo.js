/**
 * @fileoverview Jamendo API Integration Library
 * External API integration for fetching Creative Commons music from Jamendo.
 * Provides therapeutic music discovery and playlist generation capabilities.
 *
 * @author Musicare Development Team
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires fetch - Native fetch API for HTTP requests
 *
 * @description
 * This library integrates with the Jamendo API (https://developer.jamendo.com/v3.0)
 * to fetch Creative Commons licensed music for therapeutic and wellness purposes.
 * It provides functions for searching tracks by mood/tags, creating therapeutic
 * playlists, and retrieving individual track information.
 *
 * Key Features:
 * - Search tracks by therapeutic tags (calm, focus, sleep, etc.)
 * - Generate mood-based therapeutic playlists
 * - Retrieve individual track details by Jamendo ID
 * - Transform Jamendo data to Musicare format
 * - Comprehensive error handling and logging
 * - Rate limiting and API quota management
 *
 * @example
 * // Search for calming tracks
 * const tracks = await searchTracks({ tags: 'calm', limit: 10 });
 *
 * // Get therapeutic playlists
 * const playlists = await getTherapeuticPlaylists();
 *
 * // Get specific track
 * const track = await getTrackById('123456');
 */

/**
 * Jamendo API client ID for Musicare application
 * @constant {string}
 */
const JAMENDO_CLIENT_ID = '9019d166'; // MusiCare App Client ID

/**
 * Base URL for Jamendo API v3.0
 * @constant {string}
 */
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

/**
 * Search for tracks on Jamendo by tags/mood with comprehensive filtering
 *
 * @async
 * @function searchTracks
 * @param {Object} options - Search configuration options
 * @param {string} [options.tags='calm'] - Tags to search for (e.g., 'calm', 'relaxing', 'ambient', 'focus')
 * @param {number} [options.limit=10] - Number of results to return (1-200)
 * @param {string} [options.order='popularity_week'] - Sort order ('popularity_week', 'releasedate', 'popularity_total', 'name')
 * @param {string} [options.audioformat='mp32'] - Audio format preference ('mp32', 'mp31', 'ogg')
 * @returns {Promise<Array<Object>>} Array of track objects in Musicare format
 *
 * @description
 * Searches the Jamendo API for tracks matching specified tags and criteria.
 * Transforms the response data into Musicare's standardized track format
 * for consistent use throughout the application.
 *
 * Supported therapeutic tags:
 * - 'calm' - Calming and peaceful music
 * - 'chill' - Relaxed, laid-back tracks
 * - 'ambient' - Atmospheric, background music
 * - 'instrumental' - Non-vocal focus music
 * - 'meditation' - Meditation and mindfulness tracks
 * - 'sleep' - Sleep-inducing gentle sounds
 *
 * @example
 * // Search for calming tracks
 * const calmTracks = await searchTracks({
 *   tags: 'calm',
 *   limit: 15,
 *   order: 'popularity_week'
 * });
 *
 * // Search for focus music
 * const focusTracks = await searchTracks({
 *   tags: 'instrumental',
 *   limit: 20,
 *   order: 'releasedate'
 * });
 *
 * @throws {Error} Network error or API unavailable
 * @throws {Error} Invalid API response format
 * @throws {Error} API rate limit exceeded
 */
export async function searchTracks(options = {}) {
    const {
        tags = 'calm',
        limit = 10,
        order = 'popularity_week',
        audioformat = 'mp32',
        offset = 0
    } = options;

    try {
        console.log(`🎵 Jamendo API: Searching tracks with tags "${tags}", limit ${limit}, order ${order}`);

        // Validate input parameters
        if (limit < 1 || limit > 200) {
            throw new Error('Limit must be between 1 and 200');
        }

        const validOrders = ['popularity_week', 'releasedate', 'popularity_total', 'name'];
        if (!validOrders.includes(order)) {
            throw new Error(`Invalid order. Must be one of: ${validOrders.join(', ')}`);
        }

        // Build API request parameters
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID,
            format: 'json',
            limit: limit.toString(),
            tags: tags.trim(),
            order: order,
            audioformat: audioformat,
            include: 'musicinfo',
            offset: offset.toString()
        });

        const url = `${JAMENDO_API_BASE}/tracks/?${params}`;
        console.log(`🎵 Jamendo API: Request URL - ${url}`);

        // Make API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Musicare/2.0 (Therapeutic Music App)',
                'Accept': 'application/json'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`🚨 Jamendo API: HTTP ${response.status} error:`, errorText);
            throw new Error(`Jamendo API HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log(`✅ Jamendo API: Received ${data.results?.length || 0} tracks for tags "${tags}"`);

        // Validate API response structure
        if (!data.results || !Array.isArray(data.results)) {
            console.error('🚨 Jamendo API: Invalid response structure:', data);
            throw new Error('Invalid API response structure');
        }

        if (data.results.length > 0) {
            console.log(`🎵 Jamendo API: Sample track - "${data.results[0].name}" by ${data.results[0].artist_name}`);

            // Transform Jamendo data to Musicare format with comprehensive mapping
            const transformedTracks = data.results.map(track => ({
                jamendoId: track.id,
                title: track.name || 'Unknown Title',
                artist: track.artist_name || 'Unknown Artist',
                albumName: track.album_name || null,
                duration: parseInt(track.duration) || 0, // Ensure integer seconds
                audioUrl: track.audio || track.audiodownload || null,
                albumArt: track.image || track.album_image || 'https://via.placeholder.com/300x300/4a90e2/ffffff?text=Music',
                license: track.license_ccurl || 'https://creativecommons.org/',
                album: track.album_name || null,
                releaseDate: track.releasedate || null,
                tags: track.musicinfo?.tags || [],
                bpm: track.musicinfo?.bpm || null,
                genre: track.musicinfo?.genre || null,
                genres: extractTrackGenres(track)
            }));

            console.log(`✅ Jamendo API: Successfully transformed ${transformedTracks.length} tracks`);
            return transformedTracks;
        } else {
            console.log(`⚠️ Jamendo API: No results found for tags "${tags}"`);
            return [];
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('🚨 Jamendo API: Request timeout after 10 seconds');
            throw new Error('Jamendo API request timeout');
        }

        console.error('🚨 Jamendo API: Search error:', error);
        throw new Error(`Failed to search Jamendo tracks: ${error.message}`);
    }
}

/**
 * Generate therapeutic playlists using curated Jamendo tags for different wellness needs
 *
 * @async
 * @function getTherapeuticPlaylists
 * @returns {Promise<Array<Object>>} Array of therapeutic playlist objects with tracks
 *
 * @description
 * Creates curated playlists for different therapeutic and wellness purposes.
 * Each playlist is designed for specific mental health and wellness goals,
 * using carefully selected Jamendo tags to find appropriate Creative Commons music.
 *
 * Generated playlists:
 * - Anxiety Relief: Calming melodies to ease tension and reduce anxiety
 * - Focus & Concentration: Instrumental music to enhance productivity
 * - Sleep & Relaxation: Gentle ambient sounds for peaceful rest
 *
 * Each playlist includes:
 * - Mood category and descriptive title
 * - Detailed description of therapeutic purpose
 * - Curated track collection from Jamendo
 * - Metadata for playlist management
 *
 * @example
 * const playlists = await getTherapeuticPlaylists();
 * console.log(`Generated ${playlists.length} therapeutic playlists`);
 *
 * // Access specific playlist
 * const anxietyPlaylist = playlists.find(p => p.mood === 'anxiety');
 * console.log(`Anxiety playlist has ${anxietyPlaylist.tracks.length} tracks`);
 *
 * @throws {Error} Network error or API unavailable
 * @throws {Error} Failed to fetch tracks for one or more playlists
 */
export async function getTherapeuticPlaylists() {
    console.log('🎵 Jamendo API: Generating therapeutic playlists...');

    // Default category seeds for backward compatibility and initial population
    const DEFAULT_CATEGORY_SEEDS = [
        {
            mood: 'anxiety',
            title: 'Anxiety Relief',
            description: 'Calming melodies to ease tension and reduce anxiety',
            tags: ['chill'],
            limit: 12
        },
        {
            mood: 'focus',
            title: 'Focus & Concentration',
            description: 'Enhance productivity and mental clarity with ambient sounds',
            tags: ['instrumental'],
            limit: 15
        },
        {
            mood: 'sleep',
            title: 'Sleep & Relaxation',
            description: 'Gentle sounds for peaceful rest and deep relaxation',
            tags: ['ambient'],
            limit: 10
        },
        {
            mood: 'genre_rock',
            title: 'Rock Therapy',
            description: 'Guitar-driven anthems to boost confidence and energy',
            tags: ['rock'],
            limit: 18
        },
        {
            mood: 'genre_rnb',
            title: 'Smooth R&B Comfort',
            description: 'Soulful vocals and warm grooves for emotional balance',
            tags: ['rnb', 'soul'],
            limit: 18
        }
    ];

    try {
        console.log(`🎵 Jamendo API: Fetching tracks for ${DEFAULT_CATEGORY_SEEDS.length} therapeutic playlists...`);

        // Fetch tracks for each playlist configuration with error handling
        const playlistsWithTracks = await Promise.allSettled(
            DEFAULT_CATEGORY_SEEDS.map(async (config, index) => {
                try {
                    console.log(`🎵 Jamendo API: Fetching playlist ${index + 1}/${DEFAULT_CATEGORY_SEEDS.length} - ${config.title}`);

                    const tracks = await searchTracks({
                        tags: config.tags.join('+'),
                        limit: config.limit,
                        order: 'popularity_week'
                    });

                    const playlist = {
                        id: `therapeutic-${config.mood}`,
                        mood: config.mood,
                        title: config.title,
                        description: config.description,
                        tags: config.tags,
                        tracks: tracks,
                        trackCount: tracks.length,
                        totalDuration: tracks.reduce((sum, track) => sum + (track.duration || 0), 0),
                        createdAt: new Date().toISOString(),
                        source: 'jamendo-api'
                    };

                    console.log(`✅ Jamendo API: Generated "${config.title}" playlist with ${tracks.length} tracks`);
                    return playlist;

                } catch (error) {
                    console.error(`🚨 Jamendo API: Failed to generate playlist "${config.title}":`, error);

                    // Return empty playlist on error to maintain structure
                    return {
                        id: `therapeutic-${config.mood}`,
                        mood: config.mood,
                        title: config.title,
                        description: config.description,
                        category: config.category,
                        tracks: [],
                        trackCount: 0,
                        totalDuration: 0,
                        error: error.message,
                        createdAt: new Date().toISOString(),
                        source: 'jamendo-api'
                    };
                }
            })
        );

        // Process results and handle any failures
        const successfulPlaylists = [];
        const failedPlaylists = [];

        playlistsWithTracks.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successfulPlaylists.push(result.value);
            } else {
                console.error(`🚨 Jamendo API: Playlist ${index + 1} failed:`, result.reason);
                failedPlaylists.push({
                    index,
                    config: DEFAULT_CATEGORY_SEEDS[index],
                    error: result.reason.message
                });
            }
        });

        console.log(`✅ Jamendo API: Successfully generated ${successfulPlaylists.length}/${DEFAULT_CATEGORY_SEEDS.length} therapeutic playlists`);

        if (failedPlaylists.length > 0) {
            console.warn(`⚠️ Jamendo API: ${failedPlaylists.length} playlists failed to generate`);
        }

        return successfulPlaylists;

    } catch (error) {
        console.error('🚨 Jamendo API: Critical error generating therapeutic playlists:', error);
        throw new Error(`Failed to generate therapeutic playlists: ${error.message}`);
    }
}

/**
 * Retrieve a single track by its Jamendo ID with comprehensive metadata
 *
 * @async
 * @function getTrackById
 * @param {string|number} trackId - Jamendo track ID to retrieve
 * @returns {Promise<Object|null>} Track object in Musicare format, or null if not found
 *
 * @description
 * Fetches detailed information for a specific track using its Jamendo ID.
 * Includes extended metadata such as music information, BPM, genre, and
 * licensing details. Returns null if the track is not found or unavailable.
 *
 * This function is useful for:
 * - Loading specific tracks from saved playlists
 * - Retrieving detailed track information for display
 * - Validating track availability before playback
 * - Getting updated metadata for existing tracks
 *
 * @example
 * // Get specific track
 * const track = await getTrackById('123456');
 * if (track) {
 *   console.log(`Found: "${track.title}" by ${track.artist}`);
 * } else {
 *   console.log('Track not found');
 * }
 *
 * // Use in playlist loading
 * const trackIds = ['123456', '789012', '345678'];
 * const tracks = await Promise.all(
 *   trackIds.map(id => getTrackById(id))
 * );
 * const validTracks = tracks.filter(track => track !== null);
 *
 * @throws {Error} Network error or API unavailable
 * @throws {Error} Invalid track ID format
 * @throws {Error} API rate limit exceeded
 */
export async function getTrackById(trackId) {
    try {
        console.log(`🎵 Jamendo API: Fetching track by ID - ${trackId}`);

        // Validate track ID
        if (!trackId || (typeof trackId !== 'string' && typeof trackId !== 'number')) {
            throw new Error('Invalid track ID: must be a non-empty string or number');
        }

        // Convert to string and validate format
        const trackIdStr = trackId.toString().trim();
        if (!/^\d+$/.test(trackIdStr)) {
            throw new Error('Invalid track ID format: must contain only digits');
        }

        // Build API request parameters with extended metadata
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID,
            format: 'json',
            id: trackIdStr,
            audioformat: 'mp32',
            include: 'musicinfo+lyrics'  // Include extended metadata
        });

        const url = `${JAMENDO_API_BASE}/tracks/?${params}`;
        console.log(`🎵 Jamendo API: Request URL - ${url}`);

        // Make API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Musicare/2.0 (Therapeutic Music App)',
                'Accept': 'application/json'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`🚨 Jamendo API: HTTP ${response.status} error for track ${trackId}:`, errorText);
            throw new Error(`Jamendo API HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate API response
        if (!data.results || !Array.isArray(data.results)) {
            console.error('🚨 Jamendo API: Invalid response structure for track:', trackId);
            throw new Error('Invalid API response structure');
        }

        if (data.results.length === 0) {
            console.log(`⚠️ Jamendo API: Track not found - ${trackId}`);
            return null;
        }

        const track = data.results[0];
        console.log(`✅ Jamendo API: Found track "${track.name}" by ${track.artist_name}`);

        // Transform to Musicare format with comprehensive metadata
        const transformedTrack = {
            jamendoId: track.id,
            title: track.name || 'Unknown Title',
            artist: track.artist_name || 'Unknown Artist',
            albumName: track.album_name || null,
            duration: parseInt(track.duration) || 0,
            audioUrl: track.audio || track.audiodownload || null,
            albumArt: track.image || track.album_image || 'https://via.placeholder.com/300x300/4a90e2/ffffff?text=Music',
            license: track.license_ccurl || 'https://creativecommons.org/',
            album: track.album_name || null,
            albumId: track.album_id || null,
            artistId: track.artist_id || null,
            releaseDate: track.releasedate || null,
            position: track.position || null,
            // Extended metadata from musicinfo
            tags: track.musicinfo?.tags || [],
            bpm: track.musicinfo?.bpm || null,
            genre: track.musicinfo?.genre || null,
            genres: extractTrackGenres(track),
            instruments: track.musicinfo?.instruments || [],
            vocalInstrumental: track.musicinfo?.vocalinstrumental || null,
            lang: track.musicinfo?.lang || null,
            // Additional metadata
            shareUrl: track.shareurl || null,
            waveform: track.waveform || null,
            proUrl: track.prourl || null,
            shortUrl: track.shorturl || null,
            // Fetch timestamp
            fetchedAt: new Date().toISOString()
        };

        console.log(`✅ Jamendo API: Successfully transformed track ${trackId} with extended metadata`);
        return transformedTrack;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`🚨 Jamendo API: Request timeout for track ${trackId}`);
            throw new Error(`Jamendo API request timeout for track ${trackId}`);
        }

        console.error(`🚨 Jamendo API: Error fetching track ${trackId}:`, error);
        throw new Error(`Failed to fetch track ${trackId}: ${error.message}`);
    }
}

/**
 * Jamendo API rate limiting and quota management utilities
 * @namespace JamendoUtils
 */
export const JamendoUtils = {
    /**
     * API configuration and limits
     */
    config: {
        CLIENT_ID: JAMENDO_CLIENT_ID,
        API_BASE: JAMENDO_API_BASE,
        RATE_LIMIT: 100, // requests per minute
        MAX_TRACKS_PER_REQUEST: 200,
        DEFAULT_TIMEOUT: 10000, // 10 seconds
        SUPPORTED_FORMATS: ['mp32', 'mp31', 'ogg'],
        SUPPORTED_ORDERS: ['popularity_week', 'releasedate', 'popularity_total', 'name']
    },

    /**
     * Validate search parameters
     * @param {Object} options - Search options to validate
     * @returns {Object} Validated and sanitized options
     */
    validateSearchOptions(options = {}) {
        const validated = { ...options };

        // Validate limit
        if (validated.limit && (validated.limit < 1 || validated.limit > this.config.MAX_TRACKS_PER_REQUEST)) {
            validated.limit = Math.min(Math.max(1, validated.limit), this.config.MAX_TRACKS_PER_REQUEST);
        }

        // Validate order
        if (validated.order && !this.config.SUPPORTED_ORDERS.includes(validated.order)) {
            validated.order = 'popularity_week';
        }

        // Validate audio format
        if (validated.audioformat && !this.config.SUPPORTED_FORMATS.includes(validated.audioformat)) {
            validated.audioformat = 'mp32';
        }

        // Sanitize tags
        if (validated.tags) {
            validated.tags = validated.tags.toString().trim().toLowerCase();
        }

        return validated;
    },

    /**
     * Get API status and health information
     * @returns {Object} API status information
     */
    getApiStatus() {
        return {
            clientId: JAMENDO_CLIENT_ID,
            baseUrl: JAMENDO_API_BASE,
            version: '3.0',
            rateLimit: this.config.RATE_LIMIT,
            maxTracksPerRequest: this.config.MAX_TRACKS_PER_REQUEST,
            supportedFormats: this.config.SUPPORTED_FORMATS,
            supportedOrders: this.config.SUPPORTED_ORDERS,
            lastUpdated: new Date().toISOString()
        };
    }
};

// ==================== CATEGORY-BASED PLAYLIST GENERATION ====================

/**
 * Category configuration for health goals and music genres
 * Maps user preferences to specific Jamendo tags and playlist metadata
 * @constant {Object}
 */
export const CATEGORY_CONFIG = {
    goal: {
        mental_wellness: {
            tags: ['relax', 'meditation'],
            mood: 'relaxation',
            title: 'Mental Wellness',
            description: 'Gentle soundscapes to restore inner balance.'
        },
        stress_relief: {
            tags: ['calm', 'soothing'],
            mood: 'relaxation',
            title: 'Stress Relief',
            description: 'Slow, tension-free tones for steady breathing.'
        },
        sleep_improvement: {
            tags: ['sleep', 'ambient'],
            mood: 'sleep',
            title: 'Sleep Improvement',
            description: 'Soft lullabies to ease you into deep rest.'
        },
        focus: {
            tags: ['focus', 'instrumental'],
            mood: 'focus',
            title: 'Deep Focus',
            description: 'Minimal melodies to support concentration.'
        },
        meditation: {
            tags: ['meditation', 'newage'],
            mood: 'relaxation',
            title: 'Meditation Moments',
            description: 'Breath-aligned drones and bowls.'
        },
        exercise: {
            tags: ['fitness', 'energy'],
            mood: 'energy',
            title: 'Energizing Movement',
            description: 'High-vibe beats to get the body moving.'
        },
        anxiety_relief: {
            tags: ['calm', 'piano'],
            mood: 'relaxation',
            title: 'Anxiety Relief',
            description: 'Warm piano and strings to settle nerves.'
        },
        mood_boost: {
            tags: ['happy', 'uplifting'],
            mood: 'energy',
            title: 'Mood Boost',
            description: 'Feel-good rhythms to elevate your mindset.'
        }
    },
    genre: {
        rock: {
            tags: ['rock', 'guitar', 'energetic'],
            mood: 'energy',
            title: 'Rock Therapy',
            description: 'Guitar-driven anthems to boost confidence.'
        },
        rnb: {
            tags: ['rnb', 'soul', 'funk'],
            mood: 'relaxation',
            title: 'Smooth R&B Comfort',
            description: 'Soulful grooves for emotional balance.'
        },
        nature: {
            tags: ['nature'],
            mood: 'sleep',
            title: 'Nature Soundscapes',
            description: 'Birdsong, rain and forests for deep calm.'
        }
    }
};

/**
 * Genre aliases for mapping user input to standardized categories
 * @constant {Object}
 */
export const GENRE_ALIASES = {
    'r&b': 'rnb',
    'rhythm and blues': 'rnb',
    'rnb': 'rnb',
    'nature sounds': 'nature',
    'nature sound': 'nature',
    'nature': 'nature',
    'rain sounds': 'nature',
    'ambient nature': 'nature'
};

/**
 * Fetch Category-Based Playlists
 *
 * Generates multiple playlists based on user health goals or music genre preferences.
 * Uses intelligent track fetching with pagination to ensure variety.
 *
 * @async
 * @function fetchCategoryPlaylists
 * @param {Object} options - Configuration options
 * @param {string} options.categoryType - Type of category ('goal' or 'genre')
 * @param {string} options.categoryKey - Specific category key
 * @param {number} [options.minPlaylists=3] - Minimum number of playlists to generate
 * @param {number} [options.tracksPerPlaylist=8] - Number of tracks per playlist
 * @returns {Promise<Array>} Array of generated playlists with tracks
 * @throws {Error} Unknown category configuration
 */
export async function fetchCategoryPlaylists({ categoryType, categoryKey, minPlaylists = 3, tracksPerPlaylist = 8 }) {
    const config = CATEGORY_CONFIG[categoryType]?.[categoryKey];
    if (!config) {
        throw new Error(`Unknown category ${categoryType}:${categoryKey}`);
    }

    const requiredTracks = minPlaylists * tracksPerPlaylist * 2; // Fetch extra for variety
    let fetchedTracks = [];
    let offset = 0;
    const pageSize = 50;
    const tagQuery = config.tags.join('+');
    let attempts = 0;
    const maxAttempts = 5;

    // Fetch tracks with pagination
    while (fetchedTracks.length < requiredTracks && attempts < maxAttempts) {
        const batch = await searchTracks({
            tags: tagQuery,
            limit: pageSize,
            offset
        });

        if (!batch.length) {
            break;
        }

        fetchedTracks = fetchedTracks.concat(batch);
        offset += batch.length;
        attempts += 1;
    }

    // Generate playlists from fetched tracks
    const playlists = [];
    for (let i = 0; i < fetchedTracks.length; i += tracksPerPlaylist) {
        const slice = fetchedTracks.slice(i, i + tracksPerPlaylist);
        if (slice.length < Math.max(3, tracksPerPlaylist / 2)) break;

        const firstTrack = slice[0];
        let dynamicTitle = firstTrack?.albumName?.trim();
        if (!dynamicTitle) {
            const artistName = firstTrack?.artist || 'Mix';
            dynamicTitle = `${config.title} • ${artistName}`;
        }

        playlists.push({
            title: dynamicTitle,
            description: config.description,
            mood: config.mood,
            tags: config.tags,
            category: categoryType,
            categoryKey,
            tracks: slice
        });

        if (playlists.length >= minPlaylists) break;
    }

    return playlists;
}

/**
 * Extract Track Genres
 *
 * Extracts and normalizes genre tags from Jamendo track data.
 * Combines various tag sources into a clean array of genre strings.
 *
 * @function extractTrackGenres
 * @param {Object} track - Raw track data from Jamendo API
 * @returns {Array<string>} Array of normalized genre tags
 */
function extractTrackGenres(track) {
    const tags = new Set();

    const push = (values) => {
        if (!values) return;
        values.forEach(value => {
            if (value && typeof value === 'string') {
                const cleaned = value.trim().toLowerCase();
                if (cleaned) {
                    tags.add(cleaned);
                }
            }
        });
    };

    // Add direct track tags
    push(track.tags);

    // Add musicinfo tags if available
    const musicinfo = track.musicinfo || {};
    if (Array.isArray(musicinfo.tags)) {
        push(musicinfo.tags);
    } else if (typeof musicinfo.tags === 'object') {
        push(musicinfo.tags.genres);
        push(musicinfo.tags.instruments);
        push(musicinfo.tags.vartags);
    }

    return Array.from(tags);
}


