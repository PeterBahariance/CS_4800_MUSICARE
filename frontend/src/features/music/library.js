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

const MAX_POST_CAPTION_LENGTH = 280;

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
     * @param {Object} options - Configuration options
     * @param {boolean} options.readOnly - If true, disables editing features (for viewing other users)
     * @param {string} options.viewingUserId - ID of user whose library is being viewed (for other users)
     * @param {string} options.viewingUserName - Display name of user being viewed
     */
    constructor(options = {}) {
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
         * Read-only mode (for viewing other users' libraries)
         * @type {boolean}
         */
        this.readOnly = options.readOnly || false;

        /**
         * ID of user whose library is being viewed (if viewing another user)
         * @type {string|null}
         */
        this.viewingUserId = options.viewingUserId || null;

        /**
         * Display name of user being viewed
         * @type {string|null}
         */
        this.viewingUserName = options.viewingUserName || null;

        /**
         * Library state
         * @type {Object}
         * @property {Array<Object>} playlists - User's saved playlists
         * @property {Array<Object>} songs - User's saved songs
         * @property {boolean} initialized - Whether library has been loaded
         */
        this.state = {
            playlists: [],
            myPlaylists: [],
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
         * Playlist sharing modal elements/state
         */
        this.postModalElements = null;
        this.currentPostPlaylist = null;
        this.isPostingPlaylist = false;

        /**
         * Listen for library changes from other components
         *
         * Reloads library when changes are detected from music player
         * or other components. Prevents infinite loops by checking source.
         * Only active in non-read-only mode.
         */
        if (!this.readOnly) {
            window.addEventListener('musicare:library-changed', (event) => {
                if (event?.detail?.source === 'library') return;
                if (this.user?.id && this.root) {
                    this.loadLibrary();
                }
            });
        }
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
     * In read-only mode, fetches the viewed user's library instead.
     *
     * @async
     * @returns {Promise<void>}
     */
    async loadLibrary() {
        // Determine which user's library to load
        const targetUserId = this.readOnly ? this.viewingUserId : this.user?.id;

        if (!targetUserId) {
            console.warn('[LibraryView] loadLibrary() called but no user ID');
            return;
        }
        if (!this.root) {
            console.warn('[LibraryView] loadLibrary() called but root is null, waiting for mount...');
            return;
        }

        console.log('[LibraryView] Starting library load for user:', targetUserId, this.readOnly ? '(read-only)' : '(own library)');
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
            const response = await fetch(`/api/library?userId=${targetUserId}`);

            if (!response.ok) {
                throw new Error(`Failed to load library: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[LibraryView] Loaded library data:', {
                playlists: data.savedPlaylists?.length || 0,
                myPlaylists: data.userPlaylists?.length || 0,
                songs: data.savedSongs?.length || 0,
                raw: data
            });

            this.state = {
                playlists: data.savedPlaylists || [],
                myPlaylists: data.userPlaylists || [],
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

        const ownedPlaylistsHTML = this.renderOwnedPlaylists();
        const playlistsHTML = this.renderPlaylists();
        const songsHTML = this.renderSongs();
        const ownedTitle = this.readOnly && this.viewingUserName
            ? `${this.viewingUserName}'s Playlists`
            : 'My Playlists';

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
                    <h3>${ownedTitle}</h3>
                    <span>${this.state.myPlaylists.length} playlists</span>
                </div>
                ${ownedPlaylistsHTML}
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
                    <h3>Liked Songs</h3>
                    <span>${this.state.songs.length} liked</span>
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
    renderOwnedPlaylists() {
        if (!this.state.myPlaylists || !this.state.myPlaylists.length) {
            const message = this.readOnly
                ? `${this.viewingUserName || 'This user'} hasn't created any playlists yet.`
                : 'You haven’t created any playlists yet. Use the + icon next to any song to build one.';
            return `
                <div class="library-empty-state">
                    <p>${message}</p>
                </div>
            `;
        }

        const playlistHTML = this.state.myPlaylists.map((entry, index) => {
            if (!entry?.playlist) {
                console.warn(`[LibraryView] Invalid owned playlist entry at index ${index}`, entry);
                return '';
            }

            const playlist = entry.playlist;
            const playlistOwnerId = playlist.ownerId || playlist.createdBy;
            const hasPost = Array.isArray(window.musicPlayer?.userPlaylistPosts)
            ? window.musicPlayer.userPlaylistPosts.some(post => post.playlistId === playlist.id)
            : false;
            const coverUrl = playlist.coverImage ? encodeURI(playlist.coverImage) : null;
            const coverStyle = coverUrl ? `style="background-image: url('${coverUrl}');"` : '';
            const moodClass = playlist.mood || 'default';
            const trackCount = playlist.trackCount ?? playlist.tracks?.length ?? 0;
            const createdAt = entry.createdAt || playlist.createdAt || new Date();
            const isExpanded = this.expandedPlaylists.has(playlist.id);
            const tracks = playlist.tracks || [];
            const tracksToShow = isExpanded ? tracks : tracks.slice(0, 3);
            const hasMoreTracks = tracks.length > tracksToShow.length;
            const canPostPlaylist = !this.readOnly && this.user?.id && this.user.id === playlistOwnerId;

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
                                ${canPostPlaylist ? `
                                    <button class="library-post-btn ${hasPost ? 'posted' : ''}" data-action="${hasPost ? 'delete-post' : 'open-post-modal'}" data-playlist-id="${playlist.id}">
                                        ${hasPost ? 'Delete Post' : 'Post'}
                                    </button>
                                ` : ''}
                                ${!this.readOnly ? `
                                    <button class="library-remove-btn" data-action="delete-user-playlist" data-playlist-id="${playlist.id}">
                                        ✕
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="library-playlist-preview">
                            ${tracksToShow.length
                                ? tracksToShow.map(track => {
                                    const originalIndex = (playlist.tracks || []).findIndex(t => t.id === track.id);
                                    const albumArtUrl = track.albumArt || 'https://via.placeholder.com/40x40/4a90e2/ffffff?text=♪';
                                    return `
                                        <div class="preview-track ${isExpanded ? 'expanded' : ''}" 
                                             data-action="play-owned-track"
                                             data-playlist-id="${playlist.id}" 
                                             data-song-id="${track.id || ''}"
                                             data-track-index="${originalIndex}">
                                            <img class="preview-track-art" src="${albumArtUrl}" alt="${track.title || 'Unknown'}" />
                                            <div class="preview-track-text">
                                                <span class="preview-track-name">${track.title || 'Unknown'}</span>
                                                <span class="preview-track-artist">${track.artist || 'Unknown Artist'}</span>
                                            </div>
                                            <div class="preview-track-meta">
                                                ${track.duration ? `<span class="preview-track-duration">${formatDuration(track.duration)}</span>` : ''}
                                                <button class="library-play-btn" data-action="play-owned-track-btn" data-playlist-id="${playlist.id}" data-track-index="${originalIndex}">
                                                    ▶
                                                </button>
                                                ${!this.readOnly && track.id ? `
                                                    <button class="library-remove-btn track-remove-btn" data-action="remove-user-playlist-track" data-playlist-id="${playlist.id}" data-song-id="${track.id}">
                                                        ✕
                                                    </button>` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('')
                                : '<div class="preview-track muted">Add songs to this playlist from the + button near any track.</div>'}
                        </div>
                        ${hasMoreTracks ? `
                            <button class="library-expand-btn" data-action="toggle-playlist" data-playlist-id="${playlist.id}">
                                ${isExpanded ? '▲ Show less' : `▼ Show all ${trackCount} tracks`}
                            </button>
                        ` : ''}
                        <div class="library-playlist-meta">
                            Created on ${new Date(createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');

        return `
            <div class="library-playlists-grid">
                ${playlistHTML}
            </div>
        `;
    }

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
                                ${!this.readOnly ? `
                                    <button class="library-remove-btn" data-action="remove-playlist" data-playlist-id="${playlist.id}">
                                        ✕
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="library-playlist-preview">
                            ${tracksToShow.length
                                ? tracksToShow.map(track => {
                                    const originalIndex = (playlist.tracks || []).findIndex(t => t.id === track.id);
                                    const albumArtUrl = track.albumArt || 'https://via.placeholder.com/40x40/4a90e2/ffffff?text=♪';
                                    return `
                                        <div class="preview-track ${isExpanded ? 'expanded' : ''}"
                                             data-action="play-saved-track"
                                             data-playlist-id="${playlist.id}"
                                             data-song-id="${track.id || ''}"
                                             data-track-index="${originalIndex}">
                                            <img class="preview-track-art" src="${albumArtUrl}" alt="${track.title || 'Unknown'}" />
                                            <div class="preview-track-text">
                                                <span class="preview-track-name">${track.title || 'Unknown'}</span>
                                                <span class="preview-track-artist">${track.artist || 'Unknown Artist'}</span>
                                            </div>
                                            <div class="preview-track-meta">
                                                ${track.duration ? `<span class="preview-track-duration">${formatDuration(track.duration)}</span>` : ''}
                                                <button class="library-play-btn" data-action="play-saved-track-btn" data-playlist-id="${playlist.id}" data-track-index="${originalIndex}">
                                                    ▶
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')
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
                    <p>No liked songs yet. Use the heart icon next to any track to add one.</p>
                </div>
            `;
        }

        return `
            <div class="library-song-list">
                ${this.state.songs.map(entry => {
                    const albumArtUrl = entry.song.albumArt || 'https://via.placeholder.com/60x60/4a90e2/ffffff?text=♪';
                    return `
                        <div class="library-song-row" data-action="play-liked-track" data-song-id="${entry.song.id}">
                            <img class="song-album-art" src="${albumArtUrl}" alt="${entry.song.title}" />
                            <div class="song-main">
                                <div class="song-title">${entry.song.title}</div>
                                <div class="song-artist">${entry.song.artist}</div>
                            </div>
                            <div class="song-meta">
                                <span>${formatDuration(entry.song.duration)}</span>
                                <button class="library-play-btn" data-action="play-song" data-song-id="${entry.song.id}">
                                    ▶
                                </button>
                                ${!this.readOnly ? `
                                    <button class="library-remove-btn" data-action="remove-song" data-song-id="${entry.song.id}">
                                        ✕
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
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

        // Delete user-created playlist buttons
        this.root.querySelectorAll('[data-action="delete-user-playlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                this.deleteUserPlaylist(playlistId);
            });
        });

        // Open share/post modal for owned playlists
        if (!this.readOnly) {
            this.root.querySelectorAll('[data-action="open-post-modal"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const playlistId = btn.getAttribute('data-playlist-id');
                    const entry = this.state.myPlaylists.find(item => item?.playlist?.id === playlistId);
                    if (!entry?.playlist) {
                        this.showToast('Playlist unavailable.');
                        return;
                    }
                    this.openPostModal(entry.playlist);
                });
            });

            this.root.querySelectorAll('[data-action="delete-post"]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const playlistId = btn.getAttribute('data-playlist-id');
                    await this.deletePlaylistPost(playlistId);
                });
            });
        }

        // Remove track from user playlist buttons
        this.root.querySelectorAll('[data-action="remove-user-playlist-track"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                const songId = btn.getAttribute('data-song-id');
                this.removeSongFromUserPlaylist(playlistId, songId);
            });
        });

        // Play owned playlist track (clicking on track row)
        this.root.querySelectorAll('[data-action="play-owned-track"]').forEach(trackEl => {
            trackEl.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('[data-action="remove-user-playlist-track"]');
                const playBtn = e.target.closest('[data-action="play-owned-track-btn"]');
                if (removeBtn || playBtn) return;

                const playlistId = trackEl.getAttribute('data-playlist-id');
                const songId = trackEl.getAttribute('data-song-id');
                const trackIndex = parseInt(trackEl.getAttribute('data-track-index'), 10);
                this.playOwnedPlaylistTrack(playlistId, songId, Number.isNaN(trackIndex) ? null : trackIndex);
            });
        });

        // Play owned playlist track button
        this.root.querySelectorAll('[data-action="play-owned-track-btn"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                const trackIndex = parseInt(btn.getAttribute('data-track-index'), 10);
                const trackRow = btn.closest('[data-action="play-owned-track"]');
                const songId = trackRow ? trackRow.getAttribute('data-song-id') : null;
                this.playOwnedPlaylistTrack(playlistId, songId, Number.isNaN(trackIndex) ? null : trackIndex);
            });
        });

        // Play saved playlist track (clicking on track row)
        this.root.querySelectorAll('[data-action="play-saved-track"]').forEach(trackEl => {
            trackEl.addEventListener('click', (e) => {
                const playBtn = e.target.closest('[data-action="play-saved-track-btn"]');
                if (playBtn) return;

                const playlistId = trackEl.getAttribute('data-playlist-id');
                const songId = trackEl.getAttribute('data-song-id');
                const trackIndex = parseInt(trackEl.getAttribute('data-track-index'), 10);
                this.playSavedPlaylistTrack(playlistId, songId, Number.isNaN(trackIndex) ? null : trackIndex);
            });
        });

        // Play saved playlist track button
        this.root.querySelectorAll('[data-action="play-saved-track-btn"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                const trackIndex = parseInt(btn.getAttribute('data-track-index'), 10);
                const trackRow = btn.closest('[data-action="play-saved-track"]');
                const songId = trackRow ? trackRow.getAttribute('data-song-id') : null;
                this.playSavedPlaylistTrack(playlistId, songId, Number.isNaN(trackIndex) ? null : trackIndex);
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

        // Play liked song row
        this.root.querySelectorAll('[data-action="play-liked-track"]').forEach(row => {
            row.addEventListener('click', (e) => {
                const blocked = e.target.closest('[data-action="remove-song"], .library-play-btn');
                if (blocked) return;
                const songId = row.getAttribute('data-song-id');
                this.playSong(songId);
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
        const entry = this.state.playlists.find(item => item.playlist.id === playlistId)
            || this.state.myPlaylists.find(item => item.playlist.id === playlistId);
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
     * Play a specific track from a user-owned playlist.
     *
     * @param {string} playlistId
     * @param {string} songId
     * @param {number|null} trackIndex
     */
    playOwnedPlaylistTrack(playlistId, songId, trackIndex = null) {
        const entry = this.state.myPlaylists.find(item => item.playlist.id === playlistId);
        if (!entry) {
            this.showToast('Playlist unavailable. Please refresh.');
            return;
        }

        const player = window.musicPlayer;
        if (!player || typeof player.playLibraryPlaylist !== 'function' || typeof player.playTrack !== 'function') {
            this.showToast('Player is still initializing. Please try again.');
            return;
        }

        const playlist = entry.playlist;
        if (!playlist?.tracks?.length) {
            this.showToast('This playlist has no playable tracks yet.');
            return;
        }

        const resolvedIndex = (trackIndex !== null && trackIndex >= 0)
            ? trackIndex
            : playlist.tracks.findIndex(track => track.id === songId);

        if (resolvedIndex < 0) {
            this.showToast('Track unavailable. Please refresh.');
            return;
        }

        player.playLibraryPlaylist(playlist);
        player.playTrack(resolvedIndex);
    }

    /**
     * Play a specific track from a saved playlist.
     *
     * @param {string} playlistId
     * @param {string} songId
     * @param {number|null} trackIndex
     */
    playSavedPlaylistTrack(playlistId, songId, trackIndex = null) {
        const entry = this.state.playlists.find(item => item.playlist.id === playlistId);
        if (!entry) {
            this.showToast('Playlist unavailable. Please refresh.');
            return;
        }

        const player = window.musicPlayer;
        if (!player || typeof player.playLibraryPlaylist !== 'function' || typeof player.playTrack !== 'function') {
            this.showToast('Player is still initializing. Please try again.');
            return;
        }

        const playlist = entry.playlist;
        const tracks = playlist?.tracks || playlist?.previewTracks || [];
        if (!tracks.length) {
            this.showToast('Track list unavailable for this playlist.');
            return;
        }

        const resolvedIndex = (trackIndex !== null && trackIndex >= 0)
            ? trackIndex
            : tracks.findIndex(track => track.id === songId);

        if (resolvedIndex < 0) {
            this.showToast('Track unavailable. Please refresh.');
            return;
        }

        player.playLibraryPlaylist(playlist);
        player.playTrack(resolvedIndex);
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
     * Remove a specific song from a user-created playlist.
     *
     * @param {string} playlistId - Playlist ID
     * @param {string} songId - Song ID to remove
     */
    async removeSongFromUserPlaylist(playlistId, songId) {
        if (!this.user?.id || !playlistId || !songId) return;

        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'removeSong',
                    playlistId,
                    songId,
                    userId: this.user.id
                })
            });

            if (!response.ok) {
                let details = 'Unable to update playlist.';
                try {
                    const data = await response.json();
                    details = data?.error || data?.details || details;
                } catch {
                    // ignore parse errors
                }
                throw new Error(details);
            }

            const payload = await response.json();
            const updatedPlaylist = payload?.playlist;

            if (updatedPlaylist) {
                this.state.myPlaylists = this.state.myPlaylists.map(entry => {
                    if (entry.playlist.id === playlistId) {
                        return {
                            ...entry,
                            playlist: updatedPlaylist,
                            updatedAt: updatedPlaylist.updatedAt || entry.updatedAt
                        };
                    }
                    return entry;
                });
            } else {
                // Fallback: remove song locally
                this.state.myPlaylists = this.state.myPlaylists.map(entry => {
                    if (entry.playlist.id === playlistId) {
                        return {
                            ...entry,
                            playlist: {
                                ...entry.playlist,
                                tracks: (entry.playlist.tracks || []).filter(track => track.id !== songId),
                                trackCount: Math.max((entry.playlist.trackCount || entry.playlist.tracks?.length || 0) - 1, 0)
                            }
                        };
                    }
                    return entry;
                });
            }

            this.showToast('Removed from playlist.');

            window.dispatchEvent(new CustomEvent('musicare:library-changed', {
                detail: {
                    entityType: 'playlist',
                    entityId: playlistId,
                    source: 'library',
                    reason: 'user-playlist-track-removed'
                }
            }));

            this.render();
        } catch (error) {
            console.error('LibraryView: unable to remove playlist track', error);
            this.showToast(error.message || 'Unable to remove song from playlist.');
        }
    }

    /**
     * Delete a user-created playlist entirely.
     *
     * @param {string} playlistId - Playlist ID to delete
     */
    async deleteUserPlaylist(playlistId) {
        if (!playlistId || this.readOnly) return;

        try {
            const response = await fetch(`/api/playlists?id=${playlistId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete playlist');
            }

            this.state.myPlaylists = this.state.myPlaylists.filter(entry => entry?.playlist?.id !== playlistId);

            window.dispatchEvent(new CustomEvent('musicare:library-changed', {
                detail: { entityType: 'playlist', entityId: playlistId, source: 'library', reason: 'user-playlist-deleted' }
            }));

            this.render();
            this.showToast('Playlist deleted.');
        } catch (error) {
            console.error('LibraryView: unable to delete user playlist', error);
            this.showToast('Unable to delete playlist. Please try again.');
        }
    }

    /**
     * Ensure Playlist Post Modal Exists
     *
     * @returns {Object} modal elements cache
     */
    ensurePostModalElements() {
        if (this.postModalElements) return this.postModalElements;

        const overlay = document.createElement('div');
        overlay.className = 'playlist-post-overlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div class="playlist-post-window">
                <button class="playlist-post-close" type="button" data-post-close>&times;</button>
                <div class="playlist-post-header">
                    <div class="playlist-post-cover" data-post-cover></div>
                    <div>
                        <h3 data-post-title>Share Playlist</h3>
                        <p data-post-meta></p>
                    </div>
                </div>
                <label class="playlist-post-label" for="playlist-post-caption">Add a caption (optional)</label>
                <textarea id="playlist-post-caption" data-post-caption maxlength="${MAX_POST_CAPTION_LENGTH}" placeholder="Share why this playlist fits the vibe..."></textarea>
                <div class="playlist-post-footer">
                    <span class="playlist-post-counter" data-post-counter>0 / ${MAX_POST_CAPTION_LENGTH}</span>
                    <div class="playlist-post-actions">
                        <button class="playlist-post-cancel" type="button" data-post-close>Cancel</button>
                        <button class="playlist-post-submit" type="button" data-post-submit data-default-label="Share playlist">Share playlist</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const elements = {
            overlay,
            title: overlay.querySelector('[data-post-title]'),
            meta: overlay.querySelector('[data-post-meta]'),
            cover: overlay.querySelector('[data-post-cover]'),
            caption: overlay.querySelector('[data-post-caption]'),
            counter: overlay.querySelector('[data-post-counter]'),
            submit: overlay.querySelector('[data-post-submit]')
        };

        overlay.querySelectorAll('[data-post-close]').forEach(btn => {
            btn.addEventListener('click', () => this.closePostModal());
        });

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.closePostModal();
            }
        });

        elements.caption.addEventListener('input', () => this.updatePostCaptionCounter());
        elements.submit.addEventListener('click', () => this.handlePostSubmit());

        this.postModalElements = elements;
        return elements;
    }

    /**
     * Open playlist sharing modal
     *
     * @param {Object} playlist
     */
    openPostModal(playlist) {
        if (this.readOnly || !this.user?.id) {
            this.showToast('Sign in to share playlists.');
            return;
        }

        if (!playlist) {
            this.showToast('Playlist unavailable.');
            return;
        }

        const elements = this.ensurePostModalElements();
        this.currentPostPlaylist = playlist;

        elements.title.textContent = playlist.title || 'Untitled Playlist';
        const moodLabel = formatMoodLabel(playlist.mood || 'wellness');
        const trackCount = playlist.trackCount ?? playlist.tracks?.length ?? 0;
        elements.meta.textContent = `${trackCount} track${trackCount === 1 ? '' : 's'} • ${moodLabel}`;

        if (playlist.coverImage) {
            const encoded = encodeURI(playlist.coverImage);
            elements.cover.style.backgroundImage = `url('${encoded}')`;
            elements.cover.classList.add('has-image');
        } else {
            elements.cover.style.backgroundImage = '';
            elements.cover.classList.remove('has-image');
        }

        elements.caption.value = '';
        this.updatePostCaptionCounter();
        elements.submit.disabled = false;
        elements.submit.textContent = elements.submit.dataset.defaultLabel || 'Share playlist';

        elements.overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            elements.overlay.classList.add('active');
        });

        setTimeout(() => elements.caption.focus(), 50);
    }

    /**
     * Close playlist post modal
     */
    closePostModal() {
        if (!this.postModalElements) return;
        this.postModalElements.overlay.classList.remove('active');
        this.postModalElements.overlay.style.display = 'none';
        this.currentPostPlaylist = null;
        this.isPostingPlaylist = false;
        this.postModalElements.submit.disabled = false;
        this.postModalElements.submit.textContent = this.postModalElements.submit.dataset.defaultLabel || 'Share playlist';
    }

    /**
     * Update caption character counter
     */
    updatePostCaptionCounter() {
        if (!this.postModalElements) return;
        const value = this.postModalElements.caption.value || '';
        this.postModalElements.counter.textContent = `${value.length} / ${MAX_POST_CAPTION_LENGTH}`;
    }

    /**
     * Submit playlist post to API
     */
    async handlePostSubmit() {
        if (this.isPostingPlaylist) return;
        if (!this.currentPostPlaylist || !this.user?.id) {
            this.showToast('Unable to share playlist right now.');
            return;
        }

        const elements = this.ensurePostModalElements();
        const caption = elements.caption.value.trim();

        try {
            this.isPostingPlaylist = true;
            elements.submit.disabled = true;
            elements.submit.textContent = 'Sharing...';

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.user.id,
                    playlistId: this.currentPostPlaylist.id,
                    caption
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || 'Failed to share playlist.');
            }

            const sharedPlaylistId = this.currentPostPlaylist.id;
            this.showToast('Playlist shared with friends!');
            this.closePostModal();

            window.dispatchEvent(new CustomEvent('musicare:friends-feed-updated', {
                detail: {
                    source: 'library',
                    playlistId: sharedPlaylistId
                }
            }));

            if (!window.musicPlayer) return;
            await window.musicPlayer.loadFriendsPosts(true);
            await window.musicPlayer.loadLibraryState(true);
            this.loadLibrary();
        } catch (error) {
            console.error('LibraryView: unable to share playlist', error);
            this.showToast(error.message || 'Unable to share playlist.');
            this.isPostingPlaylist = false;
            elements.submit.disabled = false;
            elements.submit.textContent = elements.submit.dataset.defaultLabel || 'Share playlist';
        }
    }

    async deletePlaylistPost(playlistId) {
        if (!this.user?.id) return;

        try {
            const response = await fetch('/api/posts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.user.id, playlistId })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || 'Failed to delete post.');
            }

            this.showToast('Playlist post removed.');

            window.dispatchEvent(new CustomEvent('musicare:friends-feed-updated', {
                detail: {
                    source: 'library',
                    playlistId
                }
            }));

            if (window.musicPlayer) {
                await window.musicPlayer.loadFriendsPosts(true);
                await window.musicPlayer.loadLibraryState(true);
            }
            this.loadLibrary();
        } catch (error) {
            console.error('LibraryView: unable to delete playlist post', error);
            this.showToast(error.message || 'Unable to delete post.');
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

    /**
     * Create User Library Viewer
     *
     * Static factory method to create a read-only library view for viewing
     * another user's library. This is used when clicking "View Library" on
     * a user's profile.
     *
     * @static
     * @param {Object} user - User object whose library to view
     * @param {string} user.id - User's database ID
     * @param {string} user.displayName - User's display name
     * @param {HTMLElement} containerElement - DOM element to render library in
     * @returns {LibraryView} Read-only library view instance
     *
     * @example
     * const viewer = LibraryView.createUserLibraryViewer(
     *   { id: '123', displayName: 'Patrick' },
     *   document.getElementById('user-library-container')
     * );
     */
    static createUserLibraryViewer(user, containerElement) {
        console.log('[LibraryView] Creating user library viewer for:', user.displayName);

        const viewer = new LibraryView({
            readOnly: true,
            viewingUserId: user.id,
            viewingUserName: user.displayName || user.username || 'User'
        });

        // Set a dummy user object (needed for some internal checks)
        viewer.user = { id: user.id };

        // Set the root element
        viewer.root = containerElement;

        // Load the library
        viewer.loadLibrary();

        return viewer;
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
