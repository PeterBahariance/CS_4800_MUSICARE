import React from 'react'
import '../styles.css'
import SidebarNav from '../components/SidebarNav'
import UserBar from '../components/UserBar'
import { sidebarDOM } from '../../script'
import { useEffect } from 'react'

const Home = () => {
    useEffect(() => {
        sidebarDOM();
    }, []);

    return (
        <div>
            <SidebarNav />
            <div className='main-content'>
                <UserBar />
                <div className="welcome-message">
                    <h1>Welcome to Musicare</h1>
                    <p>Music curated for your mood and well-being</p>
                    <div className="subtitle">Click on the sidebar items to explore</div>
                </div>
                {/* Mood Input Section */}
                <div className="mood-input">
                    <h2>How are you feeling today?</h2>
                    <input type="text" id="mood" placeholder="Type your mood here..." />
                    <button className="green-btn" id="get-playlists">Get Playlists</button>
                </div>
                {/* Music Playlists Mockup */}
                <div className="playlists-container">
                    <div className="playlists-header">
                        <h2>Therapeutic Playlists</h2>
                        <p className="disclaimer">*Mockup for documentation purposes - Non-functional player interface</p>
                    </div>

                    <div className="playlists-grid">
                        {/* Anxiety Relief Playlist */}
                        <div className="playlist-card">
                            <div className="playlist-cover">
                                <div className="cover-gradient anxiety"></div>
                                <div className="play-button">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="playlist-info">
                                <h3>Anxiety Relief</h3>
                                <p>Calming melodies to ease tension</p>
                                <div className="playlist-stats">12 songs • 45 min</div>
                            </div>
                            <div className="playlist-tracks">
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Weightless</div>
                                        <div className="track-artist">Marconi Union</div>
                                    </div>
                                    <div className="track-duration">8:10</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Clair de Lune</div>
                                        <div className="track-artist">Claude Debussy</div>
                                    </div>
                                    <div className="track-duration">4:42</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Spiegel im Spiegel</div>
                                        <div className="track-artist">Arvo Pärt</div>
                                    </div>
                                    <div className="track-duration">6:25</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">River</div>
                                        <div className="track-artist">Emilie Simon</div>
                                    </div>
                                    <div className="track-duration">3:48</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Focus & Concentration Playlist */}
                        <div className="playlist-card">
                            <div className="playlist-cover">
                                <div className="cover-gradient focus"></div>
                                <div className="play-button">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="playlist-info">
                                <h3>Focus & Concentration</h3>
                                <p>Enhance productivity and mental clarity</p>
                                <div className="playlist-stats">15 songs • 62 min</div>
                            </div>
                            <div className="playlist-tracks">
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Music for Airports</div>
                                        <div className="track-artist">Brian Eno</div>
                                    </div>
                                    <div className="track-duration">17:20</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Metamorphosis Two</div>
                                        <div className="track-artist">Philip Glass</div>
                                    </div>
                                    <div className="track-duration">5:31</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Avril 14th</div>
                                        <div className="track-artist">Aphex Twin</div>
                                    </div>
                                    <div className="track-duration">2:05</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Gymnopédie No. 1</div>
                                        <div className="track-artist">Erik Satie</div>
                                    </div>
                                    <div className="track-duration">3:32</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Sleep & Relaxation Playlist */}
                        <div className="playlist-card">
                            <div className="playlist-cover">
                                <div className="cover-gradient sleep"></div>
                                <div className="play-button">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="playlist-info">
                                <h3>Sleep & Relaxation</h3>
                                <p>Gentle sounds for peaceful rest</p>
                                <div className="playlist-stats">10 songs • 78 min</div>
                            </div>
                            <div className="playlist-tracks">
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Sleep Baby Sleep</div>
                                        <div className="track-artist">Broods</div>
                                    </div>
                                    <div className="track-duration">4:12</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Moonlight Sonata</div>
                                        <div className="track-artist">Ludwig van Beethoven</div>
                                    </div>
                                    <div className="track-duration">15:28</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">Porcelain</div>
                                        <div className="track-artist">Moby</div>
                                    </div>
                                    <div className="track-duration">4:01</div>
                                </div>
                                <div className="track">
                                    <div className="track-info">
                                        <div className="track-name">La Valse d'Amélie</div>
                                        <div className="track-artist">Yann Tiersen</div>
                                    </div>
                                    <div className="track-duration">2:15</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Music Player Mockup */}
                    <div className="music-player">
                        <div className="player-track-info">
                            <div className="track-cover">
                                <div className="mini-cover anxiety"></div>
                            </div>
                            <div className="current-track">
                                <div className="current-track-name">Weightless</div>
                                <div className="current-track-artist">Marconi Union</div>
                            </div>
                        </div>
                        
                        <div className="player-controls">
                            <button className="control-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                </svg>
                            </button>
                            <button className="control-btn play-pause">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                            </button>
                            <button className="control-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="player-progress">
                            <div className="progress-time">2:34</div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: "31%" }}></div>
                            </div>
                            <div className="progress-time">8:10</div>
                        </div>
                        
                        <div className="player-volume">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                            <div className="volume-bar">
                                <div className="volume-fill" style={{ width: "65%" }}></div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Popup Modal */}
                <div className="popup-overlay" id="popup-overlay">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h2 id="popup-title">Section Title</h2>
                            <button className="close-btn" id="close-popup">&times;</button>
                        </div>
                        <div className="popup-body" id="popup-body">
                            {/* Content will be dynamically loaded here */}
                        </div>
                    </div>
                </div>

                {/* Hidden content templates */}
                <div className="content-templates" style={{ display: "none" }}>
                    <div id="about-content">
                        <div className="section-content">
                            <p>Learn more about Musicare and our mission to provide music for health and well-being.</p>
                            <div className="feature-list">
                                <h3>Our Mission</h3>
                                <ul>
                                    <li>Curate music for therapeutic purposes</li>
                                    <li>Support mental health through sound</li>
                                    <li>Create personalized wellness experiences</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div id="staff-content">
                        <div className="section-content">
                            <p>Meet the talented individuals behind Musicare.</p>
                            <div className="team-grid">
                                <div className="team-member">
                                    <h4>Development Team</h4>
                                    <p>Passionate developers creating innovative music therapy solutions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="docs-content">
                        <div className="section-content">
                            <p>Access project documentation, guides, and technical specifications.</p>
                            
                            <div className="file-upload-section">
                                <h3>Upload Documentation</h3>
                                <div className="file-upload-area" data-section="docs">
                                    <div className="upload-icon">📚</div>
                                    <p>Drop your .txt or .pdf files here or click to browse</p>
                                    <input type="file" id="docs-file" accept=".txt,.pdf" multiple />
                                    <button className="upload-btn" onClick={() => document.getElementById('docs-file').click()}>Choose Files</button>
                                </div>
                                <div className="uploaded-files" id="docs-files"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="sprints-content">
                        <div className="section-content">
                            <p>Track our development progress through sprint planning and retrospectives.</p>
                            
                            <div className="file-upload-section">
                                <h3>Upload Sprint Documents</h3>
                                <div className="file-upload-area" data-section="sprints">
                                    <div className="upload-icon">🏃‍♂️</div>
                                    <p>Drop your .txt or .pdf files here or click to browse</p>
                                    <input type="file" id="sprints-file" accept=".txt,.pdf" multiple />
                                    <button className="upload-btn" onClick={() => document.getElementById('sprints-file').click()}>Choose Files</button>
                                </div>
                                <div className="uploaded-files" id="sprints-files"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="dailies-content">
                        <div className="section-content">
                            <p>Daily team check-ins, blockers, and progress updates.</p>
                            
                            <div className="file-upload-section">
                                <h3>Upload Standup Notes</h3>
                                <div className="file-upload-area" data-section="dailies">
                                    <div className="upload-icon">📅</div>
                                    <p>Drop your .txt or .pdf files here or click to browse</p>
                                    <input type="file" id="dailies-file" accept=".txt,.pdf" multiple />
                                    <button className="upload-btn" onClick={() => document.getElementById('dailies-file').click()}>Choose Files</button>
                                </div>
                                <div className="uploaded-files" id="dailies-files"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="report-content">
                        <div className="section-content">
                            <p>Comprehensive project reports, analysis, and final deliverables.</p>
                            
                            <div className="file-upload-section">
                                <h3>Upload Project Reports</h3>
                                <div className="file-upload-area" data-section="report">
                                    <div className="upload-icon">📊</div>
                                    <p>Drop your .txt or .pdf files here or click to browse</p>
                                    <input type="file" id="report-file" accept=".txt,.pdf" multiple />
                                    <button className="upload-btn" onClick={() => document.getElementById('report-file').click()}>Choose Files</button>
                                </div>
                                <div className="uploaded-files" id="report-files"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home