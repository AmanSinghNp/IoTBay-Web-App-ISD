const sequelize = require("../config/testDatabase");

// Setup test database
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log("Test database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the test database:", error);
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
jest.setTimeout(10000);
