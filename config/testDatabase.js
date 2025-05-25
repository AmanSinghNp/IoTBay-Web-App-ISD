const { Sequelize } = require("sequelize");

// Create a separate in-memory SQLite database for testing
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: ":memory:", // Use in-memory database for tests
  logging: false, // Disable logging during tests
  define: {
    timestamps: true,
    underscored: false,
  },
});

module.exports = sequelize;
