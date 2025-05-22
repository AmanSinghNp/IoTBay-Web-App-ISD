const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const User = require("../../models/user");

describe("User Model", () => {
  beforeAll(async () => {
    // Connect to test database and sync model
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.destroy({ where: {} });
  });

  it("should create a valid user", async () => {
    const validUser = {
      fullName: "John Doe",
      email: "john@example.com",
      password: "password123",
      phone: "1234567890",
      role: "customer",
    };

    const user = await User.create(validUser);
    expect(user.fullName).toBe(validUser.fullName);
    expect(user.email).toBe(validUser.email);
    expect(user.password).toBe(validUser.password);
    expect(user.phone).toBe(validUser.phone);
    expect(user.role).toBe(validUser.role);
  });

  it("should not create a user without required fields", async () => {
    const invalidUser = {
      fullName: "",
      email: "",
      password: "",
    };

    await expect(User.create(invalidUser)).rejects.toThrow();
  });

  it("should not create a user with invalid email", async () => {
    const userWithInvalidEmail = {
      fullName: "John Doe",
      email: "invalid-email",
      password: "password123",
      role: "customer",
    };

    await expect(User.create(userWithInvalidEmail)).rejects.toThrow();
  });

  it("should not create a user with invalid role", async () => {
    const userWithInvalidRole = {
      fullName: "John Doe",
      email: "john@example.com",
      password: "password123",
      role: "invalid-role",
    };

    await expect(User.create(userWithInvalidRole)).rejects.toThrow();
  });

  it("should not create a user with short password", async () => {
    const userWithShortPassword = {
      fullName: "John Doe",
      email: "john@example.com",
      password: "12345", // less than 6 characters
      role: "customer",
    };

    await expect(User.create(userWithShortPassword)).rejects.toThrow();
  });

  it("should not create a user with invalid phone number", async () => {
    const userWithInvalidPhone = {
      fullName: "John Doe",
      email: "john@example.com",
      password: "password123",
      phone: "123", // less than 10 digits
      role: "customer",
    };

    await expect(User.create(userWithInvalidPhone)).rejects.toThrow();
  });

  it("should create a user without phone number", async () => {
    const userWithoutPhone = {
      fullName: "John Doe",
      email: "john@example.com",
      password: "password123",
      role: "customer",
    };

    const user = await User.create(userWithoutPhone);
    expect(user.phone).toBeNull();
  });

  it("should create a user with default role", async () => {
    const userWithoutRole = {
      fullName: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    const user = await User.create(userWithoutRole);
    expect(user.role).toBe("customer");
  });

  it("should not create a user with empty full name", async () => {
    const userWithEmptyName = {
      fullName: "",
      email: "john@example.com",
      password: "password123",
    };

    await expect(User.create(userWithEmptyName)).rejects.toThrow();
  });

  it("should enforce unique email addresses", async () => {
    const user1Data = {
      fullName: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    const user2Data = {
      fullName: "Jane Doe",
      email: "john@example.com", // Same email as user1
      password: "password456",
    };

    await User.create(user1Data);
    await expect(User.create(user2Data)).rejects.toThrow();
  });
});
