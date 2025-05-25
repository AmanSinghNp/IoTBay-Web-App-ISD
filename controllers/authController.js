const bcrypt = require("bcrypt");
const User = require("../models/user");
const UserAccessLog = require("../models/userAccessLog");

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  // Allow various phone formats: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

const validatePassword = (password) => {
  // Password must be at least 8 characters, contain at least one letter and one number
  if (password.length < 8)
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  if (!/[a-zA-Z]/.test(password))
    return {
      valid: false,
      message: "Password must contain at least one letter.",
    };
  if (!/\d/.test(password))
    return {
      valid: false,
      message: "Password must contain at least one number.",
    };
  return { valid: true };
};

const validateFullName = (fullName) => {
  if (!fullName || fullName.trim().length < 2) return false;
  // Check for at least first and last name (contains space)
  const nameParts = fullName.trim().split(/\s+/);
  return nameParts.length >= 2 && nameParts.every((part) => part.length >= 1);
};

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
  const errors = [];

  if (!email || !email.trim()) {
    errors.push("Email is required.");
  } else if (!validateEmail(email.trim())) {
    errors.push("Please enter a valid email address.");
  }

  if (!password || !password.trim()) {
    errors.push("Password is required.");
  }

  if (errors.length > 0) {
    return res.render("login", {
      error: errors.join(" "),
      successMessage: null,
    });
  }

  try {
    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password.",
        successMessage: null,
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.render("login", {
        error: "Your account has been deactivated. Please contact support.",
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
    console.error("Login error:", error);
    res.render("login", {
      error: "An error occurred during login. Please try again.",
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
  const errors = [];

  // Full name validation
  if (!fullName || !fullName.trim()) {
    errors.push("Full name is required.");
  } else if (!validateFullName(fullName)) {
    errors.push("Please enter your full name (first and last name).");
  } else if (fullName.trim().length > 100) {
    errors.push("Full name must be less than 100 characters.");
  }

  // Email validation
  if (!email || !email.trim()) {
    errors.push("Email is required.");
  } else if (!validateEmail(email.trim())) {
    errors.push("Please enter a valid email address.");
  } else if (email.trim().length > 255) {
    errors.push("Email address is too long.");
  }

  // Phone validation
  if (phone && !validatePhone(phone)) {
    errors.push("Please enter a valid phone number.");
  }

  // Password validation
  if (!password || !password.trim()) {
    errors.push("Password is required.");
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.message);
    }
  }

  if (errors.length > 0) {
    return res.render("register", {
      error: errors.join(" "),
      formData: { fullName, email, phone }, // Preserve form data
    });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return res.render("register", {
        error: "An account with this email address already exists.",
        formData: { fullName, email, phone },
      });
    }

    const hash = await bcrypt.hash(password, 12); // Increased salt rounds for better security

    await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password: hash,
      role: "customer",
    });

    res.redirect("/login?registered=1");
  } catch (err) {
    console.error("Registration error:", err);
    res.render("register", {
      error: "An error occurred during registration. Please try again.",
      formData: { fullName, email, phone },
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
