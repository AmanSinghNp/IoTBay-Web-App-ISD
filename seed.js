const sequelize = require("./config/database");
const User = require("./models/user");
const Device = require("./models/device");
const Order = require("./models/order");
const Payment = require("./models/payment");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    await sequelize.sync({ force: true });

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

    const devices = await Device.bulkCreate([
      {
        name: "Smart Light Bulb",
        brand: "Philips",
        catalog: "Lighting",
        price: 29.99,
        stock: 100,
        description: "WiFi-enabled smart bulb with remote control.",
        imageUrl:
          "https://cdn.pixabay.com/photo/2017/03/16/00/54/light-bulb-2146043_1280.jpg",
      },
      {
        name: "IoT Security Camera",
        brand: "Ring",
        catalog: "Surveillance",
        price: 129.99,
        stock: 50,
        description: "Monitor your home from anywhere with live video.",
        imageUrl:
          "https://cdn.pixabay.com/photo/2017/06/06/09/30/camera-2372807_1280.jpg",
      },
      {
        name: "Smart Thermostat",
        brand: "Nest",
        catalog: "Climate",
        price: 199.99,
        stock: 30,
        description: "Automatically adjust your home's temperature.",
        imageUrl:
          "https://cdn.pixabay.com/photo/2020/03/21/12/44/thermostat-4951745_1280.jpg",
      },
      {
        name: "Smart Plug",
        brand: "TP-Link",
        catalog: "Power",
        price: 24.99,
        stock: 60,
        description: "Control plugged-in devices remotely.",
        imageUrl:
          "https://cdn.pixabay.com/photo/2018/03/02/20/15/socket-3196781_1280.jpg",
      },
      {
        name: "WiFi Smoke Detector",
        brand: "Nest Protect",
        catalog: "Safety",
        price: 99.99,
        stock: 25,
        description: "Detects smoke and carbon monoxide.",
        imageUrl:
          "https://cdn.pixabay.com/photo/2016/12/18/17/24/fire-1915240_1280.jpg",
      },
      {
        name: "Smart Door Lock",
        brand: "August",
        catalog: "Security",
        price: 149.99,
        stock: 40,
        description: "Keyless access with app and fingerprint.",
        imageUrl:
          "https://cdn.pixabay.com/photo/2020/01/24/09/42/door-lock-4789183_1280.jpg",
      },
    ]);

    const order1 = await Order.create({
      userId: customer.id,
      deviceId: devices[0].id, // Smart Bulb
      quantity: 2,
      status: "Placed",
    });

    const order2 = await Order.create({
      userId: customer.id,
      deviceId: devices[1].id, // Camera
      quantity: 1,
      status: "Placed",
    });

    await Payment.create({
      userId: customer.id,
      orderId: order1.id,
      amount: 59.98,
      paymentMethod: "Credit Card",
      status: "Completed",
    });

    await Payment.create({
      userId: customer.id,
      orderId: order2.id,
      amount: 129.99,
      paymentMethod: "PayPal",
      status: "Pending",
    });

    console.log("✅ Seed completed with users, devices, orders, and payments!");
    process.exit();
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
