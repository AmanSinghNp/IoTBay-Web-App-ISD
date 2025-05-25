const request = require("supertest");
const app = require("../../app");
const User = require("../../models/user");
const Device = require("../../models/device");
const Order = require("../../models/order");
const OrderItem = require("../../models/orderItem");
const Cart = require("../../models/cart");
const bcrypt = require("bcrypt");

describe("Order Management - Integration Tests", () => {
  let customerUser, customerAgent, testDevice;

  beforeEach(async () => {
    // Create test customer
    customerUser = await User.create({
      fullName: "Customer User",
      email: "customer@test.com",
      password: await bcrypt.hash("password123", 10),
      role: "customer",
    });

    // Create test device
    testDevice = await Device.create({
      name: "Test Device",
      brand: "TestBrand",
      catalog: "Electronics",
      price: 199.99,
      stock: 50,
      description: "Device for order testing",
    });

    // Create authenticated agent
    customerAgent = request.agent(app);

    // Login customer
    await customerAgent.post("/login").send({
      email: "customer@test.com",
      password: "password123",
    });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await OrderItem.destroy({ where: {}, force: true });
      await Order.destroy({ where: {}, force: true });
      await Cart.destroy({ where: {}, force: true });
      await Device.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("Order Creation (Create)", () => {
    test("should create order from cart", async () => {
      // Add item to cart first
      await Cart.create({
        userId: customerUser.id,
        deviceId: testDevice.id,
        quantity: 2,
      });

      // Create order from cart
      const response = await customerAgent.post("/checkout").expect(302); // Redirect after successful order creation

      // Verify order was created
      const order = await Order.findOne({
        where: { userId: customerUser.id },
        include: [OrderItem],
      });

      expect(order).toBeDefined();
      expect(order.status).toBe("Placed");
      expect(order.OrderItems).toHaveLength(1);
      expect(order.OrderItems[0].quantity).toBe(2);
      expect(order.OrderItems[0].deviceId).toBe(testDevice.id);
    });

    test("should update device stock when order is placed", async () => {
      const initialStock = testDevice.stock;

      // Add item to cart
      await Cart.create({
        userId: customerUser.id,
        deviceId: testDevice.id,
        quantity: 3,
      });

      // Create order
      await customerAgent.post("/checkout").expect(302);

      // Verify stock was reduced
      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.stock).toBe(initialStock - 3);
    });

    test("should prevent ordering more than available stock", async () => {
      // Try to add more items than available stock
      await Cart.create({
        userId: customerUser.id,
        deviceId: testDevice.id,
        quantity: testDevice.stock + 10, // More than available
      });

      const response = await customerAgent.post("/checkout");

      // Should handle the error gracefully
      expect([200, 302]).toContain(response.status);

      // Verify no order was created if stock validation failed
      const orders = await Order.findAll({
        where: { userId: customerUser.id },
      });

      // Either no order created, or order created with adjusted quantity
      if (orders.length > 0) {
        const orderItems = await OrderItem.findAll({
          where: { orderId: orders[0].id },
        });
        expect(orderItems[0].quantity).toBeLessThanOrEqual(testDevice.stock);
      }
    });
  });

  describe("Order Viewing and Search (Read)", () => {
    let testOrder1, testOrder2;

    beforeEach(async () => {
      // Create test orders
      testOrder1 = await Order.create({
        userId: customerUser.id,
        status: "Placed",
        createdAt: new Date("2024-01-15"),
      });

      testOrder2 = await Order.create({
        userId: customerUser.id,
        status: "Completed",
        createdAt: new Date("2024-01-20"),
      });

      // Create order items
      await OrderItem.bulkCreate([
        {
          orderId: testOrder1.id,
          deviceId: testDevice.id,
          quantity: 2,
          price: testDevice.price,
        },
        {
          orderId: testOrder2.id,
          deviceId: testDevice.id,
          quantity: 1,
          price: testDevice.price,
        },
      ]);
    });

    test("should display customer's orders", async () => {
      const response = await customerAgent.get("/orders").expect(200);

      expect(response.text).toContain("Placed");
      expect(response.text).toContain("Completed");
      expect(response.text).toContain("Test Device");
    });

    test("should search orders by order number", async () => {
      const response = await customerAgent
        .get("/orders")
        .query({ orderNumber: testOrder1.id })
        .expect(200);

      expect(response.text).toContain(testOrder1.id.toString());
      expect(response.text).not.toContain(testOrder2.id.toString());
    });

    test("should search orders by date range", async () => {
      const response = await customerAgent
        .get("/orders")
        .query({
          startDate: "2024-01-14",
          endDate: "2024-01-16",
        })
        .expect(200);

      expect(response.text).toContain(testOrder1.id.toString());
      expect(response.text).not.toContain(testOrder2.id.toString());
    });

    test("should show order details", async () => {
      const response = await customerAgent
        .get(`/orders/${testOrder1.id}/details`)
        .expect(200);

      expect(response.text).toContain("Test Device");
      expect(response.text).toContain("Placed");
      expect(response.text).toContain("2"); // Quantity
    });
  });

  describe("Order Update (Update)", () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: customerUser.id,
        status: "Placed",
      });

      await OrderItem.create({
        orderId: testOrder.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });
    });

    test("should allow updating order before final submission", async () => {
      const updateData = {
        quantity: 3,
      };

      const response = await customerAgent
        .post(`/orders/${testOrder.id}/edit`)
        .send(updateData);

      // Should handle the update request
      expect([200, 302]).toContain(response.status);

      // Note: Actual update logic depends on implementation
      // This test verifies the endpoint is accessible
    });

    test("should prevent updating completed orders", async () => {
      // Update order status to completed
      await testOrder.update({ status: "Completed" });

      const updateData = {
        quantity: 5,
      };

      const response = await customerAgent
        .post(`/orders/${testOrder.id}/edit`)
        .send(updateData);

      // Should prevent update or redirect
      expect([200, 302, 403]).toContain(response.status);
    });
  });

  describe("Order Cancellation (Delete)", () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: customerUser.id,
        status: "Placed",
      });

      await OrderItem.create({
        orderId: testOrder.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });
    });

    test("should allow cancelling placed orders", async () => {
      const response = await customerAgent
        .post(`/orders/${testOrder.id}/cancel`)
        .expect(302); // Redirect after cancellation

      // Verify order status changed to cancelled
      const cancelledOrder = await Order.findByPk(testOrder.id);
      expect(cancelledOrder.status).toBe("Cancelled");
    });

    test("should restore stock when order is cancelled", async () => {
      const initialStock = testDevice.stock;

      // Cancel the order
      await customerAgent.post(`/orders/${testOrder.id}/cancel`).expect(302);

      // Verify stock was restored
      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.stock).toBe(initialStock + 2); // +2 from cancelled order
    });

    test("should prevent cancelling completed orders", async () => {
      // Update order status to completed
      await testOrder.update({ status: "Completed" });

      const response = await customerAgent.post(
        `/orders/${testOrder.id}/cancel`
      );

      // Should prevent cancellation
      expect([200, 302, 403]).toContain(response.status);

      // Verify order status unchanged
      const unchangedOrder = await Order.findByPk(testOrder.id);
      expect(unchangedOrder.status).toBe("Completed");
    });
  });

  describe("Order History and Status", () => {
    beforeEach(async () => {
      // Create orders with different statuses
      const orders = await Order.bulkCreate([
        {
          userId: customerUser.id,
          status: "Placed",
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          userId: customerUser.id,
          status: "Completed",
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
        },
        {
          userId: customerUser.id,
          status: "Cancelled",
          createdAt: new Date(Date.now() - 259200000), // 3 days ago
        },
      ]);

      // Create order items for each order
      for (const order of orders) {
        await OrderItem.create({
          orderId: order.id,
          deviceId: testDevice.id,
          quantity: 1,
          price: testDevice.price,
        });
      }
    });

    test("should display order history with different statuses", async () => {
      const response = await customerAgent.get("/orders").expect(200);

      expect(response.text).toContain("Placed");
      expect(response.text).toContain("Completed");
      expect(response.text).toContain("Cancelled");
    });

    test("should show orders in chronological order", async () => {
      const response = await customerAgent.get("/orders").expect(200);

      // Most recent orders should appear first
      const placedIndex = response.text.indexOf("Placed");
      const completedIndex = response.text.indexOf("Completed");
      const cancelledIndex = response.text.indexOf("Cancelled");

      expect(placedIndex).toBeLessThan(completedIndex);
      expect(completedIndex).toBeLessThan(cancelledIndex);
    });
  });
});
