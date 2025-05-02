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
    const { name, brand, catalog, price, stock, description } = req.body;
    await Device.create({ name, brand, catalog, price, stock, description });
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

module.exports = router;
