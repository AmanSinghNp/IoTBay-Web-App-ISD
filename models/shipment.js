const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Shipment = sequelize.define("Shipment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  addressId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shipmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  finalised: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Shipment;
