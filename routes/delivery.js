// routes/delivery.js
const express = require('express');
const router  = express.Router();
const Cart    = require('../models/cart');
const Device  = require('../models/device');
const Address = require('../models/address');

router.get('/delivery', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    // load this user’s cart (assumes you’ve set up Cart→Device associations)
    const cartItems = await Cart.findAll({
      where: { userId: req.session.userId },
      include: Device
    });

    const addresses = await Address.findAll({
      where: { userId }
    });

    res.render('delivery', { cartItems, addresses, userId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
