// controllers/productController.js
const Device = require('../models/device');

// Render the single product page by ID
exports.showProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Device.findByPk(id);
    if (!product) {
      // If no product found, show 404
      return res.status(404).render('404');
    }
    // Render the product view with the fetched device
    res.render('product', { product });
  } catch (err) {
    // Pass any errors to the error handler
    next(err);
  }
};
