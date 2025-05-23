const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { isLoggedIn } = require("../middleware/authMiddleware"); // Assuming you have auth middleware

// Middleware to ensure user is logged in (you might have this already)
// If not, isLoggedIn should handle req.session.userId presence and redirect/error

// Get form to add payment for an order, or edit if paymentId is in query
router.get(
  "/orders/:orderId/payment",
  isLoggedIn,
  paymentController.getPaymentFormForOrder
);

// Create new payment details for an order
router.post(
  "/orders/:orderId/payment",
  isLoggedIn,
  paymentController.createPaymentForOrder
);

// View saved payment details for an order
router.get(
  "/orders/:orderId/payment/details",
  isLoggedIn,
  paymentController.getPaymentDetailsForOrder
);

// Get form to edit existing payment details for an order
router.get(
  "/orders/:orderId/payment/edit",
  isLoggedIn,
  paymentController.getEditPaymentForm
); // Expects ?paymentId=...

// Update existing payment details (specific paymentId in URL)
router.post(
  "/payment/:paymentId/update",
  isLoggedIn,
  paymentController.updatePaymentDetails
);

// Delete saved payment details (specific paymentId in URL)
router.post(
  "/payment/:paymentId/delete",
  isLoggedIn,
  paymentController.deletePaymentDetails
);

// View payment history (all payments for the user, with search)
router.get(
  "/payments/history",
  isLoggedIn,
  paymentController.getPaymentHistory
);

// Note: The search is handled by GET /payments/history with query parameters.
// No separate /payments/search route is defined here as controller handles it.

module.exports = router;
