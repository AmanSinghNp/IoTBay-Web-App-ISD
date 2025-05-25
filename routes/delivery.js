// routes/delivery.js
const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const Device = require("../models/device");
const Address = require("../models/address");
const { isLoggedIn } = require("../middleware/authMiddleware");

router.get("/delivery", isLoggedIn, async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // Validate userId exists (additional safety check)
    if (!userId) {
      req.flash("error", "Session expired. Please log in again.");
      return res.redirect("/login");
    }

    // load this user's cart (assumes you've set up Cart→Device associations)
    const cartItems = await Cart.findAll({
      where: { userId: userId },
      include: Device,
    });

    const addresses = await Address.findAll({
      where: { userId: userId },
    });

    res.render("delivery", { cartItems, addresses, userId });
  } catch (err) {
    console.error("Error in delivery route:", err);
    req.flash("error", "An error occurred while loading the delivery page.");
    res.redirect("/cart");
  }
});

module.exports = router;
