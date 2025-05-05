const bcrypt = require("bcrypt");
const User = require("../models/user");
const UserAccessLog = require("../models/userAccessLog");

// Show login page
exports.getLogin = (req, res) => {
  const successMessage =
    req.query.deleted === "1"
      ? "Your account has been successfully deleted."
      : null;

  res.render("login", {
    error: null,
    successMessage,
  });
};

// Handle login form
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password.",
        successMessage: null,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      // Save session data
      req.session.userId = user.id;
      req.session.userName = user.fullName;
      req.session.userRole = user.role;

      // Create login record
      const accessLog = await UserAccessLog.create({
        userId: user.id,
        loginTime: new Date(),
      });

      req.session.accessLogId = accessLog.id;

      res.redirect("/dashboard");
    } else {
      res.render("login", {
        error: "Invalid email or password.",
        successMessage: null,
      });
    }
  } catch (error) {
    console.error(error);
    res.render("login", {
      error: "Internal server error.",
      successMessage: null,
    });
  }
};

// Show register page
exports.getRegister = (req, res) => {
  res.render("register", { error: null });
};

// Handle register form
exports.postRegister = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      phone,
      password: hash,
      role: "customer",
    });

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", {
      error: "Error registering user. Email might be taken.",
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    if (req.session.accessLogId) {
      const accessLog = await UserAccessLog.findByPk(req.session.accessLogId);
      if (accessLog) {
        accessLog.logoutTime = new Date();
        await accessLog.save();
      }
    }

    req.session.destroy();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};
