// routes/orders.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// View all orders (for logged-in user)
router.get("/orders", orderController.viewOrders);

// Create a new order (placing an order)
router.post("/orders/new", orderController.createOrder);

// Cancel an order (before finalization)
router.post("/orders/cancel/:id", orderController.cancelOrder);

// Update an order quantity (before finalization)
router.post("/orders/update/:id", orderController.updateOrder);

module.exports = router;
