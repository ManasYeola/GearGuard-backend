/**
 * Complete JWT Authentication Example
 * This file shows how to use JWT authentication from the frontend
 */

// ============================================================
// PART 1: SETUP - JWT API Service
// ============================================================

class AuthService {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * API Request Helper
   */
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle token expiration (401)
      if (response.status === 401 && options.method !== 'POST' && endpoint !== '/auth/refresh') {
        console.log('Token expired, attempting refresh...');
        const refreshed = await this.refreshAccessToken();
        
        if (refreshed) {
          // Retry the original request with new token
          return this.request(endpoint, { ...options, headers });
        } else {
          // Refresh failed, redirect to login
          this.logout();
          window.location.href = '/login';
          return null;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Request to ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * REGISTER - Create new user
   */
  async register(name, email, password, role = 'User') {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      if (response.success) {
        this.setTokens(
          response.data.tokens.accessToken,
          response.data.tokens.refreshToken
        );
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * LOGIN - Authenticate user
   */
  async login(email, password) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        this.setTokens(
          response.data.tokens.accessToken,
          response.data.tokens.refreshToken
        );
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * GET CURRENT USER - Fetch authenticated user info
   */
  async getCurrentUser() {
    try {
      return await this.request('/auth/me', { method: 'GET' });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * REFRESH TOKEN - Get new access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      console.error('No refresh token available');
      return false;
    }

    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.success) {
        this.setTokens(response.data.accessToken, this.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * LOGOUT - Clear tokens
   */
  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }

    this.clearTokens();
  }

  /**
   * Store tokens in localStorage
   */
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Clear tokens from storage
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.accessToken;
  }
}

// ============================================================
// PART 2: USAGE EXAMPLES
// ============================================================

// Initialize service
const auth = new AuthService();

// -------- EXAMPLE 1: REGISTER NEW USER --------
async function handleRegister() {
  const result = await auth.register(
    'John Doe',
    'john@example.com',
    'SecurePass123!',
    'Technician'
  );

  if (result.success) {
    console.log('✅ Registration successful!');
    console.log('User:', result.data.user);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } else {
    console.error('❌ Registration failed:', result.message);
  }
}

// -------- EXAMPLE 2: LOGIN USER --------
async function handleLogin() {
  const result = await auth.login(
    'john@example.com',
    'SecurePass123!'
  );

  if (result.success) {
    console.log('✅ Login successful!');
    console.log('Welcome:', result.data.user.name);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } else {
    console.error('❌ Login failed:', result.message);
  }
}

// -------- EXAMPLE 3: GET CURRENT USER --------
async function handleGetCurrentUser() {
  const result = await auth.getCurrentUser();

  if (result.success) {
    console.log('✅ Current user fetched:');
    console.log(result.data);
  } else {
    console.error('❌ Failed to fetch current user:', result.message);
  }
}

// -------- EXAMPLE 4: CHECK IF AUTHENTICATED --------
function checkAuthentication() {
  if (auth.isAuthenticated()) {
    console.log('✅ User is authenticated');
    // Show dashboard
  } else {
    console.log('❌ User is not authenticated');
    // Redirect to login
    window.location.href = '/login';
  }
}

// -------- EXAMPLE 5: LOGOUT USER --------
async function handleLogout() {
  await auth.logout();
  console.log('✅ Logout successful');
  // Redirect to login
  window.location.href = '/login';
}

// ============================================================
// PART 3: PROTECTED API CALLS
// ============================================================

class EquipmentAPI {
  constructor(authService) {
    this.auth = authService;
  }

  /**
   * Get all equipment (protected endpoint)
   */
  async getAllEquipment() {
    return this.auth.request('/equipment', { method: 'GET' });
  }

  /**
   * Get single equipment by ID
   */
  async getEquipmentById(id) {
    return this.auth.request(`/equipment/${id}`, { method: 'GET' });
  }

  /**
   * Create new equipment
   */
  async createEquipment(data) {
    return this.auth.request('/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update equipment
   */
  async updateEquipment(id, data) {
    return this.auth.request(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(id) {
    return this.auth.request(`/equipment/${id}`, {
      method: 'DELETE',
    });
  }
}

// -------- EXAMPLE 6: USE EQUIPMENT API --------
async function handleEquipmentOperations() {
  const equipmentAPI = new EquipmentAPI(auth);

  // Get all equipment
  const allEquipment = await equipmentAPI.getAllEquipment();
  if (allEquipment.success) {
    console.log('✅ Equipment list:', allEquipment.data);
  }

  // Get specific equipment
  const equipment = await equipmentAPI.getEquipmentById(1);
  if (equipment.success) {
    console.log('✅ Equipment details:', equipment.data);
  }

  // Create new equipment
  const newEquipment = await equipmentAPI.createEquipment({
    name: 'New Machine',
    serialNumber: 'MAN-001',
    category: 'Machinery',
    purchaseDate: '2024-03-15',
    maintenanceTeamId: 1,
  });

  if (newEquipment.success) {
    console.log('✅ Equipment created:', newEquipment.data);
  }
}

// ============================================================
// PART 4: REACT COMPONENT EXAMPLE
// ============================================================

/*
// LoginForm.jsx
import React, { useState } from 'react';
import AuthService from './services/AuthService';

const auth = new AuthService();

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await auth.login(email, password);

    if (result.success) {
      // Login successful
      window.location.href = '/dashboard';
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import AuthService from './services/AuthService';

const auth = new AuthService();

export function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    if (!auth.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    // Fetch user info
    const fetchUser = async () => {
      const result = await auth.getCurrentUser();
      if (result.success) {
        setUser(result.data);
      } else {
        window.location.href = '/login';
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await auth.logout();
    window.location.href = '/login';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <p>Role: {user?.role}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

// ProtectedRoute.jsx
import React from 'react';
import AuthService from './services/AuthService';

const auth = new AuthService();

export function ProtectedRoute({ component: Component, ...rest }) {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return <Component {...rest} />;
}
*/

// ============================================================
// PART 5: TESTING
// ============================================================

/*
// Example test flow to run in browser console:

// 1. Register
await auth.register('TestUser', 'test@example.com', 'TestPass123!', 'User');

// 2. Login
await auth.login('test@example.com', 'TestPass123!');

// 3. Get current user
await auth.getCurrentUser();

// 4. Check if authenticated
console.log(auth.isAuthenticated());

// 5. Logout
await auth.logout();

// 6. Check if authenticated after logout
console.log(auth.isAuthenticated());
*/

// ============================================================
// PART 6: ERROR HANDLING
// ============================================================

class ErrorHandler {
  static handle(error) {
    if (error.message.includes('401')) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    } else if (error.message.includes('403')) {
      // Forbidden - show permission error
      alert('You do not have permission to access this resource');
    } else if (error.message.includes('500')) {
      // Server error
      alert('Server error. Please try again later');
    } else {
      // Generic error
      alert(`Error: ${error.message}`);
    }
  }
}

// ============================================================
// Export for use in other modules
// ============================================================

export { AuthService, EquipmentAPI, ErrorHandler };
