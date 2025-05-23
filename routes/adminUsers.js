const express = require("express");
const router = express.Router();
const adminUserController = require("../controllers/adminUserController");
const { isLoggedIn, isAdminOnly } = require("../middleware/authMiddleware");

// Apply middleware to all admin user routes
router.use(isLoggedIn);
router.use(isAdminOnly);

// Users list with search
router.get("/", adminUserController.getUsersList);

// Create user
router.get("/create", adminUserController.getCreateUser);
router.post("/create", adminUserController.postCreateUser);

// View user details
router.get("/:id/details", adminUserController.getUserDetails);

// Edit user
router.get("/:id/edit", adminUserController.getEditUser);
router.post("/:id/edit", adminUserController.postUpdateUser);

// Toggle user active status
router.post("/:id/toggle-status", adminUserController.toggleUserStatus);

// Delete user
router.post("/:id/delete", adminUserController.deleteUser);

module.exports = router;
