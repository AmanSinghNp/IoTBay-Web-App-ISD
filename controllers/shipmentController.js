const Shipment = require("../models/shipment");
const Order = require("../models/order");
const Address = require("../models/address");
const OrderItem = require("../models/orderItem");
const Device = require("../models/device");
const { Op } = require("sequelize");

// View all customer's shipments with search functionality
exports.viewShipments = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const { shipmentId, shipmentDate, orderId } = req.query;
    const userId = req.session.userId;

    // Build search criteria for shipments belonging to user's orders
    const where = {};
    if (shipmentId) where.id = shipmentId;
    if (shipmentDate) where.shipmentDate = shipmentDate;

    // Include orders to filter by user
    const includeOptions = [
      {
        model: Order,
        where: { userId: userId }, // Only user's orders
        include: [
          {
            model: OrderItem,
            include: [Device],
          },
        ],
      },
      Address,
    ];

    // Add order ID filter if provided
    if (orderId) {
      includeOptions[0].where.id = orderId;
    }

    const shipments = await Shipment.findAll({
      where,
      include: includeOptions,
      order: [["createdAt", "DESC"]],
    });

    // Get user's orders for the create shipment dropdown
    const userOrders = await Order.findAll({
      where: {
        userId: userId,
        status: "Placed", // Only allow shipments for placed orders
      },
      include: [
        {
          model: OrderItem,
          include: [Device],
        },
      ],
    });

    // Filter orders that don't already have shipments
    const ordersWithoutShipments = [];
    for (const order of userOrders) {
      const existingShipment = await Shipment.findOne({
        where: { orderId: order.id },
      });
      if (!existingShipment) {
        ordersWithoutShipments.push(order);
      }
    }

    res.render("shipments/index", {
      shipments,
      ordersWithoutShipments,
      searchParams: { shipmentId, shipmentDate, orderId },
    });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    req.session.flash = { error: "Failed to fetch shipments." };
    res.status(500).render("shipments/index", {
      shipments: [],
      ordersWithoutShipments: [],
      searchParams: {},
    });
  }
};

// Show create shipment form
exports.getCreateShipment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.userId;

    // Get user's addresses
    const addresses = await Address.findAll({
      where: { userId: userId },
    });

    // Get user's orders that don't have shipments yet
    const userOrders = await Order.findAll({
      where: {
        userId: userId,
        status: "Placed",
      },
      include: [
        {
          model: OrderItem,
          include: [Device],
        },
      ],
    });

    // Filter orders without existing shipments
    const availableOrders = [];
    for (const order of userOrders) {
      const existingShipment = await Shipment.findOne({
        where: { orderId: order.id },
      });
      if (!existingShipment) {
        availableOrders.push(order);
      }
    }

    res.render("shipments/create", {
      addresses,
      orders: availableOrders,
    });
  } catch (error) {
    console.error("Error loading create shipment form:", error);
    req.session.flash = { error: "Failed to load form." };
    res.redirect("/shipments");
  }
};

// Create new shipment
exports.createShipment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const { orderId, method, shipmentDate, addressId } = req.body;
    const userId = req.session.userId;

    // Verify the order belongs to the current user
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: userId,
        status: "Placed",
      },
    });

    if (!order) {
      req.session.flash = { error: "Invalid order or unauthorized access." };
      return res.redirect("/shipments/create");
    }

    // Check if shipment already exists for this order
    const existingShipment = await Shipment.findOne({ where: { orderId } });
    if (existingShipment) {
      req.session.flash = { error: "Shipment already exists for this order." };
      return res.redirect("/shipments/create");
    }

    // Verify the address belongs to the current user
    const address = await Address.findOne({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!address) {
      req.session.flash = { error: "Invalid address." };
      return res.redirect("/shipments/create");
    }

    // Create shipment
    await Shipment.create({
      orderId,
      method,
      shipmentDate,
      addressId,
      finalised: false,
    });

    req.session.flash = { success: "Shipment created successfully!" };
    res.redirect("/shipments");
  } catch (error) {
    console.error("Error creating shipment:", error);
    req.session.flash = { error: "Failed to create shipment." };
    res.redirect("/shipments/create");
  }
};

