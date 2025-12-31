# Creating Database - Authentication Fix

## Problem
You're getting a password authentication error when trying to create the database.

## Solutions

### Option 1: Use PostgreSQL superuser (postgres)

Try using the `postgres` user instead:

```powershell
# Windows PowerShell
createdb -U postgres chemical_erp
```

You'll be prompted for the postgres user password (usually set during PostgreSQL installation).

### Option 2: Use psql to create database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Then run SQL command
CREATE DATABASE chemical_erp;

# Exit psql
\q
```

### Option 3: Set PGPASSWORD environment variable

```powershell
# Set password for current session
$env:PGPASSWORD = "your_postgres_password"
createdb -U postgres chemical_erp
```

### Option 4: Use pgAdmin (GUI)

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name it: `chemical_erp`
5. Click "Save"

## After Creating Database

Once the database is created, update your `.env` file:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/chemical_erp?schema=public
```

Replace `your_password` with your actual PostgreSQL password.

## Next Steps

1. Generate Prisma Client:
   ```powershell
   npm run generate
   ```

2. Run migrations:
   ```powershell
   npm run migrate
   ```

