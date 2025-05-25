const Payment = require("../models/paymentSequelize");
const Order = require("../models/order");
const User = require("../models/user");
const { Op } = require("sequelize");

// ==================== SEQUELIZE-BASED PAYMENT MANAGEMENT SYSTEM ====================

// GET /orders/:orderId/payment - Show form to add/edit payment for an order
exports.getPaymentFormForOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const paymentId = req.query.paymentId; // For editing existing payment
    const userId = req.session.userId;

    if (!userId) {
      req.flash("error", "You must be logged in to manage payments.");
      return res.redirect("/login");
    }

    if (paymentId) {
      // Editing existing payment
      const payment = await Payment.findOne({
        where: {
          id: paymentId,
          userId: userId,
        },
      });

      if (!payment) {
        req.flash(
          "error",
          "Payment not found or you do not have permission to edit it."
        );
        return res.redirect("/orders/" + orderId);
      }

      if (payment.orderId !== parseInt(orderId)) {
        req.flash("error", "Payment record does not match this order.");
        return res.redirect("/orders/" + orderId);
      }

      res.render("payment_form", {
        orderId: orderId,
        payment: payment,
        errors: req.flash("error"),
        success: req.flash("success"),
      });
    } else {
      // Adding new payment
      const existingPayment = await Payment.findOne({
        where: {
          orderId: orderId,
          userId: userId,
        },
      });

      if (existingPayment) {
        req.flash(
          "info",
          "Payment details for this order already exist. You can edit them below."
        );
        return res.redirect(
          `/orders/${orderId}/payment/edit?paymentId=${existingPayment.id}`
        );
      }

      res.render("payment_form", {
        orderId: orderId,
        payment: null,
        errors: req.flash("error"),
        success: req.flash("success"),
      });
    }
  } catch (error) {
    console.error("Error in getPaymentFormForOrder:", error);
    req.flash("error", "Error loading payment form: " + error.message);
    res.redirect("/orders/" + req.params.orderId);
  }
};

// POST /orders/:orderId/payment - Create new payment details for an order
exports.createPaymentForOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.userId;
    const {
      payment_method,
      card_number,
      expiry_date,
      cvv,
      amount,
      payment_date,
    } = req.body;

    if (!userId) {
      req.flash("error", "Authentication required.");
      return res.redirect("/login");
    }

    // Basic validation
    const errors = [];
    if (!payment_method) errors.push("Payment method is required.");
    if (!card_number) errors.push("Card number is required.");
    if (!expiry_date) errors.push("Expiry date is required.");
    if (!cvv) errors.push("CVV is required.");
    if (!amount) errors.push("Amount is required.");
    if (!payment_date) errors.push("Payment date is required.");

    if (errors.length > 0) {
      req.flash("error", errors);
      return res.render("payment_form", {
        orderId: orderId,
        payment: req.body,
        errors: req.flash("error"),
        success: null,
      });
    }

    const payment = await Payment.create({
      paymentMethod: payment_method,
      cardNumber: card_number,
      expiryDate: expiry_date,
      cvv: cvv,
      amount: amount,
      paymentDate: payment_date,
      orderId: parseInt(orderId),
      userId: userId,
    });

    req.flash("success", "Payment details saved successfully!");
    res.redirect(`/orders/${orderId}/payment/details`);
  } catch (error) {
    console.error("Error in createPaymentForOrder:", error);
    req.flash("error", "Error saving payment details: " + error.message);
    res.render("payment_form", {
      orderId: req.params.orderId,
      payment: req.body,
      errors: req.flash("error"),
      success: null,
    });
  }
};

// GET /orders/:orderId/payment/details - View saved payment details for an order
exports.getPaymentDetailsForOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.userId;

    if (!userId) {
      req.flash("error", "You must be logged in to view payment details.");
      return res.redirect("/login");
    }

    const payment = await Payment.findOne({
      where: {
        orderId: orderId,
        userId: userId,
      },
      include: [
        { model: Order, attributes: ["id", "totalAmount"] },
        { model: User, attributes: ["id", "fullName", "email"] },
      ],
    });

    if (!payment) {
      req.flash(
        "info",
        "No payment details found for this order. Please add them."
      );
      return res.redirect(`/orders/${orderId}/payment`);
    }

    res.render("payment_details", {
      payment: payment,
      orderId: orderId,
      errors: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.error("Error in getPaymentDetailsForOrder:", error);
    req.flash("error", "Error fetching payment details: " + error.message);
    res.redirect("/orders/" + req.params.orderId);
  }
};

