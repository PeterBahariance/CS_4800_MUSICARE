# `/api` - Vercel Serverless Function Endpoints

## ⚠️ Important: This Directory is Required by Vercel

This directory **must** be named `/api` and located at the project root for Vercel to recognize and deploy these as serverless functions.

## 📋 Purpose

This directory contains **thin wrapper files** that Vercel uses to create HTTP endpoints. Each file here becomes a serverless function endpoint.

## 🔄 How It Works

```
HTTP Request to /api/friends
    ↓
/api/friends.js (this directory - Vercel wrapper)
    ↓
imports and exports
    ↓
/backend/express-handlers/friends.js (actual business logic)
    ↓
Response
```

## 📁 File Structure

Each file in this directory should:
1. Import the handler from `/backend/express-handlers/`
2. Export it as the default export
3. Do **nothing else** (no business logic here!)

## ✅ Correct Pattern

```javascript
// api/friends.js
import handler from '../backend/express-handlers/friends.js';
export default handler;
```

## ❌ Incorrect Pattern

```javascript
// api/friends.js - DON'T DO THIS!
export default async function handler(req, res) {
  // Business logic should NOT be here
  // It should be in /backend/express-handlers/
}
```

## 🎯 Key Points

- **This is routing only** - No business logic here
- **Vercel requirement** - Must be named `/api` at project root
- **Thin wrappers** - Just import and export from `/backend`
- **Actual logic** - Lives in `/backend/express-handlers/`

## 📚 Related Directories

- `/backend/express-handlers/` - Actual API implementation
- `/backend/lib/` - Database utilities and helpers
- `/backend/scripts/` - Helper scripts

## 🔧 Adding a New Endpoint

1. Create handler in `/backend/express-handlers/my-endpoint.js`
2. Create wrapper in `/api/my-endpoint.js`
3. Import and export the handler

Example:
```javascript
// backend/express-handlers/my-endpoint.js
export default async function handler(req, res) {
  // Your logic here
  res.json({ message: 'Hello!' });
}

// api/my-endpoint.js
import handler from '../backend/express-handlers/my-endpoint.js';
export default handler;
```

---

**Remember:** This directory is for Vercel routing only. All business logic goes in `/backend`!

