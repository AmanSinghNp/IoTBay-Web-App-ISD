const Shipment = require("../models/shipment");
const Order = require("../models/order");
const Address = require("../models/address");
const OrderItem = require("../models/orderItem");
const Device = require("../models/device");
const { Op } = require("sequelize");

// Validation helper functions
const validateShipmentMethod = (method) => {
  if (!method || !method.trim())
    return { valid: false, message: "Shipment method is required." };

  const validMethods = [
    "standard",
    "express",
    "overnight",
    "pickup",
    "courier",
  ];
  if (!validMethods.includes(method.toLowerCase())) {
    return { valid: false, message: "Invalid shipment method selected." };
  }

  return { valid: true };
};

const validateShipmentDate = (shipmentDate) => {
  if (!shipmentDate)
    return { valid: false, message: "Shipment date is required." };

  const date = new Date(shipmentDate);
  if (isNaN(date.getTime()))
    return { valid: false, message: "Invalid shipment date." };

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Reset time to start of day

  const shipDate = new Date(shipmentDate);
  shipDate.setHours(0, 0, 0, 0);

  // Shipment date cannot be in the past
  if (shipDate < currentDate) {
    return { valid: false, message: "Shipment date cannot be in the past." };
  }

  // Shipment date cannot be more than 90 days in the future
  const maxFutureDate = new Date();
  maxFutureDate.setDate(currentDate.getDate() + 90);

  if (shipDate > maxFutureDate) {
    return {
      valid: false,
      message: "Shipment date cannot be more than 90 days in the future.",
    };
  }

  return { valid: true };
};

const validateOrderId = (orderId) => {
  if (!orderId) return { valid: false, message: "Order ID is required." };

  const numOrderId = parseInt(orderId);
  if (isNaN(numOrderId) || numOrderId <= 0) {
    return { valid: false, message: "Invalid order ID." };
  }

  return { valid: true };
};

const validateAddressId = (addressId) => {
  if (!addressId) return { valid: false, message: "Address is required." };

  const numAddressId = parseInt(addressId);
  if (isNaN(numAddressId) || numAddressId <= 0) {
    return { valid: false, message: "Invalid address selected." };
  }

  return { valid: true };
};

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

    // Comprehensive server-side validation
    const errors = [];

    // Order ID validation
    const orderIdValidation = validateOrderId(orderId);
    if (!orderIdValidation.valid) {
      errors.push(orderIdValidation.message);
    }

    // Method validation
    const methodValidation = validateShipmentMethod(method);
    if (!methodValidation.valid) {
      errors.push(methodValidation.message);
    }

    // Shipment date validation
    const dateValidation = validateShipmentDate(shipmentDate);
    if (!dateValidation.valid) {
      errors.push(dateValidation.message);
    }

    // Address ID validation
    const addressIdValidation = validateAddressId(addressId);
    if (!addressIdValidation.valid) {
      errors.push(addressIdValidation.message);
    }

    if (errors.length > 0) {
      // Get data needed for re-rendering the form
      const addresses = await Address.findAll({
        where: { userId: userId },
      });

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

      const availableOrders = [];
      for (const order of userOrders) {
        const existingShipment = await Shipment.findOne({
          where: { orderId: order.id },
        });
        if (!existingShipment) {
          availableOrders.push(order);
        }
      }

      return res.render("shipments/create", {
        addresses,
        orders: availableOrders,
        errors: errors,
        formData: { orderId, method, shipmentDate, addressId },
      });
    }

    // Verify the order belongs to the current user
    const order = await Order.findOne({
      where: {
        id: parseInt(orderId),
        userId: userId,
        status: "Placed",
      },
    });

    if (!order) {
      const addresses = await Address.findAll({
        where: { userId: userId },
      });

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

      return res.render("shipments/create", {
        addresses,
        orders: userOrders,
        errors: ["Invalid order or unauthorized access."],
        formData: { orderId, method, shipmentDate, addressId },
      });
    }

    // Check if shipment already exists for this order
    const existingShipment = await Shipment.findOne({
      where: { orderId: parseInt(orderId) },
    });
    if (existingShipment) {
      const addresses = await Address.findAll({
        where: { userId: userId },
      });

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

      return res.render("shipments/create", {
        addresses,
        orders: userOrders,
        errors: ["Shipment already exists for this order."],
        formData: { orderId, method, shipmentDate, addressId },
      });
    }

    // Verify the address belongs to the current user
    const address = await Address.findOne({
      where: {
        id: parseInt(addressId),
        userId: userId,
      },
    });

    if (!address) {
      const addresses = await Address.findAll({
        where: { userId: userId },
      });

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

      return res.render("shipments/create", {
        addresses,
        orders: userOrders,
        errors: ["Invalid address selected."],
        formData: { orderId, method, shipmentDate, addressId },
      });
    }

    // Create shipment
    await Shipment.create({
      orderId: parseInt(orderId),
      method: method.toLowerCase(),
      shipmentDate,
      addressId: parseInt(addressId),
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

    // Comprehensive server-side validation
    const errors = [];

    // Method validation
    const methodValidation = validateShipmentMethod(method);
    if (!methodValidation.valid) {
      errors.push(methodValidation.message);
    }

    // Shipment date validation
    const dateValidation = validateShipmentDate(shipmentDate);
    if (!dateValidation.valid) {
      errors.push(dateValidation.message);
    }

    // Address ID validation
    const addressIdValidation = validateAddressId(addressId);
    if (!addressIdValidation.valid) {
      errors.push(addressIdValidation.message);
    }

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

    if (errors.length > 0) {
      // Get user's addresses for re-rendering the form
      const addresses = await Address.findAll({
        where: { userId: userId },
      });

      return res.render("shipments/edit", {
        shipment: { ...shipment.dataValues, method, shipmentDate, addressId },
        addresses,
        errors: errors,
      });
    }

    // Verify the address belongs to the current user
    const address = await Address.findOne({
      where: {
        id: parseInt(addressId),
        userId: userId,
      },
    });

    if (!address) {
      const addresses = await Address.findAll({
        where: { userId: userId },
      });

      return res.render("shipments/edit", {
        shipment: { ...shipment.dataValues, method, shipmentDate, addressId },
        addresses,
        errors: ["Invalid address selected."],
      });
    }

    await shipment.update({
      method: method.toLowerCase(),
      shipmentDate,
      addressId: parseInt(addressId),
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
