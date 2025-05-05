const sequelize = require("./config/database");
const bcrypt = require("bcrypt");

const User = require("./models/user");
const Device = require("./models/device");
const Order = require("./models/order");
const Payment = require("./models/payment");

async function seed() {
  try {
    await sequelize.sync({ force: true });

    // Password for all users
    const passwordHash = await bcrypt.hash("123456", 10);

    // Users
    const customer = await User.create({
      fullName: "John Doe",
      email: "john@example.com",
      password: passwordHash,
      phone: "0400000000",
      role: "customer",
    });

    const staff = await User.create({
      fullName: "Admin User",
      email: "admin@example.com",
      password: passwordHash,
      phone: "0411000000",
      role: "staff",
    });

    // 25 Devices
    const devices = [];
    for (let i = 1; i <= 25; i++) {
      devices.push({
        name: `IoT Device ${i}`,
        brand: i % 2 === 0 ? "Ring" : "Philips",
        catalog: i % 3 === 0 ? "Security" : "Smart Home",
        price: parseFloat((Math.random() * 100 + 20).toFixed(2)),
        stock: Math.floor(Math.random() * 15 + 1),
        description: `Description for IoT device ${i}`,
        imageUrl: null,
      });
    }
    const createdDevices = await Device.bulkCreate(devices);

    // 20 Orders
    const orders = [];
    for (let i = 0; i < 20; i++) {
      const device =
        createdDevices[Math.floor(Math.random() * createdDevices.length)];
      const quantity = Math.floor(Math.random() * 3 + 1);
      const status = i % 4 === 0 ? "Cancelled" : "Placed";

      orders.push({
        userId: customer.id,
        deviceId: device.id,
        quantity,
        status,
      });

      // Adjust stock if not cancelled
      if (status === "Placed") {
        device.stock -= quantity;
        await device.save();
      }
    }
    const createdOrders = await Order.bulkCreate(orders);

    // 20 Payments (linked to orders with status "Placed")
    const payments = [];
    for (const order of createdOrders) {
      if (order.status !== "Placed") continue;

      payments.push({
        userId: customer.id,
        orderId: order.id,
        amount: parseFloat((order.quantity * 49.99).toFixed(2)),
        paymentMethod: Math.random() > 0.5 ? "Credit Card" : "PayPal",
        status: Math.random() > 0.2 ? "Completed" : "Pending",
      });
    }

    await Payment.bulkCreate(payments);

    console.log("✅ Seed completed: 2 users, 25 devices, 20 orders, payments");
    process.exit();
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
