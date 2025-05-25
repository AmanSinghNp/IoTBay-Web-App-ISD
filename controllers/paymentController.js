const Payment = require("../models/payment");

// Validation helper functions
const validateCardNumber = (cardNumber) => {
  if (!cardNumber) return false;
  // Remove spaces and dashes
  const cleanCard = cardNumber.replace(/[\s\-]/g, "");
  // Check if it's 13-19 digits (most card types)
  if (!/^\d{13,19}$/.test(cleanCard)) return false;

  // Luhn algorithm for card validation
  let sum = 0;
  let isEven = false;
  for (let i = cleanCard.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanCard[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const validateExpiryDate = (expiryDate) => {
  if (!expiryDate) return { valid: false, message: "Expiry date is required." };

  // Accept MM/YY or MM/YYYY format
  const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;
  if (!expiryRegex.test(expiryDate)) {
    return {
      valid: false,
      message: "Expiry date must be in MM/YY or MM/YYYY format.",
    };
  }

  const [month, year] = expiryDate.split("/");
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Convert 2-digit year to 4-digit
  const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
  const monthNum = parseInt(month);

  // Check if the card has expired
  if (
    fullYear < currentYear ||
    (fullYear === currentYear && monthNum < currentMonth)
  ) {
    return { valid: false, message: "Card has expired." };
  }

  // Check if expiry is too far in the future (more than 10 years)
  if (fullYear > currentYear + 10) {
    return { valid: false, message: "Invalid expiry date." };
  }

  return { valid: true };
};

const validateCVV = (cvv) => {
  if (!cvv) return false;
  // CVV should be 3 or 4 digits
  return /^\d{3,4}$/.test(cvv);
};

const validateAmount = (amount) => {
  if (!amount) return { valid: false, message: "Amount is required." };

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount))
    return { valid: false, message: "Amount must be a valid number." };
  if (numAmount <= 0)
    return { valid: false, message: "Amount must be greater than zero." };
  if (numAmount > 999999.99)
    return { valid: false, message: "Amount is too large." };

  // Check for reasonable decimal places (max 2)
  const decimalPlaces = (amount.toString().split(".")[1] || "").length;
  if (decimalPlaces > 2)
    return {
      valid: false,
      message: "Amount can have at most 2 decimal places.",
    };

  return { valid: true };
};

const validatePaymentDate = (paymentDate) => {
  if (!paymentDate)
    return { valid: false, message: "Payment date is required." };

  const date = new Date(paymentDate);
  if (isNaN(date.getTime()))
    return { valid: false, message: "Invalid payment date." };

  const currentDate = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setDate(currentDate.getDate() + 30); // Allow up to 30 days in future

  if (date > maxFutureDate) {
    return {
      valid: false,
      message: "Payment date cannot be more than 30 days in the future.",
    };
  }

  // Don't allow dates too far in the past (more than 1 year)
  const minPastDate = new Date();
  minPastDate.setFullYear(currentDate.getFullYear() - 1);

  if (date < minPastDate) {
    return {
      valid: false,
      message: "Payment date cannot be more than 1 year in the past.",
    };
  }

  return { valid: true };
};

const validatePaymentMethod = (paymentMethod) => {
  const validMethods = ["Credit Card", "PayPal", "Bank Transfer"];
  return validMethods.includes(paymentMethod);
};

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

  // Comprehensive server-side validation
  const errors = [];

  // Payment method validation
  if (!payment_method || !payment_method.trim()) {
    errors.push("Payment method is required.");
  } else if (!validatePaymentMethod(payment_method)) {
    errors.push("Invalid payment method selected.");
  }

  // Card number validation
  if (!card_number || !card_number.trim()) {
    errors.push("Card number is required.");
  } else if (!validateCardNumber(card_number)) {
    errors.push("Please enter a valid card number.");
  }

  // Expiry date validation
  const expiryValidation = validateExpiryDate(expiry_date);
  if (!expiryValidation.valid) {
    errors.push(expiryValidation.message);
  }

  // CVV validation
  if (!cvv || !cvv.trim()) {
    errors.push("CVV is required.");
  } else if (!validateCVV(cvv)) {
    errors.push("CVV must be 3 or 4 digits.");
  }

  // Amount validation
  const amountValidation = validateAmount(amount);
  if (!amountValidation.valid) {
    errors.push(amountValidation.message);
  }

  // Payment date validation
  const dateValidation = validatePaymentDate(payment_date);
  if (!dateValidation.valid) {
    errors.push(dateValidation.message);
  }

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
      payment_method: payment_method.trim(),
      card_number: card_number.replace(/[\s\-]/g, ""), // Store without spaces/dashes
      expiry_date: expiry_date.trim(),
      cvv: cvv.trim(),
      amount: parseFloat(amount),
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

  // Comprehensive server-side validation
  const errors = [];

  // Payment method validation
  if (!payment_method || !payment_method.trim()) {
    errors.push("Payment method is required.");
  } else if (!validatePaymentMethod(payment_method)) {
    errors.push("Invalid payment method selected.");
  }

  // Card number validation
  if (!card_number || !card_number.trim()) {
    errors.push("Card number is required.");
  } else if (!validateCardNumber(card_number)) {
    errors.push("Please enter a valid card number.");
  }

  // Expiry date validation
  const expiryValidation = validateExpiryDate(expiry_date);
  if (!expiryValidation.valid) {
    errors.push(expiryValidation.message);
  }

  // CVV validation
  if (!cvv || !cvv.trim()) {
    errors.push("CVV is required.");
  } else if (!validateCVV(cvv)) {
    errors.push("CVV must be 3 or 4 digits.");
  }

  // Amount validation
  const amountValidation = validateAmount(amount);
  if (!amountValidation.valid) {
    errors.push(amountValidation.message);
  }

  // Payment date validation
  const dateValidation = validatePaymentDate(payment_date);
  if (!dateValidation.valid) {
    errors.push(dateValidation.message);
  }

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
      payment_method: payment_method.trim(),
      card_number: card_number.replace(/[\s\-]/g, ""), // Store without spaces/dashes
      expiry_date: expiry_date.trim(),
      cvv: cvv.trim(),
      amount: parseFloat(amount),
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
