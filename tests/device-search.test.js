// IoT Device Search Functionality Testing Script
const sequelize = require("../config/database");
const Device = require("../models/device");
const { Op } = require("sequelize");

async function testDeviceSearch() {
  try {
    console.log("🔎 Starting IoT Device Search Functionality Test");
    console.log("----------------------------------------");

    // Sample test devices to create
    const testDevices = [
      {
        name: "Smart Thermostat Pro",
        brand: "TechHome",
        catalog: "Climate Control",
        price: 149.99,
        stock: 25,
        description: "Advanced smart thermostat with energy saving features",
      },
      {
        name: "Smart Light Bulb",
        brand: "IoTech",
        catalog: "Lighting",
        price: 29.99,
        stock: 100,
        description: "RGB smart light bulb with app control",
      },
      {
        name: "Security Camera",
        brand: "SafeHome",
        catalog: "Security",
        price: 89.99,
        stock: 50,
        description: "Wireless security camera with motion detection",
      },
      {
        name: "Smart Door Lock",
        brand: "SafeHome",
        catalog: "Security",
        price: 199.99,
        stock: 30,
        description: "Keyless entry smart door lock with fingerprint scanner",
      },
      {
        name: "Smart Speaker",
        brand: "AudioTech",
        catalog: "Audio",
        price: 79.99,
        stock: 75,
        description: "Voice controlled smart speaker with premium sound",
      },
    ];

    // Clean up any existing test devices
    console.log("🧹 Cleaning up existing test devices...");
    for (const device of testDevices) {
      await Device.destroy({
        where: { name: device.name, brand: device.brand },
      });
    }

    // Create the test devices
    console.log("📝 Creating test devices...");
    await Promise.all(testDevices.map((device) => Device.create(device)));

    // 1. Test search by name
    console.log("\n🔍 Testing search by name...");

    // Search for "Smart" in name
    const smartResults = await Device.findAll({
      where: {
        name: {
          [Op.like]: "%Smart%",
        },
      },
    });

    console.log(`✅ "Smart" search returned ${smartResults.length} results`);

    if (smartResults.length < 4) {
      console.error(
        "❌ Test failed: Search by 'Smart' should return at least 4 devices!"
      );
      process.exit(1);
    }

    // Search for "Thermostat" in name
    const thermostatResults = await Device.findAll({
      where: {
        name: {
          [Op.like]: "%Thermostat%",
        },
      },
    });

    console.log(
      `✅ "Thermostat" search returned ${thermostatResults.length} results`
    );

    if (thermostatResults.length !== 1) {
      console.error(
        "❌ Test failed: Search by 'Thermostat' should return exactly 1 device!"
      );
      process.exit(1);
    }

    // 2. Test search by brand
    console.log("\n🔍 Testing search by brand...");

    // Search for "SafeHome" brand
    const safeHomeResults = await Device.findAll({
      where: {
        brand: "SafeHome",
      },
    });

    console.log(
      `✅ "SafeHome" brand search returned ${safeHomeResults.length} results`
    );

    if (safeHomeResults.length !== 2) {
      console.error(
        "❌ Test failed: Search by 'SafeHome' brand should return exactly 2 devices!"
      );
      process.exit(1);
    }

    // 3. Test search by catalog/type
    console.log("\n🔍 Testing search by catalog/type...");

    // Search for "Security" catalog
    const securityResults = await Device.findAll({
      where: {
        catalog: "Security",
      },
    });

    console.log(
      `✅ "Security" catalog search returned ${securityResults.length} results`
    );

    if (securityResults.length !== 2) {
      console.error(
        "❌ Test failed: Search by 'Security' catalog should return exactly 2 devices!"
      );
      process.exit(1);
    }

    // 4. Test combined search
    console.log("\n🔍 Testing combined search criteria...");

    // Search for "Smart" in name AND "SafeHome" brand
    const combinedResults = await Device.findAll({
      where: {
        name: {
          [Op.like]: "%Smart%",
        },
        brand: "SafeHome",
      },
    });

    console.log(
      `✅ Combined search returned ${combinedResults.length} results`
    );

    if (combinedResults.length !== 1) {
      console.error(
        "❌ Test failed: Combined search should return exactly 1 device!"
      );
      process.exit(1);
    }

    // 5. Test controller search function
    console.log("\n🔍 Testing actual controller search implementation...");

    // Import controller
    const deviceController = require("../controllers/deviceController");

    // Create mock request with search query
    const mockReq = {
      query: { search: "Smart" },
      session: {},
    };

    // Create mock response object
    const mockRes = {
      render: (view, data) => {
        console.log(
          `✅ Controller rendered ${view} with ${data.devices.length} devices`
        );
        if (data.devices.length < 4) {
          console.error(
            "❌ Test failed: Controller search should find at least 4 'Smart' devices!"
          );
          process.exit(1);
        }
      },
      status: (code) => {
        return {
          send: (message) => {
            console.error(`❌ Controller returned error: ${code} - ${message}`);
            process.exit(1);
          },
        };
      },
    };

    // Execute controller search
    await deviceController.getAllDevices(mockReq, mockRes);

    // Try catalog filter
    mockReq.query = { catalog: "Security" };
    mockRes.render = (view, data) => {
      console.log(
        `✅ Controller rendered ${view} with ${data.devices.length} devices for 'Security' catalog`
      );
      if (data.devices.length !== 2) {
        console.error(
          "❌ Test failed: Controller search should find exactly 2 'Security' devices!"
        );
        process.exit(1);
      }
    };

    await deviceController.getAllDevices(mockReq, mockRes);

    console.log("\n----------------------------------------");
    console.log("🎉 IoT Device Search Functionality test passed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
  } finally {
    // Clean up test devices
    console.log("\n🧹 Cleaning up test devices...");
    await Device.destroy({
      where: {
        [Op.or]: [
          { name: { [Op.like]: "%Smart Thermostat%" } },
          { name: { [Op.like]: "%Smart Light%" } },
          { name: { [Op.like]: "%Security Camera%" } },
          { name: { [Op.like]: "%Smart Door%" } },
          { name: { [Op.like]: "%Smart Speaker%" } },
        ],
      },
    });

    // Close database connection
    await sequelize.close();
  }
}

// Run the test
testDeviceSearch();
