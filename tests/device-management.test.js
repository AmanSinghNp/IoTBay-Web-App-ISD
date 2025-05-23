// IoT Device Management Testing Script
const sequelize = require("../config/database");
const User = require("../models/user");
const Device = require("../models/device");
const bcrypt = require("bcrypt");

async function testDeviceManagement() {
  try {
    console.log("📱 Starting IoT Device Management Test");
    console.log("----------------------------------------");

    // Test data
    const testDevice = {
      name: "Smart Thermostat",
      brand: "TechHome",
      catalog: "Climate Control",
      price: 129.99,
      stock: 50,
      description: "Intelligent temperature control for your home",
      imageUrl: "https://example.com/thermostat.jpg",
    };

    // Clean up: Remove test device if it exists from previous test runs
    await Device.destroy({
      where: { name: testDevice.name, brand: testDevice.brand },
    });

    // 1. Find test users (one staff, one customer)
    console.log("🔍 Finding test users...");
    const staffUser = await User.findOne({
      where: { role: "staff" },
    });

    const customerUser = await User.findOne({
      where: { role: "customer" },
    });

    if (!staffUser || !customerUser) {
      console.error("❌ Test failed: Required test users not found!");
      console.log(
        "Make sure your database has at least one staff and one customer user."
      );
      process.exit(1);
    }

    console.log(`✅ Staff user found: ${staffUser.fullName}`);
    console.log(`✅ Customer user found: ${customerUser.fullName}`);

    // 2. Test device creation (staff only)
    console.log("\n🔧 Testing device creation (staff only)...");

    // Simulate a staff user creating a device
    const createdDevice = await Device.create(testDevice);

    if (!createdDevice || !createdDevice.id) {
      console.error("❌ Test failed: Device creation failed!");
      process.exit(1);
    }

    console.log(`✅ Device created successfully with ID: ${createdDevice.id}`);
    console.log(`   Device name: ${createdDevice.name}`);
    console.log(`   Brand: ${createdDevice.brand}`);
    console.log(`   Price: $${createdDevice.price}`);
    console.log(`   Stock: ${createdDevice.stock} units`);

    // 3. Test device listing (both customer and staff)
    console.log("\n📋 Testing device listing...");

    const devices = await Device.findAll();

    if (!devices || devices.length === 0) {
      console.error("❌ Test failed: No devices found in database!");
      process.exit(1);
    }

    console.log(`✅ Retrieved ${devices.length} devices successfully`);

    // 4. Test device search by name and type
    console.log("\n🔎 Testing device search functionality...");

    // Search by name (partial)
    const nameSearchResults = await Device.findAll({
      where: {
        name: {
          [sequelize.Op.like]: `%${testDevice.name.split(" ")[0]}%`, // Search by first word of name
        },
      },
    });

    if (!nameSearchResults || nameSearchResults.length === 0) {
      console.error("❌ Test failed: Name search returned no results!");
      process.exit(1);
    }

    console.log(`✅ Name search returned ${nameSearchResults.length} results`);

    // Search by catalog/type
    const typeSearchResults = await Device.findAll({
      where: {
        catalog: testDevice.catalog,
      },
    });

    if (!typeSearchResults || typeSearchResults.length === 0) {
      console.error("❌ Test failed: Type search returned no results!");
      process.exit(1);
    }

    console.log(`✅ Type search returned ${typeSearchResults.length} results`);

    // 5. Test device update (staff only)
    console.log("\n🔄 Testing device update (staff only)...");

    const updatedPrice = 149.99;
    const updatedStock = 45;

    await createdDevice.update({
      price: updatedPrice,
      stock: updatedStock,
      description: "Updated description for testing",
    });

    // Fetch fresh from database to verify
    const refreshedDevice = await Device.findByPk(createdDevice.id);

    if (
      refreshedDevice.price !== updatedPrice ||
      refreshedDevice.stock !== updatedStock
    ) {
      console.error("❌ Test failed: Device update was not saved correctly!");
      process.exit(1);
    }

    console.log(`✅ Device updated successfully`);
    console.log(`   New price: $${refreshedDevice.price}`);
    console.log(`   New stock: ${refreshedDevice.stock} units`);

    // 6. Test device deletion (staff only)
    console.log("\n❌ Testing device deletion (staff only)...");

    await createdDevice.destroy();

    // Verify deletion
    const deletedDevice = await Device.findByPk(createdDevice.id);

    if (deletedDevice) {
      console.error("❌ Test failed: Device was not deleted!");
      process.exit(1);
    }

    console.log(`✅ Device deleted successfully`);

    console.log("\n----------------------------------------");
    console.log("🎉 IoT Device Management test passed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  } finally {
    // Clean up any remaining test data
    await Device.destroy({
      where: { name: "Smart Thermostat", brand: "TechHome" },
    });

    // Close database connection
    await sequelize.close();
  }
}

// Run the test
testDeviceManagement();
