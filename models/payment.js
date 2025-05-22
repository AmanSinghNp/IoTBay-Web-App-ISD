// models/payment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Order = require("./order");

const Payment = sequelize.define("Payment", {
  paymentMethod: {
    type: DataTypes.ENUM("Credit Card", "PayPal", "Bank Transfer"),
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  status: {
    type: DataTypes.ENUM("Pending", "Completed", "Failed", "Refunded"),
    defaultValue: "Pending",
  },
  transactionId: {
    type: DataTypes.STRING,
    unique: true
  },
  cardLastFour: {
    type: DataTypes.STRING(4),
    validate: {
      len: [4, 4]
    }
  },
  expiryDate: {
    type: DataTypes.STRING(5), // MM/YY format
    validate: {
      is: /^(0[1-9]|1[0-2])\/?([0-9]{2})$/
    }
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (payment) => {
      if (payment.paymentMethod === "Credit Card" && !payment.cardLastFour) {
        throw new Error("Card last four digits are required for credit card payments");
      }
    }
  }
});

// Set up relationships
User.hasMany(Payment, { foreignKey: "userId" });
Payment.belongsTo(User, { foreignKey: "userId" });

Order.hasOne(Payment, { foreignKey: "orderId" });
Payment.belongsTo(Order, { foreignKey: "orderId" });

module.exports = Payment;