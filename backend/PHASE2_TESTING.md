# Phase 2 Testing Guide - Authentication

## Setup Steps

### 1. Create Admin User
```bash
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

### 2. Start Server
```bash
npm run dev
```

Server should start on `http://localhost:3000`

## Testing Endpoints

### 1. Test Login (POST /api/auth/login)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@chemwaste.com",
    "password": "admin123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@chemwaste.com",
      "fullName": "Administrator",
      "role": "admin",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Save the token** for next requests!

### 2. Test Get Current User (GET /api/auth/me)

**Request:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@chemwaste.com",
      "fullName": "Administrator",
      "role": "admin"
    }
  },
  "message": "User retrieved successfully"
}
```

### 3. Test Update Profile (PUT /api/auth/profile)

**Request:**
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "phone": "9876543210"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@chemwaste.com",
      "fullName": "Admin User",
      "phone": "9876543210",
      "role": "admin"
    }
  },
  "message": "Profile updated successfully"
}
```

### 4. Test Change Password (PUT /api/auth/password)

**Request:**
```bash
curl -X PUT http://localhost:3000/api/auth/password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "newpassword123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 5. Test Logout (POST /api/auth/logout)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Error Testing

### Test Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@chemwaste.com",
    "password": "wrongpassword"
  }'
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

### Test Missing Token
```bash
curl -X GET http://localhost:3000/api/auth/me
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

### Test Invalid Token
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

### Test Validation Errors
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": ""
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Please provide a valid email address"
      },
      {
        "field": "password",
        "message": "Password is required"
      }
    ]
  }
}
```

## Using Postman/Thunder Client

1. **Create Collection:** "Chemical Waste Management API"
2. **Add Environment Variables:**
   - `base_url`: `http://localhost:3000`
   - `token`: (will be set after login)

3. **Login Request:**
   - Method: POST
   - URL: `{{base_url}}/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@chemwaste.com",
       "password": "admin123"
     }
     ```
   - Test Script (to save token):
     ```javascript
     if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       pm.environment.set("token", jsonData.data.token);
     }
     ```

4. **Protected Routes:**
   - Add Header: `Authorization: Bearer {{token}}`

## Verification Checklist

- [ ] Admin user created successfully
- [ ] Login endpoint works
- [ ] Token is generated correctly
- [ ] Get current user works with token
- [ ] Update profile works
- [ ] Change password works
- [ ] Logout works
- [ ] Invalid credentials return 401
- [ ] Missing token returns 401
- [ ] Invalid token returns 401
- [ ] Validation errors return 400

## Next Steps

Once all tests pass, Phase 2 is complete! Proceed to Phase 3: Core Entities (Companies & Transporters).

