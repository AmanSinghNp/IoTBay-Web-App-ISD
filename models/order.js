/**
 * Order Model
 * Represents a customer order in the IoTBay system
 *
 * @module models/order
 * @description Manages customer orders for IoT devices
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Device = require("./device");

/**
 * Order Model Definition
 * @typedef {Object} Order
 *
 * Defines the structure and relationships for customer orders.
 * Each order represents a purchase of a specific device by a user.
 */
const Order = sequelize.define(
  "Order",
  {
    /**
     * Order quantity
     * @property {integer} quantity
     * @required
     * @description Number of units ordered for the specified device
     */
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    /**
     * Order status
     * @property {enum} status
     * @values ["Placed", "Cancelled", "Completed"]
     * @default "Placed"
     * @description Tracks the current state of the order
     */
    status: {
      type: DataTypes.ENUM("Placed", "Cancelled", "Completed"),
      defaultValue: "Placed",
    },
  },
  {
    /**
     * Model Options
     */
    timestamps: true, // Adds createdAt and updatedAt timestamps
    paranoid: true, // Enables soft deletes
  }
);

/**
 * Model Relationships
 *
 * @relationship User-Order (One-to-Many)
 * A user can have multiple orders
 * Each order belongs to one user
 */
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

/**
 * @relationship Device-Order (One-to-Many)
 * A device can be part of multiple orders
 * Each order is associated with one device
 */
Device.hasMany(Order, { foreignKey: "deviceId" });
Order.belongsTo(Device, { foreignKey: "deviceId" });

module.exports = Order;
