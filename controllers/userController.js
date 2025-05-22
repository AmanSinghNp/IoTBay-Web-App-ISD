// Handles user operations like profile management and access logs
const User = require("../models/user");
const Order = require("../models/order");
const UserAccessLog = require("../models/userAccessLog");
const { Op } = require("sequelize");

// Display user's profile page
exports.showProfile = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    // Get user details
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.redirect("/login");

    // Show profile page with any messages
    return res.render("profile", {
      user,
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });
  } catch (err) {
    console.error("Error loading profile:", err);
    return res.status(500).send("Error loading profile.");
  } finally {
    // Clear any displayed messages
    req.session.successMessage = null;
    req.session.errorMessage = null;
  }
};

// Save changes to user's profile
exports.updateProfile = async (req, res) => {
  const { fullName, email, phone } = req.body;

  try {
    // Find and update user
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.redirect("/login");

    // Save new details
    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    await user.save();

    // Update session name
    req.session.userName = fullName;

    return res.render("profile", {
      user,
      successMessage: "Profile updated successfully!",
      errorMessage: null,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.render("profile", {
      user: {},
      successMessage: null,
      errorMessage: "Failed to update profile.",
    });
  }
};

// Remove user account and clean up their data
exports.deleteAccount = async (req, res) => {
  const userId = req.session.userId;

  try {
    // Cancel any pending orders
    await Order.update(
      { status: "Cancelled" },
      { where: { userId, status: "Placed" } }
    );

    // Remove user from database
    await User.destroy({ where: { id: userId } });

    // Log out and show confirmation
    req.session.destroy(() => {
      return res.redirect("/login?deleted=1");
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    return res.status(500).send("Failed to delete account.");
  }
};

// Show user's dashboard with recent activity
exports.showDashboard = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    // Get recent login history
    const logs = await UserAccessLog.findAll({
      where: { userId: req.session.userId },
      order: [["loginTime", "DESC"]],
      limit: 5,
    });

    // Calculate login stats
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

// Show user's login history with date filter
exports.viewAccessLogs = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const { date } = req.query;
  const where = { userId: req.session.userId };

  // Add date filter if provided
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1); // Include full day

    where.loginTime = {
      [Op.gte]: start,
      [Op.lt]: end,
    };
  }

  try {
    // Get filtered login history
    const logs = await UserAccessLog.findAll({
      where,
      order: [["loginTime", "DESC"]],
    });

    return res.render("access_logs", {
      logs,
      filterDate: date || null,
    });
  } catch (err) {
    console.error("Failed to load access logs:", err);
    return res.status(500).send("Could not retrieve access log data.");
  }
};
