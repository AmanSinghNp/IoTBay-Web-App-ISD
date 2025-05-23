// routes/payments.js
const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");

// GET /payments — render the checkout page with cartItems
router.get("/payments", checkoutController.getCheckoutPage);

// POST /payments/new — process checkout and create order
router.post("/payments/new", checkoutController.processCheckout);

module.exports = router;
