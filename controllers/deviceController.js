/**
 * Device Controller
 * Handles all device-related operations in the IoTBay system
 *
 * @module controllers/deviceController
 * @description Manages device listing, creation, updates, and deletion
 */

const { Op } = require("sequelize");
const Device = require("../models/device");

/**
 * Display all devices with optional filtering and sorting
 * @function getAllDevices
 * @async
 *
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.search] - Search term for name/brand
 * @param {string} [req.query.catalog] - Filter by device catalog
 * @param {string} [req.query.sort] - Sorting option (price-asc/price-desc/stock-desc/brand-asc)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Renders devices page with filtered results
 */
exports.getAllDevices = async (req, res) => {
  const { search, catalog, sort } = req.query;

  // Set up search conditions
  const where = {};
  const order = [];

  // Add search filter for name or brand
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } },
    ];
  }

  // Filter by device category
  if (catalog && catalog !== "All") {
    where.catalog = catalog;
  }

  // Set up sorting order
  if (sort === "price-asc") {
    order.push(["price", "ASC"]);
  } else if (sort === "price-desc") {
    order.push(["price", "DESC"]);
  } else if (sort === "stock-desc") {
    order.push(["stock", "DESC"]);
  } else if (sort === "brand-asc") {
    order.push(["brand", "ASC"], ["name", "ASC"]);
  } else {
    order.push(["name", "ASC"]); // Default sort by name
  }

  try {
    // Get filtered list of devices
    const devices = await Device.findAll({ where, order });

    // Get list of categories for filter dropdown
    const catalogs = await Device.findAll({
      attributes: ["catalog"],
      group: ["catalog"],
    });
    const catalogOptions = catalogs.map((device) => device.catalog);

    res.render("devices", {
      devices,
      userRole: req.session.userRole,
      filters: { search, catalog, sort },
      catalogOptions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch filtered devices.");
  }
};

/**
 * Display form for adding a new device
 * @function getAddDeviceForm
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @access Staff only
 * @returns {void} Renders device creation form
 */
exports.getAddDeviceForm = (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  res.render("devices_form");
};

/**
 * Create a new device
 * @function postAddDevice
 * @async
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing device details
 * @param {Object} res - Express response object
 * @access Staff only
 * @returns {Promise<void>} Redirects to devices list on success
 */
exports.postAddDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const { name, brand, catalog, price, stock, description, imageUrl } =
    req.body;

  try {
    // Save new device to database
    await Device.create({
      name,
      brand,
      catalog,
      price,
      stock,
      description,
      imageUrl,
    });
    res.redirect("/devices");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create device.");
  }
};

/**
 * Display details of a specific device
 * @function viewDeviceDetails
 * @async
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Device ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Renders device details page
 */
exports.viewDeviceDetails = async (req, res) => {
  const deviceId = req.params.id;

  try {
    // Find device by ID
    const device = await Device.findByPk(deviceId);

    if (!device) {
      return res.status(404).render("404", { message: "Device not found" });
    }

    res.render("device_details", { device });
  } catch (err) {
    console.error("Failed to fetch device:", err);
    res.status(500).send("Failed to load device details.");
  }
};

/**
 * Display form for editing a device
 * @function getEditDeviceForm
 * @async
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Device ID
 * @param {Object} res - Express response object
 * @access Staff only
 * @returns {Promise<void>} Renders device edit form
 */
exports.getEditDeviceForm = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;

  try {
    // Find device to edit
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).send("Device not found.");
    }

    res.render("edit_device", { device });
  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).send("Failed to load device for editing.");
  }
};

/**
 * Update an existing device
 * @function updateDevice
 * @async
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Device ID
 * @param {Object} req.body - Updated device details
 * @param {Object} res - Express response object
 * @access Staff only
 * @returns {Promise<void>} Redirects to devices list on success
 */
exports.updateDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;
  const { name, brand, catalog, price, stock, description, imageUrl } =
    req.body;

  try {
    // Find and update the device
    const device = await Device.findByPk(deviceId);
    if (!device) return res.status(404).send("Device not found.");

    await device.update({
      name,
      brand,
      catalog,
      price,
      stock,
      description,
      imageUrl,
    });
    res.redirect("/devices");
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).send("Failed to update device.");
  }
};

/**
 * Delete a device
 * @function deleteDevice
 * @async
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Device ID
 * @param {Object} res - Express response object
 * @access Staff only
 * @returns {Promise<void>} Redirects to devices list on success
 */
exports.deleteDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;

  try {
    // Find and delete the device
    const device = await Device.findByPk(deviceId);
    if (!device) return res.status(404).send("Device not found.");

    await device.destroy();
    res.redirect("/devices");
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).send("Failed to delete device.");
  }
};
