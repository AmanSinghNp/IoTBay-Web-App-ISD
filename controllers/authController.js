const bcrypt = require("bcrypt");
const User = require("../models/user");
const UserAccessLog = require("../models/userAccessLog");

// Show login page
exports.getLogin = (req, res) => {
  const successMessage =
    req.query.deleted === "1"
      ? "Your account has been successfully deleted."
      : null;

  res.render("login", {
    error: null,
    successMessage,
  });
};

// Handle login form
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  // Server-side validation
  if (!email || !email.trim()) {
    return res.render("login", {
      error: "Email is required.",
      successMessage: null,
    });
  }

  if (!password || !password.trim()) {
    return res.render("login", {
      error: "Password is required.",
      successMessage: null,
    });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("login", {
      error: "Please enter a valid email address.",
      successMessage: null,
    });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password.",
        successMessage: null,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      // Save session data
      req.session.userId = user.id;
      req.session.userName = user.fullName;
      req.session.userRole = user.role;

      // Create login record
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

// Show register page
exports.getRegister = (req, res) => {
  res.render("register", { error: null });
};

// Handle register form
exports.postRegister = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  // Server-side validation
  if (!fullName || !fullName.trim()) {
    return res.render("register", {
      error: "Full name is required.",
    });
  }

  if (!email || !email.trim()) {
    return res.render("register", {
      error: "Email is required.",
    });
  }

  if (!password || !password.trim()) {
    return res.render("register", {
      error: "Password is required.",
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("register", {
      error: "Please enter a valid email address.",
    });
  }

  // Password length validation
  if (password.length < 6) {
    return res.render("register", {
      error: "Password must be at least 6 characters long.",
    });
  }

  // Full name length validation
  if (fullName.trim().length < 2) {
    return res.render("register", {
      error: "Full name must be at least 2 characters long.",
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

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

// Logout user
exports.logout = async (req, res) => {
  try {
    if (req.session.accessLogId) {
      const accessLog = await UserAccessLog.findByPk(req.session.accessLogId);
      if (accessLog) {
        accessLog.logoutTime = new Date();
        await accessLog.save();
      }
    }

    req.session.destroy(() => {
      res.redirect("/");
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.redirect("/");
  }
};
