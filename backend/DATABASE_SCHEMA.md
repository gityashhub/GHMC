# Database Schema - ER Diagram

## Entity Relationships

```
┌─────────────┐
│    Users    │
│─────────────│
│ id (PK)     │
│ email       │
│ password    │
│ full_name   │
│ role        │
└─────────────┘

┌─────────────┐         ┌──────────────────┐
│  Companies  │────────<│ Company Materials│
│─────────────│   1:N   │──────────────────│
│ id (PK)     │         │ id (PK)          │
│ name        │         │ company_id (FK)  │
│ gst_number  │         │ material_name   │
│ address     │         │ rate             │
│ city        │         │ unit             │
└─────────────┘         └──────────────────┘
      │
      │ 1:N
      │
      ▼
┌─────────────┐
│   Inward    │
│   Entries   │
│─────────────│
│ id (PK)     │
│ company_id  │────────┐
│ lot_no      │        │
│ manifest_no │        │
│ waste_name  │        │
│ quantity    │        │
│ invoice_id  │────────┼──┐
└─────────────┘        │  │
                        │  │
┌─────────────┐         │  │
│  Inward     │         │  │
│  Materials  │         │  │
│─────────────│         │  │
│ id (PK)     │         │  │
│ inward_id   │────────┘  │
│ transporter │           │
│ rate        │           │
│ amount      │           │
└─────────────┘           │
                          │
┌─────────────┐           │
│  Transporters│          │
│─────────────│           │
│ id (PK)     │           │
│ name        │           │
│ gst_number  │           │
└─────────────┘           │
      │                   │
      │ 1:N               │
      │                   │
      ▼                   │
┌─────────────┐           │
│   Outward    │           │
│   Entries    │           │
│─────────────│           │
│ id (PK)     │           │
│ transporter │───────────┘
│ manifest_no │
│ cement_co   │
│ quantity    │
│ invoice_id  │──────────┐
└─────────────┘          │
                         │
┌─────────────┐          │
│   Invoices  │<─────────┘
│─────────────│     N:1
│ id (PK)     │
│ invoice_no  │
│ type        │
│ company_id  │
│ transporter │
│ subtotal    │
│ cgst        │
│ sgst        │
│ grand_total │
│ status      │
└─────────────┘
      │
      │ 1:N
      │
      ▼
┌─────────────┐
│  Invoice    │
│  Manifests  │
│─────────────│
│ id (PK)     │
│ invoice_id  │
│ manifest_no │
└─────────────┘

┌─────────────┐
│  Invoice    │
│  Materials  │
│─────────────│
│ id (PK)     │
│ invoice_id  │
│ material    │
│ quantity    │
│ amount      │
└─────────────┘
```

## Key Relationships

1. **Company → Company Materials**: One-to-Many
   - One company can have multiple materials with different rates

2. **Company → Inward Entries**: One-to-Many
   - One company can have multiple inward entries

3. **Inward Entry → Inward Materials**: One-to-Many
   - One inward entry can have multiple material records (transporter records)

4. **Transporter → Outward Entries**: One-to-Many
   - One transporter can handle multiple outward dispatches

5. **Invoice → Inward Entries**: One-to-Many (via invoice_id)
   - One invoice can cover multiple inward entries

6. **Invoice → Outward Entries**: One-to-Many (via invoice_id)
   - One invoice can cover multiple outward entries

7. **Invoice → Invoice Manifests**: One-to-Many
   - One invoice can reference multiple manifest numbers

8. **Invoice → Invoice Materials**: One-to-Many
   - One invoice can have multiple material line items

## Data Flow

### Invoice Creation Flow
1. User selects company/transporter
2. System fetches related entries (inward/outward) by manifest numbers
3. System calculates totals (subtotal, GST, grand total)
4. Invoice is created
5. Related entries are updated with invoice_id
6. Payment status is calculated

### Payment Update Flow
1. Payment is updated on invoice
2. Status is recalculated (paid/pending/partial)
3. Related entries are updated with payment information
4. Company/transporter statistics are recalculated

### Statistics Calculation
- Company totals: Aggregated from all invoices linked to company
- Transporter totals: Aggregated from outward entries
- Dashboard stats: Aggregated from all entities with date filters

