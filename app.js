const express = require("express");
const path = require("path");
const session = require("express-session");

const sequelize = require("./config/database");
const User = require("./models/user");
const Device = require("./models/device");
const Order = require("./models/order");
const Payment = require("./models/payment");

const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/devices");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const userRoutes = require("./routes/user");

const app = express();
const PORT = 3000;

// View engine
app.set("view engine", "ejs");

// Public static folder
app.use(express.static(path.join(__dirname, "public")));

// express parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Session MUST come before routes or custom middleware
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// ✅ Add userName to all views BEFORE routes
app.use((req, res, next) => {
  res.locals.userName = req.session.userName || null;
  res.locals.userRole = req.session.userRole || null;
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/", deviceRoutes);
app.use("/", orderRoutes);
app.use("/", paymentRoutes);
app.use("/", userRoutes);

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
  .sync({ force: false })
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
