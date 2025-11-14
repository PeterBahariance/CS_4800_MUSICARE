# Getting Started Guide

**Project**: Musicare - Music for Health & Wellness
**Status**: Phase 7 - Setup & Troubleshooting Documentation
**Date**: November 13, 2025

---

## Overview

Complete setup guide for new developers joining the Musicare project. This guide will get you from zero to running the full application locally in under 30 minutes.

---

## Prerequisites

### Required Software
- **Node.js**: v20.x or higher ([Download](https://nodejs.org/))
- **npm**: v10.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **PostgreSQL**: v14+ ([Download](https://postgresql.org/)) OR use hosted database
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "Prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## Quick Start (5 Minutes)

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd CS_4800_MUSICARE

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your values
nano .env
```

**Required Environment Variables**:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/musicare_db"

# Firebase Configuration
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef123456"

# External APIs
JAMENDO_CLIENT_ID="your-jamendo-client-id"

# Development
NODE_ENV="development"
```

### 3. Database Setup
```bash
# Run database migrations
npx prisma migrate dev

# Seed database with sample data (optional)
npx prisma db seed
```

### 4. Start Development Servers
```bash
# Terminal 1: Start Vite frontend server
npm run dev

# Terminal 2: Start Express backend server
npm run dev:express
```

### 5. Verify Installation
- **Frontend**: Open http://localhost:5173
- **Backend**: Test http://localhost:3000/api/users
- **Database**: Check connection with `npx prisma studio`

---

## Detailed Setup Instructions

### Database Configuration

#### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql
brew services start postgresql

# Create database
createdb musicare_db

# Create user (optional)
psql -d musicare_db
CREATE USER musicare_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE musicare_db TO musicare_user;
```

#### Option 2: Hosted Database (Recommended)
1. **Supabase** (Free tier available):
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy connection string to `DATABASE_URL`

2. **Railway** (Free tier available):
   - Go to [railway.app](https://railway.app)
   - Create PostgreSQL service
   - Copy connection string to `DATABASE_URL`

### Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create a project"
   - Enable Authentication with Email/Password

2. **Get Configuration**:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy configuration values to `.env`

3. **Configure Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Add authorized domains (localhost, your-domain.com)

### External API Setup

#### Jamendo Music API
1. Go to [Jamendo Developer](https://developer.jamendo.com)
2. Create account and get Client ID
3. Add `JAMENDO_CLIENT_ID` to `.env`

---

## Project Structure Overview

```
CS_4800_MUSICARE/
├── frontend/                 # Frontend source code
│   ├── src/
│   │   ├── auth/            # Authentication modules
│   │   ├── features/        # Feature-specific components
│   │   └── config/          # Configuration files
│   ├── pages/               # HTML pages
│   └── styles/              # CSS stylesheets
├── backend/                 # Backend API
│   ├── api/                 # Vercel serverless functions
│   ├── lib/                 # Shared utilities
│   └── scripts/             # Development scripts
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── documentation/           # Project documentation
│   ├── architecture/        # Architecture docs
│   ├── workflows/           # Feature workflows
│   └── setup/              # Setup guides
└── src/                    # Legacy source (being migrated)
```

---

## Development Workflow

### Daily Development Process

1. **Start Development**:
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Install any new dependencies
   npm install
   
   # Start both servers
   npm run dev        # Terminal 1 (Frontend)
   npm run dev:express # Terminal 2 (Backend)
   ```

2. **Make Changes**:
   - Frontend changes: Edit files in `frontend/src/`
   - Backend changes: Edit files in `backend/api/`
   - Database changes: Update `prisma/schema.prisma`

3. **Test Changes**:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000/api/
   - Database: `npx prisma studio`

4. **Database Changes**:
   ```bash
   # After modifying schema.prisma
   npx prisma migrate dev --name describe_your_change
   npx prisma generate
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

---

## Common Commands

### Development
```bash
npm run dev              # Start Vite frontend server
npm run dev:express      # Start Express backend server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Database
```bash
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run migrations
npx prisma studio      # Open database GUI
npx prisma db push     # Push schema changes (dev only)
npx prisma db seed     # Seed database with sample data
```

### Debugging
```bash
npm run lint           # Check code quality (if configured)
npm run type-check     # Type checking (if configured)
npm run test          # Run tests (if configured)
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] **Frontend loads**: http://localhost:5173 shows login page
- [ ] **Backend responds**: http://localhost:3000/api/users returns JSON
- [ ] **Database connected**: `npx prisma studio` opens successfully
- [ ] **Authentication works**: Can create account and login
- [ ] **Music player loads**: Playlists appear in app interface
- [ ] **Friend system works**: Can search for users
- [ ] **No console errors**: Browser console is clean
- [ ] **Hot reload works**: Changes appear immediately

---

## Next Steps

1. **Read Architecture Docs**: `documentation/architecture/`
2. **Study Workflow Docs**: `documentation/workflows/`
3. **Review Master Script**: `documentation/architecture/MASTER_SCRIPT.md`
4. **Join Development**: Follow patterns in existing code
5. **Ask Questions**: Use team communication channels

---

## Getting Help

### Documentation Resources
- **Master Script**: `documentation/architecture/MASTER_SCRIPT.md`
- **Troubleshooting**: `documentation/setup/TROUBLESHOOTING.md`
- **Development Workflow**: `documentation/setup/DEVELOPMENT_WORKFLOW.md`

### Common Issues
- **Port conflicts**: Change ports in `vite.config.js` and `backend/scripts/dev-server.js`
- **Database connection**: Check `DATABASE_URL` format and credentials
- **Firebase errors**: Verify all config values in `.env`
- **Module not found**: Run `npm install` and `npx prisma generate`

### Support Channels
- **GitHub Issues**: For bugs and feature requests
- **Team Chat**: For quick questions
- **Code Reviews**: For implementation guidance
