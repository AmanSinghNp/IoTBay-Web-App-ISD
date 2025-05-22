const { Payment, Order, User } = require('../models');
const { validationResult } = require('express-validator');

exports.getPaymentPage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const userId = req.session.user.id;
    const user = await User.findByPk(userId);
    
    const order = await Order.findOne({
      where: { userId, status: 'Pending' },
      include: ['Items']
    });

    if (!order) {
      return res.redirect('/cart');
    }

    res.render('payments', {
      cartItems: order.Items,
      order: {
        id: order.id,
        subtotal: order.subtotal || order.Items.reduce((sum, item) => sum + item.Device.price * item.quantity, 0),
        shippingCost: order.shippingCost || 0,
        totalAmount: order.totalAmount || (order.subtotal + (order.shippingCost || 0))
      },
      user: {
        name: user.name,
        email: user.email,
        address: user.address,
        city: user.city,
        postalCode: user.postalCode
      },
      csrfToken: req.csrfToken(),
      currentStep: 3 // For the progress indicator
    });
  } catch (error) {
    console.error('Payment page error:', error);
    res.status(500).send('Error loading payment page');
  }
};

exports.processPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Handle validation errors
    const userId = req.session.user.id;
    const user = await User.findByPk(userId);
    const order = await Order.findOne({
      where: { userId, status: 'Pending' },
      include: ['Items']
    });

    return res.render('payments', {
      cartItems: order.Items,
      order: {
        id: order.id,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        totalAmount: order.totalAmount
      },
      user: {
        name: user.name,
        email: user.email,
        address: user.address,
        city: user.city,
        postalCode: user.postalCode
      },
      csrfToken: req.csrfToken(),
      currentStep: 3,
      errors: errors.array()
    });
  }

  try {
    const { paymentMethod, cardNumber, expiryDate, cvv } = req.body;
    const userId = req.session.user.id;
    
    const order = await Order.findOne({
      where: { userId, status: 'Pending' },
      include: ['Items']
    });

    if (!order) {
      req.flash('error', 'No pending order found');
      return res.redirect('/cart');
    }

    // Process payment
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cardLastFour = cardNumber ? cardNumber.slice(-4) : null;

    await Payment.create({
      paymentMethod,
      amount: order.totalAmount,
      status: 'Completed',
      transactionId,
      cardLastFour,
      expiryDate,
      userId,
      orderId: order.id
    });

    // Update order status
    await order.update({ status: 'Processing' });

    //await this.clearCart(req, res);

    // Redirect to success page with order ID
    res.redirect(`/payments/success?orderId=${order.id}`);
  } catch (error) {
    console.error('Payment processing error:', error);
    req.flash('error', 'Payment processing failed');
    res.redirect('/payments');
  }
};

exports.paymentSuccess = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    
    // 1. Verify payment was successful
    const order = await Order.findByPk(orderId, {
      include: [Payment]
    });

    if (!order || order.Payment.status !== 'Completed') {
      return res.redirect('/orders');
    }

    // 2. NOW clear the cart (server-side, no API call needed)
    await CartItem.destroy({
      where: { userId: req.session.user.id }
    });

    // 3. Render success page
    res.render('paymentSuccess', {
      order,
      user: req.session.user
    });

  } catch (error) {
    console.error('Success page error:', error);
    res.redirect('/orders');
  }
};



