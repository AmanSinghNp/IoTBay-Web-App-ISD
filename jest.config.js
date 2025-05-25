module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/tests/unit/**/*.test.js",
    "**/tests/integration/**/*.test.js",
  ],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "!models/payment.js", // Exclude old SQLite model
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 10000,
};
