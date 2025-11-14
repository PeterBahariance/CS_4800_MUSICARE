// Jamendo API integration for fetching Creative Commons music
// API Docs: https://developer.jamendo.com/v3.0

const JAMENDO_CLIENT_ID = '9019d166'; // MusiCare App Client ID
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

/**
 * Search for tracks on Jamendo by tags/mood
 * @param {Object} options - Search options
 * @param {string} options.tags - Tags to search for (e.g., 'calm', 'relaxing', 'ambient')
 * @param {number} options.limit - Number of results to return (default: 10)
 * @param {string} options.order - Sort order ('popularity_week', 'releasedate', etc.)
 * @returns {Promise<Array>} Array of track objects
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
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID,
            format: 'json',
            limit: limit.toString(),
            tags: tags,
            order: order,
            audioformat: audioformat,
            include: 'musicinfo',
            offset: offset.toString()
        });

        const url = `${JAMENDO_API_BASE}/tracks/?${params}`;
        console.log(`Fetching from Jamendo with tags "${tags}": ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Jamendo API error ${response.status}:`, errorText);
            throw new Error(`Jamendo API error: ${response.status}`);
        }

        const data = await response.json();

        console.log(`🎵 Jamendo API returned ${data.results?.length || 0} tracks for tags: ${tags}`);

        if (data.results && data.results.length > 0) {
            console.log('Sample track:', data.results[0]);

            // Transform Jamendo data to our format
            return data.results.map(track => ({
                jamendoId: track.id,
                title: track.name,
                artist: track.artist_name,
                albumName: track.album_name,
                duration: track.duration, // Already in seconds
                audioUrl: track.audio || track.audiodownload,
                albumArt: track.image || track.album_image || 'https://via.placeholder.com/300x300/4a90e2/ffffff?text=Music',
                license: track.license_ccurl,
                genres: extractTrackGenres(track)
            }));
        } else {
            console.warn('No results from Jamendo for tags:', tags);
            return [];
        }
    } catch (error) {
        console.error('Error fetching from Jamendo:', error);
        throw error;
    }
}

/**
 * Get therapeutic playlists data using Jamendo tags
 * Returns curated playlists for different moods
 */
export async function getTherapeuticPlaylists() {
    try {
        // Fetch tracks for each playlist
        const playlistsWithTracks = await Promise.all(
            DEFAULT_CATEGORY_SEEDS.map(async (playlist) => {
                const tracks = await searchTracks({
                    tags: playlist.tags.join('+'),
                    limit: playlist.limit
                });

                return {
                    ...playlist,
                    tracks
                };
            })
        );

        return playlistsWithTracks;
    } catch (error) {
        console.error('Error fetching therapeutic playlists:', error);
        throw error;
    }
}

/**
 * Get a single track by Jamendo ID
 */
export async function getTrackById(trackId) {
    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID,
            format: 'json',
            id: trackId,
            audioformat: 'mp32',
            include: 'musicinfo'
        });

        const response = await fetch(`${JAMENDO_API_BASE}/tracks/?${params}`);

        if (!response.ok) {
            throw new Error(`Jamendo API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.results.length === 0) {
            return null;
        }

        const track = data.results[0];
        return {
            jamendoId: track.id,
            title: track.name,
            artist: track.artist_name,
            duration: track.duration,
            audioUrl: track.audio || track.audiodownload,
            albumArt: track.image || track.album_image,
            license: track.license_ccurl,
            genres: extractTrackGenres(track)
        };
    } catch (error) {
        console.error('Error fetching track by ID:', error);
        throw error;
    }
}

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

export async function fetchCategoryPlaylists({ categoryType, categoryKey, minPlaylists = 3, tracksPerPlaylist = 8 }) {
    const config = CATEGORY_CONFIG[categoryType]?.[categoryKey];
    if (!config) {
        throw new Error(`Unknown category ${categoryType}:${categoryKey}`);
    }

    const requiredTracks = minPlaylists * tracksPerPlaylist * 2;
    let fetchedTracks = [];
    let offset = 0;
    const pageSize = 50;
    const tagQuery = config.tags.join('+');
    let attempts = 0;
    const maxAttempts = 5;

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

    push(track.tags);

    const musicinfo = track.musicinfo || {};
    if (Array.isArray(musicinfo.tags)) {
        push(musicinfo.tags);
    } else if (typeof musicinfo.tags === 'object') {
        push(musicinfo.tags.genres);
        push(musicinfo.tags.instruments);
        push(musicinfo.tags.vartags);
    }

    push(musicinfo.musicstyles?.names);
    push(musicinfo.genres?.names);

    return Array.from(tags);
}


