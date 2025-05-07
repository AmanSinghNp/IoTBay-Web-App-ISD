// routes/payments.js
const express = require("express");
const router  = express.Router();

// correct: GET /payments
router.get("/payments", (req, res) => {
  res.send("Payment routes working");
});

// correct: POST /payments/new
router.post("/payments/new", (req, res) => {
  res.send("Payment created");
});

module.exports = router;
