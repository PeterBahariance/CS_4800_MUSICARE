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
├── dev-server.js                    # Development server setup
├── vercel-build.js                  # Vercel build script
│
├── Frontend Pages
│   ├── index.html                   # Landing/login page
│   ├── app.html                     # Main application interface
│   ├── signup.html                  # User registration page
│   ├── notif.html                   # Notifications page
│   ├── test-api.html               # API testing page
│   └── styles.css                   # Global styling
│
├── src/                             # Source JavaScript modules
│   ├── main.js                      # Main application entry
│   ├── app.js                       # Core app functionality
│   ├── friends.js                   # Friend system (search, requests, list)
│   ├── script.js                    # Legacy/utility scripts
│   ├── firebase/
│   │   └── config.js               # Firebase configuration
│   └── pages/
│       └── signup.js               # Signup page logic
│
├── api/                             # Vercel API Routes (Serverless)
│   ├── users/
│   │   └── index.js                # User management API
│   ├── friends.js                   # Friend system API
│   ├── search-users.js             # User search API
│   ├── people.js                    # People management
│   ├── files.js                     # File operations
│   ├── simple.js                    # Simple test endpoint
│   ├── test.js                      # API testing
│   ├── mock-files.js               # Mock file data
│   └── mock-people.js              # Mock people data
│
├── lib/                             # Utility libraries
│   ├── database.js                  # Database connection utilities
│   └── prisma.js                    # Prisma client configuration
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
├── public/                          # Static public assets
│   └── test.js                     # Public test scripts
│
└── dist/                            # Built/compiled files (auto-generated)
    ├── index.html                  # Built landing page
    ├── app.html                    # Built app page
    ├── signup.html                 # Built signup page
    ├── notif.html                  # Built notifications page
    └── assets/                     # Compiled CSS/JS assets
```