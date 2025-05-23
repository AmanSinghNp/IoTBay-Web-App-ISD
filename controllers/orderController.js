// controllers/orderController.js
const Order = require("../models/order");
const Device = require("../models/device");
const Payment = require("../models/payment");
const Shipment = require("../models/shipment");
const OrderItem = require("../models/orderItem");

// View list of customer's orders
exports.viewOrders = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const orders = await Order.findAll({
      where: { userId: req.session.userId },
      include: [
        {
          model: OrderItem,
          include: [Device],
        },
      ],
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

// Place a new order
exports.createOrder = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const { deviceId, quantity } = req.body;

  try {
    const device = await Device.findByPk(deviceId);

    if (!device || device.stock < quantity) {
      return res.send("Device not available or insufficient stock.");
    }

    // Create order
    await Order.create({
      userId: req.session.userId,
      deviceId: device.id,
      quantity,
      status: "Placed",
    });

    // Decrease device stock
    device.stock -= quantity;
    await device.save();

    res.redirect("/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to place order.");
  }
};

// Cancel an existing order (before final submission)
exports.cancelOrder = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const orderId = req.params.id;

  try {
    const order = await Order.findByPk(orderId);

    if (!order || order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized.");
    }

    if (order.status === "Placed") {
      order.status = "Cancelled";
      await order.save();

      // Refund device stock
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

// (Optional) Update order before final submit — basic version
exports.updateOrder = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const { quantity } = req.body;
  const orderId = req.params.id;

  try {
    const order = await Order.findByPk(orderId);

    if (!order || order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized.");
    }

    if (order.status !== "Placed") {
      return res.send("Cannot update a finalized order.");
    }

    const device = await Device.findByPk(order.deviceId);

    if (!device) {
      return res.send("Device not found.");
    }

    // Adjust stock
    const stockChange = order.quantity - quantity;
    device.stock += stockChange;
    await device.save();

    // Update order
    order.quantity = quantity;
    await order.save();

    res.redirect("/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to update order.");
  }
};

// View single order details
exports.viewOrderDetails = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const orderId = req.params.id;

  try {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          include: [Device],
        },
        Payment,
        Shipment,
      ],
    });

    if (!order || order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized or order not found.");
    }

    res.render("order_details", { order });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load order details.");
  }
};
