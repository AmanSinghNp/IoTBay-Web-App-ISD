const express = require("express");
const router = express.Router();
const Device = require("../models/device");

// GET /devices/new (show form)
router.get("/devices/new", (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied");
  }
  res.render("devices_form");
});

// POST /devices/new (submit form)
router.post("/devices/new", async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied");
  }

  try {
    const { name, brand, price, stock, description } = req.body;
    await Device.create({ name, brand, price, stock, description });
    res.redirect("/devices");
  } catch (err) {
    res.status(500).send("Failed to create device");
  }
});

// GET /devices (list all devices)
router.get("/devices", async (req, res) => {
  try {
    const devices = await Device.findAll();
    res.render("devices_list", { devices }); // Ensure you have devices_list.ejs
  } catch (err) {
    res.status(500).send("Failed to load devices");
  }
});

// 🚀 Dummy Devices Route (for development/testing)
router.get("/adddummydevices", async (req, res) => {
  try {
    const dummyDevices = [
      { name: "Smart Light Bulb", brand: "Philips", price: 29.99, stock: 100, description: "Wi-Fi enabled smart bulb" },
      { name: "Smart Thermostat", brand: "Nest", price: 199.99, stock: 50, description: "Energy-saving thermostat" },
      { name: "Security Camera", brand: "Ring", price: 149.99, stock: 30, description: "1080p wireless camera" },
      { name: "Smart Door Lock", brand: "August", price: 249.99, stock: 20, description: "Keyless entry system" },
      { name: "Fitness Tracker", brand: "Fitbit", price: 99.99, stock: 80, description: "Track your daily fitness" },
      { name: "Smart Plug", brand: "TP-Link", price: 24.99, stock: 150, description: "Control outlets remotely" },
      { name: "Indoor Air Quality Monitor", brand: "Awair", price: 119.99, stock: 40, description: "Monitor air quality" }
    ];

    // Insert all dummy devices
    await Device.bulkCreate(dummyDevices);

    res.send("✅ Dummy devices added successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Failed to add dummy devices.");
  }
});

module.exports = router;
