// models/order.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Device = require("./device");

const Order = sequelize.define("Order", {
  status: {
    type: DataTypes.ENUM("Placed", "Cancelled", "Completed"),
    defaultValue: "Placed",
  },
  anonymousId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  anonymousEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
});

// Set up relationships
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

// Order has many OrderItems (to be created)
// Payment and Shipment associations remain

module.exports = Order;
