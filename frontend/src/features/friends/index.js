/**
 * @fileoverview Friend System Module
 *
 * Comprehensive friend management system for the Musicare application.
 * Handles friend search, friend requests, friend list management, and real-time updates.
 *
 * Features:
 * - User search with debounced input
 * - Send/accept/reject friend requests
 * - View friends list with online status
 * - Friend request notifications with badge counts
 * - Modal-based UI for friend management
 * - Integration with Prisma database via /api/friends endpoint
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js - Firebase core
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js - Firebase authentication
 * @requires ../../config/firebase.js - Firebase configuration
 *
 * @example
 * // This module is automatically imported in app/index.js:
 * // import '../features/friends/index.js';
 * // The FriendSystem class is instantiated automatically on load
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
 * Friend System Class
 *
 * Main class managing all friend-related functionality including search,
 * requests, and friend list management.
 *
 * @class FriendSystem
 */
class FriendSystem {
    /**
     * Initialize Friend System
     *
     * Sets up the friend system with initial state and starts
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
         * Timeout ID for debounced search
         * @type {number|null}
         */
        this.searchTimeout = null;

        /**
         * Currently selected user in search results
         * @type {Object|null}
         */
        this.currentSelectedUser = null;

        this.init();
    }

    /**
     * Initialize Friend System
     *
     * Sets up authentication state listener and initializes UI components
     * when user is authenticated.
     *
     * @async
     * @function init
     */
    async init() {
        console.log('🔍 FriendSystem: Initializing...');

        // Wait for auth state to be ready
        auth.onAuthStateChanged(async (user) => {
            console.log('🔍 FriendSystem: Auth state changed', user ? 'User logged in' : 'User logged out');
            if (user) {
                console.log('🔍 FriendSystem: Firebase user:', user.uid);

                // Load current user data from database
                this.currentUser = await this.getCurrentUserData(user.uid);
                console.log('🔍 FriendSystem: Current user data:', this.currentUser);

                // Set up UI and load initial data
                this.setupEventListeners();
                this.showFriendSearchBar();
                this.loadFriendRequestsCount();
                this.loadFriendsCount();
            } else {
                this.hideFriendSearchBar();
            }
        });
    }

    /**
     * Get Current User Data from Database
     *
     * Fetches the current user's profile from the Prisma database.
     * Tries Firebase UID first, falls back to email if needed.
     * Automatically updates user record with Firebase UID if missing.
     *
     * @async
     * @function getCurrentUserData
     * @param {string} firebaseUid - Firebase authentication UID
     * @returns {Promise<Object|null>} User data object or null if not found
     *
     * @example
     * const userData = await this.getCurrentUserData('firebase-uid-123');
     * // Returns: { id: 1, email: 'user@example.com', displayName: 'User', ... }
     */
    async getCurrentUserData(firebaseUid) {
        try {
            console.log('🔍 FriendSystem: Fetching user data for Firebase UID:', firebaseUid);

            // First try to find by Firebase UID (primary method)
            let response = await fetch(`/api/users?firebaseUid=${firebaseUid}`);
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 FriendSystem: Found user by Firebase UID:', data);
                // Handle both response formats: direct user object or wrapped in {user: ...}
                const userData = data.user || data;
                return userData;
            }

            // If not found by Firebase UID, try to find by email (fallback for legacy users)
            const auth = window.auth;
            if (auth && auth.currentUser && auth.currentUser.email) {
                console.log('🔍 FriendSystem: Trying fallback search by email:', auth.currentUser.email);
                response = await fetch(`/api/users?email=${encodeURIComponent(auth.currentUser.email)}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('🔍 FriendSystem: Found user by email:', data);
                    // Handle both response formats: direct user object or wrapped in {user: ...}
                    const userData = data.user || data;

                    // Update the user record with Firebase UID for future use
                    if (userData && !userData.firebaseUid) {
                        console.log('🔍 FriendSystem: Updating user record with Firebase UID');
                        await this.updateUserFirebaseUid(userData.id, firebaseUid);
                        userData.firebaseUid = firebaseUid;
                    }

                    return userData;
                }
            }

            console.log('🔍 FriendSystem: User not found by Firebase UID or email');
        } catch (error) {
            console.error('Error fetching current user data:', error);
        }
        return null;
    }

    /**
     * Update User Firebase UID
     *
     * Updates a user record in the database with their Firebase UID.
     * Used for migrating legacy users who don't have Firebase UID stored.
     *
     * @async
     * @function updateUserFirebaseUid
     * @param {number} userId - Database user ID
     * @param {string} firebaseUid - Firebase authentication UID
     * @returns {Promise<void>}
     */
    async updateUserFirebaseUid(userId, firebaseUid) {
        try {
            const response = await fetch('/api/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userId,
                    firebaseUid: firebaseUid
                })
            });

            if (response.ok) {
                console.log('🔍 FriendSystem: Successfully updated user with Firebase UID');
            } else {
                console.error('🔍 FriendSystem: Failed to update user with Firebase UID');
            }
        } catch (error) {
            console.error('🔍 FriendSystem: Error updating user Firebase UID:', error);
        }
    }

    showFriendSearchBar() {
        console.log('🔍 FriendSystem: Attempting to show search bar...');
        const container = document.getElementById('friend-search-container');
        console.log('🔍 FriendSystem: Search container element:', container);
        if (container) {
            container.style.display = 'block';
            console.log('🔍 FriendSystem: Search bar shown');
        } else {
            console.error('🔍 FriendSystem: Search container not found!');
        }
    }

    hideFriendSearchBar() {
        const container = document.getElementById('friend-search-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    setupEventListeners() {
        console.log('🔍 FriendSystem: Setting up event listeners...');
        // Search input
        const searchInput = document.getElementById('user-search-input');
        console.log('🔍 FriendSystem: Search input element:', searchInput);
        if (searchInput) {
            console.log('🔍 FriendSystem: Adding input event listener to search input');
            searchInput.addEventListener('input', (e) => {
                console.log('🔍 FriendSystem: Search input changed:', e.target.value);
                this.handleSearch(e.target.value);
            });

            // Hide results when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-section')) {
                    this.hideSearchResults();
                }
            });
        } else {
            console.error('🔍 FriendSystem: Search input element not found!');
        }

        // Friend requests icon
        const requestsIcon = document.getElementById('friend-requests-icon');
        if (requestsIcon) {
            requestsIcon.addEventListener('click', () => {
                this.showFriendRequestsPopup();
            });
        }

        // Profile popup close button
        const closeProfileBtn = document.getElementById('close-profile-popup');
        if (closeProfileBtn) {
            closeProfileBtn.addEventListener('click', () => {
                this.hideProfilePopup();
            });
        }

        // Requests popup close button
        const closeRequestsBtn = document.getElementById('close-requests-popup');
        if (closeRequestsBtn) {
            closeRequestsBtn.addEventListener('click', () => {
                this.hideFriendRequestsPopup();
            });
        }

        // Friends list icon
        const friendsIcon = document.getElementById('friends-list-icon');
        if (friendsIcon) {
            friendsIcon.addEventListener('click', () => {
                this.showFriendsListPopup();
            });
        }

        // Friends popup close button
        const closeFriendsBtn = document.getElementById('close-friends-popup');
        if (closeFriendsBtn) {
            closeFriendsBtn.addEventListener('click', () => {
                this.hideFriendsListPopup();
            });
        }

        // Friend action buttons
        this.setupFriendActionButtons();

        // Close popups when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup-overlay')) {
                this.hideProfilePopup();
                this.hideFriendRequestsPopup();
                this.hideFriendsListPopup();
            }
        });
    }

    setupFriendActionButtons() {
        const addFriendBtn = document.getElementById('add-friend-btn');
        const cancelRequestBtn = document.getElementById('cancel-request-btn');
        const acceptRequestBtn = document.getElementById('accept-request-btn');
        const declineRequestBtn = document.getElementById('decline-request-btn');
        const removeFriendBtn = document.getElementById('remove-friend-btn');

        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.sendFriendRequest());
        }
        if (cancelRequestBtn) {
            cancelRequestBtn.addEventListener('click', () => this.cancelFriendRequest());
        }
        if (acceptRequestBtn) {
            acceptRequestBtn.addEventListener('click', () => this.acceptFriendRequest());
        }
        if (declineRequestBtn) {
            declineRequestBtn.addEventListener('click', () => this.declineFriendRequest());
        }
        if (removeFriendBtn) {
            removeFriendBtn.addEventListener('click', () => this.removeFriend());
        }
    }

    async handleSearch(query) {
        console.log('🔍 FriendSystem: handleSearch called with query:', query);
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // If query is empty, hide results
        if (!query.trim()) {
            console.log('🔍 FriendSystem: Empty query, hiding results');
            this.hideSearchResults();
            return;
        }

        console.log('🔍 FriendSystem: Setting search timeout for query:', query.trim());
        // Debounce search
        this.searchTimeout = setTimeout(async () => {
            console.log('🔍 FriendSystem: Executing search for:', query.trim());
            await this.performSearch(query.trim());
        }, 300);
    }

    async performSearch(query) {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/search-users?query=${encodeURIComponent(query)}&currentUserId=${this.currentUser.id}&limit=10`);

            if (response.ok) {
                const data = await response.json();
                this.displaySearchResults(data.users);
            } else {
                console.error('Search failed:', response.statusText);
                this.hideSearchResults();
            }
        } catch (error) {
            console.error('Search error:', error);
            this.hideSearchResults();
        }
    }

    displaySearchResults(users) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        if (users.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item"><div class="search-result-info"><div class="search-result-name">No users found</div></div></div>';
            resultsContainer.classList.add('show');
            return;
        }

        const resultsHTML = users.map(user => {
            const displayName = user.displayName || user.username || 'Unknown User';
            const username = user.username ? `@${user.username}` : user.email;

            let statusHTML = '';
            if (user.relationshipStatus === 'friends') {
                statusHTML = '<span class="search-result-status friends">Friends</span>';
            } else if (user.relationshipStatus === 'request_sent') {
                statusHTML = '<span class="search-result-status request-sent">Request Sent</span>';
            } else if (user.relationshipStatus === 'request_received') {
                statusHTML = '<span class="search-result-status request-received">Request Received</span>';
            }

            return `
                <div class="search-result-item" data-user-id="${user.id}">
                    <div class="search-result-avatar">👤</div>
                    <div class="search-result-info">
                        <div class="search-result-name">${displayName}</div>
                        <div class="search-result-username">${username}</div>
                    </div>
                    ${statusHTML}
                </div>
            `;
        }).join('');

        resultsContainer.innerHTML = resultsHTML;
        resultsContainer.classList.add('show');

        // Add click listeners to results
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                const user = users.find(u => u.id === userId);
                if (user) {
                    this.showUserProfile(user);
                    this.hideSearchResults();
                }
            });
        });
    }

    hideSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.classList.remove('show');
        }
    }

    showUserProfile(user) {
        console.log('🔍 FriendSystem: Showing user profile', {
            user: user,
            userId: user.id,
            currentUser: this.currentUser,
            currentUserId: this.currentUser?.id
        });

        this.currentSelectedUser = user;

        // Update profile information
        document.getElementById('profile-display-name').textContent = user.displayName || user.username || 'Unknown User';
        document.getElementById('profile-username').textContent = user.username ? `@${user.username}` : '';
        document.getElementById('profile-email').textContent = user.email || '';

        // Update health goals
        const healthGoalsContainer = document.getElementById('profile-health-goals');
        if (user.healthGoals && user.healthGoals.length > 0) {
            healthGoalsContainer.innerHTML = user.healthGoals.map(goal => `<span class="tag">${goal}</span>`).join('');
        } else {
            healthGoalsContainer.innerHTML = '<span class="tag">None specified</span>';
        }

        // Update music preferences
        const musicPrefsContainer = document.getElementById('profile-music-preferences');
        if (user.musicPreferences && user.musicPreferences.length > 0) {
            musicPrefsContainer.innerHTML = user.musicPreferences.map(pref => `<span class="tag">${pref}</span>`).join('');
        } else {
            musicPrefsContainer.innerHTML = '<span class="tag">None specified</span>';
        }

        // Update action buttons based on relationship status
        this.updateProfileActionButtons(user.relationshipStatus);

        // Show popup
        document.getElementById('user-profile-popup').style.display = 'flex';
    }

    updateProfileActionButtons(relationshipStatus) {
        // Hide all buttons first
        document.getElementById('add-friend-btn').style.display = 'none';
        document.getElementById('cancel-request-btn').style.display = 'none';
        document.getElementById('accept-request-btn').style.display = 'none';
        document.getElementById('decline-request-btn').style.display = 'none';
        document.getElementById('remove-friend-btn').style.display = 'none';

        // Show appropriate buttons based on status
        switch (relationshipStatus) {
            case 'none':
                document.getElementById('add-friend-btn').style.display = 'inline-block';
                break;
            case 'request_sent':
                document.getElementById('cancel-request-btn').style.display = 'inline-block';
                break;
            case 'request_received':
                document.getElementById('accept-request-btn').style.display = 'inline-block';
                document.getElementById('decline-request-btn').style.display = 'inline-block';
                break;
            case 'friends':
                document.getElementById('remove-friend-btn').style.display = 'inline-block';
                break;
        }
    }

    hideProfilePopup() {
        document.getElementById('user-profile-popup').style.display = 'none';
        this.currentSelectedUser = null;
    }

    async sendFriendRequest() {
        if (!this.currentSelectedUser || !this.currentUser) {
            console.error('🔍 FriendSystem: Missing user data', {
                currentUser: this.currentUser,
                currentSelectedUser: this.currentSelectedUser
            });
            return;
        }

        console.log('🔍 FriendSystem: Sending friend request', {
            senderId: this.currentUser.id,
            receiverId: this.currentSelectedUser.id,
            currentUser: this.currentUser,
            currentSelectedUser: this.currentSelectedUser,
            currentUserKeys: Object.keys(this.currentUser),
            currentSelectedUserKeys: Object.keys(this.currentSelectedUser)
        });

        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'send',
                    senderId: this.currentUser.id,
                    receiverId: this.currentSelectedUser.id
                })
            });

            if (response.ok) {
                // Update UI to show request sent
                this.updateProfileActionButtons('request_sent');
                this.currentSelectedUser.relationshipStatus = 'request_sent';

                // Show success message
                this.showMessage('Friend request sent!', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to send friend request', 'error');
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            this.showMessage('Failed to send friend request', 'error');
        }
    }

    async loadFriendRequestsCount() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/friends?action=requests&userId=${this.currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                this.updateNotificationBadge(data.requests.length);
            }
        } catch (error) {
            console.error('Error loading friend requests count:', error);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    showMessage(message, type = 'info') {
        // Create a simple toast message
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

        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    async showFriendRequestsPopup() {
        document.getElementById('friend-requests-popup').style.display = 'flex';
        await this.loadFriendRequests();
    }

    hideFriendRequestsPopup() {
        document.getElementById('friend-requests-popup').style.display = 'none';
    }

    async showFriendsListPopup() {
        document.getElementById('friends-list-popup').style.display = 'flex';
        await this.loadFriendsList();
    }

    hideFriendsListPopup() {
        document.getElementById('friends-list-popup').style.display = 'none';
    }

    async loadFriendsCount() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/friends?action=friends&userId=${this.currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                const count = data.friends ? data.friends.length : 0;

                const friendsCountElement = document.getElementById('friends-count');
                if (friendsCountElement) {
                    friendsCountElement.textContent = count;
                }

                console.log('🔍 FriendSystem: Friends count loaded:', count);
            }
        } catch (error) {
            console.error('Error loading friends count:', error);
        }
    }

    async loadFriendsList() {
        if (!this.currentUser) return;

        const container = document.getElementById('friends-list');
        container.innerHTML = '<p class="loading-message">Loading friends...</p>';

        try {
            const response = await fetch(`/api/friends?action=friends&userId=${this.currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                this.displayFriendsList(data.friends);
            } else {
                container.innerHTML = '<p class="empty-message">Failed to load friends</p>';
            }
        } catch (error) {
            console.error('Error loading friends list:', error);
            container.innerHTML = '<p class="empty-message">Failed to load friends</p>';
        }
    }

    displayFriendsList(friends) {
        const container = document.getElementById('friends-list');

        if (!friends || friends.length === 0) {
            container.innerHTML = '<p class="empty-message">No friends yet. Start by searching for users to add!</p>';
            return;
        }

        container.innerHTML = friends.map(friendship => {
            const friend = friendship.friend;
            return `
                <div class="friend-item">
                    <div class="friend-avatar">
                        ${friend.displayName ? friend.displayName.charAt(0).toUpperCase() : friend.username ? friend.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${friend.displayName || friend.username || 'Unknown'}</div>
                        <div class="friend-username">@${friend.username || 'unknown'}</div>
                        <div class="friend-status">Friends since ${new Date(friendship.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-action-btn message" onclick="friendSystem.messageFriend('${friend.id}')">
                            💬 Message
                        </button>
                        <button class="friend-action-btn remove" onclick="friendSystem.removeFriend('${friend.id}')">
                            🗑️ Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async messageFriend(friendId) {
        // Placeholder for messaging functionality
        this.showMessage('Messaging feature coming soon!', 'info');
    }

    async removeFriend(friendId) {
        if (!confirm('Are you sure you want to remove this friend?')) {
            return;
        }

        try {
            const response = await fetch('/api/friends', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    friendId: friendId
                })
            });

            if (response.ok) {
                this.showMessage('Friend removed successfully', 'success');
                this.loadFriendsList(); // Refresh the list
                this.loadFriendsCount(); // Update the count
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to remove friend', 'error');
            }
        } catch (error) {
            console.error('Error removing friend:', error);
            this.showMessage('Failed to remove friend', 'error');
        }
    }

    async loadFriendRequests() {
        if (!this.currentUser) return;

        const container = document.getElementById('friend-requests-list');
        container.innerHTML = '<p class="loading-message">Loading friend requests...</p>';

        try {
            const response = await fetch(`/api/friends?action=requests&userId=${this.currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                this.displayFriendRequests(data.requests);
            } else {
                container.innerHTML = '<p class="empty-message">Failed to load friend requests</p>';
            }
        } catch (error) {
            console.error('Error loading friend requests:', error);
            container.innerHTML = '<p class="empty-message">Failed to load friend requests</p>';
        }
    }

    displayFriendRequests(requests) {
        const container = document.getElementById('friend-requests-list');

        if (requests.length === 0) {
            container.innerHTML = '<p class="empty-message">No pending friend requests</p>';
            return;
        }

        const requestsHTML = requests.map(request => {
            const sender = request.sender;
            const displayName = sender.displayName || sender.username || 'Unknown User';
            const username = sender.username ? `@${sender.username}` : sender.email;
            const timeAgo = this.getTimeAgo(new Date(request.createdAt));

            return `
                <div class="friend-request-item" data-request-id="${request.id}">
                    <div class="friend-request-avatar">👤</div>
                    <div class="friend-request-info">
                        <div class="friend-request-name">${displayName}</div>
                        <div class="friend-request-username">${username}</div>
                        <div class="friend-request-time">${timeAgo}</div>
                    </div>
                    <div class="friend-request-actions">
                        <button class="friend-request-btn accept" onclick="friendSystem.acceptRequest('${request.id}')">Accept</button>
                        <button class="friend-request-btn decline" onclick="friendSystem.declineRequest('${request.id}')">Decline</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = requestsHTML;
    }

    async acceptRequest(requestId) {
        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'accept',
                    requestId: requestId
                })
            });

            if (response.ok) {
                this.showMessage('Friend request accepted!', 'success');
                await this.loadFriendRequests(); // Refresh the list
                await this.loadFriendRequestsCount(); // Update badge
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to accept request', 'error');
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
            this.showMessage('Failed to accept request', 'error');
        }
    }

    async declineRequest(requestId) {
        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'decline',
                    requestId: requestId
                })
            });

            if (response.ok) {
                this.showMessage('Friend request declined', 'info');
                await this.loadFriendRequests(); // Refresh the list
                await this.loadFriendRequestsCount(); // Update badge
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to decline request', 'error');
            }
        } catch (error) {
            console.error('Error declining friend request:', error);
            this.showMessage('Failed to decline request', 'error');
        }
    }

    async cancelFriendRequest() {
        // This would require finding the request ID first
        // For now, we'll implement a simpler approach by refreshing the search
        if (this.currentSelectedUser) {
            this.showMessage('Feature coming soon: Cancel friend request', 'info');
        }
    }

    async acceptFriendRequest() {
        // This is handled in the friend requests popup
        this.showMessage('Please use the friend requests popup to accept requests', 'info');
    }

    async declineFriendRequest() {
        // This is handled in the friend requests popup
        this.showMessage('Please use the friend requests popup to decline requests', 'info');
    }

    async removeFriend() {
        if (!this.currentSelectedUser || !this.currentUser) return;

        if (confirm('Are you sure you want to remove this friend?')) {
            try {
                const response = await fetch('/api/friends', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: this.currentUser.id,
                        friendId: this.currentSelectedUser.id
                    })
                });

                if (response.ok) {
                    // Update UI to show no relationship
                    this.updateProfileActionButtons('none');
                    this.currentSelectedUser.relationshipStatus = 'none';

                    this.showMessage('Friend removed', 'info');
                } else {
                    const error = await response.json();
                    this.showMessage(error.error || 'Failed to remove friend', 'error');
                }
            } catch (error) {
                console.error('Error removing friend:', error);
                this.showMessage('Failed to remove friend', 'error');
            }
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return date.toLocaleDateString();
    }
}

// Initialize friend system
const friendSystem = new FriendSystem();

// Make it globally available for onclick handlers
window.friendSystem = friendSystem;

export default friendSystem;
