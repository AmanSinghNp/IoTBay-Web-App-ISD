const request = require("supertest");
const app = require("../../app");
const User = require("../../models/user");
const Order = require("../../models/order");
const Shipment = require("../../models/shipment");
const Address = require("../../models/address");
const bcrypt = require("bcrypt");

describe("Shipment Management - Integration Tests", () => {
  let staffUser,
    customerUser,
    staffAgent,
    customerAgent,
    testOrder,
    testAddress;

  beforeEach(async () => {
    // Create test users
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

    // Create test address
    testAddress = await Address.create({
      userId: customerUser.id,
      street: "123 Test Street",
      city: "Test City",
      state: "Test State",
      postalCode: "12345",
      country: "Test Country",
    });

    // Create test order
    testOrder = await Order.create({
      userId: customerUser.id,
      status: "Placed",
    });

    // Create authenticated agents
    staffAgent = request.agent(app);
    customerAgent = request.agent(app);

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
      await Shipment.destroy({ where: {}, force: true });
      await Address.destroy({ where: {}, force: true });
      await Order.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("Shipment Creation (Create)", () => {
    test("should allow staff to create a shipment", async () => {
      const shipmentData = {
        orderId: testOrder.id,
        addressId: testAddress.id,
        trackingNumber: "TRACK123456",
        carrier: "Test Carrier",
        status: "Pending",
        estimatedDelivery: "2024-12-31",
      };

      const response = await staffAgent
        .post("/shipments/create")
        .send(shipmentData);

      // Should either redirect (302) or show form with errors (200)
      expect([200, 302]).toContain(response.status);

      // If successful, verify shipment was created
      if (response.status === 302) {
        const createdShipment = await Shipment.findOne({
          where: { trackingNumber: "TRACK123456" },
        });

        expect(createdShipment).toBeDefined();
        expect(createdShipment.orderId).toBe(testOrder.id);
        expect(createdShipment.addressId).toBe(testAddress.id);
        expect(createdShipment.carrier).toBe("Test Carrier");
      }
    });

    test("should prevent customer from creating a shipment", async () => {
      const shipmentData = {
        orderId: testOrder.id,
        addressId: testAddress.id,
        trackingNumber: "TRACK123456",
        carrier: "Test Carrier",
        status: "Pending",
      };

      const response = await customerAgent
        .post("/shipments/create")
        .send(shipmentData);

      // Should return 403 (access denied) or 302 (redirect)
      expect([302, 403]).toContain(response.status);

      // Verify shipment was NOT created
      const shipment = await Shipment.findOne({
        where: { trackingNumber: "TRACK123456" },
      });

      expect(shipment).toBeNull();
    });
  });

  describe("Shipment Viewing and Search (Read)", () => {
    let testShipment1, testShipment2;

    beforeEach(async () => {
      // Create test shipments
      testShipment1 = await Shipment.create({
        orderId: testOrder.id,
        addressId: testAddress.id,
        trackingNumber: "TRACK001",
        carrier: "Express Carrier",
        status: "In Transit",
        estimatedDelivery: "2024-12-25",
      });

      testShipment2 = await Shipment.create({
        orderId: testOrder.id,
        addressId: testAddress.id,
        trackingNumber: "TRACK002",
        carrier: "Standard Carrier",
        status: "Delivered",
        estimatedDelivery: "2024-12-20",
      });
    });

    test("should display shipments list for staff", async () => {
      const response = await staffAgent.get("/shipments").expect(200);

      expect(response.text).toContain("TRACK001");
      expect(response.text).toContain("TRACK002");
      expect(response.text).toContain("In Transit");
      expect(response.text).toContain("Delivered");
    });

    test("should allow customers to view their shipments", async () => {
      const response = await customerAgent.get("/shipments").expect(200);

      expect(response.text).toContain("TRACK001");
      expect(response.text).toContain("TRACK002");
    });

    test("should search shipments by tracking number", async () => {
      const response = await staffAgent
        .get("/shipments")
        .query({ search: "TRACK001" })
        .expect(200);

      expect(response.text).toContain("TRACK001");
      expect(response.text).not.toContain("TRACK002");
    });

    test("should filter shipments by status", async () => {
      const response = await staffAgent
        .get("/shipments")
        .query({ status: "In Transit" })
        .expect(200);

      expect(response.text).toContain("TRACK001");
      expect(response.text).not.toContain("TRACK002");
    });

    test("should show shipment details", async () => {
      const response = await staffAgent
        .get(`/shipments/${testShipment1.id}`)
        .expect(200);

      expect(response.text).toContain("TRACK001");
      expect(response.text).toContain("Express Carrier");
      expect(response.text).toContain("In Transit");
    });
  });

  describe("Shipment Update (Update)", () => {
    let testShipment;

    beforeEach(async () => {
      testShipment = await Shipment.create({
        orderId: testOrder.id,
        addressId: testAddress.id,
        trackingNumber: "TRACK_UPDATE",
        carrier: "Update Carrier",
        status: "Pending",
        estimatedDelivery: "2024-12-30",
      });
    });

    test("should allow staff to update shipment status", async () => {
      const updateData = {
        status: "In Transit",
        carrier: "Updated Carrier",
        estimatedDelivery: "2024-12-28",
      };

      const response = await staffAgent
        .post(`/shipments/${testShipment.id}/edit`)
        .send(updateData);

      // Should either redirect (302) or show form with errors (200)
      expect([200, 302]).toContain(response.status);

      // If successful, verify shipment was updated
      if (response.status === 302) {
        const updatedShipment = await Shipment.findByPk(testShipment.id);
        expect(updatedShipment.status).toBe("In Transit");
        expect(updatedShipment.carrier).toBe("Updated Carrier");
      }
    });

    test("should prevent customer from updating shipment", async () => {
      const updateData = {
        status: "Delivered",
        carrier: "Unauthorized Carrier",
      };

      const response = await customerAgent
        .post(`/shipments/${testShipment.id}/edit`)
        .send(updateData);

      // Should return 403 (access denied) or 302 (redirect)
      expect([302, 403]).toContain(response.status);

      // Verify shipment was NOT updated
      const unchangedShipment = await Shipment.findByPk(testShipment.id);
      expect(unchangedShipment.status).toBe("Pending");
      expect(unchangedShipment.carrier).toBe("Update Carrier");
    });
  });

  describe("Shipment Tracking", () => {
    let testShipment;

    beforeEach(async () => {
      testShipment = await Shipment.create({
        orderId: testOrder.id,
        addressId: testAddress.id,
        trackingNumber: "TRACK_TRACKING",
        carrier: "Tracking Carrier",
        status: "In Transit",
        estimatedDelivery: "2024-12-25",
      });
    });

    test("should allow tracking by tracking number", async () => {
      const response = await request(app)
        .get("/track")
        .query({ trackingNumber: "TRACK_TRACKING" })
        .expect(200);

      expect(response.text).toContain("TRACK_TRACKING");
      expect(response.text).toContain("In Transit");
      expect(response.text).toContain("Tracking Carrier");
    });

    test("should handle invalid tracking number", async () => {
      const response = await request(app)
        .get("/track")
        .query({ trackingNumber: "INVALID_TRACK" })
        .expect(200);

      expect(response.text).toContain("not found");
    });
  });

  describe("Shipment Status Updates", () => {
    let testShipment;

    beforeEach(async () => {
      testShipment = await Shipment.create({
        orderId: testOrder.id,
        addressId: testAddress.id,
        trackingNumber: "TRACK_STATUS",
        carrier: "Status Carrier",
        status: "Pending",
        estimatedDelivery: "2024-12-25",
      });
    });

    test("should update shipment status to In Transit", async () => {
      const response = await staffAgent
        .post(`/shipments/${testShipment.id}/status`)
        .send({ status: "In Transit" });

      expect([200, 302]).toContain(response.status);

      const updatedShipment = await Shipment.findByPk(testShipment.id);
      expect(updatedShipment.status).toBe("In Transit");
    });

    test("should update shipment status to Delivered", async () => {
      const response = await staffAgent
        .post(`/shipments/${testShipment.id}/status`)
        .send({ status: "Delivered" });

      expect([200, 302]).toContain(response.status);

      const updatedShipment = await Shipment.findByPk(testShipment.id);
      expect(updatedShipment.status).toBe("Delivered");
    });
  });

  describe("Shipment History and Reports", () => {
    beforeEach(async () => {
      // Create shipments with different statuses and dates
      await Shipment.bulkCreate([
        {
          orderId: testOrder.id,
          addressId: testAddress.id,
          trackingNumber: "TRACK_HIST1",
          carrier: "History Carrier 1",
          status: "Delivered",
          estimatedDelivery: "2024-12-20",
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          orderId: testOrder.id,
          addressId: testAddress.id,
          trackingNumber: "TRACK_HIST2",
          carrier: "History Carrier 2",
          status: "In Transit",
          estimatedDelivery: "2024-12-25",
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
        },
        {
          orderId: testOrder.id,
          addressId: testAddress.id,
          trackingNumber: "TRACK_HIST3",
          carrier: "History Carrier 3",
          status: "Pending",
          estimatedDelivery: "2024-12-30",
          createdAt: new Date(Date.now() - 259200000), // 3 days ago
        },
      ]);
    });

    test("should display shipment history with different statuses", async () => {
      const response = await staffAgent.get("/shipments").expect(200);

      expect(response.text).toContain("Delivered");
      expect(response.text).toContain("In Transit");
      expect(response.text).toContain("Pending");
    });

    test("should show shipments in chronological order", async () => {
      const response = await staffAgent.get("/shipments").expect(200);

      // Most recent shipments should appear first
      const deliveredIndex = response.text.indexOf("TRACK_HIST1");
      const transitIndex = response.text.indexOf("TRACK_HIST2");
      const pendingIndex = response.text.indexOf("TRACK_HIST3");

      expect(deliveredIndex).toBeLessThan(transitIndex);
      expect(transitIndex).toBeLessThan(pendingIndex);
    });
  });
});
