const { Op } = require("sequelize");
const Device = require("../models/device");

// Show all devices (browse page)
exports.getAllDevices = async (req, res) => {
  const { search, catalog, sort } = req.query;

  const where = {};
  const order = [];

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } },
    ];
  }

  if (catalog && catalog !== "All") {
    where.catalog = catalog;
  }

  if (sort === "price-asc") {
    order.push(["price", "ASC"]);
  } else if (sort === "price-desc") {
    order.push(["price", "DESC"]);
  } else if (sort === "stock-desc") {
    order.push(["stock", "DESC"]);
  } else {
    order.push(["name", "ASC"]);
  }

  try {
    const devices = await Device.findAll({ where, order });

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

// Show form to add a new device (staff only)
exports.getAddDeviceForm = (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  res.render("devices_form");
};

// Handle new device form submission (staff only)
exports.postAddDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const { name, brand, catalog, price, stock, description, imageUrl } =
    req.body;

  try {
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

// View a single device by ID
exports.viewDeviceDetails = async (req, res) => {
  const deviceId = req.params.id;

  try {
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

// Get the edit form
exports.getEditDeviceForm = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;

  try {
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

// Handle the update
exports.updateDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;
  const { name, brand, catalog, price, stock, description, imageUrl } =
    req.body;

  try {
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

// Delete devices
exports.deleteDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;

  try {
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).send("Device not found.");
    }

    await device.destroy();
    res.redirect("/devices");
  } catch (err) {
    console.error("Failed to delete device:", err);
    res.status(500).send("Error deleting device.");
  }
};
