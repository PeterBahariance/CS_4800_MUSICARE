import React from 'react'
import SidebarNav from '../components/SidebarNav'
import '../messages.css'
import { messagesDOM } from '../utils/messages'
import UserBar from '../components/UserBar'
import { useEffect } from 'react'

const Messages = () => {
    useEffect(() => {
        // Call the imported function here
        messagesDOM();
    }, []);
    return (
        <>
            <SidebarNav />
            <div className="main-content">
                <UserBar />

                <div className="playlists-grid">
        
                    {/* Mockup of clickable message */}
                    <div className="container">
                        <h1>Messages</h1>
                        <div className="message-list">
                            <div className="message-item" data-chat="dr-miller">
                                <div className="message-sender">Dr. Miller <span className="sender-role">Psychiatrist</span></div>
                                <div className="message-preview">I've been researching how music therapy can help with anxiety. Have you tried any specific techniques?</div>
                            </div>
                            <div className="message-item" data-chat="dr-patil">
                                <div className="message-sender">Dr. Patil <span className="sender-role">Therapist</span></div>
                                <div className="message-preview">Many of my patients find that creating playlists for different moods helps them regulate emotions.</div>
                            </div>
                            <div className="message-item" data-chat="alex">
                                <div className="message-sender">Alex <span className="sender-role">Friend</span></div>
                                <div className="message-preview">Remember that concert we went to? I still get chills thinking about how the music lifted my mood for days!</div>
                            </div>
                            <div className="message-item" data-chat="sam">
                                <div className="message-sender">Sam <span className="sender-role">Friend</span></div>
                                <div className="message-preview">I've been curating a "calm" playlist for when I feel anxious. Want me to share it with you?</div>
                            </div>
                        </div>
                    </div>

                    <div className="overlay" id="overlay"></div>

                    <div className="chat-container" id="chatContainer">
                        <div className="chat-header">
                            <div>
                                <div className="chat-title" id="chatTitle">Dr. Miller</div>
                                <div className="chat-subtitle" id="chatSubtitle">Psychiatrist</div>
                            </div>
                            <button className="close-btn" id="closeChat">&times;</button>
                        </div>
                        <div className="chat-messages" id="chatMessages">
                        {/* Messages will be inserted here by JavaScript */}
                        </div>
                        <div className="chat-input">
                            <input type="text" id="messageInput" placeholder="Type a message..."/>
                            <button className="send-btn" id="sendMessage">➤</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Messages