const { Sequelize } = require("sequelize");

// SQLite DB stored in a local file
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite", // Will create this file in your project root
  logging: false, // Turn off logging
});

module.exports = sequelize;
