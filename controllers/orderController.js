// controllers/orderController.js
const Order = require("../models/order");
const Device = require("../models/device");
const Payment = require("../models/payment");
const Shipment = require("../models/shipment");
const OrderItem = require("../models/orderItem");
const { Op } = require("sequelize");

// Validation helper functions
const validateDeviceId = (deviceId) => {
  if (!deviceId) return { valid: false, message: "Device ID is required." };

  const numDeviceId = parseInt(deviceId);
  if (isNaN(numDeviceId) || numDeviceId <= 0) {
    return { valid: false, message: "Invalid device ID." };
  }

  return { valid: true };
};

const validateQuantity = (quantity) => {
  if (!quantity && quantity !== 0)
    return { valid: false, message: "Quantity is required." };

  const numQuantity = parseInt(quantity);
  if (isNaN(numQuantity))
    return { valid: false, message: "Quantity must be a valid number." };
  if (numQuantity <= 0)
    return { valid: false, message: "Quantity must be greater than zero." };
  if (numQuantity > 999)
    return { valid: false, message: "Quantity cannot exceed 999 items." };
  if (!Number.isInteger(parseFloat(quantity)))
    return { valid: false, message: "Quantity must be a whole number." };

  return { valid: true };
};

const validateEmail = (email) => {
  if (!email)
    return { valid: false, message: "Email is required for anonymous orders." };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return { valid: false, message: "Please enter a valid email address." };
  if (email.length > 255)
    return { valid: false, message: "Email address is too long." };
  return { valid: true };
};

const validateOrderItems = (orderItems) => {
  if (!orderItems || !Array.isArray(orderItems)) {
    return { valid: false, message: "Order items are required." };
  }

  if (orderItems.length === 0) {
    return { valid: false, message: "At least one order item is required." };
  }

  for (const item of orderItems) {
    if (!item.id || !item.quantity) {
      return {
        valid: false,
        message: "Each order item must have an ID and quantity.",
      };
    }

    const quantityValidation = validateQuantity(item.quantity);
    if (!quantityValidation.valid) {
      return {
        valid: false,
        message: `Item ${item.id}: ${quantityValidation.message}`,
      };
    }
  }

  return { valid: true };
};

// View list of customer's orders
exports.viewOrders = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const { orderNumber, startDate, endDate } = req.query;
    const where = { userId: req.session.userId };

    // Add search filters if provided
    if (orderNumber) {
      where.id = orderNumber;
    }

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }

      if (endDate) {
        // Add one day to include the end date fully
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.createdAt[Op.lt] = nextDay;
      }
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          include: [Device],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.render("orders", {
      orders,
      searchParams: { orderNumber, startDate, endDate },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch orders.");
  }
};

// Show form to create a new order (optional, or can do inline)
// Not necessary if orders are placed directly from devices

