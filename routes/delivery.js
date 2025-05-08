// routes/delivery.js
const express = require('express');
const router  = express.Router();
const Cart    = require('../models/cart');
const Device  = require('../models/device');

router.get('/delivery', async (req, res, next) => {
  try {
    // load this user’s cart (assumes you’ve set up Cart→Device associations)
    const cartItems = await Cart.findAll({
      where: { userId: req.session.userId },
      include: Device
    });
    res.render('delivery', { cartItems });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
