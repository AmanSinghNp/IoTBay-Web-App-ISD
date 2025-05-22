// End-to-end tests for device management features
const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const Device = require("../../models/device");
const User = require("../../models/user");
const sequelize = require("../../config/database");

describe("Device Management", () => {
  let staffToken;
  let customerToken;
  let staffUser;
  let customerUser;

  // Set up test database and create test users
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create staff test account
    const hashedPassword = await bcrypt.hash("password123", 10);
    staffUser = await User.create({
      fullName: "Staff User",
      email: "staff@example.com",
      password: hashedPassword,
      role: "staff",
    });

    // Create customer test account
    customerUser = await User.create({
      fullName: "Customer User",
      email: "customer@example.com",
      password: hashedPassword,
      role: "customer",
    });

    // Create auth tokens for testing
    staffToken = jwt.sign(
      { userId: staffUser.id, role: staffUser.role },
      process.env.JWT_SECRET || "your-secret-key"
    );

    customerToken = jwt.sign(
      { userId: customerUser.id, role: customerUser.role },
      process.env.JWT_SECRET || "your-secret-key"
    );
  });

  // Clear devices before each test
  beforeEach(async () => {
    await Device.destroy({ where: {} });
  });

  // Test device creation functionality
  describe("Device Creation", () => {
    // Staff should be able to add new devices
    it("should allow staff to create a device", async () => {
      const deviceData = {
        name: "iPhone 14 Pro",
        brand: "Apple",
        catalog: "Electronics",
        price: 1199.0,
        stock: 50,
        description: "Latest iPhone model",
        imageUrl: "/images/iphone14pro.jpg",
      };

      const response = await request(app)
        .post("/api/devices")
        .set("Authorization", `Bearer ${staffToken}`)
        .send(deviceData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "Device created successfully"
      );
      expect(response.body.device).toHaveProperty("name", deviceData.name);
      expect(response.body.device).toHaveProperty("price", deviceData.price);

      // Make sure device was saved to database
      const device = await Device.findOne({ where: { name: deviceData.name } });
      expect(device).toBeTruthy();
      expect(device.brand).toBe(deviceData.brand);
    });

    // Customers should not be able to add devices
    it("should not allow customers to create devices", async () => {
      const deviceData = {
        name: "Test Device",
        brand: "Test Brand",
        price: 99.99,
        stock: 10,
      };

      const response = await request(app)
        .post("/api/devices")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(deviceData)
        .expect(403);

      expect(response.body).toHaveProperty("error", "Access denied");
    });
  });

  // Test device listing functionality
  describe("Device Listing", () => {
    // Add test devices before each listing test
    beforeEach(async () => {
      await Device.bulkCreate([
        {
          name: "Device 1",
          brand: "Brand 1",
          price: 99.99,
          stock: 10,
        },
        {
          name: "Device 2",
          brand: "Brand 2",
          price: 149.99,
          stock: 5,
        },
      ]);
    });

    // Customers should see all devices
    it("should list all devices for customers", async () => {
      const response = await request(app)
        .get("/api/devices")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.devices).toHaveLength(2);
      expect(response.body.devices[0]).toHaveProperty("name");
      expect(response.body.devices[0]).toHaveProperty("price");
    });

    // Test catalog filtering
    it("should allow filtering devices by catalog", async () => {
      const response = await request(app)
        .get("/api/devices?catalog=Electronics")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(200);

      expect(Array.isArray(response.body.devices)).toBeTruthy();
    });
  });

  // Test device update functionality
  describe("Device Updates", () => {
    let testDevice;

    // Create test device before each update test
    beforeEach(async () => {
      testDevice = await Device.create({
        name: "Test Device",
        brand: "Test Brand",
        price: 99.99,
        stock: 10,
      });
    });

    // Staff should be able to update stock
    it("should allow staff to update device stock", async () => {
      const updateData = {
        stock: 20,
      };

      const response = await request(app)
        .patch(`/api/devices/${testDevice.id}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.device).toHaveProperty("stock", updateData.stock);

      // Verify database was updated
      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.stock).toBe(updateData.stock);
    });

    // Customers should not be able to update devices
    it("should not allow customers to update devices", async () => {
      const updateData = {
        stock: 20,
      };

      const response = await request(app)
        .patch(`/api/devices/${testDevice.id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty("error", "Access denied");
    });
  });
});
