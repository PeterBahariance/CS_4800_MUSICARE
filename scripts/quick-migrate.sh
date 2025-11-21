#!/bin/bash

# Quick Database Migration Script
# This script automates the database migration process

set -e  # Exit on error

echo "🔄 Musicare Database Migration Tool"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    exit 1
fi

# Load environment variables
source .env.local

# Check if OLD_DATABASE_URL is set
if [ -z "$OLD_DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  OLD_DATABASE_URL not set, using DATABASE_URL${NC}"
    OLD_DATABASE_URL=$DATABASE_URL
fi

# Check if NEW_DATABASE_URL is set
if [ -z "$NEW_DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: NEW_DATABASE_URL not set in .env.local${NC}"
    echo "Please add: NEW_DATABASE_URL=\"your-new-database-url\""
    exit 1
fi

echo "📦 Step 1: Creating backup..."
BACKUP_FILE="musicare_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$OLD_DATABASE_URL" > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}❌ Failed to create backup${NC}"
    exit 1
fi

echo ""
echo "🔧 Step 2: Pushing schema to new database..."
DATABASE_URL=$NEW_DATABASE_URL npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema pushed successfully${NC}"
else
    echo -e "${RED}❌ Failed to push schema${NC}"
    exit 1
fi

echo ""
echo "📥 Step 3: Importing data..."
psql "$NEW_DATABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data imported successfully${NC}"
else
    echo -e "${RED}❌ Failed to import data${NC}"
    exit 1
fi

echo ""
echo "🔍 Step 4: Verifying migration..."
echo "Opening Prisma Studio to verify data..."
DATABASE_URL=$NEW_DATABASE_URL npx prisma studio &

echo ""
echo -e "${GREEN}✅ Migration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify data in Prisma Studio (should open automatically)"
echo "2. Update DATABASE_URL in .env.local to use NEW_DATABASE_URL"
echo "3. Update DATABASE_URL in Vercel environment variables"
echo "4. Test your application locally: npm run dev"
echo "5. Deploy to Vercel"
echo ""
echo "Backup saved to: $BACKUP_FILE"
echo "Keep this file safe for at least 30 days!"

