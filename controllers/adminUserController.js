const User = require("../models/user");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

// Display users list with search functionality
exports.getUsersList = async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Search functionality
    if (search) {
      whereClause = {
        [Op.or]: [
          { fullName: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] }, // Don't send password to view
    });

    const totalPages = Math.ceil(count / limit);

    res.render("admin/users/index", {
      users,
      search: search || "",
      currentPage: parseInt(page),
      totalPages,
      totalUsers: count,
      successMessage: req.flash("success"),
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    req.flash("error", "Error loading users list");
    res.redirect("/dashboard");
  }
};

// Display create user form
exports.getCreateUser = (req, res) => {
  res.render("admin/users/create", {
    errorMessage: req.flash("error"),
    formData: {},
  });
};

// Handle create user
exports.postCreateUser = async (req, res) => {
  try {
    const { fullName, email, password, phone, role, isActive } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      req.flash("error", "Full name, email, and password are required.");
      return res.render("admin/users/create", {
        errorMessage: req.flash("error"),
        formData: req.body,
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash("error", "Email already exists.");
      return res.render("admin/users/create", {
        errorMessage: req.flash("error"),
        formData: req.body,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: role || "customer",
      isActive: isActive === "on" ? true : false,
    });

    req.flash("success", `User "${fullName}" created successfully.`);
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error creating user:", error);
    req.flash("error", "Error creating user. Please try again.");
    res.render("admin/users/create", {
      errorMessage: req.flash("error"),
      formData: req.body,
    });
  }
};

// Display user details
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    res.render("admin/users/details", {
      user,
      successMessage: req.flash("success"),
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    req.flash("error", "Error loading user details.");
    res.redirect("/admin/users");
  }
};

// Display edit user form
exports.getEditUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    res.render("admin/users/edit", {
      user,
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    console.error("Error fetching user for editing:", error);
    req.flash("error", "Error loading user data.");
    res.redirect("/admin/users");
  }
};

// Handle update user
exports.postUpdateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { fullName, email, phone, role, isActive, password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    // Check if email already exists (excluding current user)
    const existingUser = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: userId },
      },
    });

    if (existingUser) {
      req.flash("error", "Email already exists.");
      return res.redirect(`/admin/users/${userId}/edit`);
    }

    // Prepare update data
    const updateData = {
      fullName,
      email,
      phone: phone || null,
      role,
      isActive: isActive === "on" ? true : false,
    };

    // Update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    req.flash("success", "User updated successfully.");
    res.redirect(`/admin/users/${userId}/details`);
  } catch (error) {
    console.error("Error updating user:", error);
    req.flash("error", "Error updating user. Please try again.");
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
};

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    await user.update({ isActive: !user.isActive });

    const status = user.isActive ? "deactivated" : "activated";
    req.flash("success", `User "${user.fullName}" has been ${status}.`);

    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error toggling user status:", error);
    req.flash("error", "Error updating user status.");
    res.redirect("/admin/users");
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin/users");
    }

    // Prevent deleting yourself
    if (userId == req.session.userId) {
      req.flash("error", "You cannot delete your own account.");
      return res.redirect("/admin/users");
    }

    const userName = user.fullName;
    await user.destroy();

    req.flash("success", `User "${userName}" has been deleted.`);
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error deleting user:", error);
    req.flash("error", "Error deleting user. Please try again.");
    res.redirect("/admin/users");
  }
};
