// routes/payments.js
const express = require("express");
const router  = express.Router();
const Cart    = require("../models/cart");
const Device  = require("../models/device");

// GET /payments — render the payment page with cartItems
router.get("/payments", async (req, res, next) => {
  try {
    // Load this user’s cart items and include the Device model
    const cartItems = await Cart.findAll({
      where: { userId: req.session.userId },
      include: Device
    });

    // Render the payments.ejs view, supplying cartItems
    res.render("payments", { cartItems });
  } catch (err) {
    next(err);
  }
});

// POST /payments/new — stub for submission
router.post("/payments/new", (req, res) => {
  // TODO: handle actual payment logic
  res.send("Payment created");
});

module.exports = router;
