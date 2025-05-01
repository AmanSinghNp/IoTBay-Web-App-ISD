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
    const { name, brand,catalog, price, stock, description } = req.body;
    await Device.create({ name, brand,catalog, price, stock, description });
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
    // 1. Clear out every row in Devices
    await Device.destroy({ where: {} });

    
   
  
    const dummyDevices = [
      { name: "Smart Light Bulb", brand: "Philips",catalog:"Lighting", price: 29.99, stock: 100, description: "Wi-Fi enabled smart bulb" },
      { name: "Smart Thermostat", brand: "Nest",catalog:" Home Improvement", price: 199.99, stock: 50, description: "Energy-saving thermostat" },
      { name: "Security Camera", brand: "Ring", catalog:"Electronics",price: 149.99, stock: 30, description: "1080p wireless camera" },
      { name: "Smart Door Lock", brand: "August",catalog:"Home Improvement", price: 249.99, stock: 20, description: "Keyless entry system" },
      { name: "Fitness Tracker", brand: "Fitbit",catalog:"Sports, Fitness & Outdoors", price: 99.99, stock: 80, description: "Track your daily fitness" },
      { name: "Smart Plug", brand: "TP-Link",catalog:"Home Improvement", price: 24.99, stock: 150, description: "Control outlets remotely" },
      { name: "Indoor Air Quality Monitor", brand: "Awair",catalog:" Electronics", price: 119.99, stock: 40, description: "Monitor air quality" },
      { name: "LED Smart Strip",            brand: "Govee",      catalog: "Lighting",               price: 49.99,   stock: 80,  description: "RGBIC addressable LED strip" },
      { name: "Smart Ceiling Lamp",         brand: "Yeelight",   catalog: "Lighting",               price: 59.99,   stock: 60,  description: "Dimmable ceiling light with app control" },
      { name: "Outdoor Smart Floodlight",   brand: "Ring",       catalog: "Lighting",               price: 89.99,   stock: 40,  description: "Motion-activated floodlight camera" },
      { name: "Smart Desk Lamp",            brand: "Xiaomi",     catalog: "Lighting",               price: 39.99,   stock: 75,  description: "Adjustable color temperature desk lamp" },
      { name: "Smart Candle Light",         brand: "Philips",    catalog: "Lighting",               price: 24.99,   stock: 110, description: "Flameless ambient candle light" },
      { name: "Smart Night Light",          brand: "TP-Link",    catalog: "Lighting",               price: 19.99,   stock: 130, description: "Plug-in night light with motion sensor" },
      { name: "Smart Plug Mini",            brand: "TP-Link",    catalog: "Home Improvement",       price: 24.99,   stock: 150, description: "Compact Wi-Fi outlet adapter" },
      { name: "Smart Dimmer Switch",        brand: "Lutron",     catalog: "Home Improvement",       price: 59.99,   stock: 70,  description: "Voice-controlled dimmer switch" },
      { name: "Smart Garage Door Opener",   brand: "Chamberlain",catalog: "Home Improvement",       price: 149.99,  stock: 30,  description: "Wi-Fi enabled garage controller" },
      { name: "Smart Smoke Detector",       brand: "Google",     catalog: "Home Improvement",       price: 119.99,  stock: 55,  description: "Carbon monoxide + smoke alarm" },
      { name: "Smart Leak Sensor",          brand: "Honeywell",  catalog: "Home Improvement",       price: 34.99,   stock: 90,  description: "Water leak & freeze detector" },
      { name: "Smart Light Switch Kit",     brand: "WeMo",       catalog: "Home Improvement",       price: 49.99,   stock: 65,  description: "Wi-Fi smart switch and hub kit" },
      { name: "Video Doorbell 3",           brand: "Ring",       catalog: "Electronics",            price: 229.99,  stock: 30,  description: "1080p HDR video doorbell" },
     { name: "Wi-Fi Mesh Router",          brand: "TP-Link",    catalog: " Electronics",            price: 129.99,  stock: 60,  description: "Deco mesh Wi-Fi system (3 pack)" },
     { name: "Smart Speaker",              brand: "Amazon",     catalog: " Electronics",            price: 99.99,   stock: 100, description: "Echo Dot (5th Gen)" },
    { name: "Smart Display",              brand: "Google",     catalog: "Electronics",            price: 149.99,  stock: 45,  description: "Nest Hub with ambient EQ" },
    { name: "Smart IR Blaster",           brand: "BroadLink",  catalog: "Electronics",            price: 39.99,   stock: 80,  description: "Universal remote control hub" },
    { name: "Smart Air Purifier",         brand: "Levoit",     catalog: "Electronics",            price: 129.99,  stock: 50,  description: "HEPA Wi-Fi air purifier" },   
  { name: "Smart Bike Light",           brand: "Garmin",     catalog: "Sports, Fitness & Outdoors", price: 79.99,   stock: 60,  description: "Rechargeable front/rear bike light" },
  { name: "Smart Scale",                brand: "Withings",   catalog: "Sports, Fitness & Outdoors", price: 129.99,  stock: 40,  description: "Body composition smart scale" },
  { name: "Smart Yoga Mat",             brand: "YogiFi",     catalog: "Sports, Fitness & Outdoors", price: 199.99,  stock: 25,  description: "Interactive workout mat" },
  { name: "Smart Jump Rope",            brand: "Tangram",    catalog: "Sports, Fitness & Outdoors", price: 49.99,   stock: 55,  description: "Bluetooth connected jump rope" },
    ];

    await Device.bulkCreate(dummyDevices);

    res.send("✅ Dummy devices added successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to seed devices.");
  }
});

module.exports = router;
