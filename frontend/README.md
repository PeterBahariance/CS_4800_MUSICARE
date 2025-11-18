# `/frontend` - Frontend Application Directory

## 📋 Purpose

This directory contains **ALL frontend code** for the Musicare application. This is the **only** frontend directory you should be working in.

## 📁 Directory Structure

```
frontend/
├── index.html              # Landing/login page
├── pages/                  # Additional HTML pages
│   ├── app.html           # Main application page
│   ├── notif.html         # Notifications page
│   └── signup.html        # Signup page
├── src/                   # JavaScript modules (ACTIVE CODE)
│   ├── app/               # Main app logic
│   ├── auth/              # Authentication
│   ├── config/            # Configuration
│   ├── features/          # Feature modules
│   │   ├── friends/       # Friend system
│   │   ├── music/         # Music player & library
│   │   └── playlists/     # Playlist management
│   └── legacy/            # Legacy code (to be refactored)
├── styles.css             # Global styles
├── public/                # Static assets
└── vite-env.d.ts          # TypeScript definitions
```

## 🎯 Key Points

### This is the ONLY Frontend Directory
- **All HTML files** are here
- **All JavaScript modules** are in `frontend/src/`
- **All styles** are in `frontend/styles.css`
- **Vite root** is set to this directory

### Entry Points
- `index.html` → `src/auth/index.js` (Login page)
- `pages/signup.html` → `src/auth/signup.js` (Signup page)
- `pages/app.html` → `src/app/index.js` (Main app)
- `pages/notif.html` → Similar structure

### Import Paths
When importing from HTML files in this directory:
```html
<!-- From frontend/index.html -->
<script type="module" src="./src/auth/index.js"></script>

<!-- From frontend/pages/app.html -->
<script type="module" src="/src/app/index.js"></script>
```

When importing between JavaScript files:
```javascript
// From frontend/src/app/index.js
import { firebaseConfig } from '../config/firebase.js';
import '../features/friends/index.js';
import LibraryView from '../features/music/library.js';
```

## 🚫 NOT the Root `/src` Directory

There is a **legacy `/src` directory at the project root** that contains old code:
```
/src/                      # ⚠️ LEGACY - DO NOT USE
├── app.js                 # Old version (replaced by frontend/src/app/)
├── main.js                # Old entry point (no longer used)
├── friends.js             # Old friends logic (replaced by frontend/src/features/friends/)
└── music-player.js        # Old player (replaced by frontend/src/features/music/)
```

**Do NOT edit files in the root `/src` directory!** All active code is in `/frontend/src/`.

## 📦 Module Organization

### `/src/app` - Main Application
Core application logic, tab navigation, user context

### `/src/auth` - Authentication
Login, signup, session management

### `/src/config` - Configuration
Firebase config, environment variables

### `/src/features` - Feature Modules
Each feature has its own directory:
- **friends/** - Friend search, requests, list
- **music/** - Music player, library view
- **playlists/** - Playlist CRUD operations

### `/src/legacy` - Legacy Code
Old code that needs refactoring. Should eventually be removed or migrated to proper feature modules.

## 🔧 Development

### Starting Development Server
```bash
# From project root
npm run dev

# Vite will serve from /frontend directory
# Visit http://localhost:5173
```

### Building for Production
```bash
# From project root
npm run build

# Output goes to /dist directory
```

### File Watching
Vite watches all files in `/frontend` for changes and hot-reloads automatically.

## ✅ Best Practices

1. **All frontend code goes in `/frontend`**
2. **Organize by feature in `/src/features`**
3. **Use relative imports** between modules
4. **Keep HTML files minimal** - logic goes in JavaScript modules
5. **Use ES modules** (`import`/`export`)
6. **Don't edit root `/src`** - it's legacy code

## 🗑️ Cleanup Needed

The root `/src` directory should be removed once we verify nothing depends on it. It contains duplicate/outdated code that has been replaced by the organized structure in `/frontend/src`.

---

**Remember:** `/frontend` is your frontend home. Everything else is either backend or legacy! 🏠

