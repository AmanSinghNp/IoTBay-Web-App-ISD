// routes/user.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Show profile page
router.get("/profile", userController.showProfile);

// Update profile
router.post("/profile", userController.updateProfile);

// Delete account
router.post("/profile/delete", userController.deleteAccount);

module.exports = router;
