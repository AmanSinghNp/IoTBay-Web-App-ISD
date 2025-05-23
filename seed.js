// seed.js
const sequelize = require("./config/database");
const Device = require("./models/device");
const User = require("./models/user");
const Order = require("./models/order");
const UserAccessLog = require("./models/userAccessLog");
const Shipment = require("./models/shipment");
const Address = require("./models/address");
const Cart = require("./models/cart");
const bcrypt = require("bcrypt");
const OrderItem = require("./models/orderItem");

// Import SQLite Payment model for the new payment management system
const Payment = require("./models/payment");

const dummyDevices = [
  // 1–7: Amazon (7 items)
  {
    name: "Crocs Unisex Adult Classic Clog",
    brand: "Amazon",
    catalog: "Clothing, Shoes & Accessories",
    price: 69.95,
    stock: 100,
    description: "Classic rubber clog with pivoting heel straps",
    imageUrl: "/images/Crocs Unisex Adult Classic Clog.jpg",
  },

  {
    name: "Apple iPhone 14 Pro",
    brand: "Apple",
    catalog: "Electronics, Mobile Phones",
    price: 1199.0,
    stock: 50,
    description:
      "6.1-inch Super Retina XDR display, A16 Bionic chip, and Pro camera system.",
    imageUrl: "/images/iphone14pro.jpg",
  },
  {
    name: "Apple MacBook Air",
    brand: "Apple",
    catalog: "Electronics, Computers & Accessories",
    price: 999.0,
    stock: 30,
    description:
      "M2 chip, 8 GB RAM, 256 GB SSD, 13.6-inch Liquid Retina display, fan-less design.",
    imageUrl: "/images/MacBookAir.jpg",
  },
  {
    name: "Acer Aspire 5",
    brand: "Acer",
    catalog: "Electronics, Computers & Accessories",
    price: 549.99,
    stock: 75,
    description:
      "15.6-inch Full HD display, Intel Core i5-1135G7, 8 GB RAM, 256 GB SSD, backlit keyboard.",
    imageUrl: "/images/Acer_Aspire.jpg",
  },
  {
    name: "Asus ROG Phone 6",
    brand: "Asus",
    catalog: "Electronics, Mobile Phones",
    price: 999.99,
    stock: 40,
    description:
      "Snapdragon 8+ Gen 1, 6.78-inch 165 Hz AMOLED display, AirTrigger 5 gaming controls.",
    imageUrl: "/images/Asus_ROG_phone.jpg",
  },
  {
    name: "Asus ZenBook 14",
    brand: "Asus",
    catalog: "Electronics, Computers & Accessories",
    price: 849.99,
    stock: 25,
    description:
      "14-inch Full HD OLED display, Intel Evo platform, 16 GB RAM, 512 GB SSD, ultralight chassis.",
    imageUrl: "/images/Asus_ZenBook.jpg",
  },
  {
    name: "Amazon Fire HD 10 Tablet",
    brand: "Amazon",
    catalog: "Electronics, Tablets",
    price: 149.99,
    stock: 120,
    description:
      "10.1-inch 1080p Full HD display, 3 GB RAM, 32 GB storage (expandable), up to 12 hrs battery.",
    imageUrl: "/images/Amazon_Fire_Tablet.jpg",
  },
  {
    name: "Caterpillar Men's Beanie & 5-Pack Socks",
    brand: "Amazon",
    catalog: "Clothing, Shoes & Accessories",
    price: 39.99,
    stock: 120,
    description: "Warm cotton beanie and sock set for men",
    imageUrl: "/images/Caterpillar Men's Beanie & 5-Pack Socks.jpg",
  },
  {
    name: "Cabeau Evolution S3 Travel Pillow",
    brand: "Amazon",
    catalog: "Clothing, Shoes & Accessories",
    price: 79.99,
    stock: 80,
    description: "Memory foam travel pillow for airplane seats",
    imageUrl: "/images/Cabeau Evolution S3 Travel Pillow.jpg",
  },
  {
    name: "Amazon Basics Vacuum Compression Storage Bags (6-Pack)",
    brand: "Amazon",
    catalog: "Clothing, Shoes & Accessories",
    price: 29.99,
    stock: 200,
    description: "Reusable vacuum storage bags with hand pump",
    imageUrl:
      "/images/Amazon Basics Vacuum Compression Storage Bags (6-Pack).jpg",
  },
  {
    name: "Portwest Radial 3 in 1 Jacket (Black, XL)",
    brand: "Amazon",
    catalog: "Clothing, Shoes & Accessories",
    price: 119.95,
    stock: 50,
    description: "Waterproof 3-in-1 jacket with removable liner",
    imageUrl: "/images/Portwest Radial 3 in 1 Jacket (Black, XL).jpg",
  },
  {
    name: "9pcs Compression Packing Cubes Set",
    brand: "Amazon",
    catalog: "Clothing, Shoes & Accessories",
    price: 24.99,
    stock: 150,
    description: "Ultralight expandable packing cubes for travel",
    imageUrl: "/images/9pcs Compression Packing Cubes Set.jpg",
  },
  {
    name: "Amazon Kindle Paperwhite (16 GB) – Black",
    brand: "Amazon",
    catalog: "Amazon Devices & Accessories",
    price: 249.0,
    stock: 75,
    description: "Glare-free e-reader with 16 GB storage",
    imageUrl: "/images/Amazon Kindle Paperwhite (16 GB) – Black.jpg",
  },

  // 8–13: Amazon Basics (6 items)
  {
    name: "Amazon Kindle (2024 release) – Matcha",
    brand: "Amazon Basics",
    catalog: "Amazon Devices & Accessories",
    price: 169.0,
    stock: 90,
    description: "Lightweight Kindle with adjustable front light",
    imageUrl: "/images/Amazon Kindle (2024 release) – Matcha.jpg",
  },
  {
    name: "Ring Battery Video Doorbell",
    brand: "Amazon Basics",
    catalog: "Amazon Devices & Accessories",
    price: 199.0,
    stock: 60,
    description: "Wireless security video doorbell with battery",
    imageUrl: "/images/Ring Battery Video Doorbell.jpg",
  },
  {
    name: "Amazon Fire TV Stick HD",
    brand: "Amazon Basics",
    catalog: "Amazon Devices & Accessories",
    price: 49.99,
    stock: 200,
    description: "HD streaming device with Alexa voice remote",
    imageUrl: "/images/Amazon Fire TV Stick HD.jpg",
  },
  {
    name: "Amazon Kindle (2024 release) – Black",
    brand: "Amazon Basics",
    catalog: "Amazon Devices & Accessories",
    price: 169.0,
    stock: 85,
    description: "Compact Kindle with glare-free display",
    imageUrl: "/images/Amazon Kindle (2024 release) – Black.jpg",
  },
  {
    name: "Amazon Fire TV Stick 4K",
    brand: "Amazon Basics",
    catalog: "Amazon Devices & Accessories",
    price: 79.99,
    stock: 120,
    description: "4K streaming device with Wi-Fi 6 support",
    imageUrl: "/images/Amazon Fire TV Stick 4K.jpg",
  },
  {
    name: "TP-Link Tapo Smart Wi-Fi Light Bulb (E27, Multicolour, 2-Pack)",
    brand: "Amazon Basics",
    catalog: "Lighting",
    price: 39.99,
    stock: 140,
    description: "Multicolour smart Wi-Fi LED light bulb with remote control",
    imageUrl:
      "/images/TP-Link Tapo Smart Wi-Fi Light Bulb (E27, Multicolour, 2-Pack).jpg",
  },

  // 14–18: Crocs (5 items)
  {
    name: "Glocusent USB Rechargeable Book Light",
    brand: "Crocs",
    catalog: "Lighting",
    price: 24.99,
    stock: 130,
    description: "Clip-on rechargeable LED reading light",
    imageUrl: "/images/Glocusent USB Rechargeable Book Light.jpg",
  },
  {
    name: "Dove Triple Moisturising Body Wash 1 L",
    brand: "Crocs",
    catalog: "Beauty",
    price: 7.5,
    stock: 300,
    description: "Triple moisturising body wash, soap-free formula",
    imageUrl: "/images/Dove Triple Moisturising Body Wash 1 L.jpg",
  },
  {
    name: "La Roche-Posay Anthelios XL Sunscreen SPF 50+ (50 ml)",
    brand: "Crocs",
    catalog: "Beauty",
    price: 29.95,
    stock: 90,
    description: "Ultra-light, water-resistant sunscreen face fluid",
    imageUrl:
      "/images/La Roche-Posay Anthelios XL Sunscreen SPF 50+ (50 ml).jpg",
  },
  {
    name: "The Pink Stuff Miracle Cleaning Paste 850 g",
    brand: "Crocs",
    catalog: "Home",
    price: 12.95,
    stock: 180,
    description: "Vegan multi-purpose household cleaning paste",
    imageUrl: "/images/The Pink Stuff Miracle Cleaning Paste 850 g.jpg",
  },
  {
    name: "White King Lemon Toilet Cleaner Gel 700 ml",
    brand: "Crocs",
    catalog: "Home",
    price: 5.99,
    stock: 220,
    description: "Lemon-scented toilet cleaner gel with stain remover",
    imageUrl: "/images/White King Lemon Toilet Cleaner Gel 700 ml.jpg",
  },

  // 19–23: The Pink Stuff (5 items)
  {
    name: "GLASSGUARD Mould Remover Gel 300 ml",
    brand: "The Pink Stuff",
    catalog: "Home",
    price: 9.99,
    stock: 140,
    description: "Mould remover gel for bathroom and kitchen surfaces",
    imageUrl: "/images/GLASSGUARD Mould Remover Gel 300 ml.jpg",
  },
  {
    name: "The Original Scrub Daddy Cleaning Sponge",
    brand: "The Pink Stuff",
    catalog: "Home",
    price: 6.99,
    stock: 260,
    description: "Temperature-controlled texture cleaning sponge",
    imageUrl: "/images/The Original Scrub Daddy Cleaning Sponge.jpg",
  },
  {
    name: "Frameo Wi-Fi Digital Picture Frame 10.1″",
    brand: "The Pink Stuff",
    catalog: "Home",
    price: 129.0,
    stock: 45,
    description: "10.1″ HD touch-screen photo frame with 32 GB memory",
    imageUrl: "/images/Frameo Wi-Fi Digital Picture Frame 10.1.jpg",
  },
  {
    name: "The Pink Stuff Miracle Bathroom Foam Cleaner 750 ml",
    brand: "The Pink Stuff",
    catalog: "Home",
    price: 8.95,
    stock: 160,
    description: "Vegan foaming bathroom cleaner spray",
    imageUrl: "/images/The Pink Stuff Miracle Bathroom Foam Cleaner 750 ml.jpg",
  },
  {
    name: "The Let Them Theory: A Life-Changing Tool",
    brand: "The Pink Stuff",
    catalog: "Books",
    price: 24.99,
    stock: 75,
    description: "Self-help book offering life-changing advice",
    imageUrl: "/images/The Let Them Theory- A Life-Changing Tool.jpg",
  },

  // 24–27: RecipeTin Eats (4 items)
  {
    name: "RecipeTin Eats: Tonight (Cookbook)",
    brand: "RecipeTin Eats",
    catalog: "Books",
    price: 34.99,
    stock: 60,
    description: "Cookbook with dinner recipes for every night",
    imageUrl: "/images/RecipeTin Eats- Dinner (Cookbook).jpg",
  },
  {
    name: "Bluey: My Mum is the Best",
    brand: "RecipeTin Eats",
    catalog: "Books",
    price: 16.99,
    stock: 120,
    description: "Children's book by Bluey and Bingo for Mother's Day",
    imageUrl: "/images/Bluey- My Mum is the Best.jpg",
  },
  {
    name: "Easy Dinner Queen (Cookbook)",
    brand: "RecipeTin Eats",
    catalog: "Books",
    price: 29.99,
    stock: 50,
    description: "Recipe book for quick and easy dinners",
    imageUrl: "/images/Easy Dinner Queen (Cookbook).jpg",
  },
  {
    name: "RecipeTin Eats: Dinner (Cookbook)",
    brand: "RecipeTin Eats",
    catalog: "Books",
    price: 34.99,
    stock: 65,
    description: "150 recipes from Australia's most popular cook",
    imageUrl: "/images/RecipeTin Eats- Tonight (Cookbook).jpg",
  },

  // 28–30: Generic (3 items)
  {
    name: "Sunrise on the Reaping (Hunger Games)",
    brand: "Generic",
    catalog: "Books",
    price: 19.99,
    stock: 90,
    description: "Prequel novel in the Hunger Games series",
    imageUrl: "/images/Sunrise on the Reaping (Hunger Games).jpg",
  },
  {
    name: "Amazon Basics Digital Kitchen Scale",
    brand: "Generic",
    catalog: "Household Appliances",
    price: 17.9,
    stock: 210,
    description: "Digital kitchen scale with LCD display, up to 4.9 kg",
    imageUrl: "/images/Amazon Basics Digital Kitchen Scale.jpg",
  },
  {
    name: "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant",
    brand: "Generic",
    catalog: "Beauty",
    price: 56.0,
    stock: 80,
    description: "Liquid exfoliant with 2% salicylic acid for pores",
    imageUrl: "/images/Paula's chocie.jpg",
  },
];

