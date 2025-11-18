/**
 * @fileoverview Library View Component
 *
 * Manages the user's personal music library interface, displaying saved
 * playlists and songs with full CRUD operations and playback integration.
 *
 * Features:
 * - Display saved playlists and songs
 * - Create new playlists
 * - Add/remove songs from playlists
 * - Delete playlists
 * - Play songs directly from library
 * - Expand/collapse playlist details
 * - Real-time library updates via custom events
 * - Empty state handling
 * - Loading states and error handling
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 * @requires /api/playlists - Playlist management API
 * @requires /api/users - User library API
 *
 * @example
 * // This module is imported in app/index.js:
 * // import LibraryView from '../features/music/library.js';
 * // const libraryView = new LibraryView();
 * // libraryView.setUserContext(user);
 */

/**
 * Library View Class
 *
 * Main class managing the user's music library interface.
 * Handles rendering, state management, and user interactions.
 *
 * @class LibraryView
 */
class LibraryView {
    /**
     * Initialize Library View
     *
     * Sets up the library view with initial state and event listeners.
     *
     * @constructor
     */
    constructor() {
        /**
         * Current user object
         * @type {Object|null}
         */
        this.user = null;

        /**
         * Root DOM element for library content
         * @type {HTMLElement|null}
         */
        this.root = null;

        /**
         * Library state
         * @type {Object}
         * @property {Array<Object>} playlists - User's saved playlists
         * @property {Array<Object>} songs - User's saved songs
         * @property {boolean} initialized - Whether library has been loaded
         */
        this.state = {
            playlists: [],
            songs: [],
            initialized: false
        };

        /**
         * Loading state
         * @type {boolean}
         */
        this.isLoading = false;

        /**
         * Set of expanded playlist IDs
         * @type {Set<string>}
         */
        this.expandedPlaylists = new Set();

        /**
         * Listen for library changes from other components
         *
         * Reloads library when changes are detected from music player
         * or other components. Prevents infinite loops by checking source.
         */
        window.addEventListener('musicare:library-changed', (event) => {
            if (event?.detail?.source === 'library') return;
            if (this.user?.id && this.root) {
                this.loadLibrary();
            }
        });
    }

    /**
     * Set User Context
     *
     * Updates the user context and triggers library loading if active.
     *
     * @param {Object} user - User object with id and profile data
     */
    setUserContext(user) {
        console.log('[LibraryView] Setting user context:', user);
        this.user = user;
        if (this.isActive()) {
            console.log('[LibraryView] Library tab is active, mounting...');
            this.mount();
        } else {
            console.log('[LibraryView] Library tab is not active, waiting...');
        }
    }

    /**
     * Check if Library Tab is Active
     * 
     * @returns {boolean} True if library tab is currently active
     */
    isActive() {
        return document.querySelector('.nav-item[data-tab="library"]')?.classList.contains('active');
    }

    /**
     * Mount Library View
     *
     * Finds the library content element and initializes the view.
     * Handles cases where the element might not be immediately available.
     */
    mount() {
        console.log('[LibraryView] mount() called');
        const mainContent = document.querySelector('.main-content');
        this.root = mainContent?.querySelector('#library-content');

        console.log('[LibraryView] mainContent:', !!mainContent, 'root:', !!this.root);

        if (!this.root) {
            console.log('[LibraryView] Root not found, retrying mount...');
            this.retryMount();
            return;
        }

        console.log('[LibraryView] Found library-content in main-content');
        this.doMount();
    }

    /**
     * Retry Mount with Fallback
     * 
     * Attempts to find the library content element multiple times,
     * with fallback to cloning from template if needed.
     */
    retryMount() {
        let attempts = 0;
        const maxAttempts = 5;
        
        const tryMount = () => {
            attempts++;
            const mainContent = document.querySelector('.main-content');
            this.root = mainContent?.querySelector('#library-content');
            
            if (this.root) {
                console.log(`[LibraryView] Found library-content after ${attempts} attempt(s)`);
                this.doMount();
            } else if (attempts < maxAttempts) {
                setTimeout(tryMount, 100 * attempts);
            } else {
                this.fallbackMount();
            }
        };
        
        setTimeout(tryMount, 50);
    }