// GET /orders/:orderId/payment/edit - Show form to edit payment
exports.getEditPaymentForm = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const paymentId = req.query.paymentId;
    const userId = req.session.userId;

    if (!userId) {
      req.flash("error", "You must be logged in.");
      return res.redirect("/login");
    }

    if (!paymentId) {
      req.flash("error", "Payment ID is missing.");
      return res.redirect(`/orders/${orderId}/payment`);
    }

    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        userId: userId,
      },
    });

    if (!payment) {
      req.flash("error", "Payment not found or access denied.");
      return res.redirect("/orders/" + orderId);
    }

    if (payment.orderId !== parseInt(orderId)) {
      req.flash("error", "Payment record does not match this order.");
      return res.redirect("/orders/" + orderId);
    }

    res.render("payment_form", {
      orderId: orderId,
      payment: payment,
      errors: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.error("Error in getEditPaymentForm:", error);
    req.flash("error", "Error loading payment form: " + error.message);
    res.redirect("/orders/" + req.params.orderId);
  }
};

// POST /orders/:orderId/payment/edit - Update payment details
exports.updatePaymentForOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const paymentId = req.query.paymentId;
    const userId = req.session.userId;
    const {
      payment_method,
      card_number,
      expiry_date,
      cvv,
      amount,
      payment_date,
    } = req.body;

    if (!userId) {
      req.flash("error", "Authentication required.");
      return res.redirect("/login");
    }

    if (!paymentId) {
      req.flash("error", "Payment ID is missing.");
      return res.redirect(`/orders/${orderId}/payment`);
    }

    // Basic validation
    const errors = [];
    if (!payment_method) errors.push("Payment method is required.");
    if (!card_number) errors.push("Card number is required.");
    if (!expiry_date) errors.push("Expiry date is required.");
    if (!cvv) errors.push("CVV is required.");
    if (!amount) errors.push("Amount is required.");
    if (!payment_date) errors.push("Payment date is required.");

    if (errors.length > 0) {
      req.flash("error", errors);
      return res.redirect(
        `/orders/${orderId}/payment/edit?paymentId=${paymentId}`
      );
    }

    const [updatedRowsCount] = await Payment.update(
      {
        paymentMethod: payment_method,
        cardNumber: card_number,
        expiryDate: expiry_date,
        cvv: cvv,
        amount: amount,
        paymentDate: payment_date,
      },
      {
        where: {
          id: paymentId,
          userId: userId,
          orderId: orderId,
        },
      }
    );

    if (updatedRowsCount === 0) {
      req.flash(
        "error",
        "Payment not found or you don't have permission to update it."
      );
      return res.redirect("/orders/" + orderId);
    }

    req.flash("success", "Payment details updated successfully!");
    res.redirect(`/orders/${orderId}/payment/details`);
  } catch (error) {
    console.error("Error in updatePaymentForOrder:", error);
    req.flash("error", "Error updating payment details: " + error.message);
    res.redirect(
      `/orders/${orderId}/payment/edit?paymentId=${req.query.paymentId}`
    );
  }
};

// DELETE /orders/:orderId/payment - Delete payment details
exports.deletePaymentForOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const paymentId = req.query.paymentId;
    const userId = req.session.userId;

    if (!userId) {
      req.flash("error", "Authentication required.");
      return res.redirect("/login");
    }

    if (!paymentId) {
      req.flash("error", "Payment ID is missing.");
      return res.redirect(`/orders/${orderId}`);
    }

    const deletedRowsCount = await Payment.destroy({
      where: {
        id: paymentId,
        userId: userId,
        orderId: orderId,
      },
    });

    if (deletedRowsCount === 0) {
      req.flash(
        "error",
        "Payment not found or you don't have permission to delete it."
      );
    } else {
      req.flash("success", "Payment details deleted successfully!");
    }

    res.redirect("/orders/" + orderId);
  } catch (error) {
    console.error("Error in deletePaymentForOrder:", error);
    req.flash("error", "Error deleting payment details: " + error.message);
    res.redirect("/orders/" + req.params.orderId);
  }
};

// GET /payments - View all payments for the logged-in user
exports.getAllPayments = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { search, payment_id, date, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!userId) {
      req.flash("error", "You must be logged in to view payments.");
      return res.redirect("/login");
    }

    let whereClause = { userId: userId };

    // Search functionality
    if (payment_id) {
      whereClause.id = payment_id;
    }

    if (date) {
      whereClause.paymentDate = date;
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        { model: Order, attributes: ["id", "totalAmount"] },
        { model: User, attributes: ["id", "fullName"] },
      ],
      limit,
      offset,
      order: [["paymentDate", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.render("payment_history", {
      payments,
      search: search || "",
      payment_id: payment_id || "",
      date: date || "",
      currentPage: parseInt(page),
      totalPages,
      totalPayments: count,
      errors: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (error) {
    console.error("Error in getAllPayments:", error);
    req.flash("error", "Error loading payment history: " + error.message);
    res.redirect("/dashboard");
  }
};

module.exports = exports;
