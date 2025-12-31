# Setup Guide - Phase 1

## Prerequisites

Before starting, ensure you have:
- Node.js v18 or higher installed
- PostgreSQL 14 or higher installed and running
- npm or yarn package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create PostgreSQL Database

```bash
# Using psql command line
createdb chemwaste_db

# Or using PostgreSQL client
# CREATE DATABASE chemwaste_db;
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/chemwaste_db?schema=public

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**Important**: Replace `username` and `password` with your PostgreSQL credentials.

### 4. Generate Prisma Client

```bash
npm run generate
```

This will generate the Prisma Client based on the schema.

### 5. Run Database Migrations

```bash
npm run migrate
```

This will:
- Create all tables in your database
- Set up relationships and indexes
- Create the database schema

### 6. Start the Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3000`

### 7. Verify Setup

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api
```

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-..."
}
```

## Troubleshooting

### Database Connection Error

If you see a database connection error:
1. Verify PostgreSQL is running: `pg_isready`
2. Check your DATABASE_URL in `.env`
3. Verify database exists: `psql -l | grep chemwaste_db`
4. Check PostgreSQL user permissions

### Prisma Client Not Generated

If you see "PrismaClient is not generated":
```bash
npm run generate
```

### Port Already in Use

If port 3000 is already in use:
1. Change PORT in `.env` file
2. Or stop the process using port 3000

## Next Steps

Once Phase 1 is complete:
- ✅ Project structure created
- ✅ Express.js configured
- ✅ Database schema created
- ✅ Error handling setup
- ✅ Server running

Proceed to **Phase 2: Authentication** to implement user registration and login.

## Useful Commands

```bash
# Development
npm run dev              # Start development server with watch mode

# Database
npm run migrate         # Run database migrations
npm run generate        # Generate Prisma Client
npm run studio          # Open Prisma Studio (database GUI)

# Production
npm start               # Start production server
npm run migrate:deploy  # Deploy migrations (production)
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── utils/          # Utility functions
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── .env                # Environment variables (create this)
├── .env.example        # Environment variables template
└── package.json
```

