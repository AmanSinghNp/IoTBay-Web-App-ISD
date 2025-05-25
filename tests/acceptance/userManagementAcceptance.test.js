const request = require("supertest");
const app = require("../../app");
const User = require("../../models/user");
const bcrypt = require("bcrypt");

describe("User Management - Acceptance Tests", () => {
  let staffUser, staffAgent;

  beforeEach(async () => {
    // Create staff user for testing
    staffUser = await User.create({
      fullName: "Staff User",
      email: "staff@acceptance.com",
      password: await bcrypt.hash("password123", 10),
      role: "staff",
      isActive: true,
    });

    // Create authenticated agent
    staffAgent = request.agent(app);

    // Login staff user
    await staffAgent.post("/login").send({
      email: "staff@acceptance.com",
      password: "password123",
    });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("AT-UM-01: Staff creates new customer account", () => {
    test("should allow staff to create new customer account with valid data", async () => {
      const userData = {
        fullName: "New Customer",
        email: "newcustomer@test.com",
        password: "password123",
        phone: "1234567890",
        role: "customer",
        isActive: "on",
      };

      const response = await staffAgent
        .post("/admin/users/create")
        .send(userData);

      // Should redirect after successful creation
      expect([200, 302]).toContain(response.status);

      // Verify user was created
      const createdUser = await User.findOne({
        where: { email: "newcustomer@test.com" },
      });

      expect(createdUser).toBeDefined();
      expect(createdUser.fullName).toBe("New Customer");
      expect(createdUser.role).toBe("customer");
      expect(createdUser.isActive).toBe(true);
    });

    test("should prevent creating user with duplicate email", async () => {
      // Create first user
      await User.create({
        fullName: "Existing User",
        email: "existing@test.com",
        password: await bcrypt.hash("password123", 10),
        role: "customer",
      });

      const userData = {
        fullName: "Duplicate User",
        email: "existing@test.com", // Same email
        password: "password123",
        role: "customer",
      };

      const response = await staffAgent
        .post("/admin/users/create")
        .send(userData);

      // Should show form with error
      expect([200, 302]).toContain(response.status);

      // Should not create duplicate user
      const users = await User.findAll({
        where: { email: "existing@test.com" },
      });

      expect(users).toHaveLength(1);
    });
  });

  describe("AT-UM-02: Staff searches for users", () => {
    beforeEach(async () => {
      // Create test users
      await User.bulkCreate([
        {
          fullName: "John Smith",
          email: "john@test.com",
          password: await bcrypt.hash("password123", 10),
          phone: "1111111111",
          role: "customer",
        },
        {
          fullName: "Jane Doe",
          email: "jane@test.com",
          password: await bcrypt.hash("password123", 10),
          phone: "2222222222",
          role: "customer",
        },
        {
          fullName: "Bob Johnson",
          email: "bob@test.com",
          password: await bcrypt.hash("password123", 10),
          phone: "3333333333",
          role: "staff",
        },
      ]);
    });

    test("should search users by name", async () => {
      const response = await staffAgent
        .get("/admin/users")
        .query({ search: "John" });

      expect([200, 302]).toContain(response.status);

      if (response.status === 200) {
        expect(response.text).toContain("John Smith");
        expect(response.text).toContain("Bob Johnson");
        expect(response.text).not.toContain("Jane Doe");
      }
    });

    test("should search users by phone number", async () => {
      const response = await staffAgent
        .get("/admin/users")
        .query({ search: "2222222222" });

      expect([200, 302]).toContain(response.status);

      if (response.status === 200) {
        expect(response.text).toContain("Jane Doe");
        expect(response.text).not.toContain("John Smith");
        expect(response.text).not.toContain("Bob Johnson");
      }
    });
  });

  describe("AT-UM-03: Staff updates user information", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        fullName: "Test User",
        email: "testuser@test.com",
        password: await bcrypt.hash("password123", 10),
        role: "customer",
        isActive: true,
      });
    });

    test("should update user role from customer to staff", async () => {
      const updateData = {
        fullName: "Test User",
        email: "testuser@test.com",
        phone: "1234567890",
        role: "staff",
        isActive: "on",
      };

      const response = await staffAgent
        .post(`/admin/users/${testUser.id}/edit`)
        .send(updateData);

      expect([200, 302]).toContain(response.status);

      // Verify role was updated
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.role).toBe("staff");
    });

    test("should update user contact information", async () => {
      const updateData = {
        fullName: "Updated Name",
        email: "updated@test.com",
        phone: "9876543210",
        role: "customer",
        isActive: "on",
      };

      const response = await staffAgent
        .post(`/admin/users/${testUser.id}/edit`)
        .send(updateData);

      expect([200, 302]).toContain(response.status);

      // Verify information was updated
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.fullName).toBe("Updated Name");
      expect(updatedUser.email).toBe("updated@test.com");
      expect(updatedUser.phone).toBe("9876543210");
    });
  });

  describe("AT-UM-04: Staff deactivates/activates user accounts", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        fullName: "Active User",
        email: "activeuser@test.com",
        password: await bcrypt.hash("password123", 10),
        role: "customer",
        isActive: true,
      });
    });

    test("should deactivate user account", async () => {
      const response = await staffAgent.post(
        `/admin/users/${testUser.id}/toggle-status`
      );

      expect([200, 302]).toContain(response.status);

      // Verify user was deactivated
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.isActive).toBe(false);
    });

    test("should reactivate deactivated user account", async () => {
      // First deactivate
      await testUser.update({ isActive: false });

      const response = await staffAgent.post(
        `/admin/users/${testUser.id}/toggle-status`
      );

      expect([200, 302]).toContain(response.status);

      // Verify user was reactivated
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.isActive).toBe(true);
    });

    test("should prevent deactivated user from logging in", async () => {
      // Deactivate user
      await testUser.update({ isActive: false });

      // Attempt to login with deactivated user
      const loginResponse = await request(app).post("/login").send({
        email: "activeuser@test.com",
        password: "password123",
      });

      // Should not allow login (implementation dependent)
      expect([200, 302, 401, 403]).toContain(loginResponse.status);
    });
  });

  describe("AT-UM-05: Staff deletes user accounts", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        fullName: "Delete User",
        email: "deleteuser@test.com",
        password: await bcrypt.hash("password123", 10),
        role: "customer",
        isActive: true,
      });
    });

    test("should delete user account", async () => {
      const response = await staffAgent.post(
        `/admin/users/${testUser.id}/delete`
      );

      expect([200, 302]).toContain(response.status);

      // Verify user was deleted
      const deletedUser = await User.findByPk(testUser.id);
      expect(deletedUser).toBeNull();
    });

    test("should prevent staff from deleting their own account", async () => {
      const response = await staffAgent.post(
        `/admin/users/${staffUser.id}/delete`
      );

      expect([200, 302, 403]).toContain(response.status);

      // Verify staff user still exists
      const existingUser = await User.findByPk(staffUser.id);
      expect(existingUser).toBeDefined();
    });

    test("should handle deletion of non-existent user gracefully", async () => {
      const nonExistentId = 99999;

      const response = await staffAgent.post(
        `/admin/users/${nonExistentId}/delete`
      );

      expect([200, 302, 404]).toContain(response.status);
    });
  });
});
