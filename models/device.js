// models/device.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Device = sequelize.define("Device", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  catalog: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "uncategorized",
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  description: {
    type: DataTypes.STRING,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Device;
