// models/order.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Device = require("./device");

const Order = sequelize.define("Order", {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("Placed", "Cancelled", "Completed"),
    defaultValue: "Placed",
  },
});

// Set up relationships
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

Device.hasMany(Order, { foreignKey: "deviceId" });
Order.belongsTo(Device, { foreignKey: "deviceId" });

module.exports = Order;
