module.exports.isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    req.flash("error", "You must be signed in to view this page.");
    return res.redirect("/login");
  }
  next();
};

module.exports.isStaffOrAdmin = (req, res, next) => {
  if (
    !req.session.userRole ||
    (req.session.userRole !== "staff" && req.session.userRole !== "admin")
  ) {
    req.flash("error", "You do not have permission to view this page.");
    return res.redirect("/"); // Or a more appropriate unauthorized page
  }
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (!req.session.userRole || req.session.userRole !== "admin") {
    req.flash("error", "You do not have permission to perform this action.");
    return res.redirect("/"); // Or a more appropriate unauthorized page
  }
  next();
};

// Admin-only access for user management
module.exports.isAdminOnly = (req, res, next) => {
  if (!req.session.userRole || req.session.userRole !== "staff") {
    req.flash("error", "Access denied. Admin privileges required.");
    return res.redirect("/dashboard");
  }
  next();
};
