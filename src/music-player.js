// Music Player Module - Handles audio playback and playlist management

class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentPlaylist = null;
        this.currentTrack = null;
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.playlists = [];

        this.init();
    }

    init() {
        console.log('🎵 Music Player: Initializing...');

        // Set up audio element event listeners
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.onTrackLoaded());
        this.audio.addEventListener('error', (e) => this.handleError(e));

        // Load playlists from API
        this.loadPlaylists();
    }

    async loadPlaylists() {
        try {
            console.log('🎵 Loading playlists from API...');
            const response = await fetch('/api/playlists');

            if (!response.ok) {
                throw new Error('Failed to load playlists');
            }

            const data = await response.json();
            this.playlists = data.playlists || [];

            console.log(`🎵 Loaded ${this.playlists.length} playlists`);

            // If no playlists in database, show empty placeholders
            if (this.playlists.length === 0) {
                this.displayEmptyPlaylists();
            } else {
                // Display playlists with real data
                this.displayPlaylists();

                // Auto-select first playlist
                this.selectPlaylist(this.playlists[0]);
            }
        } catch (error) {
            console.error('Error loading playlists:', error);
            this.showError('Failed to load playlists. Try populating the database first.');
        }
    }

    displayEmptyPlaylists() {
        const container = document.querySelector('.playlists-grid');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Show empty placeholder cards
        const emptyPlaylists = [
            {
                id: 'empty-1',
                title: 'Anxiety Relief',
                description: 'Calming melodies to ease tension and reduce anxiety',
                mood: 'anxiety',
                tracks: [],
                trackCount: 0
            },
            {
                id: 'empty-2',
                title: 'Focus & Concentration',
                description: 'Enhance productivity and mental clarity with ambient sounds',
                mood: 'focus',
                tracks: [],
                trackCount: 0
            },
            {
                id: 'empty-3',
                title: 'Sleep & Relaxation',
                description: 'Gentle sounds for peaceful rest and deep relaxation',
                mood: 'sleep',
                tracks: [],
                trackCount: 0
            }
        ];

        emptyPlaylists.forEach((playlist, index) => {
            const playlistCard = this.createPlaylistCard(playlist, index, true);
            container.appendChild(playlistCard);
        });
    }

    displayPlaylists() {
        const container = document.querySelector('.playlists-grid');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        this.playlists.forEach((playlist, index) => {
            const playlistCard = this.createPlaylistCard(playlist, index);
            container.appendChild(playlistCard);
        });
    }

    createPlaylistCard(playlist, index, isEmpty = false) {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.dataset.playlistId = playlist.id;

        const moodClass = playlist.mood || 'default';
        const trackCount = playlist.trackCount || playlist.tracks?.length || 0;
        const tracks = playlist.tracks || [];

        card.innerHTML = `
      <div class="playlist-cover">
        <div class="cover-gradient ${moodClass}"></div>
        <div class="play-button ${isEmpty ? 'disabled' : ''}" data-playlist-index="${index}" style="${isEmpty ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      <div class="playlist-info">
        <h3>${playlist.title}</h3>
        <p>${playlist.description || ''}</p>
        <div class="playlist-stats">${trackCount} songs${trackCount > 0 ? ` • ${this.formatTotalDuration(tracks)}` : ''}</div>
      </div>
      <div class="playlist-tracks">
        ${isEmpty || tracks.length === 0 ?
                `<div class="track" style="opacity: 0.5; font-style: italic; text-align: center; padding: 2rem;">
            <div class="track-info">
              <div class="track-name">No songs yet. Click "Load Playlists" to fetch music.</div>
            </div>
          </div>`
                :
                tracks.slice(0, 4).map(track => `
            <div class="track">
              <div class="track-info">
                <div class="track-name">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
              </div>
              <div class="track-duration">${this.formatDuration(track.duration)}</div>
            </div>
          `).join('') +
                (tracks.length > 4 ? `<div class="track"><div class="track-info"><div class="track-name">...and ${tracks.length - 4} more</div></div></div>` : '')
            }
      </div>
    `;

        // Add click handler to play button (only if not empty)
        if (!isEmpty && tracks.length > 0) {
            const playButton = card.querySelector('.play-button');
            playButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectPlaylist(playlist);
                this.play();
            });

            // Add click handler to track items
            const trackElements = card.querySelectorAll('.track');
            trackElements.forEach((trackEl, trackIndex) => {
                if (trackIndex < tracks.length) { // Only clickable tracks, not the "...and X more"
                    trackEl.addEventListener('click', () => {
                        this.selectPlaylist(playlist);
                        this.playTrack(trackIndex);
                    });
                    trackEl.style.cursor = 'pointer';
                }
            });
        }

        return card;
    }

    selectPlaylist(playlist) {
        console.log('🎵 Selected playlist:', playlist.title);
        this.currentPlaylist = playlist;
        this.currentTrackIndex = 0;
        this.currentTrack = playlist.tracks[0];

        // Update UI
        this.updatePlayerUI();
    }

    playTrack(index) {
        if (!this.currentPlaylist || !this.currentPlaylist.tracks[index]) {
            console.error('Invalid track index:', index);
            return;
        }

        this.currentTrackIndex = index;
        this.currentTrack = this.currentPlaylist.tracks[index];

        console.log('🎵 Playing track:', this.currentTrack.title);

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

        // Update track info
        const trackName = document.querySelector('.current-track-name');
        const trackArtist = document.querySelector('.current-track-artist');

        if (trackName) trackName.textContent = this.currentTrack.title;
        if (trackArtist) trackArtist.textContent = this.currentTrack.artist;

        // Update cover art
        const miniCover = document.querySelector('.mini-cover');
        if (miniCover && this.currentPlaylist) {
            miniCover.className = `mini-cover ${this.currentPlaylist.mood}`;
        }
    }

    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const currentTimeEl = document.querySelector('.progress-time:first-child');
        const totalTimeEl = document.querySelector('.progress-time:last-child');

        if (progressFill && this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            progressFill.style.width = `${percent}%`;
        }

        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatDuration(Math.floor(this.audio.currentTime));
        }

        if (totalTimeEl && this.audio.duration) {
            totalTimeEl.textContent = this.formatDuration(Math.floor(this.audio.duration));
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
        console.log('🎵 Track loaded:', this.currentTrack?.title);
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
        }, 5000);
    }

    async populatePlaylists() {
        const statusEl = document.getElementById('playlist-status');
        const btn = document.getElementById('populate-playlists-btn');

        if (statusEl) statusEl.textContent = 'Loading playlists from Jamendo API...';
        if (btn) btn.disabled = true;

        try {
            console.log('🎵 Populating database with playlists...');
            const response = await fetch('/api/playlists?populate=true');

            if (!response.ok) {
                throw new Error('Failed to populate playlists');
            }

            const data = await response.json();
            console.log('✅ Playlists populated:', data);

            if (statusEl) statusEl.textContent = `✅ Loaded ${data.count} playlists with real music!`;

            // Reload playlists
            await this.loadPlaylists();

        } catch (error) {
            console.error('Error populating playlists:', error);
            if (statusEl) statusEl.textContent = '❌ Failed to load playlists. Check console for details.';
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    setupPlayerControls() {
        // Populate playlists button
        const populateBtn = document.getElementById('populate-playlists-btn');
        if (populateBtn) {
            populateBtn.addEventListener('click', () => this.populatePlaylists());
        }

        // Play/Pause button
        const playPauseBtn = document.querySelector('.play-pause');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        // Previous button
        const prevBtn = document.querySelector('.control-btn:first-child');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.playPrevious());
        }

        // Next button
        const nextBtn = document.querySelector('.control-btn:last-child');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.playNext());
        }

        // Progress bar click
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            });
            progressBar.style.cursor = 'pointer';
        }

        // Volume control
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

// Initialize music player when DOM is ready
let musicPlayer;

document.addEventListener('DOMContentLoaded', () => {
    musicPlayer = new MusicPlayer();
    musicPlayer.setupPlayerControls();

    // Make it globally available
    window.musicPlayer = musicPlayer;

    console.log('🎵 Music Player initialized');
});

export default MusicPlayer;

