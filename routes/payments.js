// routes/payments.js
const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const Device = require("../models/device");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");

// GET /payments — render the payment page with cartItems
router.get("/payments", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect("/login?redirectTo=/payments");
    }

    // Load this user's cart items and include the Device model
    const cartItems = await Cart.findAll({
      where: { userId },
      include: Device,
    });

    // Render the payments.ejs view, supplying cartItems
    res.render("payments", { cartItems });
  } catch (err) {
    next(err);
  }
});

// POST /payments/new — stub for submission
router.post("/payments/new", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/login");

    // Get all cart items for the user
    const cartItems = await Cart.findAll({
      where: { userId },
      include: Device,
    });
    if (!cartItems.length) return res.redirect("/cart");

    // Create a new order
    const order = await Order.create({ userId });

    // Create order items for each cart item
    for (const item of cartItems) {
      await OrderItem.create({
        orderId: order.id,
        deviceId: item.deviceId,
        quantity: item.quantity,
        price: item.Device.price,
      });
    }

    // Clear the cart
    await Cart.destroy({ where: { userId } });

    // Redirect to order details page
    res.redirect(`/orders/view/${order.id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
