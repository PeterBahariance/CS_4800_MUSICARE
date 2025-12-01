/**
 * @fileoverview Main Application Entry Point
 *
 * Core application module for the Musicare app (app.html). Handles:
 * - Firebase authentication state management
 * - Tab navigation system (Home, Library, etc.)
 * - User profile bootstrapping
 * - Sign out functionality
 * - Integration with feature modules (friends, music library, player)
 *
 * This is the main orchestrator that ties together all app features and
 * ensures users are authenticated before accessing the application.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js - Firebase core
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js - Firebase authentication
 * @requires ../config/firebase.js - Firebase configuration
 * @requires ../features/friends/index.js - Friend system module
 * @requires ../features/music/library.js - Music library view
 *
 * @example
 * // This module is loaded via script tag in app.html:
 * // <script type="module" src="../src/app/index.js"></script>
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from '../config/firebase.js';
import '../features/friends/index.js'; // Import friend system
import '../features/messages/index.js'; // Import messaging system
import LibraryView from '../features/music/library.js';
import { initChat } from '../features/Chatbot/chatbot.js'; // Import chatbot

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
 * DOM Element References
 *
 * Cached references to frequently accessed DOM elements for performance.
 */
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const signOutBtn = document.getElementById('sign-out-btn');

/**
 * Authentication State Monitor
 *
 * Monitors Firebase authentication state and handles:
 * - Displaying user info when authenticated
 * - Bootstrapping user profile from database
 * - Redirecting to login when not authenticated
 *
 * @listens onAuthStateChanged
 * @param {User|null} user - Firebase user object or null if not authenticated
 */
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is authenticated - show user info and bootstrap profile
        userInfo.style.display = 'block';
        userEmail.textContent = user.email;

        // Set up sign out button
        signOutBtn.addEventListener('click', handleSignOut);

        // Load user profile from database
        bootstrapUserProfile(user);
    } else {
        // User is not authenticated - redirect to login page
        window.location.href = '../index.html';
    }
});

/**
 * Sign Out Handler
 *
 * Signs the user out of Firebase Authentication.
 * Redirect to login page happens automatically via onAuthStateChanged.
 *
 * @async
 * @function handleSignOut
 * @throws {Error} Firebase sign out errors
 */
async function handleSignOut() {
    try {
        await firebaseSignOut(auth);
        // Redirect happens automatically due to onAuthStateChanged
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}

/**
 * Tab Navigation System
 *
 * Manages the single-page app navigation between different views
 * (Home, Library, etc.) with smooth animations.
 */

/**
 * Navigation Items
 *
 * @constant {NodeList} navItems - All navigation items with data-tab attribute
 */
const navItems = document.querySelectorAll('.nav-item[data-tab]');

/**
 * Current Active Tab
 *
 * @type {string} currentTab - ID of the currently active tab
 */
let currentTab = 'home';

/**
 * Library View Instance
 *
 * @type {LibraryView|null} libraryView - Instance of the music library view
 */
let libraryView = null;
let friendsFeedContainers = [];
let friendsFeedTemplate = null;

// Expose containers globally so other modules (like the player) can re-render into new clones
window.musicareFriendsFeedContainers = friendsFeedContainers;

/**
 * Show Tab Function
 *
 * Displays the selected tab content with smooth fade-in animation.
 * Handles dynamic content loading from templates if needed.
 *
 * @function showTab
 * @param {string} tabId - ID of the tab to display (e.g., 'home', 'library')
 *
 * @example
 * showTab('library'); // Shows the library view
 */
function showTab(tabId) {
    // Get the main content area
    const mainContent = document.querySelector('.main-content');

    // Hide all content sections
    const existingSections = document.querySelectorAll('.content-section');
    existingSections.forEach(section => {
        if (section.id === `${tabId}-content`) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });

    // Remove active class from all nav items
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // Show the selected tab content
    let contentSection = document.getElementById(`${tabId}-content`);

    if (!contentSection) {
        // If content section doesn't exist, try to get it from the templates
        let template = null;
        if (tabId === 'friends-feed') {
            if (!friendsFeedTemplate) {
                friendsFeedTemplate = document.querySelector('.friends-feed-template');
            }
            template = friendsFeedTemplate;
        } else {
            template = document.querySelector(`.content-templates #${tabId}-content`);
        }

        if (template) {
            contentSection = template.cloneNode(true);
            contentSection.id = `${tabId}-content`;
            contentSection.className = 'content-section';

            mainContent.appendChild(contentSection);

            if (tabId === 'friends-feed') {
                const panel = contentSection.querySelector('.friends-posts-feed');
                if (panel) {
                    friendsFeedContainers.push(panel);
                    window.musicareFriendsFeedContainers = friendsFeedContainers;
                    window.dispatchEvent(new CustomEvent('musicare:friends-feed-cloned', {
                        detail: { containers: friendsFeedContainers }
                    }));
                }
            }
        }
    }

    // Show the content section with a nice fade-in animation
    if (contentSection) {
        contentSection.style.display = 'block';
        contentSection.style.opacity = '0';
        contentSection.style.transform = 'translateY(20px)';
        contentSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Trigger reflow to ensure animation plays
        void contentSection.offsetWidth;

        // Animate in
        contentSection.style.opacity = '1';
        contentSection.style.transform = 'translateY(0)';
    }

    // Add active class to clicked nav item
    const activeNavItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    currentTab = tabId;

    document.dispatchEvent(new CustomEvent('musicare:tab-shown', {
        detail: { tabId }
    }));
}

// Initialize tab navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = item.getAttribute('data-tab');
        showTab(tabId);

        // Update URL without reloading the page
        window.history.pushState({ tab: tabId }, '', `?tab=${tabId}`);
    });
});

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
    const tabId = e.state?.tab || 'home';
    showTab(tabId);
});

