# Quick Fix: Login Error

## Problem
Getting "Invalid email or password" error when trying to login.

## Solution: Create Admin User First

The admin user needs to be created in the database before you can login.

### Step 1: Run the Admin Seeder

```powershell
cd backend
npm run seed:admin
```

Expected output:
```
🌱 Seeding admin user...
✅ Admin user created successfully!
   Email: admin@chemwaste.com
   Password: admin123
⚠️  IMPORTANT: Change the default password after first login!
```

### Step 2: Try Login Again

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/auth/login `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"email":"admin@chemwaste.com","password":"admin123"}'
```

## Verify Admin User Exists

Check if admin user is in database:

```powershell
psql -U postgres -d chemical_erp -c "SELECT email, role, is_active FROM users;"
```

You should see:
```
         email          | role  | is_active
------------------------+-------+-----------
 admin@chemwaste.com    | admin | t
```

## If Seeder Fails

If you get an error running the seeder, check:

1. **Database connection:**
   - Verify `.env` file has correct `DATABASE_URL`
   - Test connection: `psql -U postgres -d chemical_erp`

2. **Prisma Client generated:**
   ```powershell
   npm run generate
   ```

3. **Check server logs** for detailed error messages

