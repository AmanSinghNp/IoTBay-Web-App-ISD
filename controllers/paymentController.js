const Payment = require("../models/payment");

// ==================== NEW PAYMENT MANAGEMENT SYSTEM ====================

// GET /orders/:orderId/payment - Show form to add/edit payment for an order
exports.getPaymentFormForOrder = (req, res) => {
  const orderId = req.params.orderId;
  const paymentId = req.query.paymentId; // For editing existing payment
  const userId = req.session.userId; // Assuming userId is stored in session

  if (!userId) {
    req.flash("error", "You must be logged in to manage payments.");
    return res.redirect("/login");
  }

  if (paymentId) {
    // Editing existing payment
    Payment.findByIdAndUserId(paymentId, userId, (err, payment) => {
      if (err) {
        req.flash("error", "Error fetching payment details: " + err.message);
        return res.redirect("/orders/" + orderId);
      }
      if (!payment) {
        req.flash(
          "error",
          "Payment not found or you do not have permission to edit it."
        );
        return res.redirect("/orders/" + orderId);
      }
      // Ensure this payment belongs to the correct order if strict check is needed, though userId check might be sufficient
      if (payment.order_id !== parseInt(orderId)) {
        req.flash("error", "Payment record does not match this order.");
        return res.redirect("/orders/" + orderId);
      }
      res.render("payment_form", {
        orderId: orderId,
        payment: payment,
        errors: req.flash("error"),
        success: req.flash("success"),
      });
    });
  } else {
    // Adding new payment
    Payment.findByOrderId(orderId, (err, existingPayment) => {
      if (err) {
        // Log error but proceed to show form, as it might be the first payment attempt
        console.error("Error checking for existing payment:", err.message);
      }
      if (existingPayment && existingPayment.user_id === userId) {
        // If payment for this order by this user already exists, redirect to edit it
        // Or, show details. For this flow, let's go to edit.
        req.flash(
          "info",
          "Payment details for this order already exist. You can edit them below."
        );
        return res.redirect(
          `/orders/${orderId}/payment/edit?paymentId=${existingPayment.id}`
        );
      }
      // No existing payment or doesn't belong to user, show new payment form
      res.render("payment_form", {
        orderId: orderId,
        payment: null,
        errors: req.flash("error"),
        success: req.flash("success"),
      });
    });
  }
};

// POST /orders/:orderId/payment - Create new payment details for an order
exports.createPaymentForOrder = (req, res) => {
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
      payment: req.body, // Send back the submitted data
      errors: req.flash("error"),
      success: null,
    });
  }

  Payment.create(
    {
      payment_method,
      card_number,
      expiry_date,
      cvv,
      amount,
      payment_date,
      order_id: parseInt(orderId),
      user_id: userId,
    },
    (err, result) => {
      if (err) {
        req.flash("error", "Error saving payment details: " + err.message);
        return res.render("payment_form", {
          orderId: orderId,
          payment: req.body,
          errors: req.flash("error"),
          success: null,
        });
      }
      req.flash("success", "Payment details saved successfully!");
      res.redirect(`/orders/${orderId}/payment/details`);
    }
  );
};

