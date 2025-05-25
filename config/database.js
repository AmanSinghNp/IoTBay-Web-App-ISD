const { Sequelize } = require("sequelize");

// Determine which database to use based on NODE_ENV
const isTest = process.env.NODE_ENV === "test";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: isTest ? ":memory:" : "./database.sqlite", // Use in-memory for tests, file for production
  logging: false, // Turn off logging
  define: {
    timestamps: true,
    underscored: false,
  },
});

module.exports = sequelize;
