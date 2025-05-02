const User = require("../models/user");

// Show profile page
exports.showProfile = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const user = await User.findByPk(req.session.userId);
  res.render("profile", { user, successMessage: null, errorMessage: null });
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
  try {
    await User.destroy({ where: { id: req.session.userId } });
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.redirect("/profile");
  }
};
