#!/bin/bash
# Database Reset Script for Linux/Mac
# Usage: ./reset-database.sh your_new_db_name

if [ -z "$1" ]; then
    echo "❌ Error: Please provide the new database name"
    echo "Usage: ./reset-database.sh your_new_db_name"
    exit 1
fi

NEW_DB_NAME=$1
OLD_DB_NAME="chemwaste_db"
POSTGRES_USER=${POSTGRES_USER:-postgres}

echo "🔄 Database Reset Script"
echo ""

# Step 1: Drop old database
echo "Step 1: Dropping old database '$OLD_DB_NAME'..."
psql -U $POSTGRES_USER -c "DROP DATABASE IF EXISTS $OLD_DB_NAME;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Old database dropped successfully"
else
    echo "⚠️  Warning: Could not drop old database (might not exist)"
fi

echo ""

# Step 2: Create new database
echo "Step 2: Creating new database '$NEW_DB_NAME'..."
createdb -U $POSTGRES_USER $NEW_DB_NAME
if [ $? -eq 0 ]; then
    echo "✅ New database '$NEW_DB_NAME' created successfully"
else
    echo "❌ Error creating database"
    exit 1
fi

echo ""

# Step 3: Update .env file
echo "Step 3: Updating .env file..."
if [ -f ".env" ]; then
    sed -i.bak "s/$OLD_DB_NAME/$NEW_DB_NAME/g" .env
    echo "✅ .env file updated with new database name"
    rm -f .env.bak
else
    echo "⚠️  .env file not found. Please create it from .env.example"
    echo "   Make sure to set: DATABASE_URL=postgresql://user:password@localhost:5432/$NEW_DB_NAME?schema=public"
fi

echo ""

# Step 4: Remove migrations if they exist
echo "Step 4: Cleaning up migrations..."
if [ -d "prisma/migrations" ]; then
    rm -rf prisma/migrations
    echo "✅ Old migrations removed"
else
    echo "ℹ️  No migrations folder found (this is fine)"
fi

echo ""

# Step 5: Instructions
echo "📋 Next Steps:"
echo "1. Make sure your .env file has the correct DATABASE_URL:"
echo "   DATABASE_URL=postgresql://user:password@localhost:5432/$NEW_DB_NAME?schema=public"
echo ""
echo "2. Generate Prisma Client:"
echo "   npm run generate"
echo ""
echo "3. Run migrations:"
echo "   npm run migrate"
echo ""

