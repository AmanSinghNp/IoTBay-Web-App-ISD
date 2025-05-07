// routes/product.js
const express = require("express");
const router  = express.Router();
const Device  = require("../models/device");


// GET /product  — currently just renders an empty product
router.post("/product/add", (req, res) => {
  // In future: add req.body.productId and req.body.quantity to session product
  res.redirect("/product/" + req.body.productId);
});

// Show the “product” page for a specific product
router.get("/product/:id", async (req, res, next) => {
  try {
    const product = await Device.findByPk(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    res.render("product", { product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
