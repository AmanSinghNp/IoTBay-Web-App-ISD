const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// -------------------- Profile Routes --------------------

// GET /profile – View the profile page
router.get("/profile", userController.showProfile);

// POST /profile – Update profile info (name, email, phone)
router.post("/profile", userController.updateProfile);

// POST /profile/delete – Delete user account (and cancel active orders)
router.post("/profile/delete", userController.deleteAccount);

// -------------------- Dashboard --------------------

// GET /dashboard – Render user dashboard with role-based navigation
router.get("/dashboard", userController.showDashboard);

// -------------------- Access Logs --------------------

// GET /access-log – View login/logout logs (with optional date filtering)
router.get("/access-log", userController.viewAccessLogs);

module.exports = router;
