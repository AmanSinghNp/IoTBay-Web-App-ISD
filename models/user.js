/**
 * User Model
 * Represents a user in the IoTBay system
 *
 * @module models/user
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * User Model Definition
 * @typedef {Object} User
 *
 * Defines the structure and validation rules for User entities in the system.
 * Users can be either customers or staff members, each with their own permissions.
 */
const User = sequelize.define(
  "User",
  {
    /**
     * User's full name
     * @property {string} fullName
     * @required
     * @validates {notEmpty} Must not be empty
     * @validates {length} Must be between 2 and 100 characters
     */
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },

    /**
     * User's email address
     * @property {string} email
     * @required
     * @unique
     * @validates {notEmpty} Must not be empty
     * @validates {isEmail} Must be a valid email format
     */
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isEmail: true,
      },
    },

    /**
     * User's password (hashed)
     * @property {string} password
     * @required
     * @validates {notEmpty} Must not be empty
     * @validates {length} Must be at least 6 characters long
     * @security Stored as bcrypt hash
     */
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 100], // minimum 6 characters
      },
    },

    /**
     * User's phone number
     * @property {string} phone
     * @optional
     * @default null
     * @validates {regex} Must be exactly 10 digits
     */
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: {
        is: /^[0-9]{10}$/, // Exactly 10 digits
      },
    },

    /**
     * User's role in the system
     * @property {enum} role
     * @values ["customer", "staff"]
     * @default "customer"
     * @validates {isIn} Must be either "customer" or "staff"
     */
    role: {
      type: DataTypes.ENUM("customer", "staff"),
      defaultValue: "customer",
      validate: {
        isIn: [["customer", "staff"]],
      },
    },
  },
  {
    /**
     * Model Options
     */
    timestamps: true, // Adds createdAt and updatedAt timestamps
    paranoid: true, // Enables soft deletes
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
    ],
  }
);

// Export the User model
module.exports = User;