// Show shipment details
exports.getShipmentDetails = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const shipmentId = req.params.id;
    const userId = req.session.userId;

    const shipment = await Shipment.findOne({
      where: { id: shipmentId },
      include: [
        {
          model: Order,
          where: { userId: userId }, // Ensure user owns the order
          include: [
            {
              model: OrderItem,
              include: [Device],
            },
          ],
        },
        Address,
      ],
    });

    if (!shipment) {
      req.session.flash = {
        error: "Shipment not found or unauthorized access.",
      };
      return res.redirect("/shipments");
    }

    res.render("shipments/details", { shipment });
  } catch (error) {
    console.error("Error fetching shipment details:", error);
    req.session.flash = { error: "Failed to load shipment details." };
    res.redirect("/shipments");
  }
};

// Show edit shipment form
exports.getEditShipment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const shipmentId = req.params.id;
    const userId = req.session.userId;

    const shipment = await Shipment.findOne({
      where: { id: shipmentId },
      include: [
        {
          model: Order,
          where: { userId: userId },
        },
      ],
    });

    if (!shipment) {
      req.session.flash = {
        error: "Shipment not found or unauthorized access.",
      };
      return res.redirect("/shipments");
    }

    if (shipment.finalised) {
      req.session.flash = { error: "Cannot edit finalized shipment." };
      return res.redirect("/shipments");
    }

    // Get user's addresses
    const addresses = await Address.findAll({
      where: { userId: userId },
    });

    res.render("shipments/edit", { shipment, addresses });
  } catch (error) {
    console.error("Error loading edit shipment form:", error);
    req.session.flash = { error: "Failed to load edit form." };
    res.redirect("/shipments");
  }
};

// Update shipment
exports.updateShipment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const shipmentId = req.params.id;
    const { method, shipmentDate, addressId } = req.body;
    const userId = req.session.userId;

    const shipment = await Shipment.findOne({
      where: { id: shipmentId },
      include: [
        {
          model: Order,
          where: { userId: userId },
        },
      ],
    });

    if (!shipment) {
      req.session.flash = {
        error: "Shipment not found or unauthorized access.",
      };
      return res.redirect("/shipments");
    }

    if (shipment.finalised) {
      req.session.flash = { error: "Cannot update finalized shipment." };
      return res.redirect("/shipments");
    }

    // Verify the address belongs to the current user
    const address = await Address.findOne({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!address) {
      req.session.flash = { error: "Invalid address." };
      return res.redirect(`/shipments/${shipmentId}/edit`);
    }

    await shipment.update({
      method,
      shipmentDate,
      addressId,
    });

    req.session.flash = { success: "Shipment updated successfully!" };
    res.redirect("/shipments");
  } catch (error) {
    console.error("Error updating shipment:", error);
    req.session.flash = { error: "Failed to update shipment." };
    res.redirect(`/shipments/${req.params.id}/edit`);
  }
};

// Delete shipment
exports.deleteShipment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const shipmentId = req.params.id;
    const userId = req.session.userId;

    const shipment = await Shipment.findOne({
      where: { id: shipmentId },
      include: [
        {
          model: Order,
          where: { userId: userId },
        },
      ],
    });

    if (!shipment) {
      req.session.flash = {
        error: "Shipment not found or unauthorized access.",
      };
      return res.redirect("/shipments");
    }

    if (shipment.finalised) {
      req.session.flash = { error: "Cannot delete finalized shipment." };
      return res.redirect("/shipments");
    }

    await shipment.destroy();
    req.session.flash = { success: "Shipment deleted successfully!" };
    res.redirect("/shipments");
  } catch (error) {
    console.error("Error deleting shipment:", error);
    req.session.flash = { error: "Failed to delete shipment." };
    res.redirect("/shipments");
  }
};

// Finalize shipment (prevent further edits)
exports.finalizeShipment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const shipmentId = req.params.id;
    const userId = req.session.userId;

    const shipment = await Shipment.findOne({
      where: { id: shipmentId },
      include: [
        {
          model: Order,
          where: { userId: userId },
        },
      ],
    });

    if (!shipment) {
      req.session.flash = {
        error: "Shipment not found or unauthorized access.",
      };
      return res.redirect("/shipments");
    }

    if (shipment.finalised) {
      req.session.flash = { error: "Shipment is already finalized." };
      return res.redirect("/shipments");
    }

    await shipment.update({ finalised: true });
    req.session.flash = { success: "Shipment finalized successfully!" };
    res.redirect("/shipments");
  } catch (error) {
    console.error("Error finalizing shipment:", error);
    req.session.flash = { error: "Failed to finalize shipment." };
    res.redirect("/shipments");
  }
};
