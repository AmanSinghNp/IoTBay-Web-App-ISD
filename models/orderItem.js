const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Order = require("./order");
const Device = require("./device");

const OrderItem = sequelize.define("OrderItem", {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

Order.hasMany(OrderItem, { foreignKey: "orderId" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Device.hasMany(OrderItem, { foreignKey: "deviceId" });
OrderItem.belongsTo(Device, { foreignKey: "deviceId" });

module.exports = OrderItem;
