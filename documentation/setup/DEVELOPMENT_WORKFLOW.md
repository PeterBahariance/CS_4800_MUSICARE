# Development Workflow Guide

**Project**: Musicare - Music for Health & Wellness
**Status**: Phase 7 - Setup & Troubleshooting Documentation
**Date**: November 13, 2025

---

## Overview

Comprehensive guide for daily development workflow, best practices, and team collaboration processes for the Musicare project.

---

## Daily Development Routine

### Morning Startup (5 minutes)

```bash
# 1. Pull latest changes
git pull origin main

# 2. Check for dependency updates
npm install

# 3. Update database schema if needed
npx prisma generate

# 4. Start development servers
npm run dev        # Terminal 1: Frontend (port 5173)
npm run dev:express # Terminal 2: Backend (port 3000)

# 5. Verify everything works
open http://localhost:5173
```

### Development Environment Check

**Before starting work, verify**:
- [ ] Frontend server running on http://localhost:5173
- [ ] Backend server running on http://localhost:3000
- [ ] Database accessible via `npx prisma studio`
- [ ] No console errors in browser
- [ ] Authentication working (can login/signup)

---

## Feature Development Process

### 1. Planning Phase

**Before writing code**:
```markdown
## Feature: [Feature Name]

### Requirements
- [ ] User story defined
- [ ] Database changes identified
- [ ] API endpoints planned
- [ ] UI/UX mockups ready

### Technical Planning
- [ ] Does it need authentication? (Most features do)
- [ ] Database schema changes required?
- [ ] New API endpoints needed?
- [ ] Frontend components needed?
- [ ] External API integrations?
```

### 2. Implementation Workflow

**Step-by-step process**:

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Database changes first (if needed)
# Edit prisma/schema.prisma
npx prisma migrate dev --name add_your_feature
npx prisma generate

# 3. Backend implementation
# Create/edit files in backend/api/
# Follow existing patterns from CORE_PATTERNS.md

# 4. Frontend implementation
# Create/edit files in frontend/src/
# Follow component patterns

# 5. Test implementation
# Manual testing with different user states
# Check browser console for errors
# Test API endpoints directly

# 6. Commit and push
git add .
git commit -m "feat: implement your feature"
git push origin feature/your-feature-name
```

### 3. Code Review Process

**Before submitting PR**:
- [ ] Code follows existing patterns
- [ ] Error handling implemented
- [ ] Logging includes emoji prefixes
- [ ] User-friendly error messages
- [ ] No hardcoded values
- [ ] Database operations use Prisma patterns
- [ ] API endpoints have CORS headers
- [ ] Frontend has defensive DOM checking

---

## Development Standards

### Code Quality Standards

**Logging Standards**:
```javascript
// ✅ Good: Emoji prefixes for easy filtering
console.log('🎵 Music Player: Starting initialization...');
console.log('🔍 FriendSystem: Auth state changed');
console.error('🚨 API Error: Failed to load playlists');

// ❌ Bad: Generic logging
console.log('Starting...');
console.error('Error occurred');
```

**Error Handling Standards**:
```javascript
// ✅ Good: Comprehensive error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('🚨 Feature: Operation failed:', error);
  this.showUserError('Something went wrong. Please try again.');
  throw error; // Re-throw for upstream handling
}

// ❌ Bad: Silent failures
try {
  const result = await apiCall();
} catch (error) {
  // Silent failure - user doesn't know what happened
}
```

**API Response Standards**:
```javascript
// ✅ Good: Consistent response format
return res.status(200).json({
  success: true,
  data: result,
  timestamp: new Date().toISOString()
});

// Error responses
return res.status(400).json({
  error: 'User-friendly message',
  details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  timestamp: new Date().toISOString()
});
```

### File Organization Standards

**Frontend Structure**:
```
frontend/src/
├── auth/           # Authentication modules
├── features/       # Feature-specific components
│   ├── music/      # Music player components
│   ├── friends/    # Friend system components
│   └── profile/    # Profile management
├── config/         # Configuration files
└── utils/          # Shared utilities
```

**Backend Structure**:
```
backend/
├── api/            # Vercel serverless functions
│   ├── users/      # User management endpoints
│   ├── playlists/  # Playlist endpoints
│   └── friends/    # Friend system endpoints
├── lib/            # Shared utilities
│   └── prisma.js   # Database client
└── scripts/        # Development scripts
```

---

## Testing Workflow

### Manual Testing Checklist

**For every feature**:
- [ ] **Unauthenticated state**: Feature handles no user gracefully
- [ ] **Authenticated state**: Feature works with logged-in user
- [ ] **Error scenarios**: Network failures, invalid data, etc.
- [ ] **Edge cases**: Empty data, maximum limits, special characters
- [ ] **Cross-browser**: Test in Chrome, Firefox, Safari
- [ ] **Mobile responsive**: Test on mobile viewport

### API Testing

**Using built-in API tester**:
1. Open app → Database Demo → API Tester
2. Select endpoint and method
3. Add parameters/body as needed
4. Send request and verify response
5. Test error scenarios (invalid data, missing auth, etc.)

**Manual API testing**:
```bash
# Test user creation
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser"}'

