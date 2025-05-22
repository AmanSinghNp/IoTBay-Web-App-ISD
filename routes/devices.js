const express = require("express");
const router = express.Router();
const Device = require("../models/device");
const auth = require("../middleware/auth");

// Get all devices
router.get("/", auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.catalog) {
      where.catalog = req.query.catalog;
    }

    const devices = await Device.findAll({ where });
    res.json({ devices });
  } catch (error) {
    console.error("List devices error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new device (staff only)
router.post("/", auth, async (req, res) => {
  try {
    // Check if user is staff
    if (req.user.role !== "staff") {
      return res.status(403).json({ error: "Access denied" });
    }

    const device = await Device.create(req.body);
    res.status(201).json({
      message: "Device created successfully",
      device,
    });
  } catch (error) {
    console.error("Create device error:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Update device (staff only)
router.patch("/:id", auth, async (req, res) => {
  try {
    // Check if user is staff
    if (req.user.role !== "staff") {
      return res.status(403).json({ error: "Access denied" });
    }

    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    await device.update(req.body);
    res.json({
      message: "Device updated successfully",
      device,
    });
  } catch (error) {
    console.error("Update device error:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
