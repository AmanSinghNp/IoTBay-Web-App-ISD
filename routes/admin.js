const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isAdmin } = require("../middleware/adminAuth");

// Apply admin authentication middleware to all routes
router.use(isAdmin);

// GET /admin/users - List all users with search
router.get("/users", adminController.listUsers);

// POST /admin/users/:userId/toggle - Toggle user active status
router.post("/users/:userId/toggle", adminController.toggleUserStatus);

// DELETE /admin/users/:userId - Delete user
router.delete("/users/:userId", adminController.deleteUser);

// PUT /admin/users/:userId - Update user details
router.put("/users/:userId", adminController.updateUser);

module.exports = router;
