/**
 * Authentication Middleware
 * Validates JWT tokens and authenticates API requests
 *
 * @module middleware/auth
 * @description Protects routes by verifying JWT tokens and attaching user info
 */

const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * Authentication Middleware Function
 * @async
 * @function authMiddleware
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 *
 * @throws {401} If no token is provided
 * @throws {401} If token is invalid
 * @throws {401} If user not found in database
 *
 * @example
 * // Usage in routes:
 * router.get('/protected-route', authMiddleware, (req, res) => {
 *   // Access authenticated user info via req.user
 *   const userId = req.user.id;
 * });
 */
module.exports = async (req, res, next) => {
  try {
    // Get token from request header
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    // Check if token is valid
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Check if user exists in database
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    /**
     * Attach user information to request object
     * @property {Object} req.user - Authenticated user information
     * @property {number} req.user.id - User ID
     * @property {string} req.user.role - User role (customer/staff)
     */
    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Token is not valid" });
  }
};
