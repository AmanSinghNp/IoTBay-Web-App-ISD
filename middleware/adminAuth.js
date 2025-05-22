const User = require("../models/user");

// Middleware to check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await User.findByPk(req.session.userId);

    if (!user || user.role !== "admin" || !user.active) {
      return res.status(403).render("403", {
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).send("Server error");
  }
};
