# Backend Architecture Plan - Chemical Waste Management ERP

## Technology Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma (recommended) or Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi or express-validator
- **Environment**: dotenv
- **CORS**: cors middleware
- **Logging**: winston or morgan

## Database Schema Design

### 1. Users Table
```sql
users
- id (UUID, PRIMARY KEY)
- email (VARCHAR, UNIQUE, NOT NULL)
- password_hash (VARCHAR, NOT NULL)
- full_name (VARCHAR)
- phone (VARCHAR)
- role (VARCHAR) -- 'admin', 'user'
- is_active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. Companies Table (Waste Generators)
```sql
companies
- id (UUID, PRIMARY KEY)
- name (VARCHAR, NOT NULL)
- address (TEXT)
- city (VARCHAR)
- contact (VARCHAR)
- email (VARCHAR)
- gst_number (VARCHAR, UNIQUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3. Company Materials Table (Many-to-Many)
```sql
company_materials
- id (UUID, PRIMARY KEY)
- company_id (UUID, FOREIGN KEY -> companies.id)
- material_name (VARCHAR, NOT NULL)
- rate (DECIMAL(10,2), NOT NULL)
- unit (VARCHAR) -- 'MT', 'Kg', 'KL'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 4. Transporters Table
```sql
transporters
- id (UUID, PRIMARY KEY)
- transporter_id (VARCHAR, UNIQUE) -- e.g., 'TRP-001'
- name (VARCHAR, NOT NULL)
- contact (VARCHAR)
- address (TEXT)
- email (VARCHAR)
- gst_number (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 5. Inward Entries Table
```sql
inward_entries
- id (UUID, PRIMARY KEY)
- sr_no (INTEGER)
- date (DATE, NOT NULL)
- lot_no (VARCHAR, UNIQUE)
- company_id (UUID, FOREIGN KEY -> companies.id)
- manifest_no (VARCHAR, NOT NULL)
- vehicle_no (VARCHAR)
- waste_name (VARCHAR, NOT NULL)
- rate (DECIMAL(10,2))
- category (VARCHAR) -- 'Solid', 'Semi-solid', 'Liquid'
- quantity (DECIMAL(10,2), NOT NULL)
- unit (VARCHAR) -- 'MT', 'Kg', 'KL'
- month (VARCHAR)
- invoice_id (UUID, FOREIGN KEY -> invoices.id, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 6. Inward Materials Table (Transporter Records)
```sql
inward_materials
- id (UUID, PRIMARY KEY)
- inward_entry_id (UUID, FOREIGN KEY -> inward_entries.id)
- sr_no (INTEGER)
- date (DATE)
- lot_no (VARCHAR)
- company_id (UUID, FOREIGN KEY -> companies.id)
- manifest_no (VARCHAR)
- vehicle_no (VARCHAR)
- waste_name (VARCHAR)
- category (VARCHAR)
- quantity (DECIMAL(10,2))
- unit (VARCHAR)
- transporter_name (VARCHAR)
- invoice_no (VARCHAR)
- vehicle_capacity (VARCHAR)
- rate (DECIMAL(10,2))
- amount (DECIMAL(10,2))
- det_charges (DECIMAL(10,2))
- gst (DECIMAL(10,2))
- gross_amount (DECIMAL(10,2))
- paid_on (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 7. Outward Entries Table
```sql
outward_entries
- id (UUID, PRIMARY KEY)
- sr_no (INTEGER)
- month (VARCHAR)
- date (DATE, NOT NULL)
- cement_company (VARCHAR, NOT NULL)
- location (VARCHAR)
- manifest_no (VARCHAR, NOT NULL)
- transporter_id (UUID, FOREIGN KEY -> transporters.id)
- vehicle_no (VARCHAR)
- waste_name (VARCHAR) -- 'Solid', 'Liquid'
- quantity (DECIMAL(10,2), NOT NULL)
- unit (VARCHAR) -- 'MT', 'Kg', 'KL'
- packing (VARCHAR)
- invoice_id (UUID, FOREIGN KEY -> invoices.id, NULLABLE)
- rate (DECIMAL(10,2))
- amount (DECIMAL(10,2))
- gst (DECIMAL(10,2))
- gross_amount (DECIMAL(10,2))
- vehicle_capacity (VARCHAR)
- det_charges (DECIMAL(10,2))
- paid_on (DATE)
- due_on (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 8. Invoices Table
```sql
invoices
- id (UUID, PRIMARY KEY)
- invoice_no (VARCHAR, UNIQUE, NOT NULL)
- type (VARCHAR) -- 'Inward', 'Outward', 'Transporter'
- date (DATE, NOT NULL)
- customer_name (VARCHAR) -- company name or transporter name
- company_id (UUID, FOREIGN KEY -> companies.id, NULLABLE)
- transporter_id (UUID, FOREIGN KEY -> transporters.id, NULLABLE)
- subtotal (DECIMAL(10,2), NOT NULL)
- cgst (DECIMAL(10,2))
- sgst (DECIMAL(10,2))
- grand_total (DECIMAL(10,2), NOT NULL)
- payment_received (DECIMAL(10,2), DEFAULT 0)
- payment_received_on (DATE)
- status (VARCHAR) -- 'paid', 'pending', 'partial'
- gst_no (VARCHAR)
- billed_to (VARCHAR)
- shipped_to (VARCHAR)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 9. Invoice Manifest Junction Table
```sql
invoice_manifests
- id (UUID, PRIMARY KEY)
- invoice_id (UUID, FOREIGN KEY -> invoices.id)
- manifest_no (VARCHAR, NOT NULL)
- created_at (TIMESTAMP)
```

### 10. Invoice Materials Table (for multi-material invoices)
```sql
invoice_materials
- id (UUID, PRIMARY KEY)
- invoice_id (UUID, FOREIGN KEY -> invoices.id)
- material_name (VARCHAR)
- rate (DECIMAL(10,2))
- unit (VARCHAR)
- quantity (DECIMAL(10,2))
- amount (DECIMAL(10,2))
- manifest_no (VARCHAR)
- created_at (TIMESTAMP)
```

### 11. Settings Table
```sql
settings
- id (UUID, PRIMARY KEY)
- key (VARCHAR, UNIQUE, NOT NULL)
- value (TEXT)
- type (VARCHAR) -- 'string', 'number', 'boolean', 'json'
- updated_at (TIMESTAMP)
```

## API Endpoints Structure

### Authentication Routes
```
POST   /api/auth/login              - Login admin user
POST   /api/auth/logout             - Logout user
GET    /api/auth/me                 - Get current admin user
PUT    /api/auth/profile            - Update admin profile
PUT    /api/auth/password           - Change password

Note: No registration endpoint. Admin user created via seeder.
```

### Companies Routes
```
GET    /api/companies               - Get all companies (with pagination, search, filters)
GET    /api/companies/:id           - Get company by ID
POST   /api/companies                - Create new company
PUT    /api/companies/:id            - Update company
DELETE /api/companies/:id            - Delete company
GET    /api/companies/:id/materials  - Get company materials
POST   /api/companies/:id/materials  - Add material to company
PUT    /api/companies/:id/materials/:materialId - Update material
DELETE /api/companies/:id/materials/:materialId  - Remove material
GET    /api/companies/:id/invoices   - Get company invoices
GET    /api/companies/:id/stats      - Get company statistics (total invoiced, paid, pending)
```

### Transporters Routes
```
GET    /api/transporters             - Get all transporters
GET    /api/transporters/:id         - Get transporter by ID
POST   /api/transporters              - Create new transporter
PUT    /api/transporters/:id         - Update transporter
DELETE /api/transporters/:id         - Delete transporter
GET    /api/transporters/:id/invoices - Get transporter invoices
GET    /api/transporters/:id/stats   - Get transporter statistics
```

### Inward Entries Routes
```
GET    /api/inward                   - Get all inward entries (with filters, pagination)
GET    /api/inward/:id                - Get inward entry by ID
POST   /api/inward                    - Create inward entry (single or bulk)
PUT    /api/inward/:id                - Update inward entry
DELETE /api/inward/:id                - Delete inward entry
GET    /api/inward/stats              - Get inward statistics
PUT    /api/inward/:id/payment        - Update payment information
```

### Inward Materials Routes
```
GET    /api/inward-materials         - Get all inward material records
GET    /api/inward-materials/:id      - Get by ID
POST   /api/inward-materials         - Create inward material record
PUT    /api/inward-materials/:id     - Update record
DELETE /api/inward-materials/:id      - Delete record
```

### Outward Entries Routes
```
GET    /api/outward                   - Get all outward entries
GET    /api/outward/:id               - Get outward entry by ID
POST   /api/outward                   - Create outward entry
PUT    /api/outward/:id               - Update outward entry
DELETE /api/outward/:id               - Delete outward entry
GET    /api/outward/summary           - Get consolidated summary (grouped)
GET    /api/outward/stats             - Get outward statistics
```

### Invoices Routes
```
GET    /api/invoices                  - Get all invoices (with filters: type, status, date range)
GET    /api/invoices/:id              - Get invoice by ID
POST   /api/invoices                  - Create invoice
PUT    /api/invoices/:id              - Update invoice
DELETE /api/invoices/:id              - Delete invoice
GET    /api/invoices/stats            - Get invoice statistics
GET    /api/invoices/:id/download     - Download invoice PDF
PUT    /api/invoices/:id/payment     - Update payment
POST   /api/invoices/:id/generate-pdf - Generate PDF
```

### Dashboard Routes
```
GET    /api/dashboard/stats           - Get dashboard statistics
GET    /api/dashboard/revenue         - Get revenue chart data
GET    /api/dashboard/waste-flow      - Get waste flow data
GET    /api/dashboard/payment-status  - Get payment status breakdown
GET    /api/dashboard/recent-activity - Get recent activities
```

### Settings Routes
```
GET    /api/settings                  - Get all settings
GET    /api/settings/:key             - Get setting by key
PUT    /api/settings/:key              - Update setting
POST   /api/settings/bulk              - Update multiple settings
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js              # Database configuration
│   │   ├── env.js                   # Environment variables validation
│   │   └── jwt.js                   # JWT configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── companies.controller.js
│   │   ├── transporters.controller.js
│   │   ├── inward.controller.js
│   │   ├── outward.controller.js
│   │   ├── invoices.controller.js
│   │   ├── dashboard.controller.js
│   │   └── settings.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT authentication
│   │   ├── error.middleware.js      # Error handling
│   │   ├── validation.middleware.js # Request validation
│   │   └── logger.middleware.js     # Request logging
│   ├── models/
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── CompanyMaterial.js
│   │   ├── Transporter.js
│   │   ├── InwardEntry.js
│   │   ├── InwardMaterial.js
│   │   ├── OutwardEntry.js
│   │   ├── Invoice.js
│   │   ├── InvoiceManifest.js
│   │   ├── InvoiceMaterial.js
│   │   └── Setting.js
│   ├── routes/
│   │   ├── index.js                 # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── companies.routes.js
│   │   ├── transporters.routes.js
│   │   ├── inward.routes.js
│   │   ├── outward.routes.js
│   │   ├── invoices.routes.js
│   │   ├── dashboard.routes.js
│   │   └── settings.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── companies.service.js
│   │   ├── transporters.service.js
│   │   ├── inward.service.js
│   │   ├── outward.service.js
│   │   ├── invoices.service.js
│   │   ├── dashboard.service.js
│   │   ├── pdf.service.js            # PDF generation
│   │   └── email.service.js          # Email notifications (future)
│   ├── utils/
│   │   ├── logger.js                 # Winston logger
│   │   ├── errors.js                 # Custom error classes
│   │   ├── validators.js             # Validation schemas
│   │   └── helpers.js                # Helper functions
│   ├── migrations/                   # Database migrations (if using raw SQL)
│   ├── seeders/                      # Database seeders
│   ├── app.js                        # Express app setup
│   └── server.js                     # Server entry point
├── .env.example
├── .env
├── .gitignore
├── package.json
├── README.md
└── BACKEND_PLAN.md
```

## Key Features & Business Logic

### 1. Invoice Generation
- When creating an invoice, automatically link it to related inward/outward entries via manifest numbers
- Calculate totals (subtotal, CGST, SGST, grand total) automatically
- Update payment status based on payment_received vs grand_total

### 2. Payment Tracking
- Track payments at invoice level
- Update payment status: 'paid', 'pending', 'partial'
- Update related entries when invoice payment is updated

### 3. Statistics & Reporting
- Calculate company totals (invoiced, paid, pending) dynamically
- Calculate transporter totals from outward entries
- Dashboard statistics aggregated from all entities

### 4. Data Validation
- Validate GST numbers format
- Validate email addresses
- Validate phone numbers
- Ensure unique manifest numbers, invoice numbers, lot numbers
- Validate quantity and amounts are positive

### 5. Search & Filtering
- Search companies by name, GST number
- Filter invoices by type, status, date range
- Filter entries by date range, company, transporter
- Pagination for large datasets

## Security Considerations

1. **Authentication**: JWT-based authentication
2. **Password Hashing**: bcrypt with salt rounds
3. **Input Validation**: Validate all inputs to prevent SQL injection
4. **CORS**: Configure CORS for frontend domain only
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Environment Variables**: Store sensitive data in .env
7. **SQL Injection Prevention**: Use parameterized queries (ORM handles this)

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chemwaste_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
FRONTEND_URL=http://localhost:5173

# Email (future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Setup project structure
- [ ] Configure Express.js
- [ ] Setup PostgreSQL database
- [ ] Create database schema
- [ ] Setup Prisma/Sequelize ORM
- [ ] Environment configuration
- [ ] Basic error handling

### Phase 2: Authentication (Week 1-2)
- [ ] User model and migration
- [ ] Register endpoint
- [ ] Login endpoint with JWT
- [ ] Authentication middleware
- [ ] Password hashing
- [ ] Token refresh mechanism

### Phase 3: Core Entities (Week 2-3)
- [ ] Companies CRUD
- [ ] Company materials management
- [ ] Transporters CRUD
- [ ] Basic validation

### Phase 4: Inward/Outward Management (Week 3-4)
- [ ] Inward entries CRUD
- [ ] Inward materials CRUD
- [ ] Outward entries CRUD
- [ ] Search and filtering
- [ ] Statistics endpoints

### Phase 5: Invoicing System (Week 4-5)
- [ ] Invoice CRUD
- [ ] Invoice generation logic
- [ ] Link invoices to entries
- [ ] Payment tracking
- [ ] Invoice statistics

### Phase 6: Dashboard & Reporting (Week 5)
- [ ] Dashboard statistics
- [ ] Revenue charts data
- [ ] Payment status breakdown
- [ ] Recent activity feed

### Phase 7: Settings & Utilities (Week 6)
- [ ] Settings management
- [ ] PDF generation (optional)
- [ ] Data export (optional)
- [ ] Email notifications (optional)

### Phase 8: Testing & Optimization (Week 6-7)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

## Database Indexes (Performance)

```sql
-- Companies
CREATE INDEX idx_companies_gst_number ON companies(gst_number);
CREATE INDEX idx_companies_name ON companies(name);

-- Inward Entries
CREATE INDEX idx_inward_company ON inward_entries(company_id);
CREATE INDEX idx_inward_date ON inward_entries(date);
CREATE INDEX idx_inward_manifest ON inward_entries(manifest_no);
CREATE INDEX idx_inward_invoice ON inward_entries(invoice_id);

-- Outward Entries
CREATE INDEX idx_outward_transporter ON outward_entries(transporter_id);
CREATE INDEX idx_outward_date ON outward_entries(date);
CREATE INDEX idx_outward_manifest ON outward_entries(manifest_no);

-- Invoices
CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_transporter ON invoices(transporter_id);
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Next Steps

1. Review and approve this plan
2. Setup development environment
3. Initialize database
4. Start with Phase 1 implementation
5. Create API documentation (Swagger/OpenAPI)

