// controllers/cartController.js
const Cart   = require('../models/cart');
const Device = require('../models/device');

exports.showCart = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Device }],
    });

    res.render('cart', { cartItems });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const userId   = req.session.userId;
    const { productId, quantity } = req.body;
    const qty      = parseInt(quantity, 10);
    if (!userId) return res.redirect('/login');

    const device = await Device.findByPk(productId);
    if (!device || device.stock < qty) {
      req.session.flash = { type: 'error', message: 'Insufficient stock' };
      return res.redirect(`/product/${productId}`);
    }

    const [row, created] = await Cart.findOrCreate({
      where: { userId, deviceId: productId },
      defaults: { quantity: qty },
    });
    if (!created) {
      row.quantity += qty;
      await row.save();
    }

    device.stock -= qty;
    await device.save();

    req.session.flash = { type: 'success', message: 'Added to cart successfully!' };
    // redirect back to product so you see the updated stock
    res.redirect(`/product/${productId}`);
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const cartId = req.params.id;

    const row = await Cart.findOne({ where: { id: cartId, userId } });
    if (!row) return res.redirect('/cart');

    const device = await Device.findByPk(row.deviceId);
    device.stock += row.quantity;
    await device.save();

    await row.destroy();
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
};
