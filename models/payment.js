/**
 * Payment Model
 * Represents payment transactions in the IoTBay system
 *
 * @module models/payment
 * @description Manages payment processing and tracking for orders
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Order = require("./order");

/**
 * Payment Model Definition
 * @typedef {Object} Payment
 *
 * Defines the structure and validation rules for payment transactions.
 * Supports multiple payment methods and tracks payment status.
 */
const Payment = sequelize.define(
  "Payment",
  {
    /**
     * Payment method used for transaction
     * @property {enum} paymentMethod
     * @required
     * @values ["Credit Card", "PayPal", "Bank Transfer"]
     */
    paymentMethod: {
      type: DataTypes.ENUM("Credit Card", "PayPal", "Bank Transfer"),
      allowNull: false,
    },

    /**
     * Payment amount in currency units
     * @property {float} amount
     * @required
     * @validates {min} Must be at least 0.01
     */
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },

    /**
     * Payment status
     * @property {enum} status
     * @values ["Pending", "Completed", "Failed", "Refunded"]
     * @default "Pending"
     */
    status: {
      type: DataTypes.ENUM("Pending", "Completed", "Failed", "Refunded"),
      defaultValue: "Pending",
    },

    /**
     * Unique transaction identifier
     * @property {string} transactionId
     * @unique
     */
    transactionId: {
      type: DataTypes.STRING,
      unique: true,
    },

    /**
     * Last four digits of credit card
     * @property {string} cardLastFour
     * @validates {length} Must be exactly 4 characters
     * @security PCI compliance - only store last 4 digits
     */
    cardLastFour: {
      type: DataTypes.STRING(4),
      validate: {
        len: [4, 4],
      },
    },

    /**
     * Credit card expiry date
     * @property {string} expiryDate
     * @format MM/YY
     * @validates {regex} Must match MM/YY format
     */
    expiryDate: {
      type: DataTypes.STRING(5),
      validate: {
        is: /^(0[1-9]|1[0-2])\/?([0-9]{2})$/,
      },
    },
  },
  {
    /**
     * Model Options and Hooks
     */
    timestamps: true, // Adds createdAt and updatedAt timestamps
    hooks: {
      /**
       * Validate credit card information before creating payment
       * @throws {Error} If card details are missing for credit card payments
       */
      beforeCreate: (payment) => {
        if (payment.paymentMethod === "Credit Card" && !payment.cardLastFour) {
          throw new Error(
            "Card last four digits are required for credit card payments"
          );
        }
      },
    },
  }
);

/**
 * Model Relationships
 *
 * @relationship User-Payment (One-to-Many)
 * A user can have multiple payments
 * Each payment belongs to one user
 */
User.hasMany(Payment, { foreignKey: "userId" });
Payment.belongsTo(User, { foreignKey: "userId" });

/**
 * @relationship Order-Payment (One-to-One)
 * An order has one payment
 * Each payment is associated with one order
 */
Order.hasOne(Payment, { foreignKey: "orderId" });
Payment.belongsTo(Order, { foreignKey: "orderId" });

module.exports = Payment;
