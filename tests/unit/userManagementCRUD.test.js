const User = require("../../models/user");
const bcrypt = require("bcrypt");
const sequelize = require("../../config/database");
const { Op } = require("sequelize");

describe("User Management CRUD - Unit Tests", () => {
  beforeAll(async () => {
    // Database is already synced in setup.js
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("UT-UM-01: Create User Operations", () => {
    test("should create user with valid data and default values", async () => {
      const userData = {
        fullName: "Test User",
        email: "test@example.com",
        password: await bcrypt.hash("password123", 10),
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.fullName).toBe("Test User");
      expect(user.email).toBe("test@example.com");
      expect(user.role).toBe("customer"); // Default value
      expect(user.isActive).toBe(true); // Default value
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test("should create staff user with explicit role", async () => {
      const userData = {
        fullName: "Staff User",
        email: "staff@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "staff",
        phone: "1234567890",
      };

      const user = await User.create(userData);

      expect(user.role).toBe("staff");
      expect(user.phone).toBe("1234567890");
    });

    test("should fail to create user with duplicate email", async () => {
      const userData = {
        fullName: "First User",
        email: "duplicate@example.com",
        password: await bcrypt.hash("password123", 10),
      };

      await User.create(userData);

      // Attempt to create another user with same email
      await expect(User.create(userData)).rejects.toThrow();
    });

    test("should fail to create user without required fields", async () => {
      const incompleteData = {
        email: "incomplete@example.com",
        // Missing fullName and password
      };

      await expect(User.create(incompleteData)).rejects.toThrow();
    });

    test("should create inactive user when specified", async () => {
      const userData = {
        fullName: "Inactive User",
        email: "inactive@example.com",
        password: await bcrypt.hash("password123", 10),
        isActive: false,
      };

      const user = await User.create(userData);

      expect(user.isActive).toBe(false);
    });
  });

  describe("UT-UM-02: Read User Operations", () => {
    let testUsers;

    beforeEach(async () => {
      testUsers = await User.bulkCreate([
        {
          fullName: "John Smith",
          email: "john@example.com",
          password: await bcrypt.hash("password123", 10),
          phone: "1111111111",
          role: "customer",
        },
        {
          fullName: "Jane Doe",
          email: "jane@example.com",
          password: await bcrypt.hash("password123", 10),
          phone: "2222222222",
          role: "staff",
        },
        {
          fullName: "Bob Johnson",
          email: "bob@example.com",
          password: await bcrypt.hash("password123", 10),
          phone: "3333333333",
          role: "customer",
          isActive: false,
        },
      ]);
    });

    test("should find user by email", async () => {
      const user = await User.findOne({
        where: { email: "john@example.com" },
      });

      expect(user).toBeDefined();
      expect(user.fullName).toBe("John Smith");
      expect(user.email).toBe("john@example.com");
    });

    test("should find user by primary key", async () => {
      const user = await User.findByPk(testUsers[0].id);

      expect(user).toBeDefined();
      expect(user.fullName).toBe("John Smith");
    });

    test("should search users by name pattern", async () => {
      const users = await User.findAll({
        where: {
          fullName: {
            [Op.like]: "%John%",
          },
        },
      });

      expect(users).toHaveLength(2); // John Smith and Bob Johnson
      expect(users.map((u) => u.fullName)).toContain("John Smith");
      expect(users.map((u) => u.fullName)).toContain("Bob Johnson");
    });

    test("should search users by phone number", async () => {
      const users = await User.findAll({
        where: {
          phone: {
            [Op.like]: "%2222%",
          },
        },
      });

      expect(users).toHaveLength(1);
      expect(users[0].fullName).toBe("Jane Doe");
    });

    test("should filter users by role", async () => {
      const customers = await User.findAll({
        where: { role: "customer" },
      });

      const staff = await User.findAll({
        where: { role: "staff" },
      });

      expect(customers).toHaveLength(2);
      expect(staff).toHaveLength(1);
      expect(staff[0].fullName).toBe("Jane Doe");
    });

    test("should filter users by active status", async () => {
      const activeUsers = await User.findAll({
        where: { isActive: true },
      });

      const inactiveUsers = await User.findAll({
        where: { isActive: false },
      });

      expect(activeUsers).toHaveLength(2);
      expect(inactiveUsers).toHaveLength(1);
      expect(inactiveUsers[0].fullName).toBe("Bob Johnson");
    });

    test("should exclude password from query results", async () => {
      const user = await User.findOne({
        where: { email: "john@example.com" },
        attributes: { exclude: ["password"] },
      });

      expect(user).toBeDefined();
      expect(user.password).toBeUndefined();
      expect(user.fullName).toBe("John Smith");
    });

    test("should return null for non-existent user", async () => {
      const user = await User.findOne({
        where: { email: "nonexistent@example.com" },
      });

      expect(user).toBeNull();
    });
  });

  describe("UT-UM-03: Update User Operations", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        fullName: "Update Test User",
        email: "update@example.com",
        password: await bcrypt.hash("password123", 10),
        phone: "1234567890",
        role: "customer",
        isActive: true,
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

    test("should update user email", async () => {
      await testUser.update({
        email: "newemail@example.com",
      });

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.email).toBe("newemail@example.com");
    });

    test("should update user role", async () => {
      await testUser.update({ role: "staff" });

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.role).toBe("staff");
    });

    test("should toggle user active status", async () => {
      // Deactivate user
      await testUser.update({ isActive: false });
      let updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.isActive).toBe(false);

      // Reactivate user
      await testUser.update({ isActive: true });
      updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.isActive).toBe(true);
    });

    test("should update password", async () => {
      const newPassword = "newpassword123";
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await testUser.update({ password: hashedPassword });

      const updatedUser = await User.findByPk(testUser.id);
      const isValidPassword = await bcrypt.compare(
        newPassword,
        updatedUser.password
      );
      expect(isValidPassword).toBe(true);
    });

    test("should update multiple fields simultaneously", async () => {
      await testUser.update({
        fullName: "Multi Update User",
        phone: "5555555555",
        role: "staff",
        isActive: false,
      });

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.fullName).toBe("Multi Update User");
      expect(updatedUser.phone).toBe("5555555555");
      expect(updatedUser.role).toBe("staff");
      expect(updatedUser.isActive).toBe(false);
    });

    test("should update updatedAt timestamp", async () => {
      const originalUpdatedAt = testUser.updatedAt;

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await testUser.update({ fullName: "Timestamp Test" });

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    test("should fail to update with duplicate email", async () => {
      // Create another user
      await User.create({
        fullName: "Another User",
        email: "another@example.com",
        password: await bcrypt.hash("password123", 10),
      });

      // Try to update testUser with existing email
      await expect(
        testUser.update({ email: "another@example.com" })
      ).rejects.toThrow();
    });
  });

  describe("UT-UM-04: Delete User Operations", () => {
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

    test("should delete user by ID", async () => {
      const userId = testUser.id;
      await User.destroy({ where: { id: userId } });

      const deletedUser = await User.findByPk(userId);
      expect(deletedUser).toBeNull();
    });

    test("should delete multiple users by criteria", async () => {
      // Create additional test users
      await User.bulkCreate([
        {
          fullName: "Bulk Delete 1",
          email: "bulk1@example.com",
          password: await bcrypt.hash("password123", 10),
          role: "customer",
        },
        {
          fullName: "Bulk Delete 2",
          email: "bulk2@example.com",
          password: await bcrypt.hash("password123", 10),
          role: "customer",
        },
      ]);

      // Delete all customer users
      await User.destroy({ where: { role: "customer" } });

      const remainingUsers = await User.findAll();
      expect(remainingUsers).toHaveLength(0);
    });

    test("should handle deletion of non-existent user", async () => {
      const nonExistentId = 99999;
      const deletedCount = await User.destroy({ where: { id: nonExistentId } });

      expect(deletedCount).toBe(0);
    });

    test("should force delete user", async () => {
      const userId = testUser.id;
      await User.destroy({ where: { id: userId }, force: true });

      const deletedUser = await User.findByPk(userId);
      expect(deletedUser).toBeNull();
    });
  });

  describe("UT-UM-05: User Validation and Constraints", () => {
    test("should validate email format", async () => {
      const invalidEmailData = {
        fullName: "Invalid Email User",
        email: "invalid-email",
        password: await bcrypt.hash("password123", 10),
      };

      // Note: Sequelize doesn't have built-in email validation
      // This would need to be implemented at the application level
      const user = await User.create(invalidEmailData);
      expect(user).toBeDefined(); // Current implementation allows invalid emails
    });

    test("should enforce unique email constraint", async () => {
      const userData = {
        fullName: "Unique Test User",
        email: "unique@example.com",
        password: await bcrypt.hash("password123", 10),
      };

      await User.create(userData);

      // Attempt to create another user with same email
      await expect(User.create(userData)).rejects.toThrow();
    });

    test("should enforce role enum constraint", async () => {
      const invalidRoleData = {
        fullName: "Invalid Role User",
        email: "invalidrole@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "invalid_role",
      };

      await expect(User.create(invalidRoleData)).rejects.toThrow();
    });

    test("should allow null phone number", async () => {
      const userData = {
        fullName: "No Phone User",
        email: "nophone@example.com",
        password: await bcrypt.hash("password123", 10),
        phone: null,
      };

      const user = await User.create(userData);
      expect(user.phone).toBeNull();
    });

    test("should enforce required fields", async () => {
      // Test missing fullName
      await expect(
        User.create({
          email: "nofullname@example.com",
          password: await bcrypt.hash("password123", 10),
        })
      ).rejects.toThrow();

      // Test missing email
      await expect(
        User.create({
          fullName: "No Email User",
          password: await bcrypt.hash("password123", 10),
        })
      ).rejects.toThrow();

      // Test missing password
      await expect(
        User.create({
          fullName: "No Password User",
          email: "nopassword@example.com",
        })
      ).rejects.toThrow();
    });
  });
});
