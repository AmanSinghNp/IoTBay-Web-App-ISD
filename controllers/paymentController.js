// controllers/paymentController.js
const { Op } = require("sequelize");
const Payment = require("../models/payment");
const Order = require("../models/order");
const Device = require("../models/device");

// View payment history (with search filters)
exports.getMyPayments = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const { paymentId, date } = req.query;

  const where = {
    userId: req.session.userId,
  };

  if (paymentId) where.id = paymentId;
  if (date) where.createdAt = { [Op.gte]: new Date(date) };

  try {
    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Order,
          include: [Device],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.render("payments", { payments });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch payments.");
  }
};

// Show form to create a payment for an order
exports.getNewPaymentForm = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

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
  if (!req.session.userId) return res.redirect("/login");

  const { orderId, paymentMethod, amount } = req.body;

  try {
    await Payment.create({
      userId: req.session.userId,
      orderId,
      paymentMethod,
      amount,
      status: "Pending",
    });

    res.redirect("/payments");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to process payment.");
  }
};

// Show edit form for a payment (only if Pending)
exports.getEditPaymentForm = async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, {
    include: [Order],
  });

  if (
    !payment ||
    payment.userId !== req.session.userId ||
    payment.status !== "Pending"
  ) {
    return res.status(403).send("Unauthorized or payment not editable.");
  }

  res.render("edit_payment", { payment });
};

// Handle payment edit form POST
exports.postEditPayment = async (req, res) => {
  const { paymentMethod, amount } = req.body;
  const { id } = req.params;

  try {
    const payment = await Payment.findByPk(id);

    if (
      !payment ||
      payment.userId !== req.session.userId ||
      payment.status !== "Pending"
    ) {
      return res.status(403).send("Unauthorized or locked payment.");
    }

    payment.paymentMethod = paymentMethod;
    payment.amount = amount;
    await payment.save();

    res.redirect("/payments");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update payment.");
  }
};

// Delete a pending payment
exports.deletePayment = async (req, res) => {
  const { id } = req.params;

  try {
    const payment = await Payment.findByPk(id);

    if (
      !payment ||
      payment.userId !== req.session.userId ||
      payment.status !== "Pending"
    ) {
      return res.status(403).send("Unauthorized or already processed.");
    }

    await payment.destroy();
    res.redirect("/payments");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete payment.");
  }
};
