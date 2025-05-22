/**
 * Test Environment Setup
 * Configures the test environment and database for Jest tests
 *
 * @module tests/setup
 * @description Handles database initialization, cleanup, and global test configuration
 */

const sequelize = require("../config/database");

/**
 * Environment Configuration
 * Forces Node environment to "test" to use test-specific settings
 */
process.env.NODE_ENV = "test";

/**
 * Test Timeout Configuration
 * Extends Jest's default timeout to accommodate database operations
 * @constant {number} timeout - 10 seconds
 */
jest.setTimeout(10000);

/**
 * Global Test Setup
 * Runs once before all test suites
 *
 * @function beforeAll
 * @async
 * @description
 * 1. Verifies database connection
 * 2. Creates fresh test database tables
 * 3. Exits process if database setup fails
 */
beforeAll(async () => {
  try {
    // Connect to test database
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Create fresh tables
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
});

/**
 * Global Test Teardown
 * Runs once after all test suites complete
 *
 * @function afterAll
 * @async
 * @description Closes database connection and performs cleanup
 */
afterAll(async () => {
  if (sequelize) {
    try {
      await sequelize.close();
    } catch (error) {
      // Ignore "database is closed" errors
      if (!error.message.includes("Database is closed")) {
        console.error("Error closing database connection:", error);
      }
    }
  }
});

/**
 * Process Termination Handler
 * Ensures clean database shutdown on process termination
 *
 * @event SIGTERM
 * @async
 * @description
 * 1. Closes database connection
 * 2. Resets connection state
 * 3. Exits process gracefully
 */
process.on("SIGTERM", async () => {
  if (sequelize) {
    try {
      await sequelize.close();
      isConnected = false;
    } catch (error) {
      // Ignore cleanup errors during process termination
    }
  }
  process.exit(0);
});
