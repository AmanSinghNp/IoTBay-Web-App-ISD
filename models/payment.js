// models/payment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Order = require("./order");

const Payment = sequelize.define("Payment", {
  paymentMethod: {
    type: DataTypes.STRING, // Example: "Credit Card", "PayPal"
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("Pending", "Completed", "Failed"),
    defaultValue: "Pending",
  },
});

// Set up relationships
User.hasMany(Payment, { foreignKey: "userId" });
Payment.belongsTo(User, { foreignKey: "userId" });

Order.hasMany(Payment, { foreignKey: "orderId" });
Payment.belongsTo(Order, { foreignKey: "orderId" });

module.exports = Payment;
