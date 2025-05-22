/**
 * Authentication Routes
 * Handles user authentication including login, registration, and session management
 *
 * @module routes/auth
 */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * @route GET /auth/login
 * @description Renders the login page
 * @access Public
 */
router.get("/login", (req, res) => {
  res.render("login");
});

/**
 * @route POST /auth/login
 * @description Authenticate user and generate JWT token
 * @access Public
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @returns {object} Response object containing token and user data
 * @throws {401} Invalid credentials
 * @throws {500} Server error
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password hash
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token with user data
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    // Sanitize user data for response
    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route GET /auth/register
 * @description Renders the registration page
 * @access Public
 */
router.get("/register", (req, res) => {
  res.render("register");
});

/**
 * @route POST /auth/register
 * @description Register a new user
 * @access Public
 * @param {string} req.body.fullName - User's full name
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @param {string} req.body.phone - User's phone number (optional)
 * @returns {object} Response object containing user data
 * @throws {400} Email already registered or validation error
 * @throws {500} Server error
 */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password before storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user record
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    // Sanitize user data for response
    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route GET /auth/createstaff
 * @description Development route to create a staff user
 * @access Development only
 * @deprecated This route should be removed in production
 */
router.get("/createstaff", async (req, res) => {
  try {
    const exists = await User.findOne({
      where: { email: "staff@example.com" },
    });
    if (exists) {
      return res.send("⚠️ Staff user already exists. Try logging in.");
    }

    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash("123456", 10);

    await User.create({
      fullName: "Admin User",
      email: "staff@example.com",
      password: hashed,
      phone: "123456789",
      role: "staff",
    });

    res.send("✅ Staff user created. Login with staff@example.com / 123456");
  } catch (err) {
    console.error(err);
    res.send("❌ Something went wrong.");
  }
});

/**
 * @route GET /auth/logout
 * @description Destroys user session and redirects to home
 * @access Public
 */
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
