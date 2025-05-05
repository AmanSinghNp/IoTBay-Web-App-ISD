// controllers/paymentController.js
const Payment = require("../models/payment");
const Order = require("../models/order");

// View payment history
exports.getMyPayments = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const payments = await Payment.findAll({
      where: { userId: req.session.userId },
      include: [Order],
      order: [["createdAt", "DESC"]],
    });

    return res.render("payments", { payments });
  } catch (err) {
    console.error("Error loading payments:", err);
    return res.status(500).send("Failed to fetch payments.");
  }
};

// Show form to create a payment for an order
exports.getNewPaymentForm = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const orders = await Order.findAll({
      where: { userId: req.session.userId, status: "Placed" },
    });
    res.render("new_payment", { orders });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load payment form.");
  }
};

// Handle payment creation
exports.postNewPayment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const { orderId, paymentMethod, amount } = req.body;

  try {
    await Payment.create({
      userId: req.session.userId,
      orderId,
      paymentMethod,
      amount,
      status: "Completed",
    });

    res.redirect("/payments");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to process payment.");
  }
};
