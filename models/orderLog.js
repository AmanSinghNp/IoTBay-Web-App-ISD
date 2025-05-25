const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Order = require("./order");

const OrderLog = sequelize.define("OrderLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Can be null for anonymous orders
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    // Actions: 'ORDER_CREATED', 'PAYMENT_ADDED', 'PAYMENT_CONFIRMED', 'SHIPMENT_CREATED', 'ORDER_CANCELLED', 'ORDER_UPDATED'
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true, // JSON string with additional details
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
});

// Relationships
Order.hasMany(OrderLog, { foreignKey: "orderId" });
OrderLog.belongsTo(Order, { foreignKey: "orderId" });

User.hasMany(OrderLog, { foreignKey: "userId" });
OrderLog.belongsTo(User, { foreignKey: "userId" });

module.exports = OrderLog;
