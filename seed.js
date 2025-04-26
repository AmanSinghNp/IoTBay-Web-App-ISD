const sequelize = require("./config/database");
const User = require("./models/user");
const Device = require("./models/device");
const Order = require("./models/order");
const Payment = require("./models/payment");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Reset DB

    // Create sample users
    const passwordHash = await bcrypt.hash("123456", 10);

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

    // Create sample devices
    const device1 = await Device.create({
      name: "Smart Light Bulb",
      brand: "Philips",
      price: 29.99,
      stock: 100,
      description: "WiFi-enabled smart bulb with remote control.",
    });

    const device2 = await Device.create({
      name: "IoT Security Camera",
      brand: "Ring",
      price: 129.99,
      stock: 50,
      description: "Monitor your home from anywhere with live video.",
    });

    const device3 = await Device.create({
      name: "Smart Thermostat",
      brand: "Nest",
      price: 199.99,
      stock: 30,
      description: "Automatically adjust your home's temperature.",
    });

    // Create sample orders
    const order = await Order.create({
      userId: customer.id,
      deviceId: device1.id,
      quantity: 2,
      status: "Placed",
    });

    // Create sample payments
    await Payment.create({
      userId: customer.id,
      orderId: order.id,
      amount: 59.98,
      paymentMethod: "Credit Card",
      status: "Completed",
    });

    console.log("✅ Seed completed successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
