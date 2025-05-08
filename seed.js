// seed.js
const sequelize = require("./config/database");
const Device = require("./models/device");

const dummyDevices = [
  // 1–7: Amazon (7 items)
  { name: "Crocs Unisex Adult Classic Clog",                    brand: "Amazon",        catalog: "Clothing, Shoes & Accessories", price: 69.95,  stock: 100, description: "Classic rubber clog with pivoting heel straps",imageUrl: null,},
  { name: "Caterpillar Men's Beanie & 5-Pack Socks",            brand: "Amazon",        catalog: "Clothing, Shoes & Accessories", price: 39.99,  stock: 120, description: "Warm cotton beanie and sock set for men",imageUrl: null ,},
  { name: "Cabeau Evolution S3 Travel Pillow",                  brand: "Amazon",        catalog: "Clothing, Shoes & Accessories", price: 79.99,  stock: 80,  description: "Memory foam travel pillow for airplane seats",imageUrl: null, },
  { name: "Amazon Basics Vacuum Compression Storage Bags (6-Pack)", brand: "Amazon",     catalog: "Clothing, Shoes & Accessories", price: 29.99,  stock: 200, description: "Reusable vacuum storage bags with hand pump",imageUrl: null, },
  { name: "Portwest Radial 3 in 1 Jacket (Black, XL)",          brand: "Amazon",        catalog: "Clothing, Shoes & Accessories", price: 119.95, stock: 50,  description: "Waterproof 3-in-1 jacket with removable liner",imageUrl: null, },
  { name: "9pcs Compression Packing Cubes Set",                 brand: "Amazon",        catalog: "Clothing, Shoes & Accessories", price: 24.99,  stock: 150, description: "Ultralight expandable packing cubes for travel",imageUrl: null, },
  { name: "Amazon Kindle Paperwhite (16 GB) – Black",           brand: "Amazon",        catalog: "Amazon Devices & Accessories", price: 249.00, stock: 75,  description: "Glare-free e-reader with 16 GB storage",imageUrl: null, },

  // 8–13: Amazon Basics (6 items)
  { name: "Amazon Kindle (2024 release) – Matcha",              brand: "Amazon Basics", catalog: "Amazon Devices & Accessories", price: 169.00, stock: 90,  description: "Lightweight Kindle with adjustable front light",imageUrl: null, },
  { name: "Ring Battery Video Doorbell",                        brand: "Amazon Basics", catalog: "Amazon Devices & Accessories", price: 199.00, stock: 60,  description: "Wireless security video doorbell with battery",imageUrl: null, },
  { name: "Amazon Fire TV Stick HD",                            brand: "Amazon Basics", catalog: "Amazon Devices & Accessories", price: 49.99,  stock: 200, description: "HD streaming device with Alexa voice remote",imageUrl: null, },
  { name: "Amazon Kindle (2024 release) – Black",               brand: "Amazon Basics", catalog: "Amazon Devices & Accessories", price: 169.00, stock: 85,  description: "Compact Kindle with glare-free display",imageUrl: null, },
  { name: "Amazon Fire TV Stick 4K",                            brand: "Amazon Basics", catalog: "Amazon Devices & Accessories", price: 79.99,  stock: 120, description: "4K streaming device with Wi-Fi 6 support",imageUrl: null, },
  { name: "TP-Link Tapo Smart Wi-Fi Light Bulb (E27, Multicolour, 2-Pack)", brand: "Amazon Basics", catalog: "Lighting", price: 39.99,  stock: 140, description: "Multicolour smart Wi-Fi LED light bulb with remote control",imageUrl: null, },

  // 14–18: Crocs (5 items)
  { name: "Glocusent USB Rechargeable Book Light",               brand: "Crocs",         catalog: "Lighting",                   price: 24.99,  stock: 130, description: "Clip-on rechargeable LED reading light",imageUrl: null, },
  { name: "Dove Triple Moisturising Body Wash 1 L",             brand: "Crocs",         catalog: "Beauty",                     price: 7.50,   stock: 300, description: "Triple moisturising body wash, soap-free formula",imageUrl: null, },
  { name: "La Roche-Posay Anthelios XL Sunscreen SPF 50+ (50 ml)", brand: "Crocs",       catalog: "Beauty",                     price: 29.95,  stock: 90,  description: "Ultra-light, water-resistant sunscreen face fluid",imageUrl: null, },
  { name: "The Pink Stuff Miracle Cleaning Paste 850 g",         brand: "Crocs",         catalog: "Home",                       price: 12.95,  stock: 180, description: "Vegan multi-purpose household cleaning paste" ,imageUrl: null,},
  { name: "White King Lemon Toilet Cleaner Gel 700 ml",         brand: "Crocs",         catalog: "Home",                       price: 5.99,   stock: 220, description: "Lemon-scented toilet cleaner gel with stain remover",imageUrl: null, },

  // 19–23: The Pink Stuff (5 items)
  { name: "GLASSGUARD Mould Remover Gel 300 ml",                brand: "The Pink Stuff", catalog: "Home",                      price: 9.99,   stock: 140, description: "Mould remover gel for bathroom and kitchen surfaces",imageUrl: null, },
  { name: "The Original Scrub Daddy Cleaning Sponge",            brand: "The Pink Stuff", catalog: "Home",                      price: 6.99,   stock: 260, description: "Temperature-controlled texture cleaning sponge",imageUrl: null, },
  { name: "Frameo Wi-Fi Digital Picture Frame 10.1″",           brand: "The Pink Stuff", catalog: "Home",                      price: 129.00, stock: 45,  description: "10.1″ HD touch-screen photo frame with 32 GB memory",imageUrl: null, },
  { name: "The Pink Stuff Miracle Bathroom Foam Cleaner 750 ml", brand: "The Pink Stuff", catalog: "Home",                      price: 8.95,   stock: 160, description: "Vegan foaming bathroom cleaner spray",imageUrl: null, },
  { name: "The Let Them Theory: A Life-Changing Tool",          brand: "The Pink Stuff", catalog: "Books",                     price: 24.99,  stock: 75,  description: "Self-help book offering life-changing advice",imageUrl: null, },

  // 24–27: RecipeTin Eats (4 items)
  { name: "RecipeTin Eats: Tonight (Cookbook)",                 brand: "RecipeTin Eats", catalog: "Books",                    price: 34.99,  stock: 60,  description: "Cookbook with dinner recipes for every night",imageUrl: null, },
  { name: "Bluey: My Mum is the Best",                          brand: "RecipeTin Eats", catalog: "Books",                    price: 16.99,  stock: 120, description: "Children's book by Bluey and Bingo for Mother's Day",imageUrl: null, },
  { name: "Easy Dinner Queen (Cookbook)",                       brand: "RecipeTin Eats", catalog: "Books",                    price: 29.99,  stock: 50,  description: "Recipe book for quick and easy dinners",imageUrl: null, },
  { name: "RecipeTin Eats: Dinner (Cookbook)",                  brand: "RecipeTin Eats", catalog: "Books",                    price: 34.99,  stock: 65,  description: "150 recipes from Australia's most popular cook" ,imageUrl: null,},

  // 28–30: Generic (3 items)
  { name: "Sunrise on the Reaping (Hunger Games)",              brand: "Generic",       catalog: "Books",                     price: 19.99,  stock: 90,  description: "Prequel novel in the Hunger Games series",imageUrl: null, },
  { name: "Amazon Basics Digital Kitchen Scale",                brand: "Generic",       catalog: "Household Appliances",     price: 17.90,  stock: 210, description: "Digital kitchen scale with LCD display, up to 4.9 kg",imageUrl: null, },
  { name: "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant", brand: "Generic",    catalog: "Beauty",                    price: 56.00,  stock: 80,  description: "Liquid exfoliant with 2% salicylic acid for pores",imageUrl: null, }
];





(async () => {
  try {
    // Drop & recreate tables
    await sequelize.sync({ force: true });

    // Insert our dummy devices
    await Device.bulkCreate(dummyDevices);

    console.log("✅  Seeding complete. You now have", dummyDevices.length, "devices.");
    process.exit(0);
  } catch (err) {
    console.error("❌  Seeding failed:", err);
    process.exit(1);
  }
})();
