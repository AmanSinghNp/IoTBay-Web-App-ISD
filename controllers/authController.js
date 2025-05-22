// Handles user authentication like login, register, and logout
const bcrypt = require("bcrypt");
const User = require("../models/user");
const UserAccessLog = require("../models/userAccessLog");

// Display the login page
exports.getLogin = (req, res) => {
  // Show success message if account was deleted
  const successMessage =
    req.query.deleted === "1"
      ? "Your account has been successfully deleted."
      : null;

  res.render("login", {
    error: null,
    successMessage,
  });
};

// Process login attempt
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password.",
        successMessage: null,
      });
    }

    // Check if password matches
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      // Store user info in session
      req.session.userId = user.id;
      req.session.userName = user.fullName;
      req.session.userRole = user.role;

      // Log the login attempt
      const accessLog = await UserAccessLog.create({
        userId: user.id,
        loginTime: new Date(),
      });

      req.session.accessLogId = accessLog.id;

      res.redirect("/dashboard");
    } else {
      res.render("login", {
        error: "Invalid email or password.",
        successMessage: null,
      });
    }
  } catch (error) {
    console.error(error);
    res.render("login", {
      error: "Internal server error.",
      successMessage: null,
    });
  }
};

// Display the registration page
exports.getRegister = (req, res) => {
  res.render("register", { error: null });
};

// Process new user registration
exports.postRegister = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {
    // Hash the password
    const hash = await bcrypt.hash(password, 10);

    // Create new user account
    await User.create({
      fullName,
      email,
      phone,
      password: hash,
      role: "customer",
    });

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", {
      error: "Error registering user. Email might be taken.",
    });
  }
};

// Log out the user
exports.logout = async (req, res) => {
  try {
    // Record logout time
    if (req.session.accessLogId) {
      const accessLog = await UserAccessLog.findByPk(req.session.accessLogId);
      if (accessLog) {
        accessLog.logoutTime = new Date();
        await accessLog.save();
      }
    }

    // Clear session
    req.session.destroy();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};
