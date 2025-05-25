const express = require("express");
const router = express.Router();
const orderLogController = require("../controllers/orderLogController");

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/login");
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.userRole === "staff") {
    return next();
  }
  res.status(403).send("Access denied. Admin privileges required.");
};

// View order logs for a specific order (user access)
router.get(
  "/orders/:orderId/logs",
  isLoggedIn,
  orderLogController.viewOrderLogs
);

// Admin routes for viewing all order logs
router.get(
  "/admin/order-logs",
  isLoggedIn,
  isAdmin,
  orderLogController.viewAllOrderLogs
);

// API endpoint for order activity summary (for dashboard)
router.get(
  "/api/order-activity-summary",
  isLoggedIn,
  orderLogController.getOrderActivitySummary
);

module.exports = router;
