# CS_4800_MUSICARE

A music care application built for CS 4800.

## Project File Structure

```
CS_4800_MUSICARE/                    # Musicare - Music Care Application
├── README.md                        # Project documentation
├── package.json                     # Node.js dependencies & scripts
├── package-lock.json               # Dependency lock file
├── vercel.json                      # Vercel deployment configuration
├── vite.config.js                   # Vite build configuration
├── vercel-build.js                  # Vercel build script
│
├── backend/                         # Server-side source
│   ├── api/                        # Vercel/Express API handlers
│   │   ├── users/
│   │   │   └── index.js            # User management API
│   │   ├── friends.js              # Friend system API
│   │   ├── search-users.js         # User search API
│   │   ├── people.js               # People management
│   │   ├── files.js                # File operations
│   │   ├── simple.js               # Simple test endpoint
│   │   ├── test.js                 # API testing
│   │   ├── mock-files.js           # Mock file data
│   │   └── mock-people.js          # Mock people data
│   ├── lib/                        # Backend utilities
│   │   ├── database.js             # Database connection helpers
│   │   ├── jamendo.js              # Jamendo API wrapper
│   │   └── prisma.js               # Prisma client configuration
│   └── scripts/                    # Node-based tooling
│       ├── dev-server.js           # Local Express development server
│       └── test-api.js             # CLI API smoke test
│
├── frontend/                        # Client-side source
│   ├── index.html                  # Landing/login page (Vite root entry)
│   ├── pages/                      # Multi-page HTML entry points
│   │   ├── app.html                # Main application interface
│   │   ├── notif.html              # Notifications page
│   │   └── signup.html             # User registration page
│   ├── public/                     # Static assets copied verbatim
│   │   └── test.js                 # Public test scripts
│   ├── src/                        # Frontend modules
│   │   ├── app/                    # Core app shell and navigation
│   │   ├── auth/                   # Login & signup flows
│   │   ├── config/                 # Shared configuration modules
│   │   ├── legacy/                 # Archived popup/file upload prototype
│   │   └── features/               # Domain feature modules (friends, music)
│   ├── styles.css                  # Global styling
│   └── vite-env.d.ts               # Vite TypeScript declarations
│
├── tests/
│   └── manual/
│       └── test-api.html           # Browser-based API testing harness
│
├── prisma/                          # Database Schema & ORM
│   ├── schema.prisma               # Database schema definition
│   └── generated/                   # Auto-generated Prisma client
│       └── prisma-client/
│           ├── index.js            # Main Prisma client
│           ├── package.json        # Client package info
│           ├── schema.prisma       # Generated schema copy
│           └── runtime/            # Runtime files
│
└── dist/                            # Built/compiled files (auto-generated)
    ├── index.html                  # Built landing page
    ├── app.html                    # Built app page
    ├── signup.html                 # Built signup page
    ├── notif.html                  # Built notifications page
    └── assets/                     # Compiled CSS/JS assets
```