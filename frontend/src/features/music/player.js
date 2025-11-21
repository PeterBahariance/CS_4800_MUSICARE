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
    }
};

/**
 * Section Playlist Limit
 *
 * Maximum number of playlists to display per section (health goal or genre).
 *
 * @constant {number} SECTION_PLAYLIST_LIMIT
 */
const SECTION_PLAYLIST_LIMIT = 3;

/**
 * Health Goal Aliases
 *
 * Maps common typos or variations to canonical health goal names.
 *
 * @constant {Object} HEALTH_GOAL_ALIASES
 */
const HEALTH_GOAL_ALIASES = {
    mental_wellnes: 'mental_wellness'
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
    }

    bootstrap() {
        if (this.userContext) {
            this.initializeForUser();
        } else {
            this.renderEmptyState('Sign in to unlock personalized playlists tailored for you.');
            this.updateStatus('Sign in to unlock personalized playlists.');
            this.updateHomeSummary();
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

        await this.loadLibraryState();
        await this.loadPlaylistSections();
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
            this.savedPlaylists = new Set(
                (data.savedPlaylists || []).map(entry => entry.playlist.id)
            );
            this.savedSongs = new Set(
                (data.savedSongs || []).map(entry => entry.song.id)
            );
            this.userPlaylists = (data.userPlaylists || [])
                .map(entry => this.normalizeUserPlaylist(entry))
                .filter(Boolean);
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

        this.updateStatus('Personalizing music for you...');
        this.renderEmptyState('Building mixes tailored to your wellness goals...');

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

            this.sections = sectionResults.filter(Boolean);
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

        buttons.forEach(button => {
            button.className = `save-playlist-btn ${isSaved ? 'saved' : ''}`;
            button.textContent = isSaved ? '★ Saved' : '+ Save playlist';
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

    playLibraryPlaylist(playlist) {
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
        this.playTrack(0);
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
        return this.loadPlaylistSections();
    }

    setupPlayerControls() {
        const refreshBtn = document.getElementById('populate-playlists-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPlaylistSections());
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

