const OrderLog = require("../models/orderLog");

/**
 * Log order-related activities
 * @param {number} orderId - The order ID
 * @param {number|null} userId - The user ID (null for anonymous)
 * @param {string} action - The action performed
 * @param {object} details - Additional details to log
 * @param {object} req - Express request object for IP and user agent
 */
const logOrderActivity = async (
  orderId,
  userId,
  action,
  details = {},
  req = null
) => {
  try {
    const logData = {
      orderId,
      userId,
      action,
      details: JSON.stringify(details),
      ipAddress: req ? req.ip || req.connection.remoteAddress : null,
      userAgent: req ? req.get("User-Agent") : null,
    };

    await OrderLog.create(logData);
    console.log(
      `📝 Order Log: ${action} for Order #${orderId} by User #${
        userId || "Anonymous"
      }`
    );
  } catch (error) {
    console.error("❌ Failed to log order activity:", error);
    // Don't throw error to prevent breaking the main flow
  }
};

/**
 * Express middleware to log order activities
 */
const orderLoggerMiddleware = (action, getOrderId, getDetails = () => ({})) => {
  return async (req, res, next) => {
    try {
      const orderId =
        typeof getOrderId === "function" ? getOrderId(req) : getOrderId;
      const userId = req.session.userId || null;
      const details =
        typeof getDetails === "function" ? getDetails(req) : getDetails;

      await logOrderActivity(orderId, userId, action, details, req);
    } catch (error) {
      console.error("❌ Order logging middleware error:", error);
    }
    next();
  };
};

// Predefined logging functions for common actions
const logOrderCreated = (orderId, userId, orderDetails, req) =>
  logOrderActivity(orderId, userId, "ORDER_CREATED", orderDetails, req);

const logPaymentAdded = (orderId, userId, paymentDetails, req) =>
  logOrderActivity(orderId, userId, "PAYMENT_ADDED", paymentDetails, req);

const logPaymentConfirmed = (orderId, userId, paymentDetails, req) =>
  logOrderActivity(orderId, userId, "PAYMENT_CONFIRMED", paymentDetails, req);

const logShipmentCreated = (orderId, userId, shipmentDetails, req) =>
  logOrderActivity(orderId, userId, "SHIPMENT_CREATED", shipmentDetails, req);

const logOrderCancelled = (orderId, userId, reason, req) =>
  logOrderActivity(orderId, userId, "ORDER_CANCELLED", { reason }, req);

const logOrderUpdated = (orderId, userId, changes, req) =>
  logOrderActivity(orderId, userId, "ORDER_UPDATED", changes, req);

module.exports = {
  logOrderActivity,
  orderLoggerMiddleware,
  logOrderCreated,
  logPaymentAdded,
  logPaymentConfirmed,
  logShipmentCreated,
  logOrderCancelled,
  logOrderUpdated,
};
