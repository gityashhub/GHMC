# Database Reset Guide

## Steps to Change Database Name

### 1. Drop the Existing Database

```bash
# Connect to PostgreSQL and drop the database
psql -U postgres -c "DROP DATABASE IF EXISTS chemwaste_db;"
```

Or if you're already connected to PostgreSQL:
```sql
DROP DATABASE IF EXISTS chemwaste_db;
```

### 2. Update Environment Variables

Edit your `.env` file and change the database name in `DATABASE_URL`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/YOUR_NEW_DB_NAME?schema=public
```

Replace `YOUR_NEW_DB_NAME` with your desired database name.

### 3. Create New Database

```bash
createdb YOUR_NEW_DB_NAME
```

Or using PostgreSQL:
```sql
CREATE DATABASE YOUR_NEW_DB_NAME;
```

### 4. Reset Prisma Migrations (Optional)

If you want to start fresh with migrations:

```bash
# Delete existing migrations folder
rm -rf prisma/migrations

# Create new initial migration
npm run migrate
```

### 5. Generate Prisma Client

```bash
npm run generate
```

### 6. Run Migrations

```bash
npm run migrate
```

## Quick Reset Script

If you want to do everything at once (replace `YOUR_NEW_DB_NAME`):

```bash
# Drop old database
psql -U postgres -c "DROP DATABASE IF EXISTS chemwaste_db;"

# Create new database
createdb YOUR_NEW_DB_NAME

# Update .env file (manually edit)
# DATABASE_URL=postgresql://user:password@localhost:5432/YOUR_NEW_DB_NAME?schema=public

# Reset migrations and regenerate
rm -rf prisma/migrations
npm run generate
npm run migrate
```

