const User = require("../models/user");
const Order = require("../models/order");
const UserAccessLog = require("../models/userAccessLog");
const { Op } = require("sequelize");

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

const validateFullName = (fullName) => {
  if (!fullName || fullName.trim().length < 2) return false;
  // Check for at least first and last name (contains space)
  const nameParts = fullName.trim().split(/\s+/);
  return nameParts.length >= 2 && nameParts.every((part) => part.length >= 1);
};

// Show the profile page
exports.showProfile = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.redirect("/login");

    return res.render("profile", {
      user,
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });
  } catch (err) {
    console.error("Error loading profile:", err);
    return res.status(500).send("Error loading profile.");
  } finally {
    req.session.successMessage = null;
    req.session.errorMessage = null;
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { fullName, email, phone } = req.body;

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

  if (errors.length > 0) {
    try {
      const user = await User.findByPk(req.session.userId);
      return res.render("profile", {
        user: { ...user.dataValues, fullName, email, phone }, // Show submitted data
        successMessage: null,
        errorMessage: errors.join(" "),
      });
    } catch (err) {
      console.error("Error loading profile for validation:", err);
      return res.status(500).send("Error loading profile.");
    }
  }

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.redirect("/login");

    // Check if email is being changed and if it's already taken by another user
    if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({
        where: {
          email: email.trim().toLowerCase(),
          id: { [Op.ne]: req.session.userId }, // Exclude current user
        },
      });

      if (existingUser) {
        return res.render("profile", {
          user: { ...user.dataValues, fullName, email, phone },
          successMessage: null,
          errorMessage: "An account with this email address already exists.",
        });
      }
    }

    // Update user data
    user.fullName = fullName.trim();
    user.email = email.trim().toLowerCase();
    user.phone = phone ? phone.trim() : null;
    await user.save();

    // Update session data
    req.session.userName = fullName.trim();

    return res.render("profile", {
      user,
      successMessage: "Profile updated successfully!",
      errorMessage: null,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    // Try to get user data for re-rendering the form
    try {
      const user = await User.findByPk(req.session.userId);
      return res.render("profile", {
        user: { ...user.dataValues, fullName, email, phone },
        successMessage: null,
        errorMessage: "Failed to update profile. Please try again.",
      });
    } catch (err) {
      console.error("Error loading profile after update failure:", err);
      return res.status(500).send("Error updating profile.");
    }
  }
};

// Delete account and cancel placed orders
exports.deleteAccount = async (req, res) => {
  const userId = req.session.userId;

  try {
    // Cancel all placed orders for user
    await Order.update(
      { status: "Cancelled" },
      { where: { userId, status: "Placed" } }
    );

    // Delete user
    await User.destroy({ where: { id: userId } });

    // End session and show success message on login
    req.session.destroy(() => {
      return res.redirect("/login?deleted=1");
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    return res.status(500).send("Failed to delete account.");
  }
};

// Dashboard view with access log summary
exports.showDashboard = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const logs = await UserAccessLog.findAll({
      where: { userId: req.session.userId },
      order: [["loginTime", "DESC"]],
      limit: 5,
    });

    const lastLogin = logs[0]?.loginTime || null;
    const sessionCount = logs.length;

    return res.render("dashboard", {
      userName: req.session.userName,
      userRole: req.session.userRole,
      lastLogin,
      sessionCount,
    });
  } catch (err) {
    console.error("Dashboard access log error:", err);
    return res.status(500).send("Failed to load dashboard.");
  }
};

// View user access logs
exports.viewAccessLogs = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const logs = await UserAccessLog.findAll({
      where: { userId: req.session.userId },
      order: [["loginTime", "DESC"]],
    });

    return res.render("access_log", { logs });
  } catch (err) {
    console.error("Failed to load access logs:", err);
    return res.status(500).send("Could not retrieve access log data.");
  }
};
