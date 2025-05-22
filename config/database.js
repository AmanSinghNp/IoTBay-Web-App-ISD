/**
 * Database Configuration
 * Sets up the Sequelize ORM connection for the IoTBay application
 *
 * @module config/database
 * @description Configures database connection based on environment
 */

const { Sequelize } = require("sequelize");
const path = require("path");

/**
 * Environment Configuration
 * @constant {string} env - Current environment (development/test/production)
 * @default "development"
 */
const env = process.env.NODE_ENV || "development";

/**
 * Database Path Configuration
 * Uses in-memory database for testing and file-based database for other environments
 *
 * @constant {string} dbPath
 * @default ":memory:" for test environment
 * @default "./database.sqlite" for other environments
 */
const dbPath =
  env === "test" ? ":memory:" : path.join(__dirname, "../database.sqlite");

/**
 * Sequelize Instance Configuration
 * @instance
 * @property {string} dialect - SQLite database dialect
 * @property {string} storage - Database storage location
 * @property {boolean} logging - SQL query logging (disabled)
 */
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: false, // Disable SQL query logging
});

module.exports = sequelize;
