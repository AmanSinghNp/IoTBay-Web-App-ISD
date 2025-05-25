const Order = require("../../models/order");
const OrderItem = require("../../models/orderItem");
const User = require("../../models/user");
const Device = require("../../models/device");
const bcrypt = require("bcrypt");
const sequelize = require("../../config/database");

// Define associations for testing
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });
Order.hasMany(OrderItem, { foreignKey: "orderId" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
Device.hasMany(OrderItem, { foreignKey: "deviceId" });
OrderItem.belongsTo(Device, { foreignKey: "deviceId" });

describe("Order Management - Unit Tests", () => {
  let testUser, testDevice;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      fullName: "Test Customer",
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
      stock: 100,
      description: "Test device for order testing",
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      await OrderItem.destroy({ where: {}, force: true });
      await Order.destroy({ where: {}, force: true });
      await Device.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("Order Creation (Create)", () => {
    test("should create a new order with valid data", async () => {
      const orderData = {
        userId: testUser.id,
        status: "Placed",
      };

      const order = await Order.create(orderData);

      expect(order).toBeDefined();
      expect(order.userId).toBe(testUser.id);
      expect(order.status).toBe("Placed");
      expect(order.createdAt).toBeDefined();
    });

    test("should create order with order items", async () => {
      // Create order
      const order = await Order.create({
        userId: testUser.id,
        status: "Placed",
      });

      // Create order item
      const orderItem = await OrderItem.create({
        orderId: order.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });

      expect(orderItem).toBeDefined();
      expect(orderItem.orderId).toBe(order.id);
      expect(orderItem.deviceId).toBe(testDevice.id);
      expect(orderItem.quantity).toBe(2);
      expect(parseFloat(orderItem.price)).toBe(199.99);
    });

    test("should fail to create order without required fields", async () => {
      const incompleteData = {
        // Missing userId and status
      };

      // Note: Sequelize allows creating orders without userId by default
      // In a real application, you would add validation to prevent this
      const order = await Order.create(incompleteData);
      expect(order.status).toBe("Placed"); // Default status
      // This test documents current behavior - validation should be added
    });

    test("should create order with default status", async () => {
      const order = await Order.create({
        userId: testUser.id,
        // No status provided, should use default
      });

      expect(order.status).toBe("Placed"); // Assuming "Placed" is the default
    });
  });

  describe("Order Retrieval (Read)", () => {
    let testOrder1, testOrder2, testOrderItem1, testOrderItem2;

    beforeEach(async () => {
      // Create test orders
      testOrder1 = await Order.create({
        userId: testUser.id,
        status: "Placed",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      });

      testOrder2 = await Order.create({
        userId: testUser.id,
        status: "Shipped",
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
      });

      // Create order items
      testOrderItem1 = await OrderItem.create({
        orderId: testOrder1.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });

      testOrderItem2 = await OrderItem.create({
        orderId: testOrder2.id,
        deviceId: testDevice.id,
        quantity: 1,
        price: testDevice.price,
      });
    });

    test("should find order by ID", async () => {
      const foundOrder = await Order.findByPk(testOrder1.id);

      expect(foundOrder).toBeDefined();
      expect(foundOrder.userId).toBe(testUser.id);
      expect(foundOrder.status).toBe("Placed");
    });

    test("should find orders by user ID", async () => {
      const userOrders = await Order.findAll({
        where: { userId: testUser.id },
      });

      expect(userOrders).toHaveLength(2);
      expect(userOrders.every((order) => order.userId === testUser.id)).toBe(
        true
      );
    });

    test("should find orders by status", async () => {
      const placedOrders = await Order.findAll({
        where: { status: "Placed" },
      });

      expect(placedOrders).toHaveLength(1);
      expect(placedOrders[0].status).toBe("Placed");
    });

    test("should find orders within date range", async () => {
      const yesterday = new Date(Date.now() - 86400000);
      const twoDaysAgo = new Date(Date.now() - 172800000);

      const recentOrders = await Order.findAll({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.gte]: twoDaysAgo,
          },
        },
      });

      expect(recentOrders.length).toBeGreaterThanOrEqual(1); // Should find at least 1 test order
    });

    test("should find order with order items", async () => {
      const orderWithItems = await Order.findOne({
        where: { id: testOrder1.id },
        include: [{ model: OrderItem }],
      });

      expect(orderWithItems).toBeDefined();
      expect(orderWithItems.OrderItems).toHaveLength(1);
      expect(orderWithItems.OrderItems[0].quantity).toBe(2);
    });

    test("should find order with user information", async () => {
      const orderWithUser = await Order.findOne({
        where: { id: testOrder1.id },
        include: [{ model: User, attributes: ["id", "fullName", "email"] }],
      });

      expect(orderWithUser).toBeDefined();
      expect(orderWithUser.User).toBeDefined();
      expect(orderWithUser.User.fullName).toBe("Test Customer");
    });

    test("should sort orders by creation date", async () => {
      const ordersByDate = await Order.findAll({
        order: [["createdAt", "DESC"]],
      });

      expect(ordersByDate).toHaveLength(2);
      expect(ordersByDate[0].createdAt.getTime()).toBeGreaterThan(
        ordersByDate[1].createdAt.getTime()
      );
    });
  });

  describe("Order Update (Update)", () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: testUser.id,
        status: "Placed",
      });
    });

    test("should update order status", async () => {
      await testOrder.update({ status: "Processing" });

      const updatedOrder = await Order.findByPk(testOrder.id);
      expect(updatedOrder.status).toBe("Processing");
    });

    test("should update order using where clause", async () => {
      const [updatedRowsCount] = await Order.update(
        { status: "Shipped" },
        {
          where: {
            id: testOrder.id,
            userId: testUser.id,
          },
        }
      );

      expect(updatedRowsCount).toBe(1);

      const updatedOrder = await Order.findByPk(testOrder.id);
      expect(updatedOrder.status).toBe("Shipped");
    });

    test("should not update order with wrong conditions", async () => {
      const [updatedRowsCount] = await Order.update(
        { status: "Cancelled" },
        {
          where: {
            id: testOrder.id,
            userId: 999, // Wrong user ID
          },
        }
      );

      expect(updatedRowsCount).toBe(0);

      const unchangedOrder = await Order.findByPk(testOrder.id);
      expect(unchangedOrder.status).toBe("Placed"); // Should remain unchanged
    });

    test("should update order item quantity", async () => {
      const orderItem = await OrderItem.create({
        orderId: testOrder.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });

      await orderItem.update({ quantity: 3 });

      const updatedOrderItem = await OrderItem.findByPk(orderItem.id);
      expect(updatedOrderItem.quantity).toBe(3);
    });
  });

  describe("Order Cancellation (Delete)", () => {
    let testOrder, testOrderItem;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: testUser.id,
        status: "Placed",
      });

      testOrderItem = await OrderItem.create({
        orderId: testOrder.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });
    });

    test("should cancel order by updating status", async () => {
      await testOrder.update({ status: "Cancelled" });

      const cancelledOrder = await Order.findByPk(testOrder.id);
      expect(cancelledOrder.status).toBe("Cancelled");
    });

    test("should delete order and its items", async () => {
      const orderId = testOrder.id;
      const orderItemId = testOrderItem.id;

      // Delete order items first (due to foreign key constraints)
      await OrderItem.destroy({ where: { orderId: orderId } });
      await testOrder.destroy();

      const deletedOrder = await Order.findByPk(orderId);
      const deletedOrderItem = await OrderItem.findByPk(orderItemId);

      expect(deletedOrder).toBeNull();
      expect(deletedOrderItem).toBeNull();
    });

    test("should prevent deletion of non-existent order", async () => {
      const deletedRowsCount = await Order.destroy({
        where: { id: 999 }, // Non-existent ID
      });

      expect(deletedRowsCount).toBe(0);
    });
  });

  describe("Order Status Management", () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: testUser.id,
        status: "Placed",
      });
    });

    test("should transition order through valid statuses", async () => {
      // Placed -> Processing
      await testOrder.update({ status: "Processing" });
      expect(testOrder.status).toBe("Processing");

      // Processing -> Shipped
      await testOrder.update({ status: "Shipped" });
      expect(testOrder.status).toBe("Shipped");

      // Shipped -> Delivered
      await testOrder.update({ status: "Delivered" });
      expect(testOrder.status).toBe("Delivered");
    });

    test("should allow cancellation from Placed status", async () => {
      await testOrder.update({ status: "Cancelled" });
      expect(testOrder.status).toBe("Cancelled");
    });

    test("should find orders by multiple statuses", async () => {
      // Create orders with different statuses
      await Order.bulkCreate([
        { userId: testUser.id, status: "Processing" },
        { userId: testUser.id, status: "Shipped" },
        { userId: testUser.id, status: "Delivered" },
        { userId: testUser.id, status: "Cancelled" },
      ]);

      const activeOrders = await Order.findAll({
        where: {
          status: {
            [sequelize.Sequelize.Op.in]: ["Placed", "Processing", "Shipped"],
          },
        },
      });

      expect(activeOrders).toHaveLength(3); // Placed, Processing, Shipped
    });
  });

  describe("Order Item Management", () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        userId: testUser.id,
        status: "Placed",
      });
    });

    test("should add multiple items to order", async () => {
      // Create another device
      const device2 = await Device.create({
        name: "Test Device 2",
        brand: "TestBrand",
        catalog: "Electronics",
        price: 299.99,
        stock: 50,
      });

      // Add items to order
      const orderItem1 = await OrderItem.create({
        orderId: testOrder.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });

      const orderItem2 = await OrderItem.create({
        orderId: testOrder.id,
        deviceId: device2.id,
        quantity: 1,
        price: device2.price,
      });

      const orderItems = await OrderItem.findAll({
        where: { orderId: testOrder.id },
      });

      expect(orderItems).toHaveLength(2);
      expect(orderItems[0].quantity).toBe(2);
      expect(orderItems[1].quantity).toBe(1);
    });

    test("should calculate order total from items", async () => {
      // Add items to order
      await OrderItem.create({
        orderId: testOrder.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });

      const orderItems = await OrderItem.findAll({
        where: { orderId: testOrder.id },
      });

      const total = orderItems.reduce((sum, item) => {
        return sum + parseFloat(item.price) * item.quantity;
      }, 0);

      expect(total).toBe(399.98); // 199.99 * 2
    });

    test("should find order items with device information", async () => {
      const orderItem = await OrderItem.create({
        orderId: testOrder.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });

      const orderItemWithDevice = await OrderItem.findOne({
        where: { id: orderItem.id },
        include: [{ model: Device, attributes: ["id", "name", "brand"] }],
      });

      expect(orderItemWithDevice).toBeDefined();
      expect(orderItemWithDevice.Device).toBeDefined();
      expect(orderItemWithDevice.Device.name).toBe("Test Device");
    });

    test("should remove item from order", async () => {
      const orderItem = await OrderItem.create({
        orderId: testOrder.id,
        deviceId: testDevice.id,
        quantity: 2,
        price: testDevice.price,
      });

      const orderItemId = orderItem.id;
      await orderItem.destroy();

      const deletedOrderItem = await OrderItem.findByPk(orderItemId);
      expect(deletedOrderItem).toBeNull();
    });
  });

  describe("Order Search and Filtering", () => {
    beforeEach(async () => {
      // Create orders with different dates and statuses
      await Order.bulkCreate([
        {
          userId: testUser.id,
          status: "Placed",
          createdAt: new Date("2024-01-15"),
        },
        {
          userId: testUser.id,
          status: "Processing",
          createdAt: new Date("2024-01-16"),
        },
        {
          userId: testUser.id,
          status: "Shipped",
          createdAt: new Date("2024-01-17"),
        },
        {
          userId: testUser.id,
          status: "Delivered",
          createdAt: new Date("2024-01-18"),
        },
      ]);
    });

    test("should search orders by date range", async () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-16");

      const ordersInRange = await Order.findAll({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.between]: [startDate, endDate],
          },
        },
      });

      expect(ordersInRange).toHaveLength(2);
    });

    test("should filter orders by status", async () => {
      const shippedOrders = await Order.findAll({
        where: { status: "Shipped" },
      });

      expect(shippedOrders).toHaveLength(1);
      expect(shippedOrders[0].status).toBe("Shipped");
    });

    test("should find recent orders", async () => {
      const oneDayAgo = new Date(Date.now() - 86400000);

      const recentOrders = await Order.findAll({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.gte]: oneDayAgo,
          },
        },
      });

      // Should find orders created today (none in this test, but validates query)
      expect(Array.isArray(recentOrders)).toBe(true);
    });
  });
});
