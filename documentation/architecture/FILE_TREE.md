# Complete File Tree

**Date**: November 13, 2025
**Status**: Phase 2 Complete

---

## Root Directory Structure

```
CS_4800_MUSICARE/
├── .DS_Store                           # macOS system file
├── .env.local                          # Local environment variables
├── .gitignore                          # Git ignore patterns
├── DOCUMENTATION_SYSTEM_PROMPT.md      # Documentation generation guide
├── README.md                           # Project overview and setup
├── deployVercel.md                     # Vercel deployment guide
├── package.json                        # Node.js project configuration
├── package-lock.json                   # Dependency lock file
├── vercel.json                         # Vercel deployment config
├── vercel-build.js                     # Custom Vercel build script
├── vercel-build.mjs                    # ES module build script
├── vite.config.js                      # Vite build tool configuration
│
├── api/                                # Vercel API routes (legacy structure)
│   ├── _middleware.js                  # API middleware
│   └── users/
│       └── index.js                    # User management endpoint
│
├── backend/                            # Backend code organization
│   ├── api/                            # API route handlers
│   │   ├── files.js                    # File operations API
│   │   ├── friends.js                  # Friend system API
│   │   ├── mock-files.js               # Mock file data
│   │   ├── mock-people.js              # Mock people data
│   │   ├── people.js                   # People management API
│   │   ├── playlists.js                # Music playlist API
│   │   ├── search-users.js             # User search API
│   │   ├── simple.js                   # Simple test endpoint
│   │   ├── test.js                     # API testing utilities
│   │   └── users/
│   │       └── index.js                # User CRUD operations
│   ├── lib/                            # Backend utilities
│   │   ├── database.js                 # Database connection utilities
│   │   ├── jamendo.js                  # Jamendo music API integration
│   │   └── prisma.js                   # Prisma client configuration
│   └── scripts/                        # Build and development scripts
│       ├── dev-server.js               # Express development server
│       └── test-api.js                 # API testing script
│
├── frontend/                           # Frontend code organization
│   ├── index.html                      # Landing/login page
│   ├── styles.css                      # Global CSS styles
│   ├── vite-env.d.ts                   # Vite TypeScript definitions
│   ├── pages/                          # HTML page templates
│   │   ├── app.html                    # Main application interface
│   │   ├── notif.html                  # Notifications page
│   │   └── signup.html                 # User registration page
│   ├── public/                         # Static public assets
│   │   └── test.js                     # Public test scripts
│   └── src/                            # Frontend JavaScript modules
│       ├── app/
│       │   └── index.js                # Main app initialization
│       ├── auth/                       # Authentication modules
│       │   ├── index.js                # Auth service
│       │   └── signup.js               # Signup functionality
│       ├── config/
│       │   └── firebase.js             # Firebase configuration
│       ├── features/                   # Feature-based modules
│       │   ├── friends/
│       │   │   └── index.js            # Friend system logic
│       │   └── music/
│       │       └── player.js           # Music player component
│       └── legacy/
│           └── script.js               # Legacy JavaScript code
│
├── src/                                # Root-level source files (legacy)
│   ├── app.js                          # Core app functionality
│   ├── friends.js                      # Friend system (root level)
│   ├── main.js                         # Main application entry
│   ├── music-player.js                 # Music player implementation
│   └── pages/
│       └── signup.js                   # Signup page logic
│
├── prisma/                             # Database ORM
│   ├── schema.prisma                   # Database schema definition
│   └── generated/                      # Auto-generated Prisma client
│       └── prisma-client/              # Generated client files
│           ├── index.js                # Main client entry
│           ├── package.json            # Client package info
│           ├── schema.prisma           # Generated schema copy
│           └── runtime/                # Runtime support files
│
├── tests/                              # Testing files
│   └── manual/
│       └── test-api.html               # Manual API testing interface
│
└── documentation/                      # Project documentation
    ├── architecture/                   # Architecture documentation
    │   └── INITIAL_ANALYSIS.md         # Initial codebase analysis
    ├── setup/                          # Setup guides
    ├── testing/                        # Testing documentation
    └── workflows/                      # Feature workflow docs
```

---

## Directory Explanations

### `/api` - Legacy Vercel API Routes
**Contains**: Legacy API route structure for Vercel deployment
**Organization**: Follows Vercel's file-based routing convention
**Naming Convention**: Kebab-case for route files
**Key Files**:
- `_middleware.js` - Global API middleware
- `users/index.js` - User management endpoint
**Subdirectories**:
- `/users` - User-related API endpoints

### `/backend` - Modern Backend Organization
**Contains**: Organized backend code with clear separation of concerns
**Organization**: Feature-based organization with utilities separated
**Naming Convention**: Kebab-case for files, camelCase for functions
**Key Files**:
- `api/playlists.js` - Music playlist management
- `api/friends.js` - Social features API
- `lib/prisma.js` - Database client setup
- `scripts/dev-server.js` - Development server
**Subdirectories**:
- `/api` - API route handlers
- `/lib` - Utility libraries and integrations
- `/scripts` - Build and development scripts

