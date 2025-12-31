# Next Steps After Database Creation

## ✅ Database Created: `chemical_erp`

Now follow these steps:

## Step 1: Update .env File

1. Navigate to `backend` folder
2. Open or create `.env` file
3. Set the DATABASE_URL:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/chemical_erp?schema=public
```

**Important:** Replace `your_password` with the password you set for the postgres user.

## Step 2: Generate Prisma Client

```powershell
cd backend
npm run generate
```

This generates the Prisma Client based on your schema.

## Step 3: Run Database Migrations

```powershell
npm run migrate
```

This will:
- Create all tables in your database
- Set up relationships and indexes
- Create the complete database schema

You'll be prompted to name the migration (e.g., "init" or "initial_schema").

## Step 4: Verify Setup

### Check if tables were created:
```powershell
psql -U postgres -d chemical_erp -c "\dt"
```

You should see all your tables listed.

### Or use Prisma Studio (GUI):
```powershell
npm run studio
```

This opens a web interface to view your database.

## Step 5: Start the Server

```powershell
npm run dev
```

The server should start on `http://localhost:3000`

### Test the server:
- Health check: http://localhost:3000/health
- API info: http://localhost:3000/api

## Troubleshooting

### If migration fails:
- Check your DATABASE_URL in .env is correct
- Verify database exists: `psql -U postgres -l | grep chemical_erp`
- Check PostgreSQL is running: `Get-Service postgresql-x64-18`

### If Prisma Client not found:
```powershell
npm run generate
```

### If connection error:
- Verify password in DATABASE_URL matches your postgres password
- Test connection: `psql -U postgres -d chemical_erp`

## What's Next?

Once the server is running, you're ready for:
- **Phase 2: Authentication** - User registration and login
- **Phase 3: Core Entities** - Companies and Transporters CRUD

