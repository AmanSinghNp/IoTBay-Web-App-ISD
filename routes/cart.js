// routes/cart.js
const express = require("express");
const router  = express.Router();
const Device  = require("../models/device");


// GET /cart  — currently just renders an empty cart
router.get("/cart", (req, res) => {
    // TODO: replace [] with req.session.cartItems (array of Device IDs)
    const cartItems = [];
    res.render("cart", { cartItems });
  });

// Show the “Cart” page for a specific product
router.get("/cart/:id", async (req, res, next) => {
  try {
    const product = await Device.findByPk(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    res.render("cart", { product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
