// routes/orders.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Show all orders for the logged-in user
router.get("/orders", orderController.viewOrders);

// Create a new order (via form submission)
router.post("/orders/new", orderController.createOrder);

// Get form to edit an order
router.get("/orders/edit/:id", orderController.getEditOrderForm);

// Update an order's quantity
router.post("/orders/update/:id", orderController.updateOrder);

// Cancel an existing order
router.post("/orders/cancel/:id", orderController.cancelOrder);

// View details of a specific order
router.get("/orders/view/:id", orderController.viewOrderDetails);

module.exports = router;
