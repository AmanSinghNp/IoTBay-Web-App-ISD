// controllers/deviceController.js
const Device = require("../models/device");

// Show all devices (browse page)
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await Device.findAll();
    res.render("devices", { devices });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch devices.");
  }
};

// Show form to add a new device (only staff)
exports.getAddDeviceForm = (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }
  res.render("devices_form"); // Make sure you have a views/devices_form.ejs
};

// Handle form submission for new device
exports.postAddDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const { name, brand,catalog, price, stock, description } = req.body;

  try {
    await Device.create({ name, brand, catalog,price, stock, description });
    res.redirect("/devices");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create device.");
  }
};
