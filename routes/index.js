const express = require("express");
const router = express.Router();

// Route modules
const userRoutes = require("./user");
const deviceRoutes = require("./devices");
const orderRoutes = require("./orders");
const paymentRoutes = require("./payments");
const authRoutes = require("./auth");
const cartRoutes = require("./cart");
 // If separate

// Mount routes
router.use("/", authRoutes); // login, register, logout
router.use("/", userRoutes); // profile, dashboard, access-log
router.use("/", deviceRoutes); // /devices/*
router.use("/", orderRoutes); // /orders/*
router.use("/", paymentRoutes);
router.use("/", cartRoutes);

// /payments/*

module.exports = router;
