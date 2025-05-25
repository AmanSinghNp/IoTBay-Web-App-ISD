const User = require("../../models/user");
const UserAccessLog = require("../../models/userAccessLog");
const bcrypt = require("bcrypt");
const sequelize = require("../../config/database");

describe("User Access Management - Unit Tests", () => {
  beforeAll(async () => {
    // Database is already synced in setup.js, no need to sync again
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      await UserAccessLog.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("User Registration (Create)", () => {
    test("should create a new user with valid data", async () => {
      const userData = {
        fullName: "Test User",
        email: "test@example.com",
        password: await bcrypt.hash("password123", 10),
        phone: "1234567890",
        role: "customer",
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.fullName).toBe("Test User");
      expect(user.email).toBe("test@example.com");
      expect(user.role).toBe("customer");
      expect(user.isActive).toBe(true);
    });

    test("should fail to create user with duplicate email", async () => {
      const userData = {
        fullName: "Test User",
        email: "duplicate@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "customer",
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });

    test("should fail to create user without required fields", async () => {
      const userData = {
        email: "incomplete@example.com",
        // Missing fullName and password
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe("User Authentication (Read)", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        fullName: "Auth Test User",
        email: "auth@example.com",
        password: await bcrypt.hash("password123", 10),
        phone: "1234567890",
        role: "customer",
      });
    });

    test("should find user by email", async () => {
      const foundUser = await User.findOne({
        where: { email: "auth@example.com" },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.fullName).toBe("Auth Test User");
      expect(foundUser.email).toBe("auth@example.com");
    });

    test("should verify password correctly", async () => {
      const foundUser = await User.findOne({
        where: { email: "auth@example.com" },
      });

      const isValidPassword = await bcrypt.compare(
        "password123",
        foundUser.password
      );
      expect(isValidPassword).toBe(true);

      const isInvalidPassword = await bcrypt.compare(
        "wrongpassword",
        foundUser.password
      );
      expect(isInvalidPassword).toBe(false);
    });
  });

  describe("User Profile Update (Update)", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        fullName: "Update Test User",
        email: "update@example.com",
        password: await bcrypt.hash("password123", 10),
        phone: "1234567890",
        role: "customer",
      });
    });

    test("should update user profile information", async () => {
      await testUser.update({
        fullName: "Updated Name",
        phone: "9876543210",
      });

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.fullName).toBe("Updated Name");
      expect(updatedUser.phone).toBe("9876543210");
      expect(updatedUser.email).toBe("update@example.com"); // Should remain unchanged
    });

    test("should update user role", async () => {
      await testUser.update({ role: "staff" });

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.role).toBe("staff");
    });

    test("should activate/deactivate user", async () => {
      await testUser.update({ isActive: false });

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.isActive).toBe(false);

      await testUser.update({ isActive: true });
      const reactivatedUser = await User.findByPk(testUser.id);
      expect(reactivatedUser.isActive).toBe(true);
    });
  });

  describe("User Account Deletion (Delete)", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        fullName: "Delete Test User",
        email: "delete@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "customer",
      });
    });

    test("should delete user account", async () => {
      const userId = testUser.id;
      await testUser.destroy();

      const deletedUser = await User.findByPk(userId);
      expect(deletedUser).toBeNull();
    });

    test("should cascade delete user access logs when user is deleted", async () => {
      // Create access log for user
      const accessLog = await UserAccessLog.create({
        userId: testUser.id,
        loginTime: new Date(),
      });

      expect(accessLog).toBeDefined();

      // Delete user
      await testUser.destroy();

      // Check if access logs are also deleted (cascade)
      const remainingLogs = await UserAccessLog.findAll({
        where: { userId: testUser.id },
      });

      expect(remainingLogs).toHaveLength(0);
    });
  });

  describe("User Access Logs", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        fullName: "Log Test User",
        email: "log@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "customer",
      });
    });

    test("should create access log on login", async () => {
      const loginTime = new Date();
      const accessLog = await UserAccessLog.create({
        userId: testUser.id,
        loginTime: loginTime,
      });

      expect(accessLog).toBeDefined();
      expect(accessLog.userId).toBe(testUser.id);
      expect(accessLog.loginTime).toEqual(loginTime);
      expect(accessLog.logoutTime).toBeFalsy(); // Can be null or undefined
    });

    test("should update access log on logout", async () => {
      const loginTime = new Date();
      const accessLog = await UserAccessLog.create({
        userId: testUser.id,
        loginTime: loginTime,
      });

      const logoutTime = new Date(Date.now() + 1000); // 1 second later
      await accessLog.update({ logoutTime: logoutTime });

      const updatedLog = await UserAccessLog.findByPk(accessLog.id);
      expect(updatedLog.logoutTime).toEqual(logoutTime);
    });

    test("should retrieve user access logs by date range", async () => {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Create logs for different dates
      await UserAccessLog.create({
        userId: testUser.id,
        loginTime: yesterday,
      });

      await UserAccessLog.create({
        userId: testUser.id,
        loginTime: today,
      });

      const todayLogs = await UserAccessLog.findAll({
        where: {
          userId: testUser.id,
          loginTime: {
            [sequelize.Sequelize.Op.gte]: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            ),
          },
        },
      });

      expect(todayLogs).toHaveLength(1);
    });
  });
});