    /**
     * Fallback Mount Strategy
     * 
     * Clones library content from template if not found in main content.
     */
    fallbackMount() {
        console.error('[LibraryView] library-content element not found after all attempts');
        
        const template = document.querySelector('.content-templates #library-content');
        const mainContent = document.querySelector('.main-content');
        
        if (template && mainContent) {
            const cloned = template.cloneNode(true);
            cloned.id = 'library-content';
            cloned.className = 'content-section';
            mainContent.appendChild(cloned);
            this.root = cloned;
            console.log('[LibraryView] Cloned library-content from template');
            this.doMount();
        }
    }

    /**
     * Execute Mount Process
     * 
     * Performs the actual mounting logic after root element is found.
     */
    doMount() {
        if (!this.root) return;

        if (!this.user) {
            this.renderSignInPrompt();
            return;
        }

        console.log('[LibraryView] Mounting library view for user:', this.user.id);
        
        if (!this.state.initialized) {
            this.loadLibrary();
        } else {
            this.render();
        }
    }

    /**
     * Render Sign-In Prompt
     *
     * Shows a message prompting user to sign in to view their library.
     */
    renderSignInPrompt() {
        this.root.innerHTML = `
            <div class="library-empty-state">
                <h3>Sign in to view your library</h3>
                <p>Your saved playlists and songs will appear here once you're logged in.</p>
            </div>
        `;
    }