const dummyUsers = [
  {
    fullName: "Admin User",
    email: "admin@example.com",
    password: "123456",
    phone: "1234567890",
    role: "staff",
  },
  {
    fullName: "John Doe",
    email: "john@example.com",
    password: "123456",
    phone: "0987654321",
    role: "customer",
  },
];

// Function to generate a random date between start and end dates
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Create dummy access logs for the past week
function createAccessLogs(userId) {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const logs = [];

  // Create 5-10 random access logs per user
  const numLogs = 5 + Math.floor(Math.random() * 6);

  for (let i = 0; i < numLogs; i++) {
    // Create login time (random time in the past week)
    const loginTime = randomDate(oneWeekAgo, now);

    // Create logout time (15 min to 2 hours after login)
    const logoutTime = new Date(loginTime);
    logoutTime.setMinutes(
      loginTime.getMinutes() + 15 + Math.floor(Math.random() * 105)
    );

    // Add log
    logs.push({
      userId,
      loginTime,
      logoutTime,
    });
  }

  // Add one active session for the admin (no logout time)
  if (userId === 1) {
    logs.push({
      userId,
      loginTime: new Date(),
      logoutTime: null, // Active session
    });
  }

  return logs;
}

// Create dummy orders for the customer
function createCustomerOrders(userId) {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Order statuses
  const statuses = ["Placed", "Completed", "Cancelled"];

  // Create orders array
  const orders = [
    // Recent orders with different statuses
    {
      userId,
      status: "Placed",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId,
      status: "Completed",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // Completed 2 days later
    },
    {
      userId,
      status: "Cancelled",
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // Cancelled 1 day later
    },

    // Orders from last month
    {
      userId,
      status: "Completed",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 5), // 5th of last month
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 1, 8), // Completed 3 days later
    },
    {
      userId,
      status: "Completed",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 15), // 15th of last month
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 1, 18), // Completed 3 days later
    },

    // Orders from 2 months ago
    {
      userId,
      status: "Completed",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 10), // 10th of 2 months ago
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 2, 12), // Completed 2 days later
    },

    // Orders from 3-6 months ago (for history)
    {
      userId,
      status: "Completed",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 3, 22), // 22nd of 3 months ago
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 3, 25), // Completed 3 days later
    },
    {
      userId,
      status: "Cancelled",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 4, 12), // 12th of 4 months ago
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 4, 12), // Cancelled same day
    },
    {
      userId,
      status: "Completed",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 5, 3), // 3rd of 5 months ago
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 5, 7), // Completed 4 days later
    },
    {
      userId,
      status: "Completed",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 6, 18), // 18th of 6 months ago
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 6, 21), // Completed 3 days later
    },
  ];

  return orders;
}

