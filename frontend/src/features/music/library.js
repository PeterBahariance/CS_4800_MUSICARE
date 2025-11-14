class LibraryView {
    constructor() {
        this.user = null;
        this.root = null;
        this.state = {
            playlists: [],
            songs: [],
            initialized: false
        };
        this.isLoading = false;
        this.expandedPlaylists = new Set();

        window.addEventListener('musicare:library-changed', (event) => {
            if (event?.detail?.source === 'library') return;
            if (this.user?.id && this.root) {
                this.loadLibrary();
            }
        });
    }

    setUserContext(user) {
        this.user = user;
        if (this.isActive()) {
            // Mount will handle loading if needed
            this.mount();
        }
    }

    isActive() {
        return document.querySelector('.nav-item[data-tab="library"]')?.classList.contains('active');
    }

    mount() {
        // Find the library-content in .main-content (the active one), not in .content-templates
        const mainContent = document.querySelector('.main-content');
        this.root = mainContent?.querySelector('#library-content');
        
        if (!this.root) {
            // Try multiple times with increasing delays
            let attempts = 0;
            const maxAttempts = 5;
            const tryMount = () => {
                attempts++;
                const mainContent = document.querySelector('.main-content');
                this.root = mainContent?.querySelector('#library-content');
                
                if (this.root) {
                    console.log(`[LibraryView] Found library-content element in main-content after ${attempts} attempt(s)`);
                    this.doMount();
                } else if (attempts < maxAttempts) {
                    setTimeout(tryMount, 100 * attempts);
                } else {
                    console.error('[LibraryView] library-content element not found after all attempts');
                    // Try to find it in the template and clone it
                    const template = document.querySelector('.content-templates #library-content');
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
            };
            setTimeout(tryMount, 50);
            return;
        }

        console.log('[LibraryView] Found library-content in main-content');
        this.doMount();
    }

    doMount() {
        if (!this.root) return;

        if (!this.user) {
            this.root.innerHTML = `
                <div class="library-empty-state">
                    <h3>Sign in to view your library</h3>
                    <p>Your saved playlists and songs will appear here once you're logged in.</p>
                </div>
            `;
            return;
        }

        console.log('[LibraryView] Mounting library view for user:', this.user.id);
        if (!this.state.initialized) {
            this.loadLibrary();
        } else {
            this.render();
        }
    }

    async loadLibrary() {
        if (!this.user?.id) return;
        if (!this.root) {
            console.warn('[LibraryView] loadLibrary() called but root is null, waiting for mount...');
            return;
        }
        this.isLoading = true;
        this.render();

        try {
            const response = await fetch(`/api/library?userId=${this.user.id}`);
            if (!response.ok) {
                throw new Error('Failed to load library');
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
        } catch (error) {
            console.error('LibraryView: unable to load library', error);
            this.renderError(error);
            return;
        } finally {
            this.isLoading = false;
        }

        this.render();
    }

    render() {
        if (!this.root) {
            console.warn('[LibraryView] render() called but root is null');
            return;
        }

        console.log('[LibraryView] render() called, isLoading:', this.isLoading, 'playlists:', this.state.playlists?.length || 0);

        if (this.isLoading) {
            this.root.innerHTML = `
                <div class="library-loading">
                    <div class="spinner"></div>
                    <p>Loading your saved music...</p>
                </div>
            `;
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
        
        console.log('[LibraryView] Setting innerHTML, length:', fullHTML.length);
        console.log('[LibraryView] root element:', this.root, 'parent:', this.root?.parentElement, 'display:', window.getComputedStyle(this.root)?.display);
        this.root.innerHTML = fullHTML;
        
        // Verify the element was added
        const grid = this.root.querySelector('.library-playlists-grid');
        const cards = this.root.querySelectorAll('.library-playlist-card');
        console.log('[LibraryView] After render - grid found:', !!grid, 'cards found:', cards.length);
        if (grid) {
            console.log('[LibraryView] Grid display:', window.getComputedStyle(grid)?.display, 'visibility:', window.getComputedStyle(grid)?.visibility);
        }
        if (cards.length > 0) {
            const firstCard = cards[0];
            console.log('[LibraryView] First card display:', window.getComputedStyle(firstCard)?.display, 'visibility:', window.getComputedStyle(firstCard)?.visibility, 'opacity:', window.getComputedStyle(firstCard)?.opacity);
        }
        
        // Ensure the root is visible and properly positioned
        if (this.root.parentElement) {
            this.root.parentElement.style.display = 'block';
        }
        this.root.style.display = 'block';
        this.root.style.visibility = 'visible';
        this.root.style.opacity = '1';
        
        // Ensure we're in the right container (not mixed with other content)
        if (!this.root.classList.contains('content-section')) {
            this.root.classList.add('content-section');
        }

        this.attachEventHandlers();
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
            
            const html = `
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
            console.log(`[LibraryView] Generated HTML for playlist ${index} (length: ${html.length}):`, html.substring(0, 200) + '...');
            return html;
        }).filter(Boolean).join('');
        
        console.log('[LibraryView] Total playlist HTML length:', playlistHTML.length);
        console.log('[LibraryView] Final HTML:', playlistHTML.substring(0, 500) + '...');
        
        return `
            <div class="library-playlists-grid">
                ${playlistHTML}
            </div>
        `;
    }

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

    attachEventHandlers() {
        if (!this.root) return;

        const refreshBtn = this.root.querySelector('#refresh-library-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadLibrary());
        }

        this.root.querySelectorAll('[data-action="remove-playlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                this.removeItem('playlist', playlistId);
            });
        });

        this.root.querySelectorAll('[data-action="remove-song"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.getAttribute('data-song-id');
                this.removeItem('song', songId);
            });
        });

        this.root.querySelectorAll('[data-action="play-playlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                this.playPlaylist(playlistId);
            });
        });

        this.root.querySelectorAll('[data-action="play-song"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.getAttribute('data-song-id');
                this.playSong(songId);
            });
        });

        this.root.querySelectorAll('[data-action="toggle-playlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.getAttribute('data-playlist-id');
                this.togglePlaylistExpansion(playlistId);
            });
        });
    }

    togglePlaylistExpansion(playlistId) {
        if (!playlistId) return;
        if (this.expandedPlaylists.has(playlistId)) {
            this.expandedPlaylists.delete(playlistId);
        } else {
            this.expandedPlaylists.add(playlistId);
        }
        this.render();
    }

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

    async removeItem(itemType, itemId) {
        if (!this.user?.id || !itemId) return;

        try {
            const response = await fetch(`/api/library?userId=${this.user.id}&itemId=${itemId}&itemType=${itemType}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to update library');
            }

            if (itemType === 'playlist') {
                this.state.playlists = this.state.playlists.filter(entry => entry.playlist.id !== itemId);
            } else {
                this.state.songs = this.state.songs.filter(entry => entry.song.id !== itemId);
            }

            window.dispatchEvent(new CustomEvent('musicare:library-changed', {
                detail: { entityType: itemType, entityId: itemId, source: 'library' }
            }));

            this.render();
        } catch (error) {
            console.error('LibraryView: unable to remove item', error);
            this.showToast('Unable to update library. Please try again.');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-info';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
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

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default LibraryView;

