const User = require("../models/user");
const Order = require("../models/order");

// Show the profile page
exports.showProfile = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.redirect("/login");

    res.render("profile", {
      user,
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });

    req.session.successMessage = null;
    req.session.errorMessage = null;
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile.");
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { fullName, email, phone } = req.body;

  try {
    const user = await User.findByPk(req.session.userId);

    if (!user) {
      return res.redirect("/login");
    }

    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    await user.save();

    req.session.userName = fullName;

    res.render("profile", {
      user,
      successMessage: "Profile updated successfully!",
      errorMessage: null,
    });
  } catch (error) {
    console.error(error);
    res.render("profile", {
      user: {},
      successMessage: null,
      errorMessage: "Failed to update profile.",
    });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  const userId = req.session.userId;

  try {
    // Cancel all "Placed" orders before deleting account
    await Order.update(
      { status: "Cancelled" },
      { where: { userId, status: "Placed" } }
    );

    // Delete user
    await User.destroy({ where: { id: userId } });

    // Clear session
    req.session.destroy(() => {
      // Store flash message in a temporary session (via cookie)
      res.redirect("/login?deleted=1");
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).send("Failed to delete account.");
  }
};

exports.showDashboard = (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  res.render("dashboard", {
    userName: req.session.userName,
    userRole: req.session.userRole,
  });
};
