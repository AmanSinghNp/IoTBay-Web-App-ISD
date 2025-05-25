const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");

const sequelize = require("./config/database");
const User = require("./models/user");
const Device = require("./models/device");
const Order = require("./models/order");
const Payment = require("./models/paymentSequelize"); // New Sequelize-based Payment model
const Cart = require("./models/cart");
const Shipment = require("./models/shipment");
const Address = require("./models/address");

// Define the relationships:
User.hasMany(Cart, { foreignKey: "userId" });
Cart.belongsTo(User, { foreignKey: "userId" });

Device.hasMany(Cart, { foreignKey: "deviceId" });
Cart.belongsTo(Device, { foreignKey: "deviceId" });

Order.hasOne(Shipment, { foreignKey: "orderId" });
Shipment.belongsTo(Order, { foreignKey: "orderId" });

User.hasMany(Address, { foreignKey: "userId" });
Address.belongsTo(User, { foreignKey: "userId" });

Address.hasMany(Shipment, { foreignKey: "addressId" });
Shipment.belongsTo(Address, { foreignKey: "addressId" });

// Payment relationships
User.hasMany(Payment, { foreignKey: "userId" });
Payment.belongsTo(User, { foreignKey: "userId" });

Order.hasMany(Payment, { foreignKey: "orderId" });
Payment.belongsTo(Order, { foreignKey: "orderId" });

// Import routes
const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/devices");
const orderRoutes = require("./routes/orders");
const checkoutRoutes = require("./routes/payments"); // Old checkout system
const paymentManagementRoutes = require("./routes/paymentRoutes"); // New payment management system
const userRoutes = require("./routes/user");
const deliveryRoutes = require("./routes/delivery");
const shipmentRoutes = require("./routes/shipment");
const addressRoutes = require("./routes/address");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const adminUserRoutes = require("./routes/adminUsers"); // Admin user management

const app = express();
const PORT = 3000;

// View engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Public static folder
app.use(express.static(path.join(__dirname, "public")));

// express parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(
  session({
    secret: "your-secret-key", // This is fine for a university assignment
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// Flash middleware
app.use(flash());

// Add userName to all views
app.use((req, res, next) => {
  res.locals.userName = req.session.userName || null;
  res.locals.userRole = req.session.userRole || null;
  next();
});

// Flash middleware - make flash messages available to views
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/", deviceRoutes);
app.use("/", orderRoutes);
app.use("/", checkoutRoutes);
app.use("/", paymentManagementRoutes);
app.use("/", userRoutes);
app.use("/", cartRoutes);
app.use("/", productRoutes);
app.use("/", deliveryRoutes);
app.use("/", shipmentRoutes);
app.use("/", addressRoutes);
app.use("/admin/users", adminUserRoutes); // Admin user management

// Home route
app.get("/", (req, res) => {
  res.render("index");
});

// Protected dashboard
app.get("/dashboard", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("dashboard", { userName: req.session.userName });
});

// DB sync + server start
sequelize
  .sync()
  .then(() => {
    console.log("✅ Database synced");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to sync DB:", err);
  });

// 404 Page Handler
app.use((req, res, next) => {
  res.status(404).render("404");
});
