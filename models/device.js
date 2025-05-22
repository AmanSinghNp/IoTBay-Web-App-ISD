/**
 * Device Model
 * Represents an IoT device in the system's catalog
 *
 * @module models/device
 * @description Core model for managing IoT devices inventory and catalog
 */

// Defines the IoT device model for the product catalog
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Device Model Definition
 * @typedef {Object} Device
 *
 * Defines the structure and validation rules for IoT devices in the system.
 * Each device represents a product that can be purchased by customers.
 */
// Set up device database table structure
const Device = sequelize.define(
  "Device",
  {
    // Device name (required)
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // Manufacturer/brand name (required)
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // Product category, defaults to "uncategorized"
    catalog: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "uncategorized",
      validate: {
        notEmpty: true,
      },
    },

    // Price in currency units (must be positive)
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: 0.01,
        notNull: true,
      },
    },

    // Available quantity in stock (defaults to 0)
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
        notNull: true,
      },
    },

    // Product description (optional)
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Path to product image (must start with "/" or "http")
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidPath(value) {
          if (value && !value.startsWith("/") && !value.startsWith("http")) {
            throw new Error('Image URL must start with "/" or "http"');
          }
        },
      },
    },
  },
  {
    // Enable timestamps and soft deletes
    timestamps: true,
    paranoid: true,
  }
);

module.exports = Device;
