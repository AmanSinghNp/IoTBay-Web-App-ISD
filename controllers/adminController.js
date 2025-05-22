// Handles admin operations for managing users
const User = require("../models/user");
const { Op } = require("sequelize");

// Show list of all users with search option
exports.listUsers = async (req, res) => {
  try {
    const { search, searchBy } = req.query;
    let where = {};

    // Set up search filters
    if (search) {
      if (searchBy === "phone") {
        where.phone = { [Op.like]: `%${search}%` };
      } else {
        // Search by name by default
        where.fullName = { [Op.like]: `%${search}%` };
      }
    }

    // Get all users matching search
    const users = await User.findAll({
      where,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "fullName", "email", "phone", "role", "active"],
    });

    // Show users list page
    res.render("admin/users", {
      users,
      search: search || "",
      searchBy: searchBy || "name",
      successMessage: req.session.successMessage,
      errorMessage: req.session.errorMessage,
    });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).render("admin/users", {
      users: [],
      search: "",
      searchBy: "name",
      errorMessage: "Failed to load users",
    });
  } finally {
    // Clear messages after displaying them
    req.session.successMessage = null;
    req.session.errorMessage = null;
  }
};

// Enable or disable a user account
exports.toggleUserStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      req.session.errorMessage = "User not found";
      return res.redirect("/admin/users");
    }

    // Switch active status
    user.active = !user.active;
    await user.save();

    req.session.successMessage = `User ${
      user.active ? "activated" : "deactivated"
    } successfully`;
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error toggling user status:", error);
    req.session.errorMessage = "Failed to update user status";
    res.redirect("/admin/users");
  }
};

// Remove a user from the system
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      req.session.errorMessage = "User not found";
      return res.redirect("/admin/users");
    }

    // Don't allow admin to delete themselves
    if (user.id === req.session.userId) {
      req.session.errorMessage = "Cannot delete your own admin account";
      return res.redirect("/admin/users");
    }

    // Delete the user
    await user.destroy();
    req.session.successMessage = "User deleted successfully";
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error deleting user:", error);
    req.session.errorMessage = "Failed to delete user";
    res.redirect("/admin/users");
  }
};

// Change user information
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, email, phone, role } = req.body;

  try {
    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      req.session.errorMessage = "User not found";
      return res.redirect("/admin/users");
    }

    // Save new user details
    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    user.role = role;
    await user.save();

    req.session.successMessage = "User updated successfully";
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error updating user:", error);
    req.session.errorMessage = "Failed to update user";
    res.redirect("/admin/users");
  }
};
