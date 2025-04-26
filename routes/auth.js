const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");

// GET login page
router.get("/login", (req, res) => {
  res.render("login");
});

// POST login form
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", {
      errorMessage: "Please enter both email and password.",
    });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render("login", {
        errorMessage: "Invalid email or password.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.userId = user.id;
      req.session.userName = user.fullName;
      req.session.userRole = user.role;
      res.redirect("/dashboard");
    } else {
      res.render("login", { errorMessage: "Invalid email or password." });
    }
  } catch (err) {
    console.error(err);
    res.render("login", { errorMessage: "Internal server error." });
  }
});

// GET register page
router.get("/register", (req, res) => {
  res.render("register");
});

// POST register form
router.post("/register", async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !password) {
    return res.render("register", {
      errorMessage: "Please fill in all required fields.",
    });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.render("register", {
        errorMessage: "Email is already registered.",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      phone,
      password: hash,
      role: "customer",
    });

    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.render("register", { errorMessage: "Internal server error." });
  }
});

// TEMPORARY: Create a staff user manually
router.get("/createstaff", async (req, res) => {
  try {
    const exists = await User.findOne({
      where: { email: "staff@example.com" },
    });
    if (exists) {
      return res.send("⚠️ Staff user already exists. Try logging in.");
    }

    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash("123456", 10);

    await User.create({
      fullName: "Admin User",
      email: "staff@example.com",
      password: hashed,
      phone: "123456789",
      role: "staff",
    });

    res.send("✅ Staff user created. Login with staff@example.com / 123456");
  } catch (err) {
    console.error(err);
    res.send("❌ Something went wrong.");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
