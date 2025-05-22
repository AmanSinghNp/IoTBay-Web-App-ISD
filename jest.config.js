/**
 * Jest Test Configuration
 * Configures the testing environment for the IoTBay application
 *
 * @module jest.config
 * @description Defines test patterns, coverage settings, and environment setup
 */

// Configuration for Jest testing framework
module.exports = {
  /**
   * Test Environment Configuration
   * @property {string} testEnvironment - Use Node.js environment for testing
   */
  testEnvironment: "node",

  /**
   * Test File Patterns
   * @property {Array<string>} testMatch - Glob patterns to locate test files
   * @description Only runs files with .test.js extension in the tests directory
   */
  testMatch: ["**/tests/**/*.test.js"],

  /**
   * Code Coverage Configuration
   * @property {Array<string>} collectCoverageFrom - Source files to track coverage
   * @description Monitors coverage for models, controllers, and routes
   */
  collectCoverageFrom: [
    "models/**/*.js",
    "controllers/**/*.js",
    "routes/**/*.js",
  ],

  /**
   * Coverage Report Output
   * @property {string} coverageDirectory - Directory for coverage reports
   */
  coverageDirectory: "coverage",

  /**
   * Logging Configuration
   * @property {boolean} verbose - Enable detailed test output
   */
  verbose: true,

  /**
   * Test Setup Files
   * @property {Array<string>} setupFilesAfterEnv - Files to run before tests
   * @description Sets up test database and other test prerequisites
   */
  setupFilesAfterEnv: ["./tests/setup.js"],
};
