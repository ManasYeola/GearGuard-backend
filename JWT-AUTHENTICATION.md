# JWT Authentication Documentation

## Overview

GearGuard now uses **JSON Web Tokens (JWT)** for secure API authentication. This ensures that only authorized users can access protected endpoints.

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

The `jsonwebtoken` dependency has been added to `package.json`.

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update it:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gearguard
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_REFRESH_EXPIRE=30d
```

**Important**: Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong, random values in production.

### 3. Start the Server

```bash
npm run dev
```

---

## Authentication Flow

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "Technician"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Technician",
      "isActive": true,
      "team": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "7d"
    }
  }
}
```

### 2. User Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response**: Same as registration (returns user + tokens)

### 3. Access Protected Routes

All routes except `/api/auth/*` require authentication.

Include the **Access Token** in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

**Example**: Get current user
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5000/api/auth/me
```

### 4. Refresh Access Token

When the access token expires (default: 7 days), use the refresh token to get a new one.

**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### 5. Logout

**Endpoint**: `POST /api/auth/logout`

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5000/api/auth/logout
```

**Note**: JWT tokens are stateless. Logout is mainly for client-side cleanup. Discard tokens on the frontend.

---

## Using JWT Tokens in Frontend

### Installation

```bash
npm install axios
```

### Setup API Client

```javascript
// src/api/authClient.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const authClient = axios.create({
  baseURL: API_URL
});

// Add request interceptor to include token
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await authClient.post('/auth/refresh', { refreshToken });
        const { accessToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        authClient.defaults.headers.Authorization = `Bearer ${accessToken}`;

        return authClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default authClient;
```

### Login Example

```javascript
// src/components/LoginForm.jsx
import authClient from '../api/authClient';

const handleLogin = async (email, password) => {
  try {
    const response = await authClient.post('/auth/login', {
      email,
      password
    });

    const { accessToken, refreshToken } = response.data.data.tokens;
    const user = response.data.data.user;

    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error.response.data.message);
  }
};
```

### Access Protected API

```javascript
// Any subsequent request will include the token automatically
const fetchEquipment = async () => {
  try {
    const response = await authClient.get('/equipment');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch equipment:', error);
  }
};
```

---

## Token Structure

### Access Token Payload

```json
{
  "id": 1,
  "email": "john@example.com",
  "role": "Technician",
  "type": "access",
  "iat": 1678886400,
  "exp": 1679491200,
  "iss": "gearguard-api",
  "aud": "gearguard-frontend"
}
```

### Refresh Token Payload

```json
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

## Security Best Practices

1. **Never store tokens in cookies** (susceptible to CSRF)
2. **Use localStorage or sessionStorage** for tokens (in production, consider using httpOnly cookies)
3. **Always use HTTPS** in production
4. **Set strong JWT secrets** - use random 32+ character strings
5. **Refresh tokens regularly** - don't rely on single long-lived token
6. **Implement token rotation** - issue new refresh tokens on each use
7. **Add rate limiting** to auth endpoints to prevent brute force attacks
8. **Log authentication attempts** for security auditing

---

## Error Responses

### Missing Token

```json
{
  "success": false,
  "message": "No token provided. Please include Authorization header: Bearer <token>"
}
```

**HTTP Status**: 401 Unauthorized

### Invalid Token

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**HTTP Status**: 401 Unauthorized

### Insufficient Permissions

```json
{
  "success": false,
  "message": "Access denied. Required role(s): Admin, Manager"
}
```

**HTTP Status**: 403 Forbidden

### Deactivated User

```json
{
  "success": false,
  "message": "User account is deactivated"
}
```

**HTTP Status**: 403 Forbidden

---

## Role-Based Access Control (RBAC)

The system supports role-based access. Roles include:

- **Admin** - Full system access
- **Manager** - Manage teams and equipment
- **Technician** - Execute maintenance requests
- **User** - Submit maintenance requests

### Example: Restrict Route to Admins Only

```javascript
// routes/userRoutes.js
const { authorizeRole } = require('../middleware/jwt');

router.delete('/users/:id', 
  authenticateToken, 
  authorizeRole('Admin'), 
  userController.deleteUser
);
```

---

## Troubleshooting

### Token Expired Error

**Solution**: Use the refresh endpoint to get a new access token.

### Invalid Signature Error

**Potential Causes**:
- `JWT_SECRET` changed
- Token was modified
- Wrong secret used for verification

**Solution**: Ensure `JWT_SECRET` in `.env` is correct and consistent.

### Token Not Being Sent

**Solution**: Verify the `Authorization` header format:
```
Authorization: Bearer <token>
```

Not:
```
Authorization: <token>
Authorization: JWT <token>
```

### CORS Errors

**Solution**: Update `.env` with correct `CORS_ORIGIN`:
```env
CORS_ORIGIN=http://localhost:3000
```

---

## Testing with Postman

1. **Register User**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/register`
   - Body (JSON):
     ```json
     {
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123",
       "role": "Technician"
     }
     ```

2. **Save tokens** from response to Postman environment variables

3. **Set Authorization Header**
   - In Postman, go to "Authorization" tab
   - Type: Bearer Token
   - Token: `{{accessToken}}`

4. **Test Protected Endpoint**
   - Method: GET
   - URL: `http://localhost:5000/api/auth/me`
   - Headers will include the token automatically

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Update `.env` with JWT secrets
3. ✅ Test authentication endpoints with Postman
4. ✅ Integrate JWT in frontend using the provided examples
5. ✅ Implement token refresh logic in frontend
6. ✅ Add role-based access control to routes as needed

---

## Additional Resources

- [JWT Official Documentation](https://jwt.io/)
- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
- [Sequelize Documentation](https://sequelize.org/)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)