// Create order items for the orders
async function createOrderItems(orders, devices) {
  const orderItems = [];

  for (const order of orders) {
    // Get 1-3 random devices for this order
    const numItems = 1 + Math.floor(Math.random() * 3);
    const orderDevices = [];

    // Make sure we don't add the same device twice to an order
    while (orderDevices.length < numItems) {
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      if (!orderDevices.find((d) => d.id === randomDevice.id)) {
        orderDevices.push(randomDevice);
      }
    }

    // Create order items for each device
    for (const device of orderDevices) {
      const quantity = 1 + Math.floor(Math.random() * 3); // 1-3 of each item

      orderItems.push({
        orderId: order.id,
        deviceId: device.id,
        quantity,
        price: device.price,
      });
    }
  }

  return orderItems;
}

// Create SQLite payment records for the new payment management system
function createSQLitePaymentRecords(orders, userId) {
  const paymentRecords = [];
  const paymentMethods = ["Credit Card", "Debit Card", "PayPal"];
  const cardNumbers = [
    "4111-1111-1111-1111", // Visa test number
    "5555-5555-5555-4444", // Mastercard test number
    "3782-8224-6310-005", // American Express test number
  ];
  const expiryDates = ["12/26", "05/27", "09/28", "03/29"];
  const cvvs = ["123", "456", "789", "321"];

  for (const order of orders) {
    // Create payment records for all orders (not just completed ones)
    const randomMethod =
      paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const randomCard =
      cardNumbers[Math.floor(Math.random() * cardNumbers.length)];
    const randomExpiry =
      expiryDates[Math.floor(Math.random() * expiryDates.length)];
    const randomCvv = cvvs[Math.floor(Math.random() * cvvs.length)];

    // Calculate amount based on a realistic range
    const amount = (Math.random() * 800 + 100).toFixed(2); // $100-$900

    // Format payment date as YYYY-MM-DD
    const paymentDate = order.createdAt.toISOString().split("T")[0];

    paymentRecords.push({
      payment_method: randomMethod,
      card_number: randomCard,
      expiry_date: randomExpiry,
      cvv: randomCvv,
      amount: parseFloat(amount),
      payment_date: paymentDate,
      order_id: order.id,
      user_id: userId,
    });
  }

  return paymentRecords;
}

