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
});

// Set up relationships
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

// Order has many OrderItems (to be created)
// Payment and Shipment associations remain

module.exports = Order;
