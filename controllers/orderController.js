// controllers/orderController.js
const Order = require("../models/order");
const Device = require("../models/device");

// Shows all orders for the logged-in customer
exports.viewOrders = async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    // Get all orders for this user, newest first
    const orders = await Order.findAll({
      where: { userId: req.session.userId },
      include: [Device], // Include device details
      order: [["createdAt", "DESC"]],
    });

    res.render("orders", { orders });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch orders.");
  }
};

// Show form to create a new order (optional, or can do inline)
// Not necessary if orders are placed directly from devices

// Creates a new order for a device
exports.createOrder = async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const { deviceId, quantity } = req.body;

  try {
    // Check if device exists and has enough stock
    const device = await Device.findByPk(deviceId);

    if (!device || device.stock < quantity) {
      return res.send("Device not available or insufficient stock.");
    }

    // Save the order in database
    await Order.create({
      userId: req.session.userId,
      deviceId: device.id,
      quantity,
      status: "Placed",
    });

    // Update the device stock
    device.stock -= quantity;
    await device.save();

    res.redirect("/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to place order.");
  }
};

// Cancels an order and returns items to stock
exports.cancelOrder = async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const orderId = req.params.id;

  try {
    // Find the order and check if it belongs to this user
    const order = await Order.findByPk(orderId);

    if (!order || order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized.");
    }

    // Only cancel if order is in 'Placed' status
    if (order.status === "Placed") {
      order.status = "Cancelled";
      await order.save();

      // Put items back in stock
      const device = await Device.findByPk(order.deviceId);
      if (device) {
        device.stock += order.quantity;
        await device.save();
      }
    }

    res.redirect("/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to cancel order.");
  }
};

// Updates quantity of items in an order
exports.updateOrder = async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const { quantity } = req.body;
  const orderId = req.params.id;

  try {
    // Find order and check if it belongs to this user
    const order = await Order.findByPk(orderId);

    if (!order || order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized.");
    }

    // Can only update orders that are just placed
    if (order.status !== "Placed") {
      return res.send("Cannot update a finalized order.");
    }

    const device = await Device.findByPk(order.deviceId);

    if (!device) {
      return res.send("Device not found.");
    }

    // Update stock based on quantity change
    const stockChange = order.quantity - quantity;
    device.stock += stockChange;
    await device.save();

    // Save new quantity
    order.quantity = quantity;
    await order.save();

    res.redirect("/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to update order.");
  }
};

// Shows detailed information about a single order
exports.viewOrderDetails = async (req, res) => {
  // Check if user is logged in
  if (!req.session.userId) return res.redirect("/login");

  const orderId = req.params.id;

  try {
    // Get order with device details
    const order = await Order.findByPk(orderId, {
      include: [Device],
    });

    // Check if order exists and belongs to this user
    if (!order || order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized or order not found.");
    }

    res.render("order_details", { order });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load order details.");
  }
};
