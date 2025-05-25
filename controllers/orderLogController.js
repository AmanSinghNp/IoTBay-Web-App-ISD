const OrderLog = require("../models/orderLog");
const Order = require("../models/order");
const User = require("../models/user");
const { Op } = require("sequelize");

/**
 * View order logs for a specific order (for users to see their order history)
 */
exports.viewOrderLogs = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    // Verify the order belongs to the current user
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      req.flash("error", "Order not found or unauthorized access.");
      return res.redirect("/orders");
    }

    // Get all logs for this order
    const logs = await OrderLog.findAll({
      where: { orderId: orderId },
      include: [
        {
          model: User,
          attributes: ["id", "fullName", "email"],
        },
      ],
      order: [["timestamp", "DESC"]],
    });

    res.render("order_logs", {
      order,
      logs,
      errors: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.error("Error fetching order logs:", error);
    req.flash("error", "Failed to load order logs.");
    res.redirect("/orders");
  }
};

/**
 * View all order logs (admin functionality)
 */
exports.viewAllOrderLogs = async (req, res) => {
  try {
    const { orderId, userId, action, startDate, endDate } = req.query;
    const where = {};

    // Add search filters if provided
    if (orderId) where.orderId = orderId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.timestamp[Op.lt] = nextDay;
      }
    }

    const logs = await OrderLog.findAll({
      where,
      include: [
        {
          model: Order,
          attributes: ["id", "status", "createdAt"],
        },
        {
          model: User,
          attributes: ["id", "fullName", "email"],
        },
      ],
      order: [["timestamp", "DESC"]],
      limit: 100, // Limit to prevent performance issues
    });

    // Get unique actions for filter dropdown
    const actions = await OrderLog.findAll({
      attributes: ["action"],
      group: ["action"],
      raw: true,
    });

    res.render("admin/order_logs", {
      logs,
      actions: actions.map((a) => a.action),
      searchParams: { orderId, userId, action, startDate, endDate },
      errors: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.error("Error fetching all order logs:", error);
    req.flash("error", "Failed to load order logs.");
    res.redirect("/admin/dashboard");
  }
};

/**
 * Get order activity summary for dashboard
 */
exports.getOrderActivitySummary = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get recent activity for user's orders
    const recentLogs = await OrderLog.findAll({
      where: { userId: userId },
      include: [
        {
          model: Order,
          attributes: ["id", "status"],
        },
      ],
      order: [["timestamp", "DESC"]],
      limit: 5,
    });

    // Get activity counts by action
    const activityCounts = await OrderLog.findAll({
      where: { userId: userId },
      attributes: [
        "action",
        [
          OrderLog.sequelize.fn("COUNT", OrderLog.sequelize.col("action")),
          "count",
        ],
      ],
      group: ["action"],
      raw: true,
    });

    res.json({
      recentActivity: recentLogs,
      activityCounts: activityCounts,
    });
  } catch (error) {
    console.error("Error fetching order activity summary:", error);
    res.status(500).json({ error: "Failed to load activity summary" });
  }
};

module.exports = {
  viewOrderLogs: exports.viewOrderLogs,
  viewAllOrderLogs: exports.viewAllOrderLogs,
  getOrderActivitySummary: exports.getOrderActivitySummary,
};
