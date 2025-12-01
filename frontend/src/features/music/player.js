/**
 * @fileoverview Music Player Module
 *
 * Comprehensive music player for the Musicare application with therapeutic
 * music playback, personalized recommendations, and library management.
 *
 * 
 * Features:
 * - Audio playback with HTML5 Audio API
 * - Personalized playlist recommendations based on health goals
 * - Genre-based music discovery
 * - Jamendo API integration for therapeutic music
 * - Save/unsave playlists and songs to library
 * - Playlist creation and management
 * - Progress tracking and time display
 * - Volume control
 * - Shuffle and repeat modes
 * - Responsive UI with animations
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 * @requires /api/playlists - Playlist management API
 * @requires /api/users - User profile API
 *
 * @example
 * // This module is loaded in app.html and automatically initializes:
 * // const player = new MusicPlayer();
 */

console.log('🎵 Music Player: Module file loaded!');

/**
 * Health Goal Metadata Configuration
 *
 * Maps health goals to display metadata and associated moods.
 * Used for personalized playlist recommendations and UI display.
 *
 * @constant {Object} HEALTH_GOAL_METADATA
 * @property {Object} mental_wellness - Mental wellness goal configuration
 * @property {string} mental_wellness.title - Display title
 * @property {string} mental_wellness.subtitle - Description text
 * @property {Array<string>} mental_wellness.moods - Associated mood tags for playlist matching
 */
const HEALTH_GOAL_METADATA = {
    mental_wellness: {
        title: 'Mental Wellness',
        subtitle: 'Grounding mixes for balance and clarity',
        moods: ['relaxation', 'focus']
    },
    stress_relief: {
        title: 'Stress Relief',
        subtitle: 'Ease tension with calming instrumentals',
        moods: ['anxiety', 'relaxation']
    },
    sleep_improvement: {
        title: 'Sleep Improvement',
        subtitle: 'Gentle lullabies to drift into rest',
        moods: ['sleep']
    },
    focus: {
        title: 'Deep Focus',
        subtitle: 'Ambient patterns for productive flow',
        moods: ['focus']
    },
    meditation: {
        title: 'Meditation Moments',
        subtitle: 'Breath-aligned sound baths',
        moods: ['relaxation']
    },
    exercise: {
        title: 'Energizing Movement',
        subtitle: 'High-vibe beats to get moving',
        moods: ['energy']
    },
    anxiety_relief: {
        title: 'Anxiety Relief',
        subtitle: 'Soothing textures for steady breathing',
        moods: ['anxiety', 'relaxation']
    },
    mood_boost: {
        title: 'Mood Boost',
        subtitle: 'Feel-good rhythms to lift your energy',
        moods: ['energy', 'focus']
    },
    lofi_therapy: {
        title: 'Lo-fi Therapy',
        subtitle: 'Soft lo-fi textures for gentle background comfort',
        moods: ['relaxation']
    }
};

/**
 * Section Playlist Limit
 *
 * Maximum number of playlists to display per section (health goal or genre).
 *
 * @constant {number} SECTION_PLAYLIST_LIMIT
 */
const SECTION_PLAYLIST_LIMIT = 10;

/**
 * Health Goal Aliases
 *
 * Maps common typos or variations to canonical health goal names.
 *
 * @constant {Object} HEALTH_GOAL_ALIASES
 */
const HEALTH_GOAL_ALIASES = {
    mental_wellnes: 'mental_wellness',
    'lo-fi_therapy': 'lofi_therapy',
    deep_focus: 'focus'
};

/**
 * Genre Preference Aliases
 *
 * Maps genre variations and synonyms to canonical genre names.
 * Handles different spellings and formats (e.g., "R&B" → "rnb").
 *
 * @constant {Object} GENRE_PREFERENCE_ALIASES
 */
const GENRE_PREFERENCE_ALIASES = {
    'r&b': 'rnb',
    'rhythm and blues': 'rnb',
    'rnb': 'rnb',
    'nature sounds': 'nature',
    'nature sound': 'nature',
    'nature': 'nature',
    'rain sounds': 'nature',
    'rain sound': 'nature'
};

/**
 * Music Player Class
 *
 * Main class managing all music playback and library functionality.
 * Integrates with Jamendo API for music discovery and Prisma database
 * for user library management.
 *
 * @class MusicPlayer
 */
class MusicPlayer {
    /**
     * Initialize Music Player
     *
     * Sets up the audio player, initializes state, and loads user library.
     *
     * @constructor
     */
    constructor() {
        /**
         * HTML5 Audio element for playback
         * @type {Audio}
         */
        this.audio = new Audio();

        /**
         * Currently loaded playlist
         * @type {Object|null}
         */
        this.currentPlaylist = null;

        /**
         * Currently playing track
         * @type {Object|null}
         */
        this.currentTrack = null;

        /**
         * Index of current track in playlist
         * @type {number}
         */
        this.currentTrackIndex = 0;

        /**
         * Playback state
         * @type {boolean}
         */
        this.isPlaying = false;

        /**
         * Personalized sections (health goals + genres)
         * @type {Array<Object>}
         */
        this.sections = [];

        /**
         * User context with profile data
         * @type {Object|null}
         */
        this.userContext = window.musicareUserContext || null;

        /**
         * Set of saved playlist IDs
         * @type {Set<string>}
         */
        this.savedPlaylists = new Set();

        /**
         * Set of saved song IDs
         * @type {Set<string>}
         */
        this.savedSongs = new Set();

        /**
         * Array of playlists created by the user
         * @type {Array<Object>}
         */
        this.userPlaylists = [];

        /**
         * Set of song IDs that already exist inside user-created playlists
         * @type {Set<string>}
         */
        this.userPlaylistSongIds = new Set();

        /**
         * State + DOM references for the add-to-playlist modal
         * @type {Object|null}
         */
        this.playlistModalState = null;
        this.playlistModalOverlay = null;
        this.playlistModalContent = null;
        this.boundPlaylistModalKeydown = null;

        /**
         * Library load state
         * @type {boolean}
         */
        this.libraryLoaded = false;

        /**
         * Friends feed state
         */
        this.friendPosts = [];
        this.friendPostsLoaded = false;
        this.friendPostsLoading = false;

        // Listen for when a new friends-feed page is cloned
        window.addEventListener('musicare:friends-feed-cloned', () => {
            // Re-render friends posts to all containers (including the newly cloned one)
            if (this.friendPostsLoaded && this.friendPosts.length > 0) {
                this.renderFriendsPosts();
            } else if (!this.friendPostsLoading) {
                this.renderFriendsPostsEmpty('Sign in to see what your friends are sharing.');
            }
        });

        this.init();
    }

    /**
     * Initialize Music Player
     *
     * Sets up event listeners, loads user library, and renders personalized sections.
     *
     * @function init
     */
    init() {
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.onTrackLoaded());
        this.audio.addEventListener('error', (e) => this.handleError(e));