// Show initial tab from URL or default to 'home'
const urlParams = new URLSearchParams(window.location.search);
const initialTab = urlParams.get('tab') || 'home';
showTab(initialTab);

// Import and initialize music player
import '../features/music/player.js';

// Initialize any other app-specific functionality here
console.log('App initialized');

document.addEventListener('musicare:user-ready', (event) => {
    if (!libraryView) {
        libraryView = new LibraryView();
    }
    libraryView.setUserContext(event.detail);
});

document.addEventListener('musicare:tab-shown', (event) => {
    if (event.detail?.tabId === 'library' && libraryView) {
        // Small delay to ensure DOM is ready after tab switch
        setTimeout(() => {
            libraryView.mount();
        }, 50);
    }
});

async function bootstrapUserProfile(user) {
    if (!user) return;

    try {
        const profile = await loadUserProfile(user);
        const mergedProfile = {
            ...profile,
            firebase: {
                uid: user.uid,
                email: user.email
            }
        };

        window.musicareUserContext = mergedProfile;
        document.dispatchEvent(new CustomEvent('musicare:user-ready', {
            detail: mergedProfile
        }));

        logUserProfile(mergedProfile);
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
}

async function loadUserProfile(user) {
    const params = new URLSearchParams();
    if (user.email) params.append('email', user.email);
    if (user.uid) params.append('firebaseUid', user.uid);

    const response = await fetch(`/api/users?${params.toString()}`);

    if (response.status === 404) {
        await createUserProfile(user);
        return loadUserProfile(user);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Unable to load user profile');
    }

    const data = await response.json();
    return data.user;
}

async function createUserProfile(user) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Musicare Listener'
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Unable to create user profile');
    }
}

function logUserProfile(profile) {
    if (!profile) return;

    console.groupCollapsed('🎧 Musicare user profile loaded');
    console.log('User ID:', profile.id);
    console.log('Email:', profile.email);
    console.log('Display Name:', profile.displayName);
    console.log('Health Goals:', profile.healthGoals?.length ? profile.healthGoals : '(none)');
    console.log('Music Preferences:', profile.musicPreferences?.length ? profile.musicPreferences : '(none)');
    console.log('Daily Listening Goal:', profile.dailyListeningGoal ?? '(unset)');
    console.groupEnd();
}

/**
 * Initialize Chatbot
 *
 * Initializes the chatbot widget for playlist recommendations and music assistance
 */
console.log('🤖 Initializing Musicare Chatbot...');
initChat({
    inputId: 'chat-input',
    sendBtnId: 'chat-send-btn',
    messagesId: 'chat-messages',
    apiPath: '/api/chat'
});
console.log('✅ Chatbot initialized successfully');

