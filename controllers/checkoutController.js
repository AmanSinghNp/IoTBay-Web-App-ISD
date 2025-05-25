const Cart = require("../models/cart");
const Device = require("../models/device");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const Payment = require("../models/payment");
const {
  logOrderCreated,
  logPaymentAdded,
  logPaymentConfirmed,
} = require("../middleware/orderLogger");
const { completePaymentWorkflow } = require("../middleware/shipmentService");

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

// GET /payments - Show checkout page with cart items
exports.getCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect("/login?redirectTo=/payments");
    }

    // Load this user's cart items and include the Device model
    const cartItems = await Cart.findAll({
      where: { userId },
      include: Device,
    });

    // Render the payments.ejs view (checkout page), supplying cartItems
    res.render("payments", {
      cartItems,
      errors: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (err) {
    console.error("Checkout page error:", err);
    res.status(500).send("Error loading checkout page");
  }
};

// POST /payments/new - Process checkout and create order with payment
exports.processCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      req.flash("error", "You must be logged in to complete checkout.");
      return res.redirect("/login");
    }

    const {
      payment_method,
      card_number,
      expiry_date,
      cvv,
      amount,
      payment_date,
      cardName,
      terms,
    } = req.body;

    // Get all cart items for the user
    const cartItems = await Cart.findAll({
      where: { userId },
      include: Device,
    });

    if (!cartItems.length) {
      req.flash("error", "Your cart is empty.");
      return res.redirect("/cart");
    }

    // Calculate total amount from cart
    const calculatedTotal = cartItems.reduce(
      (sum, item) => sum + item.Device.price * item.quantity,
      0
    );

    // Comprehensive server-side validation
    const errors = [];

    // Terms validation
    if (!terms) {
      errors.push("You must agree to the terms and conditions.");
    }

    // Payment method validation
    if (!payment_method || !payment_method.trim()) {
      errors.push("Payment method is required.");
    }

    // Only validate card details if Credit Card is selected
    if (payment_method === "Credit Card") {
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

      // Name on card validation
      if (!cardName || !cardName.trim()) {
        errors.push("Name on card is required.");
      }
    }

    // Amount validation
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      errors.push(amountValidation.message);
    } else if (Math.abs(parseFloat(amount) - calculatedTotal) > 0.01) {
      errors.push("Payment amount does not match cart total.");
    }

    if (errors.length > 0) {
      req.flash("error", errors);
      return res.render("payments", {
        cartItems: cartItems,
        errors: req.flash("error"),
        success: null,
      });
    }

    // Create a new order
    const order = await Order.create({ userId });

    // Create order items for each cart item
    const orderItems = [];
    for (const item of cartItems) {
      const orderItem = await OrderItem.create({
        orderId: order.id,
        deviceId: item.deviceId,
        quantity: item.quantity,
        price: item.Device.price,
      });
      orderItems.push({
        deviceId: item.deviceId,
        deviceName: item.Device.name,
        quantity: item.quantity,
        price: item.Device.price,
      });
    }

    // Log order creation
    await logOrderCreated(
      order.id,
      userId,
      {
        totalItems: cartItems.length,
        totalAmount: calculatedTotal,
        items: orderItems,
      },
      req
    );

    // Create payment record
    const paymentData = {
      payment_method: payment_method.trim(),
      card_number:
        payment_method === "Credit Card"
          ? card_number.replace(/[\s\-]/g, "")
          : "N/A",
      expiry_date:
        payment_method === "Credit Card" ? expiry_date.trim() : "N/A",
      cvv: payment_method === "Credit Card" ? cvv.trim() : "N/A",
      amount: parseFloat(amount),
      payment_date,
      order_id: order.id,
      user_id: userId,
    };

    Payment.create(paymentData, async (err, paymentResult) => {
      if (err) {
        console.error("Payment creation error:", err);
        req.flash("error", "Payment processing failed. Please try again.");
        return res.render("payments", {
          cartItems: cartItems,
          errors: req.flash("error"),
          success: null,
        });
      }

      // Log payment addition
      await logPaymentAdded(
        order.id,
        userId,
        {
          paymentId: paymentResult.id,
          paymentMethod: payment_method,
          amount: parseFloat(amount),
          cardLastFour:
            payment_method === "Credit Card" ? card_number.slice(-4) : null,
        },
        req
      );

      // Log payment confirmation
      await logPaymentConfirmed(
        order.id,
        userId,
        {
          paymentId: paymentResult.id,
          paymentMethod: payment_method,
          amount: parseFloat(amount),
          transactionStatus: "confirmed",
        },
        req
      );

      // Complete the payment workflow (auto-create shipment and confirm order)
      const workflowResult = await completePaymentWorkflow(
        order.id,
        userId,
        {
          paymentId: paymentResult.id,
          paymentMethod: payment_method,
          amount: parseFloat(amount),
        },
        req
      );

      // Clear the cart after successful payment
      Cart.destroy({ where: { userId } })
        .then(() => {
          if (workflowResult.success && workflowResult.shipment) {
            req.flash(
              "success",
              "Payment processed successfully! Your order has been confirmed and shipment has been automatically created."
            );
          } else {
            req.flash(
              "success",
              "Payment processed successfully! Your order has been placed."
            );
          }
          // Redirect to order details page with payment information
          res.redirect(`/orders/view/${order.id}`);
        })
        .catch((clearErr) => {
          console.error("Cart clearing error:", clearErr);
          // Still redirect to order page even if cart clearing fails
          req.flash(
            "success",
            "Payment processed successfully! Your order has been placed."
          );
          res.redirect(`/orders/view/${order.id}`);
        });
    });
  } catch (err) {
    console.error("Checkout processing error:", err);
    req.flash("error", "Checkout failed. Please try again.");
    res.redirect("/payments");
  }
};
