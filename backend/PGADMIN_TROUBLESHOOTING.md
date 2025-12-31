# pgAdmin Troubleshooting & Alternative Methods

## Issue: pgAdmin Not Responding When Clicking Servers

### Quick Fixes

#### 1. Restart pgAdmin
- Close pgAdmin completely
- Reopen pgAdmin
- Try again

#### 2. Check PostgreSQL Service
The server might not be running. Check in PowerShell:

```powershell
Get-Service postgresql*
```

If it shows "Stopped", start it:
```powershell
Start-Service postgresql-x64-15
```
(Replace `15` with your PostgreSQL version number)

#### 3. Add Server Manually
If no server is registered:

1. Right-click on **Servers** in left panel
2. Select **Register** → **Server**
3. In **General** tab:
   - Name: `PostgreSQL` (or any name)
4. In **Connection** tab:
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: (leave blank or try common defaults)
5. Click **Save**

## Alternative Methods (If pgAdmin Doesn't Work)

### Method 1: Reset Password via Command Line (Easiest)

#### Step 1: Edit pg_hba.conf (Temporary Trust Mode)

1. Find `pg_hba.conf` file:
   - Usually in: `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`
   - Or search for it: `Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Filter "pg_hba.conf"`

2. **Backup the file first!**
   ```powershell
   Copy-Item "C:\Program Files\PostgreSQL\15\data\pg_hba.conf" "C:\Program Files\PostgreSQL\15\data\pg_hba.conf.backup"
   ```

3. Open `pg_hba.conf` in Notepad (as Administrator):
   ```powershell
   notepad "C:\Program Files\PostgreSQL\15\data\pg_hba.conf"
   ```

4. Find this line (near the bottom):
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

5. Change it to:
   ```
   host    all             all             127.0.0.1/32            trust
   ```

6. Save the file

#### Step 2: Restart PostgreSQL Service

```powershell
Restart-Service postgresql-x64-15
```
(Replace `15` with your version)

#### Step 3: Connect Without Password and Reset

```powershell
# Connect to PostgreSQL (no password needed now)
psql -U postgres

# Once connected, run:
ALTER USER postgres WITH PASSWORD 'your_new_password';

# Exit
\q
```

#### Step 4: Restore Security

1. Edit `pg_hba.conf` again
2. Change back to:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

3. Restart PostgreSQL service:
   ```powershell
   Restart-Service postgresql-x64-15
   ```

### Method 2: Use psql with Windows Authentication

If you're logged in as a Windows admin:

```powershell
# Try connecting with Windows authentication
psql -U postgres -d postgres
```

If this works, you can reset password:
```sql
ALTER USER postgres WITH PASSWORD 'your_new_password';
```

### Method 3: Create New Admin User

If you can't reset postgres password, create a new superuser:

```powershell
# Connect (try without password or with Windows auth)
psql -U postgres

# Create new user
CREATE USER admin WITH SUPERUSER PASSWORD 'your_password';

# Now use this user in your .env file
```

Then update `.env`:
```env
DATABASE_URL=postgresql://admin:your_password@localhost:5432/chemical_erp?schema=public
```

### Method 4: Reinstall PostgreSQL (Last Resort)

If nothing works, you might need to reinstall PostgreSQL:
1. Uninstall PostgreSQL
2. Reinstall and set a password during installation
3. Remember the password you set!

## Quick Check Commands

### Check if PostgreSQL is running:
```powershell
Get-Service postgresql*
```

### Check PostgreSQL version:
```powershell
psql --version
```

### Find PostgreSQL data directory:
```powershell
Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Filter "pg_hba.conf" | Select-Object FullName
```

### Test connection:
```powershell
psql -U postgres -c "SELECT version();"
```

## Recommended Approach

**Try Method 1 (pg_hba.conf trust mode)** - it's the most reliable if pgAdmin isn't working.

## After Resetting Password

1. Update `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:your_new_password@localhost:5432/chemical_erp?schema=public
   ```

2. Create database:
   ```powershell
   createdb -U postgres chemical_erp
   ```

3. Continue setup:
   ```powershell
   cd backend
   npm run generate
   npm run migrate
   ```

