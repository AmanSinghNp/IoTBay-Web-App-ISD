const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// GET /payments – user’s payments
router.get("/payments", paymentController.getMyPayments);

module.exports = router;