### `/frontend` - Frontend Code Organization
**Contains**: All frontend code including pages, components, and assets
**Organization**: Feature-based with clear separation of pages and logic
**Naming Convention**: Kebab-case for files, camelCase for JavaScript
**Key Files**:
- `index.html` - Landing page entry point
- `styles.css` - Global styling
- `src/features/music/player.js` - Music player component
- `src/auth/index.js` - Authentication service
**Subdirectories**:
- `/pages` - HTML page templates
- `/src` - JavaScript modules and components
- `/public` - Static assets

### `/src` - Root Source Files (Legacy)
**Contains**: Legacy source files at root level
**Organization**: Mixed organization pattern (needs consolidation)
**Naming Convention**: Kebab-case for files
**Key Files**:
- `main.js` - Application entry point
- `music-player.js` - Music player implementation
- `friends.js` - Friend system logic
- `app.js` - Core app functionality
**Subdirectories**:
- `/pages` - Page-specific logic

### `/prisma` - Database ORM
**Contains**: Database schema and generated client
**Organization**: Standard Prisma structure
**Naming Convention**: Standard Prisma conventions
**Key Files**:
- `schema.prisma` - Database schema definition
- `generated/prisma-client/index.js` - Generated client
**Subdirectories**:
- `/generated` - Auto-generated Prisma client files

### `/tests` - Testing Files
**Contains**: Manual and automated testing files
**Organization**: Test type separation
**Naming Convention**: Descriptive naming for test files
**Key Files**:
- `manual/test-api.html` - Manual API testing interface
**Subdirectories**:
- `/manual` - Manual testing tools

### `/documentation` - Project Documentation
**Contains**: Comprehensive project documentation
**Organization**: Documentation type separation
**Naming Convention**: UPPERCASE.md for major docs
**Key Files**:
- `architecture/INITIAL_ANALYSIS.md` - Codebase analysis
**Subdirectories**:
- `/architecture` - System architecture docs
- `/setup` - Setup and installation guides
- `/testing` - Testing documentation
- `/workflows` - Feature workflow documentation

---

## File Categorization

### Configuration Files
- `package.json` - Node.js project configuration and dependencies
- `vercel.json` - Vercel deployment configuration
- `vite.config.js` - Vite build tool configuration
- `.env.local` - Local environment variables
- `.gitignore` - Git ignore patterns

### Entry Points
- `frontend/index.html` - Landing page entry
- `frontend/pages/app.html` - Main app entry
- `src/main.js` - JavaScript application entry
- `backend/scripts/dev-server.js` - Development server entry

### Core Application Files
- `src/music-player.js` - Music player implementation
- `src/friends.js` - Friend system logic
- `src/app.js` - Core app functionality
- `frontend/src/auth/index.js` - Authentication service
- `backend/api/playlists.js` - Playlist API
- `backend/api/friends.js` - Friends API

### Database Files
- `prisma/schema.prisma` - Database schema
- `backend/lib/prisma.js` - Prisma client configuration
- `backend/lib/database.js` - Database utilities

### Build/Deploy Files
- `vercel-build.js` - Custom build script
- `vercel-build.mjs` - ES module build script
- `dist/` - Built files (auto-generated)

---

## Naming Conventions Observed

### JavaScript Files
- **Pattern**: kebab-case for filenames
- **Examples**: `music-player.js`, `dev-server.js`, `search-users.js`
- **Functions**: camelCase within files
- **Classes**: PascalCase

### HTML Files
- **Pattern**: kebab-case
- **Examples**: `index.html`, `app.html`, `notif.html`

### API Routes
- **Pattern**: kebab-case with descriptive names
- **Examples**: `playlists.js`, `search-users.js`, `mock-files.js`

### Configuration Files
- **Pattern**: kebab-case or standard names
- **Examples**: `vite.config.js`, `package.json`, `vercel.json`

---

## 🔧 IMPROVEMENT NEEDED

### File Organization Issues

**Issue**: Duplicate file organization patterns
**Location**: `/src/` vs `/frontend/src/`
**Current State**: Same types of files in multiple locations
**Recommendation**: Consolidate all frontend code under `/frontend/src/`
**Priority**: HIGH
**Affected Files**:
- `src/main.js` vs `frontend/src/app/index.js`
- `src/friends.js` vs `frontend/src/features/friends/index.js`
- `src/music-player.js` vs `frontend/src/features/music/player.js`

**Issue**: Legacy API structure alongside modern structure
**Location**: `/api/` vs `/backend/api/`
**Current State**: API routes split between two locations
**Recommendation**: Consolidate all API routes under `/backend/api/`
**Priority**: MEDIUM
**Reason**: Reduces confusion and improves maintainability

**Issue**: Mixed naming conventions
**Location**: Various files
**Current State**: Some files use camelCase, others kebab-case
**Recommendation**: Standardize on kebab-case for all filenames
**Priority**: LOW
**Examples**: Consistent across most files, minor cleanup needed
