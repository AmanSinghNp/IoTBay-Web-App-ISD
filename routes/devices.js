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

module.exports = router;
