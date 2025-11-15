# Troubleshooting Guide

**Project**: Musicare - Music for Health & Wellness
**Status**: Phase 7 - Setup & Troubleshooting Documentation
**Date**: November 13, 2025

---

## Overview

Comprehensive troubleshooting guide for common issues encountered during development and deployment of the Musicare application.

---

## Quick Diagnosis

### System Health Check

Run these commands to quickly identify issues:

```bash
# Check Node.js version
node --version  # Should be v20.x+

# Check npm version
npm --version   # Should be v10.x+

# Check if servers are running
curl http://localhost:5173  # Frontend
curl http://localhost:3000/api/users  # Backend

# Check database connection
npx prisma studio  # Should open without errors

# Check environment variables
echo $DATABASE_URL  # Should not be empty
```

### Common Symptoms & Quick Fixes

| Symptom | Quick Fix |
|---------|-----------|
| "Module not found" | `npm install && npx prisma generate` |
| "Port already in use" | `lsof -ti:5173 \| xargs kill -9` |
| "Database connection failed" | Check `DATABASE_URL` in `.env` |
| "Firebase config undefined" | Verify all `VITE_FIREBASE_*` variables |
| "CORS error" | Ensure Express server is running |

---

## Frontend Issues

### 1. Module Loading Problems

**Symptom**: "Module not found" or components not loading

**Diagnosis**:
```javascript
// Check browser console for import errors
// Look for 404 errors in Network tab
```

**Solutions**:
```bash
# Solution 1: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Solution 2: Regenerate Prisma client
npx prisma generate

# Solution 3: Check import paths
# Ensure imports use correct relative paths
import { auth } from '../config/firebase.js';  # ✅ Correct
import { auth } from 'config/firebase.js';     # ❌ Wrong
```

### 2. Authentication Issues

**Symptom**: Login/signup not working, Firebase errors

**Diagnosis**:
```javascript
// Check browser console for Firebase errors
console.log('Firebase config:', firebaseConfig);
console.log('Auth object:', auth);
```

**Solutions**:
```bash
# Solution 1: Verify environment variables
cat .env | grep FIREBASE
# All VITE_FIREBASE_* variables should be present

# Solution 2: Check Firebase project settings
# Go to Firebase Console → Project Settings → General
# Verify all config values match your .env

# Solution 3: Check authorized domains
# Firebase Console → Authentication → Settings → Authorized domains
# Add localhost and your domain
```

**Common Firebase Errors**:
```javascript
// Error: "Firebase config object is invalid"
// Fix: Check all VITE_FIREBASE_* variables are set

// Error: "auth/invalid-api-key"
// Fix: Verify VITE_FIREBASE_API_KEY is correct

// Error: "auth/unauthorized-domain"
// Fix: Add domain to Firebase authorized domains
```

### 3. Music Player Issues

**Symptom**: Music player not loading or playing

**Diagnosis**:
```javascript
// Check console for music player logs
// Look for 🎵 prefixed messages
console.log('Music player initialized:', !!window.musicPlayer);
```

**Solutions**:
```javascript
// Solution 1: Check module import
// Ensure music-player.js is imported in main app
import './music-player.js';  // In src/app.js

// Solution 2: Check DOM ready state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMusicPlayer);
} else {
    initializeMusicPlayer();
}

// Solution 3: Check API endpoint
fetch('/api/playlists')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => console.log('Playlists loaded:', data))
    .catch(error => console.error('Playlist load failed:', error));
```

### 4. Friend System Issues

**Symptom**: Friend search not working, requests failing

**Diagnosis**:
```javascript
// Check for 🔍 prefixed logs in console
console.log('Current user:', friendSystem.currentUser);
console.log('Search timeout:', friendSystem.searchTimeout);
```

**Solutions**:
```javascript
// Solution 1: Check authentication
if (!this.currentUser) {
    console.error('No current user - friend system disabled');
    return;
}

// Solution 2: Check API endpoints
// Test search endpoint manually
fetch('/api/search-users?query=test&currentUserId=123')
    .then(response => response.json())
    .then(data => console.log('Search results:', data));

// Solution 3: Check debouncing
// Ensure search timeout is working
this.searchTimeout = setTimeout(async () => {
    await this.performSearch(query.trim());
}, 300);
```

---

## Backend Issues

### 1. Server Not Starting

**Symptom**: Express server won't start or crashes

**Diagnosis**:
```bash
# Check for port conflicts
lsof -i :3000

# Check for syntax errors
node backend/scripts/dev-server.js
```

**Solutions**:
```bash
# Solution 1: Kill conflicting processes
lsof -ti:3000 | xargs kill -9

# Solution 2: Change port
# Edit backend/scripts/dev-server.js
const PORT = process.env.PORT || 3001;  # Use different port

# Solution 3: Check dependencies
npm install express cors dotenv
```

### 2. Database Connection Issues

**Symptom**: "Database connection failed" or Prisma errors

**Diagnosis**:
```bash
# Test database connection
npx prisma db pull

# Check environment variable
echo $DATABASE_URL
```