// Helper function to insert SQLite payment records
function insertSQLitePaymentRecords(paymentRecords) {
  return new Promise((resolve, reject) => {
    let completed = 0;
    const total = paymentRecords.length;

    if (total === 0) {
      resolve();
      return;
    }

    let hasError = false;

    paymentRecords.forEach((record) => {
      Payment.create(record, (err, result) => {
        if (err && !hasError) {
          hasError = true;
          reject(err);
          return;
        }

        completed++;
        if (completed === total && !hasError) {
          resolve();
        }
      });
    });
  });
}

(async () => {
  try {
    // Drop & recreate tables
    await sequelize.sync({ force: true });

    // Insert our dummy devices
    const devices = await Device.bulkCreate(dummyDevices);

    // Hash passwords for dummy users
    for (const user of dummyUsers) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    // Insert our dummy users
    const users = await User.bulkCreate(dummyUsers);

    // Create access logs for each user
    const accessLogs = [
      ...createAccessLogs(1), // Admin user (ID 1)
      ...createAccessLogs(2), // Customer user (ID 2)
    ];

    // Insert access logs
    await UserAccessLog.bulkCreate(accessLogs);

    // Create customer orders (for John Doe, ID 2)
    const customerOrders = createCustomerOrders(2);

    // Insert orders
    const orders = await Order.bulkCreate(customerOrders);

    // Create order items for each order
    const orderItems = await createOrderItems(orders, devices);

    // Insert order items
    await OrderItem.bulkCreate(orderItems);

    // Create SQLite payment records for the new payment management system
    const sqlitePaymentRecords = createSQLitePaymentRecords(orders, 2);

    // Insert SQLite payment records
    await insertSQLitePaymentRecords(sqlitePaymentRecords);

    console.log(
      "✅  Seeding complete. You now have",
      dummyDevices.length,
      "devices,",
      dummyUsers.length,
      "users,",
      accessLogs.length,
      "access logs,",
      orders.length,
      "orders,",
      orderItems.length,
      "order items,",
      sqlitePaymentRecords.length,
      "SQLite payment records."
    );
    process.exit(0);
  } catch (err) {
    console.error("❌  Seeding failed:", err);
    process.exit(1);
  }
})();
