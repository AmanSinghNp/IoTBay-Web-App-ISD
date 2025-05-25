const sequelize = require("../config/database"); // Use main database config which now supports test env

// Setup test database
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log("Test database connection established successfully.");

    // Sync all models for testing
    await sequelize.sync({ force: true });
    console.log("Test database synced successfully.");
  } catch (error) {
    console.error("Unable to connect to the test database:", error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log("Test database connection closed.");
  } catch (error) {
    console.error("Error closing test database connection:", error);
  }
});

// Global test timeout
jest.setTimeout(15000);
