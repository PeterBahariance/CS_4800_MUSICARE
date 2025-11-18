# Tech Stack Deep Dive

**Date**: November 13, 2025
**Status**: Phase 3 Complete

---

## Runtime Environment

### Node.js
- **Version**: 20.x (specified in package.json engines)
- **Package Manager**: npm (lockfileVersion: 3)
- **Module System**: ES Modules (`"type": "module"`)

---

## Frontend Technologies

### Build Tools
- **Vite**: v4.4.9 - Modern build tool and development server
  - **Purpose**: Frontend bundling, hot reload, development server
  - **Config**: Multi-page app with proxy to Express server
  - **Entry Points**: index.html, app.html, notif.html, signup.html
  - **Port**: 5173 (development)

### Languages & Standards
- **JavaScript**: ES6+ Modules (85% of codebase)
- **HTML5**: 4 main pages (10% of codebase)
- **CSS3**: Global styling (5% of codebase)
- **TypeScript**: Minimal usage (vite-env.d.ts for environment types)

### UI Framework
- **Framework**: None (Vanilla JavaScript)
- **Architecture**: Pure ES6 modules with DOM manipulation
- **Styling**: Custom CSS with no framework dependencies

---

## Backend Technologies

### Runtime & Framework
- **Vercel Serverless Functions**: Node.js runtime for production
- **Express**: v4.18.2 - Development server only (local development)
  - **Purpose**: Local API development and testing
  - **Port**: 3000 (development)

### API Architecture
- **Production**: Vercel serverless functions (file-based routing)
- **Development**: Express server with CORS enabled
- **Proxy**: Vite proxies `/api/*` to Express in development

---

## Database & ORM

### Database
- **PostgreSQL**: External hosted database
- **Connection**: Via `DATABASE_URL` environment variable
- **Provider**: External hosting service

### ORM
- **Prisma**: v5.6.0 - Type-safe database client
  - **Client**: @prisma/client v5.6.0
  - **Extensions**: @prisma/extension-accelerate v1.0.0
  - **Generator**: prisma-client-js
  - **Schema**: Comprehensive with Users, Playlists, Songs, Friendships

---

## Authentication & Security

### Authentication Provider
- **Firebase Authentication**: v12.4.0
  - **Core**: @firebase/app v0.14.3
  - **Auth**: @firebase/auth v1.11.0
  - **CDN Version**: 10.7.1 (used in some files)
  - **Methods**: Email/password authentication

### Security
- **CORS**: v2.8.5 - Cross-origin resource sharing
- **Environment Variables**: dotenv v17.2.3
- **Firebase Config**: Secure environment variable management

---

## Development Tools

### Build Tools
- **Vite**: v4.4.9 - Primary build tool
- **Build Command**: `prisma generate && vite build` (configured in vercel.json)

### Package Manager
- **npm**: Default package manager
- **Lock File**: package-lock.json (lockfileVersion: 3)

### Environment Management
- **dotenv**: v17.2.3 - Environment variable loading
- **dotenv-cli**: v10.0.0 - CLI environment variable management

### Linting/Formatting
- **Status**: ❌ None configured
- **ESLint**: Not present
- **Prettier**: Not present

### Testing
- **Status**: ❌ No testing framework configured
- **Unit Tests**: None
- **Integration Tests**: None
- **E2E Tests**: None
- **Manual Testing**: test-api.html for API testing

---

## Infrastructure

### Hosting
- **Frontend**: Vercel (static site generation)
- **Backend**: Vercel Serverless Functions
- **Database**: External PostgreSQL hosting

### Deployment
- **Platform**: Vercel
- **Build Command**: `prisma generate && vite build`
- **Output Directory**: `dist`
- **Auto-deploy**: On git push to main branch

### CI/CD
- **Status**: ❌ No formal CI/CD pipeline
- **Deployment**: Automatic via Vercel GitHub integration

### Monitoring
- **Status**: ❌ No monitoring tools configured
- **Error Tracking**: None
- **Analytics**: None
- **Performance Monitoring**: None

---

## External Services & APIs

### Music Service
- **Jamendo API**: Music streaming and metadata
- **Integration**: backend/lib/jamendo.js
- **Purpose**: Therapeutic music content

### Authentication
- **Firebase Auth**: User authentication and management
- **CDN**: gstatic.com for Firebase modules

### Database Hosting
- **PostgreSQL**: External hosting via DATABASE_URL
- **Connection Pooling**: Via Prisma

---

## Complete Dependency List

### Production Dependencies (9 packages)
1. **@firebase/app**: ^0.14.3 - Firebase core application
2. **@firebase/auth**: ^1.11.0 - Firebase authentication
3. **@prisma/client**: ^5.6.0 - Generated database client
4. **@prisma/extension-accelerate**: ^1.0.0 - Prisma performance extension
5. **@vercel/node**: ^3.0.0 - Vercel serverless runtime
6. **cors**: ^2.8.5 - Cross-origin resource sharing middleware
7. **dotenv**: ^17.2.3 - Environment variable loader
8. **express**: ^4.18.2 - Web framework (development only)
9. **firebase**: ^12.4.0 - Firebase SDK
10. **prisma**: ^5.6.0 - Prisma CLI and schema management

