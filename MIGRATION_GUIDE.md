# 🔄 Database Migration Guide

This guide will help you migrate your Musicare database from the old Prisma database to a new one.

---

## 📋 Prerequisites

- [ ] Access to the old database (current `DATABASE_URL`)
- [ ] New database created and ready
- [ ] Node.js and npm installed
- [ ] PostgreSQL client tools installed (for pg_dump/psql method)

---

## 🎯 Migration Options

### **Option 1: Using pg_dump (Recommended for Production)** ⭐

**Best for:** Complete data migration with all relationships intact

#### Step 1: Install PostgreSQL Tools

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Step 2: Export Current Database

```bash
# Export to SQL file
pg_dump "postgres://00b20222831925f6dbc86fb8b928e9fb4a5bac747ecfa862b9def0e0b59724f0:sk_MjgH9v7oWJD1UbnItI9J-@db.prisma.io:5432/postgres?sslmode=require" > musicare_backup.sql

# Verify the backup
ls -lh musicare_backup.sql
```

#### Step 3: Create New Database

**Option A: Vercel Postgres**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Copy the `POSTGRES_URL` (this is your new `DATABASE_URL`)

**Option B: Supabase**
1. Go to https://supabase.com/dashboard
2. Create new project
3. Go to **Settings** → **Database**
4. Copy the connection string

**Option C: Railway**
1. Go to https://railway.app/dashboard
2. Create new project → **Provision PostgreSQL**
3. Copy the `DATABASE_URL`

#### Step 4: Update Environment Variables

```bash
# In .env.local, update:
DATABASE_URL="your-new-database-url-here"
```

#### Step 5: Push Schema to New Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to new database (creates tables)
npx prisma db push
```

#### Step 6: Import Data

```bash
# Import the backup
psql "your-new-database-url-here" < musicare_backup.sql
```

#### Step 7: Verify Migration

```bash
# Open Prisma Studio
npx prisma studio

# Check that all data is present:
# - Users
# - Playlists
# - Songs
# - Friend Requests
# - Messages
# - etc.
```

---

### **Option 2: Using Migration Script** 🤖

**Best for:** Selective data migration or when pg_dump isn't available

#### Step 1: Update .env.local

```bash
# Add both database URLs
NEW_DATABASE_URL="your-new-database-url-here"
DATABASE_URL="${NEW_DATABASE_URL}"
```

#### Step 2: Push Schema to New Database

```bash
npx prisma generate
npx prisma db push
```

#### Step 3: Run Migration Script

```bash
node scripts/migrate-database.js
```

#### Step 4: Verify

```bash
npx prisma studio
```

---

### **Option 3: Manual Migration via Prisma Studio** 🎨

**Best for:** Small datasets or testing

1. Open Prisma Studio with OLD database:
   ```bash
   DATABASE_URL="old-url" npx prisma studio
   ```

2. Export data (copy/paste or use browser dev tools to export JSON)

3. Switch to NEW database:
   ```bash
   DATABASE_URL="new-url" npx prisma db push
   DATABASE_URL="new-url" npx prisma studio
   ```

4. Import data manually

---

## 🚀 Post-Migration Steps

### 1. Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Update `DATABASE_URL` with new value
4. Click **Save**
5. Redeploy: **Deployments** → **...** → **Redeploy**

### 2. Test the Application

```bash
# Local testing
npm run dev

# Test key features:
# - User login
# - Playlist loading
# - Friend requests
# - Messages
# - Song playback
```

### 3. Clean Up

```bash
# Remove old database URL from .env.local
# Keep backup file safe for 30 days
mv musicare_backup.sql ~/backups/musicare_backup_$(date +%Y%m%d).sql
```

---

## ⚠️ Troubleshooting

### Error: "relation does not exist"
**Solution:** Run `npx prisma db push` to create tables first

### Error: "duplicate key value violates unique constraint"
**Solution:** The new database already has data. Either:
- Drop all tables: `npx prisma migrate reset`
- Or use a fresh database

### Error: "password authentication failed"
**Solution:** Check your `DATABASE_URL` is correct

### Data is missing after migration
**Solution:** Check the backup file size and re-run import

---

## 📞 Need Help?

If you encounter issues, check:
1. Backup file was created successfully (`ls -lh musicare_backup.sql`)
2. New database URL is correct
3. Schema was pushed (`npx prisma db push`)
4. No errors during import

---

## ✅ Migration Checklist

- [ ] Backup created successfully
- [ ] New database created
- [ ] Schema pushed to new database
- [ ] Data imported successfully
- [ ] Verified in Prisma Studio
- [ ] Updated Vercel environment variables
- [ ] Tested application locally
- [ ] Deployed to Vercel
- [ ] Tested production deployment
- [ ] Kept backup file safe