    /**
     * Load Library Data
     *
     * Fetches user's saved playlists and songs from the API.
     * Updates component state and triggers re-render.
     *
     * @async
     * @returns {Promise<void>}
     */
    async loadLibrary() {
        if (!this.user?.id) {
            console.warn('[LibraryView] loadLibrary() called but no user ID');
            return;
        }
        if (!this.root) {
            console.warn('[LibraryView] loadLibrary() called but root is null, waiting for mount...');
            return;
        }

        console.log('[LibraryView] Starting library load for user:', this.user.id);
        this.isLoading = true;
        this.render();

        // Safety timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            if (this.isLoading) {
                console.warn('[LibraryView] Loading timeout reached, clearing loading state');
                this.isLoading = false;
                this.renderError(new Error('Loading timeout - please try refreshing'));
            }
        }, 10000); // 10 second timeout

        try {
            console.log('[LibraryView] Fetching from API...');
            const response = await fetch(`/api/library?userId=${this.user.id}`);

            if (!response.ok) {
                throw new Error(`Failed to load library: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[LibraryView] Loaded library data:', {
                playlists: data.savedPlaylists?.length || 0,
                songs: data.savedSongs?.length || 0,
                raw: data
            });

            this.state = {
                playlists: data.savedPlaylists || [],
                songs: data.savedSongs || [],
                initialized: true
            };

            console.log('[LibraryView] State updated, clearing loading flag');
            this.isLoading = false;
            clearTimeout(loadingTimeout);
            this.render();

        } catch (error) {
            console.error('LibraryView: unable to load library', error);
            this.isLoading = false;
            clearTimeout(loadingTimeout);
            this.renderError(error);
        }
    }

    /**
     * Render Main Library Interface
     *
     * Renders the complete library interface including playlists and songs.
     * Handles loading states and ensures proper visibility.
     */
    render() {
        if (!this.root) {
            console.warn('[LibraryView] render() called but root is null');
            return;
        }

        console.log('[LibraryView] render() called, isLoading:', this.isLoading, 'playlists:', this.state.playlists?.length || 0);

        if (this.isLoading) {
            this.renderLoading();
            return;
        }

        const playlistsHTML = this.renderPlaylists();
        const songsHTML = this.renderSongs();

        const fullHTML = `
            <div class="library-header">
                <div>
                    <h2>My Library</h2>
                    <p>Your saved playlists and songs across every mood.</p>
                </div>
                <button class="library-refresh-btn" id="refresh-library-btn">Refresh</button>
            </div>

            <div class="library-section">
                <div class="library-section-header">
                    <h3>Saved Playlists</h3>
                    <span>${this.state.playlists.length} saved</span>
                </div>
                ${playlistsHTML}
            </div>

            <div class="library-section">
                <div class="library-section-header">
                    <h3>Saved Songs</h3>
                    <span>${this.state.songs.length} saved</span>
                </div>
                ${songsHTML}
            </div>
        `;

        this.root.innerHTML = fullHTML;
        this.ensureVisibility();
        this.attachEventHandlers();
    }

    /**
     * Render Loading State
     *
     * Shows loading spinner while library data is being fetched.
     */
    renderLoading() {
        this.root.innerHTML = `
            <div class="library-loading">
                <div class="spinner"></div>
                <p>Loading your saved music...</p>
            </div>
        `;
    }

    /**
     * Ensure Library Visibility
     *
     * Ensures the library content is properly visible and positioned.
     */
    ensureVisibility() {
        // Verify elements were added
        const grid = this.root.querySelector('.library-playlists-grid');
        const cards = this.root.querySelectorAll('.library-playlist-card');

        console.log('[LibraryView] After render - grid found:', !!grid, 'cards found:', cards.length);

        // Ensure the root is visible and properly positioned
        if (this.root.parentElement) {
            this.root.parentElement.style.display = 'block';
        }

        this.root.style.display = 'block';
        this.root.style.visibility = 'visible';
        this.root.style.opacity = '1';

        // Ensure we're in the right container
        if (!this.root.classList.contains('content-section')) {
            this.root.classList.add('content-section');
        }
    }

    /**
     * Render Playlists Section
     *
     * Generates HTML for the saved playlists section with expandable track lists.
     *
     * @returns {string} HTML string for playlists section
     */
    renderPlaylists() {
        console.log('[LibraryView] renderPlaylists called, state.playlists:', this.state.playlists);

        if (!this.state.playlists || !this.state.playlists.length) {
            return `
                <div class="library-empty-state">
                    <p>No playlists saved yet. Tap the star icon on any playlist to pin it here.</p>
                </div>
            `;
        }

        const playlistHTML = this.state.playlists.map((entry, index) => {
            console.log(`[LibraryView] Rendering playlist ${index}:`, entry);

            if (!entry || !entry.playlist) {
                console.warn(`[LibraryView] Invalid playlist entry at index ${index}:`, entry);
                return '';
            }

            const playlist = entry.playlist;
            const coverUrl = playlist.coverImage ? encodeURI(playlist.coverImage) : null;
            const coverStyle = coverUrl ? `style="background-image: url('${coverUrl}');"` : '';
            const moodClass = playlist.mood || 'default';
            const trackCount = playlist.trackCount ?? playlist.tracks?.length ?? playlist.previewTracks?.length ?? 0;
            const savedAt = entry.savedAt || entry.createdAt || new Date();
            const isExpanded = this.expandedPlaylists.has(playlist.id);
            const fullTracks = (playlist.tracks && playlist.tracks.length) ? playlist.tracks : (playlist.previewTracks || []);
            const previewTracks = (playlist.previewTracks && playlist.previewTracks.length)
                ? playlist.previewTracks
                : fullTracks.slice(0, 3);
            const tracksToShow = isExpanded ? fullTracks : previewTracks;
            const hasMoreTracks = fullTracks.length > previewTracks.length;

            return `
                <div class="library-playlist-card" data-playlist-id="${playlist.id}">
                    <div class="library-playlist-cover ${moodClass}" ${coverStyle}></div>
                    <div class="library-playlist-details">
                        <div class="library-playlist-headline">
                            <div>
                                <h4>${playlist.title || 'Untitled Playlist'}</h4>
                                <p>${formatMoodLabel(playlist.mood || 'wellness')} • ${trackCount} tracks</p>
                            </div>
                            <div class="library-playlist-actions">
                                <button class="library-play-btn" data-action="play-playlist" data-playlist-id="${playlist.id}">
                                    ▶ Play
                                </button>
                                <button class="library-remove-btn" data-action="remove-playlist" data-playlist-id="${playlist.id}">
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div class="library-playlist-preview">
                            ${tracksToShow.length
                                ? tracksToShow.map((track, idx) => `
                                    <div class="preview-track ${isExpanded ? 'expanded' : ''}">
                                        <span class="preview-track-name">${track.title || 'Unknown'}</span>
                                        <span class="preview-track-artist">${track.artist || 'Unknown Artist'}</span>
                                        ${track.duration ? `<span class="preview-track-duration">${formatDuration(track.duration)}</span>` : ''}
                                    </div>
                                `).join('')
                                : '<div class="preview-track muted">Track list unavailable</div>'}
                        </div>
                        ${hasMoreTracks ? `
                            <button class="library-expand-btn" data-action="toggle-playlist" data-playlist-id="${playlist.id}">
                                ${isExpanded ? '▲ Show less' : `▼ Show all ${trackCount} tracks`}
                            </button>
                        ` : ''}
                        <div class="library-playlist-meta">
                            Saved on ${new Date(savedAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');

        console.log('[LibraryView] Total playlist HTML length:', playlistHTML.length);

        return `
            <div class="library-playlists-grid">
                ${playlistHTML}
            </div>
        `;
    }

    /**
     * Render Songs Section
     *
     * Generates HTML for the saved songs section with playback controls.
     *
     * @returns {string} HTML string for songs section
     */
    renderSongs() {
        if (!this.state.songs.length) {
            return `
                <div class="library-empty-state">
                    <p>No songs saved yet. Use the heart icon next to any track to add it here.</p>
                </div>
            `;
        }

        return `
            <div class="library-song-list">
                ${this.state.songs.map(entry => `
                    <div class="library-song-row" data-song-id="${entry.song.id}">
                        <div class="song-main">
                            <div class="song-title">${entry.song.title}</div>
                            <div class="song-artist">${entry.song.artist}</div>
                        </div>
                        <div class="song-meta">
                            <span>${formatDuration(entry.song.duration)}</span>
                            <button class="library-play-btn" data-action="play-song" data-song-id="${entry.song.id}">
                                ▶
                            </button>
                            <button class="library-remove-btn" data-action="remove-song" data-song-id="${entry.song.id}">
                                ✕
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render Error State
     *
     * Shows error message with retry option when library loading fails.
     *
     * @param {Error} error - The error that occurred
     */
    renderError(error) {
        if (!this.root) return;

        this.root.innerHTML = `
            <div class="library-empty-state">
                <h3>Unable to load library</h3>
                <p>${error.message || 'Please try again later.'}</p>
                <button class="library-refresh-btn" id="refresh-library-btn">Try again</button>
            </div>
        `;

        this.attachEventHandlers();
    }

    /**
     * Attach Event Handlers
     *
     * Binds click handlers to all interactive elements in the library.
     */
    attachEventHandlers() {
        if (!this.root) return;

        // Refresh button
        const refreshBtn = this.root.querySelector('#refresh-library-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadLibrary());
        }

        // Remove playlist buttons
        this.root.querySelectorAll('[data-action="remove-playlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                this.removeItem('playlist', playlistId);
            });
        });

        // Remove song buttons
        this.root.querySelectorAll('[data-action="remove-song"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.getAttribute('data-song-id');
                this.removeItem('song', songId);
            });
        });

        // Play playlist buttons
        this.root.querySelectorAll('[data-action="play-playlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                this.playPlaylist(playlistId);
            });
        });

        // Play song buttons
        this.root.querySelectorAll('[data-action="play-song"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.getAttribute('data-song-id');
                this.playSong(songId);
            });
        });

        // Toggle playlist expansion buttons
        this.root.querySelectorAll('[data-action="toggle-playlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                this.togglePlaylistExpansion(playlistId);
            });
        });
    }

    /**
     * Toggle Playlist Expansion
     *
     * Expands or collapses a playlist to show/hide all tracks.
     *
     * @param {string} playlistId - ID of playlist to toggle
     */
    togglePlaylistExpansion(playlistId) {
        if (!playlistId) return;

        if (this.expandedPlaylists.has(playlistId)) {
            this.expandedPlaylists.delete(playlistId);
        } else {
            this.expandedPlaylists.add(playlistId);
        }

        this.render();
    }

    /**
     * Play Playlist
     *
     * Starts playback of a saved playlist through the music player.
     *
     * @param {string} playlistId - ID of playlist to play
     */
    playPlaylist(playlistId) {
        const entry = this.state.playlists.find(item => item.playlist.id === playlistId);
        if (!entry) {
            this.showToast('Unable to play playlist. Please try again.');
            return;
        }

        const player = window.musicPlayer;
        if (!player || typeof player.playLibraryPlaylist !== 'function') {
            this.showToast('Player is still initializing. Please try again.');
            return;
        }

        player.playLibraryPlaylist(entry.playlist);
    }

    /**
     * Play Song
     *
     * Starts playback of a saved song through the music player.
     *
     * @param {string} songId - ID of song to play
     */
    playSong(songId) {
        const entry = this.state.songs.find(item => item.song.id === songId);
        if (!entry) {
            this.showToast('Unable to play song. Please try again.');
            return;
        }

        const player = window.musicPlayer;
        if (!player || typeof player.playLibrarySong !== 'function') {
            this.showToast('Player is still initializing. Please try again.');
            return;
        }

        player.playLibrarySong(entry.song);
    }

    /**
     * Remove Item from Library
     *
     * Removes a playlist or song from the user's library.
     *
     * @async
     * @param {string} itemType - Type of item ('playlist' or 'song')
     * @param {string} itemId - ID of item to remove
     */
    async removeItem(itemType, itemId) {
        if (!this.user?.id || !itemId) return;

        try {
            const response = await fetch(`/api/library?userId=${this.user.id}&itemId=${itemId}&itemType=${itemType}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to update library');
            }

            // Update local state
            if (itemType === 'playlist') {
                this.state.playlists = this.state.playlists.filter(entry => entry.playlist.id !== itemId);
            } else {
                this.state.songs = this.state.songs.filter(entry => entry.song.id !== itemId);
            }

            // Notify other components
            window.dispatchEvent(new CustomEvent('musicare:library-changed', {
                detail: { entityType: itemType, entityId: itemId, source: 'library' }
            }));

            this.render();
        } catch (error) {
            console.error('LibraryView: unable to remove item', error);
            this.showToast('Unable to update library. Please try again.');
        }
    }

    /**
     * Show Toast Message
     *
     * Displays a temporary notification message to the user.
     *
     * @param {string} message - Message to display
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-info';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

/**
 * Format Mood Label
 *
 * Converts mood keys to user-friendly display labels.
 *
 * @function formatMoodLabel
 * @param {string} mood - Mood key to format
 * @returns {string} Formatted mood label
 */
function formatMoodLabel(mood) {
    if (!mood) return 'Wellness';

    const labels = {
        anxiety: 'Calm & Relief',
        focus: 'Focus',
        sleep: 'Sleep',
        relaxation: 'Relaxation',
        energy: 'Energy'
    };

    return labels[mood] || mood.charAt(0).toUpperCase() + mood.slice(1);
}

/**
 * Format Duration
 *
 * Converts seconds to MM:SS format for display.
 *
 * @function formatDuration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default LibraryView;