        this.setupGlobalListeners();
        this.setupPlayerControls();
        this.bootstrap();
    }

    setupGlobalListeners() {
        document.addEventListener('musicare:user-ready', (event) => {
            this.userContext = event.detail;
            this.initializeForUser();
        });

        window.addEventListener('musicare:library-changed', (event) => {
            this.loadLibraryState(true).then(() => {
                const source = event?.detail?.source;
                if (source !== 'player' && this.sections.length) {
                    this.renderSections();
                }
            });
        });

        document.addEventListener('musicare:play-library-playlist', (event) => {
            const playlist = event.detail?.playlist;
            if (playlist) {
                this.playLibraryPlaylist(playlist);
            }
        });

        document.addEventListener('musicare:play-library-song', (event) => {
            const song = event.detail?.song;
            if (song) {
                this.playLibrarySong(song);
            }
        });

        window.addEventListener('musicare:friends-feed-updated', () => {
            if (this.userContext?.id) {
                this.loadFriendsPosts(true);
            }
        });

        // Listen for chatbot playlist recommendations
        window.addEventListener('musicare:chatbot-playlist-recommendation', (event) => {
            console.log('🎵 Music Player: Received chatbot playlist recommendation:', event.detail);
            this.handleChatbotRecommendation(event.detail);
        });
    }

    bootstrap() {
        if (this.userContext) {
            this.initializeForUser();
        } else {
            this.renderEmptyState('Sign in to unlock personalized playlists tailored for you.');
            this.updateStatus('Sign in to unlock personalized playlists.');
            this.updateHomeSummary();
            this.renderFriendsPostsEmpty('Sign in to see what your friends are sharing.');
        }
    }

    buildSectionsConfig() {
        const sections = [];
        const goals = Array.isArray(this.userContext?.healthGoals)
            ? [...new Set(this.userContext.healthGoals)]
            : [];
        const preferences = Array.isArray(this.userContext?.musicPreferences)
            ? [...new Set(this.userContext.musicPreferences)]
            : [];

        let resolvedGoalCount = 0;
        let resolvedPrefCount = 0;

        goals.forEach(goal => {
            const normalizedGoal = normalizeTag(goal);
            if (!normalizedGoal) return;
            const resolvedKey = HEALTH_GOAL_METADATA[normalizedGoal]
                ? normalizedGoal
                : HEALTH_GOAL_ALIASES[normalizedGoal];
            if (!resolvedKey) return;
            const meta = HEALTH_GOAL_METADATA[resolvedKey];
            if (!meta) return;

            sections.push({
                id: `goal-${resolvedKey}`,
                title: meta.title,
                subtitle: meta.subtitle,
                request: { goal: resolvedKey },
                limit: SECTION_PLAYLIST_LIMIT,
                analytics: { goal: resolvedKey }
            });
            resolvedGoalCount += 1;
        });

        preferences
            .filter(Boolean)
            .slice(0, 4)
            .forEach(pref => {
                const cleanPref = pref.trim();
                if (!cleanPref) return;
                const normalizedPref = normalizeTag(cleanPref);
                if (!normalizedPref) return;
                const resolvedGenre = GENRE_PREFERENCE_ALIASES[normalizedPref] || normalizedPref;

                sections.push({
                    id: `pref-${slugify(cleanPref)}`,
                    title: `${cleanPref} Therapy Mix`,
                    subtitle: `Because you love ${cleanPref}`,
                    request: { genre: resolvedGenre },
                    limit: SECTION_PLAYLIST_LIMIT,
                    analytics: { preference: cleanPref }
                });
                resolvedPrefCount += 1;
            });

        if (!sections.length) {
            sections.push({
                id: 'mood-boosters',
                title: 'Mood Boosters',
                subtitle: 'Relaxation • Focus • Sleep',
                request: { goal: 'mental_wellness' },
                limit: SECTION_PLAYLIST_LIMIT
            });
        }

        return {
            sections,
            goalCount: resolvedGoalCount,
            prefCount: resolvedPrefCount
        };
    }

    async initializeForUser() {
        if (!this.userContext) return;

        this.friendPosts = [];
        this.friendPostsLoaded = false;
        this.renderFriendsPostsLoading();

        await this.loadLibraryState();
        await Promise.all([
            this.loadPlaylistSections(),
            this.loadFriendsPosts()
        ]);
    }

    updateStatus(message) {
        const statusEl = document.getElementById('playlist-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    updateHomeSummary(context = {}) {
        const summary = document.getElementById('home-mood-summary');
        if (!summary) return;

        if (!this.userContext) {
            summary.textContent = 'Sign in to receive personalized recommendations.';
            return;
        }

        const goalCount = context.goalCount ?? (this.userContext.healthGoals?.length || 0);
        const prefCount = context.prefCount ?? (this.userContext.musicPreferences?.length || 0);

        const parts = [];
        if (goalCount) {
            parts.push(`${goalCount} health goal${goalCount > 1 ? 's' : ''}`);
        }
        if (prefCount) {
            parts.push(`${prefCount} music taste${prefCount > 1 ? 's' : ''}`);
        }

        const basis = parts.length ? parts.join(' + ') : 'core wellness moods';
        const name = this.userContext.displayName || this.userContext.email || 'you';
        summary.textContent = `Personalized for ${name} • Based on ${basis}`;
    }

    async loadLibraryState(forceReload = false) {
        if (!this.userContext?.id) return;
        if (this.libraryLoaded && !forceReload) return;

        try {
            const response = await fetch(`/api/library?userId=${this.userContext.id}`);
            if (!response.ok) {
                throw new Error('Failed to load library');
            }

            const data = await response.json();
            const userPostData = Array.isArray(data.userPlaylistPosts) ? data.userPlaylistPosts : [];

            this.savedPlaylists = new Set(
                (data.savedPlaylists || []).map(entry => entry.playlist.id)
            );
            this.savedSongs = new Set(
                (data.savedSongs || []).map(entry => entry.song.id)
            );
            this.userPlaylists = (data.userPlaylists || [])
                .map(entry => this.normalizeUserPlaylist(entry))
                .filter(Boolean);
            this.userPlaylistPosts = userPostData;
            this.rebuildUserPlaylistSongIndex();
            this.refreshPlaylistSaveIndicators();
            this.libraryLoaded = true;
        } catch (error) {
            console.error('Unable to load library state:', error);
        }
    }

    normalizeUserPlaylist(entry) {
        if (!entry) return null;
        const playlist = entry.playlist || entry;
        if (!playlist?.id) return null;

        return {
            id: playlist.id,
            title: playlist.title || 'Untitled Playlist',
            description: playlist.description || '',
            mood: playlist.mood || 'wellness',
            coverImage: playlist.coverImage,
            tracks: Array.isArray(playlist.tracks) ? playlist.tracks : [],
            trackCount: playlist.trackCount ?? (playlist.tracks?.length || 0),
            createdAt: entry.createdAt || playlist.createdAt,
            updatedAt: entry.updatedAt || playlist.updatedAt
        };
    }

    rebuildUserPlaylistSongIndex() {
        this.userPlaylistSongIds = new Set();
        (this.userPlaylists || []).forEach(playlist => {
            (playlist.tracks || []).forEach(track => {
                if (track?.id) {
                    this.userPlaylistSongIds.add(track.id);
                }
            });
        });
    }

    isSongInUserPlaylist(trackId) {
        if (!trackId) return false;
        return this.userPlaylistSongIds.has(trackId);
    }

    updatePlaylistSaveButtons(trackId) {
        const isInPlaylist = this.isSongInUserPlaylist(trackId);
        const buttons = document.querySelectorAll(`[data-track-id="${trackId}"] .playlist-save-btn`);
        buttons.forEach(button => {
            button.classList.toggle('saved', isInPlaylist);
            button.textContent = isInPlaylist ? '✓' : '+';
        });
    }

    refreshPlaylistSaveIndicators() {
        const buttons = document.querySelectorAll('.playlist-save-btn');
        buttons.forEach(button => {
            const trackId = button.getAttribute('data-track-id');
            if (!trackId) return;
            const inPlaylist = this.isSongInUserPlaylist(trackId);
            button.classList.toggle('saved', inPlaylist);
            button.textContent = inPlaylist ? '✓' : '+';
        });
    }

    async loadPlaylistSections() {
        if (!this.userContext) {
            this.updateStatus('Loading your wellness profile...');
            this.renderEmptyState('Sign in to view your personalized playlists.');
            return;
        }

        this.updateStatus('Loading playlists...');
        this.renderEmptyState('Loading playlists...');

        const { sections, goalCount, prefCount } = this.buildSectionsConfig();
        this.updateHomeSummary({
            goalCount,
            prefCount
        });

        try {
            const sectionResults = await Promise.all(
                sections.map(cfg =>
                    this.fetchSectionData(cfg).catch(error => {
                        console.error('🎵 Music Player: Section load failed', cfg.id, error);
                        return { ...cfg, playlists: [] };
                    })
                )
            );

        this.sections = sectionResults
            .filter(Boolean)
            .map(section => ({
                ...section,
                playlists: getRandomSubset(section.playlists, section.limit || SECTION_PLAYLIST_LIMIT)
            }));
            this.renderSections();

            const firstPlaylist = this.sections.find(section => section.playlists?.length)?.playlists[0];
            if (firstPlaylist) {
                this.selectPlaylist(firstPlaylist);
                const activeSections = this.sections.filter(section => section.playlists?.length).length;
                this.updateStatus(`Curating ${activeSections || 1} personalized ${activeSections === 1 ? 'set' : 'sets'}.`);
            } else {
                this.updateStatus('No personalized playlists found yet. Try refreshing soon.');
            }
        } catch (error) {
            console.error('🎵 Music Player: Error loading playlists:', error);
            this.renderEmptyState('Unable to load playlists. Please try again.');
            this.updateStatus('Unable to load playlists. Please try again.');
            this.showError('Failed to load playlists. Please try again.');
        }
    }

    async fetchSectionData(config) {
        const params = new URLSearchParams();
        params.append('limit', (config.limit || SECTION_PLAYLIST_LIMIT).toString());
        const request = config.request || {};
        Object.entries(request).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value);
            }
        });

        const response = await fetch(`/api/playlists?${params.toString()}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to load playlists');
        }

        const data = await response.json();
        const playlists = data.playlists || [];
        console.log('[MusicPlayer] Loaded playlists', {
            section: config.id,
            title: config.title,
            request: Object.fromEntries(params.entries()),
            count: playlists.length
        });

        return {
            ...config,
            playlists
        };
    }

    renderSections() {
        const container = document.getElementById('playlist-sections');
        if (!container) return;

        container.innerHTML = '';

        this.sections.forEach(section => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'playlist-section';

            sectionEl.innerHTML = `
                <div class="playlist-section-header">
                    <div>
                        <h3>${section.title}</h3>
                        ${section.subtitle ? `<p class="playlist-section-subtitle">${section.subtitle}</p>` : ''}
                    </div>
                </div>
                <div class="playlist-carousel">
                    <button class="carousel-arrow left" aria-label="Scroll left"><span>◀</span></button>
                    <div class="playlists-track playlists-grid"></div>
                    <button class="carousel-arrow right" aria-label="Scroll right"><span>▶</span></button>
                </div>
            `;

            const grid = sectionEl.querySelector('.playlists-track');

            if (!section.playlists.length) {
                grid.innerHTML = `
                    <div class="section-empty-state">
                        No playlists available for this category yet.
                    </div>
                `;
            } else {
                section.playlists.forEach(playlist => {
                    const card = this.createPlaylistCard(playlist);
                    grid.appendChild(card);
                });
            }

            container.appendChild(sectionEl);
            this.setupCarousel(sectionEl);
        });
    }

    setupCarousel(sectionEl) {
        const track = sectionEl.querySelector('.playlists-track');
        if (!track) return;

        const leftBtn = sectionEl.querySelector('.carousel-arrow.left');
        const rightBtn = sectionEl.querySelector('.carousel-arrow.right');

        const scrollAmount = track.clientWidth * 0.7;

        const updateButtons = () => {
            const maxScroll = track.scrollWidth - track.clientWidth;
            if (leftBtn) {
                leftBtn.disabled = track.scrollLeft <= 0;
            }
            if (rightBtn) {
                rightBtn.disabled = track.scrollLeft >= maxScroll - 1;
            }
        };

        leftBtn?.addEventListener('click', () => {
            track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        rightBtn?.addEventListener('click', () => {
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        track.addEventListener('scroll', updateButtons, { passive: true });
        updateButtons();
    }

    renderEmptyState(message) {
        const container = document.getElementById('playlist-sections');
        if (!container) return;
        container.innerHTML = `
            <div class="section-empty-state">
                ${message}
            </div>
        `;
    }

    getFriendsFeedContainers() {
        const containers = [
            document.getElementById('friends-posts-feed'),
            document.getElementById('friends-posts-feed-panel'),
            document.getElementById('friends-posts-feed-inline')
        ];

        if (Array.isArray(window.musicareFriendsFeedContainers)) {
            window.musicareFriendsFeedContainers.forEach(container => {
                if (container && !containers.includes(container)) {
                    containers.push(container);
                }
            });
        }

        return containers.filter(Boolean);
    }

    renderFriendsPostsLoading() {
        this.getFriendsFeedContainers().forEach(container => {
            if (!container) return;
            container.innerHTML = `
                <div class="friends-posts-state loading">
                    <div class="friends-posts-spinner"></div>
                    <p>Loading posts from your friends...</p>
                </div>
            `;
        });
    }

    renderFriendsPostsEmpty(message = 'No posts from friends yet.') {
        this.getFriendsFeedContainers().forEach(container => {
            if (!container) return;
            container.innerHTML = `
                <div class="friends-posts-state empty">
                    <p>${message}</p>
                </div>
            `;
        });
    }

    renderFriendsPosts() {
        console.log('🔄 renderFriendsPosts called - this will re-render ALL posts');
        console.trace('Stack trace for renderFriendsPosts');

        const containers = this.getFriendsFeedContainers();
        if (!containers.length) return;

        const visiblePosts = this.friendPosts.filter(post => post && post.playlist).slice(0, 5);

        if (!visiblePosts.length) {
            this.renderFriendsPostsEmpty('No posts from friends yet. Encourage them to share a playlist!');
            return;
        }

        const createFeedContent = () => {
            const fragment = document.createDocumentFragment();
            visiblePosts.forEach(post => {
                const card = this.createFriendPostCard(post);
                if (card) {
                    fragment.appendChild(card);
                }
            });
            return fragment;
        };

        containers.forEach(container => {
            container.innerHTML = '';
            container.appendChild(createFeedContent());
        });
    }

    createFriendPostCard(post) {
        if (!post?.playlist) return null;

        const playlist = post.playlist;
        const isOwnPost = this.userContext?.id && post.author?.id && post.author.id === this.userContext.id;
        const authorName = isOwnPost
            ? 'You'
            : (post.author?.displayName || post.author?.username || 'Friend');
        const avatarSource = post.author?.displayName || post.author?.username || 'Friend';
        const initials = (avatarSource.match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase() || '♪';
        const timeAgo = this.formatRelativeTime(post.createdAt);
        const caption = (post.caption || '').trim();
        const isSaved = this.savedPlaylists.has(playlist.id);
        const moodLabel = formatMoodLabel(playlist.mood || 'wellness');
        const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
        const previewTracks = tracks.slice(0, 3);

        const card = document.createElement('div');
        card.className = 'friend-post-card';
        card.dataset.playlistId = playlist.id;

        const header = document.createElement('div');
        header.className = 'friend-post-header';

        const avatar = document.createElement('div');
        avatar.className = 'friend-post-avatar';
        avatar.textContent = initials;

        const authorBlock = document.createElement('div');
        authorBlock.className = 'friend-post-author-block';

        const nameEl = document.createElement('div');
        nameEl.className = 'friend-post-author';
        nameEl.textContent = authorName;

        const timeEl = document.createElement('div');
        timeEl.className = 'friend-post-time';
        timeEl.textContent = timeAgo;

        authorBlock.appendChild(nameEl);
        authorBlock.appendChild(timeEl);
        header.appendChild(avatar);
        header.appendChild(authorBlock);
        card.appendChild(header);

        if (caption) {
            const captionEl = document.createElement('p');
            captionEl.className = 'friend-post-caption';
            captionEl.textContent = caption;
            card.appendChild(captionEl);
        }

        const playlistCard = document.createElement('div');
        playlistCard.className = 'library-playlist-card friend-post-playlist-card';
        playlistCard.dataset.sharedPlaylistId = playlist.id;
        playlistCard.dataset.authorId = post.author?.id || '';

        const coverUrl = playlist.coverImage ? encodeURI(playlist.coverImage) : null;
        const coverStyle = coverUrl ? `style="background-image: url('${coverUrl}');"` : '';
        const trackCount = playlist.trackCount ?? playlist.tracks?.length ?? 0;

        playlistCard.innerHTML = `
            <div class="library-playlist-cover ${playlist.mood || 'default'}" ${coverStyle}></div>
            <div class="library-playlist-details">
                <div class="library-playlist-headline">
                    <div>
                        <h4>${playlist.title || 'Untitled Playlist'}</h4>
                        <p>${moodLabel} • ${trackCount} tracks</p>
                    </div>
                    <div class="library-playlist-actions">
                        <button class="library-play-btn friend-post-play-btn" data-action="play-shared-playlist" data-shared-playlist-id="${playlist.id}">
                            ▶ Play
                        </button>
                        <button class="friend-post-save-btn ${isSaved ? 'saved' : ''}" data-action="save-shared-playlist" data-shared-playlist-id="${playlist.id}">
                            ${isSaved ? 'Saved' : 'Save'}
                        </button>
                    </div>
                </div>
                <div class="library-playlist-preview">
                    ${previewTracks.length
                        ? previewTracks.map(track => {
                            const albumArtUrl = track.albumArt || 'https://via.placeholder.com/40x40/4a90e2/ffffff?text=♪';
                            const durationLabel = track.duration ? this.formatDuration(track.duration) : '';
                            const trackPosition = playlist.tracks?.findIndex(t => t.id === track.id) ?? -1;
                            return `
                                <div class="preview-track" data-action="play-shared-track" data-shared-playlist-id="${playlist.id}" data-track-index="${trackPosition}">
                                    <img class="preview-track-art" src="${albumArtUrl}" alt="${track.title || 'Unknown'}" />
                                    <div class="preview-track-text">
                                        <span class="preview-track-name">${track.title || 'Unknown'}</span>
                                        <span class="preview-track-artist">${track.artist || 'Unknown Artist'}</span>
                                    </div>
                                    <div class="preview-track-meta">
                                        ${durationLabel ? `<span class="preview-track-duration">${durationLabel}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')
                        : '<div class="preview-track muted">Track list unavailable</div>'}
                </div>
            </div>
        `;

        const playBtn = playlistCard.querySelector('[data-action="play-shared-playlist"]');
        const saveBtn = playlistCard.querySelector('[data-action="save-shared-playlist"]');

        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleSharedPlaylistPlay(playlist.id, 0);
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleSharedPlaylistSave(playlist.id);
            });
        }

        playlistCard.querySelectorAll('[data-action="play-shared-track"]').forEach(trackRow => {
            trackRow.addEventListener('click', (e) => {
                const target = e.target;
                if (target.closest('[data-action="save-shared-playlist"]')) return;
                const trackIndex = parseInt(trackRow.getAttribute('data-track-index'), 10);
                this.handleSharedPlaylistPlay(playlist.id, Number.isNaN(trackIndex) ? 0 : trackIndex);
            });
        });

        card.appendChild(playlistCard);

        // Add interaction section (likes and comments)
        const interactionSection = document.createElement('div');
        interactionSection.className = 'friend-post-interaction-section';

        const likeCount = post.likeCount || 0;
        const commentCount = post.commentCount || 0;
        const userLiked = this.hasUserLikedPost(post);

        interactionSection.innerHTML = `
            <div class="friend-post-actions">
                <button class="friend-post-like-btn ${userLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    <span class="like-icon">${userLiked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${likeCount}</span>
                </button>
                <button class="friend-post-comment-btn" data-post-id="${post.id}">
                    <span class="comment-icon">💬</span>
                    <span class="comment-count">${commentCount}</span>
                </button>
            </div>
            <div class="friend-post-comments-container" data-post-id="${post.id}" style="display: block;">
                <div class="friend-post-comments-list"></div>
                <div class="friend-post-comment-input-wrapper">
                    <input type="text" class="friend-post-comment-input" placeholder="Write a comment..." maxlength="500" />
                    <button class="friend-post-comment-submit">Post</button>
                </div>
            </div>
        `;

        const likeBtn = interactionSection.querySelector('.friend-post-like-btn');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePostLike(post);
        });

        const commentBtn = interactionSection.querySelector('.friend-post-comment-btn');
        commentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Comment button clicked for post:', post.id);
            this.toggleComments(post.id);
        });

        const commentInput = interactionSection.querySelector('.friend-post-comment-input');
        const commentSubmit = interactionSection.querySelector('.friend-post-comment-submit');

        commentSubmit.addEventListener('click', (e) => {
            e.stopPropagation();
            this.submitComment(post, commentInput);
        });

        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitComment(post, commentInput);
            }
        });

        card.appendChild(interactionSection);

        // Render existing comments directly on the elements we just created
        const commentsList = interactionSection.querySelector('.friend-post-comments-list');
        if (commentsList && post.comments && post.comments.length > 0) {
            this.renderCommentsToElement(post, commentsList);
        } else if (commentsList) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        }

        return card;
    }

    hasUserLikedPost(post) {
        if (!this.userContext?.id || !post?.likes) return false;
        return post.likes.some(like => like.user?.id === this.userContext.id || like.userId === this.userContext.id);
    }

    async togglePostLike(post) {
        if (!this.userContext?.id) {
            this.showError('Sign in to like posts.');
            return;
        }

        if (!post?.id) return;

        const userLiked = this.hasUserLikedPost(post);

        try {
            if (userLiked) {
                // Unlike the post
                const response = await fetch(`/api/likes?userId=${this.userContext.id}&postId=${post.id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Failed to unlike post');

                // Update local state
                post.likes = post.likes.filter(like =>
                    like.user?.id !== this.userContext.id && like.userId !== this.userContext.id
                );
                post.likeCount = post.likes.length;
            } else {
                // Like the post
                const response = await fetch('/api/likes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this.userContext.id,
                        postId: post.id
                    })
                });

                if (!response.ok) throw new Error('Failed to like post');

                // Update local state
                if (!post.likes) post.likes = [];
                post.likes.push({
                    userId: this.userContext.id,
                    user: {
                        id: this.userContext.id,
                        username: this.userContext.username,
                        displayName: this.userContext.displayName
                    }
                });
                post.likeCount = post.likes.length;
            }

            // Re-render the posts to update UI
            this.renderFriendsPosts();
        } catch (error) {
            console.error('Error toggling post like:', error);
            this.showError('Unable to update like. Please try again.');
        }
    }

    toggleComments(postId) {
        const container = document.querySelector(`.friend-post-comments-container[data-post-id="${postId}"]`);
        if (!container) {
            console.error('Comment container not found for post:', postId);
            return;
        }

        const isVisible = container.style.display === 'block';

        if (isVisible) {
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
        }

        console.log('Toggled comments for post:', postId, 'Now visible:', !isVisible, 'Container:', container);
    }

    renderComments(post) {
        if (!post?.id) return;

        // Find ALL containers with this post ID (there might be multiple across different feed containers)
        const containers = document.querySelectorAll(`.friend-post-comments-container[data-post-id="${post.id}"]`);
        if (!containers.length) {
            console.error('Could not find any comments containers for post:', post.id);
            return;
        }

        console.log('Rendering comments for post:', post.id, 'Found', containers.length, 'containers');

        // Update all containers
        containers.forEach(container => {
            const commentsList = container.querySelector('.friend-post-comments-list');
            if (!commentsList) {
                console.error('Could not find comments list in container for post:', post.id);
                return;
            }

            console.log('Rendering comments to container:', container);
            this.renderCommentsToElement(post, commentsList);
        });
    }

    renderCommentsToElement(post, commentsList) {
        if (!commentsList) return;

        commentsList.innerHTML = '';

        console.log('renderCommentsToElement - post.id:', post.id);
        console.log('renderCommentsToElement - post.comments:', post.comments);
        console.log('renderCommentsToElement - post.comments is array:', Array.isArray(post.comments));
        console.log('renderCommentsToElement - post.comments length:', post.comments?.length);

        // Check each element individually
        if (post.comments) {
            console.log('renderCommentsToElement - checking each element:');
            for (let i = 0; i < post.comments.length; i++) {
                console.log(`  [${i}]:`, post.comments[i]);
            }
        }

        // Filter out any undefined/null values
        const validComments = post.comments?.filter(c => c != null) || [];
        console.log('renderCommentsToElement - valid comments after filtering:', validComments.length);

        if (validComments.length === 0) {
            console.log('renderCommentsToElement - NO VALID COMMENTS, showing empty message');
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        console.log('renderCommentsToElement - RENDERING', validComments.length, 'comments');

        validComments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.className = 'friend-post-comment';
            commentEl.dataset.commentId = comment.id;

            const displayName = comment.user?.displayName || comment.user?.username || 'User';
            const timeAgo = this.getTimeAgo(new Date(comment.createdAt));
            const isOwnComment = this.userContext?.id === comment.userId;

            commentEl.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${displayName}</span>
                    <span class="comment-time">${timeAgo}</span>
                    ${isOwnComment ? `<button class="comment-delete-btn" data-comment-id="${comment.id}">×</button>` : ''}
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
            `;

            if (isOwnComment) {
                const deleteBtn = commentEl.querySelector('.comment-delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteComment(post, comment.id);
                });
            }

            commentsList.appendChild(commentEl);
        });
    }

    async submitComment(post, inputElement) {
        if (!this.userContext?.id) {
            this.showError('Sign in to comment on posts.');
            return;
        }

        const content = inputElement.value.trim();
        if (!content) return;

        if (content.length > 500) {
            this.showError('Comment must be 500 characters or less.');
            return;
        }

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userContext.id,
                    postId: post.id,
                    content
                })
            });

            if (!response.ok) throw new Error('Failed to post comment');

            const data = await response.json();
            console.log('Comment posted successfully:', data.comment);

            // Find the post in friendPosts array and update it
            const postInArray = this.friendPosts.find(p => p.id === post.id);
            const postToUpdate = postInArray || post;

            if (!postToUpdate.comments) postToUpdate.comments = [];
            postToUpdate.comments.push(data.comment);
            postToUpdate.commentCount = postToUpdate.comments.length;
            console.log('Updated post. Total comments:', postToUpdate.comments.length);

            // Clear input
            inputElement.value = '';

            // Ensure comments section is visible
            const container = document.querySelector(`.friend-post-comments-container[data-post-id="${postToUpdate.id}"]`);
            if (container) {
                container.style.display = 'block';
                container.style.visibility = 'visible';
                container.style.opacity = '1';
            }

            // Re-render comments and update count
            console.log('About to render comments...');
            this.renderComments(postToUpdate);
            this.updateCommentCount(postToUpdate.id, postToUpdate.commentCount);
            console.log('Finished rendering comments');
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showError('Unable to post comment. Please try again.');
        }
    }

    async deleteComment(post, commentId) {
        if (!this.userContext?.id) return;

        try {
            const response = await fetch(`/api/comments?commentId=${commentId}&userId=${this.userContext.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete comment');

            // Find the post in friendPosts array and update it
            const postInArray = this.friendPosts.find(p => p.id === post.id);
            const postToUpdate = postInArray || post;

            postToUpdate.comments = postToUpdate.comments.filter(c => c.id !== commentId);
            postToUpdate.commentCount = postToUpdate.comments.length;

            // Re-render comments and update count
            this.renderComments(postToUpdate);
            this.updateCommentCount(postToUpdate.id, postToUpdate.commentCount);
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showError('Unable to delete comment. Please try again.');
        }
    }

    updateCommentCount(postId, count) {
        const btn = document.querySelector(`.friend-post-comment-btn[data-post-id="${postId}"] .comment-count`);
        if (btn) {
            btn.textContent = count;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getSharedPlaylistById(playlistId) {
        if (!playlistId) return null;
        const post = this.friendPosts.find(entry => entry?.playlist?.id === playlistId);
        return post?.playlist || null;
    }

    handleSharedPlaylistPlay(playlistId, trackIndex = 0) {
        const playlist = this.getSharedPlaylistById(playlistId);
        if (!playlist) {
            this.showError('Playlist unavailable. Please refresh.');
            return;
        }
        this.playLibraryPlaylist(playlist, trackIndex);
    }

    handleSharedPlaylistSave(playlistId) {
        const playlist = this.getSharedPlaylistById(playlistId);
        if (!playlist) {
            this.showError('Playlist unavailable. Please refresh.');
            return;
        }
        this.togglePlaylistSave(playlist);
    }

    formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '';
        const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffSeconds < 60) return 'Just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    getTimeAgo(date) {
        // Alias for formatRelativeTime to support comments
        return this.formatRelativeTime(date);
    }

    async loadFriendsPosts(forceReload = false) {
        if (!this.userContext?.id) {
            this.friendPosts = [];
            this.friendPostsLoaded = false;
            this.renderFriendsPostsEmpty('Sign in to see what your friends are sharing.');
            return;
        }

        if (this.friendPostsLoading) {
            return;
        }

        if (forceReload) {
            this.friendPostsLoaded = false;
        }

        if (this.friendPostsLoaded && !forceReload) {
            this.renderFriendsPosts();
            return;
        }

        this.friendPostsLoading = true;
        this.renderFriendsPostsLoading();

        try {
            const response = await fetch(`/api/posts?userId=${this.userContext.id}`);
            if (!response.ok) {
                throw new Error('Failed to load friend posts');
            }
            const data = await response.json();
            this.friendPosts = Array.isArray(data.posts) ? data.posts : [];
            this.friendPostsLoaded = true;

            if (!this.friendPosts.length) {
                this.renderFriendsPostsEmpty('No posts from friends yet. Encourage them to share a playlist!');
            } else {
                this.renderFriendsPosts();
            }
        } catch (error) {
            console.error('Unable to load friends posts:', error);
            this.renderFriendsPostsEmpty('Unable to load friends posts. Please try again later.');
        } finally {
            this.friendPostsLoading = false;
        }
    }

    createPlaylistCard(playlist, isEmpty = false) {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.dataset.playlistId = playlist.id;

        const moodClass = playlist.mood || 'default';
        const trackCount = playlist.trackCount || playlist.tracks?.length || 0;
        const tracks = playlist.tracks || [];
        const isSaved = this.savedPlaylists.has(playlist.id);
        const coverUrl = playlist.coverImage ? encodeURI(playlist.coverImage) : null;
        const coverStyle = coverUrl ? `style="background-image: url('${coverUrl}');"` : '';

        card.innerHTML = `
            <div class="playlist-cover">
                <div class="cover-gradient ${moodClass}" ${coverStyle}></div>
        <div class="play-button ${isEmpty ? 'disabled' : ''}" style="${isEmpty ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
            <div class="playlist-info">
                <div class="playlist-info-header">
                    <h3>${playlist.title}</h3>
                    <span class="playlist-mood-pill">${formatMoodLabel(playlist.mood || 'wellness')}</span>
                </div>
                <p>${playlist.description || ''}</p>
                <div class="playlist-stats">${trackCount} songs${trackCount > 0 ? ` • ${this.formatTotalDuration(tracks)}` : ''}</div>
                ${!isEmpty ? `
                <button class="save-playlist-btn ${isSaved ? 'saved' : ''}" data-playlist-id="${playlist.id}">
                    ${isSaved ? '★ Saved' : '+ Save playlist'}
                </button>` : ''}
            </div>
            <div class="playlist-tracks">
                ${isEmpty || tracks.length === 0 ?
                `<div class="track empty-track">
                        <div class="track-info">
                            <div class="track-name">Personalized recommendations will appear here once your profile is ready.</div>
                        </div>
                    </div>` :
                tracks.slice(0, 4).map(track => {
                    const songSaved = this.savedSongs.has(track.id);
                    const inUserPlaylist = this.isSongInUserPlaylist(track.id);
                    return `
                        <div class="track" data-track-id="${track.id}">
                            <div class="track-info">
                                <div class="track-name">${track.title}</div>
                                <div class="track-artist">${track.artist}</div>
                            </div>
                            <div class="track-actions">
                                <div class="track-duration">${this.formatDuration(track.duration)}</div>
                                <button class="playlist-save-btn ${inUserPlaylist ? 'saved' : ''}" data-track-id="${track.id}" title="Save to playlist">
                                    ${inUserPlaylist ? '✓' : '+'}
                                </button>
                                <button class="save-track-btn ${songSaved ? 'saved' : ''}" data-track-id="${track.id}">
                                    ${songSaved ? '♥' : '♡'}
                                </button>
                            </div>
                        </div>`;
                }).join('') +
                (tracks.length > 4 ? `<div class="track more-tracks">
                        <div class="track-info">
                            <div class="track-name">...and ${tracks.length - 4} more wellness tracks</div>
                        </div>
                    </div>` : '')
            }
            </div>
        `;

        if (!isEmpty && tracks.length > 0) {
            const playButton = card.querySelector('.play-button');
            playButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectPlaylist(playlist);
                this.play();
            });

            const savePlaylistBtn = card.querySelector('.save-playlist-btn');
            if (savePlaylistBtn) {
                savePlaylistBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.togglePlaylistSave(playlist);
                });
            }

            const trackElements = card.querySelectorAll('.track');
            trackElements.forEach((trackEl, trackIndex) => {
                if (trackIndex < tracks.length) {
                    const saveBtn = trackEl.querySelector('.save-track-btn');
                    if (saveBtn) {
                        saveBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.toggleSongSave(tracks[trackIndex]);
                        });
                    }

                    trackEl.addEventListener('click', () => {
                        this.selectPlaylist(playlist);
                        this.playTrack(trackIndex);
                    });
                    trackEl.style.cursor = 'pointer';

                    const playlistSaveBtn = trackEl.querySelector('.playlist-save-btn');
                    if (playlistSaveBtn) {
                        playlistSaveBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.handleTrackPlaylistSave(tracks[trackIndex]);
                        });
                    }
                }
            });
        }

        return card;
    }

    selectPlaylist(playlist) {
        if (!playlist?.tracks?.length) return;
        this.currentPlaylist = playlist;
        this.currentTrackIndex = 0;
        this.currentTrack = playlist.tracks[0];
        this.updatePlayerUI();
    }

    playTrack(index) {
        if (!this.currentPlaylist || !this.currentPlaylist.tracks[index]) {
            console.error('Invalid track index:', index);
            return;
        }

        this.currentTrackIndex = index;
        this.currentTrack = this.currentPlaylist.tracks[index];

        this.audio.src = this.currentTrack.audioUrl;
        this.audio.load();
        this.play();

        this.updatePlayerUI();
    }

    play() {
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.updatePlayPauseButton();
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                this.showError('Failed to play audio. The audio file may be unavailable.');
            });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    playNext() {
        if (!this.currentPlaylist) return;

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.currentPlaylist.tracks.length;
        this.playTrack(this.currentTrackIndex);
    }

    playPrevious() {
        if (!this.currentPlaylist) return;

        this.currentTrackIndex = this.currentTrackIndex === 0
            ? this.currentPlaylist.tracks.length - 1
            : this.currentTrackIndex - 1;
        this.playTrack(this.currentTrackIndex);
    }

    updatePlayerUI() {
        if (!this.currentTrack) return;

        const trackName = document.querySelector('.current-track-name');
        const trackArtist = document.querySelector('.current-track-artist');

        if (trackName) trackName.textContent = this.currentTrack.title;
        if (trackArtist) trackArtist.textContent = this.currentTrack.artist;

        const miniCover = document.querySelector('.mini-cover');
        if (miniCover && this.currentPlaylist) {
            if (this.currentPlaylist.coverImage) {
                miniCover.style.backgroundImage = `url('${this.currentPlaylist.coverImage}')`;
                miniCover.className = 'mini-cover';
            } else {
                miniCover.style.backgroundImage = '';
                miniCover.className = `mini-cover ${this.currentPlaylist.mood}`;
            }
        }
    }

    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const progressTimes = document.querySelectorAll('.progress-time');

        if (progressFill && this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            progressFill.style.width = `${percent}%`;
        }

        if (progressTimes.length >= 2) {
            progressTimes[0].textContent = this.formatDuration(Math.floor(this.audio.currentTime));
            progressTimes[1].textContent = this.formatDuration(Math.floor(this.audio.duration));
        }
    }

    updatePlayPauseButton() {
        const playPauseBtn = document.querySelector('.play-pause');
        if (!playPauseBtn) return;

        if (this.isPlaying) {
            playPauseBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
            `;
        } else {
            playPauseBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
        }
    }

    onTrackLoaded() {
        this.updateProgress();
    }

    handleError(error) {
        console.error('Audio error:', error);
        this.showError('Error playing audio. Trying next track...');
        setTimeout(() => this.playNext(), 2000);
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatTotalDuration(tracks) {
        if (!tracks || tracks.length === 0) return '0 min';
        const totalSeconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
        const totalMinutes = Math.floor(totalSeconds / 60);
        return `${totalMinutes} min`;
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: #ef4444;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    /**
     * Update Playlist Save Buttons
     *
     * Updates the save button state for a specific playlist without re-rendering everything.
     *
     * @function updatePlaylistSaveButtons
     * @param {string} playlistId - ID of the playlist to update buttons for
     */
    updatePlaylistSaveButtons(playlistId) {
        const isSaved = this.savedPlaylists.has(playlistId);
        const buttons = document.querySelectorAll(`[data-playlist-id="${playlistId}"] .save-playlist-btn`);
        const standaloneButtons = document.querySelectorAll(`.save-playlist-btn[data-playlist-id="${playlistId}"]`);
        const friendButtons = document.querySelectorAll(`.friend-post-save-btn[data-shared-playlist-id="${playlistId}"]`);

        const combinedButtons = new Set([...buttons, ...standaloneButtons]);

        combinedButtons.forEach(button => {
            button.className = `save-playlist-btn ${isSaved ? 'saved' : ''}`;
            button.textContent = isSaved ? '★ Saved' : '+ Save playlist';
        });

        friendButtons.forEach(button => {
            button.classList.toggle('saved', isSaved);
            button.textContent = isSaved ? 'Saved' : 'Save';
        });
    }

    async togglePlaylistSave(playlist) {
        if (!this.userContext?.id) {
            this.showError('Sign in to save playlists to your library.');
            return;
        }

        const isSaved = this.savedPlaylists.has(playlist.id);
        const url = isSaved
            ? `/api/library?userId=${this.userContext.id}&itemId=${playlist.id}&itemType=playlist`
            : '/api/library';

        const options = isSaved
            ? { method: 'DELETE' }
            : {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userContext.id,
                    itemId: playlist.id,
                    itemType: 'playlist'
                })
            };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error('Failed to update playlist');
            }

            if (isSaved) {
                this.savedPlaylists.delete(playlist.id);
            } else {
                this.savedPlaylists.add(playlist.id);
            }

            // Update only the specific playlist buttons instead of re-rendering everything
            this.updatePlaylistSaveButtons(playlist.id);

            window.dispatchEvent(new CustomEvent('musicare:library-changed', {
                detail: { entityType: 'playlist', entityId: playlist.id, source: 'player' }
            }));
        } catch (error) {
            console.error('Unable to update playlist save state:', error);
            this.showError('Unable to update playlist. Please try again.');
        }
    }

    /**
     * Update Song Save Buttons
     *
     * Updates the save button state for a specific song without re-rendering everything.
     *
     * @function updateSongSaveButtons
     * @param {string} trackId - ID of the track to update buttons for
     */
    updateSongSaveButtons(trackId) {
        const isSaved = this.savedSongs.has(trackId);
        const buttons = document.querySelectorAll(`[data-track-id="${trackId}"] .save-track-btn`);

        buttons.forEach(button => {
            button.className = `save-track-btn ${isSaved ? 'saved' : ''}`;
            button.textContent = isSaved ? '♥' : '♡';
        });
    }

    async toggleSongSave(track) {
        if (!this.userContext?.id) {
            this.showError('Sign in to save songs to your library.');
            return;
        }

        const isSaved = this.savedSongs.has(track.id);
        const url = isSaved
            ? `/api/library?userId=${this.userContext.id}&itemId=${track.id}&itemType=song`
            : '/api/library';

        const options = isSaved
            ? { method: 'DELETE' }
            : {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userContext.id,
                    itemId: track.id,
                    itemType: 'song'
                })
            };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error('Failed to update song');
            }

            if (isSaved) {
                this.savedSongs.delete(track.id);
            } else {
                this.savedSongs.add(track.id);
            }

            // Update only the specific song buttons instead of re-rendering everything
            this.updateSongSaveButtons(track.id);

            window.dispatchEvent(new CustomEvent('musicare:library-changed', {
                detail: { entityType: 'song', entityId: track.id, source: 'player' }
            }));
        } catch (error) {
            console.error('Unable to update song save state:', error);
            this.showError('Unable to update song. Please try again.');
        }
    }

    async handleTrackPlaylistSave(track) {
        if (!track?.id) return;
        if (!this.userContext?.id) {
            this.showError('Sign in to organize songs into playlists.');
            return;
        }

        await this.loadLibraryState(true);

        this.openAddToPlaylistModal(track);
    }

    async ensureSongLiked(track) {
        if (!track?.id) return;
        if (this.savedSongs.has(track.id)) return;
        await this.toggleSongSave(track);
    }

    ensurePlaylistModalElements() {
        if (this.playlistModalOverlay && this.playlistModalContent) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'playlist-modal-overlay';
        overlay.innerHTML = '<div class="playlist-modal-window" role="dialog" aria-modal="true"></div>';
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.closePlaylistModal();
            }
        });

        document.body.appendChild(overlay);
        this.playlistModalOverlay = overlay;
        this.playlistModalContent = overlay.querySelector('.playlist-modal-window');
    }

    openAddToPlaylistModal(track) {
        this.ensurePlaylistModalElements();

        const hasPlaylists = Array.isArray(this.userPlaylists) && this.userPlaylists.length > 0;

        const initialSelection = hasPlaylists ? this.userPlaylists[0].id : null;

        this.playlistModalState = {
            track,
            selectedPlaylistId: initialSelection,
            lastSelectedPlaylistId: initialSelection,
            isCreatingPlaylist: !hasPlaylists,
            newPlaylistName: '',
            error: '',
            isSubmitting: false
        };

        if (!this.boundPlaylistModalKeydown) {
            this.boundPlaylistModalKeydown = (event) => {
                if (event.key === 'Escape') {
                    this.closePlaylistModal();
                }
            };
        }

        document.addEventListener('keydown', this.boundPlaylistModalKeydown);
        document.body.classList.add('modal-open');
        this.renderPlaylistModal();
        this.playlistModalOverlay?.classList.add('visible');
    }

    updatePlaylistModalState(patch = {}) {
        if (!this.playlistModalState) return;
        this.playlistModalState = {
            ...this.playlistModalState,
            ...patch
        };
        this.renderPlaylistModal();
    }

    renderPlaylistModal() {
        if (!this.playlistModalContent || !this.playlistModalState) return;

        const playlists = this.userPlaylists || [];
        const { track, selectedPlaylistId, isCreatingPlaylist, newPlaylistName, error, isSubmitting } = this.playlistModalState;

        const playlistOptions = playlists.length
            ? playlists.map(playlist => `
                <label class="playlist-option">
                    <input type="radio" name="playlist-choice" value="${playlist.id}" ${selectedPlaylistId === playlist.id ? 'checked' : ''} ${isSubmitting ? 'disabled' : ''}>
                    <div class="playlist-option-details">
                        <div class="playlist-option-title">${playlist.title}</div>
                        <div class="playlist-option-meta">${playlist.trackCount || 0} song${(playlist.trackCount || 0) === 1 ? '' : 's'}</div>
                    </div>
                </label>
            `).join('')
            : '<div class="playlist-empty-state">Create your first playlist to start saving songs.</div>';

        const createFormVisible = isCreatingPlaylist ? 'visible' : '';

        this.playlistModalContent.innerHTML = `
            <div class="playlist-modal-header">
                <div>
                    <p class="playlist-modal-subtitle">Add to playlist</p>
                    <h3>${track?.title || 'Selected song'}</h3>
                    ${track?.artist ? `<p class="playlist-modal-artist">${track.artist}</p>` : ''}
                </div>
                <button class="modal-close-btn" aria-label="Close add to playlist dialog">&times;</button>
            </div>
            <div class="playlist-modal-body">
                <div class="playlist-options">
                    ${playlistOptions}
                </div>
                <div class="playlist-create-section">
                    <button type="button" class="playlist-create-toggle" ${isSubmitting ? 'disabled' : ''}>
                        ${isCreatingPlaylist ? 'Cancel new playlist' : '+ Create new playlist'}
                    </button>
                    <div class="playlist-create-form ${createFormVisible}">
                        <label for="playlist-name-input">Playlist name</label>
                        <input id="playlist-name-input" type="text" value="${newPlaylistName || ''}" placeholder="Wellness Mix" ${isSubmitting ? 'disabled' : ''}>
                        <button type="button" class="playlist-create-submit" ${isSubmitting || !newPlaylistName?.trim() ? 'disabled' : ''}>
                            Create playlist
                        </button>
                    </div>
                </div>
                ${error ? `<div class="playlist-modal-error">${error}</div>` : ''}
            </div>
            <div class="playlist-modal-footer">
                <button type="button" class="modal-cancel-btn" ${isSubmitting ? 'disabled' : ''}>Cancel</button>
                <button type="button" class="modal-confirm-btn" ${!selectedPlaylistId || isSubmitting || isCreatingPlaylist ? 'disabled' : ''}>
                    ${isSubmitting ? 'Saving...' : 'Add'}
                </button>
            </div>
        `;

        const closeBtn = this.playlistModalContent.querySelector('.modal-close-btn');
        closeBtn?.addEventListener('click', () => this.closePlaylistModal());

        const cancelBtn = this.playlistModalContent.querySelector('.modal-cancel-btn');
        cancelBtn?.addEventListener('click', () => this.closePlaylistModal());

        const confirmBtn = this.playlistModalContent.querySelector('.modal-confirm-btn');
        confirmBtn?.addEventListener('click', () => this.handleAddTrackToPlaylist());

        this.playlistModalContent.querySelectorAll('input[name="playlist-choice"]').forEach(input => {
            input.addEventListener('change', (event) => {
                const value = event.target.value;
                this.updatePlaylistModalState({
                    selectedPlaylistId: value,
                    lastSelectedPlaylistId: value,
                    isCreatingPlaylist: false,
                    newPlaylistName: '',
                    error: ''
                });
            });
        });

        const createToggle = this.playlistModalContent.querySelector('.playlist-create-toggle');
        createToggle?.addEventListener('click', () => {
            if (!this.playlistModalState) return;
            const enableCreation = !this.playlistModalState.isCreatingPlaylist;
            const fallbackSelection = this.playlistModalState.lastSelectedPlaylistId || this.playlistModalState.selectedPlaylistId || this.userPlaylists[0]?.id || null;
            this.updatePlaylistModalState({
                isCreatingPlaylist: enableCreation,
                selectedPlaylistId: enableCreation ? null : fallbackSelection,
                lastSelectedPlaylistId: enableCreation
                    ? this.playlistModalState.selectedPlaylistId || this.playlistModalState.lastSelectedPlaylistId || null
                    : fallbackSelection,
                newPlaylistName: enableCreation ? this.playlistModalState.newPlaylistName : '',
                error: ''
            });
        });

        const nameInput = this.playlistModalContent.querySelector('#playlist-name-input');
        nameInput?.addEventListener('input', (event) => {
            if (!this.playlistModalState) return;
            this.playlistModalState.newPlaylistName = event.target.value;
            const submitBtn = this.playlistModalContent.querySelector('.playlist-create-submit');
            if (submitBtn) {
                submitBtn.disabled = !event.target.value.trim() || this.playlistModalState.isSubmitting;
            }
        });

        const createSubmit = this.playlistModalContent.querySelector('.playlist-create-submit');
        createSubmit?.addEventListener('click', () => this.handleCreatePlaylistSubmit());
    }

    closePlaylistModal() {
        this.playlistModalOverlay?.classList.remove('visible');
        document.body.classList.remove('modal-open');
        if (this.boundPlaylistModalKeydown) {
            document.removeEventListener('keydown', this.boundPlaylistModalKeydown);
        }
        this.playlistModalState = null;
    }

    async handleCreatePlaylistSubmit() {
        const state = this.playlistModalState;
        if (!state) return;

        const name = state.newPlaylistName?.trim();
        if (!name) {
            this.updatePlaylistModalState({ error: 'Please enter a playlist name.' });
            return;
        }

        this.updatePlaylistModalState({ isSubmitting: true, error: '' });

        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: name,
                    description: '',
                    mood: 'user_created',
                    createdBy: this.userContext.id,
                    tracks: []
                })
            });

            if (!response.ok) {
                throw new Error(await this.extractErrorMessage(response));
            }

            const payload = await response.json();
            const playlist = this.normalizeUserPlaylist(payload.playlist);
            if (playlist) {
                this.userPlaylists = [playlist, ...this.userPlaylists];
                this.rebuildUserPlaylistSongIndex();
                this.refreshPlaylistSaveIndicators();
                this.updatePlaylistModalState({
                    isSubmitting: false,
                    isCreatingPlaylist: false,
                    selectedPlaylistId: playlist.id,
                    lastSelectedPlaylistId: playlist.id,
                    newPlaylistName: '',
                    error: ''
                });

                window.dispatchEvent(new CustomEvent('musicare:library-changed', {
                    detail: {
                        entityType: 'playlist',
                        entityId: playlist.id,
                        source: 'player',
                        reason: 'user-playlist-created'
                    }
                }));
            } else {
                throw new Error('Playlist could not be created');
            }
        } catch (error) {
            console.error('Unable to create playlist:', error);
            this.updatePlaylistModalState({
                isSubmitting: false,
                error: error.message || 'Unable to create playlist.'
            });
        }
    }

    async handleAddTrackToPlaylist() {
        const state = this.playlistModalState;
        if (!state?.selectedPlaylistId || !state.track?.id) return;

        this.updatePlaylistModalState({ isSubmitting: true, error: '' });

        try {
            const trackPayload = state.track ? {
                id: state.track.id,
                title: state.track.title,
                artist: state.track.artist,
                duration: state.track.duration,
                audioUrl: state.track.audioUrl,
                albumArt: state.track.albumArt,
                jamendoId: state.track.jamendoId
            } : null;

            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addSong',
                    playlistId: state.selectedPlaylistId,
                    songId: state.track.id,
                    userId: this.userContext.id,
                    track: trackPayload
                })
            });

            if (!response.ok) {
                throw new Error(await this.extractErrorMessage(response));
            }

            const payload = await response.json();
            const updatedPlaylist = this.normalizeUserPlaylist(payload.playlist);

            if (updatedPlaylist) {
                let found = false;
                this.userPlaylists = this.userPlaylists.map(playlist => {
                    if (playlist.id === updatedPlaylist.id) {
                        found = true;
                        return updatedPlaylist;
                    }
                    return playlist;
                });
                if (!found) {
                    this.userPlaylists = [updatedPlaylist, ...this.userPlaylists];
                }

                this.rebuildUserPlaylistSongIndex();
                this.refreshPlaylistSaveIndicators();
                this.updatePlaylistSaveButtons(state.track.id);

                await this.ensureSongLiked(state.track);

                window.dispatchEvent(new CustomEvent('musicare:library-changed', {
                    detail: {
                        entityType: 'playlist',
                        entityId: updatedPlaylist.id,
                        source: 'player',
                        reason: 'user-playlist-updated'
                    }
                }));
            }

            this.closePlaylistModal();
        } catch (error) {
            console.error('Unable to add track to playlist:', error);
            this.updatePlaylistModalState({
                isSubmitting: false,
                error: error.message || 'Unable to add song to playlist.'
            });
        }
    }

    async extractErrorMessage(response) {
        try {
            const data = await response.json();
            return data?.error || data?.details || response.statusText || 'Request failed.';
        } catch {
            return response.statusText || 'Request failed.';
        }
    }

    playLibraryPlaylist(playlist, startIndex = 0) {
        if (!playlist?.tracks?.length) {
            this.showError('This playlist has no playable tracks yet.');
            return;
        }

        const normalized = {
            ...playlist,
            tracks: playlist.tracks.map((track, index) => ({
                ...track,
                position: track.position ?? index
            })),
            trackCount: playlist.tracks.length
        };

        this.selectPlaylist(normalized);
        const safeIndex = Math.min(Math.max(0, startIndex || 0), normalized.tracks.length - 1);
        this.playTrack(safeIndex);
    }

    playLibrarySong(song) {
        if (!song?.audioUrl) {
            this.showError('This song is missing audio data.');
            return;
        }

        const singlePlaylist = {
            id: `library-song-${song.id}`,
            title: song.title || 'Liked Song',
            description: song.artist || '',
            mood: 'wellness',
            coverImage: song.albumArt,
            tracks: [{
                ...song,
                position: 0
            }],
            trackCount: 1
        };

        this.selectPlaylist(singlePlaylist);
        this.playTrack(0);
    }

    async populatePlaylists() {
        if (!this.userContext) {
            this.showError('Sign in to refresh recommendations.');
            return;
        }

        const refreshBtn = document.getElementById('populate-playlists-btn');
        const originalLabel = refreshBtn?.textContent?.trim() || '🔁 Refresh Recommendations';

        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Refreshing...';
        }

        this.updateStatus('Refreshing recommendations...');

        try {
            await this.loadPlaylistSections();
        } catch (error) {
            console.error('🎵 Music Player: Refresh recommendations failed', error);
            this.showError('Unable to refresh recommendations. Please try again.');
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = originalLabel;
            }
        }
    }

    /**
     * Handle Chatbot Playlist Recommendation
     *
     * Triggered when chatbot detects user mood/need and recommends specific playlists.
     * Loads playlists for the recommended category and displays them on the home page.
     *
     * @async
     * @function handleChatbotRecommendation
     * @param {Object} recommendation - Recommendation metadata from chatbot
     * @param {string} recommendation.type - Category type ('goal' or 'genre')
     * @param {string} recommendation.key - Category key (e.g., 'anxiety_relief', 'focus')
     * @param {string} recommendation.mood - Detected mood/need
     */
    async handleChatbotRecommendation(recommendation) {
        if (!this.userContext) {
            console.warn('🎵 Music Player: Cannot load chatbot recommendations - user not signed in');
            this.showError('Sign in to receive personalized playlist recommendations.');
            return;
        }

        console.log(`🎵 Music Player: Loading playlists for chatbot recommendation - ${recommendation.type}:${recommendation.key}`);

        const refreshBtn = document.getElementById('populate-playlists-btn');
        const originalLabel = refreshBtn?.textContent?.trim() || '🔁 Refresh Recommendations';

        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = '🤖 Loading...';
        }

        this.updateStatus(`Curating playlists for ${recommendation.mood}...`);
        this.renderEmptyState(`Loading ${recommendation.mood} playlists...`);

        try {
            // Build section config for the recommended category
            const sectionConfig = {
                id: `chatbot-${recommendation.type}-${recommendation.key}`,
                title: `Recommended for You`,
                subtitle: `Playlists curated for ${recommendation.mood}`,
                request: {
                    [recommendation.type]: recommendation.key
                },
                limit: 6
            };

            // Fetch playlists for the recommended category
            const sectionData = await this.fetchSectionData(sectionConfig);

            if (!sectionData || !sectionData.playlists || sectionData.playlists.length === 0) {
                console.warn('🎵 Music Player: No playlists found for chatbot recommendation');
                this.updateStatus('No playlists found. Try refreshing.');
                this.showError('No playlists found for this recommendation. Try again later.');
                return;
            }

            // Replace current sections with chatbot recommendation
            this.sections = [sectionData];
            this.renderSections();

            // Auto-select first playlist
            const firstPlaylist = sectionData.playlists[0];
            if (firstPlaylist) {
                this.selectPlaylist(firstPlaylist);
                this.updateStatus(`Curated ${sectionData.playlists.length} playlists for ${recommendation.mood}.`);
                console.log(`✅ Music Player: Loaded ${sectionData.playlists.length} playlists for chatbot recommendation`);
            }

        } catch (error) {
            console.error('🎵 Music Player: Failed to load chatbot recommendation playlists:', error);
            this.showError('Unable to load recommended playlists. Please try again.');
            this.updateStatus('Failed to load recommendations.');
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = originalLabel;
            }
        }
    }

    setupPlayerControls() {
        const refreshBtn = document.getElementById('populate-playlists-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.populatePlaylists());
        }

        const playPauseBtn = document.querySelector('.play-pause');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        const controlBtns = document.querySelectorAll('.player-controls .control-btn');
        if (controlBtns.length >= 3) {
            controlBtns[0].addEventListener('click', () => this.playPrevious());
            controlBtns[2].addEventListener('click', () => this.playNext());
        }

        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            });
            progressBar.style.cursor = 'pointer';
        }

        const volumeBar = document.querySelector('.volume-bar');
        if (volumeBar) {
            volumeBar.addEventListener('click', (e) => {
                const rect = volumeBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.volume = percent;

                const volumeFill = document.querySelector('.volume-fill');
                if (volumeFill) {
                    volumeFill.style.width = `${percent * 100}%`;
                }
            });
            volumeBar.style.cursor = 'pointer';
        }
    }
}

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

function slugify(value) {
    return (value || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
}

function normalizeTag(value) {
    return (value || '')
        .toString()
        .trim()
        .toLowerCase();
}

function getRandomSubset(items = [], maxItems = SECTION_PLAYLIST_LIMIT) {
    if (!Array.isArray(items) || items.length <= maxItems) {
        return items || [];
    }

    const pool = [...items];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, maxItems);
}

// Initialize music player when DOM is ready
let musicPlayer;

function initializeMusicPlayer() {
    try {
        musicPlayer = new MusicPlayer();
        window.musicPlayer = musicPlayer;
        console.log('🎵 Music Player: Successfully initialized');
    } catch (error) {
        console.error('🎵 Music Player: Initialization failed:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMusicPlayer);
} else {
    initializeMusicPlayer();
}

export default MusicPlayer;

