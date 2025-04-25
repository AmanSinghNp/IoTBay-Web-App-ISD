const express = require("express");
const router = express.Router();

// Payments page
router.get("/payments", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("payments");
});

module.exports = router;
