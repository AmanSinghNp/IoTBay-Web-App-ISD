// seed.js
const sequelize = require("./config/database");
const Device = require("./models/device");
const User = require("./models/user");
const Order = require("./models/order");
const Payment = require("./models/payment");
const UserAccessLog = require("./models/userAccessLog");
const Shipment = require("./models/shipment");
const Address = require("./models/address");
const Cart = require("./models/cart");
const bcrypt = require("bcrypt");
const OrderItem = require("./models/orderItem");

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

(async () => {
  try {
    // Drop & recreate tables
    await sequelize.sync({ force: true });

    // Insert our dummy devices
    await Device.bulkCreate(dummyDevices);

    // Hash passwords for dummy users
    for (const user of dummyUsers) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    // Insert our dummy users
    await User.bulkCreate(dummyUsers);

    console.log(
      "✅  Seeding complete. You now have",
      dummyDevices.length,
      "devices and",
      dummyUsers.length,
      "users."
    );
    process.exit(0);
  } catch (err) {
    console.error("❌  Seeding failed:", err);
    process.exit(1);
  }
})();
