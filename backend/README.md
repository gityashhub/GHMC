# Backend - Chemical Waste Management ERP

## Overview
This is the backend API for the Chemical Waste Management ERP system, built with Node.js, Express.js, and PostgreSQL.

## Documentation
- **[BACKEND_PLAN.md](./BACKEND_PLAN.md)** - Complete architecture and implementation plan
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema and relationships
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API endpoints quick reference

## Quick Start

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Setup Environment Variables**
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

3. **Setup Database**
```bash
# Create database
createdb chemwaste_db

# Run migrations (when implemented)
npm run migrate
```

4. **Start Development Server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Project Status

### ✅ Planning Phase - Complete
- [x] Architecture design
- [x] Database schema design
- [x] API endpoints planning
- [x] Project structure planning

### 🚧 Implementation Phase
- [x] **Phase 1: Foundation** - Complete ✅
  - [x] Project setup
  - [x] Express.js configuration
  - [x] Database schema (Prisma)
  - [x] Error handling
  - [x] Environment configuration
- [ ] **Phase 2: Authentication** - Pending
- [ ] **Phase 3: Core Entities** - Pending
- [ ] **Phase 4: Inward/Outward Management** - Pending
- [ ] **Phase 5: Invoicing System** - Pending
- [ ] **Phase 6: Dashboard & Reporting** - Pending
- [ ] **Phase 7: Settings & Utilities** - Pending
- [ ] **Phase 8: Testing & Optimization** - Pending

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma (recommended) or Sequelize
- **Authentication**: JWT
- **Validation**: Joi or express-validator

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app
│   └── server.js        # Server entry
├── .env                 # Environment variables
├── package.json
└── README.md
```

## Key Features

- 🔐 JWT-based authentication
- 📊 Comprehensive CRUD operations
- 🔍 Advanced search and filtering
- 📈 Statistics and reporting
- 💰 Invoice generation and payment tracking
- 📄 PDF generation (planned)
- 🔔 Email notifications (planned)

## API Endpoints Summary

### Authentication
- Register, Login, Logout, Refresh Token

### Companies
- CRUD operations, Materials management, Statistics

### Transporters
- CRUD operations, Statistics

### Inward/Outward
- Entry management, Payment tracking, Statistics

### Invoices
- Invoice generation, Payment updates, PDF download

### Dashboard
- Statistics, Charts data, Recent activity

### Settings
- Application settings management

## Database Schema

### Main Entities
- Users
- Companies (with materials)
- Transporters
- Inward Entries
- Inward Materials
- Outward Entries
- Invoices
- Settings

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed schema.

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow async/await pattern
- Use meaningful variable names
- Add comments for complex logic

### Error Handling
- Use try-catch blocks
- Return consistent error responses
- Log errors appropriately

### Testing
- Write unit tests for services
- Write integration tests for API endpoints
- Maintain >80% code coverage

## Environment Variables

Required environment variables:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/chemwaste_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## Next Steps

1. Follow the [SETUP.md](./SETUP.md) guide to setup your development environment
2. Install dependencies: `npm install`
3. Configure `.env` file with your database credentials
4. Run migrations: `npm run migrate`
5. Start the server: `npm run dev`
6. Proceed to **Phase 2: Authentication** implementation

## Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup instructions for Phase 1
- **[BACKEND_PLAN.md](./BACKEND_PLAN.md)** - Complete architecture and implementation plan
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema and relationships
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API endpoints quick reference

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

[Your License Here]

