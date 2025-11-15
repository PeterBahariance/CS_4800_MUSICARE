# Core Patterns Identification

**Date**: November 13, 2025
**Status**: Phase 4 Complete

---

## Pattern Categories

1. [Firebase Authentication Patterns](#firebase-authentication-patterns)
2. [API Endpoint Patterns](#api-endpoint-patterns)
3. [Database Access Patterns](#database-access-patterns)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Module Initialization Patterns](#module-initialization-patterns)
6. [DOM Manipulation Patterns](#dom-manipulation-patterns)
7. [Class-Based Component Patterns](#class-based-component-patterns)
8. [Event Handling Patterns](#event-handling-patterns)

---

## Firebase Authentication Patterns

### Pattern 1.1: Firebase Initialization with CDN Imports

**When to use**: When initializing Firebase authentication in frontend modules

**Current Implementation** (Real code from codebase):

```javascript
// File: frontend/src/auth/index.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from '../config/firebase.js';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Export Firebase services
export { auth, firebaseSignOut };
```

**Explanation**:
- Uses CDN imports for Firebase modules (version 10.7.1)
- Imports config from separate config file
- Initializes app and auth service
- Exports auth for use in other modules

**Variations Found**:
- ✅ **Consistent pattern**: `frontend/src/auth/signup.js` - Same CDN version and structure
- ✅ **Consistent pattern**: `src/main.js` - Identical implementation
- ⚠️ **Inconsistent pattern**: `frontend/pages/app.html` - Uses dynamic import with try-catch

**Best Practice**:
```javascript
// Recommended: Use npm packages instead of CDN
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '../config/firebase.js';

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
export { auth };
```

**Common Mistakes**:
- ❌ Mixing CDN and npm package imports
- ❌ Hardcoded Firebase version in multiple files
- ❌ Duplicate Firebase initialization across files

### Pattern 1.2: Auth State Management

**When to use**: When handling user authentication state changes

**Current Implementation**:

```javascript
// File: frontend/src/auth/index.js
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    const isOnAuthPage = currentPath.endsWith('index.html') ||
        currentPath.endsWith('signup.html') ||
        currentPath === '/';

    if (user && !isRedirecting && isOnAuthPage) {
        isRedirecting = true;
        console.log('User is logged in, redirecting to app.html');
        window.location.href = 'pages/app.html';
    } else if (!user && currentPath.endsWith('app.html')) {
        window.location.href = '../index.html';
    }
});
```

**Explanation**:
- Listens for auth state changes
- Implements route protection logic
- Handles redirects based on authentication status
- Prevents redirect loops with isRedirecting flag

---

## API Endpoint Patterns

### Pattern 2.1: Vercel Serverless Function Structure

**When to use**: When creating API endpoints for Vercel deployment

**Current Implementation**:

```javascript
// File: backend/api/users/index.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Ensure we always return JSON
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Method-specific logic here
    if (req.method === 'GET') {
      // GET logic
    } else if (req.method === 'POST') {
      // POST logic
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
```

**Explanation**:
- Default export function for Vercel compatibility
- CORS headers for cross-origin requests
- OPTIONS method handling for preflight
- Consistent error handling structure
- JSON content-type enforcement

**Variations Found**:
- ✅ **Good example**: `backend/api/playlists.js` - Includes Prisma disconnect in finally block
- ✅ **Good example**: `backend/api/friends.js` - Comprehensive error logging
- ⚠️ **Inconsistent**: `backend/api/simple.js` - Missing try-catch error handling

### Pattern 2.2: Database Operation with Error Handling

**When to use**: When performing database operations in API endpoints

**Current Implementation**:

```javascript
// File: backend/api/playlists.js
try {
    // Database operations
    const playlists = await prisma.playlist.findMany({
        include: {
            playlistSongs: {
                include: {
                    song: true
                }
            }
        }
    });
    
    return res.status(200).json(playlists);
} catch (error) {
    console.error('Playlists API Error:', error);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
} finally {
    await prisma.$disconnect();
}
```

**Explanation**:
- Comprehensive error logging with stack traces
- Environment-specific error details
- Proper Prisma client disconnection
- Consistent JSON error response format

---

## Database Access Patterns

### Pattern 3.1: Prisma Client Singleton

**When to use**: When accessing database from serverless functions

**Current Implementation**:

```javascript
// File: backend/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Create Prisma client with proper configuration
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
```

**Explanation**:
- Singleton pattern prevents multiple client instances
- Global storage for development hot reloading
- Comprehensive logging configuration
- Environment-aware client management

### Pattern 3.2: Database Query with Relations

**When to use**: When fetching related data from multiple tables

**Current Implementation**:

```javascript
// File: backend/api/friends.js
const friendships = await prisma.friendship.findMany({
  where: { userId: currentUserId },
  include: {
    friend: {
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

**Explanation**:
- Uses Prisma include for related data
- Selective field inclusion for security
- Consistent ordering pattern
- Proper relation handling

---

## Error Handling Patterns

### Pattern 4.1: Frontend API Error Handling

**When to use**: When making API calls from frontend

**Current Implementation**:

```javascript
// File: backend/lib/database.js
export async function uploadFileToDatabase(fileData) {
  try {
    const response = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

**Explanation**:
- Checks response.ok before parsing JSON
- Extracts error message from API response
- Logs error for debugging
- Re-throws error for caller handling

### Pattern 4.2: User-Facing Error Display

**When to use**: When showing errors to users in the UI

**Current Implementation**:

```javascript
// File: frontend/src/auth/index.js
catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Failed to sign in. Please check your credentials.';

    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
    } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
    }

    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}
```

**Explanation**:
- Maps technical errors to user-friendly messages
- Uses Firebase error codes for specific handling
- Auto-hides error messages after timeout
- Graceful fallback for missing DOM elements

---

## Module Initialization Patterns

### Pattern 5.1: DOM Ready State Checking

**When to use**: When initializing modules that depend on DOM elements

**Current Implementation**:

```javascript
// File: src/music-player.js
console.log('🎵 Music Player: Module file loaded!');

function initializeMusicPlayer() {
    try {
        console.log('🎵 Music Player: Starting initialization...');
        musicPlayer = new MusicPlayer();
        musicPlayer.setupPlayerControls();
        window.musicPlayer = musicPlayer;
        console.log('🎵 Music Player: Successfully initialized');
    } catch (error) {
        console.error('🎵 Music Player: Initialization failed:', error);
    }
}

if (document.readyState === 'loading') {
    console.log('🎵 Music Player: DOM still loading, waiting...');
    document.addEventListener('DOMContentLoaded', initializeMusicPlayer);
} else {
    console.log('🎵 Music Player: DOM ready, initializing immediately...');
    initializeMusicPlayer();
}
```

**Explanation**:
- Checks document.readyState before initialization
- Handles both loading and ready states
- Extensive logging for production debugging
- Global window assignment for cross-module access
- Defensive error handling with try-catch

### Pattern 5.2: Auth-Dependent Initialization

**When to use**: When modules need user authentication before initializing

**Current Implementation**:

```javascript
// File: src/friends.js
async init() {
    console.log('🔍 FriendSystem: Initializing...');
    // Wait for auth state to be ready
    auth.onAuthStateChanged(async (user) => {
        console.log('🔍 FriendSystem: Auth state changed', user ? 'User logged in' : 'User logged out');
        if (user) {
            console.log('🔍 FriendSystem: Firebase user:', user.uid);
            this.currentUser = await this.getCurrentUserData(user.uid);
            console.log('🔍 FriendSystem: Current user data:', this.currentUser);
            this.setupEventListeners();
            this.showFriendSearchBar();
            this.loadFriendRequestsCount();
            this.loadFriendsCount();
        } else {
            this.hideFriendSearchBar();
        }
    });
}
```

**Explanation**:
- Waits for auth state before proceeding
- Fetches user data from database after Firebase auth
- Sets up UI elements only when authenticated
- Cleans up UI when user logs out
- Comprehensive logging for debugging

---

## DOM Manipulation Patterns

### Pattern 6.1: Dynamic Content Rendering

**When to use**: When rendering dynamic lists or content from API data

**Current Implementation**:

```javascript
// File: src/friends.js
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
            </div>
        </div>
    `;
}).join('');
```

**Explanation**:
- Uses template literals for HTML generation
- Handles null/undefined values with fallbacks
- Inline event handlers with global object references
- Array.map().join('') pattern for list rendering

### Pattern 6.2: SVG Icon Rendering

**When to use**: When dynamically updating UI icons based on state

**Current Implementation**:

```javascript
// File: src/music-player.js
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
```

**Explanation**:
- Defensive null checking before DOM manipulation
- State-based conditional rendering
- Inline SVG for scalable icons
- Template literals for clean HTML structure

---

## Class-Based Component Patterns

### Pattern 7.1: Component Class Structure

**When to use**: When creating reusable components with state and methods

**Current Implementation**:

```javascript
// File: src/music-player.js
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
        console.log('🎵 Music Player: Setting up audio event listeners...');

        // Set up audio element event listeners
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.onTrackLoaded());
        this.audio.addEventListener('error', (e) => this.handleError(e));

        console.log('🎵 Music Player: About to load playlists...');
        // Load playlists from API
        this.loadPlaylists();
    }
}
```

**Explanation**:
- Constructor initializes all state properties
- Calls init() method for setup logic
- Arrow functions preserve 'this' context in event listeners
- Comprehensive logging for debugging
- Separation of initialization and setup logic

### Pattern 7.2: Error Handling in Components

**When to use**: When handling errors within component methods

**Current Implementation**:

```javascript
// File: src/music-player.js
handleError(error) {
    console.error('Audio error:', error);
    this.showError('Error playing audio. Trying next track...');
    setTimeout(() => this.playNext(), 2000);
}
```

**Explanation**:
- Logs technical error for debugging
- Shows user-friendly error message
- Implements automatic recovery (play next track)
- Uses setTimeout for delayed recovery

---

## Event Handling Patterns

### Pattern 8.1: Tab Navigation System

**When to use**: When implementing single-page app navigation

**Current Implementation**:

```javascript
// File: frontend/src/app/index.js
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
    const tabId = e.state?.tab || 'about';
    showTab(tabId);
});
```

**Explanation**:
- Prevents default link behavior
- Uses data attributes for configuration
- Updates browser history for back/forward support
- Handles popstate events for browser navigation
- Fallback to default tab if no state

### Pattern 8.2: Form Submission with Validation

**When to use**: When handling form submissions with API calls

**Current Implementation**:

```javascript
// File: frontend/src/auth/index.js
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('login-error');

        if (errorElement) {
            errorElement.style.display = 'none';
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('User logged in:', userCredential.user);
            // onAuthStateChanged will handle the redirect
        } catch (error) {
            // Error handling code...
        }
    });
}
```

**Explanation**:
- Prevents default form submission
- Extracts form data from DOM elements
- Clears previous error messages
- Uses async/await for API calls
- Relies on auth state change for navigation

---

## 🔧 IMPROVEMENT NEEDED

### Pattern Violations

**Issue**: Mixed Firebase Import Patterns
**Location**: Multiple files using different Firebase import methods
**Current State**: Some files use CDN imports, others should use npm packages
**Priority**: MEDIUM
**Affected Files**:
- `frontend/src/auth/index.js` - CDN imports
- `frontend/src/auth/signup.js` - CDN imports
- `src/main.js` - CDN imports
- `frontend/pages/app.html` - Dynamic imports

**Should be**:
```javascript
// Standardize on npm packages
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
```

---

**Issue**: Inconsistent Error Handling in API Routes
**Location**: Some API routes missing comprehensive error handling
**Current State**: `backend/api/simple.js` lacks try-catch blocks
**Priority**: HIGH
**Security Risk**: Unhandled errors could expose sensitive information

**Should be**:
```javascript
export default async function handler(req, res) {
  try {
    // API logic
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
```

---

**Issue**: Global Object Pollution
**Location**: Multiple files assigning to window object
**Current State**: `window.auth`, `window.musicPlayer`, etc.
**Priority**: LOW
**Maintainability**: Makes dependencies unclear

**Should be**:
```javascript
// Use proper module exports/imports instead of global assignments
export { auth, musicPlayer };
```

---

**Issue**: Inline Event Handlers in Template Literals
**Location**: `src/friends.js` using onclick attributes
**Current State**: `onclick="friendSystem.messageFriend('${friend.id}')"`
**Priority**: MEDIUM
**Security Risk**: Potential XSS if data is not sanitized

**Should be**:
```javascript
// Use addEventListener after DOM insertion
const button = container.querySelector(`[data-friend-id="${friend.id}"]`);
button.addEventListener('click', () => this.messageFriend(friend.id));
```
