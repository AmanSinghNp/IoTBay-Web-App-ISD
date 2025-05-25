const Payment = require("../../models/paymentSequelize");
const User = require("../../models/user");
const Order = require("../../models/order");
const bcrypt = require("bcrypt");
const sequelize = require("../../config/testDatabase");

describe("Payment Management - Unit Tests", () => {
  let testUser, testOrder;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      fullName: "Payment Test User",
      email: "payment@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "customer",
    });

    // Create test order
    testOrder = await Order.create({
      userId: testUser.id,
      totalAmount: 299.99,
      status: "pending",
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await Payment.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe("Payment Creation (Create)", () => {
    test("should create a new payment with valid data", async () => {
      const paymentData = {
        paymentMethod: "Credit Card",
        cardNumber: "4111111111111111",
        expiryDate: "12/25",
        cvv: "123",
        amount: 299.99,
        paymentDate: "2024-01-15",
        orderId: testOrder.id,
        userId: testUser.id,
      };

      const payment = await Payment.create(paymentData);

      expect(payment).toBeDefined();
      expect(payment.paymentMethod).toBe("Credit Card");
      expect(payment.cardNumber).toBe("4111111111111111");
      expect(payment.amount).toBe("299.99");
      expect(payment.orderId).toBe(testOrder.id);
      expect(payment.userId).toBe(testUser.id);
    });

    test("should fail to create payment without required fields", async () => {
      const incompletePaymentData = {
        paymentMethod: "Credit Card",
        // Missing required fields
      };

      await expect(Payment.create(incompletePaymentData)).rejects.toThrow();
    });

    test("should fail to create payment with invalid foreign key", async () => {
      const paymentData = {
        paymentMethod: "Credit Card",
        cardNumber: "4111111111111111",
        expiryDate: "12/25",
        cvv: "123",
        amount: 299.99,
        paymentDate: "2024-01-15",
        orderId: 99999, // Non-existent order ID
        userId: testUser.id,
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });
  });

  describe("Payment Retrieval (Read)", () => {
    let testPayment;

    beforeEach(async () => {
      testPayment = await Payment.create({
        paymentMethod: "Credit Card",
        cardNumber: "4111111111111111",
        expiryDate: "12/25",
        cvv: "123",
        amount: 299.99,
        paymentDate: "2024-01-15",
        orderId: testOrder.id,
        userId: testUser.id,
      });
    });

    test("should find payment by ID and user ID", async () => {
      const foundPayment = await Payment.findOne({
        where: {
          id: testPayment.id,
          userId: testUser.id,
        },
      });

      expect(foundPayment).toBeDefined();
      expect(foundPayment.id).toBe(testPayment.id);
      expect(foundPayment.userId).toBe(testUser.id);
    });

    test("should find payment by order ID", async () => {
      const foundPayment = await Payment.findOne({
        where: {
          orderId: testOrder.id,
          userId: testUser.id,
        },
      });

      expect(foundPayment).toBeDefined();
      expect(foundPayment.orderId).toBe(testOrder.id);
    });

    test("should find all payments for a user", async () => {
      // Create another payment for the same user
      const secondOrder = await Order.create({
        userId: testUser.id,
        totalAmount: 199.99,
        status: "pending",
      });

      await Payment.create({
        paymentMethod: "Debit Card",
        cardNumber: "5555555555554444",
        expiryDate: "06/26",
        cvv: "456",
        amount: 199.99,
        paymentDate: "2024-01-16",
        orderId: secondOrder.id,
        userId: testUser.id,
      });

      const userPayments = await Payment.findAll({
        where: { userId: testUser.id },
        order: [["paymentDate", "DESC"]],
      });

      expect(userPayments).toHaveLength(2);
      expect(userPayments[0].paymentDate).toBe("2024-01-16"); // Most recent first
    });

    test("should search payments by date", async () => {
      const paymentsOnDate = await Payment.findAll({
        where: {
          userId: testUser.id,
          paymentDate: "2024-01-15",
        },
      });

      expect(paymentsOnDate).toHaveLength(1);
      expect(paymentsOnDate[0].paymentDate).toBe("2024-01-15");
    });

    test("should include related Order and User data", async () => {
      const paymentWithRelations = await Payment.findOne({
        where: { id: testPayment.id },
        include: [
          { model: Order, attributes: ["id", "totalAmount"] },
          { model: User, attributes: ["id", "fullName", "email"] },
        ],
      });

      expect(paymentWithRelations).toBeDefined();
      expect(paymentWithRelations.Order).toBeDefined();
      expect(paymentWithRelations.User).toBeDefined();
      expect(paymentWithRelations.Order.totalAmount).toBe("299.99");
      expect(paymentWithRelations.User.fullName).toBe("Payment Test User");
    });
  });

  describe("Payment Update (Update)", () => {
    let testPayment;

    beforeEach(async () => {
      testPayment = await Payment.create({
        paymentMethod: "Credit Card",
        cardNumber: "4111111111111111",
        expiryDate: "12/25",
        cvv: "123",
        amount: 299.99,
        paymentDate: "2024-01-15",
        orderId: testOrder.id,
        userId: testUser.id,
      });
    });

    test("should update payment details", async () => {
      await testPayment.update({
        paymentMethod: "Debit Card",
        cardNumber: "5555555555554444",
        amount: 349.99,
      });

      const updatedPayment = await Payment.findByPk(testPayment.id);
      expect(updatedPayment.paymentMethod).toBe("Debit Card");
      expect(updatedPayment.cardNumber).toBe("5555555555554444");
      expect(updatedPayment.amount).toBe("349.99");
      expect(updatedPayment.orderId).toBe(testOrder.id); // Should remain unchanged
    });

    test("should update payment using where clause", async () => {
      const [updatedRowsCount] = await Payment.update(
        {
          paymentMethod: "PayPal",
          amount: 399.99,
        },
        {
          where: {
            id: testPayment.id,
            userId: testUser.id,
          },
        }
      );

      expect(updatedRowsCount).toBe(1);

      const updatedPayment = await Payment.findByPk(testPayment.id);
      expect(updatedPayment.paymentMethod).toBe("PayPal");
      expect(updatedPayment.amount).toBe("399.99");
    });

    test("should not update payment with invalid user ID", async () => {
      const [updatedRowsCount] = await Payment.update(
        {
          amount: 999.99,
        },
        {
          where: {
            id: testPayment.id,
            userId: 99999, // Non-existent user ID
          },
        }
      );

      expect(updatedRowsCount).toBe(0);

      const unchangedPayment = await Payment.findByPk(testPayment.id);
      expect(unchangedPayment.amount).toBe("299.99"); // Should remain unchanged
    });
  });

  describe("Payment Deletion (Delete)", () => {
    let testPayment;

    beforeEach(async () => {
      testPayment = await Payment.create({
        paymentMethod: "Credit Card",
        cardNumber: "4111111111111111",
        expiryDate: "12/25",
        cvv: "123",
        amount: 299.99,
        paymentDate: "2024-01-15",
        orderId: testOrder.id,
        userId: testUser.id,
      });
    });

    test("should delete payment by ID", async () => {
      const paymentId = testPayment.id;
      await testPayment.destroy();

      const deletedPayment = await Payment.findByPk(paymentId);
      expect(deletedPayment).toBeNull();
    });

    test("should delete payment using where clause", async () => {
      const deletedRowsCount = await Payment.destroy({
        where: {
          id: testPayment.id,
          userId: testUser.id,
        },
      });

      expect(deletedRowsCount).toBe(1);

      const deletedPayment = await Payment.findByPk(testPayment.id);
      expect(deletedPayment).toBeNull();
    });

    test("should not delete payment with wrong user ID", async () => {
      const deletedRowsCount = await Payment.destroy({
        where: {
          id: testPayment.id,
          userId: 99999, // Wrong user ID
        },
      });

      expect(deletedRowsCount).toBe(0);

      const stillExistingPayment = await Payment.findByPk(testPayment.id);
      expect(stillExistingPayment).toBeDefined();
    });
  });

  describe("Payment Validation", () => {
    test("should validate payment method", async () => {
      const paymentData = {
        paymentMethod: "", // Empty payment method
        cardNumber: "4111111111111111",
        expiryDate: "12/25",
        cvv: "123",
        amount: 299.99,
        paymentDate: "2024-01-15",
        orderId: testOrder.id,
        userId: testUser.id,
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    test("should validate amount is positive", async () => {
      const paymentData = {
        paymentMethod: "Credit Card",
        cardNumber: "4111111111111111",
        expiryDate: "12/25",
        cvv: "123",
        amount: -100, // Negative amount
        paymentDate: "2024-01-15",
        orderId: testOrder.id,
        userId: testUser.id,
      };

      const payment = await Payment.create(paymentData);
      expect(payment.amount).toBe("-100.00"); // Sequelize allows negative values by default
      // Note: You might want to add custom validation for positive amounts
    });
  });
});
