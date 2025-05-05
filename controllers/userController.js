const User = require("../models/user");
const Order = require("../models/order");
const UserAccessLog = require("../models/userAccessLog");
const { Op } = require("sequelize");

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

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.redirect("/login");

    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    await user.save();

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

// View user access logs with optional date filtering
exports.viewAccessLogs = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const { date } = req.query;
  const where = { userId: req.session.userId };

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1); // Include logs up to next day's midnight

    where.loginTime = {
      [Op.gte]: start,
      [Op.lt]: end,
    };
  }

  try {
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