// Place a new order
exports.createOrder = async (req, res) => {
  try {
    const { deviceId, quantity, email } = req.body;
    let userId = req.session.userId;

    // Comprehensive server-side validation
    const errors = [];

    // Device ID validation
    const deviceIdValidation = validateDeviceId(deviceId);
    if (!deviceIdValidation.valid) {
      errors.push(deviceIdValidation.message);
    }

    // Quantity validation
    const quantityValidation = validateQuantity(quantity);
    if (!quantityValidation.valid) {
      errors.push(quantityValidation.message);
    }

    // Handle anonymous users
    let isAnonymous = false;
    if (!userId) {
      isAnonymous = true;

      // Email validation for anonymous users
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        errors.push(emailValidation.message);
      }

      if (!req.session.anonymousId) {
        req.session.anonymousId = `anon_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }
      userId = null;
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
      });
    }

    // Verify device exists and has sufficient stock
    const device = await Device.findByPk(parseInt(deviceId));

    if (!device) {
      return res.status(400).json({
        success: false,
        errors: ["Device not found."],
      });
    }

    if (device.stock < parseInt(quantity)) {
      return res.status(400).json({
        success: false,
        errors: [`Insufficient stock. Only ${device.stock} items available.`],
      });
    }

    // Create order
    const order = await Order.create({
      userId,
      status: "Placed",
      anonymousId: isAnonymous ? req.session.anonymousId : null,
      anonymousEmail: isAnonymous ? email.trim().toLowerCase() : null,
    });

    // Create order item
    await OrderItem.create({
      orderId: order.id,
      deviceId: device.id,
      quantity: parseInt(quantity),
      price: device.price,
    });

    // Decrease device stock
    device.stock -= parseInt(quantity);
    await device.save();

    // Store anonymous orders in session for retrieval
    if (isAnonymous) {
      if (!req.session.anonymousOrders) {
        req.session.anonymousOrders = [];
      }
      req.session.anonymousOrders.push(order.id);
      return res.redirect(
        `/orders/view/${order.id}?anonymousId=${req.session.anonymousId}`
      );
    }

    res.redirect("/orders");
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      errors: ["Failed to place order. Please try again."],
    });
  }
};

// Cancel an existing order (before final submission)
exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;
  const anonymousId = req.query.anonymousId || null;

  try {
    const order = await Order.findByPk(orderId, {
      include: [OrderItem],
    });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    // Check authorization for registered users
    if (req.session.userId && order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized.");
    }

    // Check authorization for anonymous users
    if (
      !req.session.userId &&
      (!anonymousId ||
        order.anonymousId !== anonymousId ||
        !req.session.anonymousOrders ||
        !req.session.anonymousOrders.includes(parseInt(orderId)))
    ) {
      return res.status(403).send("Unauthorized.");
    }

    if (order.status === "Placed") {
      order.status = "Cancelled";
      await order.save();

      // Refund device stock for each order item
      for (const item of order.OrderItems) {
        const device = await Device.findByPk(item.deviceId);
        if (device) {
          device.stock += item.quantity;
          await device.save();
        }
      }
    } else {
      return res
        .status(400)
        .send("Order cannot be cancelled in its current state.");
    }

    // Redirect based on user type
    if (req.session.userId) {
      res.redirect("/orders");
    } else {
      res.redirect(`/orders/view/${order.id}?anonymousId=${anonymousId}`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to cancel order.");
  }
};

// Update order before final submit - enhanced version
exports.updateOrder = async (req, res) => {
  const orderId = req.params.id;
  const anonymousId = req.query.anonymousId || null;
  const { orderItems } = req.body;

  try {
    // Comprehensive server-side validation
    const errors = [];

    // Order items validation
    const orderItemsValidation = validateOrderItems(orderItems);
    if (!orderItemsValidation.valid) {
      errors.push(orderItemsValidation.message);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
      });
    }

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          include: [Device],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        errors: ["Order not found."],
      });
    }

    // Check authorization for registered users
    if (req.session.userId && order.userId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        errors: ["Unauthorized access."],
      });
    }

    // Check authorization for anonymous users
    if (
      !req.session.userId &&
      (!anonymousId ||
        order.anonymousId !== anonymousId ||
        !req.session.anonymousOrders ||
        !req.session.anonymousOrders.includes(parseInt(orderId)))
    ) {
      return res.status(403).json({
        success: false,
        errors: ["Unauthorized access."],
      });
    }

    if (order.status !== "Placed") {
      return res.status(400).json({
        success: false,
        errors: ["Cannot update a finalized order."],
      });
    }

    // Process each order item update
    const updateErrors = [];

    for (const item of orderItems) {
      const { id, quantity } = item;
      const newQuantity = parseInt(quantity);

      const orderItem = order.OrderItems.find((i) => i.id === parseInt(id));
      if (!orderItem) {
        updateErrors.push(`Order item ${id} not found.`);
        continue;
      }

      // Calculate stock adjustment
      const stockChange = orderItem.quantity - newQuantity;
      const device = orderItem.Device;

      // Check if we have enough stock for the new quantity
      if (stockChange < 0 && device.stock < Math.abs(stockChange)) {
        updateErrors.push(
          `Insufficient stock for ${device.name}. Only ${
            device.stock + orderItem.quantity
          } items available.`
        );
        continue;
      }

      // Update device stock
      device.stock += stockChange;
      await device.save();

      // Update order item quantity
      orderItem.quantity = newQuantity;
      await orderItem.save();
    }

    if (updateErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: updateErrors,
      });
    }

    // Redirect based on user type
    if (req.session.userId) {
      res.redirect("/orders");
    } else {
      res.redirect(`/orders/view/${order.id}?anonymousId=${anonymousId}`);
    }
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      success: false,
      errors: ["Failed to update order. Please try again."],
    });
  }
};

// View single order details
exports.viewOrderDetails = async (req, res) => {
  const orderId = req.params.id;
  const anonymousId = req.query.anonymousId || null;

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

    if (!order) {
      return res.status(404).render("404", { message: "Order not found" });
    }

    // Check authorization for registered users
    if (req.session.userId && order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized.");
    }

    // Check authorization for anonymous users
    if (
      !req.session.userId &&
      (!anonymousId ||
        order.anonymousId !== anonymousId ||
        !req.session.anonymousOrders ||
        !req.session.anonymousOrders.includes(parseInt(orderId)))
    ) {
      return res.status(403).send("Unauthorized.");
    }

    res.render("order_details", { order, anonymousId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load order details.");
  }
};

// Get form for editing an order
exports.getEditOrderForm = async (req, res) => {
  const orderId = req.params.id;
  const anonymousId = req.query.anonymousId || null;

  try {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          include: [Device],
        },
      ],
    });

    if (!order) {
      return res.status(404).render("404", { message: "Order not found" });
    }

    // Check authorization for registered users
    if (req.session.userId && order.userId !== req.session.userId) {
      return res.status(403).send("Unauthorized.");
    }

    // Check authorization for anonymous users
    if (
      !req.session.userId &&
      (!anonymousId ||
        order.anonymousId !== anonymousId ||
        !req.session.anonymousOrders ||
        !req.session.anonymousOrders.includes(parseInt(orderId)))
    ) {
      return res.status(403).send("Unauthorized.");
    }

    if (order.status !== "Placed") {
      return res
        .status(400)
        .send("Cannot edit a finalized or cancelled order.");
    }

    res.render("edit_order", { order, anonymousId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load order edit form.");
  }
};
