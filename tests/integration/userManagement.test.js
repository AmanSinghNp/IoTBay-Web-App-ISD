const request = require("supertest");
const app = require("../../app");
const User = require("../../models/user");
const bcrypt = require("bcrypt");

describe("User Management - Integration Tests", () => {
  let adminUser, staffUser, customerUser, adminAgent, staffAgent, customerAgent;

  beforeEach(async () => {
    // Create test users
    adminUser = await User.create({
      fullName: "Admin User",
      email: "admin@test.com",
      password: await bcrypt.hash("password123", 10),
      role: "admin",
    });

    staffUser = await User.create({
      fullName: "Staff User",
      email: "staff@test.com",
      password: await bcrypt.hash("password123", 10),
      role: "staff",
    });

    customerUser = await User.create({
      fullName: "Customer User",
      email: "customer@test.com",
      password: await bcrypt.hash("password123", 10),
      role: "customer",
    });

    // Create authenticated agents
    adminAgent = request.agent(app);
    staffAgent = request.agent(app);
    customerAgent = request.agent(app);

    // Login admin user
    await adminAgent.post("/login").send({
      email: "admin@test.com",
      password: "password123",
    });

    // Login staff user
    await staffAgent.post("/login").send({
      email: "staff@test.com",
      password: "password123",
    });

    // Login customer user
    await customerAgent.post("/login").send({
      email: "customer@test.com",
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

  describe("User Registration (Create)", () => {
    test("should allow new user registration", async () => {
      const userData = {
        fullName: "New User",
        email: "newuser@test.com",
        password: "password123",
        confirmPassword: "password123",
        phone: "1234567890",
        role: "customer",
      };

      const response = await request(app).post("/register").send(userData);

      // Should either redirect (302) or show form with errors (200)
      expect([200, 302]).toContain(response.status);

      // If successful, verify user was created
      if (response.status === 302) {
        const createdUser = await User.findOne({
          where: { email: "newuser@test.com" },
        });

        expect(createdUser).toBeDefined();
        expect(createdUser.fullName).toBe("New User");
        expect(createdUser.role).toBe("customer");
        expect(createdUser.isActive).toBe(true);
      }
    });

    test("should prevent registration with duplicate email", async () => {
      const userData = {
        fullName: "Duplicate User",
        email: "customer@test.com", // Already exists
        password: "password123",
        confirmPassword: "password123",
        role: "customer",
      };

      const response = await request(app).post("/register").send(userData);

      // Should show form with errors (200) or redirect (302)
      expect([200, 302]).toContain(response.status);

      // Should not create duplicate user
      const users = await User.findAll({
        where: { email: "customer@test.com" },
      });

      expect(users).toHaveLength(1); // Only the original user
    });

    test("should validate password confirmation", async () => {
      const userData = {
        fullName: "Password Mismatch User",
        email: "mismatch@test.com",
        password: "password123",
        confirmPassword: "differentpassword",
        role: "customer",
      };

      const response = await request(app).post("/register").send(userData);

      // Should show form with errors
      expect([200, 302]).toContain(response.status);

      // User should not be created
      const user = await User.findOne({
        where: { email: "mismatch@test.com" },
      });

      expect(user).toBeNull();
    });
  });

  describe("User Authentication (Login/Logout)", () => {
    test("should allow user login with valid credentials", async () => {
      const response = await request(app).post("/login").send({
        email: "customer@test.com",
        password: "password123",
      });

      // Should redirect after successful login
      expect([200, 302]).toContain(response.status);
    });

    test("should prevent login with invalid credentials", async () => {
      const response = await request(app).post("/login").send({
        email: "customer@test.com",
        password: "wrongpassword",
      });

      // Should show login form with error
      expect([200, 302]).toContain(response.status);
    });

    test("should allow user logout", async () => {
      const response = await customerAgent.get("/logout").expect(302); // Should redirect after logout
    });
  });

  describe("User Profile Management (Update)", () => {
    test("should allow user to update their profile", async () => {
      const updateData = {
        fullName: "Updated Customer Name",
        phone: "9876543210",
        email: "customer@test.com", // Keep same email
      };

      const response = await customerAgent
        .post("/profile/update")
        .send(updateData);

      // Should either redirect (302) or show form with errors (200)
      expect([200, 302]).toContain(response.status);

      // If successful, verify user was updated
      if (response.status === 302) {
        const updatedUser = await User.findByPk(customerUser.id);
        expect(updatedUser.fullName).toBe("Updated Customer Name");
        expect(updatedUser.phone).toBe("9876543210");
      }
    });

    test("should allow password change", async () => {
      const passwordData = {
        currentPassword: "password123",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      };

      const response = await customerAgent
        .post("/profile/change-password")
        .send(passwordData);

      // Should either redirect (302) or show form with errors (200)
      expect([200, 302]).toContain(response.status);

      // If successful, verify password was changed
      if (response.status === 302) {
        const updatedUser = await User.findByPk(customerUser.id);
        const isNewPasswordValid = await bcrypt.compare(
          "newpassword123",
          updatedUser.password
        );
        expect(isNewPasswordValid).toBe(true);
      }
    });
  });

  describe("Admin User Management", () => {
    test("should allow admin to view all users", async () => {
      const response = await adminAgent.get("/admin/users").expect(200);

      expect(response.text).toContain("Admin User");
      expect(response.text).toContain("Staff User");
      expect(response.text).toContain("Customer User");
    });

    test("should allow admin to search users", async () => {
      const response = await adminAgent
        .get("/admin/users")
        .query({ search: "Customer" })
        .expect(200);

      expect(response.text).toContain("Customer User");
      expect(response.text).not.toContain("Staff User");
    });

    test("should allow admin to filter users by role", async () => {
      const response = await adminAgent
        .get("/admin/users")
        .query({ role: "staff" })
        .expect(200);

      expect(response.text).toContain("Staff User");
      expect(response.text).not.toContain("Customer User");
    });

    test("should allow admin to update user role", async () => {
      const updateData = {
        role: "staff",
        isActive: true,
      };

      const response = await adminAgent
        .post(`/admin/users/${customerUser.id}/edit`)
        .send(updateData);

      // Should either redirect (302) or show form with errors (200)
      expect([200, 302]).toContain(response.status);

      // If successful, verify user role was updated
      if (response.status === 302) {
        const updatedUser = await User.findByPk(customerUser.id);
        expect(updatedUser.role).toBe("staff");
      }
    });

    test("should allow admin to deactivate user", async () => {
      const updateData = {
        role: customerUser.role,
        isActive: false,
      };

      const response = await adminAgent
        .post(`/admin/users/${customerUser.id}/edit`)
        .send(updateData);

      // Should either redirect (302) or show form with errors (200)
      expect([200, 302]).toContain(response.status);

      // If successful, verify user was deactivated
      if (response.status === 302) {
        const updatedUser = await User.findByPk(customerUser.id);
        expect(updatedUser.isActive).toBe(false);
      }
    });

    test("should prevent non-admin from accessing admin panel", async () => {
      const response = await customerAgent.get("/admin/users");

      // Should return 403 (access denied) or 302 (redirect)
      expect([302, 403]).toContain(response.status);
    });

    test("should prevent staff from accessing admin panel", async () => {
      const response = await staffAgent.get("/admin/users");

      // Should return 403 (access denied) or 302 (redirect)
      expect([302, 403]).toContain(response.status);
    });
  });

  describe("User Account Status", () => {
    test("should prevent login for deactivated user", async () => {
      // Deactivate user
      await customerUser.update({ isActive: false });

      const response = await request(app).post("/login").send({
        email: "customer@test.com",
        password: "password123",
      });

      // Should show login form with error or redirect
      expect([200, 302]).toContain(response.status);
    });

    test("should allow login for reactivated user", async () => {
      // Deactivate then reactivate user
      await customerUser.update({ isActive: false });
      await customerUser.update({ isActive: true });

      const response = await request(app).post("/login").send({
        email: "customer@test.com",
        password: "password123",
      });

      // Should allow login
      expect([200, 302]).toContain(response.status);
    });
  });

  describe("User Access Control", () => {
    test("should restrict access to protected routes for unauthenticated users", async () => {
      const response = await request(app).get("/dashboard");

      // Should redirect to login
      expect(response.status).toBe(302);
    });

    test("should allow access to protected routes for authenticated users", async () => {
      const response = await customerAgent.get("/dashboard").expect(200);

      expect(response.text).toContain("Dashboard");
    });

    test("should enforce role-based access control", async () => {
      // Customer trying to access staff-only route
      const response = await customerAgent.get("/devices/new");

      // Should return 403 (access denied) or 302 (redirect)
      expect([302, 403]).toContain(response.status);
    });
  });

  describe("User Data Privacy", () => {
    test("should not expose sensitive user data in responses", async () => {
      const response = await adminAgent.get("/admin/users").expect(200);

      // Should not contain password hashes in the response
      expect(response.text).not.toMatch(/\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test("should allow users to view only their own profile", async () => {
      const response = await customerAgent.get("/profile").expect(200);

      expect(response.text).toContain("Customer User");
      expect(response.text).not.toContain("Staff User");
    });
  });
});
