// routes/cart.js
const express   = require('express');
const router    = express.Router();
const cartCtrl  = require('../controllers/cartController');

// Show the cart
router.get('/cart', cartCtrl.showCart);

// Add to cart
router.post('/cart/add', cartCtrl.addToCart);

// Remove from cart
router.post('/cart/remove/:id', cartCtrl.removeFromCart);

module.exports = router;
