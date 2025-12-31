# API Reference - Quick Guide

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com/api
```

## Authentication
All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

## Common Response Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

**Note:** No registration endpoint. Admin user is created via database seeder.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@chemwaste.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": { ... }
  }
}
```

---

## Companies Endpoints

### Get All Companies
```http
GET /api/companies?page=1&limit=20&search=ABC&sort=name
```

### Get Company by ID
```http
GET /api/companies/:id
```

### Create Company
```http
POST /api/companies
Content-Type: application/json

{
  "name": "ABC Industries",
  "address": "123 Industrial Area",
  "city": "Mumbai",
  "contact": "9876543210",
  "gstNumber": "27AABCU9603R1ZM",
  "materials": [
    {
      "material": "Plastic Waste",
      "rate": 25,
      "unit": "Kg"
    }
  ]
}
```

### Update Company
```http
PUT /api/companies/:id
Content-Type: application/json

{
  "name": "Updated Name",
  ...
}
```

### Delete Company
```http
DELETE /api/companies/:id
```

### Get Company Materials
```http
GET /api/companies/:id/materials
```

### Add Material to Company
```http
POST /api/companies/:id/materials
Content-Type: application/json

{
  "material": "Chemical Waste",
  "rate": 45,
  "unit": "MT"
}
```

### Get Company Statistics
```http
GET /api/companies/:id/stats

Response:
{
  "totalInvoiced": 450000,
  "totalPaid": 350000,
  "totalPending": 100000
}
```

---

## Transporters Endpoints

### Get All Transporters
```http
GET /api/transporters?page=1&limit=20
```

### Create Transporter
```http
POST /api/transporters
Content-Type: application/json

{
  "transporterId": "TRP-001",
  "name": "Swift Logistics",
  "contact": "9876543210",
  "address": "Transport Nagar",
  "email": "swift@example.com",
  "gstNumber": "27AABCU9603R1ZM"
}
```

### Get Transporter Statistics
```http
GET /api/transporters/:id/stats
```

---

## Inward Entries Endpoints

### Get All Inward Entries
```http
GET /api/inward?page=1&limit=20&companyId=xxx&dateFrom=2024-01-01&dateTo=2024-12-31
```

### Create Inward Entry (Single)
```http
POST /api/inward
Content-Type: application/json

{
  "date": "2024-12-20",
  "lotNo": "LOT-2024-001",
  "companyId": "company-uuid",
  "manifestNo": "MN-2024-0456",
  "vehicleNo": "MH12AB1234",
  "wasteName": "Chemical Waste",
  "rate": 45,
  "category": "Semi-solid",
  "quantity": 25,
  "unit": "MT",
  "month": "December 2024"
}
```

### Create Multiple Inward Entries
```http
POST /api/inward/bulk
Content-Type: application/json

{
  "entries": [
    { ... },
    { ... }
  ]
}
```

### Update Inward Entry
```http
PUT /api/inward/:id
Content-Type: application/json

{
  "quantity": 30,
  ...
}
```

### Update Payment
```http
PUT /api/inward/:id/payment
Content-Type: application/json

{
  "paymentReceived": 44250,
  "paymentReceivedOn": "2024-12-22"
}
```

### Get Inward Statistics
```http
GET /api/inward/stats?month=December&year=2024

Response:
{
  "totalEntries": 45,
  "totalQuantity": 750,
  "totalInvoiced": 450000,
  "totalReceived": 350000
}
```

---

## Outward Entries Endpoints

### Get All Outward Entries
```http
GET /api/outward?page=1&limit=20&transporterId=xxx
```

### Create Outward Entry
```http
POST /api/outward
Content-Type: application/json

{
  "month": "December 2024",
  "date": "2024-12-22",
  "cementCompany": "UltraTech Cement",
  "location": "Raigad, Maharashtra",
  "manifestNo": "OUT-2024-0089",
  "transporterId": "transporter-uuid",
  "vehicleNo": "MH12XY7890",
  "wasteName": "Solid",
  "quantity": 18,
  "unit": "MT",
  "packing": "Jumbo Bags"
}
```

### Get Consolidated Summary
```http
GET /api/outward/summary?month=December&year=2024

Response: Grouped by month, cement company, and transporter
```

---

## Invoices Endpoints

### Get All Invoices
```http
GET /api/invoices?type=Inward&status=paid&page=1&limit=20
```

### Create Invoice
```http
POST /api/invoices
Content-Type: application/json

{
  "invoiceNo": "INV-2024-0156",
  "type": "Inward",
  "date": "2024-12-21",
  "companyId": "company-uuid",
  "manifestNumbers": ["MN-2024-0456", "MN-2024-0457"],
  "materials": [
    {
      "material": "Chemical Waste",
      "quantity": 25,
      "rate": 45,
      "unit": "MT",
      "amount": 1125,
      "manifestNo": "MN-2024-0456"
    }
  ],
  "gstPercent": 18
}

Response: System calculates subtotal, CGST, SGST, grandTotal
```

### Update Invoice Payment
```http
PUT /api/invoices/:id/payment
Content-Type: application/json

{
  "paymentReceived": 88500,
  "paymentReceivedOn": "2024-12-22"
}
```

### Download Invoice PDF
```http
GET /api/invoices/:id/download
Response: PDF file
```

---

## Dashboard Endpoints

### Get Dashboard Statistics
```http
GET /api/dashboard/stats

Response:
{
  "totalInward": { "quantity": 750, "entries": 45 },
  "totalOutward": { "quantity": 710, "entries": 38 },
  "totalInvoices": 156,
  "totalRevenue": { "ytd": 2206000, "paid": 1850000, "pending": 356000 }
}
```

### Get Revenue Chart Data
```http
GET /api/dashboard/revenue?year=2024

Response:
[
  { "month": "Jan", "revenue": 125000 },
  { "month": "Feb", "revenue": 115000 },
  ...
]
```

### Get Payment Status
```http
GET /api/dashboard/payment-status

Response:
{
  "paid": 1850000,
  "pending": 450000,
  "overdue": 120000
}
```

### Get Recent Activity
```http
GET /api/dashboard/recent-activity?limit=10

Response:
[
  {
    "type": "inward",
    "title": "Waste collected from ABC Industries",
    "quantity": "25 MT",
    "time": "2 hours ago"
  },
  ...
]
```

---

## Settings Endpoints

### Get All Settings
```http
GET /api/settings
```

### Get Setting by Key
```http
GET /api/settings/invoice-prefix
```

### Update Setting
```http
PUT /api/settings/invoice-prefix
Content-Type: application/json

{
  "value": "INV-2024-"
}
```

### Bulk Update Settings
```http
POST /api/settings/bulk
Content-Type: application/json

{
  "settings": {
    "invoice-prefix": "INV-2024-",
    "cgst-rate": 9,
    "sgst-rate": 9
  }
}
```

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

## Pagination Format

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering & Sorting

### Common Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search term (searches relevant fields)
- `sort` - Sort field (e.g., `name`, `-date` for descending)
- `dateFrom` - Start date filter (YYYY-MM-DD)
- `dateTo` - End date filter (YYYY-MM-DD)

### Examples
```
GET /api/companies?search=ABC&sort=-created_at&page=1&limit=10
GET /api/invoices?type=Inward&status=pending&dateFrom=2024-01-01&dateTo=2024-12-31
GET /api/inward?companyId=xxx&dateFrom=2024-12-01&dateTo=2024-12-31
```