# Test playlist retrieval
curl http://localhost:3000/api/playlists

# Test friend search
curl "http://localhost:3000/api/search-users?query=test&currentUserId=123"
```

---

## Database Development

### Schema Changes Workflow

```bash
# 1. Edit prisma/schema.prisma
# Add/modify models, fields, relations

# 2. Create migration
npx prisma migrate dev --name describe_your_change

# 3. Generate new client
npx prisma generate

# 4. Update code to use new schema
# Update API endpoints, frontend components

# 5. Test changes
npx prisma studio  # Verify schema in GUI
```

### Database Best Practices

**Model Naming**:
```prisma
// ✅ Good: Descriptive names with proper mapping
model User {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("users")
}

// ❌ Bad: Inconsistent naming
model user {
  id String @id
  created DateTime
}
```

**Relationships**:
```prisma
// ✅ Good: Clear relationship names
model User {
  sentFriendRequests FriendRequest[] @relation("SentFriendRequests")
  receivedFriendRequests FriendRequest[] @relation("ReceivedFriendRequests")
}

// ❌ Bad: Ambiguous relationships
model User {
  friendRequests FriendRequest[]
}
```

---

## Debugging Workflow

### Frontend Debugging

**Browser Console**:
1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Look for emoji-prefixed logs: 🎵, 🔍, 🚨
4. Check Network tab for failed API calls

**Common Frontend Issues**:
```javascript
// Issue: Module not loading
// Solution: Check import paths and Vite config

// Issue: Component not initializing
// Solution: Check DOM ready state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Issue: API calls failing
// Solution: Check CORS and endpoint URLs
```

### Backend Debugging

**Server Logs**:
```bash
# Check Express server logs
npm run dev:express

# Check Vercel function logs (in production)
# Go to Vercel dashboard → Functions tab
```

**Common Backend Issues**:
```javascript
// Issue: Database connection failed
// Solution: Check DATABASE_URL and Prisma client
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');

// Issue: CORS errors
// Solution: Ensure all API routes have CORS headers
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
```

---

## Deployment Workflow

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] No console errors in production build
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] External API keys working
- [ ] CORS configured for production domain

### Deployment Process

```bash
# 1. Build and test locally
npm run build
npm run preview

# 2. Commit and push
git add .
git commit -m "feat: ready for deployment"
git push origin main

# 3. Vercel auto-deploys from main branch
# 4. Verify deployment at production URL
# 5. Check Vercel function logs for errors
```

---

## Team Collaboration

### Git Workflow

**Branch Naming**:
- `feature/user-authentication` - New features
- `fix/music-player-bug` - Bug fixes
- `docs/api-documentation` - Documentation
- `refactor/database-schema` - Code refactoring

**Commit Messages**:
```bash
# ✅ Good: Descriptive commits
git commit -m "feat: add friend search with debounced input"
git commit -m "fix: resolve music player initialization in production"
git commit -m "docs: update API endpoint documentation"

# ❌ Bad: Vague commits
git commit -m "updates"
git commit -m "fix bug"
git commit -m "changes"
```

### Code Review Guidelines

**What to look for**:
- [ ] Code follows project patterns
- [ ] Error handling is comprehensive
- [ ] User experience is considered
- [ ] Security best practices followed
- [ ] Performance implications considered
- [ ] Documentation updated if needed

---

## Performance Optimization

### Frontend Performance

- **Bundle size**: Check with `npm run build`
- **Image optimization**: Use appropriate formats and sizes
- **Code splitting**: Consider lazy loading for large features
- **Caching**: Leverage browser caching for static assets

### Backend Performance

- **Database queries**: Use Prisma select to limit fields
- **API response time**: Monitor with built-in timing logs
- **Caching**: Consider Redis for frequently accessed data
- **Rate limiting**: Implement for public endpoints

---

## Maintenance Tasks

### Weekly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Review and clean up old branches
- [ ] Monitor application performance
- [ ] Review error logs and fix issues

### Monthly Tasks

- [ ] Database maintenance and optimization
- [ ] Review and update documentation
- [ ] Performance analysis and optimization
- [ ] Security review and updates
- [ ] Backup verification
