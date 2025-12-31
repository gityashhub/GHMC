# How to Reset PostgreSQL Password in pgAdmin

## Method 1: Reset Password via pgAdmin GUI

### Step 1: Open pgAdmin
1. Launch pgAdmin from your Start menu or desktop
2. Enter your pgAdmin master password (if you set one)

### Step 2: Connect to PostgreSQL Server
1. In the left sidebar, expand **Servers**
2. Click on your PostgreSQL server (usually named "PostgreSQL 15" or similar)
3. If not connected, right-click and select **Connect Server**
4. Enter your current password (or leave blank if you don't have one set)

### Step 3: Reset Password
1. Expand your server → **Login/Group Roles**
2. Right-click on **postgres** user
3. Select **Properties**
4. Go to the **Definition** tab
5. Enter your new password in the **Password** field
6. Confirm the password in **Password (again)** field
7. Click **Save**

### Step 4: Update Connection
1. If you're disconnected, reconnect with the new password
2. Right-click server → **Disconnect Server**
3. Right-click server → **Connect Server**
4. Enter the new password

## Method 2: Using SQL Query in pgAdmin

### Step 1: Open Query Tool
1. Connect to your PostgreSQL server in pgAdmin
2. Right-click on any database (or the server itself)
3. Select **Query Tool**

### Step 2: Run SQL Command
```sql
ALTER USER postgres WITH PASSWORD 'your_new_password';
```

Replace `your_new_password` with your desired password.

### Step 3: Execute
1. Click the **Execute** button (or press F5)
2. You should see "Successfully run. Total query runtime: X ms"

## Method 3: Reset via Command Line (Alternative)

If pgAdmin doesn't work, you can also reset via command line:

### Windows PowerShell
```powershell
# Connect to PostgreSQL
psql -U postgres

# If it asks for password and you don't know it, try:
# 1. Check if you can connect without password (trust authentication)
# 2. Or use the method below
```

### Using SQL File
1. Create a file `reset_password.sql`:
   ```sql
   ALTER USER postgres WITH PASSWORD 'your_new_password';
   ```

2. Run it:
   ```powershell
   psql -U postgres -f reset_password.sql
   ```

## Troubleshooting

### Can't Connect to Server
If you can't connect to PostgreSQL server in pgAdmin:

1. **Check PostgreSQL Service**
   ```powershell
   Get-Service postgresql*
   ```
   Make sure the service is running.

2. **Check Connection Settings**
   - Host: `localhost` or `127.0.0.1`
   - Port: `5432` (default)
   - Username: `postgres`

3. **Try Trust Authentication** (temporary)
   - Edit `pg_hba.conf` file (usually in `C:\Program Files\PostgreSQL\15\data\`)
   - Find line: `host all all 127.0.0.1/32 scram-sha-256`
   - Change to: `host all all 127.0.0.1/32 trust`
   - Restart PostgreSQL service
   - Connect without password
   - Reset password
   - Change back to `scram-sha-256`
   - Restart service again

### Password Not Saving
- Make sure you have admin privileges
- Try disconnecting and reconnecting after changing password
- Check if PostgreSQL service is running

## After Resetting Password

1. **Update your .env file:**
   ```env
   DATABASE_URL=postgresql://postgres:your_new_password@localhost:5432/chemical_erp?schema=public
   ```

2. **Test connection:**
   ```powershell
   psql -U postgres -d chemical_erp
   ```

3. **Create database if not exists:**
   ```powershell
   createdb -U postgres chemical_erp
   ```

## Quick Reference

**pgAdmin Location:**
- Login/Group Roles → postgres → Properties → Definition → Password

**SQL Command:**
```sql
ALTER USER postgres WITH PASSWORD 'new_password';
```

**Update .env:**
```env
DATABASE_URL=postgresql://postgres:new_password@localhost:5432/chemical_erp?schema=public
```

