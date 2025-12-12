/**
 * @fileoverview Messaging System Module
 *
 * Simple direct messaging system for the Musicare application.
 * Handles chat loading, message sending, and real-time message display
 * between friends for therapeutic music sharing and social support.
 *
 * Features:
 * - Load friends list for messaging
 * - Select friend to start/continue chat
 * - Send and receive messages
 * - Display chat history
 * - Simple polling for new messages
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-21
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js - Firebase core
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js - Firebase authentication
 * @requires ../../config/firebase.js - Firebase configuration
 *
 * @example
 * // This module is automatically imported in app/index.js:
 * // import '../features/messages/index.js';
 * // The MessagingSystem class is instantiated automatically on load
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from '../../config/firebase.js';

/**
 * Firebase Application Instance
 *
 * @constant {FirebaseApp} app
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication Service
 *
 * @constant {Auth} auth
 */
const auth = getAuth(app);

/**
 * Messaging System Class
 *
 * Main class managing all messaging functionality including chat loading,
 * message sending, and UI updates.
 *
 * @class MessagingSystem
 */
class MessagingSystem {
    /**
     * Initialize Messaging System
     *
     * Sets up the messaging system with initial state and starts
     * listening for authentication changes.
     *
     * @constructor
     */
    constructor() {
        /**
         * Current authenticated user data from database
         * @type {Object|null}
         */
        this.currentUser = null;

        /**
         * Currently active chat
         * @type {Object|null}
         */
        this.currentChat = null;

        /**
         * Currently selected friend for messaging
         * @type {Object|null}
         */
        this.currentFriend = null;

        /**
         * Polling interval ID for checking new messages
         * @type {number|null}
         */
        this.pollingInterval = null;

        /**
         * Group chat mode flag
         * @type {boolean}
         */
        this.groupChatMode = false;

        /**
         * Selected friends for group chat
         * @type {Set<string>}
         */
        this.selectedFriends = new Set();

        this.init();
    }

    /**
     * Initialize Messaging System
     *
     * Sets up authentication state listener and initializes UI components
     * when user is authenticated.
     *
     * @async
     * @function init
     */
    async init() {
        console.log('💬 MessagingSystem: Initializing...');

        // Wait for auth state to be ready
        auth.onAuthStateChanged(async (user) => {
            console.log('💬 MessagingSystem: Auth state changed', user ? 'User logged in' : 'User logged out');
            if (user) {
                console.log('💬 MessagingSystem: Firebase user:', user.uid);
                this.currentUser = await this.getCurrentUserData(user.uid);
                console.log('💬 MessagingSystem: Current user data:', this.currentUser);

                if (this.currentUser) {
                    this.setupEventListeners();
                    await this.loadFriendsList();
                }
            } else {
                this.cleanup();
            }
        });
    }

    /**
     * Get Current User Data
     *
     * Fetches the current user's data from the database using their Firebase UID.
     * Falls back to email-based lookup if UID lookup fails.
     *
     * @async
     * @function getCurrentUserData
     * @param {string} firebaseUid - Firebase authentication UID
     * @returns {Promise<Object|null>} User data object or null if not found
     */
    async getCurrentUserData(firebaseUid) {
        try {
            console.log('💬 MessagingSystem: Fetching user data for UID:', firebaseUid);
            let response = await fetch(`/api/users?firebaseUid=${firebaseUid}`);

            if (!response.ok) {
                // Fallback: search by email
                const currentUser = auth.currentUser;
                if (currentUser && currentUser.email) {
                    console.log('💬 MessagingSystem: Trying fallback search by email');
                    response = await fetch(`/api/users?email=${encodeURIComponent(currentUser.email)}`);
                    if (response.ok) {
                        const data = await response.json();
                        return data.user || data;
                    }
                }
            }

            const data = await response.json();
            return data.user || data;
        } catch (error) {
            console.error('💬 MessagingSystem: Error fetching user data:', error);
            return null;
        }
    }