// GET /orders/:orderId/payment/details - View saved payment details for an order
exports.getPaymentDetailsForOrder = (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.session.userId;

  if (!userId) {
    req.flash("error", "You must be logged in to view payment details.");
    return res.redirect("/login");
  }

  Payment.findByOrderId(orderId, (err, payment) => {
    if (err) {
      req.flash("error", "Error fetching payment details: " + err.message);
      return res.redirect("/orders/" + orderId);
    }
    if (!payment || payment.user_id !== userId) {
      // No payment found for this order by this user, redirect to add payment form
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
  });
};

// GET /orders/:orderId/payment/edit - Show form to edit payment (similar to getPaymentFormForOrder but ensures payment exists)
exports.getEditPaymentForm = (req, res) => {
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

  Payment.findByIdAndUserId(paymentId, userId, (err, payment) => {
    if (err) {
      req.flash("error", "Error fetching payment details: " + err.message);
      return res.redirect("/orders/" + orderId);
    }
    if (!payment) {
      req.flash("error", "Payment not found or access denied.");
      return res.redirect("/orders/" + orderId);
    }
    if (payment.order_id !== parseInt(orderId)) {
      req.flash("error", "Payment record does not match this order.");
      return res.redirect("/orders/" + orderId);
    }
    res.render("payment_form", {
      orderId: orderId,
      payment: payment,
      errors: req.flash("error"),
      success: req.flash("success"),
    });
  });
};

// POST /payment/:paymentId/update - Update existing payment details
exports.updatePaymentDetails = (req, res) => {
  const paymentId = req.params.paymentId;
  const userId = req.session.userId;
  const {
    payment_method,
    card_number,
    expiry_date,
    cvv,
    amount,
    payment_date,
    order_id,
  } = req.body; // order_id from hidden field or context

  if (!userId) {
    req.flash("error", "Authentication required.");
    return res.redirect("/login");
  }

  // Basic validation
  const errors = [];
  if (!payment_method) errors.push("Payment method is required.");
  // Add other field validations as in create
  if (!card_number) errors.push("Card number is required.");
  if (!expiry_date) errors.push("Expiry date is required.");
  if (!cvv) errors.push("CVV is required.");
  if (!amount) errors.push("Amount is required.");
  if (!payment_date) errors.push("Payment date is required.");

  if (errors.length > 0) {
    req.flash("error", errors);
    // Need to pass orderId back to the form for correct rendering
    // Assuming order_id is available in req.body or can be fetched if not
    return res.render("payment_form", {
      orderId: order_id || req.params.orderId, // Fallback if order_id not in body
      payment: { ...req.body, id: paymentId }, // Send back the submitted data
      errors: req.flash("error"),
      success: null,
    });
  }

  Payment.updateByIdAndUserId(
    paymentId,
    userId,
    {
      payment_method,
      card_number,
      expiry_date,
      cvv,
      amount,
      payment_date,
    },
    (err, result) => {
      if (err) {
        req.flash("error", "Error updating payment details: " + err.message);
        return res.render("payment_form", {
          orderId: order_id,
          payment: { ...req.body, id: paymentId },
          errors: req.flash("error"),
          success: null,
        });
      }
      if (result.changes === 0) {
        req.flash(
          "error",
          "No changes made or payment not found/permission denied."
        );
        return res.redirect(
          `/orders/${order_id}/payment/edit?paymentId=${paymentId}`
        );
      }
      req.flash("success", "Payment details updated successfully!");
      res.redirect(`/orders/${order_id}/payment/details`);
    }
  );
};

// POST /payment/:paymentId/delete - Delete saved payment details
exports.deletePaymentDetails = (req, res) => {
  const paymentId = req.params.paymentId;
  const userId = req.session.userId;
  // We need orderId to redirect back, might come from a hidden form field or fetched.
  // For now, let's assume it might be part of the form POST or we fetch it.
  // If not easily available, redirect to a general page like payment history.

  if (!userId) {
    req.flash("error", "Authentication required.");
    return res.redirect("/login");
  }

  // First, find the payment to get the order_id for redirection, and verify ownership
  Payment.findByIdAndUserId(paymentId, userId, (err, payment) => {
    if (err) {
      req.flash("error", "Error finding payment details: " + err.message);
      return res.redirect(req.headers.referer || "/payments/history");
    }
    if (!payment) {
      req.flash(
        "error",
        "Payment not found or you do not have permission to delete it."
      );
      return res.redirect(req.headers.referer || "/payments/history");
    }

    const orderIdForRedirect = payment.order_id;

    Payment.deleteByIdAndUserId(paymentId, userId, (err, result) => {
      if (err) {
        req.flash("error", "Error deleting payment details: " + err.message);
        return res.redirect(`/orders/${orderIdForRedirect}/payment/details`);
      }
      if (result.changes === 0) {
        req.flash(
          "error",
          "Could not delete payment. It might have been already deleted or you lack permissions."
        );
      } else {
        req.flash("success", "Payment details deleted successfully.");
      }
      // Redirect to the order page (or payment history if order context is lost)
      res.redirect(`/orders/${orderIdForRedirect}`);
    });
  });
};

// GET /payments/history - View all payment history for the logged-in user
exports.getPaymentHistory = (req, res) => {
  const userId = req.session.userId;
  const { payment_id_search, date_search } = req.query;

  if (!userId) {
    req.flash("error", "You must be logged in to view payment history.");
    return res.redirect("/login");
  }

  if (payment_id_search || date_search) {
    Payment.searchByPaymentIdAndDateForUser(
      userId,
      payment_id_search,
      date_search,
      (err, payments) => {
        if (err) {
          req.flash("error", "Error searching payment history: " + err.message);
          return res.render("payment_history", {
            payments: [],
            searchQuery: req.query,
            errors: req.flash("error"),
            success: null,
          });
        }
        res.render("payment_history", {
          payments: payments,
          searchQuery: req.query,
          errors: req.flash("error"),
          success: req.flash("success"),
        });
      }
    );
  } else {
    Payment.findAllByUserId(userId, (err, payments) => {
      if (err) {
        req.flash("error", "Error fetching payment history: " + err.message);
        return res.render("payment_history", {
          payments: [],
          searchQuery: {},
          errors: req.flash("error"),
          success: null,
        });
      }
      res.render("payment_history", {
        payments: payments,
        searchQuery: {},
        errors: req.flash("error"),
        success: req.flash("success"),
      });
    });
  }
};

// Note: The search functionality is integrated into getPaymentHistory.
// A separate /payments/search route might not be strictly necessary if GET /payments/history handles query params.
// If a dedicated route is preferred by paymentRoutes.js, it can simply call getPaymentHistory or a refactored search function.
