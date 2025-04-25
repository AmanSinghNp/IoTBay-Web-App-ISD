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
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.send("Invalid email or password.");
  }

  const match = await bcrypt.compare(password, user.password);

  if (match) {
    req.session.userId = user.id;
    req.session.userName = user.fullName;
    req.session.userRole = user.role;
    res.redirect("/dashboard");
  } else {
    res.send("Invalid email or password.");
  }
});

// GET register page
router.get("/register", (req, res) => {
  res.render("register");
});

// POST register form
router.post("/register", async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  try {
    await User.create({
      fullName,
      email,
      phone,
      password: hash,
      role: "customer", // Default role
    });
    res.redirect("/login");
  } catch (error) {
    res.send("Error registering user. Email might already be taken.");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
