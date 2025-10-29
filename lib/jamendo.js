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
        audioformat = 'mp32'
    } = options;

    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID,
            format: 'json',
            limit: limit.toString(),
            tags: tags,
            order: order,
            audioformat: audioformat
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
                duration: track.duration, // Already in seconds
                audioUrl: track.audio || track.audiodownload,
                albumArt: track.image || track.album_image || 'https://via.placeholder.com/300x300/4a90e2/ffffff?text=Music',
                license: track.license_ccurl
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
    const playlists = [
        {
            mood: 'anxiety',
            title: 'Anxiety Relief',
            description: 'Calming melodies to ease tension and reduce anxiety',
            tags: 'chill',  // More upbeat relaxing music
            limit: 12
        },
        {
            mood: 'focus',
            title: 'Focus & Concentration',
            description: 'Enhance productivity and mental clarity with ambient sounds',
            tags: 'instrumental',  // Instrumental focus music
            limit: 15
        },
        {
            mood: 'sleep',
            title: 'Sleep & Relaxation',
            description: 'Gentle sounds for peaceful rest and deep relaxation',
            tags: 'ambient',  // Soft ambient music for sleep
            limit: 10
        }
    ];

    try {
        // Fetch tracks for each playlist
        const playlistsWithTracks = await Promise.all(
            playlists.map(async (playlist) => {
                const tracks = await searchTracks({
                    tags: playlist.tags,
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
            license: track.license_ccurl
        };
    } catch (error) {
        console.error('Error fetching track by ID:', error);
        throw error;
    }
}


