const jwt = require('jsonwebtoken');

/**
 * Generate JWT Access Token
 * @param {number} userId - User ID to encode in token
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateAccessToken = (userId, email, role) => {
  const payload = {
    id: userId,
    email,
    role,
    type: 'access'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    issuer: 'gearguard-api',
    audience: 'gearguard-frontend'
  });

  return token;
};

/**
 * Generate JWT Refresh Token
 * @param {number} userId - User ID to encode in token
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    return null;
  }

  const payload = {
    id: userId,
    type: 'refresh'
  };

  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    issuer: 'gearguard-api',
    audience: 'gearguard-frontend'
  });

  return token;
};

/**
 * Verify JWT Access Token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'gearguard-api',
      audience: 'gearguard-frontend'
    });

    if (decoded.type !== 'access') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

/**
 * Verify JWT Refresh Token
 * @param {string} token - JWT refresh token to verify
 * @returns {object} Decoded token payload or null if invalid
 */
const verifyRefreshToken = (token) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'gearguard-api',
      audience: 'gearguard-frontend'
    });

    if (decoded.type !== 'refresh') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Refresh token verification error:', error.message);
    return null;
  }
};

/**
 * Decode token without verification (for inspecting expired tokens)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken
};
