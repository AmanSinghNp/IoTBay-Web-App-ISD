// End-to-end tests for user authentication features
const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../app");
const User = require("../../models/user");
const sequelize = require("../../config/database");

describe("Authentication", () => {
  // Set up test database
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Clear users before each test
  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  // Test user registration functionality
  describe("User Registration", () => {
    // Test successful registration
    it("should register a new user with valid data", async () => {
      const userData = {
        fullName: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "1234567890",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully"
      );
      expect(response.body.user).toHaveProperty("fullName", userData.fullName);
      expect(response.body.user).toHaveProperty("email", userData.email);
      expect(response.body.user).toHaveProperty("role", "customer");

      // Make sure user was saved to database
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).toBeTruthy();
      expect(user.fullName).toBe(userData.fullName);
    });

    // Test duplicate email prevention
    it("should not register a user with existing email", async () => {
      const existingUser = {
        fullName: "Existing User",
        email: "existing@example.com",
        password: "password123",
      };

      await User.create(existingUser);

      const response = await request(app)
        .post("/auth/register")
        .send(existingUser)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Email already registered");
    });

    // Test input validation
    it("should not register a user with invalid data", async () => {
      const invalidUser = {
        fullName: "",
        email: "invalid-email",
        password: "123", // too short
      };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  // Test user login functionality
  describe("User Login", () => {
    const testPassword = "password123";

    // Create test user before each login test
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      await User.create({
        fullName: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "customer",
      });
    });

    // Test successful login
    it("should login with valid credentials", async () => {
      const credentials = {
        email: "test@example.com",
        password: testPassword,
      };

      const response = await request(app)
        .post("/auth/login")
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("email", credentials.email);
    });

    // Test invalid email handling
    it("should not login with invalid email", async () => {
      const credentials = {
        email: "nonexistent@example.com",
        password: testPassword,
      };

      const response = await request(app)
        .post("/auth/login")
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty(
        "error",
        "Invalid email or password"
      );
    });

    // Test invalid password handling
    it("should not login with invalid password", async () => {
      const credentials = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/auth/login")
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty(
        "error",
        "Invalid email or password"
      );
    });
  });
});
