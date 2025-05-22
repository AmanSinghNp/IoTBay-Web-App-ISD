/**
 * IoTBay Web Application
 * Main application entry point
 *
 * This file sets up the Express application, configures middleware,
 * establishes database connections, and defines routing.
 */

// Core dependencies
const express = require("express");
const path = require("path");
const session = require("express-session");
const methodOverride = require("method-override");

// Database and model imports
const sequelize = require("./config/database");
const User = require("./models/user");
const Device = require("./models/device");
const Order = require("./models/order");
const Payment = require("./models/payment");
const Cart = require("./models/cart");
const Shipment = require("./models/shipment");
const Address = require("./models/address");

/**
 * Database Relationships
 * Defines the associations between different models in the application
 */

// User-Cart Relationship (One-to-Many)
User.hasMany(Cart, { foreignKey: "userId" });
Cart.belongsTo(User, { foreignKey: "userId" });

// Device-Cart Relationship (One-to-Many)
Device.hasMany(Cart, { foreignKey: "deviceId" });
Cart.belongsTo(Device, { foreignKey: "deviceId" });

// Order-Shipment Relationship (One-to-One)
Order.hasOne(Shipment, { foreignKey: "orderId" });
Shipment.belongsTo(Order, { foreignKey: "orderId" });

// User-Address Relationship (One-to-Many)
User.hasMany(Address, { foreignKey: "userId" });
Address.belongsTo(User, { foreignKey: "userId" });

// Address-Shipment Relationship (One-to-Many)
Address.hasMany(Shipment, { foreignKey: "addressId" });
Shipment.belongsTo(Address, { foreignKey: "addressId" });

/**
 * Route Imports
 * Import all route handlers for different features
 */
const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/devices");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const userRoutes = require("./routes/user");
const deliveryRoutes = require("./routes/delivery");
const shipmentRoutes = require("./routes/shipment");
const addressRoutes = require("./routes/address");
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const routes = require("./routes");

// Initialize Express application
const app = express();
const PORT = 3000;

/**
 * View Engine Configuration
 * Using EJS as the template engine
 */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/**
 * Middleware Configuration
 */
// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Request body parsing
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Enable PUT/DELETE methods in forms
app.use(methodOverride("_method"));

/**
 * Session Configuration
 * IMPORTANT: Must be configured before routes
 */
app.use(
  session({
    secret: "secret-key", // TODO: Move to environment variable
    resave: false,
    saveUninitialized: true,
  })
);

/**
 * Global Middleware
 */
// Add user information to all views
app.use((req, res, next) => {
  res.locals.userName = req.session.userName || null;
  res.locals.userRole = req.session.userRole || null;
  next();
});

// Flash message handling
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

/**
 * Route Registration
 * Mount all route handlers
 */
app.use("/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/", orderRoutes);
app.use("/", paymentRoutes);
app.use("/", userRoutes);
app.use("/", cartRoutes);
app.use("/", productRoutes);
app.use("/", deliveryRoutes);
app.use("/", shipmentRoutes);
app.use("/", addressRoutes);
app.use("/admin", adminRoutes);

/**
 * Core Application Routes
 */
// Home page
app.get("/", (req, res) => {
  res.render("index");
});

/**
 * Protected Routes
 */
// Dashboard (requires authentication)
app.get("/dashboard", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("dashboard", { userName: req.session.userName });
});

/**
 * Database Synchronization and Server Startup
 * Syncs database schema and starts the Express server
 */
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Database synced");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to sync DB:", err);
  });

/**
 * Error Handling
 */
// 404 Page Handler
app.use((req, res, next) => {
  res.status(404).render("404");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

module.exports = app;
