// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from '../config/firebase.js';
import '../features/friends/index.js'; // Import friend system
import LibraryView from '../features/music/library.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const signOutBtn = document.getElementById('sign-out-btn');

// Check auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        userInfo.style.display = 'block';
        userEmail.textContent = user.email;

        // Set up sign out button
        signOutBtn.addEventListener('click', handleSignOut);
        bootstrapUserProfile(user);
    } else {
        // User is signed out, redirect to login
        window.location.href = '../index.html';
    }
});

// Handle sign out
async function handleSignOut() {
    try {
        await firebaseSignOut(auth);
        // Redirect happens automatically due to onAuthStateChanged
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}

// Tab navigation
const navItems = document.querySelectorAll('.nav-item[data-tab]');
let currentTab = 'home';
let libraryView = null;

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
        const template = document.querySelector(`.content-templates #${tabId}-content`);
        if (template) {
            contentSection = template.cloneNode(true);
            contentSection.id = `${tabId}-content`;
            contentSection.className = 'content-section';

            mainContent.appendChild(contentSection);
        }
    }

    // Show the content section with a nice animation
    if (contentSection) {
        contentSection.style.display = 'block';
        contentSection.style.opacity = '0';
        contentSection.style.transform = 'translateY(20px)';
        contentSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Trigger reflow
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