**Solutions**:
```bash
# Solution 1: Fix DATABASE_URL format
# Correct format:
DATABASE_URL="postgresql://username:password@host:port/database"

# Solution 2: Test connection manually
psql $DATABASE_URL -c "SELECT 1;"

# Solution 3: Regenerate Prisma client
npx prisma generate

# Solution 4: Reset database (CAUTION: Deletes data)
npx prisma migrate reset
```

**Common Database Errors**:
```bash
# Error: "Environment variable not found: DATABASE_URL"
# Fix: Add DATABASE_URL to .env file

# Error: "Can't reach database server"
# Fix: Check database host and port

# Error: "Authentication failed"
# Fix: Verify username and password in DATABASE_URL
```

### 3. API Endpoint Issues

**Symptom**: API calls returning 404, 500, or CORS errors

**Diagnosis**:
```bash
# Test API endpoints directly
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
```

**Solutions**:
```javascript
// Solution 1: Add CORS headers to all endpoints
export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Your endpoint logic here
}

// Solution 2: Check file structure
// Ensure API files are in correct locations:
// backend/api/users/index.js → /api/users
// backend/api/playlists.js → /api/playlists

// Solution 3: Add error handling
try {
    const result = await prisma.user.findMany();
    return res.status(200).json({ users: result });
} catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}
```

---

## Production Issues

### 1. Vercel Deployment Problems

**Symptom**: Build fails or functions don't work in production

**Diagnosis**:
```bash
# Check build locally
npm run build

# Check Vercel logs
# Go to Vercel dashboard → Functions → View logs
```

**Solutions**:
```bash
# Solution 1: Check environment variables
# Vercel dashboard → Settings → Environment Variables
# Ensure all variables from .env are added

# Solution 2: Check build output
npm run build
# Look for errors in build process

# Solution 3: Check function file structure
# Ensure API files are in /api/ directory for Vercel
# Move backend/api/* to api/*
```

### 2. Environment Variable Issues

**Symptom**: Config undefined in production

**Solutions**:
```bash
# Solution 1: Add to Vercel environment variables
# All VITE_* variables must be added to Vercel dashboard

# Solution 2: Check variable names
# Frontend: Must start with VITE_
# Backend: Can be any name

# Solution 3: Redeploy after adding variables
# Environment changes require redeployment
```

### 3. Database Issues in Production

**Symptom**: Database operations fail in production

**Solutions**:
```bash
# Solution 1: Run migrations in production
npx prisma migrate deploy

# Solution 2: Check production DATABASE_URL
# Ensure it points to production database

# Solution 3: Check connection limits
# Production databases often have connection limits
# Use connection pooling if needed
```

---

## Performance Issues

### 1. Slow Loading Times

**Diagnosis**:
```bash
# Check bundle size
npm run build
# Look for large chunks in dist/

# Check network requests
# Browser DevTools → Network tab
```

**Solutions**:
```javascript
// Solution 1: Code splitting
const MusicPlayer = lazy(() => import('./music-player.js'));

// Solution 2: Optimize images
// Use appropriate formats (WebP, AVIF)
// Compress images before uploading

// Solution 3: Remove unused dependencies
npm uninstall unused-package
```

### 2. Memory Leaks

**Diagnosis**:
```javascript
// Check for event listeners not being removed
// Check for intervals not being cleared
// Monitor memory usage in DevTools
```

**Solutions**:
```javascript
// Solution 1: Clean up event listeners
componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
    clearTimeout(this.searchTimeout);
}

// Solution 2: Clear intervals and timeouts
clearInterval(this.updateInterval);
clearTimeout(this.debounceTimeout);
```

---

## Emergency Recovery

### 1. Complete Reset

**When everything is broken**:
```bash
# Nuclear option - complete reset
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npx prisma migrate reset  # CAUTION: Deletes all data
npm run dev
```

### 2. Rollback to Working State

```bash
# Find last working commit
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>

# Or create new branch from working commit
git checkout -b hotfix/rollback <commit-hash>
```

### 3. Database Recovery

```bash
# If database is corrupted
npx prisma migrate reset
npx prisma db seed  # If seed file exists

# Or restore from backup
psql $DATABASE_URL < backup.sql
```

---

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Search existing issues** in project repository
3. **Check browser console** for error messages
4. **Test with minimal reproduction** case
5. **Gather relevant information**:
   - Error messages (full stack trace)
   - Browser and version
   - Node.js version
   - Steps to reproduce
   - Expected vs actual behavior

### Information to Include

```markdown
## Bug Report Template

### Environment
- OS: [macOS/Windows/Linux]
- Node.js version: [run `node --version`]
- Browser: [Chrome/Firefox/Safari + version]
- Database: [PostgreSQL version]

### Issue Description
[Clear description of the problem]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Error Messages
```
[Paste full error messages here]
```

### Additional Context
[Any other relevant information]
```

### Support Channels

- **GitHub Issues**: For bugs and feature requests
- **Team Chat**: For quick questions
- **Code Reviews**: For implementation guidance
- **Documentation**: Check all docs in `documentation/` folder
