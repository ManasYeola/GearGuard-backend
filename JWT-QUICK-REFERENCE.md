# JWT Authentication - Quick Reference

## 🔐 Token Generation & Verification

### When Generated
```
✅ On User Registration → New user gets tokens
✅ On User Login → Existing user gets tokens
✅ On Token Refresh → New access token issued
```

### Token Lifespan
- **Access Token**: 7 days (used for API requests)
- **Refresh Token**: 30 days (used to get new access token)

---

## 📋 Environment Variables

```env
# Required for JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_REFRESH_EXPIRE=30d
```

---

## 🔑 Token Format

### In HTTP Header
```
Authorization: Bearer <token_here>
```

### Token Structure (JWT)
```
Header.Payload.Signature

Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (Access Token):
{
  "id": 1,
  "email": "user@example.com",
  "role": "Technician",
  "type": "access",
  "iat": 1678886400,
  "exp": 1679491200,
  "iss": "gearguard-api",
  "aud": "gearguard-frontend"
}

Payload (Refresh Token):
{
  "id": 1,
  "type": "refresh",
  "iat": 1678886400,
  "exp": 1681481200,
  "iss": "gearguard-api",
  "aud": "gearguard-frontend"
}
```

---

## 🔌 API Endpoints

### Authentication (No Token Required)
```
POST   /api/auth/register    →  { name, email, password, role }
POST   /api/auth/login       →  { email, password }
POST   /api/auth/refresh     →  { refreshToken }
```

### Protected (Token Required)
```
GET    /api/auth/me          →  Get current user info
POST   /api/auth/logout      →  Clear session (client-side)
GET    /api/teams            →  Get teams
GET    /api/equipment        →  Get equipment
GET    /api/maintenance-requests → Get requests
...all other endpoints
```

---

## 📝 Quick Usage Guide

### 1️⃣ Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@example.com",
    "password": "Pass123!",
    "role": "Technician"
  }'

# Response: { data: { user, tokens: { accessToken, refreshToken } } }
```

### 2️⃣ Store Tokens (Frontend)
```javascript
localStorage.setItem('accessToken', response.data.tokens.accessToken);
localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
```

### 3️⃣ Use Token for Requests
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5000/api/equipment
```

### 4️⃣ Refresh Token (When Expired)
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "YOUR_REFRESH_TOKEN" }'

# Response: { data: { accessToken } }
```

### 5️⃣ Update Token (Frontend)
```javascript
localStorage.setItem('accessToken', newAccessToken);
// Continue using API with new token
```

---

## ✅ Setup Steps

1. **Install**: `npm install`
2. **Configure**: Add JWT secrets to `.env`
3. **Start**: `npm run dev`
4. **Test**: Use Postman or curl

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No token provided" | Missing Authorization header | Add `Authorization: Bearer <token>` |
| "Invalid or expired token" | Token expired or wrong secret | Refresh token or login again |
| "JWT_SECRET is not defined" | .env not loaded | Add JWT_SECRET to .env, restart server |
| "Invalid email or password" | Wrong credentials | Verify email/password, try login again |
| "User not found" | User doesn't exist | Register user first |
| "Access denied" | Insufficient role | Use correct role or ask admin |

---

## 🛡️ Security Checklist

- [ ] JWT_SECRET changed from default
- [ ] JWT_REFRESH_SECRET is different from JWT_SECRET
- [ ] .env in .gitignore
- [ ] CORS_ORIGIN set to frontend URL
- [ ] Using HTTPS in production
- [ ] Tokens cleared on logout
- [ ] Token refresh implemented
- [ ] Rate limiting on login endpoint

---

## 🔄 Frontend Token Refresh Flow

```
User logs in
    ↓
Get tokens
    ↓
Store in localStorage
    ↓
Use accessToken for requests
    ↓
Token expires (401 response)
    ↓
Use refreshToken to get new accessToken
    ↓
Update localStorage
    ↓
Retry original request
```

---

## 📡 Middleware Usage

### Protect Single Route
```javascript
const { authenticateToken } = require('../middleware/jwt');

router.get('/protected', authenticateToken, (req, res) => {
  // req.user contains user info
  res.json(req.user);
});
```

### Protect All Routes in Router
```javascript
const { authenticateToken } = require('../middleware/jwt');

router.use(authenticateToken);  // All routes below are protected
```

### Role-Based Protection
```javascript
const { authorizeRole } = require('../middleware/jwt');

router.delete('/admin', 
  authenticateToken, 
  authorizeRole('Admin'),  // Only Admins
  deleteHandler
);

router.post('/manage',
  authenticateToken,
  authorizeRole('Admin', 'Manager'),  // Admin or Manager
  manageHandler
);
```

### Optional Authentication
```javascript
const { optionalAuth } = require('../middleware/jwt');

router.get('/public', optionalAuth, (req, res) => {
  if (req.user) {
    // User is authenticated, req.user available
  } else {
    // User is not authenticated, continue anyway
  }
});
```

---

## 🧪 Testing with Postman

1. **Create Environment Variable**
   - Variable: `token` = `` (empty initially)

2. **Login Request**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Body: `{ "email": "...", "password": "..." }`
   - Tests tab:
     ```javascript
     pm.environment.set("token", pm.response.json().data.tokens.accessToken);
     ```

3. **Protected Request**
   - Authorization tab → Type: Bearer Token → Token: `{{token}}`
   - Sends: `Authorization: Bearer <token>`

---

## 💻 JavaScript Fetch Example

```javascript
const API_URL = 'http://localhost:5000/api';

// Login
async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await res.json();
  localStorage.setItem('token', data.data.tokens.accessToken);
  return data;
}

// Protected Request
async function getEquipment() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/equipment`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

// Refresh Token
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await res.json();
  localStorage.setItem('token', data.data.accessToken);
  return data;
}

// Usage
await login('user@example.com', 'password');
const equipment = await getEquipment();
```

---

## 📚 Files Reference

- **JWT Utilities**: `utils/jwt.js`
- **JWT Middleware**: `middleware/jwt.js`
- **Auth Controller**: `controllers/authController.js`
- **Auth Routes**: `routes/authRoutes.js`
- **Full Documentation**: `JWT-AUTHENTICATION.md`
- **Examples**: `JWT-EXAMPLES.http`

---

## ⏰ Token Expiration Times

```
Access Token: Expires in 7 days
  → Re-login required after 7 days
  → Or use refresh token to extend

Refresh Token: Expires in 30 days
  → Cannot be refreshed after 30 days
  → User must login again
```

---

## 🚀 Production Checklist

- [ ] Change JWT_SECRET to random 32+ char string
- [ ] Change JWT_REFRESH_SECRET separately
- [ ] Enable HTTPS
- [ ] Set CORS_ORIGIN to specific domain
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Setup error monitoring (Sentry, etc.)
- [ ] Enable token rotation
- [ ] Implement 2FA for sensitive operations
- [ ] Add audit logging

---

## 📞 Support Resources

- JWT Docs: https://jwt.io/
- Node JWT: https://www.npmjs.com/package/jsonwebtoken
- Express Auth: https://expressjs.com/en/guide/using-middleware.html
- Security: https://owasp.org/www-community/attacks/jwt

---

**Last Updated**: April 2026  
**Status**: ✅ Production Ready
