// controllers/orderController.js
const Order = require("../models/order");
const Device = require("../models/device");
const Payment = require("../models/payment");
const Shipment = require("../models/shipment");
const OrderItem = require("../models/orderItem");
const { Op } = require("sequelize");

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
    const { deviceId, quantity } = req.body;
    let userId = req.session.userId;

    // Handle anonymous users
    let isAnonymous = false;
    if (!userId) {
      isAnonymous = true;
      if (!req.session.anonymousId) {
        req.session.anonymousId = `anon_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }
      userId = null;
    }

    const device = await Device.findByPk(deviceId);

    if (!device || device.stock < quantity) {
      return res
        .status(400)
        .send("Device not available or insufficient stock.");
    }

    // Create order
    const order = await Order.create({
      userId,
      status: "Placed",
      anonymousId: isAnonymous ? req.session.anonymousId : null,
      anonymousEmail: isAnonymous && req.body.email ? req.body.email : null,
    });

    // Create order item
    await OrderItem.create({
      orderId: order.id,
      deviceId: device.id,
      quantity,
      price: device.price,
    });

    // Decrease device stock
    device.stock -= quantity;
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
    console.error(error);
    res.status(500).send("Failed to place order.");
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
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          include: [Device],
        },
      ],
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

    if (order.status !== "Placed") {
      return res.status(400).send("Cannot update a finalized order.");
    }

    // Process each order item update
    if (orderItems && Array.isArray(orderItems)) {
      for (const item of orderItems) {
        const { id, quantity } = item;
        if (!id || !quantity) continue;

        const orderItem = order.OrderItems.find((i) => i.id === parseInt(id));
        if (!orderItem) continue;

        // Calculate stock adjustment
        const stockChange = orderItem.quantity - quantity;

        // Update device stock
        const device = orderItem.Device;
        if (stockChange > 0 || device.stock >= Math.abs(stockChange)) {
          device.stock += stockChange;
          await device.save();

          // Update order item quantity
          orderItem.quantity = quantity;
          await orderItem.save();
        } else {
          return res
            .status(400)
            .send(`Not enough stock available for ${device.name}`);
        }
      }
    }

    // Redirect based on user type
    if (req.session.userId) {
      res.redirect(`/orders/view/${order.id}`);
    } else {
      res.redirect(`/orders/view/${order.id}?anonymousId=${anonymousId}`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to update order.");
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
