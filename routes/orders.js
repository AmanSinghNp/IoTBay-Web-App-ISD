const express = require("express");
const router = express.Router();

// Orders page
router.get("/orders", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("orders");
});

module.exports = router;