### Development Dependencies (2 packages)
1. **dotenv-cli**: ^10.0.0 - CLI for environment variables
2. **vite**: ^4.4.9 - Build tool and development server

---

## Version Analysis & Security

### Outdated Packages (npm outdated results)
| Package | Current | Latest | Status | Risk Level |
|---------|---------|---------|---------|------------|
| **@firebase/app** | 0.14.4 | 0.14.5 | Minor update | LOW |
| **@firebase/auth** | 1.11.0 | 1.11.1 | Minor update | LOW |
| **@prisma/client** | 5.22.0 | 6.19.0 | Major update | HIGH |
| **@prisma/extension-accelerate** | 1.3.0 | 2.0.2 | Major update | MEDIUM |
| **@vercel/node** | 3.2.29 | 5.5.5 | Major update | HIGH |
| **dotenv-cli** | 10.0.0 | 11.0.0 | Major update | LOW |
| **express** | 4.21.2 | 5.1.0 | Major update | HIGH |
| **firebase** | 12.4.0 | 12.5.0 | Minor update | LOW |
| **prisma** | 5.22.0 | 6.19.0 | Major update | HIGH |
| **vite** | 4.5.14 | 7.2.2 | Major update | HIGH |

### Critical Version Issues
- **Prisma v5 → v6**: Major breaking changes in API
- **Vite v4 → v7**: Significant build system changes
- **Express v4 → v5**: Breaking changes in middleware
- **@vercel/node v3 → v5**: Runtime API changes

---

## 🔧 IMPROVEMENT NEEDED

### Missing Development Tools

**Issue**: No code quality tools configured
**Current State**: No linting, formatting, or testing
**Recommendation**: Add ESLint, Prettier, and testing framework
**Priority**: HIGH
**Impact**: Code quality, maintainability, bug prevention

**Suggested Setup**:
```json
{
  "devDependencies": {
    "eslint": "^8.x",
    "prettier": "^3.x",
    "vitest": "^1.x",
    "@testing-library/dom": "^9.x"
  }
}
```

### Version Management Issues

**Issue**: Multiple major version updates pending
**Current State**: Several packages 2-3 major versions behind
**Recommendation**: Gradual update strategy with testing
**Priority**: MEDIUM
**Risk**: Security vulnerabilities, missing features

**Update Strategy**:
1. Update minor versions first (Firebase, etc.)
2. Test Prisma v6 migration in development
3. Evaluate Vite v7 compatibility
4. Consider Express v5 migration impact

### Firebase Version Inconsistency

**Issue**: Mixed Firebase versions across files
**Location**: CDN v10.7.1 vs npm v12.4.0
**Current State**: Some files use CDN imports, others use npm
**Recommendation**: Standardize on npm packages
**Priority**: MEDIUM
**Files Affected**: src/main.js, frontend/pages/app.html

### Missing Security Tools

**Issue**: No security scanning or vulnerability checking
**Current State**: No automated security checks
**Recommendation**: Add npm audit, Snyk, or similar
**Priority**: HIGH
**Security Risk**: Undetected vulnerabilities

### Database Connection Security

**Issue**: Direct database access in API routes
**Current State**: Prisma client used directly in serverless functions
**Recommendation**: Add connection pooling and query validation
**Priority**: MEDIUM
**Security Risk**: Potential SQL injection, connection exhaustion

### Build Process ✅ RESOLVED

**Previous Issue**: Multiple build scripts with duplicate logic
**Resolution**: Removed custom build scripts (vercel-build.js, vercel-build.mjs)
**Current State**: Simple build command in vercel.json: `prisma generate && vite build`
**Status**: COMPLETE
**Benefit**: Simplified build process, reduced maintenance burden

---

## Technology Recommendations

### Immediate Actions (HIGH Priority)
1. **Add ESLint + Prettier** for code quality
2. **Add Vitest** for unit testing
3. **Update Firebase packages** to latest minor versions
4. **Standardize Firebase imports** (remove CDN usage)
5. **Add npm audit** to CI/CD pipeline

### Medium-term Actions (MEDIUM Priority)
1. **Evaluate Prisma v6 migration** with proper testing
2. **Consider Vite v7 upgrade** for better performance
3. **Add error monitoring** (Sentry, LogRocket)
4. **Implement API rate limiting** and validation
5. **Add database connection pooling**

### Long-term Actions (LOW Priority)
1. **Consider TypeScript migration** for better type safety
2. **Evaluate modern CSS framework** (Tailwind, etc.)
3. **Add performance monitoring** and analytics
4. **Consider micro-frontend architecture** for scalability
5. **Implement comprehensive E2E testing**