    /**
     * Setup Event Listeners
     *
     * Attaches event listeners to UI elements for user interactions.
     * Includes send button, enter key, and friend search.
     *
     * @function setupEventListeners
     */
    setupEventListeners() {
        console.log('💬 MessagingSystem: Setting up event listeners');

        // Send message button
        const sendBtn = document.getElementById('send-message-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Enter key to send message
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Group chat mode toggle
        const toggleGroupModeBtn = document.getElementById('toggle-group-mode-btn');
        if (toggleGroupModeBtn) {
            toggleGroupModeBtn.addEventListener('click', () => this.toggleGroupMode());
        }

        // Create group button
        const createGroupBtn = document.getElementById('create-group-btn');
        if (createGroupBtn) {
            createGroupBtn.addEventListener('click', () => this.createGroupChat());
        }

        // Cancel group button
        const cancelGroupBtn = document.getElementById('cancel-group-btn');
        if (cancelGroupBtn) {
            cancelGroupBtn.addEventListener('click', () => this.cancelGroupMode());
        }

        // Friend search
        const friendsSearchInput = document.getElementById('friends-search-input');
        if (friendsSearchInput) {
            friendsSearchInput.addEventListener('input', (e) => {
                this.filterFriends(e.target.value);
            });
        }

        // Listen for profile updates to refresh current user data
        window.addEventListener('musicare:profile-updated', (event) => {
            console.log('💬 MessagingSystem: Profile updated, refreshing user data');
            if (event.detail && this.currentUser) {
                // Update local current user data
                this.currentUser = {
                    ...this.currentUser,
                    ...event.detail
                };
                console.log('💬 MessagingSystem: Updated current user:', this.currentUser);
            }
        });
    }

    /**
     * Load Friends List
     *
     * Fetches the user's friends and existing chats from the API
     * and displays them in the sidebar for messaging.
     *
     * @async
     * @function loadFriendsList
     */
    async loadFriendsList() {
        console.log('💬 MessagingSystem: Loading friends list and chats');

        try {
            // Load both friends and existing chats
            const [friendsResponse, chatsResponse] = await Promise.all([
                fetch(`/api/friends?action=friends&userId=${this.currentUser.id}`),
                fetch(`/api/messages?action=chats&userId=${this.currentUser.id}`)
            ]);

            if (!friendsResponse.ok || !chatsResponse.ok) {
                throw new Error('Failed to fetch friends or chats');
            }

            const friendsData = await friendsResponse.json();
            const chatsData = await chatsResponse.json();

            console.log('💬 MessagingSystem: Friends data:', friendsData);
            console.log('💬 MessagingSystem: Chats data:', chatsData);

            // Transform the friends data to flatten the nested structure
            const friends = (friendsData.friends || []).map(friendship => {
                const friendData = friendship.friend;
                return {
                    id: friendData.id,
                    username: friendData.username,
                    displayName: friendData.displayName,
                    email: friendData.email
                };
            });

            console.log('💬 MessagingSystem: Transformed friends:', friends);

            // Store both for later use
            this.allFriends = friends;
            this.allChats = chatsData.chats || [];

            // Display combined list
            this.displayChatsAndFriends();

        } catch (error) {
            console.error('💬 MessagingSystem: Error loading friends:', error);
            this.showMessage('Failed to load friends list', 'error');
        }
    }

    /**
     * Display Chats and Friends
     *
     * Renders existing chats (including groups) and friends in the sidebar.
     *
     * @function displayChatsAndFriends
     */
    displayChatsAndFriends() {
        const friendsChatList = document.getElementById('friends-chat-list');
        if (!friendsChatList) return;

        // In group mode, show friends for selection
        if (this.groupChatMode) {
            this.displayFriendsList(this.allFriends || []);
            return;
        }

        const items = [];

        // Add existing chats (including group chats)
        if (this.allChats && this.allChats.length > 0) {
            this.allChats.forEach(chat => {
                const isGroup = chat.participants.length > 2;
                let displayName, avatar;

                if (isGroup) {
                    // Group chat
                    if (chat.name) {
                        displayName = chat.name;
                    } else {
                        const otherParticipants = chat.participants
                            .filter(p => p.userId !== this.currentUser.id)
                            .map(p => p.user.displayName || p.user.username)
                            .join(', ');
                        displayName = otherParticipants || 'Group Chat';
                    }
                    avatar = '👥';
                } else {
                    // 1-on-1 chat
                    const otherUser = chat.participants.find(p => p.userId !== this.currentUser.id)?.user;
                    displayName = otherUser?.displayName || otherUser?.username || 'User';
                    avatar = displayName.charAt(0).toUpperCase();
                }

                const lastMessage = chat.lastMessage || 'No messages yet';

                items.push(`
                    <div class="friend-item" data-chat-id="${chat.id}" onclick="messagingSystem.selectChat('${chat.id}')">
                        <div class="friend-avatar">${avatar}</div>
                        <div class="friend-info">
                            <div class="friend-name">${displayName}</div>
                            <div class="friend-last-message">${this.escapeHtml(lastMessage.substring(0, 30))}${lastMessage.length > 30 ? '...' : ''}</div>
                        </div>
                    </div>
                `);
            });
        }

        // Add friends who don't have chats yet
        if (this.allFriends && this.allFriends.length > 0) {
            const friendsWithChats = new Set();
            this.allChats?.forEach(chat => {
                if (chat.participants.length === 2) {
                    const otherUser = chat.participants.find(p => p.userId !== this.currentUser.id);
                    if (otherUser) friendsWithChats.add(otherUser.userId);
                }
            });

            this.allFriends.forEach(friend => {
                if (!friendsWithChats.has(friend.id)) {
                    const displayName = friend.displayName || friend.username || 'User';
                    const avatar = displayName.charAt(0).toUpperCase();

                    items.push(`
                        <div class="friend-item" data-friend-id="${friend.id}" onclick="messagingSystem.selectFriend('${friend.id}')">
                            <div class="friend-avatar">${avatar}</div>
                            <div class="friend-info">
                                <div class="friend-name">${displayName}</div>
                                <div class="friend-last-message">Click to start chatting</div>
                            </div>
                        </div>
                    `);
                }
            });
        }

        if (items.length === 0) {
            friendsChatList.innerHTML = `
                <div class="no-friends-message">
                    No friends or chats available
                </div>
            `;
        } else {
            friendsChatList.innerHTML = items.join('');
        }
    }

    /**
     * Display Friends List
     *
     * Renders the friends list in the sidebar with click handlers
     * to start conversations. Used in group selection mode.
     *
     * @function displayFriendsList
     * @param {Array} friends - Array of friend objects
     */
    displayFriendsList(friends) {
        console.log('💬 MessagingSystem: Displaying friends list', friends.length);

        const friendsChatList = document.getElementById('friends-chat-list');
        if (!friendsChatList) return;

        if (friends.length === 0) {
            friendsChatList.innerHTML = `
                <div class="no-friends-message">
                    No friends available for messaging
                </div>
            `;
            return;
        }

        friendsChatList.innerHTML = friends.map(friend => {
            const displayName = friend.displayName || friend.username || 'User';
            const avatar = displayName.charAt(0).toUpperCase();
            const isSelected = this.selectedFriends.has(friend.id);

            return `
                <div class="friend-item group-select-mode ${isSelected ? 'selected' : ''}" data-friend-id="${friend.id}" onclick="messagingSystem.toggleFriendSelection('${friend.id}')">
                    <input type="checkbox" class="friend-checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); messagingSystem.toggleFriendSelection('${friend.id}')">
                    <div class="friend-avatar">${avatar}</div>
                    <div class="friend-info">
                        <div class="friend-name">${displayName}</div>
                        <div class="friend-last-message">Select for group</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Filter Friends
     *
     * Filters the friends list based on search input.
     *
     * @function filterFriends
     * @param {string} searchTerm - Search term to filter by
     */
    filterFriends(searchTerm) {
        if (!this.allFriends) return;

        const filtered = this.allFriends.filter(friend => {
            const displayName = (friend.displayName || friend.username || '').toLowerCase();
            return displayName.includes(searchTerm.toLowerCase());
        });

        this.displayFriendsList(filtered);
    }

    /**
     * Select Chat
     *
     * Opens an existing chat (including group chats) by chat ID.
     * Fetches the full chat history from the backend.
     *
     * @async
     * @function selectChat
     * @param {string} chatId - ID of the chat to open
     */
    async selectChat(chatId) {
        console.log('💬 MessagingSystem: Selecting chat:', chatId);

        // Find chat in cached list to get basic info
        const cachedChat = this.allChats?.find(c => c.id === chatId);
        if (!cachedChat) {
            console.error('💬 MessagingSystem: Chat not found in cache');
            return;
        }

        try {
            // Fetch full chat with all messages from backend
            const isGroup = cachedChat.participants.length > 2;

            let response;
            if (isGroup) {
                // For group chats, fetch by chatId
                console.log('💬 MessagingSystem: Loading group chat by ID');
                response = await fetch(
                    `/api/messages?action=chatById&userId=${this.currentUser.id}&chatId=${chatId}`
                );
            } else {
                // 1-on-1 chat - fetch full history using friendId
                const otherUser = cachedChat.participants.find(p => p.userId !== this.currentUser.id);
                if (!otherUser) {
                    console.error('💬 MessagingSystem: Could not find other user in chat');
                    return;
                }

                response = await fetch(
                    `/api/messages?action=chat&userId=${this.currentUser.id}&friendId=${otherUser.userId}`
                );
            }

            if (!response.ok) {
                throw new Error('Failed to load chat');
            }

            const data = await response.json();
            console.log('💬 MessagingSystem: Full chat data loaded:', data);

            this.currentChat = data.chat;

            // Check if it's a group or 1-on-1
            if (isGroup) {
                this.currentFriend = null;
                this.updateChatHeaderForGroup(data.chat);
            } else {
                // Set currentFriend for 1-on-1 chats
                const otherUser = data.chat.participants.find(p => p.userId !== this.currentUser.id)?.user;
                this.currentFriend = otherUser ? {
                    id: otherUser.id,
                    username: otherUser.username,
                    displayName: otherUser.displayName,
                    email: otherUser.email
                } : null;
                this.updateChatHeader(this.currentFriend, 'Online');
            }

            this.displayMessages(data.chat.messages || []);

            // Start polling for new messages
            this.startPolling();

        } catch (error) {
            console.error('💬 MessagingSystem: Error loading chat:', error);
            this.showMessage('Failed to load chat', 'error');
        }
    }

    /**
     * Select Friend
     *
     * Loads or creates a chat with the selected friend and displays
     * the chat history.
     *
     * @async
     * @function selectFriend
     * @param {string} friendId - ID of the friend to chat with
     */
    async selectFriend(friendId) {
        console.log('💬 MessagingSystem: Selecting friend:', friendId);

        // Find friend in list
        const friend = this.allFriends?.find(f => f.id === friendId);
        if (!friend) {
            console.error('💬 MessagingSystem: Friend not found');
            return;
        }

        this.currentFriend = friend;

        // Update UI to show loading
        this.updateChatHeader(friend, 'Loading...');

        try {
            // Get or create chat
            const response = await fetch(
                `/api/messages?action=chat&userId=${this.currentUser.id}&friendId=${friendId}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('💬 MessagingSystem: Server error response:', errorData);
                throw new Error(`Failed to load chat: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            console.log('💬 MessagingSystem: Chat data:', data);

            this.currentChat = data.chat;
            this.displayMessages(data.chat.messages || []);
            this.updateChatHeader(friend, 'Online');

            // Start polling for new messages
            this.startPolling();

        } catch (error) {
            console.error('💬 MessagingSystem: Error loading chat:', error);
            this.showMessage('Failed to load chat', 'error');
            this.updateChatHeader(friend, 'Error');
        }
    }

    /**
     * Update Chat Header
     *
     * Updates the chat header with friend information and status.
     *
     * @function updateChatHeader
     * @param {Object} friend - Friend object
     * @param {string} status - Status text to display
     */
    updateChatHeader(friend, status) {
        const displayName = friend.displayName || friend.username || 'User';
        const avatar = displayName.charAt(0).toUpperCase();

        const chatHeader = document.querySelector('.chat-header');
        if (!chatHeader) return;

        chatHeader.innerHTML = `
            <div class="chat-partner-info">
                <div class="chat-avatar">${avatar}</div>
                <div>
                    <div class="chat-partner-name">${displayName}</div>
                    <div class="chat-status">${status}</div>
                </div>
            </div>
        `;
    }

    /**
     * Display Messages
     *
     * Renders the message history in the chat area.
     *
     * @function displayMessages
     * @param {Array} messages - Array of message objects
     */
    displayMessages(messages) {
        console.log('💬 MessagingSystem: Displaying messages:', messages.length);

        const messagesList = document.getElementById('messages-list');
        if (!messagesList) return;

        if (messages.length === 0) {
            messagesList.innerHTML = `
                <div class="welcome-message">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        messagesList.innerHTML = messages.map(msg => {
            const isOwn = msg.senderId === this.currentUser.id;
            const senderName = msg.sender?.displayName || msg.sender?.username || 'User';
            const time = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="message ${isOwn ? 'own-message' : 'other-message'}">
                    <div class="message-sender">${isOwn ? 'You' : senderName}</div>
                    <div class="message-text">${this.escapeHtml(msg.text)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    /**
     * Send Message
     *
     * Sends a new message in the current chat.
     *
     * @async
     * @function sendMessage
     */
    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) return;

        const text = messageInput.value.trim();
        if (!text) {
            console.log('💬 MessagingSystem: Empty message, not sending');
            return;
        }

        if (!this.currentChat) {
            this.showMessage('Please select a friend first', 'error');
            return;
        }

        console.log('💬 MessagingSystem: Sending message');

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'send',
                    chatId: this.currentChat.id,
                    senderId: this.currentUser.id,
                    text: text
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            console.log('💬 MessagingSystem: Message sent:', data);

            // Clear input
            messageInput.value = '';

            // Reload messages - use selectChat for groups, selectFriend for 1-on-1
            if (this.currentFriend) {
                await this.selectFriend(this.currentFriend.id);
            } else {
                await this.selectChat(this.currentChat.id);
            }

        } catch (error) {
            console.error('💬 MessagingSystem: Error sending message:', error);
            this.showMessage('Failed to send message', 'error');
        }
    }

    /**
     * Start Polling
     *
     * Starts polling for new messages every 3 seconds.
     * Simple approach for real-time updates without WebSockets.
     *
     * @function startPolling
     */
    startPolling() {
        // Clear existing interval
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        console.log('💬 MessagingSystem: Starting message polling');

        // Poll every 3 seconds
        this.pollingInterval = setInterval(async () => {
            if (this.currentChat) {
                try {
                    let response;

                    // For 1-on-1 chats, use the friend ID
                    if (this.currentFriend) {
                        response = await fetch(
                            `/api/messages?action=chat&userId=${this.currentUser.id}&friendId=${this.currentFriend.id}`
                        );
                    } else {
                        // For group chats, fetch by chat ID
                        response = await fetch(
                            `/api/messages?action=chatById&userId=${this.currentUser.id}&chatId=${this.currentChat.id}`
                        );
                    }

                    if (response.ok) {
                        const data = await response.json();
                        const currentMessageCount = document.querySelectorAll('.message').length;
                        const newMessageCount = data.chat.messages?.length || 0;

                        // Only update if there are new messages
                        if (newMessageCount > currentMessageCount) {
                            console.log('💬 MessagingSystem: New messages detected');
                            this.displayMessages(data.chat.messages || []);
                        }
                    }
                } catch (error) {
                    console.error('💬 MessagingSystem: Polling error:', error);
                }
            }
        }, 3000);
    }

    /**
     * Cleanup
     *
     * Cleans up resources when user logs out.
     * Stops polling and resets state.
     *
     * @function cleanup
     */
    cleanup() {
        console.log('💬 MessagingSystem: Cleaning up');

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        this.currentUser = null;
        this.currentChat = null;
        this.currentFriend = null;
        this.allFriends = null;
    }

    /**
     * Escape HTML
     *
     * Escapes HTML characters to prevent XSS attacks.
     *
     * @function escapeHtml
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show Message
     *
     * Displays a toast message to the user.
     *
     * @function showMessage
     * @param {string} message - Message text
     * @param {string} type - Message type: 'success', 'error', 'info'
     */
    
    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            toast.style.background = '#22c55e';
        } else if (type === 'error') {
            toast.style.background = '#ef4444';
        } else {
            toast.style.background = '#3b82f6';
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Toggle Group Chat Mode
     *
     * Switches between normal chat mode and group creation mode.
     *
     * @function toggleGroupMode
     */
    toggleGroupMode() {
        this.groupChatMode = !this.groupChatMode;
        this.selectedFriends.clear();

        const groupControls = document.getElementById('group-creation-controls');
        const toggleBtn = document.getElementById('toggle-group-mode-btn');

        if (this.groupChatMode) {
            groupControls.style.display = 'block';
            toggleBtn.textContent = '❌ Cancel Group Mode';
            toggleBtn.style.backgroundColor = '#6c757d';
        } else {
            groupControls.style.display = 'none';
            toggleBtn.textContent = '➕ Create Group Chat';
            toggleBtn.style.backgroundColor = '';
        }

        // Refresh display to show/hide checkboxes
        this.displayChatsAndFriends();
    }

    /**
     * Cancel Group Mode
     *
     * Exits group creation mode without creating a group.
     *
     * @function cancelGroupMode
     */
    cancelGroupMode() {
        this.toggleGroupMode();
        const groupNameInput = document.getElementById('group-name-input');
        if (groupNameInput) {
            groupNameInput.value = '';
        }
    }

    /**
     * Toggle Friend Selection
     *
     * Adds or removes a friend from the selected group.
     *
     * @function toggleFriendSelection
     * @param {string} friendId - Friend ID to toggle
     */
    toggleFriendSelection(friendId) {
        if (this.selectedFriends.has(friendId)) {
            this.selectedFriends.delete(friendId);
        } else {
            this.selectedFriends.add(friendId);
        }

        // Refresh the friends list to update checkboxes
        if (this.allFriends) {
            this.displayFriendsList(this.allFriends);
        }
    }

    /**
     * Create Group Chat
     *
     * Creates a new group chat with selected friends.
     *
     * @async
     * @function createGroupChat
     */
    async createGroupChat() {
        if (this.selectedFriends.size < 1) {
            this.showMessage('Please select at least one friend for the group', 'error');
            return;
        }

        const groupName = document.getElementById('group-name-input').value.trim();
        const participantIds = Array.from(this.selectedFriends).join(',');

        try {
            const url = `/api/messages?action=createGroup&userId=${this.currentUser.id}&participantIds=${participantIds}${groupName ? `&groupName=${encodeURIComponent(groupName)}` : ''}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to create group chat');
            }

            const data = await response.json();
            console.log('💬 MessagingSystem: Group chat created:', data);

            this.showMessage('Group chat created successfully!', 'success');

            // Reload the chat list to show the new group
            await this.loadFriendsList();

            // Exit group mode
            this.cancelGroupMode();

            // Open the new group chat
            this.currentChat = data.chat;
            this.currentFriend = null; // It's a group, not a single friend
            this.displayMessages(data.chat.messages || []);
            this.updateChatHeaderForGroup(data.chat);

            // Start polling for new messages
            this.startPolling();

        } catch (error) {
            console.error('💬 MessagingSystem: Error creating group chat:', error);
            this.showMessage('Failed to create group chat', 'error');
        }
    }

    /**
     * Update Chat Header for Group
     *
     * Updates the chat header to show group information.
     *
     * @function updateChatHeaderForGroup
     * @param {Object} chat - Chat object
     */
    updateChatHeaderForGroup(chat) {
        const chatPartnerName = document.querySelector('.chat-partner-name');
        const chatStatus = document.querySelector('.chat-status');
        const chatAvatar = document.querySelector('.chat-avatar');

        if (chatPartnerName && chatStatus && chatAvatar) {
            if (chat.name) {
                chatPartnerName.textContent = chat.name;
            } else {
                // Show participant names
                const participantNames = chat.participants
                    .filter(p => p.userId !== this.currentUser.id)
                    .map(p => p.user.displayName || p.user.username)
                    .join(', ');
                chatPartnerName.textContent = participantNames || 'Group Chat';
            }
            chatStatus.textContent = `${chat.participants.length} members`;
            chatAvatar.textContent = '👥';
        }
    }
}

/**
 * Global MessagingSystem Instance
 *
 * Create a global instance for onclick handlers in HTML.
 *
 * @global
 * @type {MessagingSystem}
 */
window.messagingSystem = new MessagingSystem();

console.log('💬 MessagingSystem: Module loaded');
