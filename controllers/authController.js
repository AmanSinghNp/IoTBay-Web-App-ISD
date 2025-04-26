// controllers/authController.js
const bcrypt = require("bcrypt");
const User = require("../models/user");

// Show login page
exports.getLogin = (req, res) => {
  res.render("login");
};

// Handle login form
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.render("login", { error: "Invalid email or password." });
  }

  const match = await bcrypt.compare(password, user.password);

  if (match) {
    req.session.userId = user.id;
    req.session.userName = user.fullName;
    req.session.userRole = user.role;
    res.redirect("/dashboard");
  } else {
    res.render("login", { error: "Invalid email or password." });
  }
};

// Show register page
exports.getRegister = (req, res) => {
  res.render("register");
};

// Handle register form
exports.postRegister = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  try {
    await User.create({
      fullName,
      email,
      phone,
      password: hash,
      role: "customer",
    });
    res.redirect("/login");
  } catch (err) {
    res.render("register", {
      error: "Error registering user. Email might be taken.",
    });
  }
};

// Logout user
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
